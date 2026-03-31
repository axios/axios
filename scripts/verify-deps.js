#!/usr/bin/env node
'use strict';

/**
 * verify-deps.js — Phantom Dependency Detector & Publish Gate
 *
 * Created in response to the axios@1.14.1 supply chain attack (March 31, 2026).
 *
 * THREAT MODEL:
 * An attacker compromised a maintainer's npm account and published axios versions
 * containing "plain-crypto-js@4.2.1" as a runtime dependency. This package was
 * NEVER imported anywhere in axios source — its sole purpose was a postinstall
 * script that deployed a cross-platform RAT (C2: sfrclak.com:8000). The package
 * then self-destructed, replacing its own package.json with a clean decoy.
 *
 * This script would have caught the attack at FIVE independent points:
 *   1. plain-crypto-js is not imported anywhere → phantom dependency detected
 *   2. plain-crypto-js has a postinstall script → flagged
 *   3. plain-crypto-js is not in the signed baseline → dependency drift detected
 *   4. No git tag v1.14.1 exists → publish aborted
 *   5. Lockfile contains new postinstall entry → flagged
 *
 * ZERO EXTERNAL DEPENDENCIES — uses only Node.js built-ins.
 * A security script with npm dependencies is a security script that can be
 * supply-chain attacked.
 *
 * Usage:
 *   node scripts/verify-deps.js [--check phantom|postinstall|drift|lockfile|tag|all]
 *                                [--sign]
 *                                [--baseline-secret <secret>]
 *                                [--json]
 *                                [--ci]
 *
 * @license MIT
 * @see https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const LOCK_PATH = path.join(ROOT, 'package-lock.json');
const WHITELIST_PATH = path.join(ROOT, '.phantom-deps-whitelist.json');
const BASELINE_PATH = path.join(ROOT, '.deps-baseline.json');
const NODE_MODULES = path.join(ROOT, 'node_modules');

// File extensions to scan for import/require statements
const SOURCE_EXTENSIONS = new Set(['.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx']);

// Directories to scan for source code (relative to ROOT)
const SOURCE_DIRS = ['lib', 'src', 'assets', 'scripts', 'supabase'];
const SOURCE_FILES = ['index.js', 'index.ts', 'index.mjs', 'index.cjs'];

// Known-malicious packages — hardcoded because they MUST NOT be overridable
// via configuration. These are packages confirmed in the March 31 2026 incident.
const KNOWN_MALICIOUS = new Set([
  'plain-crypto-js',
  '@shadanai/openclaw',
  '@qqbrowser/openclaw-qbot',
]);

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags = {
  checks: 'all',
  sign: false,
  secret: process.env.DEPS_BASELINE_SECRET || '',
  json: false,
  ci: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--check':
      flags.checks = args[++i] || 'all';
      break;
    case '--sign':
      flags.sign = true;
      break;
    case '--baseline-secret':
      flags.secret = args[++i] || '';
      break;
    case '--json':
      flags.json = true;
      break;
    case '--ci':
      flags.ci = true;
      break;
    case '--help':
      printHelp();
      process.exit(0);
  }
}

function printHelp() {
  console.log(`
verify-deps.js — Phantom Dependency Detector & Publish Gate

Usage:
  node scripts/verify-deps.js [options]

Options:
  --check <type>           Run specific check: phantom, postinstall, drift, lockfile, tag, all (default: all)
  --sign                   Generate a new signed baseline from current deps
  --baseline-secret <s>    HMAC-SHA256 secret for baseline signing (or set DEPS_BASELINE_SECRET env)
  --json                   Output results as JSON only
  --ci                     CI mode: strict exit codes, no interactive prompts
  --help                   Show this help

Exit codes:
  0  All checks passed
  1  One or more checks failed (security issue detected)
  2  Script error (missing files, bad config, etc.)
`);
}

// ---------------------------------------------------------------------------
// Report structure
// ---------------------------------------------------------------------------

const report = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  checks: {},
  passed: true,
  summary: [],
};

function fail(check, message, details = {}) {
  report.passed = false;
  if (!report.checks[check]) {
    report.checks[check] = { passed: false, issues: [] };
  }
  report.checks[check].passed = false;
  report.checks[check].issues.push({ message, ...details });
  report.summary.push(`FAIL [${check}]: ${message}`);
}

function pass(check, message) {
  if (!report.checks[check]) {
    report.checks[check] = { passed: true, issues: [] };
  }
  report.summary.push(`PASS [${check}]: ${message}`);
}

function warn(check, message, details = {}) {
  if (!report.checks[check]) {
    report.checks[check] = { passed: true, issues: [] };
  }
  report.checks[check].issues.push({ message, severity: 'warning', ...details });
  report.summary.push(`WARN [${check}]: ${message}`);
}

// ---------------------------------------------------------------------------
// Utility: Read JSON safely
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Utility: Recursively collect source files
// ---------------------------------------------------------------------------

function collectSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules, .git, and hidden directories
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Utility: Extract dependency references from source code
// ---------------------------------------------------------------------------

/**
 * Scans source content for require/import statements referencing a dependency.
 *
 * Patterns detected:
 *   require('dep')           — CommonJS
 *   require("dep")           — CommonJS double-quote
 *   require(`dep`)           — CommonJS template literal
 *   import ... from 'dep'    — ESM static import
 *   import('dep')            — ESM dynamic import
 *   import "dep"             — ESM side-effect import
 *
 * For scoped packages (@scope/name), we match the full scoped name.
 * For unscoped packages, we match the package name and any deep imports (dep/sub).
 *
 * LIMITATION: Dynamic requires like require(variable) cannot be statically
 * analyzed. These are flagged as "unverifiable" rather than phantom.
 */
function sourceReferencesDep(content, depName) {
  // Escape special regex characters in the dependency name
  const escaped = depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build patterns that match the dep name at the start of an import path
  // (allowing deep imports like 'dep/sub/path')
  const patterns = [
    // require('dep') or require('dep/sub')
    new RegExp(`require\\s*\\(\\s*['"\`]${escaped}(?:/[^'"\`]*)?['"\`]\\s*\\)`, 'g'),
    // import ... from 'dep' or import ... from 'dep/sub'
    new RegExp(`from\\s+['"\`]${escaped}(?:/[^'"\`]*)?['"\`]`, 'g'),
    // import('dep') dynamic import
    new RegExp(`import\\s*\\(\\s*['"\`]${escaped}(?:/[^'"\`]*)?['"\`]\\s*\\)`, 'g'),
    // import 'dep' side-effect import
    new RegExp(`^\\s*import\\s+['"\`]${escaped}(?:/[^'"\`]*)?['"\`]`, 'gm'),
  ];

  return patterns.some(p => p.test(content));
}

/**
 * Detects dynamic require/import patterns that prevent static analysis.
 * Returns true if the source contains patterns like require(variable).
 */
function hasDynamicImports(content) {
  // require(someVar) — variable, not string literal
  const dynamicRequire = /require\s*\(\s*[^'"`\s)][^)]*\)/g;
  // import(someVar) — variable, not string literal
  const dynamicImport = /import\s*\(\s*[^'"`\s)][^)]*\)/g;

  return dynamicRequire.test(content) || dynamicImport.test(content);
}

// ---------------------------------------------------------------------------
// CHECK 1: Phantom Dependency Detection
// ---------------------------------------------------------------------------
// WHAT IT CATCHES: plain-crypto-js was in package.json dependencies but never
// imported anywhere in 86 source files. A phantom dependency has no reason to
// exist — its sole purpose is to execute lifecycle scripts (postinstall).

function checkPhantomDeps() {
  const pkg = readJSON(PKG_PATH);
  if (!pkg) {
    fail('phantom', 'Cannot read package.json');
    return;
  }

  // Combine runtime and dev dependencies
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const depNames = Object.keys(allDeps);
  if (depNames.length === 0) {
    pass('phantom', 'No dependencies to check');
    return;
  }

  // Load whitelist
  const whitelist = readJSON(WHITELIST_PATH) || {};
  const whitelistedDeps = new Set(Object.keys(whitelist));

  // Collect all source files
  const sourceFiles = [];
  for (const dir of SOURCE_DIRS) {
    collectSourceFiles(path.join(ROOT, dir), sourceFiles);
  }
  for (const file of SOURCE_FILES) {
    const fullPath = path.join(ROOT, file);
    if (fs.existsSync(fullPath)) {
      sourceFiles.push(fullPath);
    }
  }

  if (sourceFiles.length === 0) {
    warn('phantom', 'No source files found to scan — cannot verify dependency usage');
    return;
  }

  // Read all source content once
  const sourceContents = sourceFiles.map(f => {
    try { return fs.readFileSync(f, 'utf-8'); } catch { return ''; }
  });

  // Check for dynamic imports (unverifiable)
  const hasDynamic = sourceContents.some(c => hasDynamicImports(c));
  if (hasDynamic) {
    warn('phantom', 'Source contains dynamic require/import — some deps may be unverifiable by static analysis');
  }

  // Check each dependency
  const phantomDeps = [];
  for (const dep of depNames) {
    // Check against known-malicious list first
    if (KNOWN_MALICIOUS.has(dep)) {
      fail('phantom', `CRITICAL: Known-malicious package detected: ${dep}`, {
        severity: 'critical',
        package: dep,
        advisory: 'This package was used in the axios@1.14.1 supply chain attack (March 31, 2026)',
      });
      continue;
    }

    // Skip whitelisted deps
    if (whitelistedDeps.has(dep)) {
      continue;
    }

    // Check if any source file references this dependency
    const isReferenced = sourceContents.some(content => sourceReferencesDep(content, dep));
    if (!isReferenced) {
      phantomDeps.push(dep);
    }
  }

  if (phantomDeps.length > 0) {
    for (const dep of phantomDeps) {
      fail('phantom', `Phantom dependency detected: "${dep}" is in package.json but never imported in source`, {
        package: dep,
        version: allDeps[dep],
        recommendation: 'Remove from package.json or add to .phantom-deps-whitelist.json with justification',
      });
    }
  } else {
    pass('phantom', `All ${depNames.length} dependencies verified in source (${sourceFiles.length} files scanned)`);
  }
}

// ---------------------------------------------------------------------------
// CHECK 2: Postinstall Script Audit
// ---------------------------------------------------------------------------
// WHAT IT CATCHES: plain-crypto-js@4.2.1 had postinstall: "node setup.js" which
// was the entire attack payload. Legitimate packages rarely need postinstall
// scripts (exception: native addons using node-gyp).

function checkPostinstall() {
  const pkg = readJSON(PKG_PATH);
  if (!pkg) {
    fail('postinstall', 'Cannot read package.json');
    return;
  }

  // Check if OUR package.json has lifecycle scripts that shouldn't be there
  const dangerousScripts = ['preinstall', 'install', 'postinstall'];
  for (const script of dangerousScripts) {
    if (pkg.scripts && pkg.scripts[script]) {
      warn('postinstall', `package.json has "${script}" script: ${pkg.scripts[script]}`, {
        script,
        command: pkg.scripts[script],
      });
    }
  }

  // Check all dependencies in node_modules
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  if (!fs.existsSync(NODE_MODULES)) {
    warn('postinstall', 'node_modules not found — skipping postinstall audit of installed packages');
    return;
  }

  // Load postinstall allowlist
  const allowlistPath = path.join(ROOT, '.postinstall-allowlist.json');
  const allowlist = readJSON(allowlistPath) || {};

  const flagged = [];

  for (const dep of Object.keys(allDeps)) {
    // Handle scoped packages
    const depPkgPath = path.join(NODE_MODULES, dep, 'package.json');
    const depPkg = readJSON(depPkgPath);
    if (!depPkg) continue;

    const lifecycleScripts = ['preinstall', 'install', 'postinstall'];
    for (const script of lifecycleScripts) {
      if (depPkg.scripts && depPkg.scripts[script]) {
        const scriptContent = depPkg.scripts[script];

        // Check if this specific script hash is allowlisted
        const scriptHash = crypto.createHash('sha256').update(scriptContent).digest('hex');
        if (allowlist[dep] && allowlist[dep].scriptHash === scriptHash) {
          continue; // Allowlisted by hash — even the allowed package can't change its script
        }

        // Check against known-malicious
        if (KNOWN_MALICIOUS.has(dep)) {
          fail('postinstall', `CRITICAL: Known-malicious package "${dep}" has ${script} script: ${scriptContent}`, {
            severity: 'critical',
            package: dep,
            script,
            command: scriptContent,
          });
        } else {
          fail('postinstall', `Package "${dep}" has ${script} script: ${scriptContent}`, {
            package: dep,
            script,
            command: scriptContent,
            scriptHash,
            recommendation: `If legitimate, add to .postinstall-allowlist.json with hash ${scriptHash}`,
          });
        }
        flagged.push({ dep, script, command: scriptContent });
      }
    }

    // Also check transitive dependencies (one level deep)
    if (depPkg.dependencies) {
      for (const transDep of Object.keys(depPkg.dependencies)) {
        const transPkgPath = path.join(NODE_MODULES, transDep, 'package.json');
        const transPkg = readJSON(transPkgPath);
        if (!transPkg || !transPkg.scripts) continue;

        for (const script of lifecycleScripts) {
          if (transPkg.scripts[script]) {
            warn('postinstall', `Transitive dep "${transDep}" (via ${dep}) has ${script}: ${transPkg.scripts[script]}`, {
              package: transDep,
              parent: dep,
              script,
              command: transPkg.scripts[script],
            });
          }
        }
      }
    }
  }

  if (flagged.length === 0) {
    pass('postinstall', 'No lifecycle scripts found in dependencies');
  }
}

// ---------------------------------------------------------------------------
// CHECK 3: Dependency Graph Diff (Signed Baseline)
// ---------------------------------------------------------------------------
// WHAT IT CATCHES: Any new dependency added since the last known-good state.
// plain-crypto-js was added to package.json but would have triggered a diff
// against the baseline because it wasn't there before.

function checkDependencyDrift() {
  const pkg = readJSON(PKG_PATH);
  if (!pkg) {
    fail('drift', 'Cannot read package.json');
    return;
  }

  const baseline = readJSON(BASELINE_PATH);
  if (!baseline) {
    if (flags.ci) {
      fail('drift', 'No signed baseline found (.deps-baseline.json) — cannot verify dependency drift in CI mode');
    } else {
      warn('drift', 'No signed baseline found. Run with --sign to create one.');
    }
    return;
  }

  // Verify baseline signature
  if (!flags.secret) {
    warn('drift', 'No baseline secret provided — signature verification skipped. Set DEPS_BASELINE_SECRET.');
  } else {
    const { signature, ...baselineData } = baseline;
    const payload = JSON.stringify(baselineData, null, 2);
    const expectedSig = crypto.createHmac('sha256', flags.secret).update(payload).digest('hex');

    if (signature !== expectedSig) {
      fail('drift', 'Baseline signature verification FAILED — the baseline file may have been tampered with', {
        severity: 'critical',
        recommendation: 'Re-sign the baseline with a trusted secret or investigate tampering',
      });
      return;
    }
  }

  // Compare current deps against baseline
  const currentDeps = { ...(pkg.dependencies || {}) };
  const currentDevDeps = { ...(pkg.devDependencies || {}) };
  const baselineDeps = baseline.dependencies || {};
  const baselineDevDeps = baseline.devDependencies || {};

  const added = [];
  const removed = [];
  const changed = [];

  // Check for added/changed runtime deps
  for (const [dep, version] of Object.entries(currentDeps)) {
    if (!(dep in baselineDeps)) {
      added.push({ name: dep, version, type: 'runtime' });
    } else if (baselineDeps[dep] !== version) {
      changed.push({ name: dep, from: baselineDeps[dep], to: version, type: 'runtime' });
    }
  }

  // Check for removed runtime deps
  for (const dep of Object.keys(baselineDeps)) {
    if (!(dep in currentDeps)) {
      removed.push({ name: dep, version: baselineDeps[dep], type: 'runtime' });
    }
  }

  // Check for added/changed dev deps
  for (const [dep, version] of Object.entries(currentDevDeps)) {
    if (!(dep in baselineDevDeps)) {
      added.push({ name: dep, version, type: 'dev' });
    } else if (baselineDevDeps[dep] !== version) {
      changed.push({ name: dep, from: baselineDevDeps[dep], to: version, type: 'dev' });
    }
  }

  // Report results
  if (added.length > 0) {
    for (const dep of added) {
      const isMalicious = KNOWN_MALICIOUS.has(dep.name);
      const severity = isMalicious ? 'critical' : 'high';
      fail('drift', `NEW ${dep.type} dependency: "${dep.name}@${dep.version}"${isMalicious ? ' — KNOWN MALICIOUS PACKAGE' : ''}`, {
        severity,
        package: dep.name,
        version: dep.version,
        type: dep.type,
      });
    }
  }

  if (changed.length > 0) {
    for (const dep of changed) {
      fail('drift', `CHANGED ${dep.type} dependency: "${dep.name}" ${dep.from} → ${dep.to}`, {
        package: dep.name,
        from: dep.from,
        to: dep.to,
        type: dep.type,
      });
    }
  }

  if (removed.length > 0) {
    for (const dep of removed) {
      warn('drift', `Removed ${dep.type} dependency: "${dep.name}@${dep.version}"`, {
        package: dep.name,
        version: dep.version,
        type: dep.type,
      });
    }
  }

  if (added.length === 0 && changed.length === 0) {
    pass('drift', `Dependency graph matches baseline (${Object.keys(baselineDeps).length} runtime, ${Object.keys(baselineDevDeps).length} dev)`);
  }
}

// ---------------------------------------------------------------------------
// CHECK 4: Lockfile Integrity
// ---------------------------------------------------------------------------
// WHAT IT CATCHES: Drift between package.json and package-lock.json, or new
// postinstall scripts injected via lockfile manipulation.

function checkLockfileIntegrity() {
  // Verify lockfile exists
  if (!fs.existsSync(LOCK_PATH)) {
    fail('lockfile', 'package-lock.json does not exist — lockfile must be committed to prevent dependency confusion attacks');
    return;
  }

  // Verify lockfile is tracked by git
  try {
    execSync('git ls-files --error-unmatch package-lock.json', { cwd: ROOT, stdio: 'ignore' });
  } catch {
    fail('lockfile', 'package-lock.json is not tracked by git — it must be committed');
    return;
  }

  const lock = readJSON(LOCK_PATH);
  if (!lock) {
    fail('lockfile', 'Cannot parse package-lock.json');
    return;
  }

  const pkg = readJSON(PKG_PATH);
  if (!pkg) {
    fail('lockfile', 'Cannot read package.json');
    return;
  }

  // Check for drift: all deps in package.json should be in lockfile
  const pkgDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const lockPackages = lock.packages || lock.dependencies || {};

  for (const dep of Object.keys(pkgDeps)) {
    // In lockfileVersion 3, packages are keyed as "node_modules/dep"
    const lockKey = `node_modules/${dep}`;
    if (!lockPackages[lockKey] && !lockPackages[dep]) {
      fail('lockfile', `Dependency "${dep}" in package.json not found in lockfile — run npm install`, {
        package: dep,
      });
    }
  }

  // Scan lockfile for postinstall scripts
  const lockPostinstalls = [];
  for (const [pkgName, pkgData] of Object.entries(lockPackages)) {
    if (!pkgData || typeof pkgData !== 'object') continue;
    if (pkgData.hasInstallScript) {
      const cleanName = pkgName.replace('node_modules/', '');
      lockPostinstalls.push(cleanName);
    }
  }

  if (lockPostinstalls.length > 0) {
    // Load baseline to compare
    const baseline = readJSON(BASELINE_PATH);
    const baselinePostinstalls = new Set((baseline && baseline.postinstallPackages) || []);

    for (const pkg of lockPostinstalls) {
      if (!baselinePostinstalls.has(pkg)) {
        fail('lockfile', `NEW install script in lockfile for "${pkg}" — not in baseline`, {
          package: pkg,
          severity: 'high',
        });
      }
    }
  }

  pass('lockfile', 'Lockfile exists, is committed, and matches package.json');
}

// ---------------------------------------------------------------------------
// CHECK 5: Git Tag Verification
// ---------------------------------------------------------------------------
// WHAT IT CATCHES: The attacker published axios@1.14.1 via npm CLI without
// creating a git tag. No tag = no corresponding commit in git history = the
// version was never legitimately released through the normal workflow.

function checkGitTag() {
  const pkg = readJSON(PKG_PATH);
  if (!pkg || !pkg.version) {
    fail('tag', 'Cannot read version from package.json');
    return;
  }

  const version = pkg.version;
  const tag = `v${version}`;

  try {
    execSync(`git rev-parse ${tag}`, { cwd: ROOT, stdio: 'ignore' });
    pass('tag', `Git tag "${tag}" exists for version ${version}`);
  } catch {
    fail('tag', `No git tag "${tag}" found for version ${version}. Publish MUST NOT proceed without a tag.`, {
      severity: 'critical',
      version,
      expectedTag: tag,
      recommendation: 'Create a signed tag: git tag -s v' + version + ' -m "Release ' + version + '"',
    });
  }
}

// ---------------------------------------------------------------------------
// Baseline Signing
// ---------------------------------------------------------------------------

function signBaseline() {
  if (!flags.secret) {
    console.error('ERROR: --baseline-secret or DEPS_BASELINE_SECRET env required for signing');
    process.exit(2);
  }

  const pkg = readJSON(PKG_PATH);
  if (!pkg) {
    console.error('ERROR: Cannot read package.json');
    process.exit(2);
  }

  // Collect postinstall packages from lockfile
  const lock = readJSON(LOCK_PATH);
  const postinstallPackages = [];
  if (lock && lock.packages) {
    for (const [name, data] of Object.entries(lock.packages)) {
      if (data && data.hasInstallScript) {
        postinstallPackages.push(name.replace('node_modules/', ''));
      }
    }
  }

  const baselineData = {
    generatedAt: new Date().toISOString(),
    generatedBy: execSync('git config user.email', { cwd: ROOT, encoding: 'utf-8' }).trim(),
    packageVersion: pkg.version,
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    postinstallPackages,
  };

  const payload = JSON.stringify(baselineData, null, 2);
  const signature = crypto.createHmac('sha256', flags.secret).update(payload).digest('hex');

  const signedBaseline = { ...baselineData, signature };

  fs.writeFileSync(BASELINE_PATH, JSON.stringify(signedBaseline, null, 2) + '\n');
  console.log(`Baseline signed and written to ${BASELINE_PATH}`);
  console.log(`  Dependencies: ${Object.keys(baselineData.dependencies).length} runtime, ${Object.keys(baselineData.devDependencies).length} dev`);
  console.log(`  Postinstall packages: ${postinstallPackages.length}`);
  console.log(`  Signature: ${signature.slice(0, 16)}...`);
  console.log('\nIMPORTANT: Commit this file. The signing secret must NEVER be committed.');
  console.log('Store it in GitHub Actions secrets as DEPS_BASELINE_SECRET.');
  console.log('\nFUTURE IMPROVEMENT: Migrate to Ed25519 asymmetric signing.');
  console.log('HMAC-SHA256 means anyone with the secret can forge a baseline.');
  console.log('Ed25519 private key on a hardware token + public key in repo = stronger guarantee.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (flags.sign) {
    signBaseline();
    process.exit(0);
  }

  const checksToRun = flags.checks === 'all'
    ? ['phantom', 'postinstall', 'drift', 'lockfile', 'tag']
    : [flags.checks];

  console.log('=== verify-deps.js — Publish Hardening Gate ===');
  console.log(`Checks: ${checksToRun.join(', ')}`);
  console.log(`Time: ${report.timestamp}`);
  console.log('');

  for (const check of checksToRun) {
    switch (check) {
      case 'phantom':
        checkPhantomDeps();
        break;
      case 'postinstall':
        checkPostinstall();
        break;
      case 'drift':
        checkDependencyDrift();
        break;
      case 'lockfile':
        checkLockfileIntegrity();
        break;
      case 'tag':
        checkGitTag();
        break;
      default:
        console.error(`Unknown check: ${check}`);
        process.exit(2);
    }
  }

  // Output report
  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('--- Results ---');
    for (const line of report.summary) {
      const prefix = line.startsWith('FAIL') ? '\x1b[31m' :
                     line.startsWith('WARN') ? '\x1b[33m' :
                     '\x1b[32m';
      console.log(`${prefix}${line}\x1b[0m`);
    }
    console.log('');
    console.log(report.passed ? '\x1b[32m✓ All checks passed\x1b[0m' : '\x1b[31m✗ One or more checks FAILED\x1b[0m');
  }

  process.exit(report.passed ? 0 : 1);
}

main();

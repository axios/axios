#!/usr/bin/env node
'use strict';

/**
 * audit-postinstall.js — Standalone Postinstall Scanner
 *
 * Scans node_modules for packages with lifecycle scripts (postinstall, install,
 * preinstall) that could execute arbitrary code during `npm install`.
 *
 * THREAT MODEL:
 * The axios@1.14.1 attack used a phantom dependency (plain-crypto-js@4.2.1)
 * whose ONLY purpose was a postinstall script: "node setup.js". This script
 * deployed a cross-platform RAT, contacted C2 at sfrclak.com:8000, then
 * self-destructed — replacing its own package.json with a clean decoy.
 *
 * This scanner would have caught it because:
 *   1. plain-crypto-js has a postinstall script → flagged
 *   2. plain-crypto-js is in the known-malicious list → CRITICAL alert
 *   3. The postinstall hash wouldn't match any baseline → NEW script detected
 *
 * DESIGN DECISIONS:
 *   - Allowlist by script HASH, not package name. This means even an allowed
 *     package can't change its postinstall without re-approval. If node-gyp
 *     is allowlisted with hash X, and an attacker replaces the script content,
 *     the new hash won't match → detection.
 *   - Known-malicious list is HARDCODED, not configurable. An attacker who
 *     can modify config files could remove their package from a config-based
 *     blocklist. Hardcoded = requires a code review to change.
 *
 * ZERO EXTERNAL DEPENDENCIES — uses only Node.js built-ins.
 *
 * Usage:
 *   node audit-postinstall.js [options]
 *
 * Options:
 *   --dir <path>              node_modules directory to scan (default: ./node_modules)
 *   --allowlist <path>        Path to allowlist JSON (default: ./.postinstall-allowlist.json)
 *   --baseline <path>         Path to baseline JSON (default: ./.postinstall-baseline.json)
 *   --update-baseline         Update baseline with current state (first run)
 *   --json                    Output JSON only
 *   --strict                  Exit 1 on any lifecycle script (even allowlisted)
 *
 * Exit codes:
 *   0  No HIGH risk findings
 *   1  HIGH risk findings detected (new/changed/malicious postinstall)
 *   2  Script error
 *
 * @license MIT
 * @see https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// ---------------------------------------------------------------------------
// Known-malicious packages — HARDCODED, not configurable
// ---------------------------------------------------------------------------
// These packages were confirmed in the March 31, 2026 axios supply chain attack
// and the coordinated campaign via @shadanai/openclaw and @qqbrowser/openclaw-qbot.
// Adding to this list requires a code review and commit — by design.

const KNOWN_MALICIOUS = new Set([
  'plain-crypto-js',
  '@shadanai/openclaw',
  '@qqbrowser/openclaw-qbot',
]);

// Suspicious patterns in postinstall script content
const SUSPICIOUS_PATTERNS = [
  { pattern: /curl\s+/i, reason: 'Downloads content via curl' },
  { pattern: /wget\s+/i, reason: 'Downloads content via wget' },
  { pattern: /powershell/i, reason: 'Invokes PowerShell' },
  { pattern: /\beval\b/i, reason: 'Uses eval — potential code injection' },
  { pattern: /base64/i, reason: 'References base64 encoding — potential obfuscation' },
  { pattern: /\bexec\b/i, reason: 'Executes shell command' },
  { pattern: /\bchild_process\b/i, reason: 'Spawns child process' },
  { pattern: /\bnet\.connect\b/i, reason: 'Makes network connection' },
  { pattern: /\bhttp\.request\b/i, reason: 'Makes HTTP request' },
  { pattern: /\bhttps\.request\b/i, reason: 'Makes HTTPS request' },
  { pattern: /\bfs\.writeFile/i, reason: 'Writes to filesystem' },
  { pattern: /\/tmp\//i, reason: 'Writes to /tmp directory' },
  { pattern: /%PROGRAMDATA%/i, reason: 'References Windows ProgramData' },
  { pattern: /\/Library\/Caches/i, reason: 'References macOS Library/Caches' },
  { pattern: /\.exe\b/i, reason: 'References executable file' },
  { pattern: /osascript/i, reason: 'Invokes macOS AppleScript' },
  { pattern: /wscript/i, reason: 'Invokes Windows Script Host' },
  { pattern: /cscript/i, reason: 'Invokes Windows Script Host' },
];

// ---------------------------------------------------------------------------
// Lifecycle scripts that can execute code on install
// ---------------------------------------------------------------------------

const LIFECYCLE_SCRIPTS = ['preinstall', 'install', 'postinstall'];

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const config = {
  dir: path.resolve('node_modules'),
  allowlistPath: path.resolve('.postinstall-allowlist.json'),
  baselinePath: path.resolve('.postinstall-baseline.json'),
  updateBaseline: false,
  json: false,
  strict: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--dir':
      config.dir = path.resolve(args[++i]);
      break;
    case '--allowlist':
      config.allowlistPath = path.resolve(args[++i]);
      break;
    case '--baseline':
      config.baselinePath = path.resolve(args[++i]);
      break;
    case '--update-baseline':
      config.updateBaseline = true;
      break;
    case '--json':
      config.json = true;
      break;
    case '--strict':
      config.strict = true;
      break;
    case '--help':
      console.log(`
audit-postinstall.js — Standalone Postinstall Scanner

Usage:
  node audit-postinstall.js [options]

Options:
  --dir <path>          node_modules directory (default: ./node_modules)
  --allowlist <path>    Allowlist file (default: ./.postinstall-allowlist.json)
  --baseline <path>     Baseline file (default: ./.postinstall-baseline.json)
  --update-baseline     Save current state as baseline
  --json                JSON output only
  --strict              Exit 1 on ANY lifecycle script

Exit codes:
  0  Clean
  1  HIGH risk findings
  2  Script error
`);
      process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Read the actual script file content if the postinstall command references
 * a local file (e.g., "node setup.js"). Returns the file content or null.
 */
function readScriptFile(pkgDir, command) {
  // Common patterns: "node setup.js", "node scripts/install.js", "./install.sh"
  const match = command.match(/(?:node\s+)?([^\s&|;]+\.(?:js|sh|py|ts|mjs))/i);
  if (!match) return null;

  const scriptPath = path.join(pkgDir, match[1]);
  try {
    return fs.readFileSync(scriptPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Enumerate all packages in node_modules, including scoped packages.
 * Returns array of { name, dir, pkg } objects.
 */
function enumeratePackages(nodeModulesDir) {
  const packages = [];

  if (!fs.existsSync(nodeModulesDir)) return packages;

  let entries;
  try {
    entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
  } catch {
    return packages;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.package-lock.json') continue;

    if (entry.name.startsWith('@')) {
      // Scoped package — enumerate children
      const scopeDir = path.join(nodeModulesDir, entry.name);
      try {
        const scopeEntries = fs.readdirSync(scopeDir, { withFileTypes: true });
        for (const scopeEntry of scopeEntries) {
          if (!scopeEntry.isDirectory()) continue;
          const pkgDir = path.join(scopeDir, scopeEntry.name);
          const pkgJson = readJSON(path.join(pkgDir, 'package.json'));
          if (pkgJson) {
            packages.push({
              name: `${entry.name}/${scopeEntry.name}`,
              dir: pkgDir,
              pkg: pkgJson,
            });
          }
        }
      } catch { /* skip unreadable scope dirs */ }
    } else if (entry.name !== '.bin' && entry.name !== '.cache') {
      const pkgDir = path.join(nodeModulesDir, entry.name);
      const pkgJson = readJSON(path.join(pkgDir, 'package.json'));
      if (pkgJson) {
        packages.push({
          name: entry.name,
          dir: pkgDir,
          pkg: pkgJson,
        });
      }
    }
  }

  return packages;
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

function scan() {
  const report = {
    timestamp: new Date().toISOString(),
    scannedDir: config.dir,
    totalPackages: 0,
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  };

  // Load allowlist and baseline
  const allowlist = readJSON(config.allowlistPath) || {};
  const baseline = readJSON(config.baselinePath) || {};

  // Enumerate packages
  const packages = enumeratePackages(config.dir);
  report.totalPackages = packages.length;

  // Current state for baseline comparison/update
  const currentState = {};

  for (const { name, dir, pkg } of packages) {
    if (!pkg.scripts) continue;

    for (const script of LIFECYCLE_SCRIPTS) {
      if (!pkg.scripts[script]) continue;

      const command = pkg.scripts[script];
      const commandHash = hashContent(command);

      // Read actual script file content if referenced
      const scriptContent = readScriptFile(dir, command);
      const contentHash = scriptContent ? hashContent(scriptContent) : null;

      // Store in current state
      const stateKey = `${name}:${script}`;
      currentState[stateKey] = {
        command,
        commandHash,
        contentHash,
        version: pkg.version,
      };

      // Determine severity
      let severity = 'info';
      let reasons = [];

      // CHECK 1: Known-malicious package
      if (KNOWN_MALICIOUS.has(name)) {
        severity = 'critical';
        reasons.push('Package is in the known-malicious list (axios@1.14.1 supply chain attack)');
      }

      // CHECK 2: New script not in baseline
      if (baseline[stateKey] === undefined) {
        if (severity !== 'critical') severity = 'high';
        reasons.push('NEW lifecycle script — not in previous baseline');
      }

      // CHECK 3: Changed script since baseline
      if (baseline[stateKey] && baseline[stateKey].commandHash !== commandHash) {
        if (severity !== 'critical') severity = 'high';
        reasons.push(`Script CHANGED since baseline (was: ${baseline[stateKey].command})`);
      }

      // CHECK 4: Script file content changed
      if (contentHash && baseline[stateKey] && baseline[stateKey].contentHash &&
          baseline[stateKey].contentHash !== contentHash) {
        if (severity !== 'critical') severity = 'high';
        reasons.push('Referenced script file content changed since baseline');
      }

      // CHECK 5: Suspicious patterns in command or script content
      const textToScan = command + (scriptContent || '');
      for (const { pattern, reason } of SUSPICIOUS_PATTERNS) {
        if (pattern.test(textToScan)) {
          if (severity === 'info') severity = 'medium';
          reasons.push(`Suspicious: ${reason}`);
        }
      }

      // CHECK 6: Allowlist verification (by hash, not name)
      const isAllowlisted = allowlist[name] &&
        allowlist[name].scriptHash === commandHash &&
        (!contentHash || !allowlist[name].contentHash || allowlist[name].contentHash === contentHash);

      if (isAllowlisted && severity !== 'critical') {
        severity = 'info';
        reasons = [`Allowlisted: ${allowlist[name].reason || 'no reason given'}`];
      }

      if (reasons.length === 0) {
        reasons.push('Lifecycle script present (review recommended)');
      }

      const finding = {
        package: name,
        version: pkg.version,
        script,
        command,
        commandHash,
        contentHash,
        severity,
        reasons,
        allowlisted: isAllowlisted,
      };

      // Include script content preview for high/critical
      if ((severity === 'critical' || severity === 'high') && scriptContent) {
        finding.scriptPreview = scriptContent.slice(0, 500) +
          (scriptContent.length > 500 ? '\n... (truncated)' : '');
      }

      report.findings.push(finding);
      report.summary[severity]++;
    }
  }

  // Update baseline if requested
  if (config.updateBaseline) {
    fs.writeFileSync(config.baselinePath, JSON.stringify(currentState, null, 2) + '\n');
    if (!config.json) {
      console.log(`Baseline updated: ${config.baselinePath}`);
      console.log(`  ${Object.keys(currentState).length} lifecycle scripts recorded`);
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function printReport(report) {
  if (config.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== audit-postinstall.js — Lifecycle Script Scanner ===');
  console.log(`Scanned: ${config.dir}`);
  console.log(`Packages: ${report.totalPackages}`);
  console.log(`Time: ${report.timestamp}`);
  console.log('');

  if (report.findings.length === 0) {
    console.log('\x1b[32m✓ No lifecycle scripts found in any package\x1b[0m');
    return;
  }

  // Group by severity
  const bySeverity = { critical: [], high: [], medium: [], low: [], info: [] };
  for (const f of report.findings) {
    bySeverity[f.severity].push(f);
  }

  const severityColors = {
    critical: '\x1b[41m\x1b[37m',
    high: '\x1b[31m',
    medium: '\x1b[33m',
    low: '\x1b[36m',
    info: '\x1b[37m',
  };

  for (const level of ['critical', 'high', 'medium', 'low', 'info']) {
    if (bySeverity[level].length === 0) continue;

    console.log(`\n${severityColors[level]}--- ${level.toUpperCase()} (${bySeverity[level].length}) ---\x1b[0m`);

    for (const f of bySeverity[level]) {
      console.log(`  ${severityColors[level]}${f.package}@${f.version}\x1b[0m`);
      console.log(`    ${f.script}: ${f.command}`);
      console.log(`    Hash: ${f.commandHash.slice(0, 16)}...`);
      for (const reason of f.reasons) {
        console.log(`    → ${reason}`);
      }
      if (f.scriptPreview) {
        console.log(`    --- Script preview ---`);
        console.log(`    ${f.scriptPreview.split('\n').join('\n    ')}`);
        console.log(`    --- End preview ---`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('--- Summary ---');
  console.log(`  Critical: ${report.summary.critical}`);
  console.log(`  High:     ${report.summary.high}`);
  console.log(`  Medium:   ${report.summary.medium}`);
  console.log(`  Low:      ${report.summary.low}`);
  console.log(`  Info:     ${report.summary.info}`);

  if (report.summary.critical > 0 || report.summary.high > 0) {
    console.log('\n\x1b[31m✗ HIGH/CRITICAL risk findings detected — review required before proceeding\x1b[0m');
  } else {
    console.log('\n\x1b[32m✓ No high-risk findings\x1b[0m');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(config.dir)) {
    if (!config.json) {
      console.error(`ERROR: Directory not found: ${config.dir}`);
      console.error('Run npm install first, or specify --dir <path>');
    }
    process.exit(2);
  }

  const report = scan();
  printReport(report);

  const hasHighRisk = report.summary.critical > 0 || report.summary.high > 0;
  const hasAnyScripts = report.findings.length > 0;

  if (hasHighRisk) {
    process.exit(1);
  } else if (config.strict && hasAnyScripts) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();

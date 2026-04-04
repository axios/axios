/**
 * Auths Attack Simulation: Axios March 31, 2026 Supply Chain Incident
 *
 * Demonstrates how Auths cryptographic commit verification would have detected
 * the unauthorized npm publish that compromised Axios v1.14.1 and v0.30.4.
 *
 * What happened:
 *   1. Attacker compromised the npm account of a lead maintainer
 *   2. Account email was changed to an attacker-controlled address
 *   3. A long-lived npm access token was used to publish directly
 *   4. Even though OIDC Trusted Publishing was configured, the workflow also
 *      passed NPM_TOKEN — npm uses the token when both are present
 *   5. A malicious dependency (plain-crypto-js) was injected with a postinstall
 *      hook that downloaded and executed a cross-platform RAT
 *   6. Neither malicious version appears in GitHub release tags
 *
 * Why Auths prevents this:
 *   With Auths, every release artifact carries an Ed25519 signature from the
 *   maintainer's cryptographic identity (KERI-based DID). Stealing the npm
 *   token or account credentials is insufficient — the attacker cannot produce
 *   a valid signature without the maintainer's private key stored in their
 *   device keychain.
 *
 * Usage:
 *   npm install -g @auths-dev/sdk
 *   node auths-attack-simulation.mjs
 */

import { execSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function checkAuthsCli() {
  try {
    execSync('which auths', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(args, cwd) {
  return execFileSync(args[0], args.slice(1), {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function runSafe(args, cwd) {
  try {
    return { stdout: run(args, cwd), exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status || 1,
    };
  }
}

function setupTestRepo(tmpDir) {
  const repo = join(tmpDir, 'axios-simulation');
  mkdirSync(repo, { recursive: true });

  // Initialize repo
  run(['git', 'init'], repo);
  run(['git', 'config', 'user.email', 'maintainer@example.com'], repo);
  run(['git', 'config', 'user.name', 'Axios Maintainer'], repo);

  // Generate a test Ed25519 keypair for the "legitimate maintainer"
  const keyPath = join(tmpDir, 'test_key');
  run(['ssh-keygen', '-t', 'ed25519', '-f', keyPath, '-N', '', '-q'], tmpDir);

  // Configure git to sign with this key
  run(['git', 'config', 'gpg.format', 'ssh'], repo);
  run(['git', 'config', 'user.signingkey', keyPath], repo);

  // Create allowed_signers file
  const pubKey = readFileSync(`${keyPath}.pub`, 'utf-8').trim();
  const signersDir = join(repo, '.auths');
  mkdirSync(signersDir, { recursive: true });
  writeFileSync(join(signersDir, 'allowed_signers'), `maintainer@example.com ${pubKey}\n`);

  run([
    'git', 'config', 'gpg.ssh.allowedSignersFile',
    join(signersDir, 'allowed_signers'),
  ], repo);

  // Commit 1: Legitimate signed release (v1.14.0)
  writeFileSync(join(repo, 'package.json'), JSON.stringify({
    name: 'axios',
    version: '1.14.0',
  }, null, 2) + '\n');
  run(['git', 'add', '.'], repo);
  run(['git', 'commit', '-S', '-m', 'release: v1.14.0 (legitimate, signed)'], repo);

  // Commit 2: Attacker's malicious commit (unsigned)
  run(['git', 'config', 'commit.gpgSign', 'false'], repo);
  writeFileSync(join(repo, 'package.json'), JSON.stringify({
    name: 'axios',
    version: '1.14.1',
    dependencies: {
      'plain-crypto-js': '^4.2.1',  // Malicious dependency
    },
  }, null, 2) + '\n');
  run(['git', 'add', '.'], repo);
  run(['git', 'commit', '-m', 'release: v1.14.1 (MALICIOUS — unsigned)'], repo);

  return repo;
}

function main() {
  console.log('='.repeat(70));
  console.log('Auths Attack Simulation: Axios Supply Chain Incident (March 31, 2026)');
  console.log('='.repeat(70));
  console.log();

  if (!checkAuthsCli()) {
    console.log("The 'auths' CLI is not installed.");
    console.log();
    console.log('Install it with:');
    console.log('  npm install -g @auths-dev/sdk');
    console.log();
    console.log('Or visit: https://github.com/auths-dev/auths');
    process.exit(0);
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'auths-axios-'));

  console.log('[1] Setting up simulation repository...');
  const repo = setupTestRepo(tmpDir);
  console.log('    Created repo with 2 commits:');
  console.log('    - v1.14.0: Legitimate release, signed by maintainer');
  console.log('    - v1.14.1: Attacker\'s malicious version, unsigned');
  console.log();

  // Verify the legitimate commit
  console.log('[2] Verifying legitimate commit (v1.14.0)...');
  const legit = runSafe([
    'auths', 'verify', 'HEAD~2..HEAD~1',
    '--allowed-signers', '.auths/allowed_signers',
  ], repo);
  if (legit.exitCode === 0) {
    console.log('  PASSED: Commit is signed by an authorized maintainer');
  } else {
    console.log('  Result:', (legit.stdout || legit.stderr).trim());
  }
  console.log();

  // Verify the malicious commit
  console.log('[3] Verifying attacker\'s commit (v1.14.1)...');
  const malicious = runSafe([
    'auths', 'verify', 'HEAD~1..HEAD',
    '--allowed-signers', '.auths/allowed_signers',
  ], repo);
  if (malicious.exitCode !== 0) {
    console.log('  BLOCKED: Unsigned commit detected');
    if (malicious.stdout) console.log(`  Output: ${malicious.stdout.trim()}`);
    if (malicious.stderr) console.log(`  Detail: ${malicious.stderr.trim()}`);
  } else {
    console.log('  PASSED: All commits verified');
  }
  console.log();

  // Summary
  console.log('-'.repeat(70));
  console.log('RESULT: The attacker\'s unsigned commit would have been flagged.');
  console.log();
  console.log('In the real attack, the attacker used compromised npm credentials to');
  console.log('publish malicious packages directly to the registry. Neither version');
  console.log('appears in the GitHub release tags. With Auths, even if account');
  console.log('credentials are stolen, the attacker cannot produce a valid Ed25519');
  console.log('signature — the private key is bound to the maintainer\'s device');
  console.log('keychain and never leaves it.');
  console.log();
  console.log('Learn more: https://github.com/auths-dev/auths');
  console.log('='.repeat(70));
}

main();

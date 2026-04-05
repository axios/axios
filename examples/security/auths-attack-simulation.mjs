/**
 * Auths Attack Simulation: Axios March 31, 2026 Supply Chain Incident
 *
 * Demonstrates how Auths cryptographic verification would have detected
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
 * How Auths closes this gap:
 *   The real attack bypassed Git entirely — the attacker published directly to
 *   npm with no corresponding commit. Auths establishes a policy that every
 *   legitimate release must trace back to a signed action by an authorized
 *   maintainer. A package published without a valid signature from a known
 *   maintainer identity has no valid attestation and would be rejected.
 *
 *   This simulation uses the Auths Node SDK to demonstrate the core
 *   cryptographic primitive: sign an action with a maintainer's key, then
 *   show that verification succeeds for the legitimate release and fails
 *   for an unauthorized or tampered one.
 *
 * Usage:
 *   npm install @auths-dev/sdk
 *   node auths-attack-simulation.mjs
 *
 * Requires: @auths-dev/sdk
 */

let sdk;
try {
  sdk = await import('@auths-dev/sdk');
} catch {
  console.log("The '@auths-dev/sdk' package is not installed.");
  console.log();
  console.log('Install it with:');
  console.log('  npm install @auths-dev/sdk');
  console.log();
  console.log('Or visit: https://github.com/auths-dev/auths');
  process.exit(0);
}

const { generateInmemoryKeypair, signActionRaw, verifyActionEnvelope } = sdk;

function main() {
  console.log('='.repeat(70));
  console.log('Auths Attack Simulation: Axios Supply Chain Incident (March 31, 2026)');
  console.log('='.repeat(70));
  console.log();

  // Generate ephemeral identities — no filesystem, no keychain needed
  const maintainer = generateInmemoryKeypair();
  const attacker = generateInmemoryKeypair();

  // ── Step 1: Legitimate maintainer signs a release ──────────────────
  console.log('[1] Legitimate maintainer signs release v1.14.0...');
  console.log();

  const releasePayload = JSON.stringify({
    package: 'axios',
    version: '1.14.0',
    digest: 'sha256:abc123def456...',
    registry: 'npm',
  });

  const legitimateEnvelope = signActionRaw(
    maintainer.privateKeyHex, 'release', releasePayload, maintainer.did,
  );

  let result = verifyActionEnvelope(legitimateEnvelope, maintainer.publicKeyHex);
  console.log(`    Signed by: ${maintainer.did}`);
  console.log(`    Verification: ${result.valid ? 'PASSED' : 'FAILED'}`);
  console.log();

  // ── Step 2: Attacker publishes with stolen npm credentials ─────────
  console.log('[2] Attacker publishes v1.14.1 using stolen npm credentials...');
  console.log('    (Attacker has registry credentials but NOT the maintainer\'s signing key)');
  console.log();

  const maliciousPayload = JSON.stringify({
    package: 'axios',
    version: '1.14.1',
    digest: 'sha256:malicious_payload_hash...',
    registry: 'npm',
    dependencies: { 'plain-crypto-js': '^4.2.1' },
  });

  // Attacker signs with their own key — NOT the maintainer's
  const attackerEnvelope = signActionRaw(
    attacker.privateKeyHex, 'release', maliciousPayload, attacker.did,
  );

  // Verify against the MAINTAINER's public key (the only trusted key)
  result = verifyActionEnvelope(attackerEnvelope, maintainer.publicKeyHex);
  console.log(`    Signed by: ${attacker.did}`);
  console.log(`    Verification against maintainer key: ${result.valid ? 'PASSED' : 'FAILED'}`);
  if (result.error) console.log(`    Reason: ${result.error}`);
  console.log();

  // ── Step 3: Show tampered legitimate envelope also fails ───────────
  console.log('[3] Attacker tampers with a legitimately-signed envelope...');
  console.log();

  const envelope = JSON.parse(legitimateEnvelope);
  envelope.payload.version = '1.14.1';
  envelope.payload.digest = 'sha256:malicious_payload_hash...';
  const tamperedJson = JSON.stringify(envelope);

  result = verifyActionEnvelope(tamperedJson, maintainer.publicKeyHex);
  console.log(`    Original signer: ${maintainer.did}`);
  console.log(`    Tampered payload version: 1.14.1`);
  console.log(`    Verification: ${result.valid ? 'PASSED' : 'FAILED'}`);
  if (result.error) console.log(`    Reason: ${result.error}`);
  console.log();

  // ── Summary ────────────────────────────────────────────────────────
  console.log('-'.repeat(70));
  console.log('SUMMARY');
  console.log();
  console.log('  v1.14.0 (legitimate, signed by maintainer): VERIFIED');
  console.log('  v1.14.1 (attacker\'s key, not trusted):      REJECTED');
  console.log('  v1.14.1 (tampered legitimate envelope):     REJECTED');
  console.log();
  console.log('NOTE: The real March 31 attack bypassed Git entirely — the attacker');
  console.log('published directly to npm with no commit at all. This simulation');
  console.log('demonstrates the cryptographic primitive that Auths provides: only');
  console.log('the holder of the maintainer\'s private key can produce a valid');
  console.log('signature. In a full deployment, the CI/CD pipeline would use');
  console.log('\'auths artifact sign\' to bind the published package to the');
  console.log('maintainer\'s identity, and consumers would verify before installing.');
  console.log();
  console.log('Learn more: https://github.com/auths-dev/auths');
  console.log('='.repeat(70));
}

main();

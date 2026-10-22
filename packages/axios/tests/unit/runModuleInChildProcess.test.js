import { describe, it } from 'vitest';
import assert from 'assert';
import { runModuleInChildProcess } from '../setup/runModuleInChildProcess.js';

const outputSource = [
  "import fs from 'fs';",
  "fs.writeSync(1, 'module output\\n');",
  "fs.writeSync(2, 'module diagnostic\\n');",
].join('\n');

describe('runModuleInChildProcess', function () {
  it('continues to resolve with stdout alone on success', async function () {
    assert.strictEqual(await runModuleInChildProcess(outputSource), 'module output\n');
  });

  it('retains both output streams and exit metadata after a nonzero exit', async function () {
    await assert.rejects(
      runModuleInChildProcess(outputSource + '\nprocess.exitCode = 7;'),
      function (error) {
        assert.ok(error instanceof Error);
        assert.strictEqual(error.code, 7);
        assert.strictEqual(error.signal, null);
        assert.strictEqual(error.killed, false);
        assert.ok(error.cmd.includes('--input-type=module'));
        assert.strictEqual(error.stdout, 'module output\n');
        assert.strictEqual(error.stderr, 'module diagnostic\n');
        return true;
      }
    );
  });

  it('retains partial output and the thrown module error', async function () {
    await assert.rejects(
      runModuleInChildProcess(outputSource + "\nthrow new Error('module stopped');"),
      function (error) {
        assert.strictEqual(error.code, 1);
        assert.strictEqual(error.stdout, 'module output\n');
        assert.ok(error.stderr.includes('module diagnostic\n'));
        assert.ok(error.stderr.includes('Error: module stopped'));
        return true;
      }
    );
  });

  it('preserves buffer output when requested', async function () {
    await assert.rejects(
      runModuleInChildProcess(outputSource + '\nprocess.exitCode = 7;', { encoding: 'buffer' }),
      function (error) {
        assert.strictEqual(error.code, 7);
        assert.ok(Buffer.isBuffer(error.stdout));
        assert.ok(Buffer.isBuffer(error.stderr));
        assert.strictEqual(error.stdout.toString(), 'module output\n');
        assert.strictEqual(error.stderr.toString(), 'module diagnostic\n');
        return true;
      }
    );
  });

  it('retains partial output and termination metadata on timeout', async function () {
    await assert.rejects(
      runModuleInChildProcess(outputSource + '\nsetInterval(function () {}, 1000);'),
      function (error) {
        assert.strictEqual(error.code, null);
        assert.strictEqual(error.signal, 'SIGKILL');
        assert.strictEqual(error.killed, true);
        assert.strictEqual(error.stdout, 'module output\n');
        assert.strictEqual(error.stderr, 'module diagnostic\n');
        return true;
      }
    );
  });
});

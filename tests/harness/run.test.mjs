import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../helpers/run.mjs';

test('commands resolve on success and reject on nonzero exit', async () => {
  await run(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
  await assert.rejects(run(process.execPath, ['-e', 'process.exit(7)'], { stdio: 'ignore' }), {
    message: `${process.execPath} exited 7`,
  });
});

test('missing commands reject without waiting for the command timeout', async () => {
  await assert.rejects(run(join(tmpdir(), 'axios-e2e-nonexistent-command'), []), {
    code: 'ENOENT',
  });
});

test('a timeout stops the Node test worker as well as its supervisor', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'axios-e2e-worker-'));
  const workerFile = join(directory, 'worker.json');
  const env = { ...process.env, AXIOS_E2E_WORKER_FILE: workerFile };
  // Start an independent supervisor, not a recursively invoked test worker.
  delete env.NODE_TEST_CONTEXT;
  let worker;
  try {
    await assert.rejects(
      run(
        process.execPath,
        ['--test', fileURLToPath(new URL('./fixtures/leaking-worker.mjs', import.meta.url))],
        {
          timeout: 2000,
          stdio: 'ignore',
          env,
        }
      ),
      { message: `${process.execPath} timed out` }
    );
    worker = JSON.parse(await readFile(workerFile, 'utf8'));
    await assert.rejects(
      new Promise((resolve, reject) => {
        const socket = connect(worker.port, '127.0.0.1');
        socket.once('error', reject);
        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });
      }),
      { code: 'ECONNREFUSED' }
    );
  } finally {
    // Also clean up if a regression leaves the worker alive.
    if (worker) {
      try {
        process.kill(worker.pid, 'SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
    await rm(directory, { recursive: true, force: true });
  }
});

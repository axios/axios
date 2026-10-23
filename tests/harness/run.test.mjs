import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { run } from '../helpers/run.mjs';

function assertListenerClosed(port) {
  return assert.rejects(
    new Promise((resolve, reject) => {
      const socket = connect(port, '127.0.0.1');
      socket.once('error', reject);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
    }),
    { code: 'ECONNREFUSED' }
  );
}

async function readWorker(path) {
  const deadline = Date.now() + 10000;
  while (true) {
    try {
      return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT' || Date.now() >= deadline) throw error;
      await delay(20);
    }
  }
}

function killIfRunning(pid) {
  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

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
    await assertListenerClosed(worker.port);
  } finally {
    // Also clean up if a regression leaves the worker alive.
    if (worker) killIfRunning(worker.pid);
    await rm(directory, { recursive: true, force: true });
  }
});

for (const [signal, ignoreSignals] of [
  ['SIGINT', false],
  ['SIGTERM', false],
  ['SIGINT', true],
]) {
  test(
    `${signal} stops nested command groups${ignoreSignals ? ' even when the worker ignores signals' : ''}`,
    { skip: process.platform === 'win32' && 'POSIX process-group interruption' },
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'axios-e2e-interrupt-'));
      const workerFile = join(directory, 'worker.json');
      const env = {
        ...process.env,
        AXIOS_E2E_WORKER_FILE: workerFile,
        AXIOS_E2E_IGNORE_SIGNALS: ignoreSignals ? '1' : '',
      };
      delete env.NODE_TEST_CONTEXT;
      const helper = new URL('../helpers/run.mjs', import.meta.url).href;
      const fixture = fileURLToPath(new URL('./fixtures/nested-command.mjs', import.meta.url));
      const runner = spawn(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `import {run} from ${JSON.stringify(helper)};
           await run(process.execPath, ['--test', ${JSON.stringify(fixture)}]);`,
        ],
        { env, stdio: ['ignore', 'ignore', 'pipe'] }
      );
      let stderr = '';
      runner.stderr.on('data', (chunk) => (stderr += chunk));
      const closed = new Promise((resolve, reject) => {
        runner.once('error', reject);
        runner.once('close', (code) => resolve(code));
      });
      let worker;
      let timer;
      try {
        // Wait for the deepest worker to listen before interrupting the outer helper.
        worker = await readWorker(workerFile);
        runner.kill(signal);
        const code = await Promise.race([
          closed,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('interrupted runner did not stop')), 10000);
          }),
        ]);
        assert.equal(code, 1, stderr);
        assert.match(stderr, new RegExp('interrupted by ' + signal));
        await assertListenerClosed(worker.port);
      } finally {
        clearTimeout(timer);
        if (worker) killIfRunning(worker.pid);
        if (runner.exitCode === null && runner.signalCode === null) runner.kill('SIGKILL');
        await closed;
        await rm(directory, { recursive: true, force: true });
      }
    }
  );
}

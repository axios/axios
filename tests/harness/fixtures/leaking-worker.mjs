import { test } from 'node:test';
import { createServer } from 'node:net';
import { writeFile } from 'node:fs/promises';

test('worker with a leaked server handle', async () => {
  const server = createServer((socket) => socket.end());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  await writeFile(
    process.env.AXIOS_E2E_WORKER_FILE,
    JSON.stringify({ pid: process.pid, port: server.address().port })
  );
  // Intentionally leave the handle open: the harness must stop this worker.
});

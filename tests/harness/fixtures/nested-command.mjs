import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { run } from '../../helpers/run.mjs';

test('a harness worker starts another command group', async () => {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  await run(
    process.execPath,
    ['--test', fileURLToPath(new URL('./leaking-worker.mjs', import.meta.url))],
    { env, timeout: 30000, stdio: 'ignore' }
  );
});

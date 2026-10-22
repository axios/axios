import { spawn } from 'node:child_process';

export async function run(command, argv, { timeout = 180000, ...options } = {}) {
  const windows = process.platform === 'win32';
  // A separate POSIX process group includes the command's native test workers.
  const child = spawn(command, argv, { stdio: 'inherit', ...options, detached: !windows });
  const closed = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  let timer;
  let interrupt;
  const interrupted = new Promise((resolve) => {
    interrupt = (signal) => resolve({ interrupted: signal });
  });
  const onInterrupt = () => interrupt('SIGINT');
  const onTerminate = () => interrupt('SIGTERM');
  process.on('SIGINT', onInterrupt);
  process.on('SIGTERM', onTerminate);
  try {
    const result = await Promise.race([
      closed,
      interrupted,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), timeout);
      }),
    ]);
    if (result === null || result.interrupted) {
      if (windows) {
        await new Promise((resolve, reject) => {
          const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
            stdio: 'ignore',
          });
          killer.once('error', reject);
          killer.once('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`taskkill exited ${code}`))
          );
        });
      } else {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
      }
      // Do not remove the consumer while its command is still shutting down.
      await closed;
      throw new Error(
        `${command} ${result === null ? 'timed out' : 'interrupted by ' + result.interrupted}`
      );
    }
    if (result.code !== 0) throw new Error(`${command} exited ${result.code ?? result.signal}`);
  } finally {
    clearTimeout(timer);
    process.off('SIGINT', onInterrupt);
    process.off('SIGTERM', onTerminate);
  }
}

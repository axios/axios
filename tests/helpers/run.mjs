import { execFile, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function collectGroups(pid, groups) {
  const { stdout } = await execFileAsync('ps', ['-A', '-o', 'pid=,ppid=,pgid='], { timeout: 2000 });
  const processes = stdout
    .trim()
    .split('\n')
    .map((line) => line.trim().split(/\s+/).map(Number));
  const descendants = new Set([pid]);
  let changed;
  do {
    changed = false;
    for (const [child, parent] of processes) {
      if (descendants.has(parent) && !descendants.has(child)) {
        descendants.add(child);
        changed = true;
      }
    }
  } while (changed);
  for (const [child, , group] of processes) {
    // Only target groups whose leader belongs to this command's descendant tree.
    if (descendants.has(child) && descendants.has(group)) groups.add(group);
  }
}

function signalGroup(group, signal) {
  try {
    process.kill(-group, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

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
        // Snapshot before signalling: exiting parents can orphan nested groups.
        const groups = new Set([child.pid]);
        let discoveryError;
        try {
          await collectGroups(child.pid, groups);
        } catch (error) {
          discoveryError = error;
        }
        for (const group of groups) signalGroup(group, result?.interrupted || 'SIGTERM');
        // The supervisor may close before its workers finish their own cleanup.
        await delay(1000);
        for (const group of groups) signalGroup(group, 'SIGKILL');
        if (discoveryError) {
          await closed;
          throw new Error('Could not inspect descendant process groups with ps', {
            cause: discoveryError,
          });
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

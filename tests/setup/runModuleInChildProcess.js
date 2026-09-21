import { execFile } from 'child_process';

export function runModuleInChildProcess(source, options) {
  return new Promise(function (resolve, reject) {
    execFile(
      process.execPath,
      ['--input-type=module', '-e', source],
      Object.assign({ timeout: 3000, killSignal: 'SIGKILL' }, options),
      function (error, stdout) {
        if (error) return reject(error);
        resolve(stdout);
      }
    );
  });
}

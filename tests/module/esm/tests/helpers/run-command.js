import { spawnSync } from 'node:child_process';

const formatCommand = (command, args) => [command, ...(args || [])].join(' ');

export const runCommand = (command, args = [], options = {}) => {
  const spawnOptions = { encoding: 'utf8', ...options };
  const result = spawnSync(command, args, spawnOptions);

  const output = {
    code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    command: formatCommand(command, args),
    cwd: spawnOptions.cwd || process.cwd(),
  };

  if (result.error) {
    throw result.error;
  }

  if (output.code !== 0) {
    throw new Error(
      [
        'Command failed:',
        `  command: ${output.command}`,
        `  cwd: ${output.cwd}`,
        `  exitCode: ${String(output.code)}`,
        `  stdout:\n${output.stdout}`,
        `  stderr:\n${output.stderr}`,
      ].join('\n')
    );
  }

  return output;
};

const { spawnSync } = require('child_process');

const formatCommand = (command, args) => [command].concat(args || []).join(' ');

const runCommand = (command, args, options) => {
  const spawnOptions = Object.assign({ encoding: 'utf8' }, options || {});
  const result = spawnSync(command, args || [], spawnOptions);

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
    const error = new Error(
      [
        'Command failed:',
        `  command: ${output.command}`,
        `  cwd: ${output.cwd}`,
        `  exitCode: ${String(output.code)}`,
        `  stdout:\n${output.stdout}`,
        `  stderr:\n${output.stderr}`,
      ].join('\n')
    );
    error.commandResult = output;
    throw error;
  }

  return output;
};

module.exports = {
  runCommand,
};

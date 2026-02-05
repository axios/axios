import { startTestServer, stopHTTPServer } from '../test/helpers/server.js';
import { spawn } from 'child_process';
import chalk from "chalk";

let server;

async function run() {

  console.log(chalk.red.bold(`[ Starting HTTP server... ]`));

  server = await startTestServer(3000);

  await new Promise((resolve, reject) => {
    console.log('Starting karma runner...');

    const karma = spawn(
      'npx',
      ['karma', 'start', 'karma.conf.cjs', '--single-run'],
      {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, LISTEN_ADDR: '0.0.0.0' },
      });

    karma.on('exit', (code) => {
      code ? reject(new Error(`Karma tests failed with exit code ${code}`)) : resolve();
    });
  });

}



(async() => {
  try {
    await run();
  } finally {
    if (server) {
      console.log(chalk.red.bold(`[ Terminating HTTP server... ]`));

      await stopHTTPServer(server);
    }
  }
})();



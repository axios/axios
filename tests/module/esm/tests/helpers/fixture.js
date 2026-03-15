import fs from 'node:fs';
import path from 'node:path';
import { runCommand } from './run-command.js';

export const createTempFixture = (suiteRoot, name, sourcePath, tsconfig, packageJson) => {
  const tempRoot = fs.mkdtempSync(path.join(suiteRoot, `.tmp-module-${name}-`));
  const source = fs.readFileSync(sourcePath, 'utf8');

  fs.writeFileSync(path.join(tempRoot, 'index.ts'), source);
  fs.writeFileSync(path.join(tempRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  if (packageJson) {
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  return tempRoot;
};

export const cleanupTempFixture = (dirPath) => {
  runCommand('rm', ['-rf', dirPath]);
};

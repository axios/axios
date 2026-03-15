const fs = require('fs');
const path = require('path');
const { runCommand } = require('./run-command.cjs');

const createTempFixture = (suiteRoot, name, sourcePath, tsconfig, packageJson) => {
  const tempRoot = fs.mkdtempSync(path.join(suiteRoot, `.tmp-module-${name}-`));
  const source = fs.readFileSync(sourcePath, 'utf8');

  fs.writeFileSync(path.join(tempRoot, 'index.ts'), source);
  fs.writeFileSync(path.join(tempRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  if (packageJson) {
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  return tempRoot;
};

const cleanupTempFixture = (dirPath) => {
  runCommand('rm', ['-rf', dirPath]);
};

module.exports = {
  createTempFixture,
  cleanupTempFixture,
};

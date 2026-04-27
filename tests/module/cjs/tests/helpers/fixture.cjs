const fs = require('fs');
const path = require('path');

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
  if (typeof fs.rmSync === 'function') {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return;
  }

  if (fs.existsSync(dirPath)) {
    fs.rmdirSync(dirPath, { recursive: true });
  }
};

module.exports = {
  createTempFixture,
  cleanupTempFixture,
};

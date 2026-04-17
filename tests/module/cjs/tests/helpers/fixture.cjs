const fs = require('fs');
const path = require('path');

const createTempFixture = (
  suiteRoot,
  repoRootOrName,
  nameOrSourcePath,
  sourcePathOrTsconfig,
  tsconfigOrPackageJson,
  packageJson
) => {
  const hasRepoRoot = typeof sourcePathOrTsconfig === 'string';
  const repoRoot = hasRepoRoot ? repoRootOrName : null;
  const name = hasRepoRoot ? nameOrSourcePath : repoRootOrName;
  const sourcePath = hasRepoRoot ? sourcePathOrTsconfig : nameOrSourcePath;
  const tsconfig = hasRepoRoot ? tsconfigOrPackageJson : sourcePathOrTsconfig;
  const fixturePackageJson = hasRepoRoot ? packageJson : tsconfigOrPackageJson;
  const tempRoot = fs.mkdtempSync(path.join(suiteRoot, `.tmp-module-${name}-`));
  const source = fs.readFileSync(sourcePath, 'utf8');

  fs.writeFileSync(path.join(tempRoot, 'index.ts'), source);
  fs.writeFileSync(path.join(tempRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  if (repoRoot) {
    const axiosFixturePath = path.join(tempRoot, 'node_modules', 'axios');
    fs.mkdirSync(path.dirname(axiosFixturePath), { recursive: true });
    fs.symlinkSync(repoRoot, axiosFixturePath, 'junction');
  }

  if (fixturePackageJson) {
    fs.writeFileSync(
      path.join(tempRoot, 'package.json'),
      JSON.stringify(fixturePackageJson, null, 2)
    );
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

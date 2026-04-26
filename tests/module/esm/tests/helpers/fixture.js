import fs from 'node:fs';
import path from 'node:path';

export const createTempFixture = (suiteRoot, repoRoot, name, sourcePath, tsconfig, packageJson) => {
  const tempRoot = fs.mkdtempSync(path.join(suiteRoot, `.tmp-module-${name}-`));
  const source = fs.readFileSync(sourcePath, 'utf8');

  fs.writeFileSync(path.join(tempRoot, 'index.ts'), source);
  fs.writeFileSync(path.join(tempRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  if (repoRoot) {
    const axiosFixturePath = path.join(tempRoot, 'node_modules', 'axios');
    fs.mkdirSync(path.dirname(axiosFixturePath), { recursive: true });
    fs.symlinkSync(repoRoot, axiosFixturePath, 'junction');
  }

  if (packageJson) {
    fs.writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  return tempRoot;
};

export const cleanupTempFixture = (dirPath) => {
  fs.rmSync(dirPath, { recursive: true, force: true });
};

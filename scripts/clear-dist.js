import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDistDirectory = new URL('../dist/', import.meta.url);

export const clearDist = (directory = defaultDistDirectory) =>
  rm(directory, { recursive: true, force: true });

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await clearDist();
}

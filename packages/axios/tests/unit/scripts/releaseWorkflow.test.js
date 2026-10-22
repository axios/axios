import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = await readFile(
  new URL('../../../../../.github/workflows/release-branch.yml', import.meta.url),
  'utf8'
);

async function checkRelease(tag, version, type) {
  const source = workflow.match(new RegExp(`<<'${tag}'\\n([\\s\\S]*?)\\n +${tag}\\n`));
  expect(source, `release workflow contains ${tag}`).not.toBeNull();
  const directory = await mkdtemp(join(tmpdir(), 'axios-release-guard-'));
  try {
    await mkdir(join(directory, 'packages', 'axios'), { recursive: true });
    await writeFile(
      join(directory, 'packages', 'axios', 'package.json'),
      JSON.stringify({ version })
    );
    try {
      execFileSync(process.execPath, ['--input-type=module', '-e', source[1]], {
        cwd: directory,
        env: { ...process.env, INPUT_TYPE: type },
        stdio: 'pipe',
      });
      return '';
    } catch (error) {
      return (
        error.stderr?.toString() || error.message || `Process exited with status ${error.status}`
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe('v2 release workflow version guards', () => {
  it.each(['patch', 'minor'])('rejects a v1 %s before changing the manifest', async (type) => {
    expect(await checkRelease('CHECK_RELEASE_INPUT', '1.21.0', type)).toContain(
      'requires a major bump from v1'
    );
  });

  it.each([
    ['1.21.0', 'major'],
    ['2.0.0', 'patch'],
    ['2.0.0', 'minor'],
    ['2.0.0-beta.0', 'major'],
  ])('accepts release input %s %s', async (version, type) => {
    expect(await checkRelease('CHECK_RELEASE_INPUT', version, type)).toBe('');
  });

  it('rejects other release lines and unsupported bump types', async () => {
    expect(await checkRelease('CHECK_RELEASE_INPUT', '3.0.0', 'patch')).toContain(
      'requires a major bump'
    );
    expect(await checkRelease('CHECK_RELEASE_INPUT', '2.0.0', 'invalid')).toContain(
      'Choose patch, minor, or major'
    );
  });

  it.each(['1.21.1', '3.0.0'])(
    'rejects a bumped %s before creating a release PR',
    async (version) => {
      expect(await checkRelease('CHECK_RELEASE_VERSION', version, 'major')).toContain(
        'releases must stay on major 2'
      );
    }
  );

  it.each(['2.0.0', '2.0.0-beta.0'])('accepts the bumped v2 version %s', async (version) => {
    expect(await checkRelease('CHECK_RELEASE_VERSION', version, 'major')).toBe('');
  });
});

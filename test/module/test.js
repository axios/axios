import assert from 'assert';
import * as axios from '../../index.js';
import axiosFactory from '../../lib/axios.js';
import utils from "../../lib/utils.js";
import {fileURLToPath} from 'url';
import path from 'path';
import util from "util";
import cp from "child_process";
import fs from 'fs-extra';

const BACKUP_PATH = './backup/';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const exec = util.promisify(cp.exec);

const spawn = (command, args) =>  new Promise((resolve, reject) => {
  cp.spawn(command, args, {
    shell : true,
    stdio: 'inherit'
  }).once('error', reject).on(
    'close',
    (code) => code ? reject(new Error(`Exit code ${code}`)) : resolve()
  );
});

const {Axios} = axiosFactory;

const ignoreList = ['default'];

const instance = axiosFactory.create({});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const remove = async (file) => {
  console.log(`✓ Remove entry '${file}'...`);
  try {
    await sleep(1000);
    await fs.remove(file);
  } catch (err) {
    console.warn(err.message);
  }
}

describe('module', function () {

  before(async ()=> {
    console.log('✓ Creating build backup...');
    await fs.copy('./dist/', BACKUP_PATH);
    console.log('✓ Exec build script...');
    await exec('npm run build');
    console.log('✓ Running tests...');
  });

  after(async () => {
    console.log('✓ Restore build from the backup...');
    await fs.copy(BACKUP_PATH, './dist/');
    await remove(BACKUP_PATH);
  });

  describe('export', function () {

    it('should have consistent ESM export', function () {
      const namedExport = {};
      const factoryExport = {};

      Object.entries(axiosFactory).forEach(([key, value]) => {
        if (!utils.hasOwnProp(Axios, key) && !(key in instance) && ignoreList.indexOf(key) === -1) {
          factoryExport[key] = value;
        }
      });

      Object.entries(axios).forEach(([key, value]) => {
        key !== 'default' && ignoreList.indexOf(key) === -1 && (namedExport[key] = value);
      });

      assert.deepStrictEqual(namedExport, factoryExport);
    });

    describe('CommonJS', () => {
      const pkgPath = path.join(__dirname, './cjs');

      after(async () => {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should be able to be loaded with require', async function () {
        this.timeout(30000);

        await exec(`npm test --prefix ${pkgPath}`);
      });
    });

    describe('ESM', () => {
      const pkgPath = path.join(__dirname, './esm');

      after(async () => {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should be able to be loaded with import', async function () {
        this.timeout(30000);

        await exec(`npm test --prefix ${pkgPath}`);
      });
    });

    describe('TS', () => {
      const pkgPath = path.join(__dirname, './ts');

      after(async () => {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should be able to be loaded with import', async function () {
        this.timeout(30000);

        await exec(`npm test --prefix ${pkgPath}`, {});
      });
    });

    describe('TS require(\'axios\')', () => {
      const pkgPath = path.join(__dirname, './ts-require');

      after(async () => {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should be able to be loaded with require', async function () {
        this.timeout(30000);

        await exec(`npm test --prefix ${pkgPath}`, {});
      });
    });

    describe('TS require(\'axios\').default', () => {
      const pkgPath = path.join(__dirname, './ts-require-default');

      after(async () => {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should be able to be loaded with require', async function () {
        this.timeout(30000);

        await exec(`npm test --prefix ${pkgPath}`, {});
      });
    });
  });

  describe('typings', () => {
    describe('ESM', ()=> {
      const pkgPath = path.join(__dirname, './typings/esm');

      after(async ()=> {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should pass types check', async function () {
        this.timeout(30000);

        await spawn(`npm test --prefix ${pkgPath}`, [], {
          shell : true,
          stdio: 'pipe'
        });
      });
    });

    describe('CommonJS', ()=> {
      const pkgPath = path.join(__dirname, './typings/cjs');

      after(async ()=> {
        await remove(path.join(pkgPath, './node_modules'));
      });

      it('should pass types check', async function () {
        this.timeout(30000);

        await spawn(`npm test --prefix ${pkgPath}`, [], {
          shell : true,
          stdio: 'pipe'
        });
      });
    });
  });
});

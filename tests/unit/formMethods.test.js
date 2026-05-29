/**
 * Tests for postForm/putForm/patchForm Content-Type behaviour controlled by
 * transitional.formDataContentType (fixes issue #10886).
 */
import { describe, it } from 'vitest';
import assert from 'assert';
import axios from '../../index.js';

function mockAdapter(config) {
  return Promise.resolve({
    data: null,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  });
}

describe('form method helpers (postForm/putForm/patchForm)', () => {
  describe('default behaviour (transitional.formDataContentType = true)', () => {
    it('postForm sets placeholder Content-Type: multipart/form-data by default', async () => {
      let capturedConfig;
      const instance = axios.create({ adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); } });

      await instance.postForm('/test', { key: 'value' });

      assert.ok(capturedConfig.headers, 'headers should exist');
      assert.ok(
        String(capturedConfig.headers['Content-Type'] || capturedConfig.headers['content-type'] || '')
          .startsWith('multipart/form-data'),
        'should set placeholder Content-Type multipart/form-data',
      );
    });

    it('putForm sets placeholder Content-Type: multipart/form-data by default', async () => {
      let capturedConfig;
      const instance = axios.create({ adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); } });

      await instance.putForm('/test', { key: 'value' });

      assert.ok(
        String(capturedConfig.headers['Content-Type'] || capturedConfig.headers['content-type'] || '')
          .startsWith('multipart/form-data'),
        'putForm should set placeholder Content-Type multipart/form-data',
      );
    });

    it('patchForm sets placeholder Content-Type: multipart/form-data by default', async () => {
      let capturedConfig;
      const instance = axios.create({ adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); } });

      await instance.patchForm('/test', { key: 'value' });

      assert.ok(
        String(capturedConfig.headers['Content-Type'] || capturedConfig.headers['content-type'] || '')
          .startsWith('multipart/form-data'),
        'patchForm should set placeholder Content-Type multipart/form-data',
      );
    });

    it('non-form post does not set Content-Type: multipart/form-data', async () => {
      let capturedConfig;
      const instance = axios.create({ adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); } });

      await instance.post('/test', { key: 'value' });

      const ct = String(capturedConfig.headers?.['Content-Type'] || capturedConfig.headers?.['content-type'] || '');
      assert.ok(!ct.startsWith('multipart/form-data'), 'plain post should not set multipart/form-data');
    });
  });

  describe('opt-out via transitional.formDataContentType = false', () => {
    it('postForm does not set Content-Type when opted out per-request', async () => {
      let capturedConfig;
      const instance = axios.create({ adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); } });

      await instance.postForm('/test', { key: 'value' }, {
        transitional: { formDataContentType: false },
      });

      const ct = String(capturedConfig.headers?.['Content-Type'] || capturedConfig.headers?.['content-type'] || '');
      assert.ok(!ct.startsWith('multipart/form-data'), 'should not set multipart/form-data when opted out');
    });

    it('postForm does not set Content-Type when opted out globally via instance defaults', async () => {
      let capturedConfig;
      const instance = axios.create({
        adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); },
        transitional: { formDataContentType: false },
      });

      await instance.postForm('/test', { key: 'value' });

      const ct = String(capturedConfig.headers?.['Content-Type'] || capturedConfig.headers?.['content-type'] || '');
      assert.ok(!ct.startsWith('multipart/form-data'), 'should not set multipart/form-data when globally opted out');
    });

    it('per-request opt-out overrides instance default', async () => {
      let capturedConfig;
      // Instance defaults to old behaviour (formDataContentType: true)
      const instance = axios.create({
        adapter: (cfg) => { capturedConfig = cfg; return mockAdapter(cfg); },
        transitional: { formDataContentType: true },
      });

      // Per-request opts out
      await instance.postForm('/test', { key: 'value' }, {
        transitional: { formDataContentType: false },
      });

      const ct = String(capturedConfig.headers?.['Content-Type'] || capturedConfig.headers?.['content-type'] || '');
      assert.ok(!ct.startsWith('multipart/form-data'), 'per-request opt-out should take precedence over instance default');
    });
  });
});

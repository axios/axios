import { describe, expect, it } from 'vitest';
import axios, { CanceledError, AxiosError, AxiosHeaders } from 'axios';
import settle from 'axios/unsafe/core/settle.js';

describe('ESM importing', () => {
  it('should import axios', () => {
    expect(typeof axios).toStrictEqual('function');
  });

  it('should import CanceledError', () => {
    expect(typeof CanceledError).toStrictEqual('function');
  });

  it('should import AxiosError', () => {
    expect(typeof AxiosError).toStrictEqual('function');
  });

  it('should import AxiosHeaders', () => {
    expect(typeof AxiosHeaders).toStrictEqual('function');
  });

  it('should import settle', () => {
    expect(typeof settle).toStrictEqual('function');
  });

  it('should import CanceledError from axios', () => {
    expect(axios.CanceledError).toStrictEqual(CanceledError);
  });

  it('should import AxiosError from axios', () => {
    expect(axios.AxiosError).toStrictEqual(AxiosError);
  });

  it('should import AxiosHeaders from axios', () => {
    expect(axios.AxiosHeaders).toStrictEqual(AxiosHeaders);
  });
});

const axios = require('axios');
const { describe, it } = require('mocha');
const { expect } = require('chai');

const { CanceledError, AxiosError, AxiosHeaders } = axios;

describe('CommonJS importing', () => {
  it('should import axios', () => {
    expect(typeof axios).to.be.equal('function');
  });

  it('should import CanceledError', () => {
    expect(typeof CanceledError).to.be.equal('function');
  });

  it('should import AxiosError', () => {
    expect(typeof AxiosError).to.be.equal('function');
  });

  it('should import AxiosHeaders', () => {
    expect(typeof AxiosHeaders).to.be.equal('function');
  });
});

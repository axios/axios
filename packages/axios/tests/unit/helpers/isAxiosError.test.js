import { describe, it, expect } from 'vitest';
import AxiosError from '../../../lib/core/AxiosError.js';
import isAxiosError from '../../../lib/helpers/isAxiosError.js';

describe('helpers::isAxiosError', () => {
  it('should return true if the error is created by core::createError', () => {
    expect(isAxiosError(new AxiosError('Boom!', null, { foo: 'bar' }))).toBe(true);
  });

  it('should return true if the error is enhanced by core::enhanceError', () => {
    expect(isAxiosError(AxiosError.from(new Error('Boom!'), null, { foo: 'bar' }))).toBe(true);
  });

  it('should return false if the error is a normal Error instance', () => {
    expect(isAxiosError(new Error('Boom!'))).toBe(false);
  });

  it('should return false if the error is null', () => {
    expect(isAxiosError(null)).toBe(false);
  });
});

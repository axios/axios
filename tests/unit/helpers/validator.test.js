import { describe, it, expect } from 'vitest';
import validator from '../../../lib/helpers/validator.js';

describe('validator::assertOptions', () => {
  it('should throw only if unknown an option was passed', () => {
    expect(() => {
      validator.assertOptions(
        {
          x: true,
        },
        {
          y: validator.validators.boolean,
        }
      );
    }).toThrow(new Error('Unknown option x'));

    expect(() => {
      validator.assertOptions(
        {
          x: true,
        },
        {
          x: validator.validators.boolean,
          y: validator.validators.boolean,
        }
      );
    }).not.toThrow(new Error('Unknown option x'));
  });

  it("should throw TypeError only if option type doesn't match", () => {
    expect(() => {
      validator.assertOptions(
        {
          x: 123,
        },
        {
          x: validator.validators.boolean,
        }
      );
    }).toThrow(new TypeError('option x must be a boolean'));

    expect(() => {
      validator.assertOptions(
        {
          x: true,
        },
        {
          x: validator.validators.boolean,
          y: validator.validators.boolean,
        }
      );
    }).not.toThrow();
  });
});

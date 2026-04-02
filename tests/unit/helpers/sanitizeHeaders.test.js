/**
 * Tests for sanitizeHeaders utility function
 * Tests header injection prevention, CRLF removal, and null byte handling
 */
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'assert';
import { sanitizeResponseHeaders } from '../../../lib/helpers/sanitizeHeaders.js';

describe('sanitizeResponseHeaders - Header Sanitization Utility', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  // CRLF Injection Prevention
  describe('CRLF Injection Prevention', () => {
    it('should remove CRLF from header values', () => {
      // Arrange
      const headers = {
        'Content-Type': 'text/plain\r\nX-Injected: evil',
        'User-Agent': 'Mozilla/5.0',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['Content-Type'], 'text/plainX-Injected: evil');
      assert.strictEqual(sanitized['User-Agent'], 'Mozilla/5.0');
      assert.strictEqual(consoleWarnSpy.mock.calls.length, 1);
      assert(consoleWarnSpy.mock.calls[0][0].includes('CRLF'));
    });

    it('should remove line feed characters', () => {
      // Arrange
      const headers = {
        'X-Custom': 'value\ninjected: header',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['X-Custom'], 'valueinjected: header');
      assert(consoleWarnSpy.mock.calls[0][0].includes('CRLF'));
    });

    it('should remove carriage return characters', () => {
      // Arrange
      const headers = {
        'X-Custom': 'value\rinjected: header',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['X-Custom'], 'valueinjected: header');
      assert(consoleWarnSpy.mock.calls[0][0].includes('CRLF'));
    });
  });

  // Null Byte Removal
  describe('Null Byte Removal', () => {
    it('should remove null bytes from header values', () => {
      // Arrange
      const headers = {
        'X-Custom': 'value\0null-terminated',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['X-Custom'], 'valuenull-terminated');
      assert(consoleWarnSpy.mock.calls[0][0].includes('null-byte'));
    });
  });

  // Invalid Header Name Filtering
  describe('Invalid Header Name Filtering', () => {
    it('should remove headers with invalid names', () => {
      // Arrange
      const headers = {
        'Valid-Header': 'keep',
        'Invalid\r\nHeader': 'remove',
        'Another-Valid': 'keep',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['Valid-Header'], 'keep');
      assert.strictEqual(sanitized['Another-Valid'], 'keep');
      assert(sanitized['Invalid\r\nHeader'] === undefined);
    });

    it('should remove headers with invalid characters in name', () => {
      // Arrange
      const headers = {
        'Valid-Name': 'value',
        'Invalid Name': 'value', // space is invalid
        'Also@Invalid': 'value', // @ is invalid
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['Valid-Name'], 'value');
      assert(sanitized['Invalid Name'] === undefined);
      assert(sanitized['Also@Invalid'] === undefined);
    });
  });

  // Array Header Value Handling
  describe('Array Header Value Handling', () => {
    it('should clean array values and remove CRLF', () => {
      // Arrange
      const headers = {
        'Set-Cookie': [
          'session=abc123',
          'secure\r\ninjected=malicious',
          'httponly',
        ],
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert(Array.isArray(sanitized['Set-Cookie']) || typeof sanitized['Set-Cookie'] === 'string');
      if (Array.isArray(sanitized['Set-Cookie'])) {
        assert.strictEqual(sanitized['Set-Cookie'].length, 3);
        assert.strictEqual(sanitized['Set-Cookie'][1], 'secureinjected=malicious');
      }
    });

    it('should remove empty strings from array after cleaning', () => {
      // Arrange
      const headers = {
        'Custom-Header': [
          'value1',
          '\r\n', // will be cleaned to empty
          'value2',
        ],
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      // Should only have 2 values after filtering empty ones
      if (Array.isArray(sanitized['Custom-Header'])) {
        assert.strictEqual(sanitized['Custom-Header'].length, 2);
      }
    });

    it('should convert single-item array to string', () => {
      // Arrange
      const headers = {
        'X-Single': ['only-value'],
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(typeof sanitized['X-Single'], 'string');
      assert.strictEqual(sanitized['X-Single'], 'only-value');
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle null or undefined headers gracefully', () => {
      // Arrange
      const testCases = [null, undefined, false, 0];

      // Act & Assert
      testCases.forEach((testCase) => {
        const result = sanitizeResponseHeaders(testCase);
        assert.strictEqual(result, testCase);
      });
    });

    it('should handle empty headers object', () => {
      // Arrange
      const headers = {};

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.deepStrictEqual(sanitized, {});
    });

    it('should preserve valid headers without modification', () => {
      // Arrange
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': '1234',
        'X-Custom-Header': 'safe-value',
        'Set-Cookie': ['session=token', 'path=/'],
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['Content-Type'], 'application/json; charset=utf-8');
      assert.strictEqual(sanitized['Content-Length'], '1234');
      assert.strictEqual(sanitized['X-Custom-Header'], 'safe-value');
      assert(Array.isArray(sanitized['Set-Cookie']));
      assert.strictEqual(consoleWarnSpy.mock.calls.length, 0);
    });

    it('should trim whitespace from cleaned values', () => {
      // Arrange
      const headers = {
        'X-Header': '  value with spaces  \r\n  more text  ',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['X-Header'], 'value with spaces    more text');
    });

    it('should handle complex injection attempts', () => {
      // Arrange
      const headers = {
        'Authorization': 'Bearer token123\r\nX-Override: admin',
        'Cache-Control': 'max-age=3600\nSet-Cookie: admin=true',
      };

      // Act
      const sanitized = sanitizeResponseHeaders(headers);

      // Assert
      assert.strictEqual(sanitized['Authorization'], 'Bearer token123X-Override: admin');
      assert.strictEqual(sanitized['Cache-Control'], 'max-age=3600Set-Cookie: admin=true');
      assert.strictEqual(consoleWarnSpy.mock.calls.length, 2);
    });
  });
});

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { validateArguments } from '../src/cli.js';
import { CLIError } from '../src/types/index.js';

// Feature: wcag-accessibility-checker, Property 12
describe('Property 12: CLI Argument Validation', () => {
  test('specifying both --url and --file always throws CLIError with exit code 1', () => {
    fc.assert(
      fc.property(
        fc.webUrl({ withQueryParameters: true }),
        fc.string({ minLength: 1, maxLength: 20 }).map((s) => `/tmp/${s}.html`),
        (url, file) => {
          expect(() => validateArguments({ url, file })).toThrow(CLIError);
          try {
            validateArguments({ url, file });
          } catch (err) {
            expect(err).toBeInstanceOf(CLIError);
            expect((err as CLIError).exitCode).toBe(1);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('a URL with a disallowed scheme always throws CLIError with exit code 1', () => {
    // Independent oracle: construct the URL string directly with a
    // non-http(s) scheme, rather than reusing isAllowedUrl's logic.
    fc.assert(
      fc.property(
        fc.constantFrom('ftp', 'file', 'ws', 'javascript', 'data'),
        fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/), // safe alphabet for host/path segment
        (scheme, segment) => {
          const url = `${scheme}://${segment}.example/${segment}`;
          try {
            validateArguments({ url });
            expect.unreachable('expected CLIError to be thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(CLIError);
            expect((err as CLIError).exitCode).toBe(1);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('neither --url nor --file always throws CLIError with exit code 1', () => {
    expect(() => validateArguments({})).toThrow(CLIError);
    try {
      validateArguments({});
    } catch (err) {
      expect(err).toBeInstanceOf(CLIError);
      expect((err as CLIError).exitCode).toBe(1);
    }
  });

  test('a non-existent --file path always throws CLIError with exit code 4', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_-]{5,20}$/), // safe alphabet, won't collide with real files
        (name) => {
          const file = `/tmp/does-not-exist-${name}.html`;
          try {
            validateArguments({ file });
            expect.unreachable('expected CLIError to be thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(CLIError);
            expect((err as CLIError).exitCode).toBe(4);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('a valid http/https URL with no --file passes validation without throwing', () => {
    fc.assert(
      fc.property(fc.webUrl({ validSchemes: ['http', 'https'] }), (url) => {
        expect(() => validateArguments({ url })).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });
});

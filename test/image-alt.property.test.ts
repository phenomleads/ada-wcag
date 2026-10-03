import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseHTML } from '../src/parser/html-parser.js';
import { ImageAltValidator } from '../src/validators/image-alt.js';
import { safeToken } from './arbitraries.js';

interface ImageSpec {
  hasAlt: boolean;
  altValue: string;
  src: string;
}

const imageSpecArbitrary = fc.record({
  hasAlt: fc.boolean(),
  altValue: safeToken(),
  src: safeToken(),
});

function buildHtmlWithImages(images: ImageSpec[]): string {
  const tags = images.map((img) => {
    const altAttr = img.hasAlt ? ` alt="${img.altValue}"` : '';
    return `<img src="${img.src}.png"${altAttr}>`;
  });
  return `<html><body>${tags.join('')}</body></html>`;
}

// Feature: wcag-accessibility-checker, Property 3
describe('Property 3: Image Alt Detection Completeness', () => {
  test('flags exactly the images missing the alt attribute (missing alt only, not empty alt)', () => {
    fc.assert(
      fc.property(fc.array(imageSpecArbitrary, { minLength: 0, maxLength: 15 }), (images) => {
        const html = buildHtmlWithImages(images);
        const doc = parseHTML(html);

        // Independent oracle: count directly from the generated input
        // spec, not by re-running the validator's own logic. alt="" is
        // NOT counted as missing, matching the decorative-image rule.
        const expectedViolations = images.filter((img) => !img.hasAlt).length;

        const violations = new ImageAltValidator().validate(doc);

        expect(violations.length).toBe(expectedViolations);
        expect(violations.every((v) => v.severity === 'error')).toBe(true);
        expect(violations.every((v) => v.wcag === '1.1.1')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

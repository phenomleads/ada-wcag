import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseHTML } from '../src/parser/html-parser.js';
import { ColorContrastValidator, calculateContrastRatio } from '../src/validators/color-contrast.js';
import type { RGBColor } from '../src/types/index.js';

const rgbColorArbitrary: fc.Arbitrary<RGBColor> = fc.record({
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

/**
 * Independent reference implementation of the WCAG relative luminance +
 * contrast ratio formula, written separately from src/validators/color-contrast.ts
 * so Property 8 is not tautological.
 */
function referenceLuminance(c: RGBColor): number {
  const linearize = (channel: number): number => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearize(c.r) + 0.7152 * linearize(c.g) + 0.0722 * linearize(c.b);
}

function referenceContrastRatio(a: RGBColor, b: RGBColor): number {
  const la = referenceLuminance(a);
  const lb = referenceLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Feature: wcag-accessibility-checker, Property 8
describe('Property 8: Color Contrast Calculation Correctness', () => {
  test('contrast ratio matches an independently-written reference formula, falls in [1, 21], and is symmetric', () => {
    fc.assert(
      fc.property(rgbColorArbitrary, rgbColorArbitrary, (colorA, colorB) => {
        const ratio = calculateContrastRatio(colorA, colorB);
        const expected = referenceContrastRatio(colorA, colorB);

        expect(ratio).toBeCloseTo(expected, 5);
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);

        // Symmetry: swapping fg/bg must produce the same ratio.
        const swapped = calculateContrastRatio(colorB, colorA);
        expect(swapped).toBeCloseTo(ratio, 10);
      }),
      { numRuns: 200 }
    );
  });
});

function rgbToHex(c: RGBColor): string {
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

// Feature: wcag-accessibility-checker, Property 9
describe('Property 9: Contrast Threshold Detection', () => {
  test('reports a warning whenever the independently-calculated ratio is below the applicable threshold', () => {
    fc.assert(
      fc.property(rgbColorArbitrary, rgbColorArbitrary, fc.boolean(), (fg, bg, isLarge) => {
        const ratio = referenceContrastRatio(fg, bg);
        const threshold = isLarge ? 3.0 : 4.5;

        const styleExtra = isLarge ? ' font-size: 18pt; font-weight: bold;' : '';
        const html = `<p style="color: ${rgbToHex(fg)}; background-color: ${rgbToHex(bg)};${styleExtra}">x</p>`;
        const doc = parseHTML(html);
        const violations = new ColorContrastValidator().validate(doc);

        if (ratio < threshold) {
          expect(violations.length).toBe(1);
          expect(violations[0]?.severity).toBe('warning');
        } else {
          expect(violations.length).toBe(0);
        }
      }),
      { numRuns: 200 }
    );
  });
});

import { describe, test, expect } from 'vitest';
import { parseHTML } from '../src/parser/html-parser.js';
import {
  ColorContrastValidator,
  calculateLuminance,
  calculateContrastRatio,
  parseColor,
} from '../src/validators/color-contrast.js';

describe('parseColor', () => {
  test('parses a 6-digit hex color', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('parses a 3-digit hex color', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('parses an rgb() color', () => {
    expect(parseColor('rgb(0, 128, 255)')).toEqual({ r: 0, g: 128, b: 255 });
  });

  test('parses an rgba() color, ignoring alpha', () => {
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30 });
  });

  test('returns undefined for an unsupported format', () => {
    expect(parseColor('red')).toBeUndefined();
    expect(parseColor('hsl(0, 100%, 50%)')).toBeUndefined();
  });
});

describe('calculateLuminance / calculateContrastRatio (known values)', () => {
  test('white has luminance 1 and black has luminance 0', () => {
    expect(calculateLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
    expect(calculateLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
  });

  test('black-on-white contrast ratio is 21:1 (maximum)', () => {
    const ratio = calculateContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  test('identical colors have a contrast ratio of 1:1 (minimum)', () => {
    const ratio = calculateContrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 });
    expect(ratio).toBeCloseTo(1, 5);
  });
});

describe('ColorContrastValidator (unit tests)', () => {
  const validator = new ColorContrastValidator();

  test('reports a warning for insufficient contrast on normal text', () => {
    // Light gray on white: well below 4.5:1
    const doc = parseHTML('<p style="color: #cccccc; background-color: #ffffff;">Low contrast</p>');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('warning');
    expect(violations[0]?.wcag).toBe('1.4.3');
  });

  test('reports a warning for insufficient contrast on large bold text (below 3:1)', () => {
    const doc = parseHTML(
      '<p style="color: #999999; background-color: #ffffff; font-size: 18pt; font-weight: bold;">Large low contrast</p>'
    );
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.issue).toContain('large text');
  });

  test('does not report a violation for sufficient contrast (black on white)', () => {
    const doc = parseHTML('<p style="color: #000000; background-color: #ffffff;">High contrast</p>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('skips elements missing background-color', () => {
    const doc = parseHTML('<p style="color: #cccccc;">No background specified</p>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('skips elements with unparseable color values', () => {
    const doc = parseHTML('<p style="color: red; background-color: white;">Named colors</p>');
    expect(validator.validate(doc)).toHaveLength(0);
  });
});

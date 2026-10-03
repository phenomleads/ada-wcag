import { describe, test, expect } from 'vitest';
import { parseHTML } from '../src/parser/html-parser.js';
import { ImageAltValidator } from '../src/validators/image-alt.js';

describe('ImageAltValidator (unit tests)', () => {
  const validator = new ImageAltValidator();

  test('reports an error for an <img> missing the alt attribute', () => {
    const doc = parseHTML('<img src="photo.jpg">');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('error');
    expect(violations[0]?.wcag).toBe('1.1.1');
    expect(violations[0]?.fix).toBe('Add alt attribute (use alt="" for decorative images)');
  });

  test('does not report a violation for alt="" (decorative image)', () => {
    const doc = parseHTML('<img src="spacer.gif" alt="">');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('does not report a violation for descriptive alt text', () => {
    const doc = parseHTML('<img src="logo.png" alt="Company logo">');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('handles multiple images independently', () => {
    const doc = parseHTML(
      '<img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="Describes c">'
    );
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.element).toBe('<img>');
  });

  test('returns an empty array for a document with no images', () => {
    const doc = parseHTML('<div><p>No images here</p></div>');
    expect(validator.validate(doc)).toHaveLength(0);
  });
});

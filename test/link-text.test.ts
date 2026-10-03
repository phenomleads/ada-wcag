import { describe, test, expect } from 'vitest';
import { parseHTML } from '../src/parser/html-parser.js';
import { LinkTextValidator } from '../src/validators/link-text.js';

describe('LinkTextValidator (unit tests)', () => {
  const validator = new LinkTextValidator();

  test('accepts a link with descriptive text', () => {
    const doc = parseHTML('<a href="/pricing">View pricing plans</a>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('reports a warning for non-descriptive text "click here"', () => {
    const doc = parseHTML('<a href="/pricing">Click here</a>');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('warning');
    expect(violations[0]?.wcag).toBe('2.4.4');
    expect(violations[0]?.issue).toContain("'Click here'");
  });

  test('reports an error for a link with no text and no aria labeling', () => {
    const doc = parseHTML('<a href="/pricing"></a>');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('error');
    expect(violations[0]?.issue).toBe('Link has no accessible text');
  });

  test('accepts a link whose only content is an <img alt="...">', () => {
    const doc = parseHTML('<a href="/"><img src="logo.png" alt="Home"></a>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('accepts a link with no visible text but a non-empty aria-label', () => {
    const doc = parseHTML('<a href="/" aria-label="Go to homepage"></a>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('accepts a link with a valid aria-labelledby reference', () => {
    const doc = parseHTML('<span id="lbl">Homepage</span><a href="/" aria-labelledby="lbl"></a>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('flags each of the known non-descriptive phrases', () => {
    const phrases = ['click here', 'read more', 'here', 'link', 'more', 'click', 'read this'];
    for (const phrase of phrases) {
      const doc = parseHTML(`<a href="/x">${phrase}</a>`);
      const violations = validator.validate(doc);
      expect(violations, `phrase "${phrase}" should be flagged`).toHaveLength(1);
      expect(violations[0]?.severity).toBe('warning');
    }
  });

  test('ignores <a> elements without an href attribute', () => {
    const doc = parseHTML('<a name="anchor"></a>');
    expect(validator.validate(doc)).toHaveLength(0);
  });
});

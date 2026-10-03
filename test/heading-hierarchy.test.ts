import { describe, test, expect } from 'vitest';
import { parseHTML } from '../src/parser/html-parser.js';
import { HeadingHierarchyValidator } from '../src/validators/heading-hierarchy.js';

describe('HeadingHierarchyValidator (unit tests)', () => {
  const validator = new HeadingHierarchyValidator();

  test('reports no violations for a valid sequential hierarchy [h1, h2, h3]', () => {
    const doc = parseHTML('<h1>A</h1><h2>B</h2><h3>C</h3>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('reports a warning when the first heading is not h1', () => {
    const doc = parseHTML('<h2>A</h2><h3>B</h3>');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('warning');
    expect(violations[0]?.wcag).toBe('1.3.1');
    expect(violations[0]?.issue).toContain('First heading should be <h1>');
  });

  test('reports a warning when a heading level is skipped [h1, h2, h4]', () => {
    const doc = parseHTML('<h1>A</h1><h2>B</h2><h4>C</h4>');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('warning');
    expect(violations[0]?.issue).toContain('Heading level skipped from <h2> to <h4>');
  });

  test('allows multiple headings of the same level consecutively [h1, h2, h2, h3]', () => {
    const doc = parseHTML('<h1>A</h1><h2>B</h2><h2>C</h2><h3>D</h3>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('allows decreasing heading levels without flagging a skip', () => {
    const doc = parseHTML('<h1>A</h1><h3>B</h3><h2>C</h2>');
    // h1 -> h3 is a skip (warning), but h3 -> h2 is a decrease (not a skip)
    const violations = validator.validate(doc);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.issue).toContain('skipped from <h1> to <h3>');
  });

  test('returns an empty array when there are no headings', () => {
    const doc = parseHTML('<div><p>No headings</p></div>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('reports both a non-h1-first warning and a skip warning when both occur', () => {
    const doc = parseHTML('<h2>A</h2><h4>B</h4>');
    const violations = validator.validate(doc);
    expect(violations).toHaveLength(2);
  });
});

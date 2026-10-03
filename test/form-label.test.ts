import { describe, test, expect } from 'vitest';
import { parseHTML } from '../src/parser/html-parser.js';
import { FormLabelValidator } from '../src/validators/form-label.js';

describe('FormLabelValidator (unit tests)', () => {
  const validator = new FormLabelValidator();

  test('accepts an input with an explicit label (for=id)', () => {
    const doc = parseHTML('<label for="name">Name</label><input id="name" type="text">');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('accepts an input implicitly nested inside a label', () => {
    const doc = parseHTML('<label>Name <input type="text"></label>');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('accepts an input with a non-empty aria-label', () => {
    const doc = parseHTML('<input type="text" aria-label="Search">');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('accepts an input with a valid aria-labelledby reference', () => {
    const doc = parseHTML('<span id="lbl">Search</span><input type="text" aria-labelledby="lbl">');
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('reports an error for a completely unlabeled input', () => {
    const doc = parseHTML('<input type="text">');
    const violations = validator.validate(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.severity).toBe('error');
    expect(violations[0]?.wcag).toBe('1.3.1');
    expect(violations[0]?.fix).toBe('Add associated label element or aria-label attribute');
  });

  test('reports an error for an unlabeled textarea', () => {
    const doc = parseHTML('<textarea></textarea>');
    expect(validator.validate(doc)).toHaveLength(1);
  });

  test('reports an error for an unlabeled select', () => {
    const doc = parseHTML('<select><option>A</option></select>');
    expect(validator.validate(doc)).toHaveLength(1);
  });

  test('skips excluded input types even when unlabeled', () => {
    const doc = parseHTML(
      '<input type="hidden"><input type="submit"><input type="button"><input type="reset"><input type="image">'
    );
    expect(validator.validate(doc)).toHaveLength(0);
  });

  test('does not match an aria-labelledby referencing a non-existent id', () => {
    const doc = parseHTML('<input type="text" aria-labelledby="missing">');
    expect(validator.validate(doc)).toHaveLength(1);
  });

  test('does not match an empty aria-label', () => {
    const doc = parseHTML('<input type="text" aria-label="">');
    expect(validator.validate(doc)).toHaveLength(1);
  });
});

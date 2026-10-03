import { describe, test, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { parseHTML } from '../src/parser/html-parser.js';
import { registerValidator, clearValidators, runValidators } from '../src/validators/engine.js';
import type { ParsedDocument, Validator, Violation } from '../src/types/index.js';
import { htmlDocumentArbitrary } from './arbitraries.js';

/**
 * A minimal, pure, deterministic validator used only to exercise the
 * engine's aggregation and determinism guarantees (Property 2). It
 * follows the validator-pattern steering: readonly name/wcagCriterion,
 * pure validate(), no shared mutable state.
 */
class StubDivValidator implements Validator {
  readonly name = 'StubDivValidator';
  readonly wcagCriterion = '0.0.0'; // not a real criterion; test-only stub

  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];
    $('div').each((_, elem) => {
      violations.push({
        wcag: this.wcagCriterion,
        severity: 'warning',
        element: '<div>',
        issue: 'stub violation for determinism testing',
        line: elem.sourceCodeLocation?.startLine,
        fix: 'n/a (test stub)',
      });
    });
    return violations;
  }
}

class StubSpanValidator implements Validator {
  readonly name = 'StubSpanValidator';
  readonly wcagCriterion = '0.0.1';

  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];
    $('span').each((_, elem) => {
      violations.push({
        wcag: this.wcagCriterion,
        severity: 'error',
        element: '<span>',
        issue: 'stub violation for determinism testing',
        line: elem.sourceCodeLocation?.startLine,
        fix: 'n/a (test stub)',
      });
    });
    return violations;
  }
}

// Feature: wcag-accessibility-checker, Property 2
describe('Property 2: Validator Determinism', () => {
  beforeEach(() => {
    clearValidators();
    registerValidator(new StubDivValidator());
    registerValidator(new StubSpanValidator());
  });

  test('running runValidators twice on the same document yields identical results', () => {
    fc.assert(
      fc.property(htmlDocumentArbitrary(2), (html) => {
        const doc = parseHTML(html);
        const firstRun = runValidators(doc);
        const secondRun = runValidators(doc);

        expect(secondRun).toEqual(firstRun);
      }),
      { numRuns: 100 }
    );
  });

  test('a single validator run twice on the same document yields identical results', () => {
    fc.assert(
      fc.property(htmlDocumentArbitrary(2), (html) => {
        const doc = parseHTML(html);
        const validator = new StubDivValidator();

        const first = validator.validate(doc);
        const second = validator.validate(doc);

        expect(second).toEqual(first);
      }),
      { numRuns: 100 }
    );
  });
});

describe('runValidators (engine behavior)', () => {
  beforeEach(() => {
    clearValidators();
  });

  test('aggregates violations from multiple registered validators', () => {
    registerValidator(new StubDivValidator());
    registerValidator(new StubSpanValidator());

    const doc = parseHTML('<div></div><span></span><div></div>');
    const violations = runValidators(doc);

    expect(violations).toHaveLength(3);
    expect(violations.filter((v) => v.wcag === '0.0.0')).toHaveLength(2);
    expect(violations.filter((v) => v.wcag === '0.0.1')).toHaveLength(1);
  });

  test('skips a validator that throws and still runs the others', () => {
    class ThrowingValidator implements Validator {
      readonly name = 'ThrowingValidator';
      readonly wcagCriterion = '0.0.2';
      validate(): Violation[] {
        throw new Error('simulated validator failure');
      }
    }

    registerValidator(new ThrowingValidator());
    registerValidator(new StubDivValidator());

    const doc = parseHTML('<div></div>');
    const violations = runValidators(doc);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.wcag).toBe('0.0.0');
  });

  test('returns an empty array when no validators are registered', () => {
    const doc = parseHTML('<div></div>');
    expect(runValidators(doc)).toEqual([]);
  });
});

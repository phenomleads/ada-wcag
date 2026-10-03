import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseHTML } from '../src/parser/html-parser.js';
import { FormLabelValidator } from '../src/validators/form-label.js';
import { safeToken } from './arbitraries.js';

type LabelMethod = 'none' | 'explicit' | 'implicit' | 'aria-label' | 'aria-labelledby';

interface ControlSpec {
  tag: 'input' | 'textarea' | 'select';
  type: 'text' | 'hidden' | 'submit' | 'button' | 'reset' | 'image';
  id: string;
  labelMethod: LabelMethod;
}

const controlSpecArbitrary = fc.record({
  tag: fc.constantFrom<'input' | 'textarea' | 'select'>('input', 'textarea', 'select'),
  type: fc.constantFrom<'text' | 'hidden' | 'submit' | 'button' | 'reset' | 'image'>(
    'text',
    'hidden',
    'submit',
    'button',
    'reset',
    'image'
  ),
  id: safeToken(),
  labelMethod: fc.constantFrom<LabelMethod>('none', 'explicit', 'implicit', 'aria-label', 'aria-labelledby'),
});

const EXCLUDED_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

/** Renders one control (plus any associated label markup) to an HTML fragment. */
function renderControl(spec: ControlSpec): string {
  const typeAttr = spec.tag === 'input' ? ` type="${spec.type}"` : '';
  const idAttr = ` id="${spec.id}"`;

  let openTag: string;
  let closeTag: string;
  if (spec.tag === 'select') {
    openTag = `<select${idAttr}>`;
    closeTag = '</select>';
  } else if (spec.tag === 'textarea') {
    openTag = `<textarea${idAttr}>`;
    closeTag = '</textarea>';
  } else {
    openTag = `<input${idAttr}${typeAttr}>`;
    closeTag = '';
  }

  switch (spec.labelMethod) {
    case 'none':
      return `${openTag}${closeTag}`;
    case 'explicit':
      return `<label for="${spec.id}">L</label>${openTag}${closeTag}`;
    case 'implicit':
      return `<label>L ${openTag}${closeTag}</label>`;
    case 'aria-label': {
      const withAria = openTag.replace('>', ' aria-label="L">');
      return `${withAria}${closeTag}`;
    }
    case 'aria-labelledby': {
      const refId = `${spec.id}ref`;
      const withAria = openTag.replace('>', ` aria-labelledby="${refId}">`);
      return `<span id="${refId}">L</span>${withAria}${closeTag}`;
    }
  }
}

// Feature: wcag-accessibility-checker, Property 6
describe('Property 6: Form Label Completeness', () => {
  test('flags exactly the non-excluded controls with labelMethod "none"', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(controlSpecArbitrary, {
          minLength: 0,
          maxLength: 12,
          selector: (c) => c.id,
        }),
        (controls) => {
          const html = `<html><body>${controls.map(renderControl).join('')}</body></html>`;
          const doc = parseHTML(html);

          // Independent oracle: a control is expected to violate only if
          // it is validation-eligible (textarea/select are always
          // eligible; input is only eligible if its type is not in the
          // excluded set, since type only applies to <input>) AND its
          // labelMethod is 'none'. This does not call the validator's
          // isLabeled logic.
          const expectedViolationCount = controls.filter((c) => {
            const isEligible = c.tag !== 'input' || !EXCLUDED_TYPES.has(c.type);
            return isEligible && c.labelMethod === 'none';
          }).length;

          const violations = new FormLabelValidator().validate(doc);

          expect(violations.length).toBe(expectedViolationCount);
          expect(violations.every((v) => v.wcag === '1.3.1')).toBe(true);
          expect(violations.every((v) => v.severity === 'error')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

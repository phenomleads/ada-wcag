import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseHTML } from '../src/parser/html-parser.js';
import { LinkTextValidator } from '../src/validators/link-text.js';
import { safeToken } from './arbitraries.js';

interface LinkSpec {
  hasVisibleText: boolean;
  hasImgAlt: boolean;
  hasAriaLabel: boolean;
  hasAriaLabelledBy: boolean;
  id: string;
}

const linkSpecArbitrary = fc.record({
  hasVisibleText: fc.boolean(),
  hasImgAlt: fc.boolean(),
  hasAriaLabel: fc.boolean(),
  hasAriaLabelledBy: fc.boolean(),
  id: safeToken(),
});

/** Renders one link (plus any aria-labelledby target) to an HTML fragment. */
function renderLink(spec: LinkSpec): string {
  const parts: string[] = [];
  let aHref = `<a href="/${spec.id}"`;

  if (spec.hasAriaLabel) {
    aHref += ' aria-label="Descriptive label"';
  }
  if (spec.hasAriaLabelledBy) {
    const refId = `${spec.id}ref`;
    parts.push(`<span id="${refId}">Descriptive label</span>`);
    aHref += ` aria-labelledby="${refId}"`;
  }
  aHref += '>';

  const inner: string[] = [];
  if (spec.hasVisibleText) {
    inner.push('Some descriptive text that is not in the banned phrase list');
  }
  if (spec.hasImgAlt) {
    inner.push('<img src="x.png" alt="Descriptive image text">');
  }

  parts.push(`${aHref}${inner.join('')}</a>`);
  return parts.join('');
}

// Feature: wcag-accessibility-checker, Property 7
describe('Property 7: Link Text Detection', () => {
  test('flags exactly the links with no visible text, no img alt, no aria-label, and no aria-labelledby', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(linkSpecArbitrary, { minLength: 0, maxLength: 10, selector: (s) => s.id }),
        (links) => {
          const html = `<html><body>${links.map(renderLink).join('')}</body></html>`;
          const doc = parseHTML(html);

          // Independent oracle: a link is expected to be flagged as having
          // no accessible text if and only if none of its four text
          // sources are present, computed directly from the spec.
          const expectedNoTextCount = links.filter(
            (l) => !l.hasVisibleText && !l.hasImgAlt && !l.hasAriaLabel && !l.hasAriaLabelledBy
          ).length;

          const violations = new LinkTextValidator().validate(doc);
          const noTextViolations = violations.filter((v) => v.issue === 'Link has no accessible text');

          expect(noTextViolations.length).toBe(expectedNoTextCount);
          expect(violations.every((v) => v.wcag === '2.4.4')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

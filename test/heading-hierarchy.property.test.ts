import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { parseHTML } from '../src/parser/html-parser.js';
import { HeadingHierarchyValidator } from '../src/validators/heading-hierarchy.js';

/**
 * Renders an array of heading levels (1-6) into an HTML heading sequence,
 * wrapped in a non-empty document shell so an empty `levels` array still
 * produces parseable (non-empty) HTML.
 */
function renderHeadings(levels: number[]): string {
  const headings = levels.map((level, i) => `<h${level}>Heading ${i}</h${level}>`).join('');
  return `<div>${headings}</div>`;
}

const headingLevelArbitrary = fc.integer({ min: 1, max: 6 });

// Feature: wcag-accessibility-checker, Property 4
describe('Property 4: Heading Hierarchy Sequential Property', () => {
  test('if no violations are reported, the first heading is h1 and no level is skipped', () => {
    fc.assert(
      fc.property(fc.array(headingLevelArbitrary, { minLength: 0, maxLength: 10 }), (levels) => {
        const html = renderHeadings(levels);
        const doc = parseHTML(html);
        const violations = new HeadingHierarchyValidator().validate(doc);

        if (violations.length === 0) {
          if (levels.length === 0) {
            // Empty heading sequence: vacuously valid.
            return;
          }

          expect(levels[0]).toBe(1);
          for (let i = 1; i < levels.length; i++) {
            expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});

// Feature: wcag-accessibility-checker, Property 5
describe('Property 5: Heading Hierarchy Violation Detection', () => {
  test('a heading sequence containing an intentional level skip always produces a violation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 2, max: 6 }),
        (levelBefore, jumpSize) => {
          const skippedToLevel = levelBefore + jumpSize; // guarantees a skip (jump > 1)
          fc.pre(skippedToLevel <= 6);

          const html = renderHeadings([1, levelBefore, skippedToLevel]);
          const doc = parseHTML(html);
          const violations = new HeadingHierarchyValidator().validate(doc);

          // Independent oracle: we constructed the skip directly from the
          // input parameters, not by calling the validator.
          expect(violations.length).toBeGreaterThan(0);
          expect(
            violations.some((v) => v.issue.includes(`skipped from <h${levelBefore}> to <h${skippedToLevel}>`))
          ).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });
});

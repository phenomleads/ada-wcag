import type { ParsedDocument, Validator, Violation } from '../types/index.js';

/**
 * Validates that every <img> element has an alt attribute, per WCAG 1.1.1
 * (Non-text Content). An empty alt="" is treated as valid (decorative
 * image marker) and is never a violation, regardless of role.
 */
export class ImageAltValidator implements Validator {
  readonly name = 'ImageAltValidator';
  readonly wcagCriterion = '1.1.1';

  /**
   * Checks all <img> elements in the document for a missing alt attribute.
   *
   * @param doc - The parsed document to check.
   * @returns An array of violations for images missing the alt attribute.
   */
  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];

    $('img').each((_, elem) => {
      const $elem = $(elem);
      const alt = $elem.attr('alt');

      if (alt === undefined) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'error',
          element: '<img>',
          issue: 'Image missing alt attribute',
          line: elem.sourceCodeLocation?.startLine,
          fix: 'Add alt attribute (use alt="" for decorative images)',
        });
      }
      // alt="" (or any non-empty alt) is valid — no violation recorded.
    });

    return violations;
  }
}

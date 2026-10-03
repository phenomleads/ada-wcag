import type { ParsedDocument, Validator, Violation } from '../types/index.js';

const NON_DESCRIPTIVE_PHRASES = new Set([
  'click here',
  'read more',
  'here',
  'link',
  'more',
  'click',
  'read this',
]);

/**
 * Validates that link text is descriptive, per WCAG 2.4.4 (Link Purpose
 * In Context). A link's accessible text is its visible text content, plus
 * any nested <img alt="..."> text, plus aria-label/aria-labelledby.
 */
export class LinkTextValidator implements Validator {
  readonly name = 'LinkTextValidator';
  readonly wcagCriterion = '2.4.4';

  /**
   * Checks all <a href> elements for accessible text, and flags
   * non-descriptive text as a warning.
   *
   * @param doc - The parsed document to check.
   * @returns An array of violations for links with no or non-descriptive accessible text.
   */
  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];

    $('a[href]').each((_, elem) => {
      const $elem = $(elem);
      const visibleText = $elem.text().trim();
      const imgAltText = $elem
        .find('img[alt]')
        .toArray()
        .map((img) => $(img).attr('alt') ?? '')
        .join(' ')
        .trim();
      const ariaLabel = $elem.attr('aria-label');
      const ariaLabelledBy = $elem.attr('aria-labelledby');

      const combinedText = [visibleText, imgAltText].filter((s) => s.length > 0).join(' ');
      const hasAriaLabel = ariaLabel !== undefined && ariaLabel.trim().length > 0;
      const hasAriaLabelledBy =
        ariaLabelledBy !== undefined &&
        ariaLabelledBy
          .split(/\s+/)
          .filter((s) => s.length > 0)
          .some((refId) => $(`#${refId}`).length > 0);

      if (combinedText.length === 0 && !hasAriaLabel && !hasAriaLabelledBy) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'error',
          element: '<a>',
          issue: 'Link has no accessible text',
          line: elem.sourceCodeLocation?.startLine,
          fix: 'Use descriptive link text indicating destination',
        });
        return;
      }

      if (combinedText.length > 0 && NON_DESCRIPTIVE_PHRASES.has(combinedText.toLowerCase())) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'warning',
          element: '<a>',
          issue: `Link text is not descriptive: '${combinedText}'`,
          line: elem.sourceCodeLocation?.startLine,
          fix: 'Use descriptive link text indicating destination',
        });
      }
    });

    return violations;
  }
}

import type { Element } from 'domhandler';
import type { ParsedDocument, Validator, Violation } from '../types/index.js';

const EXCLUDED_INPUT_TYPES = ['hidden', 'submit', 'button', 'reset', 'image'];

const FORM_CONTROL_SELECTOR = EXCLUDED_INPUT_TYPES.map((t) => `:not([type="${t}"])`).reduce(
  (sel, exclusion) => `${sel}${exclusion}`,
  'input'
);

/**
 * Validates that every form control has an associated accessible label,
 * per WCAG 1.3.1 (Info and Relationships). Checks <input> (excluding
 * type="hidden"/"submit"/"button"/"reset"/"image", which get their
 * accessible name from value/alt instead), <textarea>, and <select>.
 */
export class FormLabelValidator implements Validator {
  readonly name = 'FormLabelValidator';
  readonly wcagCriterion = '1.3.1';

  /**
   * Checks all applicable form controls for an associated label (explicit
   * for=id, implicit nesting, aria-label, or valid aria-labelledby).
   *
   * @param doc - The parsed document to check.
   * @returns An array of violations for unlabeled form controls.
   */
  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];

    $(`${FORM_CONTROL_SELECTOR}, textarea, select`).each((_, node) => {
      const elem = node as Element;
      const $elem = $(elem);

      if (this.isLabeled($, $elem)) {
        return;
      }

      violations.push({
        wcag: this.wcagCriterion,
        severity: 'error',
        element: `<${elem.tagName}>`,
        issue: 'Form control lacks associated label',
        line: elem.sourceCodeLocation?.startLine,
        fix: 'Add associated label element or aria-label attribute',
      });
    });

    return violations;
  }

  private isLabeled($: ParsedDocument['$'], $elem: ReturnType<ParsedDocument['$']>): boolean {
    const id = $elem.attr('id');

    // Explicit label via for="id".
    if (id !== undefined && $(`label[for="${id}"]`).length > 0) {
      return true;
    }

    // Implicit label via nesting inside <label>.
    if ($elem.closest('label').length > 0) {
      return true;
    }

    // aria-label (non-empty).
    const ariaLabel = $elem.attr('aria-label');
    if (ariaLabel !== undefined && ariaLabel.trim().length > 0) {
      return true;
    }

    // aria-labelledby referencing an existing element.
    const labelledBy = $elem.attr('aria-labelledby');
    if (labelledBy !== undefined) {
      const ids = labelledBy.split(/\s+/).filter((s) => s.length > 0);
      if (ids.some((refId) => $(`#${refId}`).length > 0)) {
        return true;
      }
    }

    return false;
  }
}

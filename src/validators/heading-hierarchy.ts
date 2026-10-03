import type { Element } from 'domhandler';
import type { ParsedDocument, Validator, Violation } from '../types/index.js';

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * Validates heading hierarchy structure, per WCAG 1.3.1 (Info and
 * Relationships). The first heading should be <h1>, and heading levels
 * should not skip (e.g. h2 directly to h4). Both conditions are flagged
 * as warnings (not errors) — this is a tool-chosen severity, not a hard
 * WCAG 1.3.1 failure mode.
 */
export class HeadingHierarchyValidator implements Validator {
  readonly name = 'HeadingHierarchyValidator';
  readonly wcagCriterion = '1.3.1';

  /**
   * Checks heading elements in document order for a non-h1 first heading
   * and for level skips between consecutive headings.
   *
   * @param doc - The parsed document to check.
   * @returns An array of warnings for heading hierarchy issues.
   */
  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];

    const headings = $(HEADING_TAGS.join(', ')).toArray() as Element[];

    if (headings.length === 0) {
      return violations;
    }

    const levels = headings.map((h) => parseInt(h.tagName.slice(1), 10));

    if (levels[0] !== 1) {
      violations.push({
        wcag: this.wcagCriterion,
        severity: 'warning',
        element: `<${headings[0]!.tagName}>`,
        issue: `First heading should be <h1>, found <h${levels[0]}>`,
        line: headings[0]!.sourceCodeLocation?.startLine,
        fix: 'Adjust heading level to maintain sequential hierarchy',
      });
    }

    for (let i = 1; i < levels.length; i++) {
      const currentLevel = levels[i]!;
      const previousLevel = levels[i - 1]!;

      if (currentLevel > previousLevel + 1) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'warning',
          element: `<${headings[i]!.tagName}>`,
          issue: `Heading level skipped from <h${previousLevel}> to <h${currentLevel}>`,
          line: headings[i]!.sourceCodeLocation?.startLine,
          fix: 'Adjust heading level to maintain sequential hierarchy',
        });
      }
    }

    return violations;
  }
}

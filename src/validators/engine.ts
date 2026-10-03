import type { ParsedDocument, Validator, Violation } from '../types/index.js';

const validators: Validator[] = [];

/**
 * Registers a validator with the engine's plugin-style registry, enabling
 * new WCAG checks to be added without modifying runValidators().
 * WCAG Criterion: supports extensible validator orchestration (Requirement 4-8).
 *
 * @param validator - The validator instance to register.
 */
export function registerValidator(validator: Validator): void {
  validators.push(validator);
}

/**
 * Removes all registered validators. Intended for test isolation between
 * suites that register their own validator sets.
 */
export function clearValidators(): void {
  validators.length = 0;
}

/**
 * Runs every registered WCAG validator against a parsed document and
 * aggregates their violations into a single array. A validator that
 * throws is logged and skipped so one failing check does not prevent the
 * others from running.
 * WCAG Criterion: orchestrates all validation checks (Requirements 4.1, 5.1, 6.1, 7.1, 8.1).
 *
 * @param doc - The parsed HTML document to validate.
 * @returns An array of all violations found across every validator.
 */
export function runValidators(doc: ParsedDocument): Violation[] {
  const allViolations: Violation[] = [];

  for (const validator of validators) {
    try {
      const violations = validator.validate(doc);
      allViolations.push(...violations);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`Validator "${validator.name}" threw an error and was skipped: ${reason}`);
    }
  }

  return allViolations;
}

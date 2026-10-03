import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { generateReport, generateSummary } from '../src/report/generator.js';
import type { Violation, Severity } from '../src/types/index.js';
import { safeToken } from './arbitraries.js';

const severityArbitrary: fc.Arbitrary<Severity> = fc.constantFrom('error', 'warning');

const violationArbitrary: fc.Arbitrary<Violation> = fc.record({
  wcag: fc.constantFrom('1.1.1', '1.3.1', '1.4.3', '2.4.4'),
  severity: severityArbitrary,
  element: fc.constantFrom('<img>', '<input>', '<a>', '<p>'),
  issue: safeToken(),
  fix: safeToken(),
  line: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
});

// Feature: wcag-accessibility-checker, Property 10
describe('Property 10: Report Structure Invariants', () => {
  test('metadata counts and WCAG grouping are always internally consistent', () => {
    fc.assert(
      fc.property(fc.array(violationArbitrary, { minLength: 0, maxLength: 30 }), (violations) => {
        const report = generateReport(violations, { source: 'test', timestamp: '2026-01-01T00:00:00Z' });

        // Independent oracle: recompute expected counts directly from the
        // input array, not by inspecting the report's own fields.
        const expectedErrorCount = violations.filter((v) => v.severity === 'error').length;
        const expectedWarningCount = violations.filter((v) => v.severity === 'warning').length;

        expect(report.metadata.totalViolations).toBe(violations.length);
        expect(report.metadata.errorCount).toBe(expectedErrorCount);
        expect(report.metadata.warningCount).toBe(expectedWarningCount);

        // Every violation appears in exactly one violationsByWCAG group.
        const totalGrouped = Object.values(report.violationsByWCAG).reduce(
          (sum, group) => sum + group.length,
          0
        );
        expect(totalGrouped).toBe(violations.length);

        for (const violation of violations) {
          const group = report.violationsByWCAG[violation.wcag];
          expect(group).toBeDefined();
          expect(group).toContain(violation);
        }
      }),
      { numRuns: 200 }
    );
  });
});

// Feature: wcag-accessibility-checker, Property 11
describe('Property 11: Violation Count Summary Correctness', () => {
  test('the human-readable summary text contains the correct counts', () => {
    fc.assert(
      fc.property(fc.array(violationArbitrary, { minLength: 0, maxLength: 30 }), (violations) => {
        const report = generateReport(violations, { source: 'test', timestamp: '2026-01-01T00:00:00Z' });
        const summary = generateSummary(report);

        // Independent oracle: recompute expected counts from the input,
        // then check the summary text contains them, rather than parsing
        // the summary and comparing to report.metadata (which would be
        // tautological).
        const expectedTotal = violations.length;
        const expectedErrors = violations.filter((v) => v.severity === 'error').length;
        const expectedWarnings = violations.filter((v) => v.severity === 'warning').length;

        expect(summary).toContain(
          `Total Violations: ${expectedTotal} (${expectedErrors} errors, ${expectedWarnings} warnings)`
        );

        const criteriaPresent = new Set(violations.map((v) => v.wcag));
        for (const criterion of criteriaPresent) {
          const expectedCount = violations.filter((v) => v.wcag === criterion).length;
          expect(summary).toContain(`${criterion}: ${expectedCount} violation`);
        }
      }),
      { numRuns: 200 }
    );
  });
});

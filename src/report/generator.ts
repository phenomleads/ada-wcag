import { writeFile } from 'node:fs/promises';
import { FileWriteError, type AccessibilityReport, type ReportMetadata, type Violation } from '../types/index.js';

/**
 * Aggregates a list of violations and report metadata into a complete
 * AccessibilityReport structure, per WCAG reporting Requirements 10.1-10.3.
 * Computes error/warning counts and groups violations by WCAG criterion.
 *
 * @param violations - All violations detected across every validator.
 * @param metadata - Source and timestamp metadata for this report.
 * @returns A complete AccessibilityReport.
 */
export function generateReport(violations: Violation[], metadata: ReportMetadata): AccessibilityReport {
  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;

  const violationsByWCAG: Record<string, Violation[]> = {};
  for (const violation of violations) {
    const group = violationsByWCAG[violation.wcag];
    if (group === undefined) {
      violationsByWCAG[violation.wcag] = [violation];
    } else {
      group.push(violation);
    }
  }

  return {
    metadata: {
      source: metadata.source,
      timestamp: metadata.timestamp,
      totalViolations: violations.length,
      errorCount,
      warningCount,
    },
    violations,
    violationsByWCAG,
  };
}

/**
 * Generates a human-readable summary of an AccessibilityReport, including
 * violation counts by severity and by WCAG criterion, per Requirement 10.6.
 *
 * @param report - The complete report to summarize.
 * @returns A formatted, human-readable summary string.
 */
export function generateSummary(report: AccessibilityReport): string {
  const { metadata, violationsByWCAG } = report;
  const lines: string[] = [];

  lines.push('WCAG 2.1 Level AA Accessibility Report');
  lines.push(`Source: ${metadata.source}`);
  lines.push(`Generated: ${metadata.timestamp}`);
  lines.push('');
  lines.push(
    `Total Violations: ${metadata.totalViolations} (${metadata.errorCount} errors, ${metadata.warningCount} warnings)`
  );
  lines.push('');
  lines.push('Violations by WCAG Criterion:');

  const criteria = Object.keys(violationsByWCAG).sort((a, b) => a.localeCompare(b));
  for (const criterion of criteria) {
    const count = violationsByWCAG[criterion]!.length;
    lines.push(`  ${criterion}: ${count} violation${count === 1 ? '' : 's'}`);
  }

  lines.push('');
  if (metadata.errorCount > 0) {
    lines.push(`\u274c Accessibility check failed (${metadata.errorCount} errors)`);
  } else if (metadata.warningCount > 0) {
    lines.push(`\u26a0\ufe0f  Accessibility check passed with warnings (${metadata.warningCount} warnings)`);
  } else {
    lines.push('\u2705 Accessibility check passed');
  }

  return lines.join('\n');
}

/**
 * Writes an AccessibilityReport as JSON to a file, or to stdout if no
 * output path is given, per Requirements 10.4-10.5.
 *
 * @param report - The report to write.
 * @param outputPath - File path to write to, or undefined for stdout.
 * @throws FileWriteError if writing to outputPath fails (permissions, disk space, etc).
 */
export async function writeReport(report: AccessibilityReport, outputPath?: string): Promise<void> {
  const json = JSON.stringify(report, null, 2);

  if (outputPath === undefined) {
    console.log(json);
    return;
  }

  try {
    await writeFile(outputPath, json, 'utf-8');
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new FileWriteError(outputPath, reason);
  }
}

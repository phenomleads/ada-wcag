import { describe, test, expect, afterEach } from 'vitest';
import { unlink } from 'node:fs/promises';
import { generateReport, generateSummary, writeReport } from '../src/report/generator.js';
import { FileWriteError, type Violation } from '../src/types/index.js';

describe('generateReport / generateSummary (unit tests)', () => {
  test('produces a status footer appropriate to error/warning/pass states', () => {
    const errorViolation: Violation = {
      wcag: '1.1.1',
      severity: 'error',
      element: '<img>',
      issue: 'missing alt',
      fix: 'add alt',
    };
    const warningViolation: Violation = {
      wcag: '1.3.1',
      severity: 'warning',
      element: '<h2>',
      issue: 'heading skip',
      fix: 'fix hierarchy',
    };

    const errorReport = generateReport([errorViolation], { source: 's', timestamp: 't' });
    expect(generateSummary(errorReport)).toContain('Accessibility check failed');

    const warningReport = generateReport([warningViolation], { source: 's', timestamp: 't' });
    expect(generateSummary(warningReport)).toContain('passed with warnings');

    const passReport = generateReport([], { source: 's', timestamp: 't' });
    expect(generateSummary(passReport)).toContain('Accessibility check passed');
    expect(generateSummary(passReport)).not.toContain('with warnings');
  });
});

describe('writeReport (unit tests)', () => {
  const tmpPath = './test/.tmp-report.json';

  afterEach(async () => {
    try {
      await unlink(tmpPath);
    } catch {
      // ignore if not created
    }
  });

  test('writes a valid JSON report to the given file path', async () => {
    const report = generateReport([], { source: 's', timestamp: 't' });
    await writeReport(report, tmpPath);

    const { readFile } = await import('node:fs/promises');
    const content = await readFile(tmpPath, 'utf-8');
    expect(JSON.parse(content)).toEqual(report);
  });

  test('throws FileWriteError for an unwritable path', async () => {
    const report = generateReport([], { source: 's', timestamp: 't' });
    await expect(writeReport(report, '/nonexistent-dir-xyz/report.json')).rejects.toBeInstanceOf(
      FileWriteError
    );
  });
});

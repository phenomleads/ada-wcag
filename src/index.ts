import { readFile } from 'node:fs/promises';
import { fetchHTML } from './mcp/client.js';
import { parseHTML, prettyPrint } from './parser/html-parser.js';
import { registerValidator, runValidators } from './validators/engine.js';
import { ImageAltValidator } from './validators/image-alt.js';
import { FormLabelValidator } from './validators/form-label.js';
import { HeadingHierarchyValidator } from './validators/heading-hierarchy.js';
import { LinkTextValidator } from './validators/link-text.js';
import { ColorContrastValidator } from './validators/color-contrast.js';
import { generateReport, generateSummary, writeReport } from './report/generator.js';
import type { CLIOptions, AccessibilityReport } from './types/index.js';

let validatorsRegistered = false;

/**
 * Registers the five WCAG validators with the engine exactly once per
 * process. Safe to call multiple times (e.g. across multiple runs() in
 * tests) without duplicating registrations.
 */
function ensureValidatorsRegistered(): void {
  if (validatorsRegistered) {
    return;
  }
  registerValidator(new ImageAltValidator());
  registerValidator(new FormLabelValidator());
  registerValidator(new HeadingHierarchyValidator());
  registerValidator(new LinkTextValidator());
  registerValidator(new ColorContrastValidator());
  validatorsRegistered = true;
}

/**
 * Runs the full accessibility-checking pipeline: fetch (URL) or read
 * (file) -> parse -> validate -> generate report -> write report. This is
 * the orchestrator invoked by the CLI entry point (src/cli.ts).
 * WCAG Criterion: coordinates all WCAG checks end-to-end (Requirements 1-11).
 *
 * @param options - Validated CLI options (exactly one of url/file is set).
 * @returns The complete AccessibilityReport.
 * @throws MCPConnectionError, MCPFetchError, ParseError, or FileWriteError
 *   depending on which pipeline stage fails.
 */
export async function run(options: CLIOptions): Promise<AccessibilityReport> {
  ensureValidatorsRegistered();

  const source = options.url ?? options.file ?? 'unknown';
  const fetchStart = Date.now();

  let html: string;
  if (options.url !== undefined) {
    const result = await fetchHTML(options.url);
    html = result.content;
    console.error(
      `Fetched ${options.url} in ${result.fetchDurationMs}ms (${result.contentSizeBytes} bytes)`
    );
  } else {
    html = await readFile(options.file!, 'utf-8');
  }
  console.error(`Content retrieval took ${Date.now() - fetchStart}ms`);

  const parseStart = Date.now();
  const doc = parseHTML(html);
  console.error(`Parsing took ${Date.now() - parseStart}ms`);

  // Round-trip sanity check (Requirement 9.6): log a warning if
  // pretty-printing and reparsing produces a structurally different
  // element count, without failing the whole run.
  try {
    const printed = prettyPrint(doc);
    const reparsed = parseHTML(printed);
    if (reparsed.$('*').length !== doc.$('*').length) {
      console.error('Warning: round-trip parsing produced a different element count.');
    }
  } catch {
    console.error('Warning: round-trip parsing check failed.');
  }

  const validateStart = Date.now();
  const violations = runValidators(doc);
  console.error(`Validation took ${Date.now() - validateStart}ms`);

  const report = generateReport(violations, {
    source,
    timestamp: new Date().toISOString(),
  });

  await writeReport(report, options.output);
  console.error(generateSummary(report));

  return report;
}

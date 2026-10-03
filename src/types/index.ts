import type { CheerioAPI } from 'cheerio';

/**
 * CLI command-line options parsed from argv, per Requirement 1.
 * Exactly one of `url` or `file` must be set (enforced by validateArguments).
 */
export interface CLIOptions {
  url?: string;
  file?: string;
  output?: string;
}

/**
 * Options controlling how parseHTML() builds the ParsedDocument.
 */
export interface ParseOptions {
  /** Enable line number tracking via cheerio's sourceCodeLocationInfo (default true). */
  sourceCodeLocationInfo?: boolean;
  /** Normalize whitespace during parsing (default false). */
  normalizeWhitespace?: boolean;
}

/**
 * A parsed HTML document wrapping cheerio's jQuery-like API.
 * Line numbers (when enabled) are available per-element via
 * `element.sourceCodeLocation?.startLine` — see getElementLine().
 */
export interface ParsedDocument {
  $: CheerioAPI;
}

/**
 * Allowed severities for a Violation. "error" = must fix, "warning" = should fix.
 * Do not introduce additional severities (see wcag-compliance steering).
 */
export type Severity = 'error' | 'warning';

/**
 * A single WCAG violation detected by a validator, per Requirement 10.2.
 */
export interface Violation {
  /** WCAG success criterion reference, e.g. "1.1.1" (Requirement 4.3). */
  wcag: string;
  severity: Severity;
  /** HTML element identifier, e.g. "<img>". */
  element: string;
  /** Human-readable description of the issue. */
  issue: string;
  /** Line number in the source HTML, if available. */
  line?: number;
  /** Suggested remediation text (use the canonical fix string per criterion). */
  fix: string;
}

/**
 * Base interface implemented by all WCAG validators (Requirement 4-8).
 * Implementations must be pure and deterministic: validate() must return
 * the same violations, in the same order, for the same ParsedDocument
 * (see validator-pattern steering and Property 2).
 */
export interface Validator {
  readonly name: string;
  readonly wcagCriterion: string;
  validate(doc: ParsedDocument): Violation[];
}

/**
 * Result of fetching a URL via the MCP fetch tool, after cleaning
 * (prefix lines and truncation/completion notices stripped), per
 * Requirements 2.5-2.9.
 */
export interface FetchResult {
  content: string;
  fetchDurationMs: number;
  contentSizeBytes: number;
}

/**
 * Metadata attached to a generated AccessibilityReport (Requirement 10.3).
 */
export interface ReportMetadata {
  /** Source URL or file path. */
  source: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

/**
 * Complete structured accessibility report produced by the report generator
 * (Requirement 10.1-10.3).
 */
export interface AccessibilityReport {
  metadata: {
    source: string;
    timestamp: string;
    totalViolations: number;
    errorCount: number;
    warningCount: number;
  };
  violations: Violation[];
  violationsByWCAG: Record<string, Violation[]>;
}

/**
 * An RGB color (0-255 per channel) used for WCAG 1.4.3 contrast calculations.
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** Relative luminance value in [0, 1], per the WCAG 2.1 contrast formula. */
export type Luminance = number;

/** WCAG contrast ratio in [1, 21]. */
export type ContrastRatio = number;

// ---------------------------------------------------------------------------
// Error classes (see error-handling steering: exit codes 1=CLI, 2=MCP,
// 3=parse, 4=file I/O). Every error must carry an actionable message.
// ---------------------------------------------------------------------------

/**
 * Thrown for invalid CLI arguments or usage errors.
 * Exit code is 1 (bad arguments) or 4 (file not found / unwritable output).
 */
export class CLIError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = 'CLIError';
    this.exitCode = exitCode;
  }
}

/**
 * Thrown when the MCP fetch server fails to launch or connect.
 * Always maps to exit code 2.
 */
export class MCPConnectionError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`MCP connection failed: ${reason}`);
    this.name = 'MCPConnectionError';
    this.reason = reason;
  }
}

/**
 * Thrown when the MCP fetch tool call fails (timeout, robots.txt disallow,
 * network error, or result.isError). Always maps to exit code 2.
 */
export class MCPFetchError extends Error {
  readonly url: string;
  readonly reason: string;

  constructor(url: string, reason: string) {
    super(`Failed to fetch ${url}: ${reason}`);
    this.name = 'MCPFetchError';
    this.url = url;
    this.reason = reason;
  }
}

/**
 * Thrown when HTML content cannot be parsed at all (empty or unparseable
 * content). Always maps to exit code 3.
 */
export class ParseError extends Error {
  readonly html: string;
  readonly reason: string;

  constructor(html: string, reason: string) {
    super(`Failed to parse HTML: ${reason}`);
    this.name = 'ParseError';
    this.html = html;
    this.reason = reason;
  }
}

/**
 * Thrown when writing the JSON report to a file fails (permissions, disk
 * space, etc). Always maps to exit code 4.
 */
export class FileWriteError extends Error {
  readonly filePath: string;
  readonly reason: string;

  constructor(filePath: string, reason: string) {
    super(`Failed to write report to ${filePath}: ${reason}`);
    this.name = 'FileWriteError';
    this.filePath = filePath;
    this.reason = reason;
  }
}

// ---------------------------------------------------------------------------
// Type guards for runtime validation of user input and external data
// (Requirement 12.6).
// ---------------------------------------------------------------------------

/**
 * Type guard verifying a string is a syntactically valid URL using only the
 * http or https scheme (security restriction, Requirement 1.2).
 *
 * @param value - The candidate URL string.
 * @returns True if value parses as a URL with scheme http: or https:.
 */
export function isAllowedUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Type guard verifying a value is a non-null object (used before accessing
 * fields on parsed JSON or external MCP tool results).
 *
 * @param value - The value to check.
 * @returns True if value is a non-null, non-array object.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard verifying a Severity string is one of the two allowed values
 * ("error" | "warning"), per the wcag-compliance steering rule against
 * inventing new severities.
 *
 * @param value - The candidate severity string.
 * @returns True if value is exactly "error" or "warning".
 */
export function isSeverity(value: unknown): value is Severity {
  return value === 'error' || value === 'warning';
}

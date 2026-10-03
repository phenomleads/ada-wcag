# Design Document: WCAG Accessibility Checker

## Overview

The WCAG Accessibility Checker is a TypeScript-based command-line tool that performs automated accessibility audits against WCAG 2.1 Level AA standards. The system fetches web content via Model Context Protocol (MCP), parses HTML into a queryable DOM structure, executes validation checks across five WCAG success criteria, and generates structured JSON reports with remediation guidance.

**Key Design Goals:**

- **Modularity**: Clear separation between CLI interface, content fetching, parsing, validation, and reporting
- **Extensibility**: Plugin-style validator architecture enabling easy addition of new WCAG checks
- **Type Safety**: Comprehensive TypeScript types throughout with strict compiler options
- **Testability**: Deterministic validators with property-based testing support for round-trip parsing and validation invariants
- **Performance**: Efficient HTML parsing using cheerio (optimized for server-side static content)
- **Standards Compliance**: Precise implementation of WCAG 2.1 Level AA success criteria algorithms

**Technology Stack:**

- **Runtime**: Node.js 24 LTS
- **Language**: TypeScript 5.9.3 with strict compiler options
- **HTML Parsing**: cheerio ^1.2.0 (jQuery-like API for server-side parsing)
- **CLI Framework**: commander ^15.0.0 (declarative command-line interface)
- **MCP Client**: @modelcontextprotocol/sdk ^1.31.0 (official TypeScript SDK)
- **MCP Server**: mcp-server-fetch@2026.8.18 (Python package, run via uvx)
- **Testing**: Vitest ^5.0.0 (fast unit testing), fast-check ^4.10.0 (property-based testing)
- **Linting**: eslint ^10.11.0, @eslint/js ^10.0.0
- **Type Checking**: TypeScript strict mode with `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`

**Note on Lesson Ordering**: Tasks MUST execute in this exact order:
1. FIRST: Task 15 (steering files - Lesson 2)
2. THEN: Task 16 (hooks - Lesson 3)
3. THEN: Task 18 (custom agent - Lesson 7)
4. THEN: Task 17 (install power - Lesson 5)
5. THEN: Add .kiro/settings/mcp.json (Lesson 6 evidence)
6. THEN: All code implementation tasks

The post-task testing hook runs `npx vitest run --passWithNoTests`, so it succeeds even before test files exist.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  commander.js                                             │  │
│  │  • Argument parsing (--url, --file, --output)            │  │
│  │  • Usage help display                                     │  │
│  │  • Error exit codes                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Orchestration Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Main Orchestrator                                        │  │
│  │  • Content source routing (URL → MCP, File → fs.read)    │  │
│  │  • Error handling and logging                             │  │
│  │  • Pipeline coordination: Fetch → Parse → Validate → Report │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        ↓                                    ↓
┌─────────────────────┐          ┌────────────────────────┐
│   Content Fetcher   │          │    File Reader         │
│  ┌───────────────┐  │          │  ┌──────────────────┐  │
│  │  MCP Client   │  │          │  │  fs.readFile      │  │
│  │  • Connect to │  │          │  │  • UTF-8 encoding │  │
│  │    mcp-server │  │          │  │  • Path validation│  │
│  │    -fetch     │  │          │  └──────────────────┘  │
│  │  • fetch tool │  │          └────────────────────────┘
│  │    call       │  │
│  │  • Timeout    │  │
│  │    handling   │  │
│  └───────────────┘  │
└─────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Parsing Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTML Parser (cheerio)                                    │  │
│  │  • Load HTML string into DOM                              │  │
│  │  • jQuery-like selector API ($('img'), $('.class'))      │  │
│  │  • Line number tracking for elements                      │  │
│  │  • Pretty-printer for round-trip testing                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Validation Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Validator Engine (Plugin Architecture)                  │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ ImageAltValidator (WCAG 1.1.1)                      │ │  │
│  │  │ • Find all <img> tags                               │ │  │
│  │  │ • Check alt attribute presence and content          │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ FormLabelValidator (WCAG 1.3.1)                     │ │  │
│  │  │ • Find all form controls                            │ │  │
│  │  │ • Check label association or ARIA labeling          │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ HeadingHierarchyValidator (WCAG 1.3.1)              │ │  │
│  │  │ • Extract heading sequence                          │ │  │
│  │  │ • Verify no level skips                             │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ LinkTextValidator (WCAG 2.4.4)                      │ │  │
│  │  │ • Find all <a href> links                           │ │  │
│  │  │ • Check text descriptiveness                        │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ ColorContrastValidator (WCAG 1.4.3)                 │ │  │
│  │  │ • Find inline color styles                          │ │  │
│  │  │ • Calculate relative luminance                      │ │  │
│  │  │ • Compute contrast ratio                            │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Reporting Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Report Generator                                         │  │
│  │  • Aggregate violations from all validators              │  │
│  │  • Generate structured JSON with metadata                │  │
│  │  • Create human-readable summary                         │  │
│  │  • Write to file or stdout                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input (URL or File Path)
        ↓
[CLI Argument Parser]
        ↓
[Orchestrator: Route to MCP or File System]
        ↓
HTML String
        ↓
[HTML Parser: cheerio.load(htmlString)]
        ↓
CheerioAPI (DOM structure)
        ↓
[Validator Engine: Run all 5 validators]
        ↓
Violation[] (array of detected issues)
        ↓
[Report Generator: Format violations + metadata]
        ↓
JSON Report + Human-readable Summary
        ↓
[Output: File or stdout]
```

## Components and Interfaces

### 1. CLI Interface Component

**Responsibility**: Parse command-line arguments, display help, delegate to orchestrator.

**Module**: `src/cli.ts`

**Key Functions**:

```typescript
/**
 * Main CLI entry point
 * Parses arguments and initiates the accessibility check pipeline
 */
export async function main(argv: string[]): Promise<void>

/**
 * Display usage instructions and examples
 */
function displayHelp(): void

/**
 * Validate CLI arguments
 * @throws CLIError if arguments are invalid
 */
function validateArguments(options: CLIOptions): void
```

**Interface**:

```typescript
interface CLIOptions {
  url?: string;           // URL to fetch and analyze
  file?: string;          // Local file path to analyze
  output?: string;        // Output file path for JSON report
}

class CLIError extends Error {
  exitCode: number;       // Process exit code (1-9)
}
```

**Algorithm**:

```
1. Parse arguments using commander.js
2. IF no arguments provided:
   a. Display help text
   b. Exit with code 0
3. IF both --url and --file provided:
   a. Display error: "Cannot specify both --url and --file"
   b. Exit with code 1
4. IF neither --url nor --file provided:
   a. Display error: "Must specify either --url or --file"
   b. Exit with code 1
5. Validate argument formats:
   a. IF --url provided:
      i. Validate URL format
      ii. Verify scheme is http or https (security restriction)
      iii. IF invalid URL or disallowed scheme → exit code 1
   b. IF --file provided:
      i. Check file exists
      ii. IF file not found → exit code 4
   c. IF --output provided:
      i. Validate writable path
      ii. IF unwritable → exit code 4
6. Call orchestrator.run(options)
7. CATCH errors and display with appropriate exit codes:
   a. MCP errors → exit code 2
   b. Parsing errors → exit code 3
   c. File I/O errors → exit code 4
```

---

### 2. MCP Client Component

**Responsibility**: Launch dedicated Python MCP server (mcp-server-fetch), establish connection, fetch HTML content from URLs with pagination support.

**Module**: `src/mcp/client.ts`

**Key Functions**:

```typescript
/**
 * Fetch HTML content from a URL using Python mcp-server-fetch via uvx
 * WCAG Criterion: Enables analysis of live web content (Requirements 2.1-2.14)
 * 
 * @param url - The URL to fetch
 * @param timeoutMs - Request timeout in milliseconds (default 30000)
 * @returns HTML content string
 * @throws MCPConnectionError if connection fails
 * @throws MCPFetchError if fetch fails
 */
export async function fetchHTML(url: string, timeoutMs?: number): Promise<string>

/**
 * Initialize MCP client connection by launching Python fetch server via uvx
 * @throws MCPConnectionError if server launch or connection fails
 */
async function initializeMCPClient(): Promise<Client>

/**
 * Call the fetch tool via MCP with pagination support
 * @param client - Initialized MCP client
 * @param url - Target URL
 * @returns Fetch result with complete HTML content
 */
async function callFetchTool(client: Client, url: string): Promise<FetchResult>

/**
 * Strip server-added prefixes and completion notices from fetch result
 * @param content - Raw content from server
 * @returns Cleaned HTML content
 */
function cleanFetchedContent(content: string): string
```

**Interface**:

```typescript
interface FetchResult {
  content: string;        // HTML content (cleaned)
  fetchDurationMs: number; // Time taken to fetch
  contentSizeBytes: number; // Content size
}

class MCPConnectionError extends Error {
  reason: string;         // Connection failure reason
}

class MCPFetchError extends Error {
  url: string;
  reason: string;
}
```

**Algorithm**:

```
1. Launch Python MCP server process via uvx:
   a. Use StdioClientTransport to spawn uvx process
   b. Command: uvx mcp-server-fetch@2026.8.18
   c. Store server process handle for cleanup
2. IF server spawn fails:
   a. Throw MCPConnectionError with reason
3. Initialize MCP Client with StdioClientTransport
4. Connect to spawned MCP server
5. IF connection fails:
   a. Throw MCPConnectionError
6. Fetch content with pagination:
   a. Initialize: startIndex = 0, chunks = [], maxChunkSize = 500000
   b. LOOP:
      i. Call client.callTool("fetch", {
           url: url,
           raw: true,              // Get HTML, not markdown
           max_length: maxChunkSize,
           start_index: startIndex
         })
      ii. IF tool call times out or throws (exception path):
          - Catch and throw MCPFetchError with URL and reason
      iii. IF result.isError === true (error-result path, e.g. robots.txt disallow, network error):
          - Extract the text content from result.content
          - Throw MCPFetchError with URL and that text as reason
          - Both paths are handled because the server's error style is unverified
      iv. Clean response content:
          - Strip "Content type ... cannot be simplified to markdown" prefix line if present
          - Strip "Contents of <url>:" prefix line if present
          - Strip "<error>Content truncated...</error>" notice if present
          - Strip "<error>No more content available.</error>" at end if present
      v. Append cleaned content to chunks array
      vi. IF response does NOT contain truncation notice:
          - BREAK (content fully fetched)
      vii. ELSE:
          - startIndex += maxChunkSize
          - Continue loop
   c. Concatenate all chunks into complete HTML string
7. Log fetch duration and content size
8. Return complete HTML string

Note: The fetch tool automatically respects robots.txt directives.
Note: max_length is exclusive at 1,000,000 - use 500000 to stay safely under.
Note: Server adds prefix lines and completion notices - must strip all.
Note: Pagination required for large pages; check for absence of truncation notice to stop.
```

---

### 3. HTML Parser Component

**Responsibility**: Parse HTML into queryable DOM, provide pretty-printer for round-trip testing.

**Module**: `src/parser/html-parser.ts`

**Key Functions**:

```typescript
/**
 * Parse HTML string into a queryable DOM structure
 * WCAG Criterion: Enables element analysis for all validators (Requirements 3.1-3.6)
 * 
 * @param html - HTML content string
 * @param options - Parsing options
 * @returns Parsed document with cheerio API
 * @throws ParseError if HTML is completely unparseable
 */
export function parseHTML(html: string, options?: ParseOptions): ParsedDocument

/**
 * Pretty-print a parsed document back to HTML string
 * Used for round-trip testing to verify parsing accuracy
 * 
 * @param doc - Parsed document
 * @returns Formatted HTML string with consistent indentation
 */
export function prettyPrint(doc: ParsedDocument): string

/**
 * Get line number for an element (for violation reporting)
 * 
 * @param element - Cheerio element
 * @returns Line number or undefined if not available
 */
export function getElementLine(element: Cheerio<Element>): number | undefined
```

**Interface**:

```typescript
interface ParseOptions {
  sourceCodeLocationInfo?: boolean; // Enable line number tracking (default true)
  normalizeWhitespace?: boolean;    // Normalize whitespace (default false)
}

interface ParsedDocument {
  $: CheerioAPI;              // Cheerio jQuery-like API
}

class ParseError extends Error {
  html: string;               // HTML that failed to parse
  reason: string;             // Failure reason
}
```

**Algorithm (parseHTML)**:

```
1. IF html is empty:
   a. Throw ParseError("Empty HTML content")
2. Load HTML into cheerio with line tracking:
   a. cheerio.load(html, { 
        sourceCodeLocationInfo: true,  // Enables line number tracking
        xmlMode: false, 
        decodeEntities: true 
      })
3. IF load throws exception:
   a. Throw ParseError with reason
4. Return { $ }
```

**Algorithm (getElementLine)**:

```
1. Get element's sourceCodeLocation
2. Return element.sourceCodeLocation?.startLine (or undefined if not present)
```

**Algorithm (prettyPrint)**:

```
1. Get root element from document
2. Recursively format elements:
   a. Apply 2-space indentation per nesting level
   b. Sort attributes alphabetically
   c. Preserve text content (equivalent modulo whitespace)
   d. Add newlines between block elements
3. Return formatted HTML string
```

---

### 4. Validator Engine Component

**Responsibility**: Coordinate execution of all WCAG validators, aggregate violations.

**Module**: `src/validators/engine.ts`

**Key Functions**:

```typescript
/**
 * Run all WCAG validators against a parsed document
 * WCAG Criterion: Orchestrates all validation checks (Requirements 4-8)
 * 
 * @param doc - Parsed HTML document
 * @returns Array of all detected violations
 */
export async function runValidators(doc: ParsedDocument): Promise<Violation[]>

/**
 * Register a validator with the engine
 * Enables plugin-style architecture for adding new validators
 * 
 * @param validator - Validator instance
 */
export function registerValidator(validator: Validator): void
```

**Interface**:

```typescript
/**
 * Base interface for all WCAG validators
 * Each validator checks one or more WCAG success criteria
 */
interface Validator {
  readonly name: string;           // Validator name (e.g., "ImageAltValidator")
  readonly wcagCriterion: string;  // WCAG reference (e.g., "1.1.1")
  
  /**
   * Execute validation checks
   * Must be deterministic (same input → same output)
   * 
   * @param doc - Parsed document
   * @returns Array of violations found
   */
  validate(doc: ParsedDocument): Violation[];
}

/**
 * Represents a single WCAG violation
 */
interface Violation {
  wcag: string;           // WCAG criterion (e.g., "1.1.1")
  severity: 'error' | 'warning';
  element: string;        // Element identifier (e.g., "<img>")
  issue: string;          // Human-readable description
  line?: number;          // Line number in source
  fix: string;            // Suggested remediation
}
```

**Algorithm**:

```
1. Initialize validators array with all 5 validators:
   a. ImageAltValidator
   b. FormLabelValidator
   c. HeadingHierarchyValidator
   d. LinkTextValidator
   e. ColorContrastValidator
2. FOR EACH validator:
   a. Call validator.validate(doc)
   b. Collect returned violations
3. Aggregate all violations into single array
4. Return complete violation list
```

---

### 5. Individual Validators

#### 5.1 ImageAltValidator (WCAG 1.1.1)

**Module**: `src/validators/image-alt.ts`

**Algorithm**:

```
1. Find all <img> elements using $('img')
2. FOR EACH image:
   a. Check if 'alt' attribute exists
   b. IF alt attribute missing:
      i. Create violation with severity 'error'
      ii. Issue: "Image missing alt attribute"
      iii. Fix: "Add alt attribute (use alt=\"\" for decorative images)"
      iv. Add to violations array
   c. ELSE (alt attribute present, including alt=""):
      i. No violation (alt="" is valid for decorative images per WCAG 1.1.1)
3. Return violations array

Note: alt="" is VALID for decorative images per WCAG 1.1.1 with or without role="presentation"
Note: Only flag MISSING alt attribute as error
```

**Implementation**:

```typescript
export class ImageAltValidator implements Validator {
  readonly name = 'ImageAltValidator';
  readonly wcagCriterion = '1.1.1';
  
  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];
    
    $('img').each((_, elem) => {
      const $elem = $(elem);
      const alt = $elem.attr('alt');
      const line = elem.sourceCodeLocation?.startLine;
      
      if (alt === undefined) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'error',
          element: '<img>',
          issue: 'Image missing alt attribute',
          line,
          fix: 'Add alt attribute (use alt="" for decorative images)'
        });
      }
      // alt="" is valid - no violation
    });
    
    return violations;
  }
}
```

---

#### 5.2 FormLabelValidator (WCAG 1.3.1)

**Module**: `src/validators/form-label.ts`

**Algorithm**:

```
1. Find all form controls: $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select')
2. FOR EACH form control:
   a. Get element ID attribute
   b. Check for associated <label> with for="<id>":
      i. IF found, mark as labeled
   c. Check if element is nested within <label>:
      i. IF element.parent('label').length > 0, mark as labeled
   d. Check for aria-label attribute:
      i. IF aria-label present and non-empty, mark as labeled
   e. Check for aria-labelledby attribute:
      i. IF aria-labelledby present, verify referenced element exists
      ii. IF referenced element exists, mark as labeled
   f. IF not labeled by any method:
      i. Create violation with severity 'error'
      ii. Issue: "Form control lacks associated label"
      iii. Fix: "Add associated label element or aria-label attribute"
      iv. Add to violations array
3. Return violations array

Note: Submit, button, reset, and image inputs are excluded - they get accessible names from value/alt attributes
```

---

#### 5.3 HeadingHierarchyValidator (WCAG 1.3.1)

**Module**: `src/validators/heading-hierarchy.ts`

**Algorithm**:

```
1. Find all heading elements in document order: $('h1, h2, h3, h4, h5, h6')
2. IF headings array is empty:
   a. Return empty violations array (no headings to validate)
3. Extract heading levels as integers [1, 2, 2, 3, ...]
4. Verify first heading is <h1>:
   a. IF first level !== 1:
      i. Create violation with severity 'warning'
      ii. Issue: "First heading should be <h1>, found <h{level}>"
      iii. Fix: "Change first heading to <h1>"
      iv. Add to violations array
5. FOR EACH subsequent heading (index i from 1 to length-1):
   a. currentLevel = levels[i]
   b. previousLevel = levels[i-1]
   c. IF currentLevel > previousLevel + 1:
      i. Create violation with severity 'warning'
      ii. Issue: "Heading level skipped from <h{previousLevel}> to <h{currentLevel}>"
      iii. Fix: "Adjust heading to <h{previousLevel + 1}> to maintain sequential hierarchy"
      iv. Add to violations array
6. Return violations array

Note: Heading hierarchy issues are flagged as warnings in this tool.
First heading should be h1, and levels should not skip, following best practices for accessibility.
```

---

#### 5.4 LinkTextValidator (WCAG 2.4.4)

**Module**: `src/validators/link-text.ts`

**Algorithm**:

```
1. Define non-descriptive phrases:
   a. ['click here', 'read more', 'here', 'link', 'more', 'click', 'read this']
2. Find all links with href: $('a[href]')
3. FOR EACH link:
   a. Get visible text content: $elem.text().trim().toLowerCase()
   b. Get aria-label: $elem.attr('aria-label')
   c. Get aria-labelledby: $elem.attr('aria-labelledby')
   d. Check for image alt text inside link:
      i. images = $elem.find('img[alt]')
      ii. IF images exist, extract alt text and append to visible text
   e. IF no visible text AND no aria-label AND no aria-labelledby AND no image alt:
      i. Create violation with severity 'error'
      ii. Issue: "Link has no accessible text"
      iii. Fix: "Add descriptive text, aria-label, or image with alt text"
      iv. Add to violations array
   f. ELSE IF visible text matches non-descriptive phrase:
      i. Create violation with severity 'warning'
      ii. Issue: "Link text is not descriptive: '{text}'"
      iii. Fix: "Use descriptive link text indicating destination"
      iv. Add to violations array
4. Return violations array

Note: Images with alt text inside links count as link text
```

---

#### 5.5 ColorContrastValidator (WCAG 1.4.3)

**Module**: `src/validators/color-contrast.ts`

**Algorithm**:

```
1. Find all elements with inline color styles:
   a. $('[style*="color"]')
2. FOR EACH element with inline styles:
   a. Parse style attribute
   b. Extract 'color' and 'background-color' values
   c. IF both color and background-color present:
      i. Parse color values to RGB
      ii. Calculate relative luminance for foreground:
         - FOR EACH channel (R, G, B):
           * Normalize: val = channel / 255
           * Apply gamma correction:
             IF val <= 0.03928: linearVal = val / 12.92
             ELSE: linearVal = ((val + 0.055) / 1.055) ^ 2.4
         - Luminance = 0.2126*R + 0.7152*G + 0.0722*B
      iii. Calculate relative luminance for background (same formula)
      iv. Calculate contrast ratio:
         - L1 = max(fgLuminance, bgLuminance)
         - L2 = min(fgLuminance, bgLuminance)
         - ratio = (L1 + 0.05) / (L2 + 0.05)
      v. Determine if text is large:
         - Check font-size and font-weight in style
         - Large = (size >= 18pt) OR (size >= 14pt AND weight >= 700)
      vi. Check against thresholds:
         - IF large text AND ratio < 3.0:
           * Create violation with severity 'warning'
           * Issue: "Insufficient contrast for large text: {ratio}:1 (need 3:1)"
           * Fix: "Increase contrast between text and background"
         - ELSE IF normal text AND ratio < 4.5:
           * Create violation with severity 'warning'
           * Issue: "Insufficient contrast: {ratio}:1 (need 4.5:1)"
           * Fix: "Increase contrast to at least 4.5:1"
3. Return violations array
```

**WCAG Contrast Formula** (adapted from [W3C WCAG 2.1 specification](https://www.w3.org/TR/WCAG21/)):

```
Relative Luminance (L) for color (R, G, B):
  For each channel C in {R, G, B}:
    Csrgb = C / 255
    If Csrgb ≤ 0.03928:
      Clinear = Csrgb / 12.92
    Else:
      Clinear = ((Csrgb + 0.055) / 1.055) ^ 2.4
  L = 0.2126 * Rlinear + 0.7152 * Glinear + 0.0722 * Blinear

Contrast Ratio:
  L1 = lighter color luminance
  L2 = darker color luminance
  ratio = (L1 + 0.05) / (L2 + 0.05)

WCAG 2.1 Level AA Requirements:
  - Normal text: ratio ≥ 4.5:1
  - Large text (18pt+ or 14pt bold+): ratio ≥ 3:1
```

---

### 6. Report Generator Component

**Responsibility**: Format violations into structured JSON, generate human-readable summary.

**Module**: `src/report/generator.ts`

**Key Functions**:

```typescript
/**
 * Generate complete accessibility report
 * WCAG Criterion: Provides structured output for all violations (Requirements 10.1-10.6)
 * 
 * @param violations - Array of detected violations
 * @param metadata - Report metadata (URL, timestamp)
 * @returns Complete report structure
 */
export function generateReport(
  violations: Violation[], 
  metadata: ReportMetadata
): AccessibilityReport

/**
 * Generate human-readable summary text
 * 
 * @param report - Complete report
 * @returns Formatted summary string
 */
export function generateSummary(report: AccessibilityReport): string

/**
 * Write report to file or stdout
 * 
 * @param report - Complete report
 * @param outputPath - File path or undefined for stdout
 * @throws FileWriteError if file write fails
 */
export async function writeReport(
  report: AccessibilityReport, 
  outputPath?: string
): Promise<void>
```

**Interface**:

```typescript
interface ReportMetadata {
  source: string;            // Source URL or file path
  timestamp: string;         // ISO 8601 timestamp
}

interface AccessibilityReport {
  metadata: {
    source: string;          // URL or file path
    timestamp: string;       // ISO 8601
    totalViolations: number;
    errorCount: number;
    warningCount: number;
  };
  violations: Violation[];   // All detected violations
  violationsByWCAG: Record<string, Violation[]>; // Grouped by criterion
}

class FileWriteError extends Error {
  filePath: string;
  reason: string;            // Permission error, disk space, etc.
}
```

**Algorithm (generateReport)**:

```
1. Count violations by severity:
   a. errorCount = violations.filter(v => v.severity === 'error').length
   b. warningCount = violations.filter(v => v.severity === 'warning').length
2. Group violations by WCAG criterion:
   a. violationsByWCAG = {}
   b. FOR EACH violation:
      i. IF violationsByWCAG[violation.wcag] undefined:
         - violationsByWCAG[violation.wcag] = []
      ii. violationsByWCAG[violation.wcag].push(violation)
3. Create report object:
   a. metadata: { source, timestamp, totalViolations, errorCount, warningCount }
   b. violations: violations array
   c. violationsByWCAG: grouped violations
4. Return report
```

**Algorithm (generateSummary)**:

```
1. Create summary header:
   a. "WCAG 2.1 Level AA Accessibility Report"
   b. "Source: {source}"
   c. "Generated: {timestamp}"
2. Add violation counts:
   a. "Total Violations: {total} ({errorCount} errors, {warningCount} warnings)"
3. Add breakdown by WCAG criterion:
   a. "Violations by WCAG Criterion:"
   b. FOR EACH criterion in violationsByWCAG:
      i. "  {criterion}: {count} violations"
4. Add summary footer:
   a. IF errorCount > 0:
      i. "❌ Accessibility check failed ({errorCount} errors)"
   b. ELSE IF warningCount > 0:
      i. "⚠️  Accessibility check passed with warnings ({warningCount} warnings)"
   c. ELSE:
      i. "✅ Accessibility check passed"
5. Return formatted summary string
```

---

## Data Models

### Type Definitions

All type definitions are located in `src/types/index.ts` with comprehensive JSDoc comments.

```typescript
/**
 * CLI command-line options
 */
export interface CLIOptions {
  url?: string;
  file?: string;
  output?: string;
}

/**
 * Parsed HTML document with queryable DOM
 */
export interface ParsedDocument {
  $: CheerioAPI;              // Cheerio jQuery-like API
}

/**
 * Single WCAG violation detected during validation
 */
export interface Violation {
  wcag: string;              // WCAG criterion reference (e.g., "1.1.1")
  severity: 'error' | 'warning';
  element: string;           // Element identifier (e.g., "<img>", "<input>")
  issue: string;             // Human-readable issue description
  line?: number;             // Line number in source HTML
  fix: string;               // Suggested remediation action
}

/**
 * Complete accessibility report with metadata
 */
export interface AccessibilityReport {
  metadata: {
    source: string;          // URL or file path
    timestamp: string;       // ISO 8601 format
    totalViolations: number;
    errorCount: number;
    warningCount: number;
  };
  violations: Violation[];
  violationsByWCAG: Record<string, Violation[]>;
}

/**
 * Base validator interface
 * All validators must implement this interface
 */
export interface Validator {
  readonly name: string;
  readonly wcagCriterion: string;
  validate(doc: ParsedDocument): Violation[];
}

/**
 * MCP fetch result
 */
export interface FetchResult {
  content: string;
  fetchDurationMs: number;
  contentSizeBytes: number;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  source: string;            // Source URL or file path
  timestamp: string;         // ISO 8601 timestamp
}

/**
 * Color representation for contrast calculations
 */
export interface RGBColor {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
}

/**
 * Relative luminance value (0-1)
 */
export type Luminance = number;

/**
 * Contrast ratio (1-21)
 */
export type ContrastRatio = number;
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following correctness properties are derived from the requirements and will be validated using property-based testing with fast-check. Cheap pure-function properties (Properties 4, 5, 8, 10, 12: heading sequences, contrast math, report invariants, CLI validation) run with `numRuns` ≥ 200; all other properties run with `numRuns` ≥ 100.

### Property 1: HTML Round-Trip Preservation

*For any* valid HTML document, parsing the HTML then pretty-printing it then parsing again should produce an equivalent DOM structure (element hierarchy, attributes, and text content must be preserved).

**Validates: Requirements 9.5**

**Test Strategy**: Generate random valid HTML documents with a custom fast-check arbitrary (note: `fc.htmlDocument()` does not exist in fast-check). Parse with `parseHTML()`, pretty-print with `prettyPrint()`, parse again, and verify the two DOMs are structurally equivalent using `isEquivalentDOM()` which checks:
- Same element tag names in same order
- Same attributes (keys and values)
- Same text content (equivalent modulo whitespace normalization)

**Implementation Note**: This property will struggle with whitespace-sensitive content (e.g., `<pre>` tags, inline text with significant whitespace). Consider normalizing whitespace or excluding whitespace-sensitive elements from round-trip testing.

---

### Property 2: Validator Determinism

*For any* parsed HTML document, running the same validator twice on the same document should produce identical violation arrays (same violations in same order with same fields).

**Validates: Requirements 4.1, 5.1, 6.1, 7.1, 8.1**

**Test Strategy**: Generate random HTML documents, run each of the five validators twice, verify the violation arrays are deeply equal.

---

### Property 3: Image Alt Detection Completeness

*For any* HTML document, the ImageAltValidator should identify violations for all `<img>` elements that lack alt attributes (missing alt attribute).

**Validates: Requirements 4.2, 4.3, 4.4**

**Test Strategy**: Generate HTML documents with known numbers of images with/without alt attributes. Count expected violations **using an independent oracle** (not the validator itself). Walk the DOM manually to count images without alt attribute (alt="" is valid, only missing alt is a violation). Verify the validator returns exactly that many violations.

**Implementation Note**: Do NOT use the validator to count expected violations (tautology). Implement a separate counting function as the test oracle.

---

### Property 4: Heading Hierarchy Sequential Property

*For any* sequence of heading elements, if no violations are reported by HeadingHierarchyValidator, then the first heading must be h1 and each subsequent heading level must be at most one greater than the previous level.

**Validates: Requirements 6.2, 6.3**

**Test Strategy**: Generate random heading sequences. If validator returns no violations, verify that the sequence satisfies: IF headings exist THEN first is h1 AND for all i > 0: level[i] <= level[i-1] + 1. Handle the empty heading case (no headings = no violations = valid).

---

### Property 5: Heading Hierarchy Violation Detection

*For any* heading sequence that contains a level skip (e.g., h2 followed by h4), the HeadingHierarchyValidator should detect and report a violation for that skip.

**Validates: Requirements 6.3, 6.4**

**Test Strategy**: Generate heading sequences with intentional skips (e.g., [1, 2, 4] or [1, 3]). Verify that the validator returns at least one violation referencing the skip.

---

### Property 6: Form Label Completeness

*For any* HTML document, the FormLabelValidator should identify violations for all form controls (input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select) that lack any labeling method (explicit label, implicit label, aria-label, or aria-labelledby).

**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6**

**Test Strategy**: Generate HTML with form controls. **Use an independent oracle** to count unlabeled controls: manually walk the DOM and count inputs (the oracle MUST exclude type="hidden", "submit", "button", "reset", and "image" per Requirements 5.2 and 5.3), textareas, and selects that have no associated label (no for= attribute pointing to them, not nested in label, no aria-label, no aria-labelledby). Verify validator returns exactly that many violations.

**Implementation Note**: Do NOT use the validator to count expected violations. Implement a separate counting function as the test oracle. Constrain arbitrary-generated id and type values to safe alphabets (alphanumeric) to avoid parsing issues.

---

### Property 7: Link Text Detection

*For any* HTML document, the LinkTextValidator should report violations for all `<a href>` links that have no accessible text (no visible text, no aria-label, no aria-labelledby, and no img[alt] child).

**Validates: Requirements 7.3, 7.5, 7.6**

**Test Strategy**: Generate HTML with links. **Use an independent oracle** to count links with no accessible text: manually check each `<a href>` element for empty text content AND no aria-label AND no aria-labelledby AND no img[alt] children. A nested `<img>` with an `alt` attribute counts as link text (Requirement 7.3), so such links are never counted as missing text. Verify validator returns violations for exactly those links.

**Implementation Note**: Do NOT use the validator to count expected violations. Implement a separate counting function as the test oracle. Constrain arbitrary-generated href values to valid URL formats.

---

### Property 8: Color Contrast Calculation Correctness

*For any* pair of RGB colors, the calculated contrast ratio should satisfy the WCAG formula: ratio = (L1 + 0.05) / (L2 + 0.05) where L1 and L2 are the relative luminances of the lighter and darker colors respectively, and should fall in the range [1, 21].

**Validates: Requirements 8.2**

**Test Strategy**: Generate random RGB color pairs. Calculate contrast ratio using the ColorContrastValidator's algorithm. Verify: (1) ratio is between 1 and 21, (2) ratio matches reference implementation of WCAG formula, (3) swapping foreground/background produces same ratio.

---

### Property 9: Contrast Threshold Detection

*For any* element with inline color styles where the contrast ratio is below 4.5:1 for normal text or below 3:1 for large text, the ColorContrastValidator should report a warning violation.

**Validates: Requirements 8.3, 8.4**

**Test Strategy**: Generate HTML elements with inline styles using color pairs with known low contrast ratios. Verify validator reports warnings for those elements.

---

### Property 10: Report Structure Invariants

*For any* array of violations, the generated AccessibilityReport should satisfy: (1) metadata.totalViolations equals violations.length, (2) metadata.errorCount equals the count of violations with severity 'error', (3) metadata.warningCount equals the count with severity 'warning', (4) every violation appears in exactly one violationsByWCAG group.

**Validates: Requirements 10.1, 10.2, 10.3**

**Test Strategy**: Generate random violation arrays with varying severities and WCAG criteria. Generate report and verify all four invariants hold.

---

### Property 11: Violation Count Summary Correctness

*For any* AccessibilityReport, the human-readable summary generated by generateSummary() should include text displaying the correct total violations, error count, warning count, and a breakdown showing the correct count for each WCAG criterion present in the report.

**Validates: Requirements 10.6**

**Test Strategy**: Generate random reports with various violation distributions. Generate summary text and parse it to verify all counts match the report metadata and violationsByWCAG groupings.

---

### Property 12: CLI Argument Validation

*For any* invalid CLI argument format (malformed URL, non-existent file path, unwritable output path), the CLI should throw a CLIError with a non-zero exit code (1 for argument errors, 4 for file I/O errors) and an error message explaining the issue.

**Validates: Requirements 1.2, 1.4, 1.6, 11.6**

**Test Strategy**: Generate random invalid arguments (malformed URLs, invalid paths). Call CLI validation function and verify it throws CLIError with appropriate exit code and message.

---

### Property 13: Line Number Preservation

*For any* HTML document parsed with line number tracking enabled (sourceCodeLocationInfo: true), every element in the DOM should have a sourceCodeLocation.startLine that corresponds to its position in the original HTML source (or undefined if tracking failed).

**Validates: Requirements 3.6**

**Test Strategy**: Generate HTML with known element positions. Parse with sourceCodeLocationInfo: true. For elements at known positions, verify elem.sourceCodeLocation.startLine contains correct line numbers.

---

### Property 14: Pretty-Printer Indentation Consistency

*For any* parsed HTML document, the pretty-printed output should have consistent 2-space indentation where each nesting level adds exactly 2 spaces.

**Validates: Requirements 9.2**

**Test Strategy**: Generate random nested HTML. Pretty-print and analyze indentation. For each line containing an element, verify indentation is 2 * (nesting depth) spaces.

---

### Property 15: Pretty-Printer Attribute Ordering

*For any* HTML element with multiple attributes, the pretty-printed output should list those attributes in alphabetical order by attribute name.

**Validates: Requirements 9.3**

**Test Strategy**: Generate elements with random attributes in random order. Pretty-print and parse the attribute order from the output. Verify alphabetical sorting.

---

## Error Handling

### Error Categories and Strategies

The system implements comprehensive error handling across all components with specific error types and exit codes:

**1. CLI Argument Errors (Exit Code 1)**
- Invalid argument combinations (both --url and --file)
- Missing required arguments (neither --url nor --file)
- Malformed URL format
- Disallowed URL scheme (non-http/https)

**2. File I/O Errors (Exit Code 4)**
- Non-existent file path
- Unwritable output path
- Permission denied reading input file
- Permission denied writing output file
- Disk space exhausted
- Invalid file path format

Strategy: Validate all arguments early in the CLI layer. Display clear error messages with usage examples. Exit immediately with code 1 for argument errors, code 4 for file I/O errors.

**2. MCP Connection Errors (Exit Code 2)**
- Failed connection to MCP server process
- MCP server spawn failure
- MCP server not responding

Strategy: Wrap MCP server launch and client initialization in try-catch. Throw MCPConnectionError with descriptive reason. Include troubleshooting steps for common issues (uvx not found, network issues).

**3. MCP Fetch Errors (Exit Code 2)**
- Network timeout (default 30s)
- robots.txt disallows access
- DNS resolution failure
- TLS/SSL errors
- Invalid URL format

Strategy: Implement timeout wrapper around MCP fetch calls. Check for error responses from fetch tool and throw MCPFetchError with URL and descriptive reason. Include retry suggestions for transient errors.

**4. HTML Parsing Errors (Exit Code 3)**
- Empty HTML content
- Completely malformed HTML (rare with cheerio, which is forgiving)
- Encoding issues

Strategy: Cheerio is highly fault-tolerant and parses most malformed HTML successfully. Only throw ParseError for truly unparseable content (empty strings, null bytes, binary data). Log warnings for recoverable issues but continue processing.

**5. File I/O Errors (Exit Code 4)**
- File not found
- Permission denied reading input file
- Permission denied writing output file
- Disk space exhausted
- Invalid file path format

Strategy: Use fs.promises with try-catch. Check file existence before reading. Check write permissions before generating large reports. Provide specific error messages indicating whether the issue is read permissions, write permissions, or disk space.

**6. Validation Errors (Non-fatal)**
- Validator throws unexpected exception
- Invalid DOM structure

Strategy: Wrap each validator.validate() call in try-catch. Log validator errors but continue with remaining validators. Include validator name in error log for debugging.

**7. Report Generation Errors (Exit Code 4)**
- JSON serialization failure
- File write failure
- Invalid output format

Strategy: Validate report structure before serialization. Use JSON.stringify with error handling. If file write fails, exit with code 4 and clear error message.

### Error Recovery and Resilience

**Graceful Degradation**:
- If one validator fails, continue with remaining validators
- If line number tracking fails, continue without line numbers
- If pretty-printing fails, skip round-trip testing but continue validation

**User-Friendly Error Messages**:
```
❌ Error: Failed to launch MCP server
Reason: MCP server process could not be spawned
Solution: Ensure uvx is installed and mcp-server-fetch@2026.8.18 is accessible
```

**Logging Strategy**:
- Use structured logging with levels (ERROR, WARN, INFO, DEBUG)
- Include error codes for programmatic error handling
- Log timing information for performance debugging
- Log validator execution for transparency

---

## Testing Strategy

### Unit Testing

**Framework**: Vitest 5.0.0

**Unit Test Coverage**:
- CLI argument parsing (validate all flag combinations)
- HTML parser functions (parseHTML, prettyPrint, getElementLine)
- Individual validator logic (test each validator with specific HTML examples)
- Report generator (test JSON structure, summary formatting)
- Color contrast calculation (test luminance and ratio calculations with known values)
- Utility functions (URL validation, file path checks)

**Unit Test Approach**:
- Use concrete examples for edge cases (empty HTML, single element, deeply nested structures)
- Test error handling paths (invalid input, missing attributes)
- Verify violation field correctness (wcag, severity, issue, fix)
- Test integration points between components

**Unit Test Balance**: Unit tests focus on specific examples and edge cases. Avoid excessive unit tests—property-based tests handle comprehensive input coverage. Keep unit tests for concrete scenarios that demonstrate correct behavior and important edge cases.

---

### Property-Based Testing

**Framework**: fast-check 4.10.0

**Configuration**:
- `numRuns` ≥ 200 for cheap pure-function properties (contrast math, report invariants, heading sequences, CLI validation: Properties 4, 5, 8, 10, 12)
- `numRuns` ≥ 100 for all other properties
- Shrinking enabled for minimal counterexamples
- Replay support for reproducing failures

**Property Test Implementation**:

Each property test must include a comment tag referencing the design document property:

```typescript
// Feature: wcag-accessibility-checker, Property 1: HTML Round-Trip Preservation
test('HTML round-trip preserves DOM structure', () => {
  fc.assert(
    fc.property(fc.htmlDocument(), (html) => {
      const doc1 = parseHTML(html);
      const printed = prettyPrint(doc1);
      const doc2 = parseHTML(printed);
      expect(isEquivalentDOM(doc1.$, doc2.$)).toBe(true);
    }),
    { numRuns: 100 }
  );
});
```

**Helper Function** (used by Property 1):
```typescript
function isEquivalentDOM($1: CheerioAPI, $2: CheerioAPI): boolean {
  // Compare root structure, recursively check:
  // - Same tag names
  // - Same attributes
  // - Same text content (normalized)
  // - Same child structure
}
```

**Custom Arbitraries** (for fast-check):

```typescript
// Generate random HTML documents
// Note: fc.htmlDocument() does not exist - we must create a custom arbitrary
const htmlDocumentArbitrary = () => 
  fc.record({
    elements: fc.array(
      fc.oneof(
        fc.record({ tag: fc.constant('img'), alt: fc.option(fc.string()) }),
        fc.record({ 
          tag: fc.constant('a'), 
          href: fc.webUrl(), 
          text: fc.string() 
        }),
        fc.record({ 
          tag: fc.constant('input'), 
          id: fc.stringMatching(/^[a-zA-Z0-9_-]+$/),  // Safe alphabet
          type: fc.constantFrom('text', 'email', 'password', 'checkbox')  // Safe types
        }),
        fc.record({ tag: fc.oneof(fc.constant('h1'), fc.constant('h2'), fc.constant('h3')) })
      )
    )
  }).map(({ elements }) => buildHTMLString(elements));

// Generate random heading sequences
fc.headingSequence = () => fc.array(fc.integer({ min: 1, max: 6 }));

// Generate random RGB colors
fc.rgbColor = () => fc.record({
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 })
});

// Generate random violation objects
fc.violation = () => fc.record({
  wcag: fc.oneof(fc.constant('1.1.1'), fc.constant('1.3.1'), fc.constant('1.4.3'), fc.constant('2.4.4')),
  severity: fc.oneof(fc.constant('error'), fc.constant('warning')),
  element: fc.string(),
  issue: fc.string(),
  line: fc.option(fc.nat(), { nil: undefined }),
  fix: fc.string()
});
```

**Property Test Tags**: Each property-based test must be tagged with the feature name and property number from this design document to enable traceability between specifications and tests.

**Execution and Evidence**: Run every PBT task from the IDE task list. Evidence = screenshot of the passed tasks plus test output saved to `docs/evidence/pbt-output.txt`. A cloud session run is extra only, not the primary evidence.

---

### Integration Testing

**MCP Integration Tests** (Requirements 2.1-2.14):
- Test Python MCP server launch and connection establishment via uvx
- Test successful HTML fetch from a local HTTP server serving test/fixtures
- Test `result.isError` handling and thrown-exception handling both map to MCPFetchError
- Test MCP timeout handling
- Test MCP error responses (invalid URL, robots.txt disallow)
- Test MCP server process cleanup on exit
- Test content pagination for large responses
- Test prefix/completion notice stripping (two prefix lines, truncation notice, no more content notice)

**End-to-End CLI Tests**:
- Test complete pipeline: URL → Fetch → Parse → Validate → Report (use local test fixtures)
- Test complete pipeline: File → Parse → Validate → Report (use fixture with known violations)
- Test report output to file
- Test report output to stdout
- Test error handling end-to-end
- Test demo command: `npm start -- --file test/fixtures/sample.html`

**Integration Test Strategy**: Use 1-3 representative examples per integration point. Focus on verifying components work together correctly rather than exhaustive input coverage (which property tests handle).

**Test Fixtures**: Create HTML fixtures with known violations (missing alt text, unlabeled inputs, heading skips, non-descriptive links, low contrast). Use fixtures as primary test sources, served via a local HTTP server for URL runs (`file://` is rejected by the scheme check).

**Note on robots.txt**: mcp-server-fetch allows the fetch when robots.txt returns 404, but 401/403 blocks it.

---

## Kiro University Lesson Integration

This design enables all nine Kiro University lessons (seven required + two bonus):

**Lesson 1: Spec-driven Development** ✅
- This design document follows from requirements.md
- Clear traceability from requirements to design to implementation

**Lesson 2: Steering Documents** (To be implemented - Task 15, before code tasks)

Five files in `.kiro/steering/` (workspace location is correct; graders inspect the repo). One domain per file; each file contains a standard, context, and a good-vs-bad example:

- `validator-pattern.md`: enforce consistent validator interface
- `wcag-compliance.md`: common violation detection patterns and criterion referencing
- `error-handling.md`: consistent error types, messages, and exit codes
- `jsdoc-standards.md`: WCAG criterion references in JSDoc comments
- `testing-standards.md`: fast-check conventions, numRuns minimums, independent-oracle rule, safe alphabets for ids/types, and the `// Feature: wcag-accessibility-checker, Property N` tag

`testing-standards.md` uses conditional inclusion. Front matter must be the very first content in the file (no blank line before it):

```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts"
---
```

**Lesson 3: Hooks** (To be implemented - Task 16, before code tasks)

Two hooks to demonstrate the feature:

1. **PostFileSave Hook**: Run TypeScript linter on .ts file saves
   - Trigger: `PostFileSave`
   - Matcher: `\.ts$` (matches TypeScript files only)
   - Action: `command` running `npx eslint .` (lints the whole project)
   - Purpose: Immediate feedback on code quality
   - Note: PostFileSave cannot block

2. **PostTaskExec Hook**: Run tests after task completion
   - Trigger: `PostTaskExec`
   - Action: `command` running `npx vitest run --passWithNoTests`
   - Purpose: Immediate validation that implementation passes tests
   - Note: `--passWithNoTests` keeps the hook green before test files exist
   - Note: PostTaskExec cannot block (no exit 2)

**Hook Configuration File**: `.kiro/hooks/accessibility-checker-hooks.json`

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "TypeScript Linter",
      "trigger": "PostFileSave",
      "matcher": "\\.ts$",
      "action": {
        "type": "command",
        "command": "npx eslint ."
      }
    },
    {
      "name": "Post-Task Test Runner",
      "trigger": "PostTaskExec",
      "action": {
        "type": "command",
        "command": "npx vitest run --passWithNoTests"
      }
    }
  ]
}
```

**Note on Lint Hook**: The command lints the whole project (`npx eslint .`). The hook's stdin JSON context is not used to target only the saved file. Neither hook can block the triggering action.

**Lesson 4: Property-Based Testing** ✅
- 15 correctness properties defined above
- fast-check integration planned
- Custom arbitraries for HTML, colors, violations (fc.htmlDocument() does not exist)
- `numRuns` ≥ 200 for cheap pure-function properties, ≥ 100 elsewhere
- Independent oracles for properties 3, 6, 7 (avoid tautology)

**Lesson 5: Powers** (To be implemented early)

**Selected Power**: **Power Builder** (from the Kiro powers registry)
- Installation: Install via the Powers panel in Kiro (installed outside the repo)
- Use case: During development, trigger it by keyword in chat (e.g. "build a power") to guide creating and testing the Bonus 2 `ada-wcag` power

**Repository Evidence Required**:
1. README.md section documenting that Power Builder was installed and why
2. Spec task that triggers Power Builder by keyword in chat and uses its guidance

**Scope**: Lesson 5 is satisfied by Power Builder only. The Bonus 2 `ada-wcag` power is not claimed for Lesson 5.

**Lesson 6: MCP** ✅
- MCP client component designed above
- Application launches its own dedicated Python MCP server process (mcp-server-fetch) via uvx
- Uses uvx to spawn `mcp-server-fetch@2026.8.18`
- Fetches live web content with `raw: true` and pagination (max_length: 500000)
- Strips server-added prefixes and completion notices
- Configuration file at `.kiro/settings/mcp.json` for Lesson 6 evidence:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch@2026.8.18"]
    }
  }
}
```

**Note**: This configuration enables the MCP server to be used both by Kiro during development AND by the application at runtime.

**Repository Evidence for Lesson 6**:
1. Create .kiro/settings/mcp.json with above configuration
2. Add task where Kiro itself calls the fetch MCP tool once in chat (e.g., to capture a test fixture into test/fixtures/)
3. Document in README showing Kiro called the fetch tool during development
4. Demo URL runs use a local HTTP server serving test/fixtures with a pinned version (e.g., `npx http-server@<pinned-version> test/fixtures -p 8080`), then `npm start -- --url http://localhost:8080/sample.html`. `file://` URLs are rejected by the http/https scheme check.
5. Do not use kiro.dev as a demo target. mcp-server-fetch checks robots.txt: a 404 robots.txt is allowed, but 401/403 blocks the fetch.
6. Warm the uvx cache (run `uvx mcp-server-fetch@2026.8.18` once) before recording the demo

**Lesson 7: Custom Agent** (To be implemented - Task 18, before code tasks)

**Agent Name**: `accessibility-auditor`

**Agent Configuration File**: `.kiro/agents/accessibility-auditor.json`

```json
{
  "name": "accessibility-auditor",
  "model": "claude-sonnet-5",
  "description": "Specialized agent for WCAG accessibility analysis with deep knowledge of WCAG 2.1 Level AA criteria and remediation techniques",
  "prompt": "You are an accessibility expert specializing in WCAG 2.1 Level AA compliance. You have deep knowledge of:\n- Image alternative text requirements (WCAG 1.1.1)\n- Form label associations and ARIA labeling (WCAG 1.3.1)\n- Heading hierarchy best practices (WCAG 1.3.1)\n- Link text descriptiveness (WCAG 2.4.4)\n- Color contrast calculation and thresholds (WCAG 1.4.3)\n\nWhen analyzing code or suggesting fixes, always reference specific WCAG success criteria and provide actionable remediation guidance.",
  "tools": ["read", "write", "shell"],
  "resources": ["file://.kiro/steering/**/*.md", "file://./docs/WCAG-2.1-reference.md"],
  "permissions": {
    "rules": [
      {
        "capability": "shell",
        "match": ["npm *", "npx *"],
        "effect": "allow"
      }
    ]
  },
  "includeMcpJson": true,
  "includePowers": true,
  "welcomeMessage": "Ready to audit. Point me at a URL or HTML file and I'll check it against WCAG 2.1 AA."
}
```

**Note**: Use `prompt` field (not `instructions`), tools as array, resources as string array with file:// URIs, permissions with rules array.

**Note**: The file `docs/WCAG-2.1-reference.md` must exist before agent is configured.

**Note on Steering Resources**: Custom agents do not load steering automatically, so the `file://.kiro/steering/**/*.md` glob is required. This is the "agent loads steering" proof for Lessons 2 and 7.

**Note on Model**: Use `claude-sonnet-5` (matches lesson example).

**Note on includeMcpJson and includePowers**: These flags enable the custom agent to use MCP servers and powers from the workspace configuration.

---

### Bonus Lessons

**Bonus Lesson 1: Cloud Sessions and Cloud Configuration (250 credits)**

**Prerequisites**:
- Code must be pushed to GitHub repository (runs after task 21)
- Kiro IDE v1.0.293 or later required
- Paid plan required (US East region)

**Steps** (in this order):

1. **Push Code to GitHub**: Ensure all completed code is pushed to a public GitHub repository

2. **Copy Configuration to `~/.kiro`**: Copy ONLY these folders from project `.kiro/` into personal `~/.kiro/`:
   - `steering/` (5 steering files from Lesson 2)
   - `agents/` (accessibility-auditor from Lesson 7)
   - `hooks/` (2 hooks from Lesson 3)

3. **Upload Cloud Configuration**: In Kiro Web, go to Settings > Sync and upload each folder (one top-level folder at a time)

4. **Start Cloud Session**: THEN, from the Kiro IDE (Agent Focus Mode; IDE v1.0.293+), start a cloud session on the GitHub repository

5. **Execute Bounded Task**: Run the validator unit tests and property tests in the cloud session
   - Rationale: Test execution doesn't need uvx or network access
   - Avoid: Tasks requiring MCP server launch or live URL fetching

6. **Generate Proof**: In the cloud session, run `/config`
   - Capture the Source column (local / cloud / local + cloud)

7. **Commit Timing**:
   - All cloud session commits must land before October 5, 2026 23:59 PT
   - No commits after October 5, 2026 23:59 PT until judging ends October 19, 2026

**Repository Evidence**:
- Screenshot of `/config` command output showing cloud configuration
- README section documenting cloud configuration and session usage

---

**Bonus Lesson 2: Package a Kiro Power (250 credits)**

**Power Structure**:

Create a skills-only Kiro Power named `ada-wcag` (skills-only is a valid power form; no MCP server). Scaffold and check it with Power Builder.

```
power/
├── plugin.json
└── skills/
    └── wcag-validator/
        ├── SKILL.md
        └── references/
            └── report-schema.json
```

**1. Root `plugin.json` (required)**:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "ada-wcag",
  "version": "1.0.0",
  "description": "WCAG 2.1 Level AA accessibility validation with automated violation detection",
  "author": {
    "name": "<YOUR REAL NAME>"
  },
  "keywords": ["wcag", "a11y", "accessibility", "ada"]
}
```

"audit" and "compliance" are dropped as too generic (they would trigger the power in unrelated conversations).

**⚠️ Replace `<YOUR REAL NAME>` with your real name before submission.**

**2. Skill: `skills/wcag-validator/SKILL.md`**:

Front matter must include `name` and `description`:

```markdown
---
name: wcag-validator
description: Run five WCAG 2.1 AA checks (1.1.1 image alt, 1.3.1 form labels and headings, 2.4.4 link text, 1.4.3 contrast) on HTML and interpret the CLI's JSON report and exit codes.
---
```

Content is derived from the requirements:
- Requirements 4–8: each check's WCAG criterion, severity (error/warning), detection rule, and exact fix text
- Requirement 10: report schema (fields `wcag`, `severity`, `element`, `issue`, `line`, `fix`; metadata `source`, `timestamp`, `totalViolations`, `errorCount`, `warningCount`), with the full JSON Schema in `references/report-schema.json`
- Requirement 11: exit codes (1 argument/scheme errors, 2 fetch/MCP errors, 3 parse errors, 4 file I/O errors)
- CLI usage: `--url`, `--file` (mutually exclusive), `--output`

**3. Skip MCP configuration**: Do NOT include `mcp.json` in the power (application launches its own MCP server)

**Repository Structure**:

1. **Main Repository**: Keep power folder in the project (lesson requires it in submission)
   - Path: `power/` in main repo

2. **Separate Repository**: Publish a copy as its own public GitHub repository
   - Manifest (`plugin.json`) must be at repository root (GitHub import requirement)
   - Link to this separate repo from main README

**Installation and Proof**:

1. **Installation**: In the Kiro Powers panel, use "Add power from Local Path" and select the main repo `power/` folder, or install from GitHub using the separate power repository

2. **Activation Test**: Mention a keyword from the power in chat
   - Trigger keywords: "wcag", "a11y", "accessibility", "ada"
   - Verify power activates and skill content is loaded

3. **Capture Proof**: Screenshot showing power activation in Kiro chat
   - Visible: Power name, skill activation message

**Repository Evidence**:
- Power folder in main repository with complete structure
- Separate public GitHub repository for the power
- Link in main README to separate power repository
- Screenshot of power activation
- README section documenting power installation and usage

---

## Next Steps

After approval of this design document, the workflow will proceed to:

1. **Task Breakdown Phase**: Generate detailed implementation tasks covering:
   
   **CRITICAL: Tasks MUST execute in this exact order:**
   
   **Phase 1: Pre-Code Setup (MUST complete before implementation):**
   - Task 15: Create 5 steering files (Lesson 2)
   - Task 16: Configure 2 hooks (Lesson 3)
   - Task 18: Create accessibility-auditor custom agent and docs/WCAG-2.1-reference.md (Lesson 7)
   - Task 17: Install Power Builder via the Powers panel and document it (Lesson 5)
   - Task 19: Create .kiro/settings/mcp.json configuration (Lesson 6 evidence)
   
   **Phase 2: Implementation Tasks:**
   - Project setup (package.json with correct versions, tsconfig.json, eslint.config.js)
     - TypeScript 5.9.3
     - vitest ^5.0.0
     - fast-check ^4.10.0
     - commander ^15.0.0
     - cheerio ^1.2.0
     - @modelcontextprotocol/sdk ^1.31.0
     - eslint ^10.11.0, @eslint/js ^10.0.0
     - typescript-eslint (required for ESLint to lint .ts files)
     - @types/node (required for Node.js type definitions)
     - tsx (required for npm start runner)
     - npm test script: "vitest run --passWithNoTests" (not "vitest" which hangs in watch mode)
   - CLI interface implementation (validate URL schemes http/https only, --url and --file mutually exclusive, correct exit codes)
   - MCP client implementation (launch Python server via uvx mcp-server-fetch@2026.8.18, fetch with raw: true and max_length: 500000, pagination, strip two prefix lines and completion notices)
   - HTML parser with line tracking and pretty-printer (use sourceCodeLocationInfo: true for line numbers, preserve text equivalent modulo whitespace)
   - Five WCAG validators:
     - ImageAltValidator (only flag missing alt as error, alt="" is valid with or without decorative role)
     - FormLabelValidator (exclude submit/button/reset/image inputs from label checks)
     - HeadingHierarchyValidator (use warnings for hierarchy issues)
     - LinkTextValidator (check for img[alt] inside links)
     - ColorContrastValidator
   - Report generator with JSON and summary output (use "source" field consistently, exit code 4 on write failure)
   - Property-based test suite (15 properties with custom arbitraries using safe alphabets, independent oracles for properties 3, 6, 7, and isEquivalentDOM helper)
   - Unit test suite for validators
   - Integration tests for MCP and end-to-end pipeline (use local fixtures served by a local HTTP server, test prefix/completion notice stripping and both MCP error paths)
   - Documentation and JSDoc comments
   - Demo command: `npm start -- --file test/fixtures/sample.html`

2. **Implementation Phase**: Execute tasks with continuous validation using property-based tests

3. **Kiro University Integration**: Verify all nine lessons (seven required + two bonus) are complete with evidence in repository

**Task Execution Order is CRITICAL**: Pre-code setup tasks (15, 16, 18, 17, 19) MUST complete before any implementation tasks.


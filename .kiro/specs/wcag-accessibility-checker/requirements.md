# Requirements Document

## Introduction

The WCAG Accessibility Checker is a command-line interface (CLI) tool that analyzes web content for compliance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. The tool fetches live websites via Model Context Protocol (MCP), parses HTML content, identifies accessibility violations, and generates structured JSON reports with actionable remediation guidance. This project demonstrates all nine Kiro University lessons (seven required + two bonus) through practical implementation of accessibility auditing capabilities.

## Glossary

- **CLI_Tool**: The command-line interface application that orchestrates accessibility checking operations
- **MCP_Client**: The Model Context Protocol client component that fetches web content from remote URLs
- **HTML_Parser**: The component that parses HTML documents into a queryable structure using cheerio or jsdom
- **Validator_Engine**: The system that executes WCAG compliance checks against parsed HTML
- **Report_Generator**: The component that produces structured JSON output containing violation details
- **WCAG_Criterion**: A specific success criterion from WCAG 2.1 Level AA guidelines (e.g., 1.1.1, 1.3.1)
- **Violation**: A detected non-compliance with a WCAG success criterion
- **Severity_Level**: Classification of violations as either "error" (must fix) or "warning" (should fix)

## Requirements

### Requirement 1: CLI Interface and Input Handling

**User Story:** As a developer, I want to run accessibility checks from the command line using URLs or local files, so that I can integrate accessibility testing into my development workflow.

#### Acceptance Criteria

1. WHEN a user invokes the CLI_Tool with a valid URL argument using http or https scheme, THE CLI_Tool SHALL accept the URL as input
2. WHEN a user invokes the CLI_Tool with a URL using a scheme other than http or https, THE CLI_Tool SHALL display an error message indicating only http and https schemes are allowed and exit with code 1
3. WHEN a user invokes the CLI_Tool with a valid local file path argument, THE CLI_Tool SHALL accept the file path as input
4. WHEN a user invokes the CLI_Tool with both --url and --file flags, THE CLI_Tool SHALL display an error message indicating the flags are mutually exclusive and exit with code 1
5. WHEN a user invokes the CLI_Tool without arguments, THE CLI_Tool SHALL display usage instructions with examples
6. WHEN a user provides an invalid argument format, THE CLI_Tool SHALL display an error message explaining the expected format and exit with code 1
7. THE CLI_Tool SHALL support both `--url` and `--file` flags for explicit input type specification
8. THE CLI_Tool SHALL accept an optional `--output` flag to specify JSON report file destination

### Requirement 2: Web Content Fetching via MCP

**User Story:** As a developer, I want the tool to fetch live website content using MCP, so that I can analyze real-world websites without manual HTML downloading.

#### Acceptance Criteria

1. WHEN a URL is provided as input, THE MCP_Client SHALL launch mcp-server-fetch@2026.8.18 process via uvx and establish connection
2. WHEN the MCP connection is established, THE MCP_Client SHALL request HTML content from the specified URL with raw parameter set to true to receive HTML instead of markdown
3. WHEN requesting HTML content, THE MCP_Client SHALL set max_length parameter to 500000 characters or less to avoid exceeding the exclusive 1000000 character limit
4. WHEN the MCP server returns content without truncation notice, THE MCP_Client SHALL treat the response as complete
5. WHEN the MCP server returns content, THE MCP_Client SHALL strip two prefix lines if present: the "Content type ... cannot be simplified to markdown" line and the "Contents of <url>:" line
6. WHEN the MCP server returns content with truncation notice element, THE MCP_Client SHALL strip the "<error>Content truncated...</error>" element
7. WHEN the MCP server returns content with end-of-content marker, THE MCP_Client SHALL strip the "<error>No more content available.</error>" element
8. WHEN content fetching completes with truncation notice present, THE MCP_Client SHALL fetch additional content using start_index parameter to retrieve the complete document via pagination
9. WHEN content fetching and cleaning completes, THE MCP_Client SHALL pass the cleaned HTML content string to the HTML_Parser
10. IF the MCP server process fails to launch via uvx, THEN THE CLI_Tool SHALL display an error message indicating MCP server launch failure and exit with code 2
11. IF the MCP connection fails to establish, THEN THE CLI_Tool SHALL display an error message indicating MCP configuration issues and exit with code 2
12. IF the fetch tool call times out, THEN THE CLI_Tool SHALL display a descriptive error message including the URL and timeout reason and exit with code 2
13. IF the fetch fails due to robots.txt restrictions, THEN THE CLI_Tool SHALL display an error message indicating the URL is disallowed by robots.txt and exit with code 2
14. WHEN fetching completes successfully, THE CLI_Tool SHALL log the fetch duration and content size

### Requirement 3: HTML Parsing and Structure Analysis

**User Story:** As a developer, I want HTML content parsed into a queryable structure, so that validation checks can efficiently analyze document elements.

#### Acceptance Criteria

1. WHEN HTML content is received from any source, THE HTML_Parser SHALL parse the content into a Document Object Model (DOM) structure
2. THE HTML_Parser SHALL support both valid and malformed HTML documents
3. WHEN parsing completes, THE HTML_Parser SHALL provide query methods for selecting elements by tag, attribute, and CSS selector
4. IF parsing fails completely, THEN THE CLI_Tool SHALL report a parsing error with the failure reason
5. WHEN parsing a local file, THE HTML_Parser SHALL read the file content using UTF-8 encoding
6. THE HTML_Parser SHALL preserve line number information for elements to enable accurate violation reporting

### Requirement 4: Image Alternative Text Validation (WCAG 1.1.1)

**User Story:** As an accessibility auditor, I want all images checked for alternative text, so that screen reader users can understand image content.

#### Acceptance Criteria

1. WHEN the Validator_Engine analyzes a document, THE Validator_Engine SHALL identify all `<img>` elements
2. FOR ALL `<img>` elements, THE Validator_Engine SHALL verify the presence of an `alt` attribute
3. IF an `<img>` element lacks an `alt` attribute, THEN THE Validator_Engine SHALL record a violation with severity "error" referencing WCAG 1.1.1
4. IF an `<img>` element has an `alt` attribute with any value including empty string, THE Validator_Engine SHALL treat this as valid and record no violation
5. WHEN recording image violations, THE Report_Generator SHALL include the element tag, line number, and fix suggestion "Add alt attribute (use alt=\"\" for decorative images)"

### Requirement 5: Form Label Association Validation (WCAG 1.3.1)

**User Story:** As an accessibility auditor, I want all form inputs checked for associated labels, so that screen reader users understand input purposes.

#### Acceptance Criteria

1. WHEN the Validator_Engine analyzes a document, THE Validator_Engine SHALL identify all `<input>`, `<textarea>`, and `<select>` elements
2. WHERE form controls have `type="submit"`, `type="button"`, `type="reset"`, or `type="image"`, THE Validator_Engine SHALL skip label validation for those elements
3. WHERE form controls have `type="hidden"`, THE Validator_Engine SHALL skip label validation for those elements
4. FOR ALL other form control elements, THE Validator_Engine SHALL verify association with a `<label>` element via `for` attribute matching the control's `id`, OR verify the control is nested within a `<label>` element
5. IF a form control lacks label association, THE Validator_Engine SHALL check for `aria-label` or `aria-labelledby` attributes as alternative labeling methods
6. IF a form control has neither label association nor ARIA labeling, THEN THE Validator_Engine SHALL record a violation with severity "error" referencing WCAG 1.3.1
7. WHEN recording form label violations, THE Report_Generator SHALL include fix suggestion "Add associated label element or aria-label attribute"

### Requirement 6: Heading Hierarchy Validation (WCAG 1.3.1)

**User Story:** As an accessibility auditor, I want heading hierarchy validated for sequential structure, so that screen reader users can navigate content logically.

#### Acceptance Criteria

1. WHEN the Validator_Engine analyzes a document, THE Validator_Engine SHALL identify all heading elements (`<h1>` through `<h6>`) in document order
2. IF the first heading in the document is not `<h1>`, THEN THE Validator_Engine SHALL record a violation with severity "warning" indicating the first heading should be `<h1>`
3. FOR ALL subsequent headings, THE Validator_Engine SHALL verify that heading levels do not skip (e.g., `<h2>` cannot be followed directly by `<h4>`)
4. IF a heading level skip is detected, THEN THE Validator_Engine SHALL record a violation with severity "warning" referencing WCAG 1.3.1
5. THE Validator_Engine SHALL allow multiple headings of the same level consecutively
6. WHEN recording heading violations, THE Report_Generator SHALL include the detected heading level, expected level, line number, and fix suggestion "Adjust heading level to maintain sequential hierarchy"

### Requirement 7: Link Text Descriptiveness Validation (WCAG 2.4.4)

**User Story:** As an accessibility auditor, I want link text checked for descriptiveness, so that screen reader users understand link destinations without surrounding context.

#### Acceptance Criteria

1. WHEN the Validator_Engine analyzes a document, THE Validator_Engine SHALL identify all `<a>` elements with `href` attributes
2. FOR ALL link elements, THE Validator_Engine SHALL extract the visible text content
3. FOR ALL link elements, THE Validator_Engine SHALL check for `<img>` elements with `alt` attributes nested within the link and treat image alt text as link text
4. IF a link's text content matches common non-descriptive phrases ("click here", "read more", "here", "link", "more"), THEN THE Validator_Engine SHALL record a violation with severity "warning" referencing WCAG 2.4.4
5. IF a link has no visible text content and no image with alt text, THE Validator_Engine SHALL check for `aria-label` or `aria-labelledby` attributes
6. IF a link has neither visible text nor image alt text nor ARIA labeling, THEN THE Validator_Engine SHALL record a violation with severity "error"
7. WHEN recording link violations, THE Report_Generator SHALL include the link href, current text, and fix suggestion "Use descriptive link text indicating destination"

### Requirement 8: Color Contrast Validation (WCAG 1.4.3)

**User Story:** As an accessibility auditor, I want basic color contrast checks performed, so that users with visual impairments can read text content.

#### Acceptance Criteria

1. WHEN the Validator_Engine analyzes a document, THE Validator_Engine SHALL identify elements with inline style attributes specifying both color and background-color
2. FOR ALL elements with inline color styles, THE Validator_Engine SHALL calculate the contrast ratio between foreground and background colors
3. IF the contrast ratio is less than 4.5:1 for normal text, THEN THE Validator_Engine SHALL record a violation with severity "warning" referencing WCAG 1.4.3
4. IF the contrast ratio is less than 3:1 for large text (18pt or 14pt bold), THEN THE Validator_Engine SHALL record a violation with severity "warning"
5. WHERE color information is not available via inline styles, THE Validator_Engine SHALL skip contrast validation for those elements
6. WHEN recording contrast violations, THE Report_Generator SHALL include the calculated contrast ratio, required ratio, and fix suggestion "Increase contrast between text and background colors"

### Requirement 9: HTML Pretty Printer and Round-Trip Testing

**User Story:** As a developer, I want HTML documents formatted consistently, so that I can verify parsing accuracy through round-trip conversion.

#### Acceptance Criteria

1. THE HTML_Parser SHALL provide a pretty-print method that formats parsed DOM structures back into HTML strings
2. THE Pretty_Printer SHALL use consistent indentation of two spaces per nesting level
3. THE Pretty_Printer SHALL preserve element attributes in alphabetical order
4. THE Pretty_Printer SHALL preserve text content equivalent modulo whitespace
5. FOR ALL valid HTML documents, parsing then pretty-printing then parsing again SHALL produce an equivalent DOM structure (round-trip property)
6. WHEN round-trip property fails, THE CLI_Tool SHALL log a warning indicating potential parsing issues

### Requirement 10: JSON Report Generation and Output

**User Story:** As a developer, I want structured JSON reports of violations, so that I can integrate results into automated testing pipelines and review violations systematically.

#### Acceptance Criteria

1. WHEN validation completes, THE Report_Generator SHALL produce a JSON report containing all detected violations
2. THE Report_Generator SHALL structure each violation with fields: wcag (criterion reference), severity (error or warning), element (HTML tag), issue (description), line (number), fix (suggestion)
3. THE Report_Generator SHALL include report metadata: source (URL or file path), timestamp (ISO 8601 format), totalViolations (count), errorCount (count), warningCount (count)
4. WHEN the `--output` flag is provided, THE CLI_Tool SHALL write the JSON report to the specified file path
5. WHEN no `--output` flag is provided, THE CLI_Tool SHALL print the JSON report to standard output
6. THE CLI_Tool SHALL also print a human-readable summary showing violation counts by severity and by WCAG criterion

### Requirement 11: Error Handling and User Feedback

**User Story:** As a developer, I want clear error messages when issues occur, so that I can quickly identify and resolve problems.

#### Acceptance Criteria

1. IF a specified local file does not exist, THEN THE CLI_Tool SHALL display an error message with the attempted file path and exit with code 4
2. IF a URL scheme is not http or https, THEN THE CLI_Tool SHALL display an error message indicating only http and https are allowed and exit with code 1
3. IF a URL is unreachable or the fetch fails, THEN THE CLI_Tool SHALL display the URL and error description and exit with code 2
4. IF HTML parsing fails, THEN THE CLI_Tool SHALL display the content source and parsing error details and exit with code 3
5. IF report file writing fails due to permissions or disk space, THEN THE CLI_Tool SHALL display the file path and error details and exit with code 4
6. WHEN invalid CLI arguments are provided, THE CLI_Tool SHALL display an error message with usage instructions and exit with code 1
7. WHEN the CLI_Tool encounters any error, THE CLI_Tool SHALL provide actionable guidance for resolving the issue

### Requirement 12: TypeScript Type Safety and Validation

**User Story:** As a developer, I want strong TypeScript types throughout the codebase, so that I can catch errors at compile time and maintain code quality.

#### Acceptance Criteria

1. THE CLI_Tool SHALL define TypeScript interfaces for all data structures including Violation, AccessibilityReport, ParsedDocument, and ParseOptions
2. ALL validator functions SHALL use explicit return types and parameter types
3. THE CLI_Tool SHALL enable strict TypeScript compiler options including strictNullChecks, noImplicitAny, and strictFunctionTypes
4. WHEN the project builds, THE TypeScript compiler SHALL produce no type errors
5. ALL exported functions SHALL include JSDoc comments documenting WCAG criterion references
6. THE CLI_Tool SHALL use type guards for runtime type validation of user inputs and external data

## Requirements Quality Verification

All requirements in this document follow EARS patterns (Ubiquitous, Event-driven, State-driven, Unwanted event, Optional feature) and comply with INCOSE quality rules:

- ✅ Active voice with specific system names from Glossary
- ✅ Measurable and testable conditions
- ✅ No vague terms like "quickly" or "adequate"
- ✅ No escape clauses like "where possible"
- ✅ Solution-free (implementation details reserved for design phase)
- ✅ Positive statements preferred (negative statements used only for error handling)
- ✅ One testable thought per acceptance criterion
- ✅ Consistent terminology from Glossary

## Kiro University Lesson Integration Notes

This requirements document integrates all nine Kiro University lessons (7 required + 2 bonus):

### Required Lessons (1-7)

- **Lesson 1 (Spec-driven Development)**: This requirements document uses EARS notation and structured acceptance criteria with property-based testing focus. Spec files live at `.kiro/specs/wcag-accessibility-checker/` (`requirements.md`, `design.md`, `tasks.md`)
- **Lesson 2 (Steering Documents)**: Five steering files will be created in the workspace `.kiro/steering/` directory (committed to the repo so graders can inspect them):
  - `validator-pattern.md`: Enforces WCAG compliance check patterns
  - `wcag-compliance.md`: Ensures proper WCAG criterion referencing
  - `error-handling.md`: Standardizes error messages and exit codes
  - `jsdoc-standards.md`: Enforces JSDoc documentation with WCAG references
  - `testing-standards.md`: `fileMatch` inclusion on `**/*.test.ts`; covers fast-check conventions, `numRuns` values, the independent-oracle rule (properties must not reuse the implementation under test as their oracle), safe generator alphabets, and the `// Feature: wcag-accessibility-checker, Property N` tag on every property test
  - Each file covers one domain, places its front matter as the very first content, and follows a standard / context / good-vs-bad example structure
- **Lesson 3 (Hooks)**: Two hooks will be configured:
  - `PostFileSave`: Automatically runs ESLint on TypeScript file saves
  - `PostTaskExec`: Runs test suite after task completion to verify implementation
- **Lesson 4 (Property-Based Testing)**: 15 property-based tests will verify:
  - HTML parser round-trip properties
  - Heading hierarchy invariants
  - Validator consistency properties
  - Link text validation properties
  - Form label association properties
  - Property tests are run from the Kiro IDE spec task list
  - Cheap pure-function properties use `numRuns` ≥ 200
  - Evidence: a screenshot of the passed PBT tasks in the task list plus captured test output at `docs/evidence/pbt-output.txt`
  - A cloud session run (Bonus 1) is supplementary evidence only, not the primary Lesson 4 evidence
- **Lesson 5 (Powers)**: Install the curated "Power Builder" power from the Kiro powers registry via the Powers panel:
  - Power Builder is the only power claimed for Lesson 5; the Bonus 2 `ada-wcag` power is NOT claimed for Lesson 5
  - Used during development to scaffold and check the Bonus 2 power
  - Evidence: a README section and a spec task that triggers Power Builder by keyword and uses it
- **Lesson 6 (MCP)**: MCP configuration will enable:
  - Configuration file at `.kiro/settings/mcp.json` specifying mcp-server-fetch@2026.8.18
  - Usage from Kiro chat interface for testing
  - Integration within the CLI application for URL fetching
- **Lesson 7 (Custom Agent)**: Create accessibility-auditor custom agent with:
  - `includeMcpJson`: true (to enable MCP server access)
  - `includePowers`: true (boolean; enables installed powers, including Power Builder from Lesson 5)
  - `resources` including `file://.kiro/steering/**/*.md` (custom agents do not load steering automatically) plus the WCAG reference file
  - Specialized prompts for WCAG compliance checking

### Bonus Lessons (8-9)

- **Bonus 1 (Cloud Sessions)**: Configure and use Kiro cloud sessions:
  - Upload steering files, custom agents, and hooks beforehand via Kiro Web Settings > Sync
  - Run the validator unit tests and property tests in a cloud session (no uvx or network access required)
  - Proof: the `/config` Source column shows the synced cloud configuration
- **Bonus 2 (Package Power)**: Package the checker as a skills-only Kiro power named `ada-wcag`:
  - `plugin.json` at the power root (`power/`) with `$schema` `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`, name `ada-wcag`, the real author name, and keywords `["wcag","a11y","accessibility","ada"]`
  - Skill at `skills/wcag-validator/SKILL.md` with front matter `name` and `description`, content derived from Requirements 4–8, 10, 11 and CLI usage
  - JSON report schema in `skills/wcag-validator/references/`
  - Scaffolded and checked with Power Builder
  - Kept in the main repo under `power/` and published as a separate public repository
  - Installed via the Powers panel "Add power from Local Path"

## Next Steps

Upon approval of these requirements, the workflow will proceed to:

1. **Design Phase**: Create technical design with architecture, component specifications, and correctness properties
2. **Task Breakdown Phase**: Generate implementation tasks from design specifications
3. **Implementation Phase**: Execute tasks with property-based testing validation

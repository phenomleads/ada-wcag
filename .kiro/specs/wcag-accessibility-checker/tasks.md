# Implementation Plan: WCAG Accessibility Checker

## Overview

This implementation plan builds a TypeScript-based CLI tool that performs automated WCAG 2.1 Level AA accessibility audits. The tool fetches web content via Model Context Protocol (MCP), parses HTML using cheerio, executes five validation checks, and generates structured JSON reports.

**CRITICAL: Task Execution Order**

Tasks MUST execute in this exact order:
1. **Phase 1: Kiro University Lesson Configuration (Tasks 15, 16, 18, 17, 19)** - MUST complete before any code implementation
2. **Phase 2: Project Setup and Implementation (Tasks 1-14, 20-21)** - Execute after Phase 1 completes
3. **Phase 3: Bonus Lessons and README (Tasks 22, 24, 23)** - Execute after Phase 2 completes
4. **Phase 4: Submission (Tasks 25, 27)** - Execute last

The PostTaskExec hook runs `npx vitest run --passWithNoTests`, so it succeeds even before test files exist.

## Tasks

### Phase 1: Kiro University Lesson Configuration (MUST EXECUTE FIRST)

- [ ] 15. Create steering files for code patterns and documentation standards
  - Create `.kiro/steering/validator-pattern.md` documenting consistent validator interface implementation
  - Create `.kiro/steering/wcag-compliance.md` documenting common WCAG violation detection patterns
  - Create `.kiro/steering/error-handling.md` documenting consistent error types, exit codes (1=CLI, 2=MCP, 3=parse, 4=file I/O), and user messages
  - Create `.kiro/steering/jsdoc-standards.md` documenting JSDoc comment requirements with WCAG criterion references
  - Create `.kiro/steering/testing-standards.md` with front matter `inclusion: fileMatch` / `fileMatchPattern: "**/*.test.ts"` covering fast-check conventions, numRuns (≥ 200 for cheap pure-function properties, ≥ 100 otherwise), the independent-oracle rule, safe alphabets for generated ids/types, and the `// Feature: wcag-accessibility-checker, Property N` tag
  - Workspace `.kiro/steering/` is the correct location; one domain per file
  - Each steering file MUST follow the lesson template: (a) the standard/convention to enforce, (b) the context/intent behind it, (c) a GOOD vs BAD TypeScript code example
  - Each steering file MUST use default (always) inclusion or `fileMatch` frontmatter (e.g. `inclusion: fileMatch`, `fileMatchPattern: "src/**/*.ts"`) so it actually applies
  - Front matter MUST be the very first content of the file (no blank line before the opening `---`)
  - Verification: after creating them, ask Kiro to generate a small piece of code (e.g. a stub validator) and confirm the output follows the steering; screenshot to `docs/evidence/`
  - **Lesson 2: Steering Documents**
  - _Requirements: 11.1-11.7, 12.5_

- [ ] 16. Configure hooks for automated linting and testing
  - Create `.kiro/hooks/accessibility-checker-hooks.json` with `"version": "v1"` hook configuration (matches design exactly)
  - PostFileSave hook: name "TypeScript Linter", trigger `PostFileSave`, matcher `\\.ts$`, command action `npx eslint .` (lints the whole project; stdin context is not used)
  - PostTaskExec hook: name "Post-Task Test Runner", trigger `PostTaskExec`, command action `npx vitest run --passWithNoTests`
  - Neither hook can block the triggering action
  - **Lesson 3: Hooks**
  - _Requirements: 12.4_

- [ ] 18. Create custom accessibility-auditor agent and WCAG reference documentation
  - Create `docs/WCAG-2.1-reference.md` with WCAG 2.1 Level AA reference content for 1.1.1, 1.3.1, 1.4.3, 2.4.4 (must exist before the agent references it)
  - Create `.kiro/agents/accessibility-auditor.json` matching the design:
    - name: "accessibility-auditor"
    - model: "claude-sonnet-5"
    - description: "Specialized agent for WCAG accessibility analysis with deep knowledge of WCAG 2.1 Level AA criteria and remediation techniques"
    - prompt: accessibility expert instructions covering image alt text, form labels, heading hierarchy, link text, and color contrast (use `prompt`, not `instructions`)
    - tools: ["read", "write", "shell"]
    - resources: ["file://.kiro/steering/**/*.md", "file://./docs/WCAG-2.1-reference.md"] (custom agents don't load steering automatically)
    - permissions.rules: [{ "capability": "shell", "match": ["npm *", "npx *"], "effect": "allow" }]
    - includeMcpJson: true, includePowers: true (booleans)
    - welcomeMessage: "Ready to audit. Point me at a URL or HTML file and I'll check it against WCAG 2.1 AA."
  - **Lesson 7: Custom Agent**

- [ ] 17. Install Power Builder and document it
  - Install "Power Builder" from the Kiro powers registry via the Powers panel (installs outside the repo)
  - Trigger it by keyword in chat (e.g. "build a power") and use its guidance to plan the Bonus 2 accessibility-checker power (Task 22)
  - Record a screenshot of the activation to `docs/evidence/`
  - Add a README section stating Power Builder was installed and why it helps the workflow
  - **Lesson 5: Powers**

- [ ] 19. Create MCP configuration file for Lesson 6 evidence
  - Create `.kiro/settings/mcp.json` with `mcpServers.fetch`: command "uvx", args ["mcp-server-fetch@2026.8.18"]
  - Warm the uvx cache by running `uvx mcp-server-fetch@2026.8.18` once
  - Have Kiro itself call the fetch tool once in chat (e.g. to capture a page into `test/fixtures/`) as Lesson 6 evidence; screenshot to `docs/evidence/`
  - **Lesson 6: MCP**
  - _Requirements: 2.1_

### Phase 2: Project Setup and Implementation

- [ ] 1. Set up project structure and dependencies
  - Initialize Node.js project with TypeScript configuration
  - Install dependencies (exact/pinned versions in package.json where practical; commit `package-lock.json`):
    - typescript@5.9.3 (exact)
    - typescript-eslint@^8 (supports TypeScript <6.1)
    - @types/node, tsx
    - eslint@^10.11.0, @eslint/js
    - vitest@^5.0.0, fast-check@^4.10.0
    - commander@^15.0.0, cheerio@^1.2.0, @modelcontextprotocol/sdk@^1.31.0
    - http-server (pinned, devDependency)
  - Create `tsconfig.json` with strict options (strict, strictNullChecks, noImplicitAny, strictFunctionTypes)
  - Create `eslint.config.js` using typescript-eslint
  - npm scripts: `"start": "tsx src/cli.ts"`, `"build": "tsc"`, `"test": "vitest run --passWithNoTests"`, `"lint": "eslint ."`
  - Create `.gitignore` (node_modules, dist) and ensure it does NOT exclude `.kiro/`
  - Create src/ directories: types/, mcp/, parser/, validators/, report/; `src/cli.ts` is a file
  - _Requirements: 12.3, 12.4_

- [ ] 2. Implement TypeScript type definitions
  - Create `src/types/index.ts` with CLIOptions, ParsedDocument, ParseOptions, Violation, AccessibilityReport, Validator, FetchResult, ReportMetadata, RGBColor, Luminance, ContrastRatio
  - Define error classes: CLIError, MCPConnectionError, MCPFetchError, ParseError, FileWriteError
  - Include type guards for user inputs and external data
  - Include JSDoc comments with WCAG criterion references
  - _Requirements: 12.1, 12.2, 12.5, 12.6_

- [ ] 3. Implement CLI interface with argument parsing
  - Create `src/cli.ts` with main entry point and exported `validateArguments`
  - Use commander to parse --url, --file, --output flags
  - --url and --file are mutually exclusive (exit 1)
  - Only http and https URL schemes allowed (exit 1)
  - Display usage instructions with examples when no arguments provided
  - Invalid argument format: exit 1 with usage; file not found: exit 4; unwritable output: exit 4
  - Provide actionable guidance in every error message
  - Call orchestrator with validated options
  - _Requirements: 1.1-1.8, 11.1, 11.2, 11.6, 11.7_

- [ ] 3.1 Write property test for CLI argument validation
  - **Property 12: CLI Argument Validation**
  - **Validates: Requirements 1.2, 1.4, 1.6, 11.6**
  - Generate random invalid CLI arguments (malformed URLs, disallowed schemes, non-existent paths)
  - Verify validation throws CLIError with appropriate exit codes (1 or 4)
  - Test mutual exclusivity of --url and --file
  - Use fast-check with numRuns ≥ 200

- [ ] 4. Implement MCP client for web content fetching
  - Create `src/mcp/client.ts` with fetchHTML function
  - Launch `uvx mcp-server-fetch@2026.8.18` via StdioClientTransport and connect
  - Call `fetch` with `raw: true`, `max_length: 500000`, `start_index`
  - Strip the two prefix lines if present: the "Content type … cannot be simplified to markdown" line and the "Contents of <url>:" line
  - Strip `<error>Content truncated…</error>` and `<error>No more content available.</error>`
  - Paginate with start_index; stop when the truncation notice is absent; concatenate chunks
  - Handle both error paths: catch thrown exceptions AND check `result.isError` (use its text content as reason) → MCPFetchError
  - Timeout handling (default 30s), robots.txt disallow message, server spawn/connection failure → exit 2
  - Log fetch duration and content size; clean up server process
  - _Requirements: 2.1-2.14_

- [ ]* 4.1 Write integration tests for MCP client
  - Test server launch and connection via uvx
  - Test successful fetch from a local HTTP server serving test/fixtures
  - Test timeout handling and robots.txt disallow handling
  - Test both `result.isError` and thrown-exception paths map to MCPFetchError
  - Test pagination for large responses (>500000 chars)
  - Test content cleaning (two prefix lines, truncation notice, no-more-content notice)
  - _Requirements: 2.1-2.14_

- [ ] 5. Implement HTML parser with cheerio
  - Create `src/parser/html-parser.ts` with parseHTML function
  - Use cheerio.load() with `sourceCodeLocationInfo: true`
  - Handle malformed HTML gracefully; throw ParseError only for empty/unparseable content
  - Implement getElementLine using `sourceCodeLocation.startLine`
  - _Requirements: 3.1-3.6_

- [ ] 6. Implement HTML pretty-printer for round-trip testing
  - Create prettyPrint function in `src/parser/html-parser.ts`
  - 2-space indentation per nesting level; attributes sorted alphabetically
  - Preserve text content (equivalent modulo whitespace); newlines between block elements
  - _Requirements: 9.1-9.4_

- [ ] 6.1 Write property test for HTML round-trip
  - **Property 1: HTML Round-Trip Preservation**
  - **Validates: Requirements 9.5**
  - Custom HTML arbitrary (fc.htmlDocument() does not exist); parse → pretty-print → parse; compare with isEquivalentDOM
  - numRuns ≥ 100; tag: `// Feature: wcag-accessibility-checker, Property 1`

- [ ] 6.2 Write property test for pretty-printer indentation
  - **Property 14: Pretty-Printer Indentation Consistency**
  - **Validates: Requirements 9.2**
  - Generate random nested HTML; verify each level adds exactly 2 spaces; numRuns ≥ 100

- [ ] 6.3 Write property test for attribute ordering
  - **Property 15: Pretty-Printer Attribute Ordering**
  - **Validates: Requirements 9.3**
  - Random attributes in random order; verify alphabetical output; numRuns ≥ 100

- [ ] 6.4 Write property test for line number tracking
  - **Property 13: Line Number Preservation**
  - **Validates: Requirements 3.6**
  - Generate HTML with known element positions; verify startLine; numRuns ≥ 100

- [ ] 7. Implement validator engine with plugin architecture
  - Create `src/validators/engine.ts` with runValidators and registerValidator
  - Register the five validators; wrap each validate() in try-catch; log and continue on failure
  - Aggregate violations into a single array
  - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1, 12.2_

- [ ] 7.1 Write property test for validator determinism
  - **Property 2: Validator Determinism**
  - **Validates: Requirements 4.1, 5.1, 6.1, 7.1, 8.1**
  - Run each validator twice on the same random document; verify deep equality; numRuns ≥ 100

- [ ] 8. Implement ImageAltValidator for WCAG 1.1.1
  - Create `src/validators/image-alt.ts` implementing Validator
  - Report error only for missing alt attribute; `alt=""` is valid (no violation)
  - Fix text exactly: `Add alt attribute (use alt="" for decorative images)`
  - Include element tag and line number
  - _Requirements: 4.1-4.5_

- [ ]* 8.1 Write unit tests for ImageAltValidator
  - Missing alt (error), `alt=""` (no violation), descriptive alt (valid)
  - _Requirements: 4.2-4.5_

- [ ] 8.2 Write property test for image alt detection completeness
  - **Property 3: Image Alt Detection Completeness**
  - **Validates: Requirements 4.2, 4.3, 4.4**
  - Independent oracle walks DOM counting images with missing alt only (not empty alt); verify exact count; numRuns ≥ 100

- [ ] 9. Implement FormLabelValidator for WCAG 1.3.1
  - Create `src/validators/form-label.ts` implementing Validator
  - Controls: input (excluding hidden/submit/button/reset/image), textarea, select
  - Accept explicit label (for=id), implicit (nested in label), aria-label, aria-labelledby with valid reference
  - Report error otherwise; fix: "Add associated label element or aria-label attribute"
  - _Requirements: 5.1-5.7_

- [ ]* 9.1 Write unit tests for FormLabelValidator
  - Explicit, implicit, aria-label (valid); unlabeled (error); excluded input types skipped
  - _Requirements: 5.1-5.7_

- [ ] 9.2 Write property test for form label completeness
  - **Property 6: Form Label Completeness**
  - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6**
  - Independent oracle counts unlabeled controls, excluding type hidden/submit/button/reset/image; safe alphanumeric ids; numRuns ≥ 100

- [ ] 10. Implement HeadingHierarchyValidator for WCAG 1.3.1
  - Create `src/validators/heading-hierarchy.ts` implementing Validator
  - Headings h1-h6 in document order; warning if first is not h1; warning on level skips
  - Allow consecutive same-level headings
  - Include detected level, expected level, line number, and fix suggestion
  - _Requirements: 6.1-6.6_

- [ ]* 10.1 Write unit tests for HeadingHierarchyValidator
  - [h1,h2,h3] valid; [h2,h3] warning; [h1,h2,h4] warning; [h1,h2,h2,h3] valid
  - _Requirements: 6.1-6.6_

- [ ] 10.2 Write property test for heading hierarchy sequential property
  - **Property 4: Heading Hierarchy Sequential Property**
  - **Validates: Requirements 6.2, 6.3**
  - No violations ⇒ first is h1 and no skips; empty headings valid; numRuns ≥ 200

- [ ] 10.3 Write property test for heading hierarchy violation detection
  - **Property 5: Heading Hierarchy Violation Detection**
  - **Validates: Requirements 6.3, 6.4**
  - Sequences with intentional skips produce at least one violation; numRuns ≥ 200

- [ ] 11. Implement LinkTextValidator for WCAG 2.4.4
  - Create `src/validators/link-text.ts` implementing Validator
  - All `<a href>`; visible text trimmed/lowercased plus nested img[alt] text
  - Non-descriptive phrases: ["click here", "read more", "here", "link", "more", "click", "read this"] → warning
  - No text, no img alt, no aria-label/aria-labelledby → error
  - Include href, current text, fix "Use descriptive link text indicating destination"
  - _Requirements: 7.1-7.7_

- [ ]* 11.1 Write unit tests for LinkTextValidator
  - Descriptive (valid), "click here" (warning), empty (error), img alt only (valid)
  - _Requirements: 7.1-7.7_

- [ ] 11.2 Write property test for link text detection
  - **Property 7: Link Text Detection**
  - **Validates: Requirements 7.3, 7.5, 7.6**
  - Independent oracle: link counted only if empty text AND no aria-label AND no aria-labelledby AND no img[alt] child (img[alt] counts as text); numRuns ≥ 100

- [ ] 12. Implement ColorContrastValidator for WCAG 1.4.3
  - Create `src/validators/color-contrast.ts` implementing Validator
  - Elements with inline style containing both color and background-color; skip otherwise
  - WCAG relative luminance and contrast ratio formula
  - Large text = 18pt+ or 14pt+ bold; warning if < 3:1 (large) or < 4.5:1 (normal)
  - Include calculated ratio, required ratio, fix "Increase contrast between text and background colors"
  - _Requirements: 8.1-8.6_

- [ ]* 12.1 Write unit tests for ColorContrastValidator
  - Low contrast normal/large text, sufficient contrast, known color pairs
  - _Requirements: 8.1-8.6_

- [ ] 12.2 Write property test for contrast calculation correctness
  - **Property 8: Color Contrast Calculation Correctness**
  - **Validates: Requirements 8.2**
  - Random RGB pairs: ratio in [1, 21], matches reference formula, symmetric; numRuns ≥ 200

- [ ] 12.3 Write property test for contrast threshold detection
  - **Property 9: Contrast Threshold Detection**
  - **Validates: Requirements 8.3, 8.4**
  - Low-contrast inline styles produce warnings; numRuns ≥ 100

- [ ] 13. Implement report generator with JSON and summary formatting
  - Create `src/report/generator.ts` with generateReport, generateSummary, writeReport
  - Metadata: source, timestamp (ISO 8601), totalViolations, errorCount, warningCount
  - Group by WCAG criterion; summary with counts by severity and criterion and ❌/⚠️/✅ status
  - Write JSON to file or stdout; FileWriteError → exit 4
  - _Requirements: 10.1-10.6, 11.5_

- [ ] 13.1 Write property test for report structure invariants
  - **Property 10: Report Structure Invariants**
  - **Validates: Requirements 10.1, 10.2, 10.3**
  - Random violation arrays; verify counts and exactly-one grouping; numRuns ≥ 200

- [ ] 13.2 Write property test for summary correctness
  - **Property 11: Violation Count Summary Correctness**
  - **Validates: Requirements 10.6**
  - Parse summary counts and compare with report; numRuns ≥ 200

- [ ] 14. Implement main orchestrator to coordinate pipeline
  - Create `src/index.ts`; route URLs to MCP client, files to UTF-8 fs read
  - Pipeline: Fetch/Read → Parse → Validate → Report; log round-trip warning if it fails
  - Map errors to exit codes: 1 CLI, 2 MCP, 3 parse, 4 file I/O
  - Log stage timings; output report and summary
  - _Requirements: 2.9, 2.14, 3.4, 3.5, 9.6, 10.4, 10.5, 11.1-11.7_

- [ ] 20. Checkpoint - Ensure all tests pass
  - Run `npm run build`, `npm run lint`, `npm test`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Create test fixtures and end-to-end tests
  - Create `test/fixtures/sample.html` with at least one violation of each of the five checks (missing alt, unlabeled input, heading skip, non-descriptive/empty link, low contrast)
  - End-to-end test: file input → parse → validate → report
  - End-to-end test: URL input via a local HTTP server (`npx http-server test/fixtures -p 8080`) → MCP fetch → report (file:// is rejected by the scheme check)
  - Test report output to file and stdout
  - Demo commands: `npm start -- --file test/fixtures/sample.html` and `npm start -- --url http://localhost:8080/sample.html`
  - _Requirements: 1.1, 1.3, 2.9, 10.4, 10.5_
  - Switch to the accessibility-auditor agent and ask it to audit test/fixtures/sample.html, and ask it which steering rules it has loaded; screenshot both to docs/evidence/ (Lessons 2 + 7 evidence)

### Phase 3: Bonus Lessons and README

- [ ] 22. Package accessibility-checker Kiro power (Bonus Lesson 2)
  - Use Power Builder to scaffold the power and check it
  - Create `power/plugin.json`:
    - $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
    - name: "ada-wcag", version: "1.0.0"
    - description: "WCAG 2.1 Level AA accessibility validation with automated violation detection"
    - author: { "name": "<YOUR REAL NAME>" } — replace with your real name before submission
    - keywords: ["wcag", "a11y", "accessibility", "ada"]
  - Skills-only power (no mcp.json)
  - Create `power/skills/wcag-validator/SKILL.md` with front matter `name` and `description`
    - Derive content from requirements 4–8 (criteria, severities, fix text), 10 (report schema), 11 (exit codes), and CLI usage
  - Create `power/skills/wcag-validator/references/report-schema.json` describing the report structure (Requirement 10)
  - Install via Powers panel "Add power from Local Path" selecting `power/`
  - Trigger by keyword in chat (e.g. "check this page for wcag issues") and capture a screenshot to `docs/evidence/`
  - LAST: publish a separate public GitHub repo with `plugin.json` at root, and link it from README
  - Not claimed for Lesson 5 (Lesson 5 is Power Builder, Task 17)
  - **Bonus Lesson 2: Create a Power**

- [ ] 24. Create comprehensive README
  - Installation, usage (--url, --file, --output), architecture overview, WCAG coverage summary
  - Lesson-to-file map with full paths:
    - Lesson 1 → `.kiro/specs/wcag-accessibility-checker/{requirements,design,tasks}.md`
    - Lesson 2 → `.kiro/steering/{validator-pattern,wcag-compliance,error-handling,jsdoc-standards,testing-standards}.md`
    - Lesson 3 → `.kiro/hooks/accessibility-checker-hooks.json`
    - Lesson 4 → `test/**/*.test.ts` and `docs/evidence/pbt-output.txt`
    - Lesson 5 → Power Builder section and `docs/evidence/` screenshot
    - Lesson 6 → `.kiro/settings/mcp.json`, `src/mcp/client.ts`, Kiro chat fetch evidence
    - Lesson 7 → `.kiro/agents/accessibility-auditor.json`, `docs/WCAG-2.1-reference.md`
    - Bonus 1 → cloud `/config` screenshot in `docs/evidence/`
    - Bonus 2 → `power/` (ada-wcag) and link to separate power repo
  - Demo instructions using the local fixture server

- [ ] 23. Cloud session with cloud configuration (Bonus Lesson 1)
  - Prerequisites: Kiro IDE v1.0.293+, paid plan
  - Push the repo to GitHub
  - Copy ONLY `steering/`, `agents/`, `hooks/` from project `.kiro/` into `~/.kiro/`
  - Upload via Kiro Web Settings > Sync, one top-level folder at a time
  - THEN start a cloud session from the IDE (Agent Focus Mode) on the repo
  - Run unit tests and property tests only (no uvx/network)
  - Run `/config` and capture the Source column screenshot to `docs/evidence/`
  - No commits after October 5, 2026 23:59 PT until judging ends October 19, 2026
  - **Bonus Lesson 1: Cloud Session**

### Phase 4: Submission

- [ ] 25. Write submission writeup
  - Create `docs/SUBMISSION.md` with a 2–3 sentence project description
  - Per-lesson writeup of how each of the 9 lessons (7 required + 2 bonus) was incorporated, with file paths

- [ ] 27. Repo and submission checklist
  - Public GitHub repo owned by you (account ≥3 months old), `.kiro/` committed
  - At least one commit on/after September 21, 2026 09:00 PT and none before
  - Final push before October 5, 2026 23:59 PT; no commits after the deadline until judging ends
  - Social post on X or LinkedIn with #KiroUniversity #BuildWithKiro, tagging @kirodotdev (X) or @kiro (LinkedIn), including repo link and description
  - Submit entry form at https://kiro.dev/2026/university with correct email, repo link, and post link

## Notes

- Phase order is mandatory: Phase 1 → Phase 2 → Phase 3 → Phase 4
- Tasks marked with `*` (unit and integration tests) are optional and can be skipped to save time
- Property-based test sub-tasks are MANDATORY (no star)
- numRuns ≥ 200 for cheap pure-function properties (3.1 P12, 10.2 P4, 10.3 P5, 12.2 P8, 13.1 P10, 13.2 P11); ≥ 100 for all others
- Run every PBT from the IDE task list (not the terminal). Lesson 4 evidence = screenshot of passed PBT tasks + `docs/evidence/pbt-output.txt`
- Capture any natural PBT failure-and-fix (counterexample, fix, re-run) as additional evidence
- The cloud run (Task 23) is extra evidence only, not the primary Lesson 4 proof
- Property tests 3, 6, 7 use independent oracles to avoid tautology
- MCP: Python mcp-server-fetch@2026.8.18 via uvx, `raw: true`, max_length 500000
- Exit codes: 1=CLI, 2=MCP, 3=parse, 4=file I/O
- Store screenshots and evidence in `docs/evidence/`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["15", "16", "18"] },
    { "id": 1, "tasks": ["17", "19"] },
    { "id": 2, "tasks": ["1"] },
    { "id": 3, "tasks": ["2"] },
    { "id": 4, "tasks": ["3", "4", "5"] },
    { "id": 5, "tasks": ["3.1", "4.1", "6"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4", "7"] },
    { "id": 7, "tasks": ["7.1", "8", "9", "10", "11", "12"] },
    { "id": 8, "tasks": ["8.1", "8.2", "9.1", "9.2", "10.1", "10.2", "10.3", "11.1", "11.2", "12.1", "12.2", "12.3", "13"] },
    { "id": 9, "tasks": ["13.1", "13.2", "14"] },
    { "id": 10, "tasks": ["20"] },
    { "id": 11, "tasks": ["21"] },
    { "id": 12, "tasks": ["22"] },
    { "id": 13, "tasks": ["24"] },
    { "id": 14, "tasks": ["23"] },
    { "id": 15, "tasks": ["25", "27"] }
  ]
}
```

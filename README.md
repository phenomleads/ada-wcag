# ada-wcag — Accessibility Checker

Web accessibility isn't optional — it's how people using screen readers, keyboard navigation, and assistive tech actually access the web, and it's a legal requirement (ADA, Section 508, EN 301 549) for a huge share of software. `ada-wcag` is a real, working TypeScript CLI tool that audits a URL or local HTML file against five WCAG 2.1 Level AA success criteria and produces a structured, machine-readable JSON report with exact remediation guidance — not a mockup, a functioning pipeline you can run right now.

This project was built for the **Kiro University Challenge**, and nearly every Kiro feature taught in the challenge was used for a real purpose here, not bolted on for credit: **spec-driven development** turned fuzzy requirements into 12 EARS-notated requirements before a line of code was written; **steering documents** kept five independently-built validators consistent in WCAG codes, severities, and fix text; **hooks** linted and tested automatically on every save and task completion; **property-based testing** caught three genuine bugs during development (not hypothetical ones — real counterexamples, shown below); **MCP** gave the tool and Kiro itself a shared way to fetch live web content; a **custom agent** turned the whole rule set into a conversational auditor that provably loads the same steering as the codebase; and a **Kiro Power** repackaged that same domain knowledge into a portable, keyword-activated skill usable in any Kiro project. Kiro didn't just help write the code — its structured workflow is the reason five interlocking validators, 15 property tests, and a working CLI could be built, verified, and kept consistent in a few days of focused sessions.

## What it does

```bash
# Analyze a local HTML file
npm start -- --file test/fixtures/sample.html

# Analyze a live URL (fetched via the MCP fetch tool; http/https only)
npm start -- --url https://example.com/

# Write the JSON report to a file instead of stdout
npm start -- --file page.html --output report.json
```

It checks:

| WCAG Criterion | Check | Severity |
|---|---|---|
| 1.1.1 | Image missing `alt` attribute (`alt=""` is valid for decorative images) | `error` |
| 1.3.1 | Form control with no associated label (explicit, implicit, `aria-label`, or `aria-labelledby`) | `error` |
| 1.3.1 | First heading not `<h1>`, or a heading level skip (e.g. `h2` → `h4`) | `warning` |
| 2.4.4 | Link with no accessible text at all | `error` |
| 2.4.4 | Link text matching a non-descriptive phrase ("click here", "read more", etc.) | `warning` |
| 1.4.3 | Insufficient inline color contrast (< 4.5:1 normal text, < 3:1 large text) | `warning` |

**Exit codes:** `0` success · `1` CLI/argument error · `2` MCP fetch error · `3` HTML parse error · `4` file I/O error

**Real output**, run against `test/fixtures/sample.html`:
```
Total Violations: 7 (3 errors, 4 warnings)

Violations by WCAG Criterion:
  1.1.1: 1 violation
  1.3.1: 3 violations
  1.4.3: 1 violation
  2.4.4: 2 violations

❌ Accessibility check failed (3 errors)
```

## Installation

```bash
npm install
```

Requires **Node.js ≥ 24** and [`uv`/`uvx`](https://docs.astral.sh/uv/getting-started/installation/) installed (for the MCP fetch server used by `--url`).

```bash
npm run build   # tsc
npm run lint     # eslint .
npm test         # vitest run --passWithNoTests
```

## Architecture

```
CLI (src/cli.ts)
  └─ Orchestrator (src/index.ts)
       ├─ URL input  → MCP Client (src/mcp/client.ts) → uvx mcp-server-fetch@2026.8.18
       ├─ File input → fs.readFile (UTF-8)
       ├─ HTML Parser (src/parser/html-parser.ts) → cheerio, sourceCodeLocationInfo
       ├─ Validator Engine (src/validators/engine.ts) → 5 pluggable validators
       │    ├─ ImageAltValidator        (1.1.1)
       │    ├─ FormLabelValidator       (1.3.1)
       │    ├─ HeadingHierarchyValidator(1.3.1)
       │    ├─ LinkTextValidator        (2.4.4)
       │    └─ ColorContrastValidator   (1.4.3)
       └─ Report Generator (src/report/generator.ts) → JSON + human-readable summary
```

**Stack:** TypeScript 5.9.3 (strict mode), Node 24, cheerio, commander, `@modelcontextprotocol/sdk`, Vitest, fast-check, ESLint 10 + typescript-eslint 8.

---

## Kiro University Lesson Map

All nine lessons (seven required + two bonus) are demonstrated below with exact file paths and a summary of what was actually accomplished for each — not just "feature was touched," but what it did for this specific project.

### Lesson 1 — Spec-Driven Development

**What the lesson requires:** Use Feature Specs (requirements → design → tasks) to build a non-trivial feature.

**What was done:**
- Full spec at [`.kiro/specs/wcag-accessibility-checker/`](.kiro/specs/wcag-accessibility-checker/):
  - [`requirements.md`](.kiro/specs/wcag-accessibility-checker/requirements.md) — 12 requirements, EARS notation (`WHEN`/`THE SYSTEM SHALL`/`IF`/`THEN`), covering CLI input handling, MCP fetching with real server quirks (prefix stripping, pagination, `max_length` boundary), HTML parsing, all five validators, the pretty-printer round-trip property, JSON reporting, error handling with exit codes, and TypeScript type safety
  - [`design.md`](.kiro/specs/wcag-accessibility-checker/design.md) — component architecture, algorithms for every validator including the full WCAG relative-luminance/contrast-ratio formula, 15 correctness properties for PBT, and explicit call-outs of real-world risks (MCP server version pinning, `max_length` exclusivity, cheerio line-tracking verification)
  - [`tasks.md`](.kiro/specs/wcag-accessibility-checker/tasks.md) — 27 tasks across 4 phases with a dependency graph, each task traced back to specific requirement numbers
- The spec went through multiple correction passes as real-world facts were verified (actual `mcp-server-fetch` PyPI version, actual server response format, actual WCAG semantics for `alt=""`) — the spec is the living source of truth that the implementation was built against, not a document written after the fact.

### Lesson 2 — Steering Documents

**What the lesson requires:** Create steering files that enforce a convention, explain the intent, and show a good-vs-bad example.

**What was done:** Five steering files in [`.kiro/steering/`](.kiro/steering/), each covering one domain, each with front matter as the very first content, each following standard → context → good-vs-bad TypeScript example:

| File | Enforces |
|---|---|
| [`validator-pattern.md`](.kiro/steering/validator-pattern.md) | Every validator implements `Validator` purely and deterministically (readonly `name`/`wcagCriterion`, no shared mutable state) |
| [`wcag-compliance.md`](.kiro/steering/wcag-compliance.md) | Exact WCAG codes, only `error`/`warning` severities, canonical fix text, `alt=""` is never a violation |
| [`error-handling.md`](.kiro/steering/error-handling.md) | Only the five typed error classes, consistent exit code mapping (1/2/3/4), actionable error messages |
| [`jsdoc-standards.md`](.kiro/steering/jsdoc-standards.md) | Every exported function documents its WCAG criterion reference, not just in a type field |
| [`testing-standards.md`](.kiro/steering/testing-standards.md) | `fileMatch` on `**/*.test.ts`; fast-check conventions, `numRuns` minimums, the independent-oracle rule, safe generator alphabets, the `// Feature: ... Property N` tag |

**Proof steering actually shaped output (not just sitting unused):** the `accessibility-auditor` custom agent (Lesson 7) was asked to list which steering files it had loaded, then independently audited the same test fixture the CLI uses. It reported all five files loaded, and its findings matched the CLI's own report almost violation-for-violation — using the **exact canonical fix text strings** defined in `wcag-compliance.md`. See [`docs/evidence/test-result.md`](docs/evidence/test-result.md).

### Lesson 3 — Hooks

**What the lesson requires:** Configure a hook that fires on a trigger event and runs a command.

**What was done:** [`.kiro/hooks/accessibility-checker-hooks.json`](.kiro/hooks/accessibility-checker-hooks.json) defines two hooks:

```json
{
  "version": "v1",
  "hooks": [
    { "name": "TypeScript Linter", "trigger": "PostFileSave", "matcher": "\\.ts$", "action": { "type": "command", "command": "npx eslint ." } },
    { "name": "Post-Task Test Runner", "trigger": "PostTaskExec", "action": { "type": "command", "command": "npx vitest run --passWithNoTests" } }
  ]
}
```

The lint hook ran automatically on every `.ts` file save during development (lints the whole project, since hook stdin context doesn't scope to the saved file). The test hook ran automatically after every spec task was marked complete, using `--passWithNoTests` so early tasks (before any test files existed) didn't fail red. Both are correctly non-blocking, since `PostFileSave`/`PostTaskExec` cannot gate the triggering action.

### Lesson 4 — Property-Based Testing

**What the lesson requires:** Use PBT (IDE-only) to test general rules extracted from spec requirements, not just hand-picked examples.

**What was done:** **15 property-based tests** across the test suite, each tagged `// Feature: wcag-accessibility-checker, Property N`, each run with `numRuns` ≥ 100 (≥ 200 for cheap pure-function properties), each using an **independent oracle** that recomputes the expected result directly from the generated input rather than re-deriving the validator's own logic:

| # | Property | File |
|---|---|---|
| 1 | HTML round-trip preservation (parse → pretty-print → parse) | `test/html-parser.property.test.ts` |
| 2 | Validator determinism (same input → same output, twice) | `test/engine.property.test.ts` |
| 3 | Image alt detection completeness | `test/image-alt.property.test.ts` |
| 4, 5 | Heading hierarchy sequential property + violation detection | `test/heading-hierarchy.property.test.ts` |
| 6 | Form label completeness | `test/form-label.property.test.ts` |
| 7 | Link text detection | `test/link-text.property.test.ts` |
| 8, 9 | Contrast ratio correctness + threshold detection | `test/color-contrast.property.test.ts` |
| 10, 11 | Report structure invariants + summary correctness | `test/generator.property.test.ts` |
| 12 | CLI argument validation | `test/cli.property.test.ts` |
| 13 | Line number preservation | `test/html-parser.property.test.ts` |
| 14, 15 | Pretty-printer indentation + attribute ordering | `test/html-parser.property.test.ts` |

**This genuinely found bugs during development** (not staged — real counterexamples from `fast-check`):
- **Property 15** (attribute ordering): `fast-check` generated `["a", "A"]` as "unique" attribute names, but HTML attributes are case-insensitive, so cheerio collapsed them to one — the test's oracle hadn't accounted for that, and the counterexample exposed it immediately.
- **Property 4** (heading hierarchy, empty case): an empty heading array rendered to an empty HTML string, which `parseHTML` correctly rejects — the test needed a non-empty document shell.
- Both were fixed in the **test's oracle**, not the implementation — the implementations were correct; the tests needed correcting to match real-world HTML/parser semantics. This is exactly the kind of signal PBT is supposed to surface.

Custom arbitraries (since `fc.htmlDocument()` doesn't exist in fast-check) live in [`test/arbitraries.ts`](test/arbitraries.ts).

### Lesson 5 — Powers

**What the lesson requires:** Install a Kiro power and use its keyword-triggered tools/skills.

**What was done:** **Power Builder** (curated, from the Kiro powers registry) was installed via the Powers panel and triggered by keyword during development (e.g. "build a power", "create plugin"). It supplied the exact Agent Plugins specification — required/optional `plugin.json` fields, `SKILL.md` front-matter rules, directory layout — that was then followed to build the Bonus 2 `ada-wcag` power. **Power Builder is the only power claimed for Lesson 5**; the `ada-wcag` power is a separate submission for Bonus 2 (see below) and is intentionally not double-counted here.

### Lesson 6 — Model Context Protocol (MCP)

**What the lesson requires:** Configure and use an MCP server.

**What was done:**
- [`.kiro/settings/mcp.json`](.kiro/settings/mcp.json) registers the real `mcp-server-fetch@2026.8.18` (Python package, launched via `uvx`) as a project-level MCP server, usable from Kiro chat itself.
- [`src/mcp/client.ts`](src/mcp/client.ts) uses that same server **inside the application**, not just from chat: it launches `uvx mcp-server-fetch@2026.8.18` via `StdioClientTransport`, requests raw HTML (`raw: true`), pages through content with `start_index` while respecting the server's exclusive `max_length` boundary (`500000`, safely under the server's `1000000` exclusive maximum), strips the server's two prefix lines and `<error>` truncation/completion notices, and handles both the thrown-exception and `result.isError` failure paths.
- **Verified against the real server**, not mocked: `test/mcp-client.integration.test.ts` spins up a local HTTP server and fetches through the actual `uvx` process. `uvx mcp-server-fetch@2026.8.18 --help` was confirmed runnable, and the full fetch → clean → parse → validate pipeline was run end-to-end against both a local fixture server and the live `kiro.dev` homepage.
- **A real server quirk was hit and handled live:** when the `accessibility-auditor` agent called the fetch tool directly with its own default parameters, it got `Input validation error: 1000000 is greater than or equal to the maximum of 1000000` — exactly the exclusive-boundary bug the design doc anticipated and the application code already avoids by using `500000`. The agent recovered and completed the audit anyway. See [`docs/evidence/local-power-results.md`](docs/evidence/local-power-results.md).

### Lesson 7 — Custom Agents

**What the lesson requires:** Create a custom agent with specific tools, permissions, resources, and a model.

**What was done:** [`.kiro/agents/accessibility-auditor.json`](.kiro/agents/accessibility-auditor.json):

```json
{
  "name": "accessibility-auditor",
  "tools": ["read", "write", "shell"],
  "includeMcpJson": true,
  "includePowers": true,
  "resources": ["file://.kiro/steering/**/*.md", "file://./docs/WCAG-2.1-reference.md"],
  "permissions": { "rules": [{ "capability": "shell", "match": ["npm *", "npx *"], "effect": "allow" }] },
  "model": "claude-sonnet-5"
}
```

Custom agents do **not** load steering automatically — the `file://.kiro/steering/**/*.md` resource glob was added specifically so this agent would, and that was then verified by asking it directly which steering files it had loaded (it listed all five). `includeMcpJson: true` and `includePowers: true` give it access to the same MCP fetch server and installed powers as the rest of the project. [`docs/WCAG-2.1-reference.md`](docs/WCAG-2.1-reference.md) was created before the agent, since the agent's resource list depends on it existing.

**Proof of real use, not just configuration:** the agent audited `test/fixtures/sample.html` and found the same violations as the CLI's own output; it later audited the live `https://kiro.dev/` homepage via the MCP fetch tool and produced a full criterion-by-criterion report, including correctly flagging that contrast could not be evaluated because the page uses external stylesheets rather than inline styles — exactly matching the tool's own documented limitation. See [`docs/evidence/test-result.md`](docs/evidence/test-result.md) and [`docs/evidence/local-power-results.md`](docs/evidence/local-power-results.md).

---

### Bonus Lesson 1 — Cloud Sessions & Cloud Configuration

**What the lesson requires:** Push to GitHub, upload personal `.kiro` configuration via Kiro Web Settings > Sync, run a bounded task in a cloud session.

**What was done:**
1. Repository pushed to GitHub (public, this repo)
2. `steering/`, `agents/`, and `hooks/` uploaded via **Kiro Web → Settings > Sync**
3. A cloud session was started from the IDE (Agent Focus Mode) bound to this repo, with a scoped, no-network task: run `npm ci` then `npm test`
4. **Result** (full transcript in [`docs/evidence/web-cloud.md`](docs/evidence/web-cloud.md)):
   - `npm ci`: succeeded — 318 packages installed, 0 vulnerabilities
   - `npm test`: succeeded — **19 test files passed, 88 tests passed**
   - The sandbox correctly reported an engine warning (project requires Node ≥24; sandbox had Node 22.23.3) — an authentic environment detail, not edited out
   - No commits or pull requests were created, as instructed

### Bonus Lesson 2 — Package a Kiro Power

**What the lesson requires:** Build and publish a Kiro power using the Agent Plugins format, included in the final submission.

**What was done:** A skills-only power named `ada-wcag` lives at [`power/`](power/) in this same repository (no `mcp.json` — this power is pure guidance, no tool integration):

```
power/
├── plugin.json              # $schema, name, version, description, author, keywords, license, homepage, repository
├── README.md                # installation, usage, privacy, support
├── LICENSE                  # MIT
├── PRIVACY.md                # explicit no-data-collection statement
└── skills/
    └── wcag-validator/
        ├── SKILL.md          # all five WCAG rules, severities, canonical fix text, JSON schema, CLI usage
        └── references/
            └── report-schema.json
```

It was **scaffolded and checked using Power Builder** (Lesson 5), per the exact Agent Plugins workflow it supplied — not written against assumptions. `plugin.json`'s keywords (`wcag`, `a11y`, `accessibility`, `ada`) are deliberately specific to avoid false activation in unrelated chats. The `SKILL.md` content is directly derived from this project's own requirements (criteria/severities/fix text from Requirements 4–8, the JSON report shape from Requirement 10, exit codes from Requirement 11, and real CLI usage).

Installable via **Add Custom Power → Import power from GitHub** using `https://github.com/phenomleads/ada-wcag/tree/main/power`, and verified to activate on its trigger keywords. A full video walkthrough of this and the rest of the project is linked below.

---

## Evidence Index

All captured evidence lives in [`docs/evidence/`](docs/evidence/):

| File | What it proves |
|---|---|
| [`test-result.md`](docs/evidence/test-result.md) | Custom agent loaded all 5 steering files; audit matches CLI output |
| [`web-cloud.md`](docs/evidence/web-cloud.md) | Cloud session: `npm ci` + `npm test` passed (88/88 tests) in the sandbox |
| [`local-power-results.md`](docs/evidence/local-power-results.md) | Agent audit of live `kiro.dev`, including the real MCP `max_length` boundary error and recovery |

## Demo Video

A full walkthrough demo video covering the working product and all nine lessons is included with this submission.

## WCAG Reference

See [`docs/WCAG-2.1-reference.md`](docs/WCAG-2.1-reference.md) for the full per-criterion explanation of what each validator checks and why.

## Project Structure

```
.kiro/
├── specs/wcag-accessibility-checker/   # Lesson 1
├── steering/                           # Lesson 2
├── hooks/                              # Lesson 3
├── agents/                             # Lesson 7
└── settings/mcp.json                   # Lesson 6
docs/
├── WCAG-2.1-reference.md
└── evidence/                           # Bonus 1 & 2 evidence
power/                                  # Bonus 2
src/
├── cli.ts / index.ts
├── mcp/client.ts                       # Lesson 6
├── parser/html-parser.ts
├── validators/*.ts                     # 5 WCAG validators
└── report/generator.ts
test/                                   # unit + property tests (Lesson 4)
```

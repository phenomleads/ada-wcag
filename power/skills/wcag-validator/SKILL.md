---
name: "wcag-validator"
description: "Validates HTML content against WCAG 2.1 Level AA success criteria (image alt text, form labels, heading hierarchy, link text, color contrast) and explains violations with exact remediation text. Use when auditing a webpage or HTML snippet for accessibility issues, reviewing a pull request that touches markup, or explaining why an accessibility scanner flagged something."
license: "MIT"
metadata:
  author: "<YOUR REAL NAME>"
  version: "1.0.0"
---

# WCAG Validator

## Overview

This skill encodes the five WCAG 2.1 Level AA checks implemented by the ada-wcag accessibility checker CLI: image alternative text (1.1.1), form label association (1.3.1), heading hierarchy (1.3.1), link text descriptiveness (2.4.4), and color contrast (1.4.3). Use it to manually audit HTML, explain why a check fired, or write code that performs the same validation. Every rule below states its exact severity and canonical fix text so audits are consistent with the CLI tool's own output.

## Prerequisites Checklist

- [ ] You have the HTML content to audit (a file, URL response body, or snippet)
- [ ] You know whether you need machine-readable output (JSON, see `references/report-schema.json`) or a human-readable audit

## The Five Checks

### 1. Image Alternative Text — WCAG 1.1.1 (error)

**Rule:** Every `<img>` element must have an `alt` attribute. The attribute may be empty (`alt=""`) — that is a valid, intentional marker for a decorative image and is **never** a violation, regardless of any `role` attribute.

**Violation condition:** The `alt` attribute is completely absent (not just empty).

**Severity:** `error`

**Canonical fix text:** `Add alt attribute (use alt="" for decorative images)`

**Examples:**
```html
<!-- VIOLATION: alt attribute missing entirely -->
<img src="banner.jpg">

<!-- VALID: empty alt is a deliberate decorative marker -->
<img src="spacer.gif" alt="">

<!-- VALID: descriptive alt text -->
<img src="logo.png" alt="Company logo">
```

### 2. Form Label Association — WCAG 1.3.1 (error)

**Rule:** Every `<input>` (except `type="hidden"`, `"submit"`, `"button"`, `"reset"`, or `"image"` — these get their accessible name from `value`/`alt` instead), `<textarea>`, and `<select>` must have one of:
- An explicit `<label for="id">` referencing the control's `id`
- The control nested inside a `<label>` element (implicit association)
- A non-empty `aria-label` attribute
- A valid `aria-labelledby` attribute referencing an existing element's `id`

**Violation condition:** None of the four labeling methods are present.

**Severity:** `error`

**Canonical fix text:** `Add associated label element or aria-label attribute`

**Examples:**
```html
<!-- VIOLATION: no label of any kind -->
<input type="text" name="email">

<!-- VALID: explicit label -->
<label for="name">Name</label>
<input type="text" id="name">

<!-- VALID: excluded type, no label needed -->
<input type="submit" value="Send">
```

### 3. Heading Hierarchy — WCAG 1.3.1 (warning)

**Rule:** The first heading in a document should be `<h1>`. Heading levels should not skip (e.g. `<h2>` followed directly by `<h4>`). Multiple headings at the same level consecutively are allowed, and levels may decrease freely (going from `<h3>` back to `<h2>` is not a skip).

Both conditions below are **warnings**, not errors — this is a tool-chosen severity. WCAG 1.3.1 does not itself mandate strict `h1`-first sequencing as a hard failure; it only requires that structural relationships be programmatically determinable.

**Violation conditions (either):**
- The first heading in document order is not `<h1>`
- A heading's level is more than one greater than the immediately preceding heading's level

**Severity:** `warning`

**Canonical fix text:** `Adjust heading level to maintain sequential hierarchy`

**Examples:**
```html
<!-- VIOLATION: first heading is h2, not h1 -->
<h2>Welcome</h2>

<!-- VIOLATION: skips from h2 to h4 -->
<h1>Title</h1>
<h2>Section</h2>
<h4>Subsection</h4>

<!-- VALID: sequential, repeats allowed -->
<h1>Title</h1>
<h2>Section A</h2>
<h2>Section B</h2>
<h3>Detail</h3>
```

### 4. Link Text Descriptiveness — WCAG 2.4.4

**Rule:** A link's accessible text is the combination of: its visible text content, plus the `alt` text of any `<img>` nested inside it, plus `aria-label` or a valid `aria-labelledby` reference. A link with no accessible text at all is an **error**. A link whose combined text exactly matches a known non-descriptive phrase is a **warning**.

**Non-descriptive phrases (case-insensitive exact match):** `click here`, `read more`, `here`, `link`, `more`, `click`, `read this`

**Violation conditions:**
- No visible text, no `img[alt]` inside, no `aria-label`, no valid `aria-labelledby` → **error**, issue `"Link has no accessible text"`
- Combined accessible text matches a banned phrase exactly → **warning**, issue `"Link text is not descriptive: '<text>'"`

**Canonical fix text (both cases):** `Use descriptive link text indicating destination`

**Examples:**
```html
<!-- VIOLATION (error): no accessible text -->
<a href="/mystery"></a>

<!-- VIOLATION (warning): banned phrase -->
<a href="/details">Click here</a>

<!-- VALID: image alt text counts as link text -->
<a href="/"><img src="logo.png" alt="Home"></a>

<!-- VALID: descriptive text -->
<a href="/pricing">View our pricing plans</a>
```

### 5. Color Contrast — WCAG 1.4.3 (warning)

**Rule:** Only elements with **both** an inline `color` and inline `background-color` style are checked (contrast cannot be determined from CSS classes or external stylesheets by this tool, so such elements are skipped entirely — this is not a pass, it's "unknown"). The contrast ratio is calculated using the WCAG relative-luminance formula:

```
For each channel C in {R, G, B}, normalized to [0,1]:
  Clinear = C/12.92                        if C <= 0.03928
  Clinear = ((C + 0.055) / 1.055) ^ 2.4    otherwise

L = 0.2126*Rlinear + 0.7152*Glinear + 0.0722*Blinear

ratio = (Lmax + 0.05) / (Lmin + 0.05)   where Lmax/Lmin are the lighter/darker luminances
```

Large text is defined as font-size ≥ 18pt, OR font-size ≥ 14pt with `font-weight: bold` or `font-weight >= 700`.

**Violation conditions:**
- Normal text with ratio < 4.5:1
- Large text with ratio < 3:1

**Severity:** `warning`

**Canonical fix text:** `Increase contrast between text and background colors`

**Examples:**
```html
<!-- VIOLATION: ~1.6:1, far below 4.5:1 -->
<p style="color: #cccccc; background-color: #ffffff;">Low contrast text</p>

<!-- VALID: 21:1, maximum possible contrast -->
<p style="color: #000000; background-color: #ffffff;">High contrast text</p>

<!-- SKIPPED (not checked): no background-color specified -->
<p style="color: #cccccc;">Cannot evaluate</p>
```

## JSON Report Structure

When producing machine-readable output, each violation uses this shape (see `references/report-schema.json` for the full schema):

```json
{
  "wcag": "1.1.1",
  "severity": "error",
  "element": "<img>",
  "issue": "Image missing alt attribute",
  "line": 13,
  "fix": "Add alt attribute (use alt=\"\" for decorative images)"
}
```

The overall report wraps violations with metadata:

```json
{
  "metadata": {
    "source": "https://example.com/",
    "timestamp": "2026-01-01T00:00:00.000Z",
    "totalViolations": 7,
    "errorCount": 3,
    "warningCount": 4
  },
  "violations": [ /* Violation[] */ ],
  "violationsByWCAG": {
    "1.1.1": [ /* ... */ ],
    "1.3.1": [ /* ... */ ]
  }
}
```

## CLI Usage

The reference implementation is a Node.js/TypeScript CLI tool (`ada-wcag`):

```bash
# Analyze a local HTML file
ada-wcag --file path/to/page.html

# Analyze a live URL (fetched via the MCP fetch tool; http/https only)
ada-wcag --url https://example.com/

# Write the JSON report to a file instead of stdout
ada-wcag --file page.html --output report.json
```

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | Success (ran to completion; may still report violations in the JSON) |
| 1 | CLI/argument error (e.g. both `--url` and `--file` given, disallowed URL scheme, missing arguments) |
| 2 | MCP fetch error (server launch failure, connection failure, timeout, robots.txt disallow) |
| 3 | HTML parsing error (content was empty or completely unparseable) |
| 4 | File I/O error (input file not found, or output path not writable) |

## Best Practices

- Always state the exact WCAG criterion (e.g. "1.1.1", not "1.1") and the exact canonical fix text listed above — consistency with these strings is what lets a report's violations be grouped and counted correctly.
- Treat `alt=""` as fully valid; do not flag it as a warning or suggest adding text to it.
- Remember heading hierarchy issues are warnings, not errors — don't tell a user their build "failed" because of heading structure alone.
- When auditing links, always check for a nested `<img alt="...">` before concluding there's no accessible text.
- Color contrast checks only apply to elements with both inline `color` and `background-color`; don't claim an element "passed" contrast if it was actually skipped for lacking one of those styles — call that out as "could not be determined from inline styles."

---
inclusion: fileMatch
fileMatchPattern: "src/validators/**/*.ts"
---

# WCAG Violation Detection Patterns

**Standard**: Every violation a validator records must reference the exact WCAG success criterion it is testing, use only the two allowed severities (`"error"` for must-fix, `"warning"` for should-fix), and use the canonical fix text defined in requirements.md for that criterion. Do not invent new severities, new WCAG codes, or paraphrase fix text differently across validators.

**Context**: The report generator groups violations by `wcag` code and counts by `severity` to build `errorCount`/`warningCount` and the `violationsByWCAG` map (Requirement 10). If a validator uses an inconsistent WCAG code (e.g. `"1.1"` instead of `"1.1.1"`) or an unapproved severity, the report's grouping and counts silently become wrong, and property tests 3, 6, 7, 10 (which rely on exact oracle counts) will fail or pass for the wrong reason. This project also treats specific edge cases as settled: `alt=""` is a valid decorative-image marker (never a violation), and heading-hierarchy issues are warnings, not errors, because WCAG 1.3.1 does not mandate strict `h1`-first sequencing as an error-level failure.

**Example**:

```typescript
// GOOD: exact WCAG code, approved severity, canonical fix text from requirements.md
violations.push({
  wcag: '1.1.1',
  severity: 'error',
  element: '<img>',
  issue: 'Image missing alt attribute',
  line,
  fix: 'Add alt attribute (use alt="" for decorative images)',
});

// GOOD: alt="" is valid — no violation is recorded at all
if (alt === undefined) {
  // only the missing case is a violation
}
```

```typescript
// BAD: invented severity "critical" breaks errorCount/warningCount math
violations.push({
  wcag: '1.1.1',
  severity: 'critical', // not 'error' | 'warning'
  element: '<img>',
  issue: 'alt text missing',
  fix: 'fix the alt text', // not the canonical fix string
} as Violation);

// BAD: flags alt="" as a violation, contradicting the decorative-image rule
if (alt === undefined || alt === '') {
  violations.push({ wcag: '1.1.1', severity: 'warning', /* ... */ } as Violation);
}
```

---
inclusion: fileMatch
fileMatchPattern: "src/validators/**/*.ts"
---

# Validator Implementation Pattern

**Standard**: Every WCAG validator must implement the `Validator` interface from `src/types/index.ts`: a readonly `name`, a readonly `wcagCriterion` string, and a `validate(doc: ParsedDocument): Violation[]` method that is pure and deterministic (same input always produces the same output array, in the same order).

**Context**: The validator engine (`src/validators/engine.ts`) runs all five validators in sequence and aggregates their results. If a validator mutates shared state, throws for expected inputs, or returns violations in a non-deterministic order, the engine's aggregation breaks and Property 2 (Validator Determinism) will fail. Each validator also owns exactly one WCAG success criterion so that `wcagCriterion` and the `wcag` field on every `Violation` it produces always agree.

**Example**:

```typescript
// GOOD: pure, deterministic, matches the Validator interface
export class ImageAltValidator implements Validator {
  readonly name = 'ImageAltValidator';
  readonly wcagCriterion = '1.1.1';

  validate(doc: ParsedDocument): Violation[] {
    const { $ } = doc;
    const violations: Violation[] = [];

    $('img').each((_, elem) => {
      if ($(elem).attr('alt') === undefined) {
        violations.push({
          wcag: this.wcagCriterion,
          severity: 'error',
          element: '<img>',
          issue: 'Image missing alt attribute',
          line: elem.sourceCodeLocation?.startLine,
          fix: 'Add alt attribute (use alt="" for decorative images)',
        });
      }
    });

    return violations;
  }
}
```

```typescript
// BAD: mutates module-level state and can throw on valid input,
// so two runs on the same document can disagree (breaks Property 2)
let violationCount = 0;

export class BadImageValidator {
  wcagCriterion = '1.1.1';

  validate(doc: ParsedDocument) {
    const { $ } = doc;
    const violations: Violation[] = [];

    $('img').each((_, elem) => {
      const alt = $(elem).attr('alt')!; // throws if alt is undefined
      violationCount++; // shared mutable state leaks across calls
      if (alt.length === 0) violations.push({ /* ... */ } as Violation);
    });

    return violations;
  }
}
```

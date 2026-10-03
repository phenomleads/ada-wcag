---
inclusion: fileMatch
fileMatchPattern: "**/*.test.ts"
---

# Property-Based Testing Standards

**Standard**: Every property-based test (fast-check) must: (1) start with a `// Feature: wcag-accessibility-checker, Property N` comment tag matching the property number in design.md, (2) set `numRuns` explicitly — at least 200 for cheap pure-function properties (CLI validation, heading sequences, contrast math, report invariants, summary text) and at least 100 for all others, (3) use an **independent oracle** that recomputes the expected answer from the generated input directly, never by calling the validator-under-test or duplicating its exact logic, and (4) constrain generated strings (ids, `type` attributes, tag names) to safe alphanumeric alphabets so the HTML/arbitrary builder never produces invalid markup.

**Context**: Kiro extracts these properties from EARS requirements during the design phase and runs them from the IDE task list — this is the Lesson 4 evidence. If a test's oracle re-implements (or calls) the same logic as the validator, the test is tautological and will pass even when the validator is wrong (this is why Properties 3, 6, and 7 are explicitly required to use independent oracles). If `numRuns` is left at fast-check's default, the IDE output won't visibly show "hundreds" of cases as the lesson describes.

**Example**:

```typescript
// GOOD: tagged, explicit numRuns, independent oracle, safe alphabet
// Feature: wcag-accessibility-checker, Property 3
test('ImageAltValidator flags exactly the images missing alt', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        hasAlt: fc.boolean(),
        id: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,9}$/), // safe alphabet
      })),
      (images) => {
        const html = buildHtmlWithImages(images);
        const doc = parseHTML(html);

        // Independent oracle: count directly from the input, not the validator
        const expectedViolations = images.filter((img) => !img.hasAlt).length;

        const violations = new ImageAltValidator().validate(doc);
        expect(violations.length).toBe(expectedViolations);
      }
    ),
    { numRuns: 100 }
  );
});
```

```typescript
// BAD: no Property tag, default numRuns, and a tautological oracle
test('image alt validator works', () => {
  fc.assert(
    fc.property(fc.array(fc.boolean()), (hasAltFlags) => {
      const html = buildHtmlWithImages(hasAltFlags.map((hasAlt) => ({ hasAlt })));
      const doc = parseHTML(html);
      const validator = new ImageAltValidator();

      // Oracle re-runs the same validator logic manually — tautological
      const expected = hasAltFlags.filter((hasAlt) => !hasAlt).length;
      expect(validator.validate(doc).length).toBe(expected);
      // also: no { numRuns } means the IDE won't show "hundreds" of cases
    })
  );
});
```

---
inclusion: fileMatch
fileMatchPattern: "src/**/*.ts"
---

# JSDoc Documentation Standard

**Standard**: Every exported function, class, and interface in `src/` must have a JSDoc comment that states what it does, documents `@param`/`@returns`/`@throws` as applicable, and — for anything implementing WCAG validation logic — includes an explicit WCAG criterion reference (e.g. "WCAG 1.1.1") in the description, not just in a type field.

**Context**: Requirement 12.5 requires JSDoc comments documenting WCAG criterion references on all exported functions. Reviewers and graders will read source files directly (not just run the tool), so the WCAG mapping needs to be visible in the code itself, not only in requirements.md. This also keeps the five validators self-documenting as the project grows past the five current checks.

**Example**:

```typescript
// GOOD: states purpose, documents params/returns, names the WCAG criterion
/**
 * Validates that every <img> element has an alt attribute, per WCAG 1.1.1
 * (Non-text Content). An empty alt="" is treated as valid (decorative image).
 *
 * @param doc - The parsed HTML document to check.
 * @returns An array of violations for images missing the alt attribute.
 */
export function validateImageAlt(doc: ParsedDocument): Violation[] {
  // ...
}
```

```typescript
// BAD: no WCAG reference, no param/return docs — fails Requirement 12.5
// checks images
export function validateImageAlt(doc: ParsedDocument): Violation[] {
  // ...
}
```

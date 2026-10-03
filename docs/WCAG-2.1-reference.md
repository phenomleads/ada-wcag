# WCAG 2.1 Level AA Reference

Quick reference for the four WCAG 2.1 success criteria checked by this tool. Full normative text: [W3C WCAG 2.1](https://www.w3.org/TR/WCAG21/).

## 1.1.1 Non-text Content (Level A)

All non-text content (images) that is presented to the user has a text alternative, unless the purpose is purely decorative.

- **Checked by**: `ImageAltValidator`
- **Rule in this tool**: An `<img>` missing the `alt` attribute entirely is an **error**. `alt=""` (empty string) is a **valid, intentional marker for a decorative image** and is never a violation, with or without `role="presentation"`.
- **Fix**: `Add alt attribute (use alt="" for decorative images)`

## 1.3.1 Info and Relationships (Level A)

Information, structure, and relationships conveyed through presentation can be programmatically determined. This tool checks two aspects of this criterion:

### Form labels

- **Checked by**: `FormLabelValidator`
- **Rule**: Every `<input>` (except `type="hidden"`, `"submit"`, `"button"`, `"reset"`, `"image"`), `<textarea>`, and `<select>` must have one of: an explicit `<label for="id">`, be nested inside a `<label>`, an `aria-label`, or a valid `aria-labelledby` reference. Missing all four is an **error**.
- **Fix**: `Add associated label element or aria-label attribute`

### Heading hierarchy

- **Checked by**: `HeadingHierarchyValidator`
- **Rule**: The first heading should be `<h1>`, and heading levels should not skip (e.g. `<h2>` directly to `<h4>`). Both are flagged as **warnings** in this tool (not errors) — strict sequencing is a best practice, not a hard failure mode of 1.3.1.
- **Fix**: `Adjust heading level to maintain sequential hierarchy`

## 1.4.3 Contrast (Minimum) (Level AA)

Text has a contrast ratio of at least 4.5:1 against its background (3:1 for large text: 18pt+, or 14pt+ bold).

- **Checked by**: `ColorContrastValidator`
- **Rule**: Only elements with both inline `color` and `background-color` styles are checked (styles not resolvable from CSS classes/stylesheets are skipped). Below-threshold contrast is a **warning**.
- **Fix**: `Increase contrast between text and background colors`

## 2.4.4 Link Purpose (In Context) (Level A)

The purpose of each link can be determined from the link text alone, or from the link text together with its programmatically determined context.

- **Checked by**: `LinkTextValidator`
- **Rule**: A link's accessible text is its visible text, plus any nested `<img alt="...">` text, plus `aria-label`/`aria-labelledby`. No accessible text at all is an **error**. Non-descriptive text ("click here", "read more", "here", "link", "more", "click", "read this") is a **warning**.
- **Fix**: `Use descriptive link text indicating destination`

## Severity Summary

| Criterion | Check | Severity |
|---|---|---|
| 1.1.1 | Missing alt attribute | error |
| 1.3.1 | Unlabeled form control | error |
| 1.3.1 | First heading not h1 / heading level skip | warning |
| 1.4.3 | Insufficient contrast | warning |
| 2.4.4 | No accessible link text | error |
| 2.4.4 | Non-descriptive link text | warning |

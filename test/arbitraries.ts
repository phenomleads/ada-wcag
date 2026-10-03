import fc from 'fast-check';

/** Safe alphanumeric alphabet for generated ids, classes, and tag-safe text. */
const SAFE_TOKEN = /^[a-zA-Z][a-zA-Z0-9]{0,9}$/;

export const safeToken = (): fc.Arbitrary<string> => fc.stringMatching(SAFE_TOKEN);

/** Tag names restricted to a small set of real, simple (non-void) HTML elements. */
const SIMPLE_TAGS = ['div', 'span', 'p', 'section', 'article'] as const;

export interface SimpleElementSpec {
  tag: (typeof SIMPLE_TAGS)[number];
  attributes: Record<string, string>;
  text: string;
  children: SimpleElementSpec[];
}

/**
 * A bounded-depth arbitrary HTML element tree, built from a small set of
 * simple tags, safe-alphabet attribute names/values, and plain text leaves.
 * Used because fast-check has no built-in HTML arbitrary (fc.htmlDocument()
 * does not exist).
 */
export function htmlElementArbitrary(maxDepth = 2): fc.Arbitrary<SimpleElementSpec> {
  const leaf: fc.Arbitrary<SimpleElementSpec> = fc.record({
    tag: fc.constantFrom(...SIMPLE_TAGS),
    attributes: fc.dictionary(safeToken(), safeToken(), { maxKeys: 3 }),
    text: safeToken(),
    children: fc.constant([]),
  });

  if (maxDepth <= 0) {
    return leaf;
  }

  return fc.oneof(
    { depthSize: 'small' },
    leaf,
    fc.record({
      tag: fc.constantFrom(...SIMPLE_TAGS),
      attributes: fc.dictionary(safeToken(), safeToken(), { maxKeys: 3 }),
      text: fc.constant(''),
      children: fc.array(htmlElementArbitrary(maxDepth - 1), { minLength: 1, maxLength: 3 }),
    })
  );
}

/** Renders a SimpleElementSpec tree into an HTML string. */
export function renderElement(spec: SimpleElementSpec): string {
  const attrs = Object.entries(spec.attributes)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
  const inner =
    spec.children.length > 0 ? spec.children.map(renderElement).join('') : spec.text;
  return `<${spec.tag}${attrs}>${inner}</${spec.tag}>`;
}

/** A full HTML document arbitrary wrapping a random element tree in <html><body>. */
export function htmlDocumentArbitrary(maxDepth = 2): fc.Arbitrary<string> {
  return htmlElementArbitrary(maxDepth).map(
    (spec) => `<html><body>${renderElement(spec)}</body></html>`
  );
}

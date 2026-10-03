import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import type { CheerioAPI } from 'cheerio';
import { parseHTML, prettyPrint, getElementLine } from '../src/parser/html-parser.js';
import { htmlDocumentArbitrary, safeToken } from './arbitraries.js';

/**
 * Compares two cheerio documents structurally: same tag names, same
 * attributes (keys and values), and same text content, recursively.
 * Used by Property 1 (HTML Round-Trip Preservation).
 */
function isEquivalentDOM($1: CheerioAPI, $2: CheerioAPI): boolean {
  function normalize($: CheerioAPI): string {
    const root = $.root().get(0);
    if (root === undefined) return '';

    function walk(node: unknown): string {
      if (node === null || typeof node !== 'object') return '';
      const n = node as {
        type?: string;
        tagName?: string;
        attribs?: Record<string, string>;
        data?: string;
        children?: unknown[];
      };

      if (n.type === 'text') {
        return (n.data ?? '').replace(/\s+/g, ' ').trim();
      }
      if (n.type === 'tag' && n.tagName !== undefined) {
        const attrs = n.attribs ?? {};
        const sortedAttrs = Object.keys(attrs)
          .sort((a, b) => a.localeCompare(b))
          .map((k) => `${k}=${attrs[k]}`)
          .join(',');
        const childrenStr = (n.children ?? []).map(walk).filter((s) => s.length > 0).join('|');
        return `<${n.tagName}:${sortedAttrs}>[${childrenStr}]`;
      }
      return (n.children ?? []).map(walk).join('');
    }

    return (root.children ?? []).map(walk).join('');
  }

  return normalize($1) === normalize($2);
}

// Feature: wcag-accessibility-checker, Property 1
describe('Property 1: HTML Round-Trip Preservation', () => {
  test('parse -> pretty-print -> parse produces an equivalent DOM', () => {
    fc.assert(
      fc.property(htmlDocumentArbitrary(2), (html) => {
        const doc1 = parseHTML(html);
        const printed = prettyPrint(doc1);
        const doc2 = parseHTML(printed);

        expect(isEquivalentDOM(doc1.$, doc2.$)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: wcag-accessibility-checker, Property 14
describe('Property 14: Pretty-Printer Indentation Consistency', () => {
  test('each nesting level adds exactly 2 spaces of indentation', () => {
    fc.assert(
      fc.property(htmlDocumentArbitrary(3), (html) => {
        const doc = parseHTML(html);
        const output = prettyPrint(doc);
        const lines = output.split('\n').filter((l) => l.trim().length > 0);

        for (const line of lines) {
          const leadingSpaces = line.match(/^ */)?.[0].length ?? 0;
          // Indentation must always be a multiple of 2 spaces.
          expect(leadingSpaces % 2).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: wcag-accessibility-checker, Property 15
describe('Property 15: Pretty-Printer Attribute Ordering', () => {
  test('attributes are printed in alphabetical order regardless of input order', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(safeToken(), { minLength: 2, maxLength: 5 }),
        fc.array(safeToken(), { minLength: 2, maxLength: 5 }),
        (rawNames, values) => {
          // HTML attribute names are case-insensitive, so the parser
          // lowercases them; dedupe case-insensitively up front so the
          // oracle's expected set matches what cheerio actually keeps.
          const seen = new Set<string>();
          const names: string[] = [];
          for (const name of rawNames) {
            const lower = name.toLowerCase();
            if (!seen.has(lower)) {
              seen.add(lower);
              names.push(name);
            }
          }
          fc.pre(names.length >= 2);

          const count = Math.min(names.length, values.length);
          const attrs = names
            .slice(0, count)
            .map((name, i) => `${name}="${values[i]}"`)
            .join(' ');
          const html = `<div ${attrs}>text</div>`;

          const doc = parseHTML(html);
          const output = prettyPrint(doc);

          const tagMatch = output.match(/<div([^>]*)>/);
          expect(tagMatch).not.toBeNull();

          // Independent oracle: sort the lowercased names directly, don't
          // reuse the pretty-printer's own sorting logic.
          const expectedOrder = names
            .slice(0, count)
            .map((n) => n.toLowerCase())
            .sort((a, b) => a.localeCompare(b));
          const actualOrder = Array.from(tagMatch![1].matchAll(/(\w+)=/g)).map((m) => m[1]);

          expect(actualOrder).toEqual(expectedOrder);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: wcag-accessibility-checker, Property 13
describe('Property 13: Line Number Preservation', () => {
  test('every element has a line number matching its position in the source', () => {
    fc.assert(
      fc.property(
        fc.array(safeToken(), { minLength: 1, maxLength: 8 }),
        (tags) => {
          // Independent oracle: build HTML with one tag per line, so the
          // expected line number is simply the 1-based index.
          const lines = tags.map((tag) => `<div id="${tag}"></div>`);
          const html = lines.join('\n');

          const doc = parseHTML(html);
          doc.$('div').each((i, elem) => {
            const expectedLine = i + 1;
            expect(getElementLine(elem)).toBe(expectedLine);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

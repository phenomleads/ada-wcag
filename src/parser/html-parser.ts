import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { ParseError, type ParseOptions, type ParsedDocument } from '../types/index.js';

/**
 * Parses an HTML string into a queryable DOM structure using cheerio, with
 * source-code line tracking enabled by default so validators can report
 * accurate line numbers for violations.
 * WCAG Criterion: enables element analysis for all validators (Requirements 3.1-3.6).
 *
 * @param html - The HTML content string to parse.
 * @param options - Parsing options (sourceCodeLocationInfo defaults to true).
 * @returns A ParsedDocument wrapping cheerio's jQuery-like API.
 * @throws ParseError if html is empty or cheerio fails to load it.
 */
export function parseHTML(html: string, options: ParseOptions = {}): ParsedDocument {
  if (html.trim().length === 0) {
    throw new ParseError(html, 'Empty HTML content');
  }

  const sourceCodeLocationInfo = options.sourceCodeLocationInfo ?? true;

  try {
    const $ = cheerio.load(html, {
      sourceCodeLocationInfo,
    });
    return { $ };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ParseError(html, reason);
  }
}

/**
 * Retrieves the 1-based source line number for a cheerio/domhandler
 * element, when sourceCodeLocationInfo was enabled during parsing.
 * WCAG Criterion: enables accurate violation line reporting (Requirement 3.6).
 *
 * @param element - A raw cheerio/domhandler Element node (e.g. from `.each((_, el) => ...)`).
 * @returns The element's starting line number, or undefined if unavailable.
 */
export function getElementLine(element: Element | AnyNode): number | undefined {
  const location = (element as Element).sourceCodeLocation;
  return location?.startLine;
}

const BLOCK_ELEMENTS = new Set([
  'html', 'head', 'body', 'div', 'p', 'ul', 'ol', 'li', 'table', 'thead',
  'tbody', 'tr', 'form', 'section', 'article', 'header', 'footer', 'nav',
  'main', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Serializes a single element's opening tag with attributes sorted
 * alphabetically by name, per Requirement 9.3.
 */
function formatOpenTag($: cheerio.CheerioAPI, elem: Element): string {
  const attribs = elem.attribs ?? {};
  const sortedNames = Object.keys(attribs).sort((a, b) => a.localeCompare(b));
  const attrString = sortedNames
    .map((name) => ` ${name}="${attribs[name]}"`)
    .join('');
  return `<${elem.tagName}${attrString}>`;
}

/**
 * Recursively pretty-prints a node and its children with 2-space
 * indentation per nesting level, per Requirements 9.2-9.4.
 */
function printNode($: cheerio.CheerioAPI, node: AnyNode, depth: number, lines: string[]): void {
  if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
    const elem = node as Element;
    const indent = '  '.repeat(depth);
    const isVoid = VOID_ELEMENTS.has(elem.tagName.toLowerCase());
    const isBlock = BLOCK_ELEMENTS.has(elem.tagName.toLowerCase());
    const openTag = formatOpenTag($, elem);

    if (isVoid) {
      lines.push(`${indent}${openTag}`);
      return;
    }

    const children = elem.children ?? [];
    const onlyText =
      children.length > 0 && children.every((c) => c.type === 'text');

    if (onlyText) {
      const text = children
        .map((c) => ('data' in c ? (c as { data: string }).data : ''))
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      lines.push(`${indent}${openTag}${text}</${elem.tagName}>`);
      return;
    }

    lines.push(`${indent}${openTag}`);
    for (const child of children) {
      if (child.type === 'text') {
        const text = (child as { data: string }).data.replace(/\s+/g, ' ').trim();
        if (text.length > 0) {
          lines.push(`${'  '.repeat(depth + 1)}${text}`);
        }
        continue;
      }
      printNode($, child, depth + 1, lines);
    }
    lines.push(`${indent}</${elem.tagName}>`);

    if (isBlock && depth === 0) {
      lines.push('');
    }
  }
}

/**
 * Pretty-prints a parsed document back into an HTML string with
 * consistent 2-space indentation, alphabetically sorted attributes, and
 * text content preserved (equivalent modulo whitespace). Used for
 * round-trip testing (Property 1) per Requirement 9.
 *
 * @param doc - The parsed document to format.
 * @returns A formatted HTML string.
 */
export function prettyPrint(doc: ParsedDocument): string {
  const { $ } = doc;
  const lines: string[] = [];
  const root = $.root().get(0);

  if (root === undefined) {
    return '';
  }

  for (const child of root.children) {
    printNode($, child, 0, lines);
  }

  return lines.join('\n').replace(/\n{2,}/g, '\n').trim();
}

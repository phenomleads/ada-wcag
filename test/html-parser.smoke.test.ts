import { describe, test, expect } from 'vitest';
import { parseHTML, getElementLine, prettyPrint } from '../src/parser/html-parser.js';
import { ParseError } from '../src/types/index.js';

describe('parseHTML + getElementLine (smoke test)', () => {
  test('tracks correct line numbers for elements on different lines', () => {
    const html = [
      '<html>',
      '<body>',
      '<h1>Title</h1>',
      '<img src="a.png">',
      '</body>',
      '</html>',
    ].join('\n');

    const doc = parseHTML(html);
    const img = doc.$('img').get(0);
    const h1 = doc.$('h1').get(0);

    expect(img).toBeDefined();
    expect(h1).toBeDefined();
    // 1-indexed lines: <html>=1, <body>=2, <h1>=3, <img>=4
    expect(getElementLine(h1!)).toBe(3);
    expect(getElementLine(img!)).toBe(4);
  });

  test('throws ParseError for empty content', () => {
    expect(() => parseHTML('')).toThrow(ParseError);
    expect(() => parseHTML('   ')).toThrow(ParseError);
  });

  test('handles malformed HTML without throwing', () => {
    const doc = parseHTML('<div><p>unclosed');
    expect(doc.$('p').text()).toBe('unclosed');
  });
});

describe('prettyPrint (smoke test)', () => {
  test('sorts attributes alphabetically and indents nested elements', () => {
    const html = '<div id="x" class="y"><p>hello</p></div>';
    const doc = parseHTML(html);
    const output = prettyPrint(doc);

    expect(output).toContain('<div class="y" id="x">');
    expect(output).toContain('  <p>hello</p>');
  });

  test('round-trips a simple document through parse -> print -> parse', () => {
    const html = '<div><span>a</span><span>b</span></div>';
    const doc1 = parseHTML(html);
    const printed = prettyPrint(doc1);
    const doc2 = parseHTML(printed);

    expect(doc2.$('span').length).toBe(2);
    expect(doc2.$('span').first().text()).toBe('a');
  });
});

import { describe, test, expect } from 'vitest';
import { cleanFetchedContent, isTruncated } from '../src/mcp/client.js';

describe('cleanFetchedContent', () => {
  test('strips the "cannot be simplified to markdown" prefix line', () => {
    const raw =
      'Content type text/html cannot be simplified to markdown, but here is the raw content:\n<html><body>hi</body></html>';
    expect(cleanFetchedContent(raw)).toBe('<html><body>hi</body></html>');
  });

  test('strips the "Contents of <url>:" prefix line', () => {
    const raw = 'Contents of https://example.com/:\n<html></html>';
    expect(cleanFetchedContent(raw)).toBe('<html></html>');
  });

  test('strips both prefix lines together', () => {
    const raw =
      'Content type text/html cannot be simplified to markdown, but here is the raw content:\nContents of https://example.com/:\n<html>body</html>';
    expect(cleanFetchedContent(raw)).toBe('<html>body</html>');
  });

  test('strips the truncation notice element', () => {
    const raw = '<html><body>partial<error>Content truncated. Call fetch tool with start_index</error>';
    expect(cleanFetchedContent(raw)).toBe('<html><body>partial');
  });

  test('strips the no-more-content notice element', () => {
    const raw = '<error>No more content available.</error>';
    expect(cleanFetchedContent(raw)).toBe('');
  });

  test('leaves plain HTML with no wrapper text unchanged', () => {
    const raw = '<html><body><h1>Hi</h1></body></html>';
    expect(cleanFetchedContent(raw)).toBe(raw);
  });
});

describe('isTruncated', () => {
  test('returns true when the truncation notice is present', () => {
    expect(isTruncated('<html>...<error>Content truncated. more</error>')).toBe(true);
  });

  test('returns false when no truncation notice is present', () => {
    expect(isTruncated('<html><body>complete</body></html>')).toBe(false);
  });

  test('returns false for the end-of-content notice (not a truncation notice)', () => {
    expect(isTruncated('<error>No more content available.</error>')).toBe(false);
  });
});

import { describe, test, expect, afterEach } from 'vitest';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { readFile, unlink } from 'node:fs/promises';
import { run } from '../src/index.js';

/**
 * End-to-end tests exercising the full pipeline (fetch/read -> parse ->
 * validate -> report) against the fixture at test/fixtures/sample.html,
 * which contains at least one violation of each of the five WCAG checks
 * (Requirements 1.1, 1.3, 2.9, 10.4, 10.5).
 */
describe('End-to-end: file input', () => {
  test('analyzing the fixture file reports violations for all five checks', async () => {
    const report = await run({ file: 'test/fixtures/sample.html' });

    const criteria = Object.keys(report.violationsByWCAG);
    expect(criteria).toContain('1.1.1'); // missing alt
    expect(criteria).toContain('1.3.1'); // heading skip + unlabeled input
    expect(criteria).toContain('1.4.3'); // low contrast
    expect(criteria).toContain('2.4.4'); // non-descriptive + no-text links

    expect(report.metadata.totalViolations).toBeGreaterThan(0);
    expect(report.metadata.source).toBe('test/fixtures/sample.html');
  });

  const outputPath = './test/.tmp-e2e-report.json';

  afterEach(async () => {
    try {
      await unlink(outputPath);
    } catch {
      // ignore if not created
    }
  });

  test('writing the report to --output produces valid JSON matching the returned report', async () => {
    const report = await run({ file: 'test/fixtures/sample.html', output: outputPath });
    const written = JSON.parse(await readFile(outputPath, 'utf-8'));
    expect(written).toEqual(report);
  });
});

describe('End-to-end: URL input via local HTTP server', () => {
  function startFixtureServer(port: number): Promise<Server> {
    return new Promise((resolve) => {
      const server = createServer((_req, res) => {
        readFile('test/fixtures/sample.html', 'utf-8')
          .then((html) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          })
          .catch(() => {
            res.writeHead(500);
            res.end();
          });
      });
      server.listen(port, () => resolve(server));
    });
  }

  test('analyzing the fixture via a local HTTP server reports the same violations as file input', async () => {
    const port = 8098;
    const server = await startFixtureServer(port);

    try {
      const report = await run({ url: `http://localhost:${port}/sample.html` });
      const criteria = Object.keys(report.violationsByWCAG);

      expect(criteria).toContain('1.1.1');
      expect(criteria).toContain('2.4.4');
      expect(report.metadata.totalViolations).toBeGreaterThan(0);
    } finally {
      server.close();
    }
  }, 20_000);
});

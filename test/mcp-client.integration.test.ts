import { describe, test, expect } from 'vitest';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { fetchHTML } from '../src/mcp/client.js';
import { MCPFetchError } from '../src/types/index.js';

/**
 * Integration tests for the MCP fetch client. These spin up a local HTTP
 * server and rely on uvx + mcp-server-fetch@2026.8.18 being installed
 * (warmed in Task 19). They exercise the real StdioClientTransport, so
 * they are slower and are marked optional per tasks.md (4.1*).
 */
describe('fetchHTML (integration, requires uvx + mcp-server-fetch)', () => {
  function startFixtureServer(html: string, port: number): Promise<Server> {
    return new Promise((resolve) => {
      const server = createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      server.listen(port, () => resolve(server));
    });
  }

  test('fetches and cleans a small HTML page from a local server', async () => {
    const port = 8099;
    const html = '<html><body><h1>Integration Test</h1></body></html>';
    const server = await startFixtureServer(html, port);

    try {
      const result = await fetchHTML(`http://localhost:${port}/`);
      expect(result.content).toContain('Integration Test');
      expect(result.contentSizeBytes).toBeGreaterThan(0);
      expect(result.fetchDurationMs).toBeGreaterThanOrEqual(0);
    } finally {
      server.close();
    }
  }, 20_000);

  test('throws MCPFetchError for an unreachable host', async () => {
    await expect(fetchHTML('http://localhost:1/')).rejects.toBeInstanceOf(MCPFetchError);
  }, 20_000);
});

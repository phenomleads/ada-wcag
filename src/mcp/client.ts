import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPConnectionError, MCPFetchError, type FetchResult } from '../types/index.js';

const MAX_CHUNK_SIZE = 500_000; // server's max_length is exclusive at 1,000,000
const DEFAULT_TIMEOUT_MS = 30_000;

const PREFIX_LINE_PATTERNS = [
  /^Content type [^\n]*cannot be simplified to markdown[^\n]*\n?/,
  /^Contents of [^\n]*:\n?/,
];

const TRUNCATION_NOTICE = /<error>Content truncated[^<]*<\/error>/;
const NO_MORE_CONTENT_NOTICE = /<error>No more content available\.<\/error>/;

/**
 * Strips the mcp-server-fetch response wrapper text (two prefix lines and
 * any truncation / completion notices) so only the raw HTML remains.
 * WCAG Criterion: enables clean HTML for parsing (Requirements 2.5-2.7).
 *
 * @param content - Raw text content returned by the fetch tool.
 * @returns Cleaned HTML content with wrapper text removed.
 */
export function cleanFetchedContent(content: string): string {
  let cleaned = content;
  for (const pattern of PREFIX_LINE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.replace(TRUNCATION_NOTICE, '');
  cleaned = cleaned.replace(NO_MORE_CONTENT_NOTICE, '');
  return cleaned;
}

/**
 * Determines whether a raw (pre-clean) response from the fetch tool
 * contains a truncation notice, meaning more content remains to be
 * paginated via start_index (Requirement 2.8).
 *
 * @param rawContent - Raw text content returned by the fetch tool, before cleaning.
 * @returns True if the response was truncated and pagination should continue.
 */
export function isTruncated(rawContent: string): boolean {
  return TRUNCATION_NOTICE.test(rawContent);
}

/**
 * Initializes an MCP client connection by launching the Python
 * mcp-server-fetch package via uvx over stdio.
 * WCAG Criterion: enables live web content fetching (Requirement 2.1).
 *
 * @returns A connected MCP Client instance.
 * @throws MCPConnectionError if the server process fails to launch or connect.
 */
async function initializeMCPClient(): Promise<Client> {
  try {
    const transport = new StdioClientTransport({
      command: 'uvx',
      args: ['mcp-server-fetch@2026.8.18'],
    });

    const client = new Client({ name: 'ada-wcag', version: '1.0.0' });
    await client.connect(transport);
    return client;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new MCPConnectionError(
      `${reason}. Ensure uvx is installed and mcp-server-fetch@2026.8.18 can be launched.`
    );
  }
}

/**
 * Extracts the text content from an MCP tool call result's content array.
 *
 * @param result - The raw result returned by client.callTool().
 * @returns The concatenated text content, or an empty string if none found.
 */
function extractTextContent(result: unknown): string {
  if (
    typeof result === 'object' &&
    result !== null &&
    'content' in result &&
    Array.isArray((result as { content: unknown }).content)
  ) {
    const parts = (result as { content: Array<{ type?: string; text?: string }> }).content;
    return parts
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text as string)
      .join('');
  }
  return '';
}

/**
 * Calls the MCP fetch tool for a single chunk of content starting at
 * startIndex, requesting raw HTML (not markdown).
 * WCAG Criterion: supports chunked retrieval of web content (Requirements 2.2-2.3, 2.8).
 *
 * @param client - A connected MCP Client.
 * @param url - The target URL to fetch.
 * @param startIndex - Character offset to resume fetching from.
 * @returns The raw (uncleaned) text content for this chunk.
 * @throws MCPFetchError if the tool call throws or reports result.isError.
 */
async function fetchChunk(client: Client, url: string, startIndex: number): Promise<string> {
  let result: unknown;
  try {
    result = await client.callTool({
      name: 'fetch',
      arguments: {
        url,
        raw: true,
        max_length: MAX_CHUNK_SIZE,
        start_index: startIndex,
      },
    });
  } catch (err) {
    // Exception path: network error, timeout, transport failure, etc.
    const reason = err instanceof Error ? err.message : String(err);
    throw new MCPFetchError(url, reason);
  }

  // result.isError path: the server reports failure (e.g. robots.txt
  // disallow) via an error-flagged result rather than throwing.
  if (
    typeof result === 'object' &&
    result !== null &&
    'isError' in result &&
    (result as { isError?: boolean }).isError === true
  ) {
    const reason = extractTextContent(result) || 'Fetch tool reported an error with no details.';
    throw new MCPFetchError(url, reason);
  }

  return extractTextContent(result);
}

/**
 * Fetches the complete HTML content of a URL via the Python
 * mcp-server-fetch MCP server, launched via uvx, with pagination and
 * response cleaning.
 * WCAG Criterion: enables analysis of live web content (Requirements 2.1-2.14).
 *
 * @param url - The URL to fetch (http/https only; scheme is validated by the CLI).
 * @param timeoutMs - Overall timeout in milliseconds (default 30000).
 * @returns The fetch result containing cleaned HTML content and timing/size metadata.
 * @throws MCPConnectionError if the server fails to launch or connect.
 * @throws MCPFetchError if the fetch tool call fails, times out, or is
 *   disallowed by robots.txt.
 */
export async function fetchHTML(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<FetchResult> {
  const startTime = Date.now();
  const client = await initializeMCPClient();

  try {
    const chunks: string[] = [];
    let startIndex = 0;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new MCPFetchError(url, `Fetch timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const fetchLoop = (async (): Promise<void> => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const rawChunk = await fetchChunk(client, url, startIndex);
        chunks.push(cleanFetchedContent(rawChunk));

        if (!isTruncated(rawChunk)) {
          break; // no truncation notice => this was the final chunk
        }
        startIndex += MAX_CHUNK_SIZE;
      }
    })();

    await Promise.race([fetchLoop, timeoutPromise]);

    const content = chunks.join('');
    const fetchDurationMs = Date.now() - startTime;
    const contentSizeBytes = Buffer.byteLength(content, 'utf-8');

    return { content, fetchDurationMs, contentSizeBytes };
  } finally {
    await client.close();
  }
}

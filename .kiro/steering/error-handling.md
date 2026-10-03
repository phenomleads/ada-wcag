---
inclusion: fileMatch
fileMatchPattern: "src/**/*.ts"
---

# Error Types and Exit Codes

**Standard**: Use only the five typed error classes from `src/types/index.ts` (`CLIError`, `MCPConnectionError`, `MCPFetchError`, `ParseError`, `FileWriteError`), and map them to exit codes consistently: `1` = CLI/argument errors, `2` = MCP errors, `3` = HTML parsing errors, `4` = file I/O errors. Every thrown error must produce a message with actionable guidance (what went wrong AND what the user should do next), never a bare stack trace to the end user.

**Context**: The CLI orchestrator (`src/cli.ts` / `src/index.ts`) catches errors at the top level and must decide a single `process.exit(code)` based on error type alone. If a new error path throws a plain `Error` or reuses the wrong class, the orchestrator cannot route it to the correct exit code, and Requirement 11 (consistent exit codes with actionable guidance) silently breaks. Property 12 (CLI Argument Validation) specifically asserts that invalid arguments throw `CLIError` with exit code 1 or 4 — never a generic error.

**Example**:

```typescript
// GOOD: typed error, correct exit code, actionable message
if (!existsSync(filePath)) {
  throw new CLIError(
    `File not found: ${filePath}. Check the path and try again.`,
    4
  );
}

// GOOD: MCP failures map to exit code 2 with the URL and reason
throw new MCPFetchError(
  url,
  `Fetch failed (robots.txt disallow). Try a different URL or host your own fixture.`
);
```

```typescript
// BAD: generic Error gives the orchestrator nothing to route on
if (!existsSync(filePath)) {
  throw new Error('file missing'); // no exit code, no guidance
}

// BAD: swallows the error and falls back silently instead of exiting non-zero
try {
  await writeReport(report, outputPath);
} catch {
  console.log(JSON.stringify(report)); // Requirement 11.5 requires exit 4, not a silent fallback
}
```

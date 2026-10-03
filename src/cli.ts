import { existsSync, accessSync, constants } from 'node:fs';
import { dirname } from 'node:path';
import { Command } from 'commander';
import {
  CLIError,
  MCPConnectionError,
  MCPFetchError,
  ParseError,
  FileWriteError,
  isAllowedUrl,
  type CLIOptions,
} from './types/index.js';
import { run } from './index.js';

/**
 * Validates parsed CLI options against Requirement 1 and Requirement 11.
 *
 * Enforces: --url and --file are mutually exclusive, at least one is
 * provided, --url must use http or https, --file must exist, and
 * --output's parent directory must be writable.
 *
 * @param options - The raw CLI options to validate.
 * @throws CLIError with exitCode 1 for argument/format errors, or
 *   exitCode 4 for file-not-found / unwritable-output errors.
 */
export function validateArguments(options: CLIOptions): void {
  if (options.url !== undefined && options.file !== undefined) {
    throw new CLIError(
      'Cannot specify both --url and --file. Choose one input source and try again.',
      1
    );
  }

  if (options.url === undefined && options.file === undefined) {
    throw new CLIError(
      'Must specify either --url or --file. Run with --help to see usage examples.',
      1
    );
  }

  if (options.url !== undefined) {
    if (!isAllowedUrl(options.url)) {
      throw new CLIError(
        `Invalid URL or disallowed scheme: "${options.url}". Only http and https schemes are allowed.`,
        1
      );
    }
  }

  if (options.file !== undefined) {
    if (!existsSync(options.file)) {
      throw new CLIError(
        `File not found: ${options.file}. Check the path and try again.`,
        4
      );
    }
  }

  if (options.output !== undefined) {
    const dir = dirname(options.output) || '.';
    try {
      accessSync(dir, constants.W_OK);
    } catch {
      throw new CLIError(
        `Output path is not writable: ${options.output}. Check directory permissions and try again.`,
        4
      );
    }
  }
}

/**
 * Builds the commander Command instance for the accessibility checker CLI.
 * Separated from main() so tests can parse argv without invoking process.exit.
 *
 * @returns A configured, unparsed commander Command.
 */
export function buildProgram(): Command {
  const program = new Command();

  program
    .name('ada-wcag')
    .description(
      'WCAG 2.1 Level AA accessibility checker. Analyzes a URL or local HTML file and reports violations.'
    )
    .option('--url <url>', 'URL to fetch and analyze (http/https only)')
    .option('--file <path>', 'Local HTML file path to analyze')
    .option('--output <path>', 'Write the JSON report to this file instead of stdout')
    .addHelpText(
      'after',
      `
Examples:
  $ ada-wcag --file test/fixtures/sample.html
  $ ada-wcag --url https://example.com --output report.json
`
    );

  return program;
}

/**
 * Main CLI entry point. Parses argv, validates arguments, and (once the
 * orchestrator exists in Task 14) runs the fetch -> parse -> validate ->
 * report pipeline. Exits the process with a code appropriate to any error
 * encountered (see error-handling steering: 1=CLI, 2=MCP, 3=parse, 4=file I/O).
 *
 * @param argv - Full process.argv (including the node executable and script path).
 */
export async function main(argv: string[]): Promise<void> {
  const program = buildProgram();
  program.parse(argv);

  if (argv.length <= 2) {
    program.outputHelp();
    return;
  }

  const options = program.opts<CLIOptions>();

  try {
    validateArguments(options);
    await run(options);
  } catch (err) {
    if (err instanceof CLIError) {
      console.error(`Error: ${err.message}`);
      process.exit(err.exitCode);
    }
    if (err instanceof MCPConnectionError || err instanceof MCPFetchError) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
    if (err instanceof ParseError) {
      console.error(`Error: ${err.message}`);
      process.exit(3);
    }
    if (err instanceof FileWriteError) {
      console.error(`Error: ${err.message}`);
      process.exit(4);
    }
    throw err;
  }
}

const isDirectRun =
  process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main(process.argv).catch((err: unknown) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { renderReport } from './report.ts';
import { scanKnot, type Scan } from './scan.ts';

const DIR = 'coverage';
const REPORT_PATH = join(DIR, 'README.md');
const USAGE = `Usage: 
npm run coverage:scan
npm run coverage:report [-- <scan.json>]
`;

async function scan(): Promise<void> {
  const result = await scanKnot();
  const scanFilePath = join(DIR, `${result.date}.json`);
  await writeFile(scanFilePath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`→ ${scanFilePath}`);
}

/**
 * Path of the newest scan. Scans are named by date, so name order is date
 * order.
 */
async function latestScanPath(): Promise<string> {
  const names = await readdir(DIR);
  const latest = names
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort()
    .at(-1);
  if (!latest) {
    throw new Error(`no scans in ${DIR}/; run npm run coverage:scan first`);
  }
  return join(DIR, latest);
}

async function report(scanPath: string): Promise<void> {
  const input = JSON.parse(await readFile(scanPath, 'utf8')) as Scan;
  if (!Array.isArray(input.results)) {
    throw new Error(`${scanPath} is not a scan`);
  }
  await writeFile(REPORT_PATH, renderReport(input), 'utf8');
  console.log(`${scanPath} → ${REPORT_PATH}`);
}

async function main(): Promise<void> {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [command, argument] = positionals;
  switch (command) {
    case 'scan':
      await scan();
      break;
    case 'report':
      await report(argument ?? (await latestScanPath()));
      break;
    case undefined:
      process.stdout.write(USAGE);
      break;
    default:
      throw new Error(`Unknown command "${command}".\n\n${USAGE}`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

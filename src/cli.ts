import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { discoverRepos } from './discover.ts';
import { renderReport } from './report.ts';
import { scanRepos, type Scan } from './scan.ts';

const SCANS_DIR = 'scans';
const REPORTS_DIR = 'reports';
const USAGE = `Usage: npm run scan
       npm run report [-- <scan.json>]

scan    discover repos on knot1, run tangleflow on their workflows, and write
        ${SCANS_DIR}/<date>.json
report  render a scan as ${REPORTS_DIR}/<date>.md; defaults to the newest scan
`;

async function scan(): Promise<void> {
  const result = await scanRepos(await discoverRepos());
  const path = join(SCANS_DIR, `${result.date}.json`);
  const replaced = existsSync(path);
  await mkdir(SCANS_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`→ ${path}${replaced ? " (replaced today's)" : ''}`);
}

/**
 * Path of the newest scan. Scans are named by date, so name order is date
 * order. A missing folder means no scan has run yet.
 */
async function latestScanPath(): Promise<string> {
  let names: string[];
  try {
    names = await readdir(SCANS_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      names = [];
    } else {
      throw err;
    }
  }
  const latest = names
    .filter((name) => name.endsWith('.json'))
    .sort()
    .at(-1);
  if (!latest) {
    throw new Error(`no scans in ${SCANS_DIR}/; run npm run scan first`);
  }
  return join(SCANS_DIR, latest);
}

async function report(scanPath: string): Promise<void> {
  const input = JSON.parse(await readFile(scanPath, 'utf8')) as Scan;
  if (!Array.isArray(input.results)) {
    throw new Error(`${scanPath} is not a scan`);
  }
  const path = join(REPORTS_DIR, `${input.date}.md`);
  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(path, renderReport(input), 'utf8');
  console.log(`${scanPath} → ${path}`);
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

import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import {
  convertWorkflow,
  tangleflowVersion,
  type Conversion,
} from './convert.ts';
import type { Repo } from './discover.ts';
import { getBlob, listWorkflowFiles } from './tangled.ts';

/**
 * The conversion outcome of one workflow file. `owner` is the handle of the
 * account that owns the repo.
 */
export type Result = {
  owner: string;
  repo: string;
  file: string;
} & Conversion;

/**
 * One scan run. Results from different tangleflow versions are not
 * comparable. `date` is the UTC day of the scan.
 */
export type Scan = {
  tangleflow: string;
  date: string;
  results: Result[];
};

export const SCANS_DIR = 'scans';

export async function readScan(path: string): Promise<Scan> {
  const scan = JSON.parse(await readFile(path, 'utf8')) as Scan;
  if (!Array.isArray(scan.results)) {
    throw new Error(`${path} is not a scan`);
  }
  return scan;
}

/**
 * Path of the newest scan. Scans are named by date, so name order is date
 * order.
 */
export async function latestScanPath(): Promise<string> {
  const names = (await readdir(SCANS_DIR))
    .filter((name) => name.endsWith('.json'))
    .sort();
  const latest = names.at(-1);
  if (!latest) {
    throw new Error(`no scans in ${SCANS_DIR}/; run npm run scan first`);
  }
  return `${SCANS_DIR}/${latest}`;
}

/**
 * Convert every GitHub workflow in `repo`.
 */
export async function scanRepo(repo: Repo): Promise<Result[]> {
  const files = await listWorkflowFiles(repo.repoDid);
  return Promise.all(
    files.map(async (file) => {
      const conversion = convertWorkflow(await getBlob(repo.repoDid, file));
      return Object.assign(
        { owner: repo.handle, repo: `${repo.handle}/${repo.name}`, file },
        conversion,
      );
    }),
  );
}

async function main(): Promise<void> {
  const repos = JSON.parse(await readFile('out/repos.json', 'utf8')) as Repo[];
  if (!Array.isArray(repos)) {
    throw new Error('out/repos.json is not a repo list; run npm run discover');
  }

  const results: Result[] = [];
  let skipped = 0;
  for (const repo of repos) {
    try {
      results.push(...(await scanRepo(repo)));
    } catch (err) {
      skipped++;
      console.warn(`skipping ${repo.handle}/${repo.name}: ${String(err)}`);
    }
  }

  const scan: Scan = {
    tangleflow: await tangleflowVersion(),
    date: new Date().toISOString().slice(0, 10),
    results,
  };
  const path = `${SCANS_DIR}/${scan.date}.json`;
  const replaced = existsSync(path);
  await mkdir(SCANS_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(scan, null, 2) + '\n');

  const failed = results.filter((r) => !r.ok).length;
  console.log(
    `${repos.length - skipped} of ${repos.length} repos scanned; ` +
      `${results.length} workflow files, ${failed} failed → ${path}` +
      (replaced ? " (replaced today's)" : ''),
  );
}

if (import.meta.main) {
  main();
}

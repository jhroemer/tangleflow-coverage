import { writeFile } from 'node:fs/promises';
import { normalizeError } from './normalize-error.ts';
import { latestScanPath, readScan, type Result } from './scan.ts';

/**
 * One normalized error: how many distinct repos and owners it blocks, and how
 * many workflow files raise it.
 */
export type Blocker = {
  error: string;
  repos: number;
  owners: number;
  files: number;
};

/**
 * A repo with at least one workflow that converts cleanly.
 */
export type ConvertibleRepo = {
  repo: string;
  converting: string[];
  workflows: number;
};

/**
 * Blockers ranked by impact, and the repos with converting workflows.
 */
export type Report = { blockers: Blocker[]; convertible: ConvertibleRepo[] };

/**
 * Plain string order, so the ranking is the same on every machine.
 */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Group failed results by normalized error, ranked by distinct repos, then
 * distinct owners, then files. A repo hitting one error in many files counts
 * once, so ten repos hitting it once outrank it.
 */
export function rankBlockers(results: Result[]): Blocker[] {
  const groups = new Map<
    string,
    { repos: Set<string>; owners: Set<string>; files: number }
  >();
  for (const result of results) {
    if (result.ok) {
      continue;
    }
    const error = normalizeError(result.error);
    const group = groups.get(error) ?? {
      repos: new Set(),
      owners: new Set(),
      files: 0,
    };
    group.repos.add(result.repo);
    group.owners.add(result.owner);
    group.files++;
    groups.set(error, group);
  }
  return [...groups]
    .map(([error, group]) => ({
      error,
      repos: group.repos.size,
      owners: group.owners.size,
      files: group.files,
    }))
    .sort(
      (a, b) =>
        b.repos - a.repos ||
        b.owners - a.owners ||
        b.files - a.files ||
        compare(a.error, b.error),
    );
}

/**
 * Group the cleanly converting workflows by repo. Repos where every file
 * converts sort first, then by share converted, then by count. Repos without
 * a converting file are left out.
 */
export function groupConvertible(results: Result[]): ConvertibleRepo[] {
  const byRepo = new Map<string, ConvertibleRepo>();
  for (const result of results) {
    const entry = byRepo.get(result.repo) ?? {
      repo: result.repo,
      converting: [],
      workflows: 0,
    };
    entry.workflows++;
    if (result.ok) {
      entry.converting.push(result.file);
    }
    byRepo.set(result.repo, entry);
  }
  return [...byRepo.values()]
    .filter((entry) => entry.converting.length > 0)
    .sort(
      (a, b) =>
        b.converting.length / b.workflows - a.converting.length / a.workflows ||
        b.converting.length - a.converting.length ||
        compare(a.repo, b.repo),
    );
}

async function main(): Promise<void> {
  const path = process.argv[2] ?? (await latestScanPath());
  const { results } = await readScan(path);
  const report: Report = {
    blockers: rankBlockers(results),
    convertible: groupConvertible(results),
  };
  await writeFile('out/report.json', JSON.stringify(report, null, 2) + '\n');

  console.table(report.blockers);
  console.table(
    report.convertible.map((entry) => ({
      repo: entry.repo,
      'converts cleanly': `${entry.converting.length}/${entry.workflows}`,
    })),
  );
  const repos = new Set(results.map((result) => result.repo));
  const owners = new Set(results.map((result) => result.owner));
  console.log(
    `${results.length} workflow files in ${repos.size} repos from ` +
      `${owners.size} owners (${path}); ${report.blockers.length} blockers, ` +
      `${report.convertible.length} repos with a cleanly converting file ` +
      `→ out/report.json`,
  );
}

if (import.meta.main) {
  main();
}

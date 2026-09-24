import { stripErrorDetails } from './strip-error-details.ts';
import type { Result, Scan } from './scan.ts';

/**
 * One error type, number of distinct repos and owners it blocks, how many workflow files raise it.
 */
type Blocker = {
  error: string;
  repos: number;
  owners: number;
  files: number;
};

/**
 * A repo with at least one workflow that converts cleanly.
 */
type ConvertibleRepo = {
  repo: string;
  converting: string[];
  workflows: number;
};

/**
 * Plain string order, so the ranking is the same on every machine.
 */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Group failed results by error with details stripped, ranked by distinct repos, then
 * distinct owners, then files. A repo hitting one error in many files counts
 * once, so ten repos hitting it once outrank it.
 */
export function rankBlockers(results: Result[]): Blocker[] {
  const groups = new Map<
    string,
    { repos: Set<string>; owners: Set<string>; files: number }
  >();
  for (const result of results) {
    if (!result.error) {
      continue;
    }
    const error = stripErrorDetails(result.error);
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
 * Group the cleanly converting workflows by repo, most workflows first. Repos
 * without a converting file are left out.
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
    if (!result.error) {
      entry.converting.push(result.file);
    }
    byRepo.set(result.repo, entry);
  }
  return [...byRepo.values()]
    .filter((entry) => entry.converting.length > 0)
    .sort((a, b) => b.workflows - a.workflows || compare(a.repo, b.repo));
}

/**
 * Error types hitting fewer repos than this are left out of the report.
 */
const MIN_REPOS = 10;

/**
 * A table cell holding an error message. Pipes would end the cell.
 */
function cell(error: string): string {
  return '`' + error.replaceAll('|', '\\|') + '`';
}

/**
 * Render a scan as a markdown report: a summary, the error types hitting
 * `MIN_REPOS` or more repos, and the repos where every workflow converts.
 */
export function renderReport(scan: Scan): string {
  const { results } = scan;
  const repos = new Set(results.map((result) => result.repo)).size;
  const owners = new Set(results.map((result) => result.owner)).size;
  const converting = results.filter((result) => !result.error).length;
  const share = Math.round((100 * converting) / results.length);
  const blockers = rankBlockers(results);
  const shown = blockers.filter((blocker) => blocker.repos >= MIN_REPOS);
  const convertible = groupConvertible(results);
  const full = convertible.filter(
    (entry) => entry.converting.length === entry.workflows,
  );
  return [
    `# tangleflow coverage ${scan.date}`,
    '',
    `tangleflow ${scan.tangleflowVersion}. ${results.length} workflow files in ` +
      `${repos} repos from ${owners} owners.`,
    `${converting} files convert (${share}%). ${convertible.length} repos ` +
      `have a converting workflow, ${full.length} convert every workflow.`,
    '',
    `## Errors hitting ${MIN_REPOS} or more repos`,
    '',
    `${shown.length} of ${blockers.length} error types.`,
    '',
    '| error | repos | owners | files |',
    '| --- | ---: | ---: | ---: |',
    ...shown.map(
      (b) => `| ${cell(b.error)} | ${b.repos} | ${b.owners} | ${b.files} |`,
    ),
    '',
    '## Repos where every workflow converts',
    '',
    ...full.map(
      (entry) =>
        `- [${entry.repo}](https://tangled.org/${entry.repo}), ` +
        `${entry.workflows} workflow${entry.workflows === 1 ? '' : 's'}`,
    ),
    '',
  ].join('\n');
}

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

/**
 * Convert every GitHub workflow in `repo`.
 */
async function scanRepo(repo: Repo): Promise<Result[]> {
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

/**
 * Scan every repo and stamp the results with the tangleflow version and the
 * UTC day. A repo the mirror cannot read is skipped with a warning.
 */
export async function scanRepos(repos: Repo[]): Promise<Scan> {
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
  const failed = results.filter((result) => !result.ok).length;
  console.log(
    `${repos.length - skipped} of ${repos.length} repos scanned; ` +
      `${results.length} workflow files, ${failed} failed`,
  );
  return {
    tangleflow: await tangleflowVersion(),
    date: new Date().toISOString().slice(0, 10),
    results,
  };
}

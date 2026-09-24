import type { Repo } from './discover.ts';
import { readRepoFile, listGithubWorkflowFiles } from './tangled.ts';
import { readFileSync } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { convertWorkflowToTangled } from 'tangleflow';
import { parse } from 'yaml';

/**
 * The conversion outcome of one workflow file. `owner` is the handle of the
 * account that owns the repo.
 */
export type Result = {
  owner: string;
  repo: string;
  file: string;
  error: string | null;
};

/**
 * One scan run. Results from different tangleflow versions are not
 * comparable. `date` is the UTC day of the scan.
 */
export type Scan = {
  tangleflowVersion: string;
  date: string;
  results: Result[];
};

/**
 * Try converting every GitHub workflow in `repo` and record whether each
 * one succeeded.
 */
async function scanRepo(repo: Repo): Promise<Result[]> {
  const files = await listGithubWorkflowFiles(repo.repoDid);
  return Promise.all(
    files.map(async (file) => {
      const yamlText = await readRepoFile(repo.repoDid, file);
      let error: string | null = null;

      try {
        const workflow = parse(yamlText);
        convertWorkflowToTangled(workflow);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      return {
        owner: repo.handle,
        repo: `${repo.handle}/${repo.name}`,
        file,
        error,
      };
    }),
  );
}

/**
 * Scan every repo and stamp the results with the tangleflow version and the
 * UTC day. A repo the mirror cannot read is skipped with a warning.
 */
export async function scanRepos(repos: Repo[]): Promise<Scan> {
  const date = new Date().toISOString().slice(0, 10);

  const path = findPackageJSON('tangleflow', import.meta.url);
  if (!path) throw new Error('tangleflow package.json not found');
  const pkg = JSON.parse(readFileSync(path, 'utf8')) as { version: string };

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
  const failed = results.filter((result) => result.error).length;
  console.log(
    `${repos.length - skipped} of ${repos.length} repos scanned; ` +
      `${results.length} workflow files, ${failed} failed`,
  );
  return {
    tangleflowVersion: pkg.version,
    date,
    results,
  };
}

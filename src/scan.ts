import { mkdir, writeFile } from 'node:fs/promises';
import { convertWorkflow, type Conversion } from './convert.ts';
import { discoverRepos, type Repo } from './discover.ts';
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

const DEFAULT_LIMIT = 50;

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
  const arg = process.argv[2];
  const limit = arg === undefined ? DEFAULT_LIMIT : Number(arg);
  const repos = await discoverRepos(limit);

  await mkdir('out', { recursive: true });
  await writeFile('out/repos.json', JSON.stringify(repos, null, 2) + '\n');

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
  await writeFile('out/results.json', JSON.stringify(results, null, 2) + '\n');

  const failed = results.filter((r) => !r.ok).length;
  console.log(
    `${repos.length} repos → out/repos.json, ${skipped} skipped; ` +
      `${results.length} workflow files, ${failed} failed → out/results.json`,
  );
}

if (import.meta.main) {
  main();
}

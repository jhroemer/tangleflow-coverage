import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverRepos } from './discover.ts';
import { groupConvertible, rankBlockers } from './report.ts';
import { scanRepos } from './scan.ts';

const SCANS_DIR = 'scans';

async function main(): Promise<void> {
  const scan = await scanRepos(await discoverRepos());

  const path = join(SCANS_DIR, `${scan.date}.json`);
  const replaced = existsSync(path);
  await mkdir(SCANS_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(scan, null, 2) + '\n', 'utf8');
  console.log(`→ ${path}${replaced ? " (replaced today's)" : ''}`);

  console.table(rankBlockers(scan.results));
  console.table(
    groupConvertible(scan.results).map((entry) => ({
      repo: entry.repo,
      'converts cleanly': `${entry.converting.length}/${entry.workflows}`,
    })),
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

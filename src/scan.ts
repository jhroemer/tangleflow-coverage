import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { convertWorkflow, type Conversion } from './convert.ts';
import { getBlob, listFiles } from './tangled.ts';

/**
 * A repo as discovered from its `sh.tangled.repo` record.
 */
export type Repo = {
  ownerDid: string;
  handle: string;
  name: string;
  repoDid: string;
  knot: string;
};

/**
 * The conversion outcome of one workflow file.
 */
export type Result = { repo: string; file: string } & Conversion;

const WORKFLOWS_DIR = '.github/workflows';
const YAML_EXTENSIONS = ['.yml', '.yaml'] as const;

/**
 * Convert every GitHub workflow in `repo`. A repo that already has a
 * `.tangled` folder is out of scope and yields no results.
 */
export async function scanRepo(repo: Repo): Promise<Result[]> {
  const hasTangled = (await listFiles(repo.repoDid, '.tangled')).length > 0;
  if (hasTangled) {
    return [];
  }

  const names = (await listFiles(repo.repoDid, WORKFLOWS_DIR)).filter((name) =>
    YAML_EXTENSIONS.some((ext) => name.endsWith(ext)),
  );

  return Promise.all(
    names.map(async (name) => {
      const file = `${WORKFLOWS_DIR}/${name}`;
      const conversion = convertWorkflow(await getBlob(repo.repoDid, file));
      return Object.assign(
        { repo: `${repo.handle}/${repo.name}`, file },
        conversion,
      );
    }),
  );
}

async function main(): Promise<void> {
  const repo = JSON.parse(
    await readFile('fixtures/sample-repo.json', 'utf8'),
  ) as Repo;
  const results = await scanRepo(repo);

  await mkdir('out', { recursive: true });
  await writeFile('out/results.json', JSON.stringify(results, null, 2) + '\n');

  const failed = results.filter((r) => !r.ok).length;
  console.log(
    `${results.length} workflow files, ${failed} failed → out/results.json`,
  );
}

if (import.meta.main) {
  main();
}

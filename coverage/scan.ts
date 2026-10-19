import { DidResolver, getHandle, MemoryCache } from '@atproto/identity';
import { parseCanonicalResourceUri } from '@atcute/lexicons';
import type { $output as TreeOutput } from '@atcute/tangled/types/git/temp/getTree';
import type { Main as RepoRecord } from '@atcute/tangled/types/repo';
import type { $output as GetRepoOutput } from '@atcute/tangled/types/repo/getRepoByRepoDid';
import type { $output as ListReposOutput } from '@atcute/tangled/types/sync/listRepos';
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
 * A repo with GitHub workflows to convert. `repo` is `<handle>/<name>`.
 */
type Candidate = {
  owner: string;
  repo: string;
  repoDid: string;
  workflowFiles: string[];
};

const KNOT = 'https://knot1.tangled.sh';
const APPVIEW = 'https://api.tangled.org';
const MIRROR = 'https://mirror-fsn.tangled.network';
const USER_AGENT = 'tangleflow-coverage';
const REF = 'HEAD';
const PAGE_SIZE = 1000;
const PROGRESS_INTERVAL = 200;
const WORKFLOWS_DIR = '.github/workflows';
const YAML_EXTENSIONS = ['.yml', '.yaml'] as const;

const resolver = new DidResolver({ didCache: new MemoryCache() });

function xrpc(
  service: string,
  method: string,
  params: Record<string, string>,
): Promise<Response> {
  const url = new URL(`/xrpc/${method}`, service);
  url.search = new URLSearchParams(params).toString();
  return fetch(url, { headers: { 'User-Agent': USER_AGENT } });
}

/**
 * Yield every repo the knot hosts, with its status and default branch.
 */
async function* listKnotRepos(): AsyncGenerator<
  ListReposOutput['repos'][number]
> {
  let cursor: string | undefined;
  do {
    const params: Record<string, string> = { limit: String(PAGE_SIZE) };
    if (cursor) {
      params.cursor = cursor;
    }
    const res = await xrpc(KNOT, 'sh.tangled.sync.listRepos', params);
    if (!res.ok) {
      throw new Error(`sync.listRepos: ${res.status}`);
    }
    const body = (await res.json()) as ListReposOutput;
    yield* body.repos;
    cursor = body.cursor;
  } while (cursor);
}

/**
 * Resolve a repo DID to its owner's handle and repo name via the appview's
 * `sh.tangled.repo` record. Returns `null` when the appview does not know
 * the repo or the owner's handle does not resolve.
 */
async function resolveRepo(
  repoDid: string,
): Promise<{ handle: string; name: string } | null> {
  const res = await xrpc(APPVIEW, 'sh.tangled.repo.getRepoByRepoDid', {
    repoDid,
  });
  if (!res.ok) {
    return null;
  }
  const { uri, value } = (await res.json()) as GetRepoOutput;
  const record = value as RepoRecord;
  const { repo: ownerDid, rkey } = parseCanonicalResourceUri(uri);
  const doc = await resolver.resolve(ownerDid).catch(() => null);
  const handle = doc ? getHandle(doc) : undefined;
  if (!handle) {
    return null;
  }
  // Some records have no `name` field, use rkey instead.
  return { handle, name: record.name ?? rkey };
}

/**
 * List the entry names in `path` at the repo's default branch. The mirror
 * answers 404 for a missing path, which yields an empty list.
 */
async function listRepoFiles(repoDid: string, path: string): Promise<string[]> {
  const res = await xrpc(MIRROR, 'sh.tangled.git.temp.getTree', {
    repo: repoDid,
    ref: REF,
    path,
  });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`getTree ${repoDid} ${path}: ${res.status}`);
  }
  const body = (await res.json()) as TreeOutput;
  return body.files.map((entry) => entry.name);
}

/**
 * Read the file at `path` at the repo's default branch.
 */
async function readRepoFile(repoDid: string, path: string): Promise<string> {
  const res = await xrpc(MIRROR, 'sh.tangled.git.temp.getBlob', {
    repo: repoDid,
    ref: REF,
    path,
  });
  if (!res.ok) {
    throw new Error(`getBlob ${repoDid} ${path}: ${res.status}`);
  }
  return res.text();
}

/**
 * List the GitHub workflow files at the repo's default branch as
 * repo-relative paths (`.github/workflows/<name>.yml|.yaml`).
 */
async function listGithubWorkflowFiles(repoDid: string): Promise<string[]> {
  const names = await listRepoFiles(repoDid, WORKFLOWS_DIR);
  return names
    .filter((name) => YAML_EXTENSIONS.some((ext) => name.endsWith(ext)))
    .map((name) => `${WORKFLOWS_DIR}/${name}`);
}

/**
 * Find the active, non-empty repos on the knot that have GitHub workflows
 * but no `.tangled` folder.
 */
async function findCandidates(): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  let total = 0;
  let inactive = 0;
  let empty = 0;
  let unreadable = 0;
  let unnamed = 0;
  for await (const entry of listKnotRepos()) {
    total++;
    if (total % PROGRESS_INTERVAL === 0) {
      console.log(`${total} listed, ${candidates.length} candidates found`);
    }
    if (entry.status !== 'active') {
      inactive++;
      continue;
    }
    if (!entry.defaultBranch?.head) {
      empty++;
      continue;
    }
    let workflowFiles: string[];
    try {
      const [githubWorkflows, tangled] = await Promise.all([
        listGithubWorkflowFiles(entry.repo),
        listRepoFiles(entry.repo, '.tangled'),
      ]);
      if (githubWorkflows.length === 0 || tangled.length > 0) {
        continue;
      }
      workflowFiles = githubWorkflows;
    } catch {
      unreadable++;
      continue;
    }
    const resolved = await resolveRepo(entry.repo);
    if (!resolved) {
      unnamed++;
      continue;
    }
    candidates.push({
      owner: resolved.handle,
      repo: `${resolved.handle}/${resolved.name}`,
      repoDid: entry.repo,
      workflowFiles,
    });
  }
  console.log(
    `${total} repos on ${KNOT}: ${inactive} inactive, ${empty} empty, ` +
      `${unreadable} unreadable, ${unnamed} unnamed, ` +
      `${candidates.length} candidates`,
  );
  return candidates;
}

/**
 * Try converting every GitHub workflow in `candidate` and record whether each
 * one succeeded.
 */
async function scanCandidate(candidate: Candidate): Promise<Result[]> {
  return Promise.all(
    candidate.workflowFiles.map(async (file) => {
      const yamlText = await readRepoFile(candidate.repoDid, file);
      let error: string | null = null;

      try {
        const workflow = parse(yamlText);
        convertWorkflowToTangled(workflow);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      return { owner: candidate.owner, repo: candidate.repo, file, error };
    }),
  );
}

/**
 * Scan every candidate repo on the knot and stamp the results with the
 * tangleflow version and the UTC day. A repo with a workflow file the mirror
 * cannot read is skipped with a warning.
 */
export async function scanKnot(): Promise<Scan> {
  const date = new Date().toISOString().slice(0, 10);

  const path = findPackageJSON('tangleflow', import.meta.url);
  if (!path) throw new Error('tangleflow package.json not found');
  const pkg = JSON.parse(readFileSync(path, 'utf8')) as { version: string };

  const candidates = await findCandidates();
  const results: Result[] = [];
  let skipped = 0;
  for (const candidate of candidates) {
    try {
      results.push(...(await scanCandidate(candidate)));
    } catch (err) {
      skipped++;
      console.warn(`skipping ${candidate.repo}: ${String(err)}`);
    }
  }
  const failed = results.filter((result) => result.error).length;
  console.log(
    `${candidates.length - skipped} of ${candidates.length} repos scanned; ` +
      `${results.length} workflow files, ${failed} failed`,
  );
  return {
    tangleflowVersion: pkg.version,
    date,
    results,
  };
}

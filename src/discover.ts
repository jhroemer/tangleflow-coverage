/**
 * Discover repos on Tangled's own knot that still run GitHub workflows.
 *
 * The knot lists every repo it hosts, the mirror answers the folder probes,
 * and the appview names the candidates. Every step is an unauthenticated GET.
 * Repos on self-hosted knots are out of scope.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { DidResolver, getHandle, MemoryCache } from '@atproto/identity';
import type { Main as RepoRecord } from '@atcute/tangled/types/repo';
import type { $output as GetRepoOutput } from '@atcute/tangled/types/repo/getRepoByRepoDid';
import type { $output as ListReposOutput } from '@atcute/tangled/types/sync/listRepos';
import { listFiles, listWorkflowFiles } from './tangled.ts';

/**
 * A candidate repo, named from its `sh.tangled.repo` record.
 */
export type Repo = {
  ownerDid: string;
  handle: string;
  name: string;
  repoDid: string;
  knot: string;
};

const KNOT = 'https://knot1.tangled.sh';
const APPVIEW = 'https://api.tangled.org';
const PAGE_SIZE = 1000;
const PROGRESS_EVERY = 200;
const USER_AGENT = 'tangled-migration-scanner';

const resolver = new DidResolver({ didCache: new MemoryCache() });

/**
 * Yield every repo the knot hosts, with its status and default branch.
 */
async function* listKnotRepos(): AsyncGenerator<
  ListReposOutput['repos'][number]
> {
  let cursor: string | undefined;
  do {
    const url = new URL('/xrpc/sh.tangled.sync.listRepos', KNOT);
    url.searchParams.set('limit', String(PAGE_SIZE));
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      throw new Error(`sync.listRepos: ${res.status}`);
    }
    const body = (await res.json()) as ListReposOutput;
    yield* body.repos;
    cursor = body.cursor;
  } while (cursor);
}

/**
 * Whether the repo has GitHub workflow files and no `.tangled` folder.
 * Throws when the mirror cannot read the repo.
 */
async function isCandidate(repoDid: string): Promise<boolean> {
  const [workflows, tangled] = await Promise.all([
    listWorkflowFiles(repoDid),
    listFiles(repoDid, '.tangled'),
  ]);
  return workflows.length > 0 && tangled.length === 0;
}

/**
 * Name a repo from the current `sh.tangled.repo` record the appview holds
 * for it. Yields `null` when the appview does not know the repo or the
 * owner's handle does not resolve.
 *
 * Older records use the repo name as rkey and carry no `name`; newer ones
 * use a TID rkey and carry the name in the record.
 */
async function describeRepo(repoDid: string): Promise<Repo | null> {
  const url = new URL('/xrpc/sh.tangled.repo.getRepoByRepoDid', APPVIEW);
  url.searchParams.set('repoDid', repoDid);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    return null;
  }
  const { uri, value } = (await res.json()) as GetRepoOutput;
  const record = value as RepoRecord;
  const [ownerDid, , rkey] = uri.slice('at://'.length).split('/');
  const doc = ownerDid
    ? await resolver.resolve(ownerDid).catch(() => null)
    : null;
  const handle = doc ? getHandle(doc) : undefined;
  if (!ownerDid || !rkey || !handle) {
    return null;
  }
  return {
    ownerDid,
    handle,
    name: record.name ?? rkey,
    repoDid,
    knot: record.knot,
  };
}

/**
 * Probe every active repo on the knot that has a default branch, and name
 * the candidates. Archived and disabled repos are left out.
 */
export async function discoverRepos(): Promise<Repo[]> {
  const repos: Repo[] = [];
  let listed = 0;
  let inactive = 0;
  let empty = 0;
  let unreadable = 0;
  let unnamed = 0;
  for await (const entry of listKnotRepos()) {
    listed++;
    if (listed % PROGRESS_EVERY === 0) {
      console.log(`${listed} listed, ${repos.length} candidates so far`);
    }
    if (entry.status !== 'active') {
      inactive++;
      continue;
    }
    if (!entry.defaultBranch?.head) {
      empty++;
      continue;
    }
    try {
      if (!(await isCandidate(entry.repo))) {
        continue;
      }
    } catch {
      unreadable++;
      continue;
    }
    const repo = await describeRepo(entry.repo);
    if (!repo) {
      unnamed++;
      continue;
    }
    repos.push(repo);
  }
  console.log(
    `${listed} repos on ${KNOT}: ${inactive} inactive, ${empty} empty, ` +
      `${unreadable} unreadable, ${unnamed} unnamed, ` +
      `${repos.length} candidates`,
  );
  return repos;
}

async function main(): Promise<void> {
  const repos = await discoverRepos();
  await mkdir('out', { recursive: true });
  await writeFile('out/repos.json', JSON.stringify(repos, null, 2) + '\n');
  console.log(`${repos.length} repos → out/repos.json`);
}

if (import.meta.main) {
  main();
}

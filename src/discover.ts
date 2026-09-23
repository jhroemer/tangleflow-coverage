import { DidResolver, getHandle, MemoryCache } from '@atproto/identity';
import { parseCanonicalResourceUri } from '@atcute/lexicons';
import type { Main as RepoRecord } from '@atcute/tangled/types/repo';
import type { $output as GetRepoOutput } from '@atcute/tangled/types/repo/getRepoByRepoDid';
import type { $output as ListReposOutput } from '@atcute/tangled/types/sync/listRepos';
import {
  listRepoFiles,
  listGithubWorkflowFiles,
  USER_AGENT,
} from './tangled.ts';

/**
 * A candidate repo, named from its `sh.tangled.repo` record.
 */
export type Repo = {
  handle: string;
  name: string;
  repoDid: string;
};

const KNOT = 'https://knot1.tangled.sh';
const APPVIEW = 'https://api.tangled.org';
const PAGE_SIZE = 1000;
const PROGRESS_INTERVAL = 200;

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
 * Resolve a repo DID to its owner's handle and repo name via the appview's
 * `sh.tangled.repo` record. Returns `null` when the appview does not know
 * the repo or the owner's handle does not resolve.
 */
async function resolveRepo(repoDid: string): Promise<Repo | null> {
  const url = new URL('/xrpc/sh.tangled.repo.getRepoByRepoDid', APPVIEW);
  url.searchParams.set('repoDid', repoDid);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
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
  return { handle, name: record.name ?? rkey, repoDid };
}

/**
 * Probe every active repo on the knot that has a default branch.
 * Excludes archived and disabled repos.
 */
export async function discoverRepos(): Promise<Repo[]> {
  const repos: Repo[] = [];
  let total = 0;
  let inactive = 0;
  let empty = 0;
  let unreadable = 0;
  let unnamed = 0;
  for await (const entry of listKnotRepos()) {
    total++;
    if (total % PROGRESS_INTERVAL === 0) {
      console.log(`${total} listed, ${repos.length} candidates found`);
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
      // Check if repo has GH workflows but no Tangled
      const [githubWorkflows, tangled] = await Promise.all([
        listGithubWorkflowFiles(entry.repo),
        listRepoFiles(entry.repo, '.tangled'),
      ]);
      if (githubWorkflows.length === 0 || tangled.length > 0) {
        continue;
      }
    } catch {
      unreadable++;
      continue;
    }
    const repo = await resolveRepo(entry.repo);
    if (!repo) {
      unnamed++;
      continue;
    }
    repos.push(repo);
  }
  console.log(
    `${total} repos on ${KNOT}: ${inactive} inactive, ${empty} empty, ` +
      `${unreadable} unreadable, ${unnamed} unnamed, ` +
      `${repos.length} candidates`,
  );
  return repos;
}

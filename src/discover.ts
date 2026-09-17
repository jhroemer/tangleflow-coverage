/**
 * Discover Tangled repos that still run GitHub workflows.
 *
 * The chain is relay → DID document → PDS → repo records → folder probes on
 * the mirror. Every step is an unauthenticated GET.
 */

import { DidResolver, getHandle, getPds, MemoryCache } from '@atproto/identity';
import type { $output as ListRecordsOutput } from '@atcute/atproto/types/repo/listRecords';
import type { $output as ListReposOutput } from '@atcute/atproto/types/sync/listReposByCollection';
import type { Main as RepoRecord } from '@atcute/tangled/types/repo';
import { listFiles, listWorkflowFiles } from './tangled.ts';

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
 * An account that owns `sh.tangled.repo` records.
 */
type Owner = { did: string; handle: string; pds: string };

const RELAY = 'https://relay1.us-west.bsky.network';
const COLLECTION = 'sh.tangled.repo';
const RELAY_PAGE_SIZE = 1000;
/**
 * One request per owner. Owners with more records than this are truncated.
 */
const RECORDS_PAGE_SIZE = 100;
/**
 * The relay lists the founders first, and none of their repos convert; a
 * sample taken from the top says nothing about the rest of the network.
 */
const SKIP_OWNERS = 60;

const resolver = new DidResolver({ didCache: new MemoryCache() });

/**
 * Yield the DID of every account that has a `sh.tangled.repo` record, in
 * relay order.
 */
async function* listOwnerDids(): AsyncGenerator<string> {
  let cursor: string | undefined;
  do {
    const url = new URL('/xrpc/com.atproto.sync.listReposByCollection', RELAY);
    url.searchParams.set('collection', COLLECTION);
    url.searchParams.set('limit', String(RELAY_PAGE_SIZE));
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`listReposByCollection: ${res.status}`);
    }
    const body = (await res.json()) as ListReposOutput;
    for (const { did } of body.repos) {
      yield did;
    }
    cursor = body.cursor;
  } while (cursor);
}

/**
 * Resolve an owner's handle and PDS from its DID document. Deactivated or
 * unresolvable DIDs yield `null`.
 */
async function resolveOwner(did: string): Promise<Owner | null> {
  const doc = await resolver.resolve(did).catch(() => null);
  const handle = doc ? getHandle(doc) : undefined;
  const pds = doc ? getPds(doc) : undefined;
  if (!handle || !pds) {
    return null;
  }
  return { did, handle, pds };
}

/**
 * Fetch the owner's `sh.tangled.repo` records from its PDS. An unreachable
 * or malformed PDS response yields an empty list.
 */
async function listRepoRecords(
  owner: Owner,
): Promise<ListRecordsOutput['records']> {
  const url = new URL('/xrpc/com.atproto.repo.listRecords', owner.pds);
  url.searchParams.set('repo', owner.did);
  url.searchParams.set('collection', COLLECTION);
  url.searchParams.set('limit', String(RECORDS_PAGE_SIZE));
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const body = (await res.json()) as ListRecordsOutput;
    return body.records;
  } catch {
    return [];
  }
}

/**
 * Map one record to a `Repo`. Yields `null` for records the scanner cannot
 * use: no `repoDid` (older repos the mirror cannot read) or a `localhost`
 * knot.
 *
 * Older records use the repo name as rkey and carry no `name`; newer ones
 * use a TID rkey and carry the name in the record.
 */
function toRepo(owner: Owner, uri: string, value: RepoRecord): Repo | null {
  const isLocalhost =
    value.knot === 'localhost' || value.knot.startsWith('localhost:');
  if (!value.repoDid || isLocalhost) {
    return null;
  }
  return {
    ownerDid: owner.did,
    handle: owner.handle,
    name: value.name ?? uri.slice(uri.lastIndexOf('/') + 1),
    repoDid: value.repoDid,
    knot: value.knot,
  };
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
 * Walk the relay past the first `SKIP_OWNERS` accounts and collect up to
 * `limit` candidate repos. `limit` must be a positive integer.
 */
export async function discoverRepos(limit: number): Promise<Repo[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }
  const repos: Repo[] = [];
  let seen = 0;
  let unresolved = 0;
  let probed = 0;
  let unreadable = 0;
  for await (const did of listOwnerDids()) {
    if (repos.length >= limit) {
      break;
    }
    if (seen++ < SKIP_OWNERS) {
      continue;
    }
    const owner = await resolveOwner(did);
    if (!owner) {
      unresolved++;
      continue;
    }
    for (const { uri, value } of await listRepoRecords(owner)) {
      if (repos.length >= limit) {
        break;
      }
      const repo = toRepo(owner, uri, value as RepoRecord);
      if (!repo) {
        continue;
      }
      probed++;
      try {
        if (await isCandidate(repo.repoDid)) {
          repos.push(repo);
        }
      } catch {
        unreadable++;
      }
    }
  }
  console.log(
    `${seen - SKIP_OWNERS} owners after skipping ${SKIP_OWNERS}, ` +
      `${unresolved} unresolved; ${probed} repos probed, ` +
      `${unreadable} unreadable, ${repos.length} candidates`,
  );
  return repos;
}

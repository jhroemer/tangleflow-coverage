import {
  Client,
  ok,
  retryFetchHandler,
  type RetryFetchHandlerOptions,
  simpleFetchHandler,
} from '@atcute/client';
import type { Did } from '@atcute/lexicons';

const retryOptions: Omit<RetryFetchHandlerOptions, 'handler'> = {
  maxRetries: 5,
  shouldRetry: (response) => [429, 503].includes(response.status),
};

const knot1Client = new Client({
  handler: retryFetchHandler({
    handler: simpleFetchHandler({ service: 'https://knot1.tangled.sh' }),
    ...retryOptions,
  }),
});

const mirrorClient = new Client({
  handler: retryFetchHandler({
    handler: simpleFetchHandler({
      service: 'https://mirror-fsn.tangled.network',
    }),
    ...retryOptions,
  }),
});

const appviewClient = new Client({
  handler: retryFetchHandler({
    handler: simpleFetchHandler({ service: 'https://api.tangled.org' }),
    ...retryOptions,
  }),
});

export async function* getTangledRepos() {
  let cursor: string | undefined;
  const limit = 1000;

  do {
    const result = await ok(
      knot1Client.get('sh.tangled.sync.listRepos', {
        params: { limit, cursor },
        headers: { 'user-agent': 'tangleflow-coverage' },
      }),
    );

    yield* result.repos;
    cursor = result.cursor;
  } while (cursor);
}

export async function getTangledRepoPathFiles(repoDid: Did, path: string) {
  return await ok(
    mirrorClient.get('sh.tangled.git.temp.getTree', {
      params: { ref: 'HEAD', repo: repoDid, path },
      headers: { 'user-agent': 'tangleflow-coverage' },
    }),
  );
}

export async function getTangledRepoBlob(repoDid: Did, path: string) {
  return await ok(
    mirrorClient.get('sh.tangled.git.temp.getBlob', {
      params: { repo: repoDid, path },
      as: 'blob',
      headers: { 'user-agent': 'tangleflow-coverage' },
    }),
  );
}

export async function getTangledBlob(repoDid: Did, path: string) {
  return await ok(
    mirrorClient.get('sh.tangled.git.temp.getBlob', {
      params: { repo: repoDid, path },
      as: 'blob',
      headers: { 'user-agent': 'tangleflow-coverage' },
    }),
  );
}

export async function getTangledRepoByRepoDid(repoDid: Did) {
  return await ok(
    appviewClient.get('sh.tangled.repo.getRepoByRepoDid', {
      params: { repoDid },
      headers: { 'user-agent': 'tangleflow-coverage' },
    }),
  );
}

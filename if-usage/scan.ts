import {
  Client,
  ClientResponseError,
  ok,
  retryFetchHandler,
  type RetryFetchHandlerOptions,
  simpleFetchHandler,
} from '@atcute/client';
import { appendFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CURRENT_DATE = new Date();
const OUTPUTFILE = `if-usage/${CURRENT_DATE.toISOString().slice(0, 10)}.jsonl`;
const HAS_YAML_FILE_ENDING = /\.(yaml|yml)$/;

const retryOptions: Omit<RetryFetchHandlerOptions, 'handler'> = {
  maxRetries: 5,
  shouldRetry: (response) => response.status === 429,
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

async function main() {
  let cursor: string | undefined;
  const limit = 1000;
  let processed = 0;

  while (true) {
    const result = await ok(
      knot1Client.get('sh.tangled.sync.listRepos', {
        params: { limit, cursor },
        headers: { 'user-agent': 'tangleflow-coverage' },
      }),
    );

    for (const repo of result.repos) {
      // For rate-limiting
      await sleep(100);
      const repoDid = repo.repo;
      // TODO: check if repo is deleted from Tangled?

      try {
        const githubFolder = await ok(
          mirrorClient.get('sh.tangled.git.temp.getTree', {
            params: { ref: 'HEAD', repo: repoDid, path: '.github/workflows' },
            headers: { 'user-agent': 'tangleflow-coverage' },
          }),
        ).catch((e) => {
          if (e instanceof ClientResponseError && e.status === 404) {
            return null;
          }
          throw e;
        });

        // Skip folders that are not found (404)
        if (!githubFolder) continue;

        const workflowFiles = githubFolder.files.filter((file) =>
          HAS_YAML_FILE_ENDING.test(file.name),
        );

        for (const file of workflowFiles) {
          const path = `.github/workflows/${file.name}`;
          const blob = await ok(
            mirrorClient.get('sh.tangled.git.temp.getBlob', {
              params: { repo: repoDid, path },
              as: 'blob',
              headers: { 'user-agent': 'tangleflow-coverage' },
            }),
          );
          const text = await blob.text();
          const row = {
            repo: repoDid,
            path,
            commit: githubFolder.lastCommit?.hash,
            content: text,
          };
          appendFileSync(OUTPUTFILE, JSON.stringify(row) + '\n');
          processed++;
        }
      } catch (e) {
        console.log(`there was an error for repo: ${repoDid}: ${e}`);
      }
    }

    cursor = result.cursor;
    console.log(
      `processed ${processed} repos, moving cursor to: ${result.cursor}`,
    );
    if (!cursor) break;
  }
}

await main();

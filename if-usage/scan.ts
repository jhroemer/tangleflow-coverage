import { ClientResponseError } from '@atcute/client';
import { appendFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import * as api from '../api/api.ts';

const CURRENT_DATE = new Date();
const OUTPUTFILE = `if-usage/${CURRENT_DATE.toISOString().slice(0, 10)}.jsonl`;
const HAS_YAML_FILE_ENDING = /\.(yaml|yml)$/;

async function main() {
  let processedRepos = 0;

  for await (const repo of api.getTangledRepos()) {
    const repoDid = repo.repo;
    // TODO: check if repo is deleted from Tangled?

    // For rate-limiting
    await sleep(100);
    try {
      const githubFolder = await api
        .getTangledRepoPathFiles(repoDid)
        .catch((e) => {
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

        const blob = await api.getTangledBlob(repoDid, path);

        const text = await blob.text();
        const row = {
          repo: repoDid,
          path,
          commit: githubFolder.lastCommit?.hash,
          content: text,
        };
        appendFileSync(OUTPUTFILE, JSON.stringify(row) + '\n');
      }
    } catch (e) {
      console.error(`there was an error for repo: ${repoDid}: ${e}`);
    } finally {
      processedRepos++;
      if (processedRepos % 100 === 0) {
        console.log(`processed ${processedRepos} repos`);
      }
    }
  }

  console.log(`Finished processing ${processedRepos} repos`);
}

await main();

import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import * as v from 'valibot';
import type { Did } from '@atcute/lexicons';

const If = v.optional(v.union([v.string(), v.boolean(), v.number()]));

const WorkflowSchema = v.object({
  jobs: v.record(
    v.string(),
    v.object({
      if: If,
      steps: v.optional(v.array(v.object({ if: If }))),
    }),
  ),
});

type ScanRow = {
  repo: Did;
  path: string;
  commit?: string;
  content: string;
};

type Row = {
  repo: Did;
  level: 'job' | 'step';
  expression: string;
};

function main(filepath: string) {
  // TODO:
  const data = readFileSync(filepath);
  const rows = data.toString().split('\n');
  let unparseableYaml = 0;
  let invalidWorkflows = 0;
  const ifValues: Row[] = [];

  for (const r of rows) {
    if (r === '') continue;
    const parsedRow: ScanRow = JSON.parse(r);
    let yaml: unknown;
    try {
      yaml = parse(parsedRow.content);
    } catch {
      unparseableYaml++;
      continue;
    }

    const result = v.safeParse(WorkflowSchema, yaml);
    if (!result.success) {
      invalidWorkflows++;
      continue;
    }

    for (const [, value] of Object.entries(result.output.jobs)) {
      if (value.if !== undefined) {
        ifValues.push({
          repo: parsedRow.repo,
          level: 'job',
          expression: String(value.if),
        });
      }

      if (value.steps) {
        for (const step of value.steps) {
          if (step.if !== undefined)
            ifValues.push({
              repo: parsedRow.repo,
              level: 'step',
              expression: String(step.if),
            });
        }
      }
    }
  }

  console.log('Done identifying if-statmements');
  console.log(`${unparseableYaml} workflows didn't parse into yaml`);
  console.log(`${invalidWorkflows} workflows weren't correct workflow syntax`);

  writeFileSync(
    'if-usage/ifs.jsonl',
    ifValues.map((el) => JSON.stringify(el) + '\n').join(''),
  );
}

const filepath = process.argv[2];
if (filepath !== undefined) {
  main(filepath);
} else throw new Error('A filepath need to be provided');

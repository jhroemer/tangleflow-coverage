import { data, Lexer, Parser, type Expr } from '@actions/expressions';
import {
  Binary,
  ContextAccess,
  FunctionCall,
  Grouping,
  IndexAccess,
  Literal,
  Logical,
  Star,
  Unary,
} from '@actions/expressions/ast';
import type { Did } from '@atcute/lexicons';
import { readFileSync } from 'node:fs';

type If = {
  level: 'job' | 'step';
  expression: string;
};

type WorkflowRow = {
  repo: Did;
  path: string;
  ifs: If[];
};

const CONTEXTS = [
  'github',
  'env',
  'vars',
  'secrets',
  'inputs',
  'matrix',
  'strategy',
  'needs',
  'steps',
  'job',
  'jobs',
  'runner',
];

const FUNCTIONS = [
  { name: 'success', minArgs: 0, maxArgs: 0 },
  { name: 'failure', minArgs: 0, maxArgs: 0 },
  { name: 'always', minArgs: 0, maxArgs: 0 },
  { name: 'cancelled', minArgs: 0, maxArgs: 0 },
  { name: 'hashFiles', minArgs: 1, maxArgs: 255 },
];

// Path positions that hold user-chosen names, e.g. `needs.<job>.outputs.<name>`.
const USER_NAMED: Record<string, number[]> = {
  needs: [1, 3],
  steps: [1, 3],
  jobs: [1, 3],
  matrix: [1],
  inputs: [1],
  env: [1],
  vars: [1],
  secrets: [1],
};

const DOCS =
  'https://docs.github.com/en/actions/reference/workflows-and-actions';

// Checked in order against every context path and function an `if` references.
// An `if` lands in every category one of its references matches.
const CATEGORIES: { name: string; matches: RegExp; docs: string[] }[] = [
  {
    name: 'status check functions',
    matches: /^(always|failure|success|cancelled)\(\)$/,
    docs: [`${DOCS}/expressions#status-check-functions`],
  },
  {
    name: 'steps context',
    matches: /^steps\./,
    docs: [`${DOCS}/contexts#steps-context`],
  },
  {
    name: 'needs context',
    matches: /^(needs|jobs)\./,
    docs: [`${DOCS}/contexts#needs-context`, `${DOCS}/contexts#jobs-context`],
  },
  {
    name: 'matrix context',
    matches: /^(matrix|strategy)\./,
    docs: [
      `${DOCS}/contexts#matrix-context`,
      `${DOCS}/contexts#strategy-context`,
    ],
  },
  {
    name: 'github.event / github.ref',
    matches:
      /^github\.(event_name|event|ref|ref_name|ref_type|head_ref|base_ref)(\.|$)/,
    docs: [`${DOCS}/contexts#github-context`],
  },
  {
    name: 'github.repository / github.actor',
    matches: /^github\.(repository|repository_owner|actor|triggering_actor)$/,
    docs: [`${DOCS}/contexts#github-context`],
  },
  {
    name: 'runner context',
    matches: /^runner\./,
    docs: [`${DOCS}/contexts#runner-context`],
  },
  {
    name: 'inputs context',
    matches: /^inputs\./,
    docs: [`${DOCS}/contexts#inputs-context`],
  },
  {
    name: 'env context',
    matches: /^env\./,
    docs: [`${DOCS}/contexts#env-context`],
  },
  {
    name: 'vars context',
    matches: /^vars\./,
    docs: [`${DOCS}/contexts#vars-context`],
  },
];

const CONSTANT = 'constant';
const OTHER = 'other';
const TOP_SHAPES = 10;

function parseExpression(expression: string): Expr {
  const stripped = expression.trim().replace(/^\$\{\{([\s\S]*)\}\}$/, '$1');
  const { tokens } = new Lexer(stripped).lex();
  return new Parser(tokens, CONTEXTS, FUNCTIONS).parse();
}

function contextPath(expr: Expr): string[] | null {
  if (expr instanceof ContextAccess) return [expr.name.lexeme.toLowerCase()];
  if (!(expr instanceof IndexAccess)) return null;

  const base = contextPath(expr.expr);
  if (!base) return null;
  if (expr.index instanceof Star) return [...base, '*'];
  if (
    expr.index instanceof Literal &&
    expr.index.literal instanceof data.StringData
  ) {
    return [...base, expr.index.literal.value];
  }
  return [...base, '[?]'];
}

function wildcardPath(path: string[]): string {
  const wildcards = USER_NAMED[path[0]!] ?? [];
  return path.map((part, i) => (wildcards.includes(i) ? '*' : part)).join('.');
}

function children(expr: Expr): Expr[] {
  if (expr instanceof Unary) return [expr.expr];
  if (expr instanceof Grouping) return [expr.group];
  if (expr instanceof Binary) return [expr.left, expr.right];
  if (expr instanceof Logical || expr instanceof FunctionCall) return expr.args;
  if (expr instanceof IndexAccess) return [expr.expr, expr.index];
  return [];
}

/**
 * Every context path (wildcarded) and function call (`name()`) in `expr`.
 */
function references(expr: Expr): string[] {
  const path = contextPath(expr);
  if (path) return [wildcardPath(path)];
  const own =
    expr instanceof FunctionCall
      ? [`${expr.functionName.lexeme.toLowerCase()}()`]
      : [];
  return [...own, ...children(expr).flatMap(references)];
}

function categoriesOf(expr: Expr): string[] {
  const refs = references(expr);
  if (refs.length === 0) return [CONSTANT];
  const names = CATEGORIES.filter((category) =>
    refs.some((ref) => category.matches.test(ref)),
  ).map((category) => category.name);
  return names.length > 0 ? names : [OTHER];
}

function shape(expr: Expr): string {
  const path = contextPath(expr);
  if (path) return wildcardPath(path);
  if (expr instanceof Literal) {
    const isValue =
      expr.literal instanceof data.StringData ||
      expr.literal instanceof data.NumberData;
    return isValue ? '?' : expr.token.lexeme;
  }
  if (expr instanceof Unary) return `!${shape(expr.expr)}`;
  if (expr instanceof Grouping) return `(${shape(expr.group)})`;
  if (expr instanceof Binary) {
    return `${shape(expr.left)} ${expr.operator.lexeme} ${shape(expr.right)}`;
  }
  if (expr instanceof Logical) {
    return expr.args.map(shape).join(` ${expr.operator.lexeme} `);
  }
  if (expr instanceof FunctionCall) {
    const name = expr.functionName.lexeme.toLowerCase();
    return `${name}(${expr.args.map(shape).join(', ')})`;
  }
  if (expr instanceof IndexAccess) {
    return `${shape(expr.expr)}[${shape(expr.index)}]`;
  }
  return '<unknown>';
}

function increment(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function main(filepath: string) {
  const workflows: WorkflowRow[] = readFileSync(filepath, 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line));

  // One entry per category and level, keyed `<level>:<category>`.
  const categories = new Map<
    string,
    {
      name: string;
      level: If['level'];
      count: number;
      repos: Set<Did>;
      shapes: Map<string, number>;
    }
  >();
  const allRepos = new Set(workflows.map((workflow) => workflow.repo));
  const reposWithIfs = new Set<Did>();
  let unparseable = 0;
  let parsed = 0;

  for (const workflow of workflows) {
    for (const row of workflow.ifs) {
      let expr: Expr;
      try {
        expr = parseExpression(row.expression);
      } catch {
        unparseable++;
        continue;
      }
      parsed++;
      reposWithIfs.add(workflow.repo);
      const key = shape(expr);
      for (const name of categoriesOf(expr)) {
        const id = `${row.level}:${name}`;
        const category = categories.get(id) ?? {
          name,
          level: row.level,
          count: 0,
          repos: new Set(),
          shapes: new Map(),
        };
        category.count++;
        category.repos.add(workflow.repo);
        increment(category.shapes, key);
        categories.set(id, category);
      }
    }
  }

  const percent = (part: number, total: number) =>
    `${((part / total) * 100).toFixed(1)}%`;
  const byCount = <T>(entries: Iterable<[T, number]>) =>
    [...entries].sort(([, a], [, b]) => b - a);
  const codeCell = (text: string) => `\`${text.replaceAll('|', '\\|')}\``;

  console.log('## overview\n');
  console.log('| | count |');
  console.log('| --- | --- |');
  console.log(`| repos with workflows | ${allRepos.size} |`);
  console.log(
    `| repos with at least one if | ${reposWithIfs.size} ` +
      `(${percent(reposWithIfs.size, allRepos.size)}) |`,
  );
  console.log(`| ifs | ${parsed} |`);
  console.log(`| unparseable ifs | ${unparseable} |\n`);
  console.log('## categories\n');
  console.log('| category | level | ifs | repos | % of repos |');
  console.log('| --- | --- | --- | --- | --- |');
  const categoryTotals = new Map<string, number>();
  for (const { name, count } of categories.values()) {
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + count);
  }
  // Rows of one category stay together, the biggest category first.
  const sorted = [...categories.values()].sort(
    (a, b) =>
      categoryTotals.get(b.name)! - categoryTotals.get(a.name)! ||
      a.name.localeCompare(b.name) ||
      a.level.localeCompare(b.level),
  );
  for (const { name, level, count, repos } of sorted) {
    const docs = CATEGORIES.find((category) => category.name === name)?.docs;
    const links = (docs ?? []).map((url, i) => ` [${i + 1}](${url})`).join(',');
    console.log(
      `| ${name}${links} | ${level} | ${count} | ` +
        `${repos.size} | ${percent(repos.size, allRepos.size)} |`,
    );
  }

  for (const { name, level, shapes } of sorted) {
    if (name === CONSTANT || name === OTHER) continue;
    console.log(`\n## ${name}, ${level} level\n`);
    console.log('| ifs | shape |');
    console.log('| --- | --- |');
    for (const [key, count] of byCount(shapes).slice(0, TOP_SHAPES)) {
      console.log(`| ${count} | ${codeCell(key)} |`);
    }
  }
}

const filepath = process.argv[2];
if (filepath === undefined) {
  throw new Error('Usage: node if-usage/categories.ts <workflows.jsonl>');
}
main(filepath);

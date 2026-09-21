import { readFile } from 'node:fs/promises';
import { findPackageJSON } from 'node:module';
import { convertWorkflowToTangled } from 'tangleflow';
import { parse } from 'yaml';

export type Conversion =
  | { ok: true; error: null }
  | { ok: false; error: string };

/**
 * Run tangleflow on one GitHub workflow and report whether it converted. On
 * failure `error` is tangleflow's message, or the YAML parser's if the text
 * is not valid YAML.
 */
export function convertWorkflow(yamlText: string): Conversion {
  try {
    convertWorkflowToTangled(parse(yamlText));
    return { ok: true, error: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * The version of the tangleflow package that `convertWorkflow` runs.
 */
export async function tangleflowVersion(): Promise<string> {
  const path = findPackageJSON('tangleflow', import.meta.url);
  if (!path) {
    throw new Error('tangleflow package.json not found');
  }
  const pkg = JSON.parse(await readFile(path, 'utf8')) as { version: string };
  return pkg.version;
}

/**
 * Read-only access to git contents of Tangled repos.
 *
 * Reads go through the mirror rather than the knot named in a repo record;
 * `knot1.tangled.sh` 404s on every `sh.tangled.git.temp.*` call.
 */

import type { $output as TreeOutput } from '@atcute/tangled/types/git/temp/getTree';

const MIRROR = 'https://mirror-fsn.tangled.network';
const REF = 'HEAD';
export const USER_AGENT = 'tangleflow-coverage';

/**
 * Call one `sh.tangled.git.temp.*` method on the mirror.
 */
function xrpc(
  method: string,
  params: Record<string, string>,
): Promise<Response> {
  const url = new URL(`/xrpc/sh.tangled.git.temp.${method}`, MIRROR);
  url.search = new URLSearchParams(params).toString();
  return fetch(url, { headers: { 'User-Agent': USER_AGENT } });
}

/**
 * List the entry names in `path` at the repo's default branch. A missing path
 * yields an empty list.
 *
 * Knot1 repos answer 404 for a missing path, but self-hosted knots answer 200
 * with an empty list for any path, so the empty list is the only reliable
 * "absent" signal.
 */
export async function listFiles(
  repoDid: string,
  path: string,
): Promise<string[]> {
  const res = await xrpc('getTree', { repo: repoDid, ref: REF, path });
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
export async function getBlob(repoDid: string, path: string): Promise<string> {
  const res = await xrpc('getBlob', { repo: repoDid, ref: REF, path });
  if (!res.ok) {
    throw new Error(`getBlob ${repoDid} ${path}: ${res.status}`);
  }
  return res.text();
}

const WORKFLOWS_DIR = '.github/workflows';
const YAML_EXTENSIONS = ['.yml', '.yaml'] as const;

/**
 * List the GitHub workflow files at the repo's default branch as
 * repo-relative paths (`.github/workflows/<name>.yml|.yaml`).
 */
export async function listWorkflowFiles(repoDid: string): Promise<string[]> {
  const names = await listFiles(repoDid, WORKFLOWS_DIR);
  return names
    .filter((name) => YAML_EXTENSIONS.some((ext) => name.endsWith(ext)))
    .map((name) => `${WORKFLOWS_DIR}/${name}`);
}

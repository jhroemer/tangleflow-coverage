/**
 * Reduce a tangleflow error to the problem it reports, so one problem seen in
 * different jobs, at different levels or with different action versions is
 * one string. Messages without those variable parts pass through unchanged.
 *
 * Each message holds at most one job name, one level and one action, so the
 * first match of each pattern is the only one. The job name goes first: the
 * level pattern expects `job` without a name.
 */
export function normalizeError(message: string): string {
  return message
    .replace(/job "[^"]*"/, 'job')
    .replace(/ in (workflow|job|step)/, '')
    .replace(/(\S+\/\S+)@[^"\s]+/, '$1');
}

/**
 * Reduce a tangleflow error to the problem it reports, so one problem seen
 * with different job names or action refs is one string.
 *
 * Examples:
 * Unsupported key "if" in job "build"      → Unsupported key "if" in job
 * Unsupported action: actions/cache@v3     → Unsupported action: actions/cache
 *
 * The level (workflow, job or step) stays, since the same key can be a
 * separate blocker at each.
 */
export function stripErrorDetails(message: string): string {
  if (message.includes('Unsupported action')) {
    return message.replace(/@[^"\s]+/, '');
  }
  if (message.includes('job "')) {
    return message.replace(/job "[^"]*"/, 'job');
  }
  return message;
}

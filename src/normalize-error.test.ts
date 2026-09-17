import { describe, expect, it } from 'vitest';
import { normalizeError } from './normalize-error.ts';

describe('normalizeError', () => {
  it('merges a key across jobs and levels', () => {
    const inJob = normalizeError('Unsupported key "strategy" in job "test"');
    expect(normalizeError('Unsupported key "strategy" in job "analyze"')).toBe(
      inJob,
    );
    expect(normalizeError('Unsupported key "strategy" in workflow')).toBe(
      inJob,
    );
    expect(normalizeError('Unsupported key "strategy" in step')).toBe(inJob);
    expect(inJob).toBe('Unsupported key "strategy"');
  });

  it('merges an action across refs', () => {
    const tag = normalizeError('Unsupported action: actions/cache@v3');
    expect(
      normalizeError(
        'Unsupported action: actions/cache@8e9b8c1957ab4c0a3ea2b8c0c9d5f6a7b8c9d0e1',
      ),
    ).toBe(tag);
    expect(tag).toBe('Unsupported action: actions/cache');
  });

  it('strips the ref of an action tangleflow knows but cannot convert', () => {
    // Wording from tangleflow main; 0.7.1 reports these as unknown actions.
    expect(
      normalizeError(
        'Unsupported action "actions/upload-artifact@v4": per-run artifacts have no tangled equivalent',
      ),
    ).toBe(
      'Unsupported action "actions/upload-artifact": per-run artifacts have no tangled equivalent',
    );
  });

  it('drops the job id of a reusable workflow call', () => {
    expect(
      normalizeError(
        'Unsupported job "deploy": reusable workflow calls have no tangled equivalent',
      ),
    ).toBe(
      'Unsupported job: reusable workflow calls have no tangled equivalent',
    );
  });

  it('passes messages without variable parts through', () => {
    const step = 'Unsupported step: a `run` command is required';
    expect(normalizeError(step)).toBe(step);
    const yaml =
      'Nested mappings are not allowed in compact mappings at line 3';
    expect(normalizeError(yaml)).toBe(yaml);
    const email = 'Unexpected token "@" in mail@example.org';
    expect(normalizeError(email)).toBe(email);
  });
});

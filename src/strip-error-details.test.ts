import { describe, expect, it } from 'vitest';
import { stripErrorDetails } from './strip-error-details.ts';

describe('stripErrorDetails', () => {
  it('merges a key across jobs', () => {
    const expected = 'Unsupported key "strategy" in job';
    expect(stripErrorDetails('Unsupported key "strategy" in job "test"')).toBe(
      expected,
    );
    expect(stripErrorDetails('Unsupported key "strategy" in job "analyze"')).toBe(
      expected,
    );
  });

  it('keeps a key apart per level', () => {
    expect(stripErrorDetails('Unsupported key "if" in job "test"')).toBe(
      'Unsupported key "if" in job',
    );
    expect(stripErrorDetails('Unsupported key "if" in step')).toBe(
      'Unsupported key "if" in step',
    );
    expect(stripErrorDetails('Unsupported key "if" in workflow')).toBe(
      'Unsupported key "if" in workflow',
    );
  });

  it('merges an action across refs', () => {
    const expected = 'Unsupported action: actions/cache';
    expect(stripErrorDetails('Unsupported action: actions/cache@v3')).toBe(
      expected,
    );
    expect(
      stripErrorDetails(
        'Unsupported action: actions/cache@8e9b8c1957ab4c0a3ea2b8c0c9d5f6a7b8c9d0e1',
      ),
    ).toBe(expected);
  });

  it('strips the ref of an action tangleflow knows but cannot convert', () => {
    // Wording from tangleflow main; 0.7.1 reports these as unknown actions.
    expect(
      stripErrorDetails(
        'Unsupported action "actions/upload-artifact@v4": per-run artifacts have no tangled equivalent',
      ),
    ).toBe(
      'Unsupported action "actions/upload-artifact": per-run artifacts have no tangled equivalent',
    );
  });

  it('drops the job id of a reusable workflow call', () => {
    expect(
      stripErrorDetails(
        'Unsupported job "deploy": reusable workflow calls have no tangled equivalent',
      ),
    ).toBe(
      'Unsupported job: reusable workflow calls have no tangled equivalent',
    );
  });

  it('passes messages without variable parts through', () => {
    const step = 'Unsupported step: a `run` command is required';
    expect(stripErrorDetails(step)).toBe(step);
    const yaml =
      'Nested mappings are not allowed in compact mappings at line 3';
    expect(stripErrorDetails(yaml)).toBe(yaml);
    const email = 'Unexpected token "@" in mail@example.org';
    expect(stripErrorDetails(email)).toBe(email);
  });
});

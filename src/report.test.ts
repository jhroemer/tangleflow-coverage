import { describe, expect, it } from 'vitest';
import { groupConvertible, rankBlockers } from './report.ts';
import type { Result } from './scan.ts';

describe('rankBlockers', () => {
  it('counts distinct repos, not occurrences', () => {
    const results: Result[] = [];
    for (let i = 0; i < 50; i++) {
      results.push({
        owner: 'a.org',
        repo: 'a.org/mono',
        file: `.github/workflows/${i}.yml`,
        ok: false,
        error: 'A',
      });
    }
    for (let i = 0; i < 10; i++) {
      results.push({
        owner: `b${i}.org`,
        repo: `b${i}.org/repo`,
        file: '.github/workflows/ci.yml',
        ok: false,
        error: 'B',
      });
    }
    expect(rankBlockers(results)).toEqual([
      { error: 'B', repos: 10, owners: 10, files: 10 },
      { error: 'A', repos: 1, owners: 1, files: 50 },
    ]);
  });

  it('breaks a repo tie on distinct owners', () => {
    const results: Result[] = [
      {
        owner: 'a.org',
        repo: 'a.org/one',
        file: 'x.yml',
        ok: false,
        error: 'one owner',
      },
      {
        owner: 'a.org',
        repo: 'a.org/two',
        file: 'x.yml',
        ok: false,
        error: 'one owner',
      },
      {
        owner: 'a.org',
        repo: 'a.org/three',
        file: 'x.yml',
        ok: false,
        error: 'one owner',
      },
      {
        owner: 'a.org',
        repo: 'a.org/one',
        file: 'y.yml',
        ok: false,
        error: 'three owners',
      },
      {
        owner: 'b.org',
        repo: 'b.org/one',
        file: 'y.yml',
        ok: false,
        error: 'three owners',
      },
      {
        owner: 'c.org',
        repo: 'c.org/one',
        file: 'y.yml',
        ok: false,
        error: 'three owners',
      },
    ];
    expect(rankBlockers(results).map((b) => b.error)).toEqual([
      'three owners',
      'one owner',
    ]);
  });

  it('groups by the normalized error', () => {
    const results: Result[] = [
      {
        owner: 'a.org',
        repo: 'a.org/one',
        file: 'x.yml',
        ok: false,
        error: 'Unsupported key "strategy" in job "test"',
      },
      {
        owner: 'b.org',
        repo: 'b.org/one',
        file: 'x.yml',
        ok: false,
        error: 'Unsupported key "strategy" in job "lint"',
      },
      {
        owner: 'b.org',
        repo: 'b.org/one',
        file: 'y.yml',
        ok: false,
        error: 'Unsupported key "strategy" in workflow',
      },
    ];
    expect(rankBlockers(results)).toEqual([
      { error: 'Unsupported key "strategy"', repos: 2, owners: 2, files: 3 },
    ]);
  });

  it('ignores converted files', () => {
    const results: Result[] = [
      {
        owner: 'a.org',
        repo: 'a.org/one',
        file: 'x.yml',
        ok: true,
        error: null,
      },
    ];
    expect(rankBlockers(results)).toEqual([]);
  });
});

describe('groupConvertible', () => {
  it('lists converting files per repo with the repo total', () => {
    const results: Result[] = [
      {
        owner: 'a.org',
        repo: 'a.org/partial',
        file: 'ci.yml',
        ok: true,
        error: null,
      },
      {
        owner: 'a.org',
        repo: 'a.org/partial',
        file: 'release.yml',
        ok: false,
        error: 'A',
      },
      {
        owner: 'a.org',
        repo: 'a.org/partial',
        file: 'lint.yml',
        ok: true,
        error: null,
      },
    ];
    expect(groupConvertible(results)).toEqual([
      {
        repo: 'a.org/partial',
        converting: ['ci.yml', 'lint.yml'],
        workflows: 3,
      },
    ]);
  });

  it('sorts by workflow count, then by name', () => {
    const results: Result[] = [
      {
        owner: 'a.org',
        repo: 'a.org/two',
        file: 'ci.yml',
        ok: true,
        error: null,
      },
      {
        owner: 'a.org',
        repo: 'a.org/two',
        file: 'lint.yml',
        ok: true,
        error: null,
      },
      {
        owner: 'a.org',
        repo: 'a.org/one-b',
        file: 'ci.yml',
        ok: true,
        error: null,
      },
      {
        owner: 'a.org',
        repo: 'a.org/one-a',
        file: 'ci.yml',
        ok: true,
        error: null,
      },
    ];
    expect(groupConvertible(results).map((c) => c.repo)).toEqual([
      'a.org/two',
      'a.org/one-a',
      'a.org/one-b',
    ]);
  });

  it('leaves out repos without a converting file', () => {
    const results: Result[] = [
      {
        owner: 'a.org',
        repo: 'a.org/one',
        file: 'x.yml',
        ok: false,
        error: 'A',
      },
    ];
    expect(groupConvertible(results)).toEqual([]);
  });
});

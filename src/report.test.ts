import { describe, expect, it } from 'vitest';
import { groupConvertible, rankBlockers } from './report.ts';
import type { Result } from './scan.ts';

function ok(repo: string, file: string): Result {
  return { owner: repo.split('/')[0]!, repo, file, ok: true, error: null };
}

function fail(repo: string, file: string, error: string): Result {
  return { owner: repo.split('/')[0]!, repo, file, ok: false, error };
}

describe('rankBlockers', () => {
  it('counts distinct repos, not occurrences', () => {
    const results: Result[] = [];
    for (let i = 0; i < 50; i++) {
      results.push(fail('a.org/mono', `.github/workflows/${i}.yml`, 'A'));
    }
    for (let i = 0; i < 10; i++) {
      results.push(fail(`b${i}.org/repo`, '.github/workflows/ci.yml', 'B'));
    }
    expect(rankBlockers(results)).toEqual([
      { error: 'B', repos: 10, owners: 10, files: 10 },
      { error: 'A', repos: 1, owners: 1, files: 50 },
    ]);
  });

  it('breaks a repo tie on distinct owners', () => {
    const results = [
      fail('a.org/one', 'x.yml', 'one owner'),
      fail('a.org/two', 'x.yml', 'one owner'),
      fail('a.org/three', 'x.yml', 'one owner'),
      fail('a.org/one', 'y.yml', 'three owners'),
      fail('b.org/one', 'y.yml', 'three owners'),
      fail('c.org/one', 'y.yml', 'three owners'),
    ];
    expect(rankBlockers(results).map((b) => b.error)).toEqual([
      'three owners',
      'one owner',
    ]);
  });

  it('groups by the normalized error', () => {
    const results = [
      fail('a.org/one', 'x.yml', 'Unsupported key "strategy" in job "test"'),
      fail('b.org/one', 'x.yml', 'Unsupported key "strategy" in job "lint"'),
      fail('b.org/one', 'y.yml', 'Unsupported key "strategy" in workflow'),
    ];
    expect(rankBlockers(results)).toEqual([
      { error: 'Unsupported key "strategy"', repos: 2, owners: 2, files: 3 },
    ]);
  });

  it('ignores converted files', () => {
    expect(rankBlockers([ok('a.org/one', 'x.yml')])).toEqual([]);
  });
});

describe('groupConvertible', () => {
  it('lists converting files per repo with the repo total', () => {
    const results = [
      ok('a.org/partial', 'ci.yml'),
      fail('a.org/partial', 'release.yml', 'A'),
      ok('a.org/partial', 'lint.yml'),
    ];
    expect(groupConvertible(results)).toEqual([
      {
        repo: 'a.org/partial',
        converting: ['ci.yml', 'lint.yml'],
        workflows: 3,
      },
    ]);
  });

  it('sorts fully converting repos first, then by share', () => {
    const results = [
      ok('a.org/half', 'ci.yml'),
      fail('a.org/half', 'release.yml', 'A'),
      ok('a.org/full', 'ci.yml'),
      ok('a.org/most', 'ci.yml'),
      ok('a.org/most', 'lint.yml'),
      fail('a.org/most', 'release.yml', 'A'),
    ];
    expect(groupConvertible(results).map((c) => c.repo)).toEqual([
      'a.org/full',
      'a.org/most',
      'a.org/half',
    ]);
  });

  it('leaves out repos without a converting file', () => {
    expect(groupConvertible([fail('a.org/one', 'x.yml', 'A')])).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { fetchTopChina, fetchGitrecon1455, fetchHideipme, fetchElliottophellia } from '../src/proxy-fetcher';

describe('test all fetch functions', () => {
  it('should extract Hong Kong proxies', async () => {
    const tasks = [];
    for (const func of [fetchTopChina, fetchGitrecon1455, fetchHideipme, fetchElliottophellia]) {
      tasks.push(func());
    }
    const results = await Promise.all(tasks);
    for (const proxies of results) {
      expect(proxies.length).toBeGreaterThan(0);
    }
  });
}, 100000);

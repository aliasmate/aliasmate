import { useTempConfigDir, cleanupTempConfigDir } from './helpers';
import {
  recordExecution,
  getRecentNames,
  getUsageStats,
  clearExecutionHistory,
  getExecutionHistory,
} from '../src/core/recent';

let dir: string;
beforeEach(() => {
  dir = useTempConfigDir();
});
afterEach(() => cleanupTempConfigDir(dir));

describe('execution history', () => {
  it('records and deduplicates recent names, most recent first', () => {
    recordExecution('a');
    recordExecution('b');
    recordExecution('a');
    expect(getRecentNames()).toEqual(['a', 'b']);
    expect(getRecentNames(1)).toEqual(['a']);
    expect(getExecutionHistory()).toHaveLength(3);
  });

  it('computes usage stats sorted by run count', () => {
    recordExecution('a');
    recordExecution('b');
    recordExecution('b');
    const stats = getUsageStats();
    expect(stats[0]).toMatchObject({ name: 'b', runCount: 2 });
    expect(stats[1]).toMatchObject({ name: 'a', runCount: 1 });
  });

  it('clears history', () => {
    recordExecution('a');
    clearExecutionHistory();
    expect(getExecutionHistory()).toEqual([]);
  });
});

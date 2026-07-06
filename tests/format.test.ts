import { timeAgo, truncate, toJson, toYaml, toCompact } from '../src/ui/format';
import { CommandMap } from '../src/core/types';

const commands: CommandMap = {
  build: {
    command: 'npm run build',
    directory: '/tmp/proj',
    pathMode: 'saved',
    env: { API_KEY: 'supersecret1', NODE_ENV: 'prod' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

describe('timeAgo', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  it.each([
    ['2026-01-01T11:59:30Z', 'just now'],
    ['2026-01-01T11:58:00Z', '2 minutes ago'],
    ['2026-01-01T09:00:00Z', '3 hours ago'],
    ['2025-12-30T12:00:00Z', '2 days ago'],
  ])('%s -> %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});

describe('truncate', () => {
  it('leaves short strings and shortens long ones', () => {
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('a'.repeat(20), 10)).toHaveLength(10);
  });
});

describe('serializers', () => {
  it('masks secrets in JSON export', () => {
    const parsed = JSON.parse(toJson(commands));
    expect(parsed.build.env.API_KEY).toBe('sup***t1');
    expect(parsed.build.env.NODE_ENV).toBe('prod');
  });

  it('produces YAML with all fields', () => {
    const yaml = toYaml(commands);
    expect(yaml).toContain('build:');
    expect(yaml).toContain('command: "npm run build"');
    expect(yaml).toContain('pathMode: saved');
  });

  it('produces compact one-liners', () => {
    expect(toCompact(commands)).toBe('build: npm run build (/tmp/proj)');
  });
});

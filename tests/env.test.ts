import { captureUserEnv, isSensitive, maskValue, maskSensitive } from '../src/core/env';

describe('captureUserEnv', () => {
  it('keeps user vars and filters system noise', () => {
    const env = captureUserEnv({
      PATH: '/usr/bin',
      HOME: '/home/x',
      SHELL: '/bin/zsh',
      LANG: 'en_US',
      NODE_ENV: 'production',
      API_URL: 'https://x',
      SSH_AUTH_SOCK: '/tmp/s',
      npm_config_cache: '/x',
    });
    expect(env).toEqual({ NODE_ENV: 'production', API_URL: 'https://x' });
  });
});

describe('isSensitive', () => {
  it.each(['API_KEY', 'MY_SECRET', 'AUTH_TOKEN', 'DB_PASSWORD', 'private_key'])(
    'flags %s',
    (key) => {
      expect(isSensitive(key)).toBe(true);
    }
  );
  it('does not flag plain vars', () => {
    expect(isSensitive('NODE_ENV')).toBe(false);
  });
});

describe('masking', () => {
  it('masks long values with a hint and short values fully', () => {
    expect(maskValue('abcdefghij')).toBe('abc***ij');
    expect(maskValue('ab')).toBe('***');
  });

  it('masks only sensitive keys', () => {
    const out = maskSensitive({ API_KEY: 'supersecret1', NODE_ENV: 'prod' });
    expect(out.NODE_ENV).toBe('prod');
    expect(out.API_KEY).toBe('sup***t1');
  });
});

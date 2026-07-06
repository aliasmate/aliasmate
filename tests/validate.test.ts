import { validateSavedCommand, getDangerWarnings } from '../src/core/validate';
import { SavedCommand } from '../src/core/types';

const base: SavedCommand = {
  command: 'echo hello',
  directory: '/tmp',
  pathMode: 'saved',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('validateSavedCommand', () => {
  it('passes a valid builtin command', () => {
    expect(validateSavedCommand(base)).toEqual([]);
  });

  it('errors on missing directory', () => {
    const issues = validateSavedCommand({ ...base, directory: '/definitely/not/a/dir' });
    expect(issues.some((i) => i.level === 'error' && i.message.includes('Directory'))).toBe(true);
  });

  it('errors on unbalanced quotes', () => {
    const issues = validateSavedCommand({ ...base, command: 'echo "oops' });
    expect(issues.some((i) => i.level === 'error' && i.message.includes('quotes'))).toBe(true);
  });

  it('warns on unknown executables', () => {
    const issues = validateSavedCommand({ ...base, command: 'definitely-not-a-real-binary-xyz' });
    expect(
      issues.some((i) => i.level === 'warning' && i.message.includes('not found in PATH'))
    ).toBe(true);
  });

  it('warns on invalid env var names', () => {
    const issues = validateSavedCommand({ ...base, env: { '1BAD': 'x' } });
    expect(issues.some((i) => i.message.includes('1BAD'))).toBe(true);
  });
});

describe('getDangerWarnings', () => {
  it('flags rm -rf and dd', () => {
    expect(getDangerWarnings('rm -rf /').length).toBeGreaterThan(0);
    expect(getDangerWarnings('dd if=/dev/zero of=/dev/sda').length).toBeGreaterThan(0);
  });
  it('is quiet for safe commands', () => {
    expect(getDangerWarnings('npm run build')).toEqual([]);
  });
});

import { parseHistoryLine } from '../src/core/history';

describe('parseHistoryLine', () => {
  it('parses zsh extended history format', () => {
    expect(parseHistoryLine(': 1700000000:0;npm run build')).toBe('npm run build');
  });

  it('keeps semicolons inside the command', () => {
    expect(parseHistoryLine(': 1700000000:0;echo a; echo b')).toBe('echo a; echo b');
  });

  it('parses fish history format', () => {
    expect(parseHistoryLine('- cmd: git status')).toBe('git status');
  });

  it('passes plain bash lines through', () => {
    expect(parseHistoryLine('  ls -la  ')).toBe('ls -la');
  });
});

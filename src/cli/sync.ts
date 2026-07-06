import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportToFile, importFromFile } from '../core/transfer';
import { getMetadata, setMetadata } from '../core/store';
import { ok, fail, theme } from '../ui/theme';

const GIST_KEY = 'sync_gist_id';
const GIST_FILE = 'aliasmate.json';

function gh(args: string[], input?: string): string {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? '';
    if (
      /command not found|ENOENT/.test(String(error)) ||
      (error as { code?: string }).code === 'ENOENT'
    ) {
      throw new Error('Sync needs the GitHub CLI (gh). Install it from https://cli.github.com');
    }
    throw new Error(`gh failed: ${stderr.trim() || (error as Error).message}`);
  }
}

function exportToTemp(): string {
  const tmp = path.join(os.tmpdir(), `aliasmate-sync-${Date.now()}.json`);
  exportToFile(tmp, { full: true });
  return tmp;
}

function push(): void {
  const tmp = exportToTemp();
  const content = fs.readFileSync(tmp, 'utf8');
  fs.unlinkSync(tmp);
  const body = JSON.stringify({
    description: 'aliasmate sync (private)',
    files: { [GIST_FILE]: { content } },
  });

  const gistId = getMetadata<string>(GIST_KEY);
  if (gistId) {
    gh(['api', `gists/${gistId}`, '--method', 'PATCH', '--input', '-'], body);
    ok(`pushed to gist ${theme.dim(gistId)}`);
  } else {
    const created = gh(['api', 'gists', '--method', 'POST', '--input', '-', '--jq', '.id'], body);
    setMetadata(GIST_KEY, created);
    ok(`created private sync gist ${theme.dim(created)}`);
  }
  console.log(theme.dim('  Pull on another machine with: aliasmate sync pull'));
}

function pull(): void {
  const gistId = getMetadata<string>(GIST_KEY);
  if (!gistId) {
    fail('No sync gist configured on this machine yet.');
    console.log(theme.dim('Run "aliasmate sync push" on the machine that has your commands,'));
    console.log(theme.dim(`then here: aliasmate sync set <gist-id> && aliasmate sync pull`));
    process.exitCode = 1;
    return;
  }
  const content = gh(['api', `gists/${gistId}`, '--jq', `.files["${GIST_FILE}"].content`]);
  const tmp = path.join(os.tmpdir(), `aliasmate-pull-${Date.now()}.json`);
  fs.writeFileSync(tmp, content, 'utf8');
  const result = importFromFile(tmp, { overwrite: () => true });
  fs.unlinkSync(tmp);
  ok(
    `pulled ${result.imported} command${result.imported === 1 ? '' : 's'} from gist ${theme.dim(gistId)}`
  );
  if (result.backup) console.log(theme.dim(`  previous state backed up to ${result.backup}`));
}

export function syncHandler(direction: string, id?: string): void {
  switch (direction) {
    case 'push':
      return push();
    case 'pull':
      return pull();
    case 'set':
      if (!id) throw new Error('Usage: aliasmate sync set <gist-id>');
      setMetadata(GIST_KEY, id);
      ok(`sync gist set to ${theme.dim(id)}`);
      return;
    default:
      throw new Error('Usage: aliasmate sync <push|pull|set <gist-id>>');
  }
}

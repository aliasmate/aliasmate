import * as readline from 'readline';
import {
  listCommands,
  saveCommand,
  deleteCommand,
  renameCommand,
  validateCommandName,
  commandExists,
} from '../core/commands';
import { getUsageStats } from '../core/recent';
import { exportToFile, importFromFile } from '../core/transfer';
import { captureUserEnv, isSensitive, maskValue } from '../core/env';
import { PathMode, SavedCommand } from '../core/types';
import { truncate, prettyPath, timeAgo } from './format';
import { theme, icons } from './theme';

/** Simple subsequence fuzzy match: every query char appears in order. */
export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return q.length === 0;
}

type Mode = 'browse' | 'filter' | 'confirm-delete' | 'stats' | 'form' | 'input';
type EnvChoice = 'none' | 'keep' | 'capture';

export interface FormSeed {
  name?: string;
  command?: string;
  directory?: string;
  pathMode?: PathMode;
  /** When editing, the original name (kept fixed) and its saved env. */
  editing?: string;
  env?: Record<string, string>;
}

interface Row {
  name: string;
  cmd: SavedCommand;
  runs: number;
  lastRun?: string;
}

interface FormField {
  key: 'name' | 'command' | 'directory';
  label: string;
  value: string;
  /** Caret position within value (0..length). */
  cursor: number;
}

interface TextState {
  value: string;
  cursor: number;
}

/** Shared caret editing for form fields and single-line inputs. */
function editText(field: TextState, str: string | undefined, key: readline.Key): boolean {
  if (key.name === 'left') {
    field.cursor = Math.max(0, field.cursor - 1);
  } else if (key.name === 'right') {
    field.cursor = Math.min(field.value.length, field.cursor + 1);
  } else if (key.name === 'home' || (key.ctrl && key.name === 'a')) {
    field.cursor = 0;
  } else if (key.name === 'end' || (key.ctrl && key.name === 'e')) {
    field.cursor = field.value.length;
  } else if (key.ctrl && key.name === 'u') {
    field.value = field.value.slice(field.cursor);
    field.cursor = 0;
  } else if (key.name === 'backspace') {
    if (field.cursor > 0) {
      field.value = field.value.slice(0, field.cursor - 1) + field.value.slice(field.cursor);
      field.cursor -= 1;
    }
  } else if (key.name === 'delete') {
    field.value = field.value.slice(0, field.cursor) + field.value.slice(field.cursor + 1);
  } else if (str && str.length === 1 && !key.ctrl && !key.meta && str >= ' ') {
    field.value = field.value.slice(0, field.cursor) + str + field.value.slice(field.cursor);
    field.cursor += 1;
  } else {
    return false;
  }
  return true;
}

interface InputState extends TextState {
  kind: 'export' | 'import';
  label: string;
  error: string;
}

interface FormState {
  fields: FormField[];
  pathMode: PathMode;
  envChoice: EnvChoice;
  keepEnv?: Record<string, string>;
  editing?: string;
  active: number; // 0..2 text fields, 3 = pathMode, 4 = env
  error: string;
}

export type TuiAction = { kind: 'run'; name: string } | null;

const ALT_SCREEN_ON = '\x1b[?1049h\x1b[?25l';
const ALT_SCREEN_OFF = '\x1b[?1049l\x1b[?25h';
const CLEAR = '\x1b[2J\x1b[H';

function loadRows(): Row[] {
  const commands = listCommands();
  const stats = getUsageStats();
  const counts = new Map(stats.map((s) => [s.name, s.runCount]));
  const lastRuns = new Map(stats.map((s) => [s.name, s.lastRunAt]));
  return Object.keys(commands)
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b))
    .map((name) => ({
      name,
      cmd: commands[name],
      runs: counts.get(name) ?? 0,
      lastRun: lastRuns.get(name),
    }));
}

export class Tui {
  private mode: Mode = 'browse';
  private filter = '';
  private selected = 0;
  private rows: Row[] = loadRows();
  private form: FormState | null = null;
  private input: InputState | null = null;
  private message = '';
  private resolve: ((action: TuiAction) => void) | null = null;

  constructor(private readonly out: (text: string) => void = (t) => process.stdout.write(t)) {}

  private get width(): number {
    return process.stdout.columns || 100;
  }
  private get height(): number {
    return process.stdout.rows || 30;
  }

  private visibleRows(): Row[] {
    if (!this.filter) return this.rows;
    // Name matches rank above matches in the command text or directory.
    const byName = this.rows.filter((r) => fuzzyMatch(this.filter, r.name));
    const byContent = this.rows.filter(
      (r) => !byName.includes(r) && fuzzyMatch(this.filter, `${r.cmd.command} ${r.cmd.directory}`)
    );
    return [...byName, ...byContent];
  }

  refresh(): void {
    this.rows = loadRows();
    this.selected = Math.min(this.selected, Math.max(0, this.visibleRows().length - 1));
  }

  openForm(seed: FormSeed = {}): void {
    this.form = {
      fields: (
        [
          { key: 'name', label: 'name', value: seed.name ?? '' },
          { key: 'command', label: 'command', value: seed.command ?? '' },
          { key: 'directory', label: 'directory', value: seed.directory ?? process.cwd() },
        ] as Omit<FormField, 'cursor'>[]
      ).map((f) => ({ ...f, cursor: f.value.length })),
      pathMode: seed.pathMode ?? 'saved',
      envChoice: seed.env && Object.keys(seed.env).length > 0 ? 'keep' : 'none',
      keepEnv: seed.env,
      editing: seed.editing,
      active: seed.editing || seed.name ? 1 : 0,
      error: '',
    };
    this.mode = 'form';
  }

  // --- rendering -------------------------------------------------------------

  private header(subtitle: string): string[] {
    const left = `${icons.dot} ${theme.heading('aliasmate')} ${theme.dim(subtitle)}`;
    const totalRuns = this.rows.reduce((s, r) => s + r.runs, 0);
    const rightText = `${this.rows.length} commands · ${totalRuns} runs`;
    const leftText = `● aliasmate ${subtitle}`;
    const pad = Math.max(1, this.width - leftText.length - rightText.length - 3);
    return ['', ` ${left}${' '.repeat(pad)}${theme.faint(rightText)}`, ''];
  }

  private listPane(maxLines: number): string[] {
    const rows = this.visibleRows();
    if (rows.length === 0) {
      return this.rows.length === 0
        ? [
            '',
            theme.dim('   No commands yet — press ') +
              theme.accent('n') +
              theme.dim(' to create your first one.'),
          ]
        : ['', theme.dim(`   Nothing matches "${this.filter}"`)];
    }
    const nameW = Math.min(Math.max(...rows.map((r) => r.name.length), 4) + 1, 22);
    const cmdW = Math.max(20, Math.min(56, this.width - nameW - 30));

    const start = Math.max(
      0,
      Math.min(this.selected - Math.floor(maxLines / 2), rows.length - maxLines)
    );
    return rows.slice(start, start + maxLines).map((row, i) => {
      const index = start + i;
      const active = index === this.selected;
      const marker = active ? theme.accent('›') : ' ';
      const name = active
        ? theme.selected(row.name.padEnd(nameW))
        : theme.name(row.name.padEnd(nameW));
      const cmd = truncate(row.cmd.command, cmdW).padEnd(cmdW + 1);
      const runs = row.runs > 0 ? theme.dim(`${icons.fire} ${row.runs}`) : theme.faint('·');
      return ` ${marker} ${name} ${active ? cmd : theme.dim(cmd)} ${runs}`;
    });
  }

  private detailPane(): string[] {
    const row = this.visibleRows()[this.selected];
    if (!row) return [];
    const label = (t: string) => theme.faint(t.padEnd(11));
    const where =
      (row.cmd.pathMode ?? 'saved') === 'current'
        ? 'current directory'
        : prettyPath(row.cmd.directory);
    const env = Object.entries(row.cmd.env ?? {})
      .map(([k, v]) => `${k}=${isSensitive(k) ? maskValue(v) : v}`)
      .join(theme.faint(' · '));
    const lines = [
      theme.faint(` ${'─'.repeat(Math.max(10, this.width - 2))}`),
      ` ${label('command')}${truncate(row.cmd.command, this.width - 14)}`,
      ` ${label('where')}${theme.dim(truncate(where, this.width - 14))}`,
    ];
    if (env) lines.push(` ${label('env')}${theme.dim(truncate(env, this.width - 14))}`);
    lines.push(
      ` ${label('runs')}${theme.dim(row.runs > 0 ? `${row.runs} · last ${timeAgo(row.lastRun!)}` : 'never')}`
    );
    return lines;
  }

  private statsPane(): string[] {
    const top = this.rows.filter((r) => r.runs > 0).slice(0, 12);
    const lines: string[] = [];
    if (top.length === 0) {
      lines.push(theme.dim('   Nothing run yet.'));
    } else {
      const max = Math.max(...top.map((r) => r.runs));
      const nameW = Math.min(Math.max(...top.map((r) => r.name.length)) + 1, 22);
      for (const row of top) {
        const bar = theme.accent('▮'.repeat(Math.max(1, Math.round((row.runs / max) * 24))));
        lines.push(
          `   ${theme.name(row.name.padEnd(nameW))} ${bar} ${theme.dim(String(row.runs))}  ${theme.faint(timeAgo(row.lastRun!))}`
        );
      }
    }
    return lines;
  }

  private formPane(): string[] {
    const form = this.form!;
    const label = (t: string, active: boolean) =>
      (active ? theme.accent('› ') : '  ') + theme.faint(t.padEnd(11));
    const lines: string[] = [];

    form.fields.forEach((field, i) => {
      const active = form.active === i;
      const renamed =
        field.key === 'name' && form.editing !== undefined && field.value !== form.editing;
      const value = active
        ? `${field.value.slice(0, field.cursor)}${theme.accent('▏')}${field.value.slice(field.cursor)}`
        : field.value;
      lines.push(
        ` ${label(field.label, active)}${value}${renamed ? theme.faint(`  · renames ${form.editing}`) : ''}`
      );
    });

    const pmActive = form.active === 3;
    const pmText =
      form.pathMode === 'saved'
        ? 'saved directory (project command)'
        : 'current directory (utility)';
    lines.push(
      ` ${label('runs in', pmActive)}${pmActive ? pmText : theme.dim(pmText)}${pmActive ? theme.faint('  · space to toggle') : ''}`
    );

    const envActive = form.active === 4;
    const keptCount = form.keepEnv ? Object.keys(form.keepEnv).length : 0;
    const envLabels: Record<EnvChoice, string> = {
      none: 'none',
      keep: `keep saved (${keptCount} var${keptCount === 1 ? '' : 's'})`,
      capture: `capture current shell (${Object.keys(captureUserEnv()).length} vars, secrets masked on export)`,
    };
    lines.push(
      ` ${label('env', envActive)}${envActive ? envLabels[form.envChoice] : theme.dim(envLabels[form.envChoice])}${envActive ? theme.faint('  · space to cycle') : ''}`
    );

    if (form.error) {
      lines.push('');
      lines.push(` ${theme.error(form.error)}`);
    }
    return lines;
  }

  private inputPane(): string[] {
    const input = this.input!;
    const value = `${input.value.slice(0, input.cursor)}${theme.accent('▏')}${input.value.slice(input.cursor)}`;
    const lines = [` ${theme.accent('› ')}${theme.faint(input.label.padEnd(11))}${value}`];
    if (input.kind === 'export') {
      lines.push('');
      lines.push(theme.faint('   includes real secret env values — keep the file safe'));
    }
    if (input.error) {
      lines.push('');
      lines.push(` ${theme.error(input.error)}`);
    }
    return lines;
  }

  private footer(): string {
    const key = (k: string, label: string) => `${theme.accent(k)} ${theme.faint(label)}`;
    const sep = theme.faint('  ');
    switch (this.mode) {
      case 'confirm-delete': {
        const row = this.visibleRows()[this.selected];
        return ` ${theme.warning(`delete "${row?.name}"?`)}  ${key('y', 'yes')}${sep}${key('n', 'no')}`;
      }
      case 'filter':
        return ` ${theme.accent('/')} ${this.filter}${theme.accent('▏')}  ${theme.faint('esc clear · enter run · ↑↓ move')}`;
      case 'form':
        return ` ${[key('↑↓/tab', 'field'), key('←→', 'cursor'), key('enter', 'next/save'), key('esc', 'cancel')].join(sep)}`;
      case 'input':
        return ` ${[key('enter', this.input?.kind === 'export' ? 'export' : 'import'), key('esc', 'cancel')].join(sep)}`;
      case 'stats':
        return ` ${theme.faint('any key to go back')}`;
      default:
        return ` ${[
          key('↑↓', 'move'),
          key('enter', 'run'),
          key('/', 'filter'),
          key('n', 'new'),
          key('e', 'edit'),
          key('d', 'delete'),
          key('s', 'stats'),
          key('x', 'export'),
          key('i', 'import'),
          key('q', 'quit'),
        ].join(sep)}`;
    }
  }

  render(): void {
    const subtitle =
      this.mode === 'form'
        ? this.form?.editing
          ? `· edit ${this.form.editing}`
          : '· new command'
        : this.mode === 'stats'
          ? '· stats'
          : this.mode === 'input'
            ? this.input?.kind === 'export'
              ? '· export backup'
              : '· import'
            : '';
    const out: string[] = [...this.header(subtitle)];
    if (this.mode === 'stats') {
      out.push(...this.statsPane());
    } else if (this.mode === 'form') {
      out.push(...this.formPane());
    } else if (this.mode === 'input') {
      out.push(...this.inputPane());
    } else {
      const detail = this.detailPane();
      const listLines = Math.max(3, this.height - out.length - detail.length - 4);
      out.push(...this.listPane(listLines));
      out.push('');
      out.push(...detail);
    }
    while (out.length < this.height - 2) out.push('');
    out.push(this.message ? ` ${this.message}` : '');
    out.push(this.footer());
    this.out(CLEAR + out.slice(0, this.height).join('\n'));
    this.message = '';
  }

  // --- input -----------------------------------------------------------------

  /** Clear the filter but keep the same row highlighted. */
  private clearFilter(): void {
    const current = this.visibleRows()[this.selected]?.name;
    this.filter = '';
    const index = current ? this.visibleRows().findIndex((r) => r.name === current) : -1;
    this.selected = Math.max(0, index);
  }

  private move(delta: number): void {
    const count = this.visibleRows().length;
    if (count === 0) return;
    this.selected = (this.selected + delta + count) % count;
  }

  private openInput(kind: 'export' | 'import'): void {
    const today = new Date().toISOString().slice(0, 10);
    const value = kind === 'export' ? `~/aliasmate-backup-${today}.json` : '~/';
    this.input = { kind, label: 'file', value, cursor: value.length, error: '' };
    this.mode = 'input';
  }

  private handleInputKey(str: string | undefined, key: readline.Key): void {
    const input = this.input!;
    if (key.name === 'escape') {
      this.input = null;
      this.mode = 'browse';
      this.message = theme.faint('cancelled');
      return this.render();
    }
    if (key.name === 'return') return this.submitInput();
    if (editText(input, str, key)) input.error = '';
    this.render();
  }

  private submitInput(): void {
    const input = this.input!;
    const file = input.value.trim();
    if (!file) {
      input.error = 'File path cannot be empty';
      return this.render();
    }
    try {
      if (input.kind === 'export') {
        const count = exportToFile(file, { full: true });
        this.message = `${icons.ok} ${theme.dim(`exported ${count} command${count === 1 ? '' : 's'} to ${file}`)}`;
      } else {
        const result = importFromFile(file);
        this.refresh();
        const extras = [
          result.skipped.length > 0 ? `${result.skipped.length} skipped (already exist)` : '',
          result.invalid.length > 0 ? `${result.invalid.length} invalid` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        this.message = `${icons.ok} ${theme.dim(`imported ${result.imported}${extras ? ` · ${extras}` : ''}`)}`;
      }
      this.input = null;
      this.mode = 'browse';
    } catch (error) {
      input.error = (error as Error).message;
    }
    this.render();
  }

  private submitForm(): void {
    const form = this.form!;
    const [name, command, directory] = form.fields.map((f) => f.value.trim());
    const renaming = form.editing !== undefined && name !== form.editing;

    const nameCheck = validateCommandName(name);
    if (nameCheck !== true) {
      form.error = nameCheck;
      form.active = 0;
      return this.render();
    }
    if ((!form.editing || renaming) && commandExists(name)) {
      form.error = `"${name}" already exists — pick another name or edit it instead`;
      form.active = 0;
      return this.render();
    }
    if (!command) {
      form.error = 'Command cannot be empty';
      form.active = 1;
      return this.render();
    }
    if (!directory) {
      form.error = 'Directory cannot be empty';
      form.active = 2;
      return this.render();
    }

    const env =
      form.envChoice === 'none'
        ? undefined
        : form.envChoice === 'keep'
          ? form.keepEnv
          : captureUserEnv();

    try {
      if (renaming) renameCommand(form.editing!, name);
      saveCommand({ name, command, directory, pathMode: form.pathMode, env });
      this.message = `${icons.ok} ${theme.dim(renaming ? `renamed ${form.editing} → ${name}` : `saved ${name}`)}`;
      const finalName = name;
      this.form = null;
      this.mode = 'browse';
      this.refresh();
      const index = this.visibleRows().findIndex((r) => r.name === finalName);
      if (index >= 0) this.selected = index;
    } catch (error) {
      form.error = (error as Error).message;
    }
    this.render();
  }

  private handleFormKey(str: string | undefined, key: readline.Key): void {
    const form = this.form!;
    const fieldCount = 5;
    const isTextField = form.active < 3;

    if (key.name === 'escape') {
      this.form = null;
      this.mode = 'browse';
      this.message = theme.faint('cancelled');
      return this.render();
    }
    if (key.name === 'return') {
      if (form.active < fieldCount - 1) {
        form.active += 1;
      } else {
        return this.submitForm();
      }
      return this.render();
    }
    if (key.name === 'up' || (key.name === 'tab' && key.shift)) {
      form.active = (form.active - 1 + fieldCount) % fieldCount;
      return this.render();
    }
    if (key.name === 'down' || key.name === 'tab') {
      form.active = (form.active + 1) % fieldCount;
      return this.render();
    }
    if (isTextField) {
      editText(form.fields[form.active], str, key);
      form.error = '';
      return this.render();
    }
    if (key.name === 'space' || key.name === 'left' || key.name === 'right') {
      if (form.active === 3) {
        form.pathMode = form.pathMode === 'saved' ? 'current' : 'saved';
      } else {
        const cycle: EnvChoice[] = form.keepEnv ? ['keep', 'capture', 'none'] : ['none', 'capture'];
        const next = (cycle.indexOf(form.envChoice) + 1) % cycle.length;
        form.envChoice = cycle[next];
      }
      return this.render();
    }
    this.render();
  }

  handleKey(str: string | undefined, key: readline.Key): void {
    if (key.ctrl && key.name === 'c') return this.finish(null);

    if (this.mode === 'form') return this.handleFormKey(str, key);
    if (this.mode === 'input') return this.handleInputKey(str, key);

    if (this.mode === 'stats') {
      this.mode = 'browse';
      return this.render();
    }

    if (this.mode === 'confirm-delete') {
      if (str === 'y') {
        const row = this.visibleRows()[this.selected];
        if (row) {
          deleteCommand(row.name);
          this.message = `${icons.ok} ${theme.dim(`deleted ${row.name}`)}`;
          this.refresh();
        }
      }
      this.mode = 'browse';
      return this.render();
    }

    if (this.mode === 'filter') {
      if (key.name === 'escape') {
        this.clearFilter();
        this.mode = 'browse';
      } else if (key.name === 'return') {
        this.mode = 'browse';
        return this.selectRun();
      } else if (key.name === 'backspace') {
        this.filter = this.filter.slice(0, -1);
      } else if (key.name === 'up') this.move(-1);
      else if (key.name === 'down') this.move(1);
      else if (str && str.length === 1 && !key.ctrl && !key.meta) {
        this.filter += str;
        this.selected = 0;
      }
      return this.render();
    }

    // browse mode
    switch (key.name) {
      case 'up':
      case 'k':
        this.move(-1);
        break;
      case 'down':
      case 'j':
        this.move(1);
        break;
      case 'return':
        return this.selectRun();
      case 'escape':
        if (this.filter) {
          this.clearFilter();
          break;
        }
        return this.finish(null);
      default:
        if (str === '/') this.mode = 'filter';
        else if (str === 'q') return this.finish(null);
        else if (str === 'n') this.openForm();
        else if (str === 'e') {
          const row = this.visibleRows()[this.selected];
          if (row) {
            this.openForm({
              name: row.name,
              command: row.cmd.command,
              directory: row.cmd.directory,
              pathMode: row.cmd.pathMode ?? 'saved',
              env: row.cmd.env,
              editing: row.name,
            });
          }
        } else if (str === 'd' && this.visibleRows().length > 0) this.mode = 'confirm-delete';
        else if (str === 's') this.mode = 'stats';
        else if (str === 'x') this.openInput('export');
        else if (str === 'i') this.openInput('import');
    }
    this.render();
  }

  private selectRun(): void {
    const row = this.visibleRows()[this.selected];
    if (!row) {
      this.message = theme.dim('nothing selected');
      return this.render();
    }
    this.finish({ kind: 'run', name: row.name });
  }

  private finish(action: TuiAction): void {
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(action);
  }

  /** Show the TUI until the user runs a command or quits (null). */
  waitForAction(): Promise<TuiAction> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.render();
    });
  }
}

function enterScreen(onKey: (str: string | undefined, key: readline.Key) => void): () => void {
  process.stdout.write(ALT_SCREEN_ON);
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.on('keypress', onKey);
  process.stdin.resume();
  return () => {
    process.stdin.off('keypress', onKey);
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write(ALT_SCREEN_OFF);
  };
}

/**
 * The full-screen home: everything (browse, create, edit, delete, stats)
 * happens in the TUI. Only running a command hands the terminal back so
 * output lands in normal scrollback.
 */
export async function interactiveHome(seed?: FormSeed): Promise<void> {
  const tui = new Tui();
  if (seed) tui.openForm(seed);

  const onResize = () => tui.render();
  const leave = enterScreen((s, k) => tui.handleKey(s, k));
  process.stdout.on('resize', onResize);

  let action: TuiAction;
  try {
    action = await tui.waitForAction();
  } finally {
    process.stdout.off('resize', onResize);
    leave();
  }

  if (action?.kind === 'run') {
    const { runHandler } = await import('../cli/run');
    await runHandler(action.name, undefined, {});
  }
}

import * as fs from 'fs';
import * as path from 'path';
import { getCommand } from '../core/commands';
import {
  PROJECT_FILE,
  findProjectFile,
  loadProjectCommands,
  saveProjectCommand,
  removeProjectCommand,
} from '../core/project';
import { prettyPath } from '../ui/format';
import { ok, fail, theme } from '../ui/theme';

function status(): void {
  const file = findProjectFile();
  if (!file) {
    console.log(theme.dim(`No ${PROJECT_FILE} found here or in any parent directory.`));
    console.log(theme.dim('Create one with: aliasmate project init'));
    return;
  }
  const commands = loadProjectCommands();
  console.log(`${theme.heading('project')} ${theme.dim(prettyPath(file))}`);
  const names = Object.keys(commands).sort();
  if (names.length === 0) {
    console.log(theme.dim('  (empty — add with: aliasmate project add <name>)'));
    return;
  }
  for (const name of names) {
    console.log(`  ${theme.name(name.padEnd(20))} ${theme.dim(commands[name].command)}`);
  }
}

export function projectHandler(action: string | undefined, name: string | undefined): void {
  switch (action) {
    case undefined:
    case 'status':
      return status();
    case 'init': {
      const file = path.join(process.cwd(), PROJECT_FILE);
      if (fs.existsSync(file)) {
        fail(`${PROJECT_FILE} already exists here`);
        process.exitCode = 1;
        return;
      }
      fs.writeFileSync(file, '{}\n', 'utf8');
      ok(
        `created ${theme.name(PROJECT_FILE)} ${theme.dim('— commit it to share commands with your team')}`
      );
      return;
    }
    case 'add': {
      if (!name) throw new Error('Usage: aliasmate project add <name>');
      const cmd = getCommand(name);
      if (!cmd) {
        fail(`Command "${name}" not found (project add copies a saved command)`);
        process.exitCode = 1;
        return;
      }
      const file = saveProjectCommand(name, cmd);
      ok(`added ${theme.name(name)} to ${theme.dim(prettyPath(file))}`);
      return;
    }
    case 'remove': {
      if (!name) throw new Error('Usage: aliasmate project remove <name>');
      if (removeProjectCommand(name)) ok(`removed ${theme.name(name)} from the project file`);
      else {
        fail(`"${name}" is not in the project file`);
        process.exitCode = 1;
      }
      return;
    }
    default:
      throw new Error('Usage: aliasmate project [status|init|add <name>|remove <name>]');
  }
}

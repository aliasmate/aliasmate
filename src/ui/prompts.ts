import inquirer from 'inquirer';
import { PathMode } from '../core/types';
import { captureUserEnv, isSensitive, maskValue } from '../core/env';
import { RESERVED_NAMES } from '../core/commands';

/** Prompt-time validation so bad names are rejected where the user can see it. */
export function validateName(value: string): true | string {
  const name = value.trim();
  if (!name) return 'Name cannot be empty';
  if (/\s/.test(name)) return 'Name cannot contain spaces — try dashes: build-prod';
  if (!/^[\w.:-]+$/.test(name)) return 'Only letters, digits, and - _ . : are allowed';
  if (name.startsWith('@')) return 'Names starting with @ are reserved for recent commands';
  if (RESERVED_NAMES.has(name)) return `"${name}" is a reserved word — pick another name`;
  return true;
}

export interface CommandDetails {
  name: string;
  command: string;
  directory: string;
  pathMode: PathMode;
  env?: Record<string, string>;
}

/** Interactive prompts shared by save/edit flows. */
export async function promptCommandDetails(
  defaults: Partial<CommandDetails>,
  cwd: string
): Promise<CommandDetails> {
  const answers = await inquirer.prompt<{
    name: string;
    command: string;
    directory: string;
    pathMode: PathMode;
    captureEnv: boolean;
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'Name:',
      default: defaults.name,
      when: defaults.name === undefined,
      validate: validateName,
    },
    {
      type: 'input',
      name: 'command',
      message: 'Command:',
      default: defaults.command,
      validate: (v: string) => (v.trim() ? true : 'Command cannot be empty'),
    },
    {
      type: 'input',
      name: 'directory',
      message: 'Working directory:',
      default: defaults.directory ?? cwd,
    },
    {
      type: 'list',
      name: 'pathMode',
      message: 'Where should it run?',
      default: defaults.pathMode ?? 'saved',
      choices: [
        { name: 'Always in the saved directory (project command)', value: 'saved' },
        { name: 'In whatever directory I run it from (general utility)', value: 'current' },
      ],
    },
    {
      type: 'confirm',
      name: 'captureEnv',
      message: 'Capture current environment variables with it?',
      default: (defaults.env && Object.keys(defaults.env).length > 0) ?? false,
    },
  ]);

  let env = defaults.env;
  if (answers.captureEnv) {
    env = await promptEnvSelection(defaults.env ?? captureUserEnv());
  } else if (defaults.env) {
    env = defaults.env;
  }

  return {
    name: defaults.name ?? answers.name,
    command: answers.command,
    directory: answers.directory,
    pathMode: answers.pathMode,
    env,
  };
}

/** Checkbox picker over captured env vars, secrets shown masked. */
export async function promptEnvSelection(
  candidates: Record<string, string>
): Promise<Record<string, string>> {
  const keys = Object.keys(candidates);
  if (keys.length === 0) return {};
  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select environment variables to save:',
      pageSize: 15,
      choices: keys.sort().map((key) => ({
        name: `${key}=${isSensitive(key) ? maskValue(candidates[key]) : candidates[key]}`,
        value: key,
        checked: true,
      })),
    },
  ]);
  const env: Record<string, string> = {};
  for (const key of selected) env[key] = candidates[key];
  return env;
}

export async function confirm(message: string, defaultValue = false): Promise<boolean> {
  const { yes } = await inquirer.prompt<{ yes: boolean }>([
    { type: 'confirm', name: 'yes', message, default: defaultValue },
  ]);
  return yes;
}

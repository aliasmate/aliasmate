import inquirer from 'inquirer';

/**
 * Type-safe prompt utilities to eliminate 'any' types
 */

export interface TextInputPrompt {
  type: 'input';
  name: string;
  message: string;
  default?: string;
  validate?: (input: string) => boolean | string;
}

export interface ConfirmPrompt {
  type: 'confirm';
  name: string;
  message: string;
  default?: boolean;
}

export interface ListPrompt {
  type: 'list';
  name: string;
  message: string;
  choices: Array<{ name: string; value: string }>;
}

export interface CheckboxPrompt {
  type: 'checkbox';
  name: string;
  message: string;
  choices: Array<{ name: string; value: string; checked?: boolean }>;
}

type PromptType = TextInputPrompt | ConfirmPrompt | ListPrompt | CheckboxPrompt;

/**
 * Type-safe wrapper for inquirer text input prompt
 *
 * @param prompt - The prompt configuration
 * @returns Promise resolving to the user's input string
 */
export async function promptText(prompt: TextInputPrompt): Promise<string> {
  const result = await inquirer.prompt<Record<string, string>>([prompt]);
  return result[prompt.name];
}

/**
 * Type-safe wrapper for inquirer confirm prompt
 *
 * @param prompt - The prompt configuration
 * @returns Promise resolving to the user's boolean choice
 */
export async function promptConfirm(prompt: ConfirmPrompt): Promise<boolean> {
  const result = await inquirer.prompt<Record<string, boolean>>([prompt]);
  return result[prompt.name];
}

/**
 * Type-safe wrapper for inquirer list prompt
 *
 * @param prompt - The prompt configuration
 * @returns Promise resolving to the selected value
 */
export async function promptList(prompt: ListPrompt): Promise<string> {
  const result = await inquirer.prompt<Record<string, string>>([prompt]);
  return result[prompt.name];
}

/**
 * Type-safe wrapper for multiple prompts
 *
 * @param prompts - Array of prompt configurations
 * @returns Promise resolving to an object with all answers
 */
export async function promptMultiple<T extends Record<string, unknown>>(
  prompts: PromptType[]
): Promise<T> {
  const result = await inquirer.prompt<T>(prompts as inquirer.QuestionCollection<T>);
  return result;
}

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getConfigDir } from '../storage';
import { APP_VERSION } from './constants';

interface OnboardingState {
  version: string;
  lastShownVersion: string;
  hasSeenWelcome: boolean;
  installDate: string;
}

const ONBOARDING_FILE = 'onboarding.json';

/**
 * Get the path to the onboarding state file
 */
function getOnboardingPath(): string {
  return path.join(getConfigDir(), ONBOARDING_FILE);
}

/**
 * Load onboarding state from disk
 */
function loadOnboardingState(): OnboardingState | null {
  const onboardingPath = getOnboardingPath();
  
  if (!fs.existsSync(onboardingPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(onboardingPath, 'utf8');
    return JSON.parse(data) as OnboardingState;
  } catch {
    return null;
  }
}

/**
 * Save onboarding state to disk
 */
function saveOnboardingState(state: OnboardingState): void {
  const onboardingPath = getOnboardingPath();
  
  try {
    fs.writeFileSync(onboardingPath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    // Silently fail - onboarding is not critical
  }
}

/**
 * Display the welcome message for first-time users
 */
function showWelcomeMessage(): void {
  console.log();
  console.log(chalk.bold.cyan('🎉 Welcome to AliasMate! 🎉'));
  console.log();
  console.log(chalk.white('Thanks for installing AliasMate - your terminal productivity companion!'));
  console.log();
  console.log(chalk.bold.green('Why AliasMate?'));
  console.log(chalk.gray('  • Save complex commands with one simple command'));
  console.log(chalk.gray('  • Never lose track of useful commands again'));
  console.log(chalk.gray('  • Execute commands in their correct directories automatically'));
  console.log(chalk.gray('  • Share your workflows with your team'));
  console.log();
}

/**
 * Display a quick tour of the main features
 */
function showQuickTour(): void {
  console.log(chalk.bold.yellow('⚡ Quick Tour - How It Works:'));
  console.log();
  
  console.log(chalk.bold('1️⃣  Save Commands'));
  console.log(chalk.gray('   After running any command, save it:'));
  console.log(chalk.cyan('   $ npm run build'));
  console.log(chalk.cyan('   $ aliasmate prev build'));
  console.log(chalk.gray('   ✓ Saves the command with its working directory'));
  console.log();
  
  console.log(chalk.bold('2️⃣  Run Anywhere'));
  console.log(chalk.gray('   Execute saved commands from any location:'));
  console.log(chalk.cyan('   $ aliasmate run build'));
  console.log(chalk.gray('   ✓ Runs in the correct directory automatically'));
  console.log();
  
  console.log(chalk.bold('3️⃣  Manage Easily'));
  console.log(chalk.cyan('   $ aliasmate list         ') + chalk.gray('# View all saved commands'));
  console.log(chalk.cyan('   $ aliasmate search test  ') + chalk.gray('# Find specific commands'));
  console.log(chalk.cyan('   $ aliasmate edit build   ') + chalk.gray('# Modify saved commands'));
  console.log();
  
  console.log(chalk.bold('4️⃣  Share & Backup'));
  console.log(chalk.cyan('   $ aliasmate export my-commands.json'));
  console.log(chalk.cyan('   $ aliasmate import my-commands.json'));
  console.log(chalk.gray('   ✓ Share workflows with your team'));
  console.log();
  
  console.log(chalk.bold('5️⃣  LLM Integration'));
  console.log(chalk.gray('   A default "llm" command has been created for you:'));
  console.log(chalk.cyan('   $ aliasmate run llm'));
  console.log(chalk.gray('   ✓ Generates llm.txt with all AliasMate features'));
  console.log(chalk.gray('   ✓ Share this file with AI assistants for better help'));
  console.log();
}

/**
 * Display upgrade message when version changes
 */
function showUpgradeMessage(oldVersion: string, newVersion: string): void {
  console.log();
  console.log(chalk.bold.green(`🎊 AliasMate upgraded from v${oldVersion} to v${newVersion}!`));
  console.log();
  console.log(chalk.white("What's new:"));
  console.log(chalk.gray('  • Environment variable capture: Save and restore command environment'));
  console.log(chalk.gray('  • Security features: Automatic masking of sensitive variables (API keys, secrets)'));
  console.log(chalk.gray('  • Smart filtering: Excludes system variables, keeps only user-defined vars'));
  console.log(chalk.gray('  • Environment management: Edit, clear, and merge environment variables'));
  console.log();
  console.log(chalk.yellow('Run') + chalk.cyan(' aliasmate list ') + chalk.yellow('to see your commands'));
  console.log();
}

/**
 * Display shell configuration instructions
 */
function showShellConfiguration(): void {
  console.log(chalk.bold.yellow('⚙️  Shell Configuration (Recommended):'));
  console.log();
  console.log(chalk.gray('For') + chalk.cyan(' aliasmate prev ') + chalk.gray('to capture commands immediately,'));
  console.log(chalk.gray('configure your shell to write history in real-time:'));
  console.log();
  
  const shell = process.env.SHELL || '';
  
  if (shell.includes('zsh')) {
    console.log(chalk.bold('For zsh users:'));
    console.log(chalk.gray('Add to') + chalk.cyan(' ~/.zshrc') + chalk.gray(':'));
    console.log(chalk.cyan('   setopt INC_APPEND_HISTORY'));
    console.log(chalk.gray('Then run:') + chalk.cyan(' source ~/.zshrc'));
  } else if (shell.includes('bash')) {
    console.log(chalk.bold('For bash users:'));
    console.log(chalk.gray('Add to') + chalk.cyan(' ~/.bashrc') + chalk.gray(':'));
    console.log(chalk.cyan('   PROMPT_COMMAND="history -a"'));
    console.log(chalk.gray('Then run:') + chalk.cyan(' source ~/.bashrc'));
  } else {
    console.log(chalk.bold('For zsh:'));
    console.log(chalk.cyan('   setopt INC_APPEND_HISTORY') + chalk.gray(' (add to ~/.zshrc)'));
    console.log(chalk.bold('For bash:'));
    console.log(chalk.cyan('   PROMPT_COMMAND="history -a"') + chalk.gray(' (add to ~/.bashrc)'));
  }
  
  console.log();
  console.log(chalk.gray('Without this, history is only saved when the shell exits.'));
  console.log();
}

/**
 * Display helpful tips after onboarding
 */
function showHelpfulTips(): void {
  console.log(chalk.bold.magenta('💡 Pro Tips:'));
  console.log(chalk.gray('  • Use') + chalk.cyan(' aliasmate save ') + chalk.gray('for interactive command creation'));
  console.log(chalk.gray('  • Combine with') + chalk.cyan(' aliasmate run <name> . ') + chalk.gray('to run in current directory'));
  console.log(chalk.gray('  • Export commands to backup or share with teammates'));
  console.log();
  console.log(chalk.gray('Need help? Run') + chalk.cyan(' aliasmate --help'));
  console.log();
  console.log(chalk.bold.green('Happy commanding! 🚀'));
  console.log();
}

/**
 * Check if this is a first install or upgrade, and show appropriate onboarding
 * @returns true if onboarding was shown, false otherwise
 */
export function checkAndShowOnboarding(): boolean {
  const state = loadOnboardingState();
  const currentVersion = APP_VERSION;

  // First install
  if (!state) {
    showWelcomeMessage();
    showQuickTour();
    showShellConfiguration();
    showHelpfulTips();
    
    const newState: OnboardingState = {
      version: currentVersion,
      lastShownVersion: currentVersion,
      hasSeenWelcome: true,
      installDate: new Date().toISOString(),
    };
    
    saveOnboardingState(newState);
    return true;
  }

  // Version upgrade
  if (state.version !== currentVersion) {
    showUpgradeMessage(state.version, currentVersion);
    
    const updatedState: OnboardingState = {
      ...state,
      version: currentVersion,
      lastShownVersion: currentVersion,
    };
    
    saveOnboardingState(updatedState);
    return true;
  }

  return false;
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  const state = loadOnboardingState();
  return state !== null && state.hasSeenWelcome;
}

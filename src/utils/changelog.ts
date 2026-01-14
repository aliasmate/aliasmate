/**
 * Changelog utilities for displaying cumulative version changes
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    added?: string[];
    changed?: string[];
    fixed?: string[];
    deprecated?: string[];
    removed?: string[];
    security?: string[];
  };
}

interface WhatsNewData {
  [version: string]: ChangelogEntry;
}

/**
 * Compare semantic version strings
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}

/**
 * Load what's new data from file
 */
function loadWhatsNewData(): WhatsNewData | null {
  const whatsNewPath = path.join(__dirname, '../../whats-new.json');

  if (!fs.existsSync(whatsNewPath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(whatsNewPath, 'utf8');
    return JSON.parse(data) as WhatsNewData;
  } catch {
    return null;
  }
}

/**
 * Get all versions between fromVersion and toVersion (inclusive)
 */
export function getVersionsInRange(fromVersion: string, toVersion: string): string[] {
  const data = loadWhatsNewData();
  if (!data) return [];

  const allVersions = Object.keys(data).sort(compareVersions);

  return allVersions.filter((version) => {
    return compareVersions(version, fromVersion) >= 0 && compareVersions(version, toVersion) <= 0;
  });
}

/**
 * Get changes for a specific version
 */
export function getVersionChanges(version: string): ChangelogEntry | null {
  const data = loadWhatsNewData();
  if (!data) return null;

  return data[version] || null;
}

/**
 * Get cumulative changes between two versions
 */
export function getCumulativeChanges(fromVersion: string, toVersion: string): ChangelogEntry[] {
  const versions = getVersionsInRange(fromVersion, toVersion);
  const data = loadWhatsNewData();

  if (!data) return [];

  return versions
    .map((v) => data[v])
    .filter((entry): entry is ChangelogEntry => entry !== undefined);
}

/**
 * Format a changelog section for display
 */
function formatSection(title: string, items: string[], icon: string): string {
  let output = chalk.bold(`\n${icon} ${title}:\n`);
  items.forEach((item) => {
    output += chalk.gray(`  • ${item}\n`);
  });
  return output;
}

/**
 * Display changes for a single version
 */
export function displayVersionChanges(entry: ChangelogEntry): void {
  console.log();
  console.log(chalk.bold.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.bold.green(`Version ${entry.version}`) + chalk.gray(` (${entry.date})`));
  console.log(chalk.bold.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));

  if (entry.sections.added) {
    console.log(formatSection('Added', entry.sections.added, '✨'));
  }

  if (entry.sections.changed) {
    console.log(formatSection('Changed', entry.sections.changed, '🔄'));
  }

  if (entry.sections.fixed) {
    console.log(formatSection('Fixed', entry.sections.fixed, '🐛'));
  }

  if (entry.sections.deprecated) {
    console.log(formatSection('Deprecated', entry.sections.deprecated, '⚠️'));
  }

  if (entry.sections.removed) {
    console.log(formatSection('Removed', entry.sections.removed, '🗑️'));
  }

  if (entry.sections.security) {
    console.log(formatSection('Security', entry.sections.security, '🔒'));
  }
}

/**
 * Display cumulative changes between versions
 */
export function displayCumulativeChanges(fromVersion: string, toVersion: string): void {
  const changes = getCumulativeChanges(fromVersion, toVersion);

  if (changes.length === 0) {
    console.log(chalk.yellow('\nNo changelog data available for this version range.'));
    return;
  }

  console.log();
  console.log(chalk.bold.magenta('╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║         📋 CUMULATIVE CHANGELOG                        ║'));
  console.log(
    chalk.bold.magenta(`║         ${fromVersion} → ${toVersion}                              ║`)
  );
  console.log(chalk.bold.magenta('╚═══════════════════════════════════════════════════════╝'));

  // Display in reverse chronological order (newest first)
  changes.reverse().forEach((entry) => {
    displayVersionChanges(entry);
  });

  console.log();
  console.log(chalk.bold.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(chalk.bold.green(`✅ Total of ${changes.length} version(s) included`));
  console.log(chalk.bold.cyan(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log();
}

/**
 * Get a summary of changes suitable for upgrade notifications
 */
export function getUpgradeSummary(fromVersion: string, toVersion: string): string[] {
  const changes = getCumulativeChanges(fromVersion, toVersion);
  const highlights: string[] = [];

  changes.forEach((entry) => {
    // Collect the most important items (max 3 per version)
    const important = [
      ...(entry.sections.added?.slice(0, 2) || []),
      ...(entry.sections.security?.slice(0, 1) || []),
    ];

    highlights.push(...important);
  });

  return highlights.slice(0, 5); // Return top 5 highlights
}

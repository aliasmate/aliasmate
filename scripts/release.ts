#!/usr/bin/env ts-node
/**
 * Release Script for AliasMate
 * 
 * This script automates the release process:
 * - Prompts for new version number
 * - Updates package.json, package-lock.json, and constants.ts
 * - Prompts for changelog entry
 * - Updates CHANGELOG.md with cumulative entries
 * - Updates what's new data file for onboarding
 * - Creates a git commit with release changes
 * - Optionally tags the release
 * 
 * Usage: npm run release
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';

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

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const PACKAGE_LOCK_PATH = path.join(ROOT_DIR, 'package-lock.json');
const CONSTANTS_PATH = path.join(ROOT_DIR, 'src/utils/constants.ts');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');
const WHATS_NEW_PATH = path.join(ROOT_DIR, 'whats-new.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function getCurrentVersion(): string {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  return packageJson.version;
}

function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function updatePackageJson(newVersion: string): void {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated package.json to v${newVersion}`);
}

function updatePackageLock(newVersion: string): void {
  if (!fs.existsSync(PACKAGE_LOCK_PATH)) {
    console.log('⚠ package-lock.json not found, skipping...');
    return;
  }
  
  const packageLock = JSON.parse(fs.readFileSync(PACKAGE_LOCK_PATH, 'utf8'));
  packageLock.version = newVersion;
  
  // Also update the package reference inside
  if (packageLock.packages && packageLock.packages['']) {
    packageLock.packages[''].version = newVersion;
  }
  
  fs.writeFileSync(PACKAGE_LOCK_PATH, JSON.stringify(packageLock, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated package-lock.json to v${newVersion}`);
}

function updateConstants(newVersion: string): void {
  let content = fs.readFileSync(CONSTANTS_PATH, 'utf8');
  content = content.replace(
    /export const APP_VERSION = ['"][\d.]+['"];/,
    `export const APP_VERSION = '${newVersion}';`
  );
  fs.writeFileSync(CONSTANTS_PATH, content, 'utf8');
  console.log(`✓ Updated constants.ts to v${newVersion}`);
}

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

async function collectChangelogData(): Promise<ChangelogEntry['sections']> {
  console.log('\n📝 Enter changelog information (press Enter with empty line to skip a section):\n');
  
  const sections: ChangelogEntry['sections'] = {};
  
  const sectionTypes: Array<keyof ChangelogEntry['sections']> = [
    'added',
    'changed',
    'fixed',
    'deprecated',
    'removed',
    'security',
  ];
  
  for (const section of sectionTypes) {
    const items: string[] = [];
    console.log(`\n${section.toUpperCase()}:`);
    
    let itemNum = 1;
    while (true) {
      const item = await question(`  ${itemNum}. `);
      if (!item.trim()) break;
      items.push(item.trim());
      itemNum++;
    }
    
    if (items.length > 0) {
      sections[section] = items;
    }
  }
  
  return sections;
}

function formatChangelogSection(title: string, items: string[]): string {
  let output = `### ${title}\n`;
  items.forEach((item) => {
    output += `- ${item}\n`;
  });
  return output;
}

function updateChangelog(version: string, sections: ChangelogEntry['sections']): void {
  let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  
  // Find the position to insert (after the intro text, before first version)
  const insertPosition = changelog.search(/## \[\d+\.\d+\.\d+\]/);
  
  if (insertPosition === -1) {
    console.error('⚠ Could not find insertion point in CHANGELOG.md');
    return;
  }
  
  let newEntry = `## [${version}] - ${getTodayDate()}\n\n`;
  
  if (sections.added) newEntry += formatChangelogSection('Added', sections.added) + '\n';
  if (sections.changed) newEntry += formatChangelogSection('Changed', sections.changed) + '\n';
  if (sections.fixed) newEntry += formatChangelogSection('Fixed', sections.fixed) + '\n';
  if (sections.deprecated) newEntry += formatChangelogSection('Deprecated', sections.deprecated) + '\n';
  if (sections.removed) newEntry += formatChangelogSection('Removed', sections.removed) + '\n';
  if (sections.security) newEntry += formatChangelogSection('Security', sections.security) + '\n';
  
  changelog = changelog.slice(0, insertPosition) + newEntry + changelog.slice(insertPosition);
  
  fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf8');
  console.log(`✓ Updated CHANGELOG.md with v${version}`);
}

function updateWhatsNew(version: string, sections: ChangelogEntry['sections']): void {
  let whatsNewData: WhatsNewData = {};
  
  // Load existing data if file exists
  if (fs.existsSync(WHATS_NEW_PATH)) {
    whatsNewData = JSON.parse(fs.readFileSync(WHATS_NEW_PATH, 'utf8'));
  }
  
  // Add new entry
  whatsNewData[version] = {
    version,
    date: getTodayDate(),
    sections,
  };
  
  fs.writeFileSync(WHATS_NEW_PATH, JSON.stringify(whatsNewData, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated whats-new.json with v${version}`);
}

function createGitCommit(version: string): void {
  try {
    // Stage all modified files
    execSync('git add package.json package-lock.json src/utils/constants.ts CHANGELOG.md whats-new.json', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    
    // Create commit
    execSync(`git commit -m "Release v${version}"`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    
    console.log(`✓ Created git commit for v${version}`);
  } catch (error) {
    console.error('⚠ Failed to create git commit:', error);
  }
}

function createGitTag(version: string): void {
  try {
    execSync(`git tag -a v${version} -m "Release v${version}"`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    
    console.log(`✓ Created git tag v${version}`);
  } catch (error) {
    console.error('⚠ Failed to create git tag:', error);
  }
}

async function main(): Promise<void> {
  console.log('🚀 AliasMate Release Script\n');
  
  const currentVersion = getCurrentVersion();
  console.log(`Current version: ${currentVersion}\n`);
  
  // Get new version
  const newVersion = await question('Enter new version (e.g., 1.5.0): ');
  
  if (!isValidVersion(newVersion)) {
    console.error('❌ Invalid version format. Use semantic versioning (e.g., 1.5.0)');
    rl.close();
    process.exit(1);
  }
  
  if (newVersion === currentVersion) {
    console.error('❌ New version is the same as current version');
    rl.close();
    process.exit(1);
  }
  
  // Confirm version
  const confirm = await question(`\nUpdate from v${currentVersion} to v${newVersion}? (y/n): `);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Release cancelled');
    rl.close();
    process.exit(0);
  }
  
  // Collect changelog data
  const sections = await collectChangelogData();
  
  if (Object.keys(sections).length === 0) {
    const proceed = await question('\n⚠ No changelog entries provided. Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('❌ Release cancelled');
      rl.close();
      process.exit(0);
    }
  }
  
  console.log('\n📦 Updating files...\n');
  
  // Update all files
  updatePackageJson(newVersion);
  updatePackageLock(newVersion);
  updateConstants(newVersion);
  updateChangelog(newVersion, sections);
  updateWhatsNew(newVersion, sections);
  
  // Git operations
  const createCommit = await question('\nCreate git commit? (y/n): ');
  if (createCommit.toLowerCase() === 'y') {
    createGitCommit(newVersion);
    
    const createTag = await question('Create git tag? (y/n): ');
    if (createTag.toLowerCase() === 'y') {
      createGitTag(newVersion);
    }
  }
  
  console.log('\n✅ Release preparation complete!\n');
  console.log('Next steps:');
  console.log('  1. Review the changes: git diff');
  console.log('  2. Run tests: npm test');
  console.log('  3. Build: npm run build');
  console.log('  4. Push: git push && git push --tags');
  console.log('  5. Publish: npm publish');
  console.log();
  
  rl.close();
}

main().catch((error) => {
  console.error('❌ Release script failed:', error);
  rl.close();
  process.exit(1);
});

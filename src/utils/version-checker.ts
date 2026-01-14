import * as https from 'https';
import chalk from 'chalk';
import { APP_NAME, APP_VERSION } from './constants';
import { getMetadata, setMetadata } from '../storage';

/**
 * Metadata interface for version check tracking
 */
export interface VersionCheckMetadata {
  lastCheckDate?: string; // ISO date string (YYYY-MM-DD)
  lastSeenVersion?: string;
  dismissedForToday?: boolean;
}

/**
 * Compare two semantic version strings
 * @param current - Current version (e.g., "1.4.0")
 * @param latest - Latest version (e.g., "1.5.0")
 * @returns true if latest is greater than current
 */
export function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split('.').map((n) => parseInt(n, 10));
  const latestParts = latest.split('.').map((n) => parseInt(n, 10));

  for (let i = 0; i < 3; i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) {
      return true;
    } else if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

/**
 * Fetch the latest version from npm registry
 * @returns Promise that resolves to the latest version string or null on error
 */
export async function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'registry.npmjs.org',
      path: `/${APP_NAME}/latest`,
      method: 'GET',
      headers: {
        'User-Agent': `${APP_NAME}/${APP_VERSION}`,
      },
      timeout: 5000, // 5 second timeout
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            resolve(json.version || null);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      // Silently fail on network errors
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if we should run the update check
 * - Returns false if already checked today
 * - Returns false if user dismissed for today
 */
function shouldCheckForUpdate(): boolean {
  const metadata = getMetadata<VersionCheckMetadata>('versionCheck');
  const today = getTodayDate();

  // If already checked today, skip
  if (metadata?.lastCheckDate === today) {
    return false;
  }

  return true;
}

/**
 * Display update notification to the user
 */
function displayUpdateNotification(latestVersion: string): void {
  console.log();
  console.log(chalk.yellow('╭─────────────────────────────────────────────────────╮'));
  console.log(chalk.yellow('│') + chalk.bold.yellow('  Update Available!                                 ') + chalk.yellow('│'));
  console.log(chalk.yellow('├─────────────────────────────────────────────────────┤'));
  console.log(
    chalk.yellow('│') +
      `  Current version: ${chalk.cyan(APP_VERSION)}${' '.repeat(28 - APP_VERSION.length)}` +
      chalk.yellow('│')
  );
  console.log(
    chalk.yellow('│') +
      `  Latest version:  ${chalk.green(latestVersion)}${' '.repeat(28 - latestVersion.length)}` +
      chalk.yellow('│')
  );
  console.log(chalk.yellow('├─────────────────────────────────────────────────────┤'));
  console.log(
    chalk.yellow('│') +
      '  Run ' +
      chalk.cyan.bold('npm install -g aliasmate') +
      ' to update      ' +
      chalk.yellow('│')
  );
  console.log(chalk.yellow('╰─────────────────────────────────────────────────────╯'));
  console.log();
}

/**
 * Check for updates and notify the user if a new version is available
 * This function:
 * - Only runs once per day
 * - Silently fails if offline or on error
 * - Updates metadata after checking
 */
export async function checkForUpdates(): Promise<void> {
  // Skip if already checked today
  if (!shouldCheckForUpdate()) {
    return;
  }

  const today = getTodayDate();

  try {
    // Fetch the latest version from npm
    const latestVersion = await fetchLatestVersion();

    // Update metadata that we checked today
    setMetadata<VersionCheckMetadata>('versionCheck', {
      lastCheckDate: today,
      lastSeenVersion: latestVersion || undefined,
    });

    // If we got a version and it's newer, display notification
    if (latestVersion && isNewerVersion(APP_VERSION, latestVersion)) {
      displayUpdateNotification(latestVersion);
    }
  } catch {
    // Silently fail - just update the check date so we don't retry immediately
    setMetadata<VersionCheckMetadata>('versionCheck', {
      lastCheckDate: today,
    });
  }
}

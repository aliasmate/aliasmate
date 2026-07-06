/** Environment variable capture, filtering, and secret masking. */

const SYSTEM_VAR_PATTERNS = [
  /^(PATH|HOME|USER|LOGNAME|SHELL|SHLVL|PWD|OLDPWD|TERM|TERM_PROGRAM.*|TMPDIR|TEMP|TMP)$/,
  /^(LANG|LANGUAGE|LC_.*|TZ|COLORTERM|DISPLAY|EDITOR|VISUAL|PAGER|LESS.*|MANPATH)$/,
  /^(SSH_.*|XPC_.*|XDG_.*|DBUS_.*|WINDOWID|HOSTNAME|COMPUTERNAME|OS|PROCESSOR_.*)$/,
  /^(HOMEBREW_.*|npm_.*|NODE|NVM_.*|_|__.*|ALIASMATE_.*|Apple_.*|COMMAND_MODE)$/,
  /^(SYSTEMROOT|WINDIR|APPDATA|LOCALAPPDATA|PROGRAMFILES.*|USERPROFILE|COMSPEC|PATHEXT)$/,
];

const SENSITIVE_PATTERN = /(KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|AUTH|PRIVATE)/i;

/** User-defined variables from the current process, system noise filtered out. */
export function captureUserEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;
    if (SYSTEM_VAR_PATTERNS.some((p) => p.test(key))) continue;
    result[key] = value;
  }
  return result;
}

export function isSensitive(key: string): boolean {
  return SENSITIVE_PATTERN.test(key);
}

/** Mask a secret value for display/export: keep short hints, hide the middle. */
export function maskValue(value: string): string {
  if (value.length <= 4) return '***';
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

/** Copy of env with sensitive values masked (safe for display and export). */
export function maskSensitive(env: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = isSensitive(key) ? maskValue(value) : value;
  }
  return result;
}

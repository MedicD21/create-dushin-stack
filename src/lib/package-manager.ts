import type { PackageManager } from '../types.js';

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? '';

  if (userAgent.startsWith('pnpm')) return 'pnpm';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('bun')) return 'bun';
  return 'npm';
}

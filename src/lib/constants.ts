import type { PackageManager } from '../types.js';

export const DEFAULT_IMPORT_ALIAS = '@/*';
export const STARTER_COMPONENT_NAME = 'Button';

export const PACKAGE_MANAGER_CREATE_COMMAND: Record<PackageManager, string[]> = {
  pnpm: ['pnpm', 'create'],
  npm: ['npm', 'create'],
  yarn: ['yarn', 'create'],
  bun: ['bun', 'create'],
};

export const PACKAGE_MANAGER_INSTALL_COMMAND: Record<PackageManager, string[]> = {
  pnpm: ['pnpm', 'add'],
  npm: ['npm', 'install'],
  yarn: ['yarn', 'add'],
  bun: ['bun', 'add'],
};

export const PACKAGE_MANAGER_DEV_INSTALL_COMMAND: Record<PackageManager, string[]> = {
  pnpm: ['pnpm', 'add', '-D'],
  npm: ['npm', 'install', '-D'],
  yarn: ['yarn', 'add', '-D'],
  bun: ['bun', 'add', '-d'],
};

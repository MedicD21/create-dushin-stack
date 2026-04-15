import { confirm, input, select } from '@inquirer/prompts';
import { DEFAULT_IMPORT_ALIAS } from './lib/constants.js';
import { detectPackageManager } from './lib/package-manager.js';
import { validateProjectName } from './lib/validate.js';
import type { Answers, Framework, PackageManager } from './types.js';

export interface PromptDefaults {
  projectName?: string;
  framework?: Framework;
  packageManager?: PackageManager;
  tailwind?: boolean;
  typescript?: boolean;
  eslint?: boolean;
  useSrcDir?: boolean;
  useAppRouter?: boolean;
  importAlias?: string;
  installDependencies?: boolean;
  initializeGit?: boolean;
  addStarterFolders?: boolean;
  installSharedUi?: boolean;
  sharedUiPackageName?: string;
  sharedUiPackageSource?: string;
}

export async function collectAnswers(defaults: PromptDefaults): Promise<Answers> {
  const detectedPm = defaults.packageManager ?? detectPackageManager();

  const projectName = defaults.projectName ?? await input({
    message: 'Project name',
    default: 'my-app',
    validate: (value) => validateProjectName(value),
  });

  const framework = defaults.framework ?? await select<Framework>({
    message: 'Which stack do you want to scaffold?',
    choices: [
      { name: 'Next.js', value: 'next', description: 'Full-stack React framework with App Router support' },
      { name: 'React + Vite', value: 'vite', description: 'Lean React app powered by Vite' },
    ],
  });

  const packageManager = defaults.packageManager ?? await select<PackageManager>({
    message: 'Which package manager should the generated project use?',
    default: detectedPm,
    choices: [
      { name: 'pnpm', value: 'pnpm' },
      { name: 'npm', value: 'npm' },
      { name: 'yarn', value: 'yarn' },
      { name: 'bun', value: 'bun' },
    ],
  });

  const typescript = defaults.typescript ?? await confirm({
    message: 'Use TypeScript?',
    default: true,
  });

  const tailwind = defaults.tailwind ?? await confirm({
    message: 'Include Tailwind CSS?',
    default: true,
  });

  const eslint = defaults.eslint ?? await confirm({
    message: 'Include ESLint?',
    default: true,
  });

  const useSrcDir = defaults.useSrcDir ?? await confirm({
    message: 'Use a src/ directory?',
    default: true,
  });

  const useAppRouter = framework === 'next'
    ? (defaults.useAppRouter ?? await confirm({
        message: 'Use the Next.js App Router?',
        default: true,
      }))
    : false;

  const importAlias = defaults.importAlias ?? await input({
    message: 'Import alias',
    default: DEFAULT_IMPORT_ALIAS,
    validate: (value) => (value.trim() ? true : 'Import alias cannot be empty.'),
  });

  const installSharedUi = defaults.installSharedUi ?? await confirm({
    message: 'Wire in a shared UI package now?',
    default: false,
  });

  const sharedUiPackageName = installSharedUi
    ? (defaults.sharedUiPackageName ?? await input({
        message: 'Shared UI package name',
        default: '@morgan/ui',
      }))
    : '';

  const sharedUiPackageSource = installSharedUi
    ? (defaults.sharedUiPackageSource ?? await input({
        message: 'Install source (package name, local path, git URL, or leave same as package name)',
        default: sharedUiPackageName,
      }))
    : '';

  const addStarterFolders = defaults.addStarterFolders ?? await confirm({
    message: 'Add opinionated starter folders and example files?',
    default: true,
  });

  const initializeGit = defaults.initializeGit ?? await confirm({
    message: 'Initialize git?',
    default: true,
  });

  const installDependencies = defaults.installDependencies ?? await confirm({
    message: 'Install dependencies now?',
    default: true,
  });

  return {
    projectName,
    framework,
    packageManager,
    typescript,
    tailwind,
    eslint,
    useSrcDir,
    useAppRouter,
    importAlias,
    installSharedUi,
    sharedUiPackageName,
    sharedUiPackageSource,
    addStarterFolders,
    initializeGit,
    installDependencies,
  };
}

#!/usr/bin/env node
import { Command } from 'commander';
import { collectAnswers } from './prompts.js';
import { logger } from './lib/logger.js';
import { scaffoldProject } from './scaffold.js';
import type { Framework, PackageManager } from './types.js';

const program = new Command();

program
  .name('create-morgan-stack')
  .description('Scaffold a polished Next.js or React/Vite project with your preferred defaults.')
  .argument('[project-name]', 'Name of the project to create')
  .option('-f, --framework <framework>', 'next or vite')
  .option('-p, --package-manager <packageManager>', 'pnpm, npm, yarn, or bun')
  .option('--tailwind', 'Include Tailwind CSS')
  .option('--no-tailwind', 'Skip Tailwind CSS')
  .option('--typescript', 'Use TypeScript')
  .option('--no-typescript', 'Use JavaScript instead')
  .option('--eslint', 'Include ESLint')
  .option('--no-eslint', 'Skip ESLint')
  .option('--src-dir', 'Use a src/ directory')
  .option('--no-src-dir', 'Do not use a src/ directory')
  .option('--app-router', 'Use Next.js App Router')
  .option('--no-app-router', 'Do not use Next.js App Router')
  .option('--import-alias <alias>', 'Import alias to configure')
  .option('--shared-ui', 'Install a shared UI package')
  .option('--shared-ui-package-name <name>', 'The package name used in imports')
  .option('--shared-ui-package-source <source>', 'The install source for the shared UI package')
  .option('--starter-folders', 'Add starter folders and example files')
  .option('--no-starter-folders', 'Skip starter folders and example files')
  .option('--git', 'Initialize git')
  .option('--no-git', 'Skip git initialization')
  .option('--install', 'Install dependencies')
  .option('--no-install', 'Skip dependency installation')
  .option('--dry-run', 'Print the commands without executing them')
  .action(async (projectName: string | undefined, options) => {
    try {
      logger.banner();

      const answers = await collectAnswers({
        projectName,
        framework: options.framework as Framework | undefined,
        packageManager: options.packageManager as PackageManager | undefined,
        tailwind: optionValue(options, 'tailwind'),
        typescript: optionValue(options, 'typescript'),
        eslint: optionValue(options, 'eslint'),
        useSrcDir: optionValue(options, 'srcDir'),
        useAppRouter: optionValue(options, 'appRouter'),
        importAlias: options.importAlias,
        installSharedUi: optionValue(options, 'sharedUi'),
        sharedUiPackageName: options.sharedUiPackageName,
        sharedUiPackageSource: options.sharedUiPackageSource,
        addStarterFolders: optionValue(options, 'starterFolders'),
        initializeGit: optionValue(options, 'git'),
        installDependencies: optionValue(options, 'install'),
      });

      await scaffoldProject(answers, {
        cwd: process.cwd(),
        dryRun: Boolean(options.dryRun),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        logger.warn('Setup cancelled.');
        process.exit(1);
      }

      logger.error(error instanceof Error ? error.message : 'Unexpected error');
      process.exit(1);
    }
  });

program.parseAsync(process.argv);

function optionValue<T extends object, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  const value = obj[key];
  return typeof value === 'undefined' ? undefined : value;
}

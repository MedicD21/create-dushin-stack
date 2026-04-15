import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { PACKAGE_MANAGER_CREATE_COMMAND, PACKAGE_MANAGER_DEV_INSTALL_COMMAND, PACKAGE_MANAGER_INSTALL_COMMAND } from './lib/constants.js';
import { ensureDir, fileExists, replaceInFile, writeFileSafe } from './lib/fs-utils.js';
import { logger } from './lib/logger.js';
import { renderAgentsMd } from './templates/next/agents.js';
import { renderGitIgnore } from './templates/shared/gitignore.js';
import { renderReadme } from './templates/shared/readme.js';
import { getStarterFiles } from './templates/shared/starter-files.js';
import { renderAppJsx, renderAppTsx, renderIndexCss, renderTsConfigPaths, renderViteConfigJs, renderViteConfigTs } from './templates/vite/files.js';
import type { Answers } from './types.js';

export interface ScaffoldOptions {
  cwd: string;
  dryRun?: boolean;
}

export async function scaffoldProject(answers: Answers, options: ScaffoldOptions) {
  const targetDir = path.resolve(options.cwd, answers.projectName);
  const dryRun = options.dryRun ?? false;

  if (dryRun) {
    logger.warn(`Dry run enabled. Commands will be printed but not executed.`);
  }

  await ensureDir(options.cwd);

  if (answers.framework === 'next') {
    await createNextApp(answers, options.cwd, dryRun);
  } else {
    await createViteApp(answers, options.cwd, dryRun);
  }

  if (!dryRun) {
    await customizeProject(answers, targetDir);
  }

  logger.success(`Finished scaffolding ${answers.projectName}`);
  logger.info(`Next steps:`);
  console.log(`  cd ${answers.projectName}`);
  console.log(`  ${answers.packageManager === 'npm' ? 'npm run dev' : `${answers.packageManager} dev`}`);
}

async function createNextApp(answers: Answers, cwd: string, dryRun: boolean) {
  const base = PACKAGE_MANAGER_CREATE_COMMAND[answers.packageManager];
  const args = [
    ...base.slice(1),
    'next-app@latest',
    answers.projectName,
    answers.typescript ? '--ts' : '--js',
    answers.tailwind ? '--tailwind' : '--no-tailwind',
    answers.eslint ? '--eslint' : '--no-linter',
    answers.useAppRouter ? '--app' : '--no-app',
    answers.useSrcDir ? '--src-dir' : '--no-src-dir',
    '--import-alias', answers.importAlias,
    '--yes',
    '--disable-git',
  ];

  args.push(packageManagerFlag(answers.packageManager));

  if (!answers.installDependencies) {
    args.push('--skip-install');
  }

  await runCommand(base[0], args, { cwd, dryRun, label: 'Create Next.js app' });
}

async function createViteApp(answers: Answers, cwd: string, dryRun: boolean) {
  const base = PACKAGE_MANAGER_CREATE_COMMAND[answers.packageManager];
  const template = answers.typescript ? 'react-ts' : 'react';
  const args = [...base.slice(1), 'vite@latest', answers.projectName, '--', '--template', template];

  await runCommand(base[0], args, { cwd, dryRun, label: 'Create Vite app' });

  const targetDir = path.resolve(cwd, answers.projectName);

  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, dryRun);
  }

  if (answers.tailwind) {
    const devInstall = PACKAGE_MANAGER_DEV_INSTALL_COMMAND[answers.packageManager];
    await runCommand(devInstall[0], [...devInstall.slice(1), 'tailwindcss', '@tailwindcss/vite'], {
      cwd: targetDir,
      dryRun,
      label: 'Install Tailwind CSS for Vite',
    });
  }

  if (answers.eslint && answers.packageManager) {
    // Vite templates already include ESLint for React templates. Nothing extra required.
  }
}

async function customizeProject(answers: Answers, targetDir: string) {
  logger.step('Applying project polish');

  await writeFileSafe(path.join(targetDir, '.gitignore'), renderGitIgnore());
  await writeFileSafe(path.join(targetDir, 'README.md'), renderReadme(answers));

  if (answers.framework === 'next') {
    await customizeNextProject(answers, targetDir);
  } else {
    await customizeViteProject(answers, targetDir);
  }

  if (answers.addStarterFolders) {
    for (const file of getStarterFiles(answers)) {
      await writeFileSafe(path.join(targetDir, file.path), file.content);
    }
  }

  if (answers.installSharedUi && answers.installDependencies) {
    logger.step(`Installing shared UI package from ${answers.sharedUiPackageSource}`);
    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(install[0], [...install.slice(1), answers.sharedUiPackageSource], {
      cwd: targetDir,
      dryRun: false,
      label: 'Install shared UI package',
    });
  }

  if (answers.initializeGit) {
    await runCommand('git', ['init'], {
      cwd: targetDir,
      dryRun: false,
      label: 'Initialize git repository',
    });
  }
}

async function customizeNextProject(answers: Answers, targetDir: string) {
  const appDir = answers.useSrcDir ? path.join(targetDir, 'src', 'app') : path.join(targetDir, 'app');
  const pagesDir = answers.useSrcDir ? path.join(targetDir, 'src', 'pages') : path.join(targetDir, 'pages');
  const nextPageCandidates = [
    path.join(appDir, 'page.tsx'),
    path.join(appDir, 'page.js'),
    path.join(pagesDir, 'index.tsx'),
    path.join(pagesDir, 'index.jsx'),
    path.join(pagesDir, 'index.js'),
  ];

  const pagePath = (await Promise.all(nextPageCandidates.map(async (candidate) => (await fileExists(candidate)) ? candidate : ''))).find(Boolean);

  if (pagePath) {
    await replaceInFile(pagePath, () => `export default function Home() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Ready to build</p>
        <h1 className="text-4xl font-semibold tracking-tight">${answers.projectName}</h1>
        <p className="text-slate-600">
          Scaffolded with create-morgan-stack. Start by editing ${answers.useSrcDir ? 'src/' : ''}${answers.useAppRouter ? 'app' : 'pages'}.
        </p>
      </div>
    </main>
  );
}
`);
  }

  await writeFileSafe(path.join(targetDir, 'AGENTS.md'), renderAgentsMd());
}

async function customizeViteProject(answers: Answers, targetDir: string) {
  const ts = answers.typescript;
  const viteConfigPath = path.join(targetDir, `vite.config.${ts ? 'ts' : 'js'}`);
  await writeFileSafe(viteConfigPath, ts ? renderViteConfigTs(answers.tailwind, answers.importAlias) : renderViteConfigJs(answers.tailwind, answers.importAlias));

  const srcDir = path.join(targetDir, 'src');
  await writeFileSafe(path.join(srcDir, 'index.css'), renderIndexCss(answers.tailwind));
  await writeFileSafe(path.join(srcDir, `App.${ts ? 'tsx' : 'jsx'}`), ts ? renderAppTsx(answers.tailwind) : renderAppJsx(answers.tailwind));

  const mainPath = path.join(srcDir, `main.${ts ? 'tsx' : 'jsx'}`);
  if (await fileExists(mainPath)) {
    const importPath = './index.css';
    await replaceInFile(mainPath, (input) => {
      const withoutOldCssImport = input.replace(/import ['"].\/[^'\"]+\.css['"];?\n?/g, '');
      return `import '${importPath}';\n${withoutOldCssImport}`;
    });
  }

  await updateViteTsconfig(targetDir, answers);

  if (answers.installSharedUi) {
    await addViteAliasNote(targetDir, answers.sharedUiPackageName);
  }
}

async function updateViteTsconfig(targetDir: string, answers: Answers) {
  if (!answers.typescript) return;

  const tsconfigPath = path.join(targetDir, 'tsconfig.app.json');
  if (!(await fileExists(tsconfigPath))) return;

  const parsed = JSON.parse(await fs.readFile(tsconfigPath, 'utf8'));
  const aliases = renderTsConfigPaths(answers.importAlias);
  parsed.compilerOptions = {
    ...(parsed.compilerOptions ?? {}),
    ...(aliases.compilerOptions ?? {}),
    paths: {
      ...(parsed.compilerOptions?.paths ?? {}),
      ...(aliases.compilerOptions?.paths ?? {}),
    },
  };

  await fs.writeFile(tsconfigPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
}

async function addViteAliasNote(targetDir: string, packageName: string) {
  const readmePath = path.join(targetDir, 'README.md');
  const current = await fs.readFile(readmePath, 'utf8');
  await fs.writeFile(readmePath, `${current}\nShared UI package configured: \`${packageName}\`\n`, 'utf8');
}

function packageManagerFlag(packageManager: Answers['packageManager']) {
  switch (packageManager) {
    case 'pnpm': return '--use-pnpm';
    case 'npm': return '--use-npm';
    case 'yarn': return '--use-yarn';
    case 'bun': return '--use-bun';
  }
}

async function runProjectInstall(answers: Answers, targetDir: string, dryRun: boolean) {
  const cmd = answers.packageManager;
  const args = ['install'];
  if (answers.packageManager === 'yarn') {
    args.length = 0;
    args.push('install');
  }
  await runCommand(cmd, args, {
    cwd: targetDir,
    dryRun,
    label: 'Install project dependencies',
  });
}

async function runCommand(command: string, args: string[], opts: { cwd: string; dryRun: boolean; label: string }) {
  logger.step(opts.label);
  const pretty = [command, ...args].join(' ');
  console.log(`  ${pretty}`);

  if (opts.dryRun) return;

  await execa(command, args, {
    cwd: opts.cwd,
    stdio: 'inherit',
  });
}

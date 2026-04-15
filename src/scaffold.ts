import { promises as fs } from "node:fs";
import path from "node:path";
import { execa } from "execa";
import {
  PACKAGE_MANAGER_CREATE_COMMAND,
  PACKAGE_MANAGER_DEV_INSTALL_COMMAND,
  PACKAGE_MANAGER_INSTALL_COMMAND,
} from "./lib/constants.js";
import {
  ensureDir,
  fileExists,
  replaceInFile,
  writeFileSafe,
} from "./lib/fs-utils.js";
import { logger } from "./lib/logger.js";
import { renderAgentsMd } from "./templates/next/agents.js";
import { renderGitIgnore } from "./templates/shared/gitignore.js";
import { renderReadme } from "./templates/shared/readme.js";
import { getStarterFiles } from "./templates/shared/starter-files.js";
import {
  renderAppJsx,
  renderAppTsx,
  renderIndexCss,
  renderTsConfigPaths,
  renderViteConfigJs,
  renderViteConfigTs,
} from "./templates/vite/files.js";
import type { Answers } from "./types.js";

export interface ScaffoldOptions {
  cwd: string;
  dryRun?: boolean;
}

export async function scaffoldProject(
  answers: Answers,
  options: ScaffoldOptions,
) {
  const targetDir = path.resolve(options.cwd, answers.projectName);
  const dryRun = options.dryRun ?? false;

  if (dryRun) {
    logger.warn("Dry run enabled. Commands will be printed but not executed.");
  }

  await ensureDir(options.cwd);
  await assertTargetDirectoryAvailable(targetDir);

  if (answers.framework === "next") {
    await createNextApp(answers, options.cwd, dryRun);
  } else {
    await createViteApp(answers, options.cwd, dryRun);
  }

  if (!dryRun) {
    await customizeProject(answers, targetDir);
  }

  logger.success(`Finished scaffolding ${answers.projectName}`);
  logger.info("Next steps:");
  console.log(`  cd ${answers.projectName}`);
  console.log(
    `  ${answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`}`,
  );
}

async function assertTargetDirectoryAvailable(targetDir: string) {
  if (!(await fileExists(targetDir))) {
    return;
  }

  const entries = await fs.readdir(targetDir);
  if (entries.length > 0) {
    throw new Error(
      `Target directory already exists and is not empty: ${targetDir}`,
    );
  }
}

async function createNextApp(answers: Answers, cwd: string, dryRun: boolean) {
  const base = PACKAGE_MANAGER_CREATE_COMMAND[answers.packageManager];
  const args = [
    ...base.slice(1),
    "next-app@latest",
    answers.projectName,
    answers.typescript ? "--ts" : "--js",
    answers.tailwind ? "--tailwind" : "--no-tailwind",
    answers.eslint ? "--eslint" : "--no-linter",
    answers.useAppRouter ? "--app" : "--no-app",
    answers.useSrcDir ? "--src-dir" : "--no-src-dir",
    "--import-alias",
    answers.importAlias,
    "--yes",
    "--disable-git",
    packageManagerFlag(answers.packageManager),
  ];

  if (!answers.installDependencies) {
    args.push("--skip-install");
  }

  await runCommand(base[0], args, {
    cwd,
    dryRun,
    label: "Create Next.js app",
  });
}

async function createViteApp(answers: Answers, cwd: string, dryRun: boolean) {
  const base = PACKAGE_MANAGER_CREATE_COMMAND[answers.packageManager];
  const template = answers.typescript ? "react-ts" : "react";
  const templateArgs = viteTemplateArgs(answers.packageManager, template);
  const args = [
    ...base.slice(1),
    "vite@latest",
    answers.projectName,
    ...templateArgs,
  ];

  await runCommand(base[0], args, {
    cwd,
    dryRun,
    label: "Create Vite app",
  });

  const targetDir = path.resolve(cwd, answers.projectName);

  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, dryRun);
  }
}

function viteTemplateArgs(
  packageManager: Answers["packageManager"],
  template: string,
) {
  if (packageManager === "npm") {
    return ["--", "--template", template];
  }

  return ["--template", template];
}

async function customizeProject(answers: Answers, targetDir: string) {
  logger.step("Applying project polish");

  await writeFileSafe(path.join(targetDir, ".gitignore"), renderGitIgnore());
  await writeFileSafe(path.join(targetDir, "README.md"), renderReadme(answers));

  if (answers.framework === "next") {
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
    logger.step(
      `Installing shared UI package from ${answers.sharedUiPackageSource}`,
    );

    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      install[0],
      [...install.slice(1), answers.sharedUiPackageSource],
      {
        cwd: targetDir,
        dryRun: false,
        label: "Install shared UI package",
      },
    );
  }

  if (answers.initializeGit) {
    await runCommand("git", ["init"], {
      cwd: targetDir,
      dryRun: false,
      label: "Initialize git repository",
    });
  }
}

async function customizeNextProject(answers: Answers, targetDir: string) {
  const appDir = answers.useSrcDir
    ? path.join(targetDir, "src", "app")
    : path.join(targetDir, "app");
  const pagesDir = answers.useSrcDir
    ? path.join(targetDir, "src", "pages")
    : path.join(targetDir, "pages");

  const nextPageCandidates = [
    path.join(appDir, "page.tsx"),
    path.join(appDir, "page.js"),
    path.join(pagesDir, "index.tsx"),
    path.join(pagesDir, "index.jsx"),
    path.join(pagesDir, "index.js"),
  ];

  const pagePath = (
    await Promise.all(
      nextPageCandidates.map(async (candidate) =>
        (await fileExists(candidate)) ? candidate : "",
      ),
    )
  ).find(Boolean);

  if (pagePath) {
    await replaceInFile(
      pagePath,
      () => `export default function Home() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Ready to build</p>
        <h1 className="text-4xl font-semibold tracking-tight">${answers.projectName}</h1>
        <p className="text-slate-600">
          Scaffolded with create-dushin-stack. Start by editing ${answers.useSrcDir ? "src/" : ""}${answers.useAppRouter ? "app" : "pages"}.
        </p>
      </div>
    </main>
  );
}
`,
    );
  }

  await writeFileSafe(path.join(targetDir, "AGENTS.md"), renderAgentsMd());
}

async function customizeViteProject(answers: Answers, targetDir: string) {
  if (answers.tailwind) {
    await ensureViteTailwindDevDependencies(targetDir);

    if (answers.installDependencies) {
      await installViteTailwind(answers, targetDir);
    }
  }

  await writeViteConfig(targetDir, answers);
  await writeViteAppFiles(targetDir, answers);
  await updateViteEntryFile(targetDir, answers);
  await updateViteProjectConfig(targetDir, answers);

  if (answers.installSharedUi) {
    await addViteAliasNote(targetDir, answers.sharedUiPackageName);
  }
}

async function installViteTailwind(answers: Answers, targetDir: string) {
  const devInstall =
    PACKAGE_MANAGER_DEV_INSTALL_COMMAND[answers.packageManager];

  await runCommand(
    devInstall[0],
    [...devInstall.slice(1), "tailwindcss", "@tailwindcss/vite"],
    {
      cwd: targetDir,
      dryRun: false,
      label: "Install Tailwind CSS for Vite",
    },
  );
}

async function ensureViteTailwindDevDependencies(targetDir: string) {
  const packageJsonPath = path.join(targetDir, "package.json");
  if (!(await fileExists(packageJsonPath))) return;

  const parsed = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as {
    devDependencies?: Record<string, string>;
  };

  const existingDevDependencies = parsed.devDependencies ?? {};
  parsed.devDependencies = {
    ...existingDevDependencies,
    ...(existingDevDependencies.tailwindcss
      ? {}
      : { tailwindcss: "^4.1.0" }),
    ...(existingDevDependencies["@tailwindcss/vite"]
      ? {}
      : { "@tailwindcss/vite": "^4.1.0" }),
  };

  await fs.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);
}

async function writeViteConfig(targetDir: string, answers: Answers) {
  const viteConfigPath = path.join(
    targetDir,
    `vite.config.${answers.typescript ? "ts" : "js"}`,
  );

  await writeFileSafe(
    viteConfigPath,
    answers.typescript
      ? renderViteConfigTs(answers.tailwind, answers.importAlias)
      : renderViteConfigJs(answers.tailwind, answers.importAlias),
  );
}

async function writeViteAppFiles(targetDir: string, answers: Answers) {
  const srcDir = path.join(targetDir, "src");
  const isTs = answers.typescript;

  await ensureDir(srcDir);

  await writeFileSafe(
    path.join(srcDir, "index.css"),
    renderIndexCss(answers.tailwind),
  );

  await writeFileSafe(
    path.join(srcDir, `App.${isTs ? "tsx" : "jsx"}`),
    isTs ? renderAppTsx(answers.tailwind) : renderAppJsx(answers.tailwind),
  );
}

async function updateViteEntryFile(targetDir: string, answers: Answers) {
  const srcDir = path.join(targetDir, "src");
  const mainPath = path.join(
    srcDir,
    `main.${answers.typescript ? "tsx" : "jsx"}`,
  );

  if (!(await fileExists(mainPath))) return;

  await replaceInFile(mainPath, (input) => {
    const withoutOldCssImport = input.replace(
      /import ['"].\/[^'"]+\.css['"];?\n?/g,
      "",
    );

    return `import "./index.css";\n${withoutOldCssImport}`;
  });
}

async function updateViteProjectConfig(targetDir: string, answers: Answers) {
  await updateViteTsconfig(targetDir, answers);

  if (!answers.typescript) {
    await updateJsConfig(targetDir, answers);
  }
}

async function updateViteTsconfig(targetDir: string, answers: Answers) {
  if (!answers.typescript) return;

  const tsconfigAppPath = path.join(targetDir, "tsconfig.app.json");
  const tsconfigPath = path.join(targetDir, "tsconfig.json");
  const aliases = renderTsConfigPaths(answers.importAlias);

  if (await fileExists(tsconfigAppPath)) {
    await mergeCompilerOptionsIntoJson(tsconfigAppPath, aliases);
    return;
  }

  if (await fileExists(tsconfigPath)) {
    await mergeCompilerOptionsIntoJson(tsconfigPath, aliases);
  }
}

async function updateJsConfig(targetDir: string, answers: Answers) {
  const jsconfigPath = path.join(targetDir, "jsconfig.json");
  const alias = normalizeAlias(answers.importAlias);

  const config = {
    compilerOptions: {
      baseUrl: ".",
      paths: {
        [alias]: ["./src/*"],
      },
    },
  };

  await fs.writeFile(
    jsconfigPath,
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}

async function mergeCompilerOptionsIntoJson(
  filePath: string,
  incoming: Record<string, unknown>,
) {
  const parsed = parseJsonLike(await fs.readFile(filePath, "utf8"));
  const incomingCompilerOptions =
    (incoming.compilerOptions as Record<string, unknown> | undefined) ?? {};
  const existingCompilerOptions =
    (parsed.compilerOptions as Record<string, unknown> | undefined) ?? {};
  const incomingPaths =
    (incomingCompilerOptions.paths as Record<string, string[]> | undefined) ??
    {};
  const existingPaths =
    (existingCompilerOptions.paths as Record<string, string[]> | undefined) ??
    {};

  parsed.compilerOptions = {
    ...existingCompilerOptions,
    ...incomingCompilerOptions,
    paths: {
      ...existingPaths,
      ...incomingPaths,
    },
  };

  await fs.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
}

function normalizeAlias(importAlias: string) {
  return importAlias.endsWith("/*") ? importAlias : `${importAlias}/*`;
}

async function addViteAliasNote(targetDir: string, packageName: string) {
  const readmePath = path.join(targetDir, "README.md");
  const current = await fs.readFile(readmePath, "utf8");

  await fs.writeFile(
    readmePath,
    `${current}\nShared UI package configured: \`${packageName}\`\n`,
    "utf8",
  );
}

function parseJsonLike(input: string) {
  const withoutBlockComments = input.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(
    /(^|\s)\/\/.*$/gm,
    "",
  );
  const withoutTrailingCommas = withoutLineComments.replace(
    /,\s*([}\]])/g,
    "$1",
  );
  return JSON.parse(withoutTrailingCommas) as Record<string, unknown>;
}

function packageManagerFlag(packageManager: Answers["packageManager"]) {
  switch (packageManager) {
    case "pnpm":
      return "--use-pnpm";
    case "npm":
      return "--use-npm";
    case "yarn":
      return "--use-yarn";
    case "bun":
      return "--use-bun";
  }
}

async function runProjectInstall(
  answers: Answers,
  targetDir: string,
  dryRun: boolean,
) {
  const cmd = answers.packageManager;
  const args = ["install"];

  await runCommand(cmd, args, {
    cwd: targetDir,
    dryRun,
    label: "Install project dependencies",
  });
}

async function runCommand(
  command: string,
  args: string[],
  opts: { cwd: string; dryRun: boolean; label: string },
) {
  logger.step(opts.label);
  console.log(`  ${[command, ...args].join(" ")}`);

  if (opts.dryRun) return;

  await execa(command, args, {
    cwd: opts.cwd,
    stdio: "inherit",
  });
}

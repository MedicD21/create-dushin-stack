import { promises as fs } from "node:fs";
import path from "node:path";
import { execa } from "execa";
import {
  PACKAGE_MANAGER_CREATE_COMMAND,
  PACKAGE_MANAGER_DEV_INSTALL_COMMAND,
  PACKAGE_MANAGER_INSTALL_COMMAND,
} from "./lib/constants.js";
import { readPluginTemplateFile } from "./lib/plugin-template.js";
import {
  ensureDir,
  fileExists,
  replaceInFile,
  writeFileSafe,
} from "./lib/fs-utils.js";
import { logger } from "./lib/logger.js";
import { renderAgentsMd } from "./templates/next/agents.js";
import {
  renderAppSwift,
  renderContentView,
  renderInfoPlist,
  renderProjectYml,
} from "./templates/ios/swiftui.js";
import {
  renderMonorepoRootPackageJson,
  renderMonorepoUiEntry,
  renderMonorepoUiPackageJson,
  renderMonorepoUiTsconfig,
  renderMonorepoWebApp,
  renderMonorepoWebCss,
  renderMonorepoWebIndexHtml,
  renderMonorepoWebMain,
  renderMonorepoWebPackageJson,
  renderMonorepoWebTsconfig,
  renderMonorepoWebViteConfig,
  renderPnpmWorkspaceYaml,
} from "./templates/monorepo/files.js";
import {
  renderNodeApiEntry,
  renderNodeApiPackageJson,
  renderNodeApiTsconfig,
} from "./templates/node/hono.js";
import { renderGitIgnore } from "./templates/shared/gitignore.js";
import { renderReadme } from "./templates/shared/readme.js";
import { getStarterFiles } from "./templates/shared/starter-files.js";
import {
  renderRouterQueryAppJsx,
  renderRouterQueryAppTsx,
  renderRouterQueryMainJsx,
  renderRouterQueryMainTsx,
} from "./templates/vite/router-query.js";
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

export interface HealthCheckResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface ScaffoldResult {
  projectName: string;
  template: Answers["template"];
  framework: Answers["framework"];
  targetDir: string;
  dryRun: boolean;
  healthChecks: HealthCheckResult[];
}

export async function scaffoldProject(
  answers: Answers,
  options: ScaffoldOptions,
): Promise<ScaffoldResult> {
  const targetDir = path.resolve(options.cwd, answers.projectName);
  const dryRun = options.dryRun ?? false;

  if (dryRun) {
    logger.warn("Dry run enabled. Commands will be printed but not executed.");
  }

  await ensureDir(options.cwd);
  await assertTargetDirectoryAvailable(targetDir);

  if (answers.template === "next-app") {
    await createNextApp(answers, options.cwd, dryRun);
  } else if (
    answers.template === "vite-react" ||
    answers.template === "vite-router-query"
  ) {
    await createViteApp(answers, options.cwd, dryRun);
  } else if (answers.template === "node-api-hono") {
    if (!dryRun) {
      await scaffoldNodeApiTemplate(answers, targetDir);
    }
  } else if (answers.template === "monorepo-web-ui") {
    if (!dryRun) {
      await scaffoldMonorepoTemplate(answers, targetDir);
    }
  } else if (answers.template === "plugin-file") {
    if (!dryRun) {
      await scaffoldPluginTemplate(answers, targetDir);
    }
  } else if (answers.template === "ios-swiftui") {
    if (!dryRun) {
      await scaffoldIosSwiftUiTemplate(answers, targetDir);
    }
  } else if (answers.template === "react-capacitor") {
    await createViteApp(answers, options.cwd, dryRun);
  }

  if (!dryRun) {
    await customizeProject(answers, targetDir);
  }

  const healthChecks =
    !dryRun && answers.runHealthChecks
      ? await runHealthChecks(answers, targetDir)
      : [];

  logger.success(`Finished scaffolding ${answers.projectName}`);
  logger.info("Next steps:");
  console.log(`  cd ${answers.projectName}`);

  if (answers.template === "ios-swiftui") {
    console.log("  brew install xcodegen");
    console.log("  xcodegen generate");
    console.log(`  open ${answers.projectName}.xcodeproj`);
  } else if (answers.template === "react-capacitor") {
    const devCmd =
      answers.packageManager === "npm"
        ? "npm run dev"
        : `${answers.packageManager} dev`;
    console.log(`  ${devCmd}`);
    console.log(`  ${answers.packageManager} cap:sync`);
    console.log(`  ${answers.packageManager} cap:open:ios`);
  } else {
    console.log(
      `  ${answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`}`,
    );
  }

  return {
    projectName: answers.projectName,
    template: answers.template,
    framework: answers.framework,
    targetDir,
    dryRun,
    healthChecks,
  };
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

  logger.step("Create Vite app");
  console.log(`  ${[base[0], ...args].join(" ")}`);

  if (!dryRun) {
    // Run with piped stdin so create-vite treats this as non-interactive
    // and skips the "Install now?" prompt (create-vite v6+).
    await execa(base[0], args, {
      cwd,
      stdio: ["pipe", "inherit", "inherit"],
    });
  }

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

async function scaffoldNodeApiTemplate(answers: Answers, targetDir: string) {
  await ensureDir(path.join(targetDir, "src"));
  await writeJson(
    path.join(targetDir, "package.json"),
    renderNodeApiPackageJson(answers.projectName),
  );
  await writeFileSafe(
    path.join(targetDir, "tsconfig.json"),
    renderNodeApiTsconfig(),
  );
  await writeFileSafe(
    path.join(targetDir, "src", "index.ts"),
    renderNodeApiEntry(),
  );
  await writeFileSafe(path.join(targetDir, ".gitignore"), renderGitIgnore());

  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, false);
  }
}

async function scaffoldMonorepoTemplate(answers: Answers, targetDir: string) {
  const appsWebDir = path.join(targetDir, "apps", "web");
  const packagesUiDir = path.join(targetDir, "packages", "ui");

  await ensureDir(path.join(appsWebDir, "src"));
  await ensureDir(path.join(packagesUiDir, "src"));

  await writeJson(
    path.join(targetDir, "package.json"),
    renderMonorepoRootPackageJson(answers.projectName, answers.packageManager),
  );
  await writeFileSafe(
    path.join(targetDir, "pnpm-workspace.yaml"),
    renderPnpmWorkspaceYaml(),
  );
  await writeFileSafe(path.join(targetDir, ".gitignore"), renderGitIgnore());

  await writeJson(
    path.join(appsWebDir, "package.json"),
    renderMonorepoWebPackageJson(answers.projectName, answers.tailwind),
  );
  await writeFileSafe(
    path.join(appsWebDir, "tsconfig.json"),
    renderMonorepoWebTsconfig(),
  );
  await writeFileSafe(
    path.join(appsWebDir, "vite.config.ts"),
    renderMonorepoWebViteConfig(answers.tailwind),
  );
  await writeFileSafe(
    path.join(appsWebDir, "index.html"),
    renderMonorepoWebIndexHtml(),
  );
  await writeFileSafe(
    path.join(appsWebDir, "src", "main.tsx"),
    renderMonorepoWebMain(),
  );
  await writeFileSafe(
    path.join(appsWebDir, "src", "App.tsx"),
    renderMonorepoWebApp(answers.projectName),
  );
  await writeFileSafe(
    path.join(appsWebDir, "src", "index.css"),
    renderMonorepoWebCss(answers.tailwind),
  );

  await writeJson(
    path.join(packagesUiDir, "package.json"),
    renderMonorepoUiPackageJson(answers.projectName),
  );
  await writeFileSafe(
    path.join(packagesUiDir, "tsconfig.json"),
    renderMonorepoUiTsconfig(),
  );
  await writeFileSafe(
    path.join(packagesUiDir, "src", "index.tsx"),
    renderMonorepoUiEntry(),
  );

  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, false);
  }
}

async function scaffoldPluginTemplate(answers: Answers, targetDir: string) {
  if (!answers.templateFile) {
    throw new Error(
      "--template-file is required when using plugin-file template.",
    );
  }

  const templateFile = await readPluginTemplateFile(answers.templateFile);

  await ensureDir(targetDir);

  for (const [relativePath, content] of Object.entries(templateFile.files)) {
    await writeFileSafe(path.join(targetDir, relativePath), content);
  }

  if (templateFile.packageJson) {
    await writeJson(
      path.join(targetDir, "package.json"),
      templateFile.packageJson,
    );
  }

  if (answers.installDependencies && templateFile.packageJson) {
    await runProjectInstall(answers, targetDir, false);
  }
}

async function customizeProject(answers: Answers, targetDir: string) {
  logger.step("Applying project polish");

  if (
    answers.template !== "plugin-file" &&
    answers.template !== "ios-swiftui"
  ) {
    await writeFileSafe(path.join(targetDir, ".gitignore"), renderGitIgnore());
    await writeFileSafe(
      path.join(targetDir, "README.md"),
      renderReadme(answers),
    );
  }

  if (answers.template === "ios-swiftui") {
    await writeFileSafe(
      path.join(targetDir, "README.md"),
      renderReadme(answers),
    );
  }

  if (answers.template === "next-app") {
    await customizeNextProject(answers, targetDir);
  }

  if (
    answers.template === "vite-react" ||
    answers.template === "vite-router-query" ||
    answers.template === "react-capacitor"
  ) {
    await customizeViteProject(answers, targetDir);
  }

  if (answers.template === "react-capacitor") {
    await addCapacitorToProject(answers, targetDir);
  }

  if (
    answers.addStarterFolders &&
    (answers.template === "next-app" ||
      answers.template === "vite-react" ||
      answers.template === "vite-router-query" ||
      answers.template === "react-capacitor")
  ) {
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

  if (answers.template === "vite-router-query") {
    await ensureViteRouterQueryDependencies(answers, targetDir);
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
    ...(existingDevDependencies.tailwindcss ? {} : { tailwindcss: "^4.1.0" }),
    ...(existingDevDependencies["@tailwindcss/vite"]
      ? {}
      : { "@tailwindcss/vite": "^4.1.0" }),
  };

  await fs.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);
}

async function ensureViteRouterQueryDependencies(
  answers: Answers,
  targetDir: string,
) {
  const packageJsonPath = path.join(targetDir, "package.json");
  if (!(await fileExists(packageJsonPath))) return;

  const parsed = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
  };

  const dependencies = parsed.dependencies ?? {};
  parsed.dependencies = {
    ...dependencies,
    ...(dependencies["react-router-dom"]
      ? {}
      : { "react-router-dom": "^7.9.4" }),
    ...(dependencies["@tanstack/react-query"]
      ? {}
      : { "@tanstack/react-query": "^5.90.3" }),
  };

  await fs.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);

  if (answers.installDependencies) {
    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      install[0],
      [...install.slice(1), "react-router-dom", "@tanstack/react-query"],
      {
        cwd: targetDir,
        dryRun: false,
        label: "Install router + query dependencies",
      },
    );
  }
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

  if (answers.template === "vite-router-query") {
    await writeFileSafe(
      path.join(srcDir, `App.${isTs ? "tsx" : "jsx"}`),
      isTs ? renderRouterQueryAppTsx() : renderRouterQueryAppJsx(),
    );
    return;
  }

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

  if (!(await fileExists(mainPath))) {
    return;
  }

  if (answers.template === "vite-router-query") {
    await writeFileSafe(
      mainPath,
      answers.typescript
        ? renderRouterQueryMainTsx()
        : renderRouterQueryMainJsx(),
    );
    return;
  }

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

async function runHealthChecks(
  answers: Answers,
  targetDir: string,
): Promise<HealthCheckResult[]> {
  if (!answers.installDependencies) {
    logger.warn(
      "Skipping health checks because dependencies were not installed.",
    );
    return [
      {
        name: "health-checks",
        passed: false,
        message: "Dependencies not installed",
      },
    ];
  }

  const packageJsonPath = path.join(targetDir, "package.json");
  if (!(await fileExists(packageJsonPath))) {
    return [];
  }

  const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = pkg.scripts ?? {};
  const checksToRun = ["lint", "typecheck", "build"];
  const results: HealthCheckResult[] = [];

  for (const check of checksToRun) {
    if (!scripts[check]) {
      results.push({
        name: check,
        passed: true,
        message: "Script not defined; skipped.",
      });
      continue;
    }

    try {
      await runScript(answers.packageManager, check, targetDir);
      results.push({ name: check, passed: true });
    } catch (error) {
      results.push({
        name: check,
        passed: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      break;
    }
  }

  for (const result of results) {
    if (result.passed) {
      logger.success(`Health check passed: ${result.name}`);
    } else {
      logger.error(
        `Health check failed: ${result.name}${result.message ? ` (${result.message})` : ""}`,
      );
    }
  }

  return results;
}

async function runScript(
  packageManager: Answers["packageManager"],
  script: string,
  cwd: string,
) {
  const [command, ...args] = packageManagerRunScriptCommand(
    packageManager,
    script,
  );
  await execa(command, args, {
    cwd,
    stdio: "inherit",
  });
}

function packageManagerRunScriptCommand(
  packageManager: Answers["packageManager"],
  script: string,
) {
  if (packageManager === "npm") {
    return ["npm", "run", script];
  }

  return [packageManager, script];
}

async function scaffoldIosSwiftUiTemplate(answers: Answers, targetDir: string) {
  const appDir = path.join(targetDir, answers.projectName, "App");
  const viewsDir = path.join(targetDir, answers.projectName, "Views");

  await ensureDir(appDir);
  await ensureDir(viewsDir);

  await writeFileSafe(
    path.join(targetDir, "project.yml"),
    renderProjectYml(answers.projectName),
  );
  await writeFileSafe(
    path.join(targetDir, answers.projectName, "Info.plist"),
    renderInfoPlist(answers.projectName),
  );
  await writeFileSafe(
    path.join(appDir, `${answers.projectName}App.swift`),
    renderAppSwift(answers.projectName),
  );
  await writeFileSafe(
    path.join(viewsDir, "ContentView.swift"),
    renderContentView(answers.projectName),
  );
}

async function addCapacitorToProject(answers: Answers, targetDir: string) {
  const packageJsonPath = path.join(targetDir, "package.json");
  if (!(await fileExists(packageJsonPath))) return;

  const parsed = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  parsed.scripts = {
    ...(parsed.scripts ?? {}),
    "cap:sync": "cap sync",
    "cap:open:ios": "cap open ios",
    "cap:open:android": "cap open android",
  };

  parsed.dependencies = {
    ...(parsed.dependencies ?? {}),
    "@capacitor/core": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/android": "^7.0.0",
  };

  parsed.devDependencies = {
    ...(parsed.devDependencies ?? {}),
    "@capacitor/cli": "^7.0.0",
  };

  await fs.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);

  const capacitorConfig = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.${answers.projectName.toLowerCase().replace(/[^a-z0-9]/g, "")}',
  appName: '${answers.projectName}',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
`;
  await writeFileSafe(
    path.join(targetDir, "capacitor.config.ts"),
    capacitorConfig,
  );

  if (answers.installDependencies) {
    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      install[0],
      [
        ...install.slice(1),
        "@capacitor/core",
        "@capacitor/ios",
        "@capacitor/android",
      ],
      {
        cwd: targetDir,
        dryRun: false,
        label: "Install Capacitor dependencies",
      },
    );
    const devInstall =
      PACKAGE_MANAGER_DEV_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      devInstall[0],
      [...devInstall.slice(1), "@capacitor/cli"],
      { cwd: targetDir, dryRun: false, label: "Install Capacitor CLI" },
    );
  }
}

async function writeJson(filePath: string, value: unknown) {
  await writeFileSafe(filePath, `${JSON.stringify(value, null, 2)}\n`);
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

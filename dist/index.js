#!/usr/bin/env node

// src/index.ts
import { Command, InvalidArgumentError } from "commander";

// src/prompts.ts
import { confirm, input, select } from "@inquirer/prompts";

// src/lib/constants.ts
var DEFAULT_IMPORT_ALIAS = "@/*";
var PACKAGE_MANAGER_CREATE_COMMAND = {
  pnpm: ["pnpm", "create"],
  npm: ["npm", "create"],
  yarn: ["yarn", "create"],
  bun: ["bun", "create"]
};
var PACKAGE_MANAGER_INSTALL_COMMAND = {
  pnpm: ["pnpm", "add"],
  npm: ["npm", "install"],
  yarn: ["yarn", "add"],
  bun: ["bun", "add"]
};
var PACKAGE_MANAGER_DEV_INSTALL_COMMAND = {
  pnpm: ["pnpm", "add", "-D"],
  npm: ["npm", "install", "-D"],
  yarn: ["yarn", "add", "-D"],
  bun: ["bun", "add", "-d"]
};

// src/lib/package-manager.ts
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? "";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("bun")) return "bun";
  return "npm";
}

// src/lib/validate.ts
import validatePackageName from "validate-npm-package-name";
function validateProjectName(name) {
  if (!name.trim()) {
    return "Project name is required.";
  }
  const validation = validatePackageName(name);
  if (validation.validForNewPackages) {
    return true;
  }
  const errors = [
    ...validation.errors ?? [],
    ...validation.warnings ?? []
  ];
  return errors[0] ?? "Please provide a valid npm package name.";
}

// src/prompts.ts
async function collectAnswers(defaults) {
  const useDefaults = defaults.yes ?? false;
  const detectedPm = defaults.packageManager ?? detectPackageManager();
  const projectName = defaults.projectName ?? (useDefaults ? "my-app" : await input({
    message: "Project name",
    default: "my-app",
    validate: (value) => validateProjectName(value)
  }));
  const projectNameValidation = validateProjectName(projectName);
  if (projectNameValidation !== true) {
    throw new Error(projectNameValidation);
  }
  const framework = defaults.framework ?? (useDefaults ? "next" : await select({
    message: "Which stack do you want to scaffold?",
    choices: [
      {
        name: "Next.js",
        value: "next",
        description: "Full-stack React framework with App Router support"
      },
      {
        name: "React + Vite",
        value: "vite",
        description: "Lean React app powered by Vite"
      }
    ]
  }));
  const packageManager = defaults.packageManager ?? (useDefaults ? detectedPm : await select({
    message: "Which package manager should the generated project use?",
    default: detectedPm,
    choices: [
      { name: "pnpm", value: "pnpm" },
      { name: "npm", value: "npm" },
      { name: "yarn", value: "yarn" },
      { name: "bun", value: "bun" }
    ]
  }));
  const typescript = defaults.typescript ?? (useDefaults ? true : await confirm({
    message: "Use TypeScript?",
    default: true
  }));
  const tailwind = defaults.tailwind ?? (useDefaults ? true : await confirm({
    message: "Include Tailwind CSS?",
    default: true
  }));
  const eslint = defaults.eslint ?? (useDefaults ? true : await confirm({
    message: "Include ESLint?",
    default: true
  }));
  const useSrcDir = defaults.useSrcDir ?? (useDefaults ? true : await confirm({
    message: "Use a src/ directory?",
    default: true
  }));
  const useAppRouter = framework === "next" ? defaults.useAppRouter ?? (useDefaults ? true : await confirm({
    message: "Use the Next.js App Router?",
    default: true
  })) : false;
  const importAlias = defaults.importAlias ?? (useDefaults ? DEFAULT_IMPORT_ALIAS : await input({
    message: "Import alias",
    default: DEFAULT_IMPORT_ALIAS,
    validate: (value) => value.trim() ? true : "Import alias cannot be empty."
  }));
  const installSharedUi = defaults.installSharedUi ?? (useDefaults ? false : await confirm({
    message: "Wire in a shared UI package now?",
    default: false
  }));
  const sharedUiPackageName = installSharedUi ? defaults.sharedUiPackageName ?? (useDefaults ? "@dushin/ui" : await input({
    message: "Shared UI package name",
    default: "@dushin/ui"
  })) : "";
  const sharedUiPackageSource = installSharedUi ? defaults.sharedUiPackageSource ?? (useDefaults ? sharedUiPackageName : await input({
    message: "Install source (package name, local path, git URL, or leave same as package name)",
    default: sharedUiPackageName
  })) : "";
  const addStarterFolders = defaults.addStarterFolders ?? (useDefaults ? true : await confirm({
    message: "Add opinionated starter folders and example files?",
    default: true
  }));
  const initializeGit = defaults.initializeGit ?? (useDefaults ? true : await confirm({
    message: "Initialize git?",
    default: true
  }));
  const installDependencies = defaults.installDependencies ?? (useDefaults ? true : await confirm({
    message: "Install dependencies now?",
    default: true
  }));
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
    installDependencies
  };
}

// src/lib/logger.ts
import pc from "picocolors";
var logger = {
  info(message) {
    console.log(pc.cyan("\u2139"), message);
  },
  step(message) {
    console.log(pc.blue("\u2192"), message);
  },
  success(message) {
    console.log(pc.green("\u2713"), message);
  },
  warn(message) {
    console.warn(pc.yellow("\u25B2"), message);
  },
  error(message) {
    console.error(pc.red("\u2716"), message);
  },
  banner() {
    console.log(pc.bold(pc.magenta("\ncreate-dushin-stack\n")));
    console.log(
      pc.dim("Scaffold a clean React app with your preferred defaults.\n")
    );
  }
};

// src/scaffold.ts
import { promises as fs2 } from "fs";
import path2 from "path";
import { execa } from "execa";

// src/lib/fs-utils.ts
import { promises as fs } from "fs";
import path from "path";
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function writeFileSafe(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}
async function replaceInFile(filePath, replacer) {
  const existing = await fs.readFile(filePath, "utf8");
  const updated = replacer(existing);
  await fs.writeFile(filePath, updated, "utf8");
}

// src/templates/next/agents.ts
function renderAgentsMd() {
  return `# Project conventions

- Prefer small reusable components.
- Keep shared UI in a dedicated package.
- Use the import alias consistently.
- Avoid large page files by extracting sections into components.
`;
}

// src/templates/shared/gitignore.ts
function renderGitIgnore() {
  return `# dependencies
node_modules

# production
dist
build
.next
coverage

# logs
*.log

# env
.env
.env.local
.env.*.local

# misc
.DS_Store
.vscode
`;
}

// src/templates/shared/readme.ts
function renderReadme(answers) {
  const frameworkLabel = answers.framework === "next" ? "Next.js" : "React + Vite";
  const runCommand2 = answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`;
  return `# ${answers.projectName}

Scaffolded with create-dushin-stack.

## Stack

- ${frameworkLabel}
- ${answers.typescript ? "TypeScript" : "JavaScript"}
- ${answers.tailwind ? "Tailwind CSS" : "No Tailwind CSS"}
- ${answers.eslint ? "ESLint" : "No ESLint"}

## Development

Install dependencies if you skipped install during scaffolding, then run:

    ${runCommand2}

## Notes

- Import alias: ${answers.importAlias}${answers.installSharedUi ? `- Shared UI package wired in: ${answers.sharedUiPackageName}` : ""}`;
}

// src/templates/shared/starter-files.ts
function getBaseDir(answers) {
  if (answers.framework === "next") {
    return answers.useSrcDir ? "src" : "";
  }
  return answers.useSrcDir ? "src" : "src";
}
function getStarterFiles(answers) {
  const base = getBaseDir(answers);
  const libDir = base ? `${base}/lib` : "lib";
  const componentsDir = base ? `${base}/components` : "components";
  const hooksDir = base ? `${base}/hooks` : "hooks";
  const buttonImport = answers.framework === "next" ? `import { cn } from '${answers.useSrcDir ? "@/lib/cn" : "@/lib/cn"}';` : `import { cn } from '${libDir === "src/lib" ? "../lib/cn" : "../lib/cn"}';`;
  return [
    {
      path: `${libDir}/cn.${answers.typescript ? "ts" : "js"}`,
      content: `${answers.typescript ? "export function cn(...inputs: Array<string | false | null | undefined>) {" : "export function cn(...inputs) {"}
  return inputs.filter(Boolean).join(' ');
}
`
    },
    {
      path: `${componentsDir}/button.${answers.typescript ? "tsx" : "jsx"}`,
      content: `${buttonImport}

${answers.typescript ? "type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;" : ""}

export function Button(${answers.typescript ? "{ className, ...props }: ButtonProps" : "{ className, ...props }"}) {
  return (
    <button
      className={cn('inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition', ${answers.tailwind ? `'bg-black text-white hover:opacity-90'` : `''`}, className)}
      {...props}
    />
  );
}
`
    },
    {
      path: `${hooksDir}/README.md`,
      content: `# Hooks

Place reusable hooks here.
`
    },
    {
      path: `${componentsDir}/README.md`,
      content: `# Components

Place app-specific components here. Reusable cross-project components belong in your shared UI package.
`
    }
  ];
}

// src/templates/vite/files.ts
function resolveAliasKey(importAlias) {
  return importAlias.replace(/\/\*$/, "");
}
function renderViteConfigTs(withTailwind, importAlias) {
  const aliasKey = resolveAliasKey(importAlias);
  return `import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
${withTailwind ? `import tailwindcss from '@tailwindcss/vite';
` : ""}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()${withTailwind ? ", tailwindcss()" : ""}],
  resolve: {
    alias: {
      '${aliasKey}': path.resolve(__dirname, 'src'),
    },
  },
});
`;
}
function renderViteConfigJs(withTailwind, importAlias) {
  const aliasKey = resolveAliasKey(importAlias);
  return `import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
${withTailwind ? `import tailwindcss from '@tailwindcss/vite';
` : ""}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()${withTailwind ? ", tailwindcss()" : ""}],
  resolve: {
    alias: {
      '${aliasKey}': path.resolve(__dirname, 'src'),
    },
  },
});
`;
}
function renderIndexCss(withTailwind) {
  if (withTailwind) {
    return `@import "tailwindcss";

:root {
  font-family: Inter, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
`;
  }
  return `:root {
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
`;
}
function renderAppTsx(withTailwind) {
  return `export default function App() {
  return (
    <main className=${withTailwind ? '"min-h-screen p-8"' : '"app"'}>
      <div className=${withTailwind ? '"mx-auto max-w-3xl space-y-4"' : '""'}>
        <p>Your app is ready.</p>
        <h1${withTailwind ? ' className="text-4xl font-semibold tracking-tight"' : ""}>create-dushin-stack</h1>
        <p${withTailwind ? ' className="text-slate-600"' : ""}>
          Start building in <code>src/App.tsx</code>.
        </p>
      </div>
    </main>
  );
}
`;
}
function renderAppJsx(withTailwind) {
  return `export default function App() {
  return (
    <main className=${withTailwind ? '"min-h-screen p-8"' : '"app"'}>
      <div className=${withTailwind ? '"mx-auto max-w-3xl space-y-4"' : '""'}>
        <p>Your app is ready.</p>
        <h1${withTailwind ? ' className="text-4xl font-semibold tracking-tight"' : ""}>create-dushin-stack</h1>
        <p${withTailwind ? ' className="text-slate-600"' : ""}>
          Start building in <code>src/App.jsx</code>.
        </p>
      </div>
    </main>
  );
}
`;
}
function renderTsConfigPaths(importAlias) {
  return {
    compilerOptions: {
      baseUrl: ".",
      paths: {
        [importAlias]: ["src/*"]
      }
    }
  };
}

// src/scaffold.ts
async function scaffoldProject(answers, options) {
  const targetDir = path2.resolve(options.cwd, answers.projectName);
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
    `  ${answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`}`
  );
}
async function assertTargetDirectoryAvailable(targetDir) {
  if (!await fileExists(targetDir)) {
    return;
  }
  const entries = await fs2.readdir(targetDir);
  if (entries.length > 0) {
    throw new Error(
      `Target directory already exists and is not empty: ${targetDir}`
    );
  }
}
async function createNextApp(answers, cwd, dryRun) {
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
    packageManagerFlag(answers.packageManager)
  ];
  if (!answers.installDependencies) {
    args.push("--skip-install");
  }
  await runCommand(base[0], args, {
    cwd,
    dryRun,
    label: "Create Next.js app"
  });
}
async function createViteApp(answers, cwd, dryRun) {
  const base = PACKAGE_MANAGER_CREATE_COMMAND[answers.packageManager];
  const template = answers.typescript ? "react-ts" : "react";
  const templateArgs = viteTemplateArgs(answers.packageManager, template);
  const args = [
    ...base.slice(1),
    "vite@latest",
    answers.projectName,
    ...templateArgs
  ];
  await runCommand(base[0], args, {
    cwd,
    dryRun,
    label: "Create Vite app"
  });
  const targetDir = path2.resolve(cwd, answers.projectName);
  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, dryRun);
  }
}
function viteTemplateArgs(packageManager, template) {
  if (packageManager === "npm") {
    return ["--", "--template", template];
  }
  return ["--template", template];
}
async function customizeProject(answers, targetDir) {
  logger.step("Applying project polish");
  await writeFileSafe(path2.join(targetDir, ".gitignore"), renderGitIgnore());
  await writeFileSafe(path2.join(targetDir, "README.md"), renderReadme(answers));
  if (answers.framework === "next") {
    await customizeNextProject(answers, targetDir);
  } else {
    await customizeViteProject(answers, targetDir);
  }
  if (answers.addStarterFolders) {
    for (const file of getStarterFiles(answers)) {
      await writeFileSafe(path2.join(targetDir, file.path), file.content);
    }
  }
  if (answers.installSharedUi && answers.installDependencies) {
    logger.step(
      `Installing shared UI package from ${answers.sharedUiPackageSource}`
    );
    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      install[0],
      [...install.slice(1), answers.sharedUiPackageSource],
      {
        cwd: targetDir,
        dryRun: false,
        label: "Install shared UI package"
      }
    );
  }
  if (answers.initializeGit) {
    await runCommand("git", ["init"], {
      cwd: targetDir,
      dryRun: false,
      label: "Initialize git repository"
    });
  }
}
async function customizeNextProject(answers, targetDir) {
  const appDir = answers.useSrcDir ? path2.join(targetDir, "src", "app") : path2.join(targetDir, "app");
  const pagesDir = answers.useSrcDir ? path2.join(targetDir, "src", "pages") : path2.join(targetDir, "pages");
  const nextPageCandidates = [
    path2.join(appDir, "page.tsx"),
    path2.join(appDir, "page.js"),
    path2.join(pagesDir, "index.tsx"),
    path2.join(pagesDir, "index.jsx"),
    path2.join(pagesDir, "index.js")
  ];
  const pagePath = (await Promise.all(
    nextPageCandidates.map(
      async (candidate) => await fileExists(candidate) ? candidate : ""
    )
  )).find(Boolean);
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
`
    );
  }
  await writeFileSafe(path2.join(targetDir, "AGENTS.md"), renderAgentsMd());
}
async function customizeViteProject(answers, targetDir) {
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
async function installViteTailwind(answers, targetDir) {
  const devInstall = PACKAGE_MANAGER_DEV_INSTALL_COMMAND[answers.packageManager];
  await runCommand(
    devInstall[0],
    [...devInstall.slice(1), "tailwindcss", "@tailwindcss/vite"],
    {
      cwd: targetDir,
      dryRun: false,
      label: "Install Tailwind CSS for Vite"
    }
  );
}
async function ensureViteTailwindDevDependencies(targetDir) {
  const packageJsonPath = path2.join(targetDir, "package.json");
  if (!await fileExists(packageJsonPath)) return;
  const parsed = JSON.parse(await fs2.readFile(packageJsonPath, "utf8"));
  const existingDevDependencies = parsed.devDependencies ?? {};
  parsed.devDependencies = {
    ...existingDevDependencies,
    ...existingDevDependencies.tailwindcss ? {} : { tailwindcss: "^4.1.0" },
    ...existingDevDependencies["@tailwindcss/vite"] ? {} : { "@tailwindcss/vite": "^4.1.0" }
  };
  await fs2.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}
`);
}
async function writeViteConfig(targetDir, answers) {
  const viteConfigPath = path2.join(
    targetDir,
    `vite.config.${answers.typescript ? "ts" : "js"}`
  );
  await writeFileSafe(
    viteConfigPath,
    answers.typescript ? renderViteConfigTs(answers.tailwind, answers.importAlias) : renderViteConfigJs(answers.tailwind, answers.importAlias)
  );
}
async function writeViteAppFiles(targetDir, answers) {
  const srcDir = path2.join(targetDir, "src");
  const isTs = answers.typescript;
  await ensureDir(srcDir);
  await writeFileSafe(
    path2.join(srcDir, "index.css"),
    renderIndexCss(answers.tailwind)
  );
  await writeFileSafe(
    path2.join(srcDir, `App.${isTs ? "tsx" : "jsx"}`),
    isTs ? renderAppTsx(answers.tailwind) : renderAppJsx(answers.tailwind)
  );
}
async function updateViteEntryFile(targetDir, answers) {
  const srcDir = path2.join(targetDir, "src");
  const mainPath = path2.join(
    srcDir,
    `main.${answers.typescript ? "tsx" : "jsx"}`
  );
  if (!await fileExists(mainPath)) return;
  await replaceInFile(mainPath, (input2) => {
    const withoutOldCssImport = input2.replace(
      /import ['"].\/[^'"]+\.css['"];?\n?/g,
      ""
    );
    return `import "./index.css";
${withoutOldCssImport}`;
  });
}
async function updateViteProjectConfig(targetDir, answers) {
  await updateViteTsconfig(targetDir, answers);
  if (!answers.typescript) {
    await updateJsConfig(targetDir, answers);
  }
}
async function updateViteTsconfig(targetDir, answers) {
  if (!answers.typescript) return;
  const tsconfigAppPath = path2.join(targetDir, "tsconfig.app.json");
  const tsconfigPath = path2.join(targetDir, "tsconfig.json");
  const aliases = renderTsConfigPaths(answers.importAlias);
  if (await fileExists(tsconfigAppPath)) {
    await mergeCompilerOptionsIntoJson(tsconfigAppPath, aliases);
    return;
  }
  if (await fileExists(tsconfigPath)) {
    await mergeCompilerOptionsIntoJson(tsconfigPath, aliases);
  }
}
async function updateJsConfig(targetDir, answers) {
  const jsconfigPath = path2.join(targetDir, "jsconfig.json");
  const alias = normalizeAlias(answers.importAlias);
  const config = {
    compilerOptions: {
      baseUrl: ".",
      paths: {
        [alias]: ["./src/*"]
      }
    }
  };
  await fs2.writeFile(
    jsconfigPath,
    `${JSON.stringify(config, null, 2)}
`,
    "utf8"
  );
}
async function mergeCompilerOptionsIntoJson(filePath, incoming) {
  const parsed = parseJsonLike(await fs2.readFile(filePath, "utf8"));
  const incomingCompilerOptions = incoming.compilerOptions ?? {};
  const existingCompilerOptions = parsed.compilerOptions ?? {};
  const incomingPaths = incomingCompilerOptions.paths ?? {};
  const existingPaths = existingCompilerOptions.paths ?? {};
  parsed.compilerOptions = {
    ...existingCompilerOptions,
    ...incomingCompilerOptions,
    paths: {
      ...existingPaths,
      ...incomingPaths
    }
  };
  await fs2.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}
`, "utf8");
}
function normalizeAlias(importAlias) {
  return importAlias.endsWith("/*") ? importAlias : `${importAlias}/*`;
}
async function addViteAliasNote(targetDir, packageName) {
  const readmePath = path2.join(targetDir, "README.md");
  const current = await fs2.readFile(readmePath, "utf8");
  await fs2.writeFile(
    readmePath,
    `${current}
Shared UI package configured: \`${packageName}\`
`,
    "utf8"
  );
}
function parseJsonLike(input2) {
  const withoutBlockComments = input2.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(
    /(^|\s)\/\/.*$/gm,
    ""
  );
  const withoutTrailingCommas = withoutLineComments.replace(
    /,\s*([}\]])/g,
    "$1"
  );
  return JSON.parse(withoutTrailingCommas);
}
function packageManagerFlag(packageManager) {
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
async function runProjectInstall(answers, targetDir, dryRun) {
  const cmd = answers.packageManager;
  const args = ["install"];
  await runCommand(cmd, args, {
    cwd: targetDir,
    dryRun,
    label: "Install project dependencies"
  });
}
async function runCommand(command, args, opts) {
  logger.step(opts.label);
  console.log(`  ${[command, ...args].join(" ")}`);
  if (opts.dryRun) return;
  await execa(command, args, {
    cwd: opts.cwd,
    stdio: "inherit"
  });
}

// src/index.ts
var program = new Command();
var frameworks = ["next", "vite"];
var packageManagers = ["pnpm", "npm", "yarn", "bun"];
program.name("create-dushin-stack").description(
  "Scaffold a polished Next.js or React/Vite project with your preferred defaults."
).argument("[project-name]", "Name of the project to create").option(
  "-f, --framework <framework>",
  "next or vite",
  parseChoice("framework", frameworks)
).option(
  "-p, --package-manager <packageManager>",
  "pnpm, npm, yarn, or bun",
  parseChoice("package manager", packageManagers)
).option("--tailwind", "Include Tailwind CSS").option("--no-tailwind", "Skip Tailwind CSS").option("--typescript", "Use TypeScript").option("--no-typescript", "Use JavaScript instead").option("--eslint", "Include ESLint").option("--no-eslint", "Skip ESLint").option("--src-dir", "Use a src/ directory").option("--no-src-dir", "Do not use a src/ directory").option("--app-router", "Use Next.js App Router").option("--no-app-router", "Do not use Next.js App Router").option("--import-alias <alias>", "Import alias to configure").option("--shared-ui", "Install a shared UI package").option("--no-shared-ui", "Skip shared UI package wiring").option("--shared-ui-package-name <name>", "The package name used in imports").option(
  "--shared-ui-package-source <source>",
  "The install source for the shared UI package"
).option("--starter-folders", "Add starter folders and example files").option("--no-starter-folders", "Skip starter folders and example files").option("--git", "Initialize git").option("--no-git", "Skip git initialization").option("--install", "Install dependencies").option("--no-install", "Skip dependency installation").option("-y, --yes", "Use defaults for any unanswered prompts").option("--dry-run", "Print the commands without executing them").action(async (projectName, options) => {
  try {
    logger.banner();
    const answers = await collectAnswers({
      projectName,
      framework: options.framework,
      packageManager: options.packageManager,
      tailwind: optionValue(options, "tailwind"),
      typescript: optionValue(options, "typescript"),
      eslint: optionValue(options, "eslint"),
      useSrcDir: optionValue(options, "srcDir"),
      useAppRouter: optionValue(options, "appRouter"),
      importAlias: options.importAlias,
      installSharedUi: optionValue(options, "sharedUi"),
      sharedUiPackageName: options.sharedUiPackageName,
      sharedUiPackageSource: options.sharedUiPackageSource,
      addStarterFolders: optionValue(options, "starterFolders"),
      initializeGit: optionValue(options, "git"),
      installDependencies: optionValue(options, "install"),
      yes: Boolean(options.yes)
    });
    await scaffoldProject(answers, {
      cwd: process.cwd(),
      dryRun: Boolean(options.dryRun)
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      logger.warn("Setup cancelled.");
      process.exit(1);
    }
    logger.error(error instanceof Error ? error.message : "Unexpected error");
    process.exit(1);
  }
});
program.parseAsync(process.argv);
function optionValue(obj, key) {
  const value = obj[key];
  return typeof value === "undefined" ? void 0 : value;
}
function parseChoice(label, choices) {
  return (value) => {
    if (choices.includes(value)) {
      return value;
    }
    throw new InvalidArgumentError(
      `Invalid ${label}: "${value}". Expected one of: ${choices.join(", ")}`
    );
  };
}

import { confirm, input, select } from "@inquirer/prompts";
import { DEFAULT_IMPORT_ALIAS } from "./lib/constants.js";
import { detectPackageManager } from "./lib/package-manager.js";
import { validateProjectName } from "./lib/validate.js";
import type { Answers, Framework, PackageManager } from "./types.js";

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
  yes?: boolean;
}

export async function collectAnswers(
  defaults: PromptDefaults,
): Promise<Answers> {
  const useDefaults = defaults.yes ?? false;
  const detectedPm = defaults.packageManager ?? detectPackageManager();

  const projectName =
    defaults.projectName ??
    (useDefaults
      ? "my-app"
      : await input({
          message: "Project name",
          default: "my-app",
          validate: (value) => validateProjectName(value),
        }));
  const projectNameValidation = validateProjectName(projectName);
  if (projectNameValidation !== true) {
    throw new Error(projectNameValidation);
  }

  const framework =
    defaults.framework ??
    (useDefaults
      ? "next"
      : await select<Framework>({
          message: "Which stack do you want to scaffold?",
          choices: [
            {
              name: "Next.js",
              value: "next",
              description: "Full-stack React framework with App Router support",
            },
            {
              name: "React + Vite",
              value: "vite",
              description: "Lean React app powered by Vite",
            },
          ],
        }));

  const packageManager =
    defaults.packageManager ??
    (useDefaults
      ? detectedPm
      : await select<PackageManager>({
          message: "Which package manager should the generated project use?",
          default: detectedPm,
          choices: [
            { name: "pnpm", value: "pnpm" },
            { name: "npm", value: "npm" },
            { name: "yarn", value: "yarn" },
            { name: "bun", value: "bun" },
          ],
        }));

  const typescript =
    defaults.typescript ??
    (useDefaults
      ? true
      : await confirm({
          message: "Use TypeScript?",
          default: true,
        }));

  const tailwind =
    defaults.tailwind ??
    (useDefaults
      ? true
      : await confirm({
          message: "Include Tailwind CSS?",
          default: true,
        }));

  const eslint =
    defaults.eslint ??
    (useDefaults
      ? true
      : await confirm({
          message: "Include ESLint?",
          default: true,
        }));

  const useSrcDir =
    defaults.useSrcDir ??
    (useDefaults
      ? true
      : await confirm({
          message: "Use a src/ directory?",
          default: true,
        }));

  const useAppRouter =
    framework === "next"
      ? (defaults.useAppRouter ??
        (useDefaults
          ? true
          : await confirm({
              message: "Use the Next.js App Router?",
              default: true,
            })))
      : false;

  const importAlias =
    defaults.importAlias ??
    (useDefaults
      ? DEFAULT_IMPORT_ALIAS
      : await input({
          message: "Import alias",
          default: DEFAULT_IMPORT_ALIAS,
          validate: (value) =>
            value.trim() ? true : "Import alias cannot be empty.",
        }));

  const installSharedUi =
    defaults.installSharedUi ??
    (useDefaults
      ? false
      : await confirm({
          message: "Wire in a shared UI package now?",
          default: false,
        }));

  const sharedUiPackageName = installSharedUi
    ? (defaults.sharedUiPackageName ??
      (useDefaults
        ? "@dushin/ui"
        : await input({
            message: "Shared UI package name",
            default: "@dushin/ui",
          })))
    : "";

  const sharedUiPackageSource = installSharedUi
    ? (defaults.sharedUiPackageSource ??
      (useDefaults
        ? sharedUiPackageName
        : await input({
            message:
              "Install source (package name, local path, git URL, or leave same as package name)",
            default: sharedUiPackageName,
          })))
    : "";

  const addStarterFolders =
    defaults.addStarterFolders ??
    (useDefaults
      ? true
      : await confirm({
          message: "Add opinionated starter folders and example files?",
          default: true,
        }));

  const initializeGit =
    defaults.initializeGit ??
    (useDefaults
      ? true
      : await confirm({
          message: "Initialize git?",
          default: true,
        }));

  const installDependencies =
    defaults.installDependencies ??
    (useDefaults
      ? true
      : await confirm({
          message: "Install dependencies now?",
          default: true,
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
    installDependencies,
  };
}

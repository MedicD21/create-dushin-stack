import { confirm, input, select } from "@inquirer/prompts";
import { PRESET_DEFAULTS } from "./lib/presets.js";
import { DEFAULT_IMPORT_ALIAS } from "./lib/constants.js";
import { detectPackageManager } from "./lib/package-manager.js";
import { validateProjectName } from "./lib/validate.js";
import {
  PRESET_IDS,
  TEMPLATE_DEFINITIONS,
  frameworkFromTemplate,
  templateFromFramework,
} from "./templates/registry.js";
import type {
  Answers,
  Framework,
  PackageManager,
  PresetId,
  TemplateId,
} from "./types.js";

export interface PromptDefaults {
  projectName?: string;
  framework?: Framework;
  template?: TemplateId;
  preset?: PresetId;
  templateFile?: string;
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
  runHealthChecks?: boolean;
  jsonOutput?: boolean;
  yes?: boolean;
}

export async function collectAnswers(
  defaults: PromptDefaults,
): Promise<Answers> {
  const useDefaults = defaults.yes ?? false;
  const detectedPm = defaults.packageManager ?? detectPackageManager();

  const preset =
    defaults.preset ??
    (useDefaults
      ? "starter"
      : await select<PresetId>({
          message: "Choose a preset",
          default: "starter",
          choices: [
            {
              name: "starter",
              value: "starter",
              description: "Balanced defaults for most apps",
            },
            {
              name: "saas",
              value: "saas",
              description: "Next.js + shared UI + production-ready defaults",
            },
            {
              name: "content-site",
              value: "content-site",
              description: "Next.js content-focused starter",
            },
            {
              name: "dashboard",
              value: "dashboard",
              description: "Vite + Router + Query setup",
            },
          ],
        }));

  const presetDefaults = PRESET_DEFAULTS[preset];

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

  const template = await resolveTemplate(defaults, presetDefaults.template, useDefaults);
  const framework = frameworkFromTemplate(template);

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
      ? presetDefaults.typescript
      : await confirm({
          message: "Use TypeScript?",
          default: presetDefaults.typescript,
        }));

  const tailwind =
    defaults.tailwind ??
    (useDefaults
      ? presetDefaults.tailwind
      : await confirm({
          message: "Include Tailwind CSS?",
          default: presetDefaults.tailwind,
        }));

  const eslint =
    defaults.eslint ??
    (useDefaults
      ? presetDefaults.eslint
      : await confirm({
          message: "Include ESLint?",
          default: presetDefaults.eslint,
        }));

  const useSrcDir =
    defaults.useSrcDir ??
    (useDefaults
      ? presetDefaults.useSrcDir
      : await confirm({
          message: "Use a src/ directory?",
          default: presetDefaults.useSrcDir,
        }));

  const useAppRouter =
    framework === "next"
      ? (defaults.useAppRouter ??
        (useDefaults
          ? presetDefaults.useAppRouter
          : await confirm({
              message: "Use the Next.js App Router?",
              default: presetDefaults.useAppRouter,
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
      ? presetDefaults.installSharedUi
      : await confirm({
          message: "Wire in a shared UI package now?",
          default: presetDefaults.installSharedUi,
        }));

  const sharedUiPackageName = installSharedUi
    ? (defaults.sharedUiPackageName ??
      (useDefaults
        ? presetDefaults.sharedUiPackageName
        : await input({
            message: "Shared UI package name",
            default: presetDefaults.sharedUiPackageName,
          })))
    : "";

  const sharedUiPackageSource = installSharedUi
    ? (defaults.sharedUiPackageSource ??
      (useDefaults
        ? presetDefaults.sharedUiPackageSource
        : await input({
            message:
              "Install source (package name, local path, git URL, or leave same as package name)",
            default: sharedUiPackageName,
          })))
    : "";

  const addStarterFolders =
    defaults.addStarterFolders ??
    (useDefaults
      ? presetDefaults.addStarterFolders
      : await confirm({
          message: "Add opinionated starter folders and example files?",
          default: presetDefaults.addStarterFolders,
        }));

  const initializeGit =
    defaults.initializeGit ??
    (useDefaults
      ? presetDefaults.initializeGit
      : await confirm({
          message: "Initialize git?",
          default: presetDefaults.initializeGit,
        }));

  const installDependencies =
    defaults.installDependencies ??
    (useDefaults
      ? presetDefaults.installDependencies
      : await confirm({
          message: "Install dependencies now?",
          default: presetDefaults.installDependencies,
        }));

  const runHealthChecks =
    defaults.runHealthChecks ??
    (useDefaults
      ? presetDefaults.runHealthChecks
      : await confirm({
          message: "Run post-scaffold health checks (lint/typecheck/build)?",
          default: presetDefaults.runHealthChecks,
        }));

  return {
    projectName,
    framework,
    template,
    preset,
    templateFile: defaults.templateFile ?? "",
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
    runHealthChecks,
    jsonOutput: defaults.jsonOutput ?? false,
  };
}

async function resolveTemplate(
  defaults: PromptDefaults,
  presetTemplate: TemplateId,
  useDefaults: boolean,
): Promise<TemplateId> {
  if (defaults.templateFile) {
    return "plugin-file";
  }

  if (defaults.template) {
    return defaults.template;
  }

  if (defaults.framework) {
    return templateFromFramework(defaults.framework);
  }

  if (useDefaults) {
    return presetTemplate;
  }

  return select<TemplateId>({
    message: "Choose a template",
    default: presetTemplate,
    choices: TEMPLATE_DEFINITIONS.map((template) => ({
      name: template.label,
      value: template.id,
      description: template.description,
    })),
  });
}

export const presetIds = PRESET_IDS;

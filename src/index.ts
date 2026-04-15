#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { collectAnswers, presetIds } from "./prompts.js";
import { logger } from "./lib/logger.js";
import { scaffoldProject } from "./scaffold.js";
import { TEMPLATE_IDS } from "./templates/registry.js";
import type {
  Framework,
  PackageManager,
  PresetId,
  TemplateId,
} from "./types.js";

const program = new Command();
const frameworks = ["next", "vite", "node", "monorepo", "ios", "mobile"] as const;
const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;

program
  .name("create-dushin-stack")
  .description(
    "Scaffold polished templates for Next.js, Vite, APIs, and monorepos.",
  )
  .argument("[project-name]", "Name of the project to create")
  .option(
    "-f, --framework <framework>",
    "next, vite, node, or monorepo",
    parseChoice("framework", frameworks),
  )
  .option(
    "-t, --template <template>",
    `Template id (${TEMPLATE_IDS.join(", ")})`,
    parseChoice("template", TEMPLATE_IDS),
  )
  .option(
    "--preset <preset>",
    `starter, saas, content-site, or dashboard`,
    parseChoice("preset", presetIds),
  )
  .option(
    "--template-file <path>",
    "Path to a local plugin template JSON file",
  )
  .option(
    "-p, --package-manager <packageManager>",
    "pnpm, npm, yarn, or bun",
    parseChoice("package manager", packageManagers),
  )
  .option("--tailwind", "Include Tailwind CSS")
  .option("--no-tailwind", "Skip Tailwind CSS")
  .option("--typescript", "Use TypeScript")
  .option("--no-typescript", "Use JavaScript instead")
  .option("--eslint", "Include ESLint")
  .option("--no-eslint", "Skip ESLint")
  .option("--src-dir", "Use a src/ directory")
  .option("--no-src-dir", "Do not use a src/ directory")
  .option("--app-router", "Use Next.js App Router")
  .option("--no-app-router", "Do not use Next.js App Router")
  .option("--import-alias <alias>", "Import alias to configure")
  .option("--shared-ui", "Install a shared UI package")
  .option("--no-shared-ui", "Skip shared UI package wiring")
  .option("--shared-ui-package-name <name>", "The package name used in imports")
  .option(
    "--shared-ui-package-source <source>",
    "The install source for the shared UI package",
  )
  .option("--starter-folders", "Add starter folders and example files")
  .option("--no-starter-folders", "Skip starter folders and example files")
  .option("--git", "Initialize git")
  .option("--no-git", "Skip git initialization")
  .option("--install", "Install dependencies")
  .option("--no-install", "Skip dependency installation")
  .option("--health-checks", "Run lint/typecheck/build after scaffolding")
  .option("--no-health-checks", "Skip post-scaffold health checks")
  .option("--json", "Print final scaffold summary as JSON")
  .option("-y, --yes", "Use defaults for any unanswered prompts")
  .option("--dry-run", "Print the commands without executing them")
  .action(async (projectName: string | undefined, options) => {
    try {
      logger.banner();

      const answers = await collectAnswers({
        projectName,
        framework: options.framework as Framework | undefined,
        template: options.template as TemplateId | undefined,
        preset: options.preset as PresetId | undefined,
        templateFile: options.templateFile,
        packageManager: options.packageManager as PackageManager | undefined,
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
        runHealthChecks: optionValue(options, "healthChecks"),
        jsonOutput: Boolean(options.json),
        yes: Boolean(options.yes),
      });

      const result = await scaffoldProject(answers, {
        cwd: process.cwd(),
        dryRun: Boolean(options.dryRun),
      });

      if (answers.jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      }
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

function optionValue<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): T[K] | undefined {
  const value = obj[key];
  return typeof value === "undefined" ? undefined : value;
}

function parseChoice<const T extends readonly string[]>(
  label: string,
  choices: T,
) {
  return (value: string) => {
    if (choices.includes(value)) {
      return value;
    }

    throw new InvalidArgumentError(
      `Invalid ${label}: "${value}". Expected one of: ${choices.join(", ")}`,
    );
  };
}

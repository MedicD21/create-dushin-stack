#!/usr/bin/env node

// src/index.ts
import { Command, InvalidArgumentError } from "commander";

// src/prompts.ts
import { confirm, input, select } from "@inquirer/prompts";

// src/lib/presets.ts
var PRESET_DEFAULTS = {
  starter: {
    template: "vite-react",
    typescript: true,
    tailwind: true,
    eslint: true,
    useSrcDir: true,
    useAppRouter: true,
    installSharedUi: false,
    sharedUiPackageName: "@dushin/ui",
    sharedUiPackageSource: "@dushin/ui",
    addStarterFolders: true,
    initializeGit: true,
    installDependencies: true,
    runHealthChecks: true
  },
  saas: {
    template: "next-app",
    typescript: true,
    tailwind: true,
    eslint: true,
    useSrcDir: true,
    useAppRouter: true,
    installSharedUi: true,
    sharedUiPackageName: "@acme/ui",
    sharedUiPackageSource: "@acme/ui",
    addStarterFolders: true,
    initializeGit: true,
    installDependencies: true,
    runHealthChecks: true
  },
  "content-site": {
    template: "next-app",
    typescript: true,
    tailwind: true,
    eslint: true,
    useSrcDir: true,
    useAppRouter: true,
    installSharedUi: false,
    sharedUiPackageName: "@dushin/ui",
    sharedUiPackageSource: "@dushin/ui",
    addStarterFolders: true,
    initializeGit: true,
    installDependencies: true,
    runHealthChecks: true
  },
  dashboard: {
    template: "vite-router-query",
    typescript: true,
    tailwind: true,
    eslint: true,
    useSrcDir: true,
    useAppRouter: false,
    installSharedUi: true,
    sharedUiPackageName: "@acme/ui",
    sharedUiPackageSource: "@acme/ui",
    addStarterFolders: true,
    initializeGit: true,
    installDependencies: true,
    runHealthChecks: true
  }
};

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

// src/templates/registry.ts
var TEMPLATE_DEFINITIONS = [
  {
    id: "next-app",
    label: "Next.js App",
    description: "Great for SaaS apps and content sites with full-stack React.",
    framework: "next"
  },
  {
    id: "vite-react",
    label: "React + Vite",
    description: "Fast SPA setup with TypeScript and optional Tailwind.",
    framework: "vite"
  },
  {
    id: "vite-router-query",
    label: "Vite + Router + Query",
    description: "React + Vite with React Router and TanStack Query prewired.",
    framework: "vite"
  },
  {
    id: "node-api-hono",
    label: "Node API (Hono)",
    description: "Type-safe API starter with Hono + Zod.",
    framework: "node"
  },
  {
    id: "monorepo-web-ui",
    label: "Monorepo (web + ui)",
    description: "Workspace starter with apps/web and packages/ui.",
    framework: "monorepo"
  },
  {
    id: "ios-swiftui",
    label: "iOS (SwiftUI)",
    description: "Native iOS app with SwiftUI, XcodeGen project.yml.",
    framework: "ios"
  },
  {
    id: "react-capacitor",
    label: "React + Capacitor (iOS/Android)",
    description: "React + Vite app with Capacitor for iOS and Android.",
    framework: "mobile"
  }
];
var TEMPLATE_IDS = TEMPLATE_DEFINITIONS.map((t) => t.id);
var PRESET_IDS = [
  "starter",
  "saas",
  "content-site",
  "dashboard"
];
function templateFromFramework(framework) {
  switch (framework) {
    case "next":
      return "next-app";
    case "vite":
      return "vite-react";
    case "node":
      return "node-api-hono";
    case "monorepo":
      return "monorepo-web-ui";
    case "plugin":
      return "plugin-file";
    case "ios":
      return "ios-swiftui";
    case "mobile":
      return "react-capacitor";
  }
}
function frameworkFromTemplate(template) {
  if (template === "plugin-file") return "plugin";
  if (template === "ios-swiftui") return "ios";
  if (template === "react-capacitor") return "mobile";
  const found = TEMPLATE_DEFINITIONS.find((entry) => entry.id === template);
  return found?.framework ?? "vite";
}

// src/prompts.ts
async function collectAnswers(defaults) {
  const useDefaults = defaults.yes ?? false;
  const detectedPm = defaults.packageManager ?? detectPackageManager();
  const preset = defaults.preset ?? (useDefaults ? "starter" : await select({
    message: "Choose a preset",
    default: "starter",
    choices: [
      {
        name: "starter",
        value: "starter",
        description: "Balanced defaults for most apps"
      },
      {
        name: "saas",
        value: "saas",
        description: "Next.js + shared UI + production-ready defaults"
      },
      {
        name: "content-site",
        value: "content-site",
        description: "Next.js content-focused starter"
      },
      {
        name: "dashboard",
        value: "dashboard",
        description: "Vite + Router + Query setup"
      }
    ]
  }));
  const presetDefaults = PRESET_DEFAULTS[preset];
  const projectName = defaults.projectName ?? (useDefaults ? "my-app" : await input({
    message: "Project name",
    default: "my-app",
    validate: (value) => validateProjectName(value)
  }));
  const projectNameValidation = validateProjectName(projectName);
  if (projectNameValidation !== true) {
    throw new Error(projectNameValidation);
  }
  const template = await resolveTemplate(defaults, presetDefaults.template, useDefaults);
  const framework = frameworkFromTemplate(template);
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
  const typescript = defaults.typescript ?? (useDefaults ? presetDefaults.typescript : await confirm({
    message: "Use TypeScript?",
    default: presetDefaults.typescript
  }));
  const tailwind = defaults.tailwind ?? (useDefaults ? presetDefaults.tailwind : await confirm({
    message: "Include Tailwind CSS?",
    default: presetDefaults.tailwind
  }));
  const eslint = defaults.eslint ?? (useDefaults ? presetDefaults.eslint : await confirm({
    message: "Include ESLint?",
    default: presetDefaults.eslint
  }));
  const useSrcDir = defaults.useSrcDir ?? (useDefaults ? presetDefaults.useSrcDir : await confirm({
    message: "Use a src/ directory?",
    default: presetDefaults.useSrcDir
  }));
  const useAppRouter = framework === "next" ? defaults.useAppRouter ?? (useDefaults ? presetDefaults.useAppRouter : await confirm({
    message: "Use the Next.js App Router?",
    default: presetDefaults.useAppRouter
  })) : false;
  const importAlias = defaults.importAlias ?? (useDefaults ? DEFAULT_IMPORT_ALIAS : await input({
    message: "Import alias",
    default: DEFAULT_IMPORT_ALIAS,
    validate: (value) => value.trim() ? true : "Import alias cannot be empty."
  }));
  const installSharedUi = defaults.installSharedUi ?? (useDefaults ? presetDefaults.installSharedUi : await confirm({
    message: "Wire in a shared UI package now?",
    default: presetDefaults.installSharedUi
  }));
  const sharedUiPackageName = installSharedUi ? defaults.sharedUiPackageName ?? (useDefaults ? presetDefaults.sharedUiPackageName : await input({
    message: "Shared UI package name",
    default: presetDefaults.sharedUiPackageName
  })) : "";
  const sharedUiPackageSource = installSharedUi ? defaults.sharedUiPackageSource ?? (useDefaults ? presetDefaults.sharedUiPackageSource : await input({
    message: "Install source (package name, local path, git URL, or leave same as package name)",
    default: sharedUiPackageName
  })) : "";
  const addStarterFolders = defaults.addStarterFolders ?? (useDefaults ? presetDefaults.addStarterFolders : await confirm({
    message: "Add opinionated starter folders and example files?",
    default: presetDefaults.addStarterFolders
  }));
  const initializeGit = defaults.initializeGit ?? (useDefaults ? presetDefaults.initializeGit : await confirm({
    message: "Initialize git?",
    default: presetDefaults.initializeGit
  }));
  const installDependencies = defaults.installDependencies ?? (useDefaults ? presetDefaults.installDependencies : await confirm({
    message: "Install dependencies now?",
    default: presetDefaults.installDependencies
  }));
  const runHealthChecks2 = defaults.runHealthChecks ?? (useDefaults ? presetDefaults.runHealthChecks : await confirm({
    message: "Run post-scaffold health checks (lint/typecheck/build)?",
    default: presetDefaults.runHealthChecks
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
    runHealthChecks: runHealthChecks2,
    jsonOutput: defaults.jsonOutput ?? false
  };
}
async function resolveTemplate(defaults, presetTemplate, useDefaults) {
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
  return select({
    message: "Choose a template",
    default: presetTemplate,
    choices: TEMPLATE_DEFINITIONS.map((template) => ({
      name: template.label,
      value: template.id,
      description: template.description
    }))
  });
}
var presetIds = PRESET_IDS;

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
      pc.dim("Scaffold polished templates with your preferred defaults.\n")
    );
  }
};

// src/scaffold.ts
import { promises as fs3 } from "fs";
import path2 from "path";
import { execa } from "execa";

// src/lib/plugin-template.ts
import { promises as fs } from "fs";
async function readPluginTemplateFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.files || typeof parsed.files !== "object") {
    throw new Error("Plugin template must provide a files object.");
  }
  return parsed;
}

// src/lib/fs-utils.ts
import { promises as fs2 } from "fs";
import path from "path";
async function ensureDir(dirPath) {
  await fs2.mkdir(dirPath, { recursive: true });
}
async function fileExists(filePath) {
  try {
    await fs2.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function writeFileSafe(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs2.writeFile(filePath, content, "utf8");
}
async function replaceInFile(filePath, replacer) {
  const existing = await fs2.readFile(filePath, "utf8");
  const updated = replacer(existing);
  await fs2.writeFile(filePath, updated, "utf8");
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

// src/templates/ios/swiftui.ts
function renderProjectYml(projectName) {
  return `name: ${projectName}
options:
  bundleIdPrefix: com.example
  deploymentTarget:
    iOS: "17.0"
targets:
  ${projectName}:
    type: application
    platform: iOS
    sources:
      - ${projectName}
    info:
      path: ${projectName}/Info.plist
      properties:
        CFBundleDisplayName: ${projectName}
        CFBundleVersion: "1"
        CFBundleShortVersionString: "1.0.0"
        UILaunchScreen: {}
`;
}
function renderInfoPlist(projectName) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${projectName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UILaunchScreen</key>
  <dict/>
  <key>UISupportedInterfaceOrientations</key>
  <array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
  </array>
</dict>
</plist>
`;
}
function renderAppSwift(projectName) {
  return `import SwiftUI

@main
struct ${projectName}App: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}
`;
}
function renderContentView(projectName) {
  return `import SwiftUI

struct ContentView: View {
  var body: some View {
    VStack(spacing: 16) {
      Text("${projectName}")
        .font(.largeTitle)
        .fontWeight(.bold)
      Text("Scaffolded with create-dushin-stack")
        .font(.subheadline)
        .foregroundStyle(.secondary)
    }
    .padding()
  }
}

#Preview {
  ContentView()
}
`;
}

// src/templates/monorepo/files.ts
function renderMonorepoRootPackageJson(projectName, packageManager) {
  return {
    name: projectName,
    version: "0.1.0",
    private: true,
    packageManager: packageManager === "pnpm" ? "pnpm@10" : void 0,
    workspaces: ["apps/*", "packages/*"],
    scripts: {
      dev: `${packageManager} --filter @${projectName}/web dev`,
      build: `${packageManager} -r build`,
      typecheck: `${packageManager} -r typecheck`,
      lint: `${packageManager} -r lint`
    }
  };
}
function renderPnpmWorkspaceYaml() {
  return `packages:
  - apps/*
  - packages/*
`;
}
function renderMonorepoWebPackageJson(projectName, withTailwind) {
  return {
    name: `@${projectName}/web`,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc --noEmit && vite build",
      typecheck: "tsc --noEmit",
      lint: 'echo "No lint configured yet"'
    },
    dependencies: {
      react: "^19.2.4",
      "react-dom": "^19.2.4",
      [`@${projectName}/ui`]: "workspace:*"
    },
    devDependencies: {
      typescript: "^5.9.2",
      vite: "^8.0.4",
      "@types/react": "^19.2.2",
      "@types/react-dom": "^19.2.2",
      "@vitejs/plugin-react": "^6.0.1",
      ...withTailwind ? {
        tailwindcss: "^4.1.0",
        "@tailwindcss/vite": "^4.1.0"
      } : {}
    }
  };
}
function renderMonorepoWebTsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "baseUrl": "."
  },
  "include": ["src"]
}
`;
}
function renderMonorepoWebViteConfig(withTailwind) {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
${withTailwind ? 'import tailwindcss from "@tailwindcss/vite";\n' : ""}

export default defineConfig({
  plugins: [react()${withTailwind ? ", tailwindcss()" : ""}],
});
`;
}
function renderMonorepoWebIndexHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}
function renderMonorepoWebMain() {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
}
function renderMonorepoWebApp(projectName) {
  return `import { Button } from "@${projectName}/ui";

export default function App() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">${projectName}</h1>
      <p>Monorepo scaffold with apps/web and packages/ui</p>
      <Button>Shared UI Button</Button>
    </main>
  );
}
`;
}
function renderMonorepoWebCss(withTailwind) {
  if (withTailwind) {
    return `@import "tailwindcss";

body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
}
`;
  }
  return `body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
}
`;
}
function renderMonorepoUiPackageJson(projectName) {
  return {
    name: `@${projectName}/ui`,
    version: "0.1.0",
    private: true,
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    scripts: {
      build: "tsup src/index.tsx --format esm --dts --clean --target node20",
      typecheck: "tsc --noEmit",
      lint: 'echo "No lint configured yet"'
    },
    peerDependencies: {
      react: "^19.0.0"
    },
    devDependencies: {
      tsup: "^8.5.0",
      typescript: "^5.9.2",
      "@types/react": "^19.2.2"
    }
  };
}
function renderMonorepoUiTsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
`;
}
function renderMonorepoUiEntry() {
  return `import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        background: "white",
        padding: "10px 14px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
`;
}

// src/templates/node/hono.ts
function renderNodeApiPackageJson(projectName) {
  return {
    name: projectName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      build: "tsc --project tsconfig.json",
      start: "node dist/index.js",
      typecheck: "tsc --noEmit --project tsconfig.json"
    },
    dependencies: {
      "@hono/node-server": "^1.19.0",
      hono: "^4.10.4",
      zod: "^4.1.12"
    },
    devDependencies: {
      "@types/node": "^24.5.2",
      tsx: "^4.20.5",
      typescript: "^5.9.2"
    }
  };
}
function renderNodeApiTsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "outDir": "dist"
  },
  "include": ["src"]
}
`;
}
function renderNodeApiEntry() {
  return `import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/echo", async (c) => {
  const schema = z.object({
    message: z.string().min(1),
  });

  const body = schema.parse(await c.req.json());

  return c.json({
    echoed: body.message,
  });
});

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(\`API listening on http://localhost:\${info.port}\`);
  },
);
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
var TEMPLATE_LABELS = {
  "next-app": "Next.js App",
  "vite-react": "React + Vite",
  "vite-router-query": "Vite + Router + Query",
  "node-api-hono": "Node API (Hono)",
  "monorepo-web-ui": "Monorepo (web + ui)",
  "plugin-file": "Plugin template",
  "ios-swiftui": "iOS (SwiftUI)",
  "react-capacitor": "React + Capacitor (iOS/Android)"
};
function renderReadme(answers) {
  if (answers.template === "ios-swiftui") {
    return `# ${answers.projectName}

Scaffolded with create-dushin-stack.

## Template

- iOS (SwiftUI)

## Requirements

- Xcode 15+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen)

## Getting Started

\`\`\`bash
brew install xcodegen
xcodegen generate
open ${answers.projectName}.xcodeproj
\`\`\`
`;
  }
  if (answers.template === "react-capacitor") {
    const runCommand3 = answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`;
    return `# ${answers.projectName}

Scaffolded with create-dushin-stack.

## Template

- React + Capacitor (iOS/Android)

## Development

    ${runCommand3}

## Mobile

Sync web assets and open native projects:

    ${answers.packageManager} cap:sync
    ${answers.packageManager} cap:open:ios
    ${answers.packageManager} cap:open:android

## Notes

- Import alias: ${answers.importAlias}
`;
  }
  const runCommand2 = answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`;
  return `# ${answers.projectName}

Scaffolded with create-dushin-stack.

## Template

- ${TEMPLATE_LABELS[answers.template]}
- Preset: ${answers.preset}

## Stack

- ${answers.typescript ? "TypeScript" : "JavaScript"}
- ${answers.tailwind ? "Tailwind CSS" : "No Tailwind CSS"}
- ${answers.eslint ? "ESLint" : "No ESLint"}

## Development

Install dependencies if you skipped install during scaffolding, then run:

    ${runCommand2}

## Notes

- Import alias: ${answers.importAlias}
${answers.installSharedUi ? `- Shared UI package wired in: ${answers.sharedUiPackageName}
` : ""}`;
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
  const uiDir = base ? `${base}/ui` : "ui";
  const servicesDir = base ? `${base}/services` : "services";
  const utilsDir = base ? `${base}/utils` : "utils";
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
    },
    {
      path: `${uiDir}/README.md`,
      content: `# UI

Place shared UI primitives and design system components here.
`
    },
    {
      path: `${servicesDir}/README.md`,
      content: `# Services

Place API clients, data-fetching logic, and external service integrations here.
`
    },
    {
      path: `${utilsDir}/README.md`,
      content: `# Utils

Place general-purpose utility functions here.
`
    }
  ];
}

// src/templates/vite/router-query.ts
function renderRouterQueryMainTsx() {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
`;
}
function renderRouterQueryMainJsx() {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
`;
}
function renderRouterQueryAppTsx() {
  return `import { Link, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

function DashboardHome() {
  const status = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      return Promise.resolve({ status: "ok" as const });
    },
  });

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Dashboard Home</h2>
      <p className="text-sm text-slate-600">Query status: {status.data?.status ?? "loading"}</p>
    </section>
  );
}

function Reports() {
  return (
    <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Reports</h2>
      <p className="text-sm text-slate-600">Drop your chart cards and analytics widgets here.</p>
    </section>
  );
}

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dashboard preset</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vite + Router + Query</h1>
        </header>

        <nav className="flex gap-4 text-sm text-slate-700">
          <Link to="/">Home</Link>
          <Link to="/reports">Reports</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </main>
  );
}
`;
}
function renderRouterQueryAppJsx() {
  return `import { Link, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

function DashboardHome() {
  const status = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      return Promise.resolve({ status: "ok" });
    },
  });

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Dashboard Home</h2>
      <p className="text-sm text-slate-600">Query status: {status.data?.status ?? "loading"}</p>
    </section>
  );
}

function Reports() {
  return (
    <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Reports</h2>
      <p className="text-sm text-slate-600">Drop your chart cards and analytics widgets here.</p>
    </section>
  );
}

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dashboard preset</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vite + Router + Query</h1>
        </header>

        <nav className="flex gap-4 text-sm text-slate-700">
          <Link to="/">Home</Link>
          <Link to="/reports">Reports</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </main>
  );
}
`;
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
  server: {
    open: !process.env['NO_OPEN'],
  },
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
  server: {
    open: !process.env['NO_OPEN'],
  },
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
  if (answers.template === "next-app") {
    await createNextApp(answers, options.cwd, dryRun);
  } else if (answers.template === "vite-react" || answers.template === "vite-router-query") {
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
  const healthChecks = !dryRun && answers.runHealthChecks ? await runHealthChecks(answers, targetDir) : [];
  logger.success(`Finished scaffolding ${answers.projectName}`);
  logger.info("Next steps:");
  console.log(`  cd ${answers.projectName}`);
  if (answers.template === "ios-swiftui") {
    console.log("  brew install xcodegen");
    console.log("  xcodegen generate");
    console.log(`  open ${answers.projectName}.xcodeproj`);
  } else if (answers.template === "react-capacitor") {
    const devCmd = answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`;
    console.log(`  ${devCmd}`);
    console.log(`  ${answers.packageManager} cap:sync`);
    console.log(`  ${answers.packageManager} cap:open:ios`);
  } else {
    console.log(
      `  ${answers.packageManager === "npm" ? "npm run dev" : `${answers.packageManager} dev`}`
    );
  }
  return {
    projectName: answers.projectName,
    template: answers.template,
    framework: answers.framework,
    targetDir,
    dryRun,
    healthChecks
  };
}
async function assertTargetDirectoryAvailable(targetDir) {
  if (!await fileExists(targetDir)) {
    return;
  }
  const entries = await fs3.readdir(targetDir);
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
  logger.step("Create Vite app");
  console.log(`  ${[base[0], ...args].join(" ")}`);
  if (!dryRun) {
    await execa(base[0], args, {
      cwd,
      stdio: ["pipe", "inherit", "inherit"]
    });
  }
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
async function scaffoldNodeApiTemplate(answers, targetDir) {
  await ensureDir(path2.join(targetDir, "src"));
  await writeJson(
    path2.join(targetDir, "package.json"),
    renderNodeApiPackageJson(answers.projectName)
  );
  await writeFileSafe(path2.join(targetDir, "tsconfig.json"), renderNodeApiTsconfig());
  await writeFileSafe(path2.join(targetDir, "src", "index.ts"), renderNodeApiEntry());
  await writeFileSafe(path2.join(targetDir, ".gitignore"), renderGitIgnore());
  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, false);
  }
}
async function scaffoldMonorepoTemplate(answers, targetDir) {
  const appsWebDir = path2.join(targetDir, "apps", "web");
  const packagesUiDir = path2.join(targetDir, "packages", "ui");
  await ensureDir(path2.join(appsWebDir, "src"));
  await ensureDir(path2.join(packagesUiDir, "src"));
  await writeJson(
    path2.join(targetDir, "package.json"),
    renderMonorepoRootPackageJson(answers.projectName, answers.packageManager)
  );
  await writeFileSafe(path2.join(targetDir, "pnpm-workspace.yaml"), renderPnpmWorkspaceYaml());
  await writeFileSafe(path2.join(targetDir, ".gitignore"), renderGitIgnore());
  await writeJson(
    path2.join(appsWebDir, "package.json"),
    renderMonorepoWebPackageJson(answers.projectName, answers.tailwind)
  );
  await writeFileSafe(path2.join(appsWebDir, "tsconfig.json"), renderMonorepoWebTsconfig());
  await writeFileSafe(
    path2.join(appsWebDir, "vite.config.ts"),
    renderMonorepoWebViteConfig(answers.tailwind)
  );
  await writeFileSafe(path2.join(appsWebDir, "index.html"), renderMonorepoWebIndexHtml());
  await writeFileSafe(path2.join(appsWebDir, "src", "main.tsx"), renderMonorepoWebMain());
  await writeFileSafe(
    path2.join(appsWebDir, "src", "App.tsx"),
    renderMonorepoWebApp(answers.projectName)
  );
  await writeFileSafe(
    path2.join(appsWebDir, "src", "index.css"),
    renderMonorepoWebCss(answers.tailwind)
  );
  await writeJson(
    path2.join(packagesUiDir, "package.json"),
    renderMonorepoUiPackageJson(answers.projectName)
  );
  await writeFileSafe(path2.join(packagesUiDir, "tsconfig.json"), renderMonorepoUiTsconfig());
  await writeFileSafe(path2.join(packagesUiDir, "src", "index.tsx"), renderMonorepoUiEntry());
  if (answers.installDependencies) {
    await runProjectInstall(answers, targetDir, false);
  }
}
async function scaffoldPluginTemplate(answers, targetDir) {
  if (!answers.templateFile) {
    throw new Error("--template-file is required when using plugin-file template.");
  }
  const templateFile = await readPluginTemplateFile(answers.templateFile);
  await ensureDir(targetDir);
  for (const [relativePath, content] of Object.entries(templateFile.files)) {
    await writeFileSafe(path2.join(targetDir, relativePath), content);
  }
  if (templateFile.packageJson) {
    await writeJson(path2.join(targetDir, "package.json"), templateFile.packageJson);
  }
  if (answers.installDependencies && templateFile.packageJson) {
    await runProjectInstall(answers, targetDir, false);
  }
}
async function customizeProject(answers, targetDir) {
  logger.step("Applying project polish");
  if (answers.template !== "plugin-file" && answers.template !== "ios-swiftui") {
    await writeFileSafe(path2.join(targetDir, ".gitignore"), renderGitIgnore());
    await writeFileSafe(path2.join(targetDir, "README.md"), renderReadme(answers));
  }
  if (answers.template === "ios-swiftui") {
    await writeFileSafe(path2.join(targetDir, "README.md"), renderReadme(answers));
  }
  if (answers.template === "next-app") {
    await customizeNextProject(answers, targetDir);
  }
  if (answers.template === "vite-react" || answers.template === "vite-router-query" || answers.template === "react-capacitor") {
    await customizeViteProject(answers, targetDir);
  }
  if (answers.template === "react-capacitor") {
    await addCapacitorToProject(answers, targetDir);
  }
  if (answers.addStarterFolders && (answers.template === "next-app" || answers.template === "vite-react" || answers.template === "vite-router-query" || answers.template === "react-capacitor")) {
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
  const parsed = JSON.parse(await fs3.readFile(packageJsonPath, "utf8"));
  const existingDevDependencies = parsed.devDependencies ?? {};
  parsed.devDependencies = {
    ...existingDevDependencies,
    ...existingDevDependencies.tailwindcss ? {} : { tailwindcss: "^4.1.0" },
    ...existingDevDependencies["@tailwindcss/vite"] ? {} : { "@tailwindcss/vite": "^4.1.0" }
  };
  await fs3.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}
`);
}
async function ensureViteRouterQueryDependencies(answers, targetDir) {
  const packageJsonPath = path2.join(targetDir, "package.json");
  if (!await fileExists(packageJsonPath)) return;
  const parsed = JSON.parse(await fs3.readFile(packageJsonPath, "utf8"));
  const dependencies = parsed.dependencies ?? {};
  parsed.dependencies = {
    ...dependencies,
    ...dependencies["react-router-dom"] ? {} : { "react-router-dom": "^7.9.4" },
    ...dependencies["@tanstack/react-query"] ? {} : { "@tanstack/react-query": "^5.90.3" }
  };
  await fs3.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}
`);
  if (answers.installDependencies) {
    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      install[0],
      [...install.slice(1), "react-router-dom", "@tanstack/react-query"],
      {
        cwd: targetDir,
        dryRun: false,
        label: "Install router + query dependencies"
      }
    );
  }
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
  await writeFileSafe(path2.join(srcDir, "index.css"), renderIndexCss(answers.tailwind));
  if (answers.template === "vite-router-query") {
    await writeFileSafe(
      path2.join(srcDir, `App.${isTs ? "tsx" : "jsx"}`),
      isTs ? renderRouterQueryAppTsx() : renderRouterQueryAppJsx()
    );
    return;
  }
  await writeFileSafe(
    path2.join(srcDir, `App.${isTs ? "tsx" : "jsx"}`),
    isTs ? renderAppTsx(answers.tailwind) : renderAppJsx(answers.tailwind)
  );
}
async function updateViteEntryFile(targetDir, answers) {
  const srcDir = path2.join(targetDir, "src");
  const mainPath = path2.join(srcDir, `main.${answers.typescript ? "tsx" : "jsx"}`);
  if (!await fileExists(mainPath)) {
    return;
  }
  if (answers.template === "vite-router-query") {
    await writeFileSafe(
      mainPath,
      answers.typescript ? renderRouterQueryMainTsx() : renderRouterQueryMainJsx()
    );
    return;
  }
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
  await fs3.writeFile(jsconfigPath, `${JSON.stringify(config, null, 2)}
`, "utf8");
}
async function mergeCompilerOptionsIntoJson(filePath, incoming) {
  const parsed = parseJsonLike(await fs3.readFile(filePath, "utf8"));
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
  await fs3.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}
`, "utf8");
}
function normalizeAlias(importAlias) {
  return importAlias.endsWith("/*") ? importAlias : `${importAlias}/*`;
}
async function addViteAliasNote(targetDir, packageName) {
  const readmePath = path2.join(targetDir, "README.md");
  const current = await fs3.readFile(readmePath, "utf8");
  await fs3.writeFile(
    readmePath,
    `${current}
Shared UI package configured: \`${packageName}\`
`,
    "utf8"
  );
}
function parseJsonLike(input2) {
  const withoutBlockComments = input2.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(/(^|\s)\/\/.*$/gm, "");
  const withoutTrailingCommas = withoutLineComments.replace(/,\s*([}\]])/g, "$1");
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
async function runHealthChecks(answers, targetDir) {
  if (!answers.installDependencies) {
    logger.warn("Skipping health checks because dependencies were not installed.");
    return [
      {
        name: "health-checks",
        passed: false,
        message: "Dependencies not installed"
      }
    ];
  }
  const packageJsonPath = path2.join(targetDir, "package.json");
  if (!await fileExists(packageJsonPath)) {
    return [];
  }
  const pkg = JSON.parse(await fs3.readFile(packageJsonPath, "utf8"));
  const scripts = pkg.scripts ?? {};
  const checksToRun = ["lint", "typecheck", "build"];
  const results = [];
  for (const check of checksToRun) {
    if (!scripts[check]) {
      results.push({
        name: check,
        passed: true,
        message: "Script not defined; skipped."
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
        message: error instanceof Error ? error.message : "Unknown error"
      });
      break;
    }
  }
  for (const result of results) {
    if (result.passed) {
      logger.success(`Health check passed: ${result.name}`);
    } else {
      logger.error(`Health check failed: ${result.name}${result.message ? ` (${result.message})` : ""}`);
    }
  }
  return results;
}
async function runScript(packageManager, script, cwd) {
  const [command, ...args] = packageManagerRunScriptCommand(packageManager, script);
  await execa(command, args, {
    cwd,
    stdio: "inherit"
  });
}
function packageManagerRunScriptCommand(packageManager, script) {
  if (packageManager === "npm") {
    return ["npm", "run", script];
  }
  return [packageManager, script];
}
async function scaffoldIosSwiftUiTemplate(answers, targetDir) {
  const appDir = path2.join(targetDir, answers.projectName, "App");
  const viewsDir = path2.join(targetDir, answers.projectName, "Views");
  await ensureDir(appDir);
  await ensureDir(viewsDir);
  await writeFileSafe(path2.join(targetDir, "project.yml"), renderProjectYml(answers.projectName));
  await writeFileSafe(
    path2.join(targetDir, answers.projectName, "Info.plist"),
    renderInfoPlist(answers.projectName)
  );
  await writeFileSafe(
    path2.join(appDir, `${answers.projectName}App.swift`),
    renderAppSwift(answers.projectName)
  );
  await writeFileSafe(
    path2.join(viewsDir, "ContentView.swift"),
    renderContentView(answers.projectName)
  );
}
async function addCapacitorToProject(answers, targetDir) {
  const packageJsonPath = path2.join(targetDir, "package.json");
  if (!await fileExists(packageJsonPath)) return;
  const parsed = JSON.parse(await fs3.readFile(packageJsonPath, "utf8"));
  parsed.scripts = {
    ...parsed.scripts ?? {},
    "cap:sync": "cap sync",
    "cap:open:ios": "cap open ios",
    "cap:open:android": "cap open android"
  };
  parsed.dependencies = {
    ...parsed.dependencies ?? {},
    "@capacitor/core": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/android": "^7.0.0"
  };
  parsed.devDependencies = {
    ...parsed.devDependencies ?? {},
    "@capacitor/cli": "^7.0.0"
  };
  await fs3.writeFile(packageJsonPath, `${JSON.stringify(parsed, null, 2)}
`);
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
  await writeFileSafe(path2.join(targetDir, "capacitor.config.ts"), capacitorConfig);
  if (answers.installDependencies) {
    const install = PACKAGE_MANAGER_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      install[0],
      [
        ...install.slice(1),
        "@capacitor/core",
        "@capacitor/ios",
        "@capacitor/android"
      ],
      { cwd: targetDir, dryRun: false, label: "Install Capacitor dependencies" }
    );
    const devInstall = PACKAGE_MANAGER_DEV_INSTALL_COMMAND[answers.packageManager];
    await runCommand(
      devInstall[0],
      [...devInstall.slice(1), "@capacitor/cli"],
      { cwd: targetDir, dryRun: false, label: "Install Capacitor CLI" }
    );
  }
}
async function writeJson(filePath, value) {
  await writeFileSafe(filePath, `${JSON.stringify(value, null, 2)}
`);
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
var frameworks = ["next", "vite", "node", "monorepo", "ios", "mobile"];
var packageManagers = ["pnpm", "npm", "yarn", "bun"];
program.name("create-dushin-stack").description(
  "Scaffold polished templates for Next.js, Vite, APIs, and monorepos."
).argument("[project-name]", "Name of the project to create").option(
  "-f, --framework <framework>",
  "next, vite, node, or monorepo",
  parseChoice("framework", frameworks)
).option(
  "-t, --template <template>",
  `Template id (${TEMPLATE_IDS.join(", ")})`,
  parseChoice("template", TEMPLATE_IDS)
).option(
  "--preset <preset>",
  `starter, saas, content-site, or dashboard`,
  parseChoice("preset", presetIds)
).option(
  "--template-file <path>",
  "Path to a local plugin template JSON file"
).option(
  "-p, --package-manager <packageManager>",
  "pnpm, npm, yarn, or bun",
  parseChoice("package manager", packageManagers)
).option("--tailwind", "Include Tailwind CSS").option("--no-tailwind", "Skip Tailwind CSS").option("--typescript", "Use TypeScript").option("--no-typescript", "Use JavaScript instead").option("--eslint", "Include ESLint").option("--no-eslint", "Skip ESLint").option("--src-dir", "Use a src/ directory").option("--no-src-dir", "Do not use a src/ directory").option("--app-router", "Use Next.js App Router").option("--no-app-router", "Do not use Next.js App Router").option("--import-alias <alias>", "Import alias to configure").option("--shared-ui", "Install a shared UI package").option("--no-shared-ui", "Skip shared UI package wiring").option("--shared-ui-package-name <name>", "The package name used in imports").option(
  "--shared-ui-package-source <source>",
  "The install source for the shared UI package"
).option("--starter-folders", "Add starter folders and example files").option("--no-starter-folders", "Skip starter folders and example files").option("--git", "Initialize git").option("--no-git", "Skip git initialization").option("--install", "Install dependencies").option("--no-install", "Skip dependency installation").option("--health-checks", "Run lint/typecheck/build after scaffolding").option("--no-health-checks", "Skip post-scaffold health checks").option("--json", "Print final scaffold summary as JSON").option("-y, --yes", "Use defaults for any unanswered prompts").option("--dry-run", "Print the commands without executing them").action(async (projectName, options) => {
  try {
    logger.banner();
    const answers = await collectAnswers({
      projectName,
      framework: options.framework,
      template: options.template,
      preset: options.preset,
      templateFile: options.templateFile,
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
      runHealthChecks: optionValue(options, "healthChecks"),
      jsonOutput: Boolean(options.json),
      yes: Boolean(options.yes)
    });
    const result = await scaffoldProject(answers, {
      cwd: process.cwd(),
      dryRun: Boolean(options.dryRun)
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

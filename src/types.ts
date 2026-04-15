export type Framework =
  | "next"
  | "vite"
  | "node"
  | "monorepo"
  | "plugin"
  | "ios"
  | "mobile";
export type TemplateId =
  | "next-app"
  | "vite-react"
  | "vite-router-query"
  | "node-api-hono"
  | "monorepo-web-ui"
  | "plugin-file"
  | "ios-swiftui"
  | "react-capacitor";
export type PresetId = "starter" | "saas" | "content-site" | "dashboard";
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export interface Answers {
  projectName: string;
  framework: Framework;
  template: TemplateId;
  preset: PresetId;
  templateFile: string;
  packageManager: PackageManager;
  typescript: boolean;
  tailwind: boolean;
  eslint: boolean;
  useSrcDir: boolean;
  useAppRouter: boolean;
  importAlias: string;
  installSharedUi: boolean;
  sharedUiPackageName: string;
  sharedUiPackageSource: string;
  addStarterFolders: boolean;
  initializeGit: boolean;
  installDependencies: boolean;
  runHealthChecks: boolean;
  jsonOutput: boolean;
}

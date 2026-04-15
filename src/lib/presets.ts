import type { PresetId, TemplateId } from "../types.js";

export interface PresetDefaults {
  template: TemplateId;
  typescript: boolean;
  tailwind: boolean;
  eslint: boolean;
  useSrcDir: boolean;
  useAppRouter: boolean;
  installSharedUi: boolean;
  sharedUiPackageName: string;
  sharedUiPackageSource: string;
  addStarterFolders: boolean;
  initializeGit: boolean;
  installDependencies: boolean;
  runHealthChecks: boolean;
}

export const PRESET_DEFAULTS: Record<PresetId, PresetDefaults> = {
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
    runHealthChecks: true,
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
    runHealthChecks: true,
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
    runHealthChecks: true,
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
    runHealthChecks: true,
  },
};

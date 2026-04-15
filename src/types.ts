export type Framework = 'next' | 'vite';
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export interface Answers {
  projectName: string;
  framework: Framework;
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
}

import validatePackageName from 'validate-npm-package-name';

export function validateProjectName(name: string): true | string {
  if (!name.trim()) {
    return 'Project name is required.';
  }

  const validation = validatePackageName(name);
  if (validation.validForNewPackages) {
    return true;
  }

  const errors = [
    ...(validation.errors ?? []),
    ...(validation.warnings ?? []),
  ];

  return errors[0] ?? 'Please provide a valid npm package name.';
}

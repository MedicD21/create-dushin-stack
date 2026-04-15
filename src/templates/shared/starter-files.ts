import type { Answers } from '../../types.js';

function getBaseDir(answers: Answers) {
  if (answers.framework === 'next') {
    return answers.useSrcDir ? 'src' : '';
  }
  return answers.useSrcDir ? 'src' : 'src';
}

export function getStarterFiles(answers: Answers): Array<{ path: string; content: string }> {
  const base = getBaseDir(answers);
  const libDir = base ? `${base}/lib` : 'lib';
  const componentsDir = base ? `${base}/components` : 'components';
  const hooksDir = base ? `${base}/hooks` : 'hooks';

  const buttonImport = answers.framework === 'next'
    ? `import { cn } from '${answers.useSrcDir ? '@/lib/cn' : '@/lib/cn'}';`
    : `import { cn } from '${libDir === 'src/lib' ? '../lib/cn' : '../lib/cn'}';`;

  return [
    {
      path: `${libDir}/cn.${answers.typescript ? 'ts' : 'js'}`,
      content: `${answers.typescript ? 'export function cn(...inputs: Array<string | false | null | undefined>) {' : 'export function cn(...inputs) {'}
  return inputs.filter(Boolean).join(' ');
}
`,
    },
    {
      path: `${componentsDir}/button.${answers.typescript ? 'tsx' : 'jsx'}`,
      content: `${buttonImport}

${answers.typescript ? 'type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;' : ''}

export function Button(${answers.typescript ? '{ className, ...props }: ButtonProps' : '{ className, ...props }'}) {
  return (
    <button
      className={cn('inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition', ${answers.tailwind ? `'bg-black text-white hover:opacity-90'` : `''`}, className)}
      {...props}
    />
  );
}
`,
    },
    {
      path: `${hooksDir}/README.md`,
      content: `# Hooks

Place reusable hooks here.
`,
    },
    {
      path: `${componentsDir}/README.md`,
      content: `# Components

Place app-specific components here. Reusable cross-project components belong in your shared UI package.
`,
    },
  ];
}

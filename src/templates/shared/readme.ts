import type { Answers } from "../../types.js";

export function renderReadme(answers: Answers) {
  const frameworkLabel =
    answers.framework === "next" ? "Next.js" : "React + Vite";
  const runCommand =
    answers.packageManager === "npm"
      ? "npm run dev"
      : `${answers.packageManager} dev`;

  return `# ${answers.projectName}

Scaffolded with create-dushin-stack.

## Stack

- ${frameworkLabel}
- ${answers.typescript ? "TypeScript" : "JavaScript"}
- ${answers.tailwind ? "Tailwind CSS" : "No Tailwind CSS"}
- ${answers.eslint ? "ESLint" : "No ESLint"}

## Development

Install dependencies if you skipped install during scaffolding, then run:

    ${runCommand}

## Notes

- Import alias: \
${answers.importAlias}\
${
  answers.installSharedUi
    ? `- Shared UI package wired in: \
${answers.sharedUiPackageName}\
`
    : ""
}`;
}

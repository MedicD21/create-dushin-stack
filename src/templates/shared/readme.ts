import type { Answers } from "../../types.js";

const TEMPLATE_LABELS: Record<Answers["template"], string> = {
  "next-app": "Next.js App",
  "vite-react": "React + Vite",
  "vite-router-query": "Vite + Router + Query",
  "node-api-hono": "Node API (Hono)",
  "monorepo-web-ui": "Monorepo (web + ui)",
  "plugin-file": "Plugin template",
};

export function renderReadme(answers: Answers) {
  const runCommand =
    answers.packageManager === "npm"
      ? "npm run dev"
      : `${answers.packageManager} dev`;

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

    ${runCommand}

## Notes

- Import alias: ${answers.importAlias}
${
  answers.installSharedUi
    ? `- Shared UI package wired in: ${answers.sharedUiPackageName}\n`
    : ""
}`;
}

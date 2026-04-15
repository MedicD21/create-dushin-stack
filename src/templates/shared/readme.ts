import type { Answers } from "../../types.js";

const TEMPLATE_LABELS: Record<Answers["template"], string> = {
  "next-app": "Next.js App",
  "vite-react": "React + Vite",
  "vite-router-query": "Vite + Router + Query",
  "node-api-hono": "Node API (Hono)",
  "monorepo-web-ui": "Monorepo (web + ui)",
  "plugin-file": "Plugin template",
  "ios-swiftui": "iOS (SwiftUI)",
  "react-capacitor": "React + Capacitor (iOS/Android)",
};

export function renderReadme(answers: Answers) {
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
    const runCommand =
      answers.packageManager === "npm"
        ? "npm run dev"
        : `${answers.packageManager} dev`;
    return `# ${answers.projectName}

Scaffolded with create-dushin-stack.

## Template

- React + Capacitor (iOS/Android)

## Development

    ${runCommand}

## Mobile

Sync web assets and open native projects:

    ${answers.packageManager} cap:sync
    ${answers.packageManager} cap:open:ios
    ${answers.packageManager} cap:open:android

## Notes

- Import alias: ${answers.importAlias}
`;
  }

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

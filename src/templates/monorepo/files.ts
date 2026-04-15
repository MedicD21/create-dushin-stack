export function renderMonorepoRootPackageJson(projectName: string, packageManager: string) {
  return {
    name: projectName,
    version: "0.1.0",
    private: true,
    packageManager: packageManager === "pnpm" ? "pnpm@10" : undefined,
    workspaces: ["apps/*", "packages/*"],
    scripts: {
      dev: `${packageManager} --filter @${projectName}/web dev`,
      build: `${packageManager} -r build`,
      typecheck: `${packageManager} -r typecheck`,
      lint: `${packageManager} -r lint`,
    },
  };
}

export function renderPnpmWorkspaceYaml() {
  return `packages:\n  - apps/*\n  - packages/*\n`;
}

export function renderMonorepoWebPackageJson(projectName: string, withTailwind: boolean) {
  return {
    name: `@${projectName}/web`,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc --noEmit && vite build",
      typecheck: "tsc --noEmit",
      lint: "echo \"No lint configured yet\"",
    },
    dependencies: {
      react: "^19.2.4",
      "react-dom": "^19.2.4",
      [`@${projectName}/ui`]: "workspace:*",
    },
    devDependencies: {
      typescript: "^5.9.2",
      vite: "^8.0.4",
      "@types/react": "^19.2.2",
      "@types/react-dom": "^19.2.2",
      "@vitejs/plugin-react": "^6.0.1",
      ...(withTailwind
        ? {
            tailwindcss: "^4.1.0",
            "@tailwindcss/vite": "^4.1.0",
          }
        : {}),
    },
  };
}

export function renderMonorepoWebTsconfig() {
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

export function renderMonorepoWebViteConfig(withTailwind: boolean) {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
${withTailwind ? 'import tailwindcss from "@tailwindcss/vite";\n' : ""}

export default defineConfig({
  plugins: [react()${withTailwind ? ", tailwindcss()" : ""}],
});
`;
}

export function renderMonorepoWebIndexHtml() {
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

export function renderMonorepoWebMain() {
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

export function renderMonorepoWebApp(projectName: string) {
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

export function renderMonorepoWebCss(withTailwind: boolean) {
  if (withTailwind) {
    return `@import "tailwindcss";\n\nbody {\n  margin: 0;\n  font-family: Inter, system-ui, sans-serif;\n}\n`;
  }

  return `body {\n  margin: 0;\n  font-family: Inter, system-ui, sans-serif;\n}\n`;
}

export function renderMonorepoUiPackageJson(projectName: string) {
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
      lint: "echo \"No lint configured yet\"",
    },
    peerDependencies: {
      react: "^19.0.0",
    },
    devDependencies: {
      tsup: "^8.5.0",
      typescript: "^5.9.2",
      "@types/react": "^19.2.2",
    },
  };
}

export function renderMonorepoUiTsconfig() {
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

export function renderMonorepoUiEntry() {
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

function resolveAliasKey(importAlias: string) {
  return importAlias.replace(/\/\*$/, "");
}

export function renderViteConfigTs(withTailwind: boolean, importAlias: string) {
  const aliasKey = resolveAliasKey(importAlias);

  return `import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
${
  withTailwind
    ? `import tailwindcss from '@tailwindcss/vite';
`
    : ""
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()${withTailwind ? ", tailwindcss()" : ""}],
  resolve: {
    alias: {
      '${aliasKey}': path.resolve(__dirname, 'src'),
    },
  },
});
`;
}

export function renderViteConfigJs(withTailwind: boolean, importAlias: string) {
  const aliasKey = resolveAliasKey(importAlias);

  return `import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
${
  withTailwind
    ? `import tailwindcss from '@tailwindcss/vite';
`
    : ""
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()${withTailwind ? ", tailwindcss()" : ""}],
  resolve: {
    alias: {
      '${aliasKey}': path.resolve(__dirname, 'src'),
    },
  },
});
`;
}

export function renderIndexCss(withTailwind: boolean) {
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

export function renderAppTsx(withTailwind: boolean) {
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

export function renderAppJsx(withTailwind: boolean) {
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

export function renderTsConfigPaths(importAlias: string) {
  return {
    compilerOptions: {
      baseUrl: ".",
      paths: {
        [importAlias]: ["src/*"],
      },
    },
  };
}

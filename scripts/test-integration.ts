import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";

async function main() {
  await execa("pnpm", ["-s", "build"], { stdio: "inherit" });

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "create-dushin-stack-"));

  try {
    await testViteReact(tempRoot);
    await testViteRouterQuery(tempRoot);
    await testNodeApi(tempRoot);
    await testMonorepo(tempRoot);
    await testPluginTemplate(tempRoot);
    await testIosSwiftui(tempRoot);
    await testReactCapacitor(tempRoot);
    console.log("Integration checks passed.");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

async function runCli(
  cwd: string,
  args: string[],
) {
  await execa("node", [path.resolve("dist/index.js"), ...args], {
    cwd,
    stdio: "inherit",
  });
}

async function read(filePath: string) {
  return fs.readFile(filePath, "utf8");
}

async function testViteReact(tempRoot: string) {
  const projectName = "vite-react-case";
  await runCli(tempRoot, [
    projectName,
    "--template",
    "vite-react",
    "--package-manager",
    "pnpm",
    "--tailwind",
    "--typescript",
    "--no-install",
    "--no-git",
    "--no-shared-ui",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  const viteConfig = await read(path.join(projectDir, "vite.config.ts"));
  const indexCss = await read(path.join(projectDir, "src", "index.css"));

  assert.match(viteConfig, /@tailwindcss\/vite/);
  assert.match(indexCss, /@import "tailwindcss"/);
}

async function testViteRouterQuery(tempRoot: string) {
  const projectName = "vite-router-query-case";
  await runCli(tempRoot, [
    projectName,
    "--template",
    "vite-router-query",
    "--package-manager",
    "pnpm",
    "--tailwind",
    "--typescript",
    "--no-install",
    "--no-git",
    "--no-shared-ui",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  const packageJson = JSON.parse(await read(path.join(projectDir, "package.json"))) as {
    dependencies?: Record<string, string>;
  };
  const main = await read(path.join(projectDir, "src", "main.tsx"));

  assert.equal(Boolean(packageJson.dependencies?.["react-router-dom"]), true);
  assert.equal(Boolean(packageJson.dependencies?.["@tanstack/react-query"]), true);
  assert.match(main, /QueryClientProvider/);
}

async function testNodeApi(tempRoot: string) {
  const projectName = "node-api-case";
  await runCli(tempRoot, [
    projectName,
    "--template",
    "node-api-hono",
    "--package-manager",
    "pnpm",
    "--no-install",
    "--no-git",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  const entry = await read(path.join(projectDir, "src", "index.ts"));
  const packageJson = JSON.parse(await read(path.join(projectDir, "package.json"))) as {
    dependencies?: Record<string, string>;
  };

  assert.match(entry, /new Hono/);
  assert.equal(Boolean(packageJson.dependencies?.hono), true);
}

async function testMonorepo(tempRoot: string) {
  const projectName = "monorepo-case";
  await runCli(tempRoot, [
    projectName,
    "--template",
    "monorepo-web-ui",
    "--package-manager",
    "pnpm",
    "--tailwind",
    "--no-install",
    "--no-git",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  const rootPackageJson = JSON.parse(await read(path.join(projectDir, "package.json"))) as {
    workspaces?: string[];
  };

  assert.deepEqual(rootPackageJson.workspaces, ["apps/*", "packages/*"]);
  assert.equal(
    await fileExists(path.join(projectDir, "apps", "web", "vite.config.ts")),
    true,
  );
  assert.equal(
    await fileExists(path.join(projectDir, "packages", "ui", "src", "index.tsx")),
    true,
  );
}

async function testPluginTemplate(tempRoot: string) {
  const projectName = "plugin-template-case";
  const pluginTemplatePath = path.join(tempRoot, "plugin-template.json");

  await fs.writeFile(
    pluginTemplatePath,
    JSON.stringify(
      {
        id: "demo-plugin",
        files: {
          "README.md": "# Plugin Template\n",
          "src/index.ts": "export const pluginTemplate = true;\n",
        },
        packageJson: {
          name: "plugin-template",
          version: "0.0.0",
          private: true,
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  await runCli(tempRoot, [
    projectName,
    "--template-file",
    pluginTemplatePath,
    "--package-manager",
    "pnpm",
    "--no-install",
    "--no-git",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  assert.equal(await fileExists(path.join(projectDir, "README.md")), true);
  assert.equal(await fileExists(path.join(projectDir, "src", "index.ts")), true);
}

async function testIosSwiftui(tempRoot: string) {
  const projectName = "ios-swiftui-case";
  await runCli(tempRoot, [
    projectName,
    "--template",
    "ios-swiftui",
    "--package-manager",
    "pnpm",
    "--no-install",
    "--no-git",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  const projectYml = await read(path.join(projectDir, "project.yml"));
  const appSwift = await read(
    path.join(projectDir, projectName, "App", `${projectName}App.swift`),
  );
  const contentView = await read(
    path.join(projectDir, projectName, "Views", "ContentView.swift"),
  );

  assert.match(projectYml, /name:/);
  assert.match(appSwift, /@main/);
  assert.match(contentView, /ContentView/);
}

async function testReactCapacitor(tempRoot: string) {
  const projectName = "react-capacitor-case";
  await runCli(tempRoot, [
    projectName,
    "--template",
    "react-capacitor",
    "--package-manager",
    "pnpm",
    "--typescript",
    "--no-install",
    "--no-git",
    "--no-health-checks",
    "--yes",
  ]);

  const projectDir = path.join(tempRoot, projectName);
  const capacitorConfig = await read(path.join(projectDir, "capacitor.config.ts"));
  const packageJson = JSON.parse(await read(path.join(projectDir, "package.json"))) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  assert.match(capacitorConfig, /@capacitor\/cli/);
  assert.equal(Boolean(packageJson.dependencies?.["@capacitor/core"]), true);
  assert.equal(Boolean(packageJson.dependencies?.["@capacitor/ios"]), true);
  assert.equal(Boolean(packageJson.dependencies?.["@capacitor/android"]), true);
  assert.equal(Boolean(packageJson.devDependencies?.["@capacitor/cli"]), true);
  assert.equal(Boolean(packageJson.scripts?.["cap:sync"]), true);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

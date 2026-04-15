export function renderNodeApiPackageJson(projectName: string) {
  return {
    name: projectName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      build: "tsc --project tsconfig.json",
      start: "node dist/index.js",
      typecheck: "tsc --noEmit --project tsconfig.json",
    },
    dependencies: {
      "@hono/node-server": "^1.19.0",
      hono: "^4.10.4",
      zod: "^4.1.12",
    },
    devDependencies: {
      "@types/node": "^24.5.2",
      tsx: "^4.20.5",
      typescript: "^5.9.2",
    },
  };
}

export function renderNodeApiTsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "outDir": "dist"
  },
  "include": ["src"]
}
`;
}

export function renderNodeApiEntry() {
  return `import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/echo", async (c) => {
  const schema = z.object({
    message: z.string().min(1),
  });

  const body = schema.parse(await c.req.json());

  return c.json({
    echoed: body.message,
  });
});

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(\`API listening on http://localhost:\${info.port}\`);
  },
);
`;
}

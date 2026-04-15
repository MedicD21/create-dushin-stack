# create-dushin-stack

A production-minded `create-*` CLI for bootstrapping projects with consistent defaults, templates, and CI-safe automation.

## Why this is different

- Built-in templates for web apps, APIs, and monorepos
- Presets for common outcomes (`starter`, `saas`, `content-site`, `dashboard`)
- Post-scaffold health checks (`lint`, `typecheck`, `build`)
- Integration test harness to prevent template regressions
- Release automation with Changesets

## Template matrix

| Template ID | Stack | Best for |
| --- | --- | --- |
| `next-app` | Next.js + App Router | SaaS apps, content sites |
| `vite-react` | React + Vite | Lean SPAs |
| `vite-router-query` | React + Vite + React Router + TanStack Query | Dashboards and data-heavy SPAs |
| `node-api-hono` | Node + Hono + Zod | Type-safe API services |
| `monorepo-web-ui` | Workspace with `apps/web` + `packages/ui` | Product teams sharing UI packages |
| `plugin-file` | Local JSON-defined template | Internal team templates/extensions |

Full generated-file reference: [docs/templates.md](docs/templates.md)

## Presets

- `starter`: Balanced defaults for general projects
- `saas`: Next.js + shared UI + strict defaults
- `content-site`: Next.js content-oriented setup
- `dashboard`: Vite + Router + Query setup

## Install locally while building

```bash
pnpm install
pnpm build
pnpm link --global
```

Then run:

```bash
create-dushin-stack
```

Or with npm initializer pattern:

```bash
npm init dushin-stack@latest my-app
```

## Example commands

```bash
# interactive
create-dushin-stack

# explicit template + preset
create-dushin-stack my-app --template next-app --preset saas --package-manager pnpm

# dashboard starter
create-dushin-stack analytics --template vite-router-query --preset dashboard --yes

# API starter
create-dushin-stack api --template node-api-hono --package-manager pnpm --yes

# monorepo starter
create-dushin-stack acme --template monorepo-web-ui --package-manager pnpm --yes

# fully non-interactive
create-dushin-stack my-app --template vite-react --no-shared-ui --yes --dry-run
```

## Plugin template file

You can scaffold from a local JSON template file using `--template-file`:

```json
{
  "id": "acme-internal",
  "files": {
    "README.md": "# Internal starter\n",
    "src/index.ts": "export const ready = true;\n"
  },
  "packageJson": {
    "name": "internal-template",
    "private": true,
    "version": "0.0.0"
  }
}
```

Then run:

```bash
create-dushin-stack my-app --template-file ./acme-template.json --yes
```

## Quality workflow

```bash
pnpm typecheck
pnpm test:integration
pnpm build
```

CI (`.github/workflows/ci.yml`) runs:

- install
- typecheck
- build
- integration tests
- smoke dry-runs for Next and Vite

## Release workflow

- Changesets config: `.changeset/config.json`
- Release workflow: `.github/workflows/release.yml`
- Required secrets for publish on `main`:
  - `NPM_TOKEN`
  - `GITHUB_TOKEN` (provided by Actions)

## Notes

- Use `--health-checks` to run post-scaffold checks automatically.
- Use `--json` for machine-readable output in scripts/automation.

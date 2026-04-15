# create-dushin-stack

An interactive `create-*` CLI for bootstrapping polished React projects with your preferred stack defaults.

## Features

- Interactive menus with sensible defaults
- Next.js or React + Vite
- TypeScript or JavaScript
- Tailwind CSS toggle
- ESLint toggle
- App Router and `src/` dir options for Next.js
- Optional project wiring for a shared UI package
- Optional opinionated starter folders and example files
- Works with pnpm, npm, yarn, or bun
- Dry-run mode for testing

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

Or with npm's initializer pattern:

```bash
npm init dushin-stack@latest my-app
```

## Example commands

```bash
create-dushin-stack
create-dushin-stack my-app --framework next --package-manager pnpm
create-dushin-stack my-app --framework vite --no-tailwind --dry-run
create-dushin-stack my-app --framework vite --package-manager pnpm --no-shared-ui --yes
```

## Publish later

When you are ready to publish, remove `private` if you add it, publish to npm as `create-dushin-stack`, and users can run:

```bash
npm init dushin-stack@latest my-app
pnpm create dushin-stack my-app
```

## Non-interactive usage

When you want to run this in scripts or CI, pass the options explicitly and add `--yes` to accept defaults for any remaining prompts.

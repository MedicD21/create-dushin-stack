# create-morgan-stack

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
create-morgan-stack
```

Or with npm's initializer pattern:

```bash
npm init morgan-stack@latest my-app
```

## Example commands

```bash
create-morgan-stack
create-morgan-stack my-app --framework next --package-manager pnpm
create-morgan-stack my-app --framework vite --no-tailwind --dry-run
```

## Publish later

When you are ready to publish, remove `private` if you add it, publish to npm as `create-morgan-stack`, and users can run:

```bash
npm init morgan-stack@latest my-app
pnpm create morgan-stack my-app
```

## Why this shape?

npm's `create-*` initializer pattern maps `npm init foo` to `npx create-foo`, and npm/Node support executable package bins via the `bin` field in `package.json`. Next.js recommends `create-next-app` for new projects, and Tailwind's current Vite guide recommends the `@tailwindcss/vite` plugin for Vite projects. citeturn796738view2turn252303search8turn796738view1turn796738view0

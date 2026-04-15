import type { Framework, PresetId, TemplateId } from "../types.js";

export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  description: string;
  framework: Framework;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: "next-app",
    label: "Next.js App",
    description: "Great for SaaS apps and content sites with full-stack React.",
    framework: "next",
  },
  {
    id: "vite-react",
    label: "React + Vite",
    description: "Fast SPA setup with TypeScript and optional Tailwind.",
    framework: "vite",
  },
  {
    id: "vite-router-query",
    label: "Vite + Router + Query",
    description: "React + Vite with React Router and TanStack Query prewired.",
    framework: "vite",
  },
  {
    id: "node-api-hono",
    label: "Node API (Hono)",
    description: "Type-safe API starter with Hono + Zod.",
    framework: "node",
  },
  {
    id: "monorepo-web-ui",
    label: "Monorepo (web + ui)",
    description: "Workspace starter with apps/web and packages/ui.",
    framework: "monorepo",
  },
  {
    id: "ios-swiftui",
    label: "iOS (SwiftUI)",
    description: "Native iOS app with SwiftUI, XcodeGen project.yml.",
    framework: "ios",
  },
  {
    id: "react-capacitor",
    label: "React + Capacitor (iOS/Android)",
    description: "React + Vite app with Capacitor for iOS and Android.",
    framework: "mobile",
  },
];

export const TEMPLATE_IDS = TEMPLATE_DEFINITIONS.map((t) => t.id);
export const PRESET_IDS: PresetId[] = [
  "starter",
  "saas",
  "content-site",
  "dashboard",
];

export function templateFromFramework(framework: Framework): TemplateId {
  switch (framework) {
    case "next":
      return "next-app";
    case "vite":
      return "vite-react";
    case "node":
      return "node-api-hono";
    case "monorepo":
      return "monorepo-web-ui";
    case "plugin":
      return "plugin-file";
    case "ios":
      return "ios-swiftui";
    case "mobile":
      return "react-capacitor";
  }
}

export function frameworkFromTemplate(template: TemplateId): Framework {
  if (template === "plugin-file") return "plugin";
  if (template === "ios-swiftui") return "ios";
  if (template === "react-capacitor") return "mobile";
  const found = TEMPLATE_DEFINITIONS.find((entry) => entry.id === template);
  return found?.framework ?? "vite";
}

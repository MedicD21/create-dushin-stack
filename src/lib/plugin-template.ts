import { promises as fs } from "node:fs";

export interface PluginTemplateFile {
  id?: string;
  description?: string;
  files: Record<string, string>;
  packageJson?: Record<string, unknown>;
}

export async function readPluginTemplateFile(
  filePath: string,
): Promise<PluginTemplateFile> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as PluginTemplateFile;

  if (!parsed.files || typeof parsed.files !== "object") {
    throw new Error("Plugin template must provide a files object.");
  }

  return parsed;
}

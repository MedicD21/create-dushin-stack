import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeFileSafe(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

export async function prependFile(filePath: string, content: string) {
  const existing = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, `${content}${existing}`, 'utf8');
}

export async function replaceInFile(filePath: string, replacer: (input: string) => string) {
  const existing = await fs.readFile(filePath, 'utf8');
  const updated = replacer(existing);
  await fs.writeFile(filePath, updated, 'utf8');
}

export function renderGitIgnore() {
  return `# dependencies\nnode_modules\n\n# production\ndist\nbuild\n.next\ncoverage\n\n# logs\n*.log\n\n# env\n.env\n.env.local\n.env.*.local\n\n# misc\n.DS_Store\n.vscode\n`;
}

import pc from "picocolors";

export const logger = {
  info(message: string) {
    console.log(pc.cyan("ℹ"), message);
  },
  step(message: string) {
    console.log(pc.blue("→"), message);
  },
  success(message: string) {
    console.log(pc.green("✓"), message);
  },
  warn(message: string) {
    console.warn(pc.yellow("▲"), message);
  },
  error(message: string) {
    console.error(pc.red("✖"), message);
  },
  banner() {
    console.log(pc.bold(pc.magenta("\ncreate-dushin-stack\n")));
    console.log(
      pc.dim("Scaffold a clean React app with your preferred defaults.\n"),
    );
  },
};

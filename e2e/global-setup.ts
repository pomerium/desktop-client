import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

// In an unpackaged build the app runs the CLI from assets/bin
// (src/main/binaries.ts), but `npm run download` saves it under system_files/.
// Copy the right one into place unless a CLI is already there (for example a
// symlink to a local CLI build from `npm run dev-setup`).
const ensureCli = () => {
  const exe = process.platform === "win32" ? "pomerium-cli.exe" : "pomerium-cli";
  const target = path.join(repoRoot, "assets", "bin", exe);
  if (fs.existsSync(target)) return;

  const platform = { darwin: "mac", win32: "win", linux: "linux" }[process.platform as string];
  const arch = process.arch === "x64" ? "x64" : process.arch;
  const source = path.join(repoRoot, "system_files", platform ?? "", arch, "bin", exe);
  if (!fs.existsSync(source)) {
    throw new Error(`pomerium-cli not found at ${source}. Run \`npm run download\` first.`);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  fs.chmodSync(target, 0o755);
};

export default function globalSetup() {
  // A packaged app (E2E_APP_EXECUTABLE) bundles its own CLI and build.
  if (process.env.E2E_APP_EXECUTABLE) return;
  if (!fs.existsSync(path.join(repoRoot, "out", "main", "index.js"))) {
    throw new Error("No build output in out/. Run `npm run build` first.");
  }
  ensureCli();
}

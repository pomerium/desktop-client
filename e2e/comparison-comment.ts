// Builds the release comparison PR comment from two screenshot runs of
// screenshots.spec.ts. Used by .github/workflows/e2e.yml:
//
//   npx tsx e2e/comparison-comment.ts <shots dir> <image base url> > body.md
//
// <shots dir> holds release/ and pr/, each with meta.json and the PNGs.
// <image base url> is where those two folders are published.
import fs from "node:fs";
import path from "node:path";

export const MARKER = "<!-- e2e-release-comparison -->";

const PAGES: Array<[file: string, label: string]> = [
  ["manage", "Manage connections"],
  ["new-connection", "New connection form"],
  ["load", "Load connections"],
  ["view", "Connection view"],
  ["connected", "Connected, with Logs"],
  ["manage-dark-420", "Dark mode, 420px wide"],
];

type Meta = { version: string; cliVersion: string };

const [shotsDir, baseUrl] = process.argv.slice(2);
if (!shotsDir || !baseUrl) {
  console.error("usage: comparison-comment.ts <shots dir> <image base url>");
  process.exit(2);
}

const readMeta = (build: string): Meta =>
  JSON.parse(fs.readFileSync(path.join(shotsDir, build, "meta.json"), "utf8"));

const release = readMeta("release");
const pr = readMeta("pr");
const releaseTag = process.env.RELEASE_TAG || release.version;
const prLabel = process.env.PR_LABEL || "this PR";
const runUrl = process.env.RUN_URL;

const img = (build: string, file: string, alt: string) =>
  fs.existsSync(path.join(shotsDir, build, `${file}.png`))
    ? `![${alt}](${baseUrl}/${build}/${file}.png)`
    : "_not captured_";

const rows = PAGES.flatMap(([file, label]) => [
  `| **${label}** | |`,
  `| ${img("release", file, `${releaseTag} ${label}`)} | ${img("pr", file, `${prLabel} ${label}`)} |`,
]);

const body = [
  MARKER,
  `## Screenshots: ${releaseTag} vs ${prLabel} (macOS arm64)`,
  "",
  "Both builds are driven by Playwright in fresh profiles (`e2e/screenshots.spec.ts`):",
  `- **${releaseTag}:** the latest published release DMG (app ${release.version}, CLI ${release.cliVersion})`,
  `- **${prLabel}:** this PR's build (app ${pr.version}, CLI ${pr.cliVersion})`,
  "",
  `| ${releaseTag} | ${prLabel} |`,
  "|---|---|",
  ...rows,
  "",
  runUrl
    ? `Updated on every push. [Workflow run](${runUrl}), which also has the layout checks' screenshots as artifacts.`
    : "Updated on every push.",
].join("\n");

process.stdout.write(`${body}\n`);

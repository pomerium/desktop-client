import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import releaseFixture from "./fixtures/windows-package-metadata/github-release-v0.33.0.json";
import {
  fetchWindowsRelease,
  renderWindowsPackageMetadata,
  resolveWindowsRelease,
  writeWindowsPackageMetadata,
} from "./GenerateWindowsPackageMetadata";

const tag = "v0.33.0";
const release = resolveWindowsRelease(releaseFixture, tag);
const goldenDirectory = path.join(
  import.meta.dirname,
  "fixtures",
  "windows-package-metadata",
  "golden-v0.33.0",
);

const readGoldenFiles = (directory: string, baseDirectory = directory): Map<string, string> => {
  const files = new Map<string, string>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [relativePath, contents] of readGoldenFiles(entryPath, baseDirectory)) {
        files.set(relativePath, contents);
      }
    } else {
      files.set(
        path.relative(baseDirectory, entryPath).split(path.sep).join("/"),
        readFileSync(entryPath, "utf8"),
      );
    }
  }
  return files;
};

describe("Windows release resolver", () => {
  it("resolves the exact stable GitHub release and normalizes its digest", () => {
    expect(release).toEqual({
      tag: "v0.33.0",
      version: "0.33.0",
      installerName: "Pomerium-Desktop-Setup-0.33.0.exe",
      installerUrl:
        "https://github.com/pomerium/desktop-client/releases/download/v0.33.0/Pomerium-Desktop-Setup-0.33.0.exe",
      installerSha256: "6B889F360650019B910FDA8CCA04B3F17C51A6AAB55DF44215DE8EF0FE68800E",
      installerSize: 125556122,
      releaseDate: "2026-07-16",
    });
  });

  it.each([
    ["a tag that is not an exact stable version", releaseFixture, "0.33.0", "stable exact tag"],
    ["a release whose tag moved", { ...releaseFixture, tag_name: "v0.33.1" }, tag, "must equal"],
    ["a draft release", { ...releaseFixture, draft: true }, tag, "published and stable"],
    ["a prerelease", { ...releaseFixture, prerelease: true }, tag, "published and stable"],
    ["an unpublished release", { ...releaseFixture, published_at: null }, tag, "published_at"],
    ["a release with no assets", { ...releaseFixture, assets: [] }, tag, "exactly one"],
    [
      "a release with two matching installers",
      { ...releaseFixture, assets: [releaseFixture.assets[0], releaseFixture.assets[0]] },
      tag,
      "exactly one",
    ],
    [
      "an installer that is still uploading",
      { ...releaseFixture, assets: [{ ...releaseFixture.assets[0], state: "new" }] },
      tag,
      "must be uploaded",
    ],
    [
      "an installer served from another host",
      {
        ...releaseFixture,
        assets: [
          { ...releaseFixture.assets[0], browser_download_url: "https://example.com/app.exe" },
        ],
      },
      tag,
      "asset URL must be",
    ],
    [
      "an installer with no digest",
      { ...releaseFixture, assets: [{ ...releaseFixture.assets[0], digest: null }] },
      tag,
      "must have a SHA-256 digest",
    ],
    [
      "an installer digested with another algorithm",
      {
        ...releaseFixture,
        assets: [{ ...releaseFixture.assets[0], digest: `sha512:${"a".repeat(128)}` }],
      },
      tag,
      "must have a SHA-256 digest",
    ],
    [
      "an installer with a malformed digest",
      {
        ...releaseFixture,
        assets: [{ ...releaseFixture.assets[0], digest: "sha256:not-a-digest" }],
      },
      tag,
      "64 hexadecimal characters",
    ],
    [
      "an installer with no byte size",
      { ...releaseFixture, assets: [{ ...releaseFixture.assets[0], size: null }] },
      tag,
      "positive byte size",
    ],
  ])("rejects %s", (_name, payload, exactTag, message) => {
    expect(() => resolveWindowsRelease(payload, exactTag)).toThrow(message);
  });

  it("fetches only the requested GitHub release tag", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => releaseFixture,
    }));

    await expect(fetchWindowsRelease(tag, fetcher, "test-token")).resolves.toEqual(release);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.github.com/repos/pomerium/desktop-client/releases/tags/v0.33.0",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer test-token",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
  });

  it("reports a failed GitHub release request", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({}),
    }));

    await expect(fetchWindowsRelease(tag, fetcher)).rejects.toThrow(
      "failed to fetch GitHub release v0.33.0: 404 Not Found",
    );
  });
});

describe("Windows package metadata", () => {
  it("matches the reviewed golden package files", () => {
    expect(renderWindowsPackageMetadata(release)).toEqual(readGoldenFiles(goldenDirectory));
  });

  it("writes the package roots and the release descriptor the harness reads", () => {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), "pomerium-package-managers-"));

    try {
      writeWindowsPackageMetadata(release, outputDirectory);

      expect(readdirSync(outputDirectory).sort()).toEqual(["chocolatey", "release.json", "winget"]);
      expect(JSON.parse(readFileSync(path.join(outputDirectory, "release.json"), "utf8"))).toEqual(
        release,
      );
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it("leaves no earlier version behind when a directory is reused", () => {
    const outputDirectory = mkdtempSync(path.join(tmpdir(), "pomerium-package-managers-"));
    const olderRelease = { ...release, version: "0.32.2", tag: "v0.32.2" };

    try {
      writeWindowsPackageMetadata(olderRelease, outputDirectory);
      writeWindowsPackageMetadata(release, outputDirectory);

      expect(
        readdirSync(
          path.join(outputDirectory, "winget", "manifests", "p", "Pomerium", "PomeriumDesktop"),
        ),
      ).toEqual(["0.33.0"]);
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  });
});

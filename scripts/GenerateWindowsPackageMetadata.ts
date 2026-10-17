import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const githubRepository = "pomerium/desktop-client";
const packageIdentifier = "Pomerium.PomeriumDesktop";
const packageName = "Pomerium Desktop";
const packageDescription =
  "Cross-platform desktop application for establishing TCP connections through Pomerium.";
const productCode = "1f7d9fda-695d-5026-9065-253047710988";
const stableTagPattern = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const sha256Pattern = /^[0-9a-f]{64}$/i;

export type WindowsRelease = {
  readonly tag: string;
  readonly version: string;
  readonly installerName: string;
  readonly installerUrl: string;
  readonly installerSha256: string;
  readonly installerSize: number;
  readonly releaseDate: string;
};

type GitHubReleaseAsset = {
  name?: unknown;
  browser_download_url?: unknown;
  digest?: unknown;
  state?: unknown;
  size?: unknown;
};

type GitHubRelease = {
  tag_name?: unknown;
  draft?: unknown;
  prerelease?: unknown;
  published_at?: unknown;
  assets?: unknown;
};

export type ReleaseFetcher = (
  input: string,
  init: { headers: Record<string, string> },
) => Promise<Pick<Response, "ok" | "status" | "statusText" | "json">>;

const parseStableTag = (tag: string) => {
  if (!stableTagPattern.test(tag)) {
    throw new Error(`release tag must be a stable exact tag in the form vX.Y.Z: ${tag}`);
  }
  return tag.slice(1);
};

const parseReleaseDate = (publishedAt: unknown) => {
  if (
    typeof publishedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(publishedAt)
  ) {
    throw new Error(`GitHub release must have a published_at timestamp: ${String(publishedAt)}`);
  }
  return publishedAt.slice(0, 10);
};

const getReleaseAsset = (release: GitHubRelease, expectedFileName: string) => {
  if (!Array.isArray(release.assets)) {
    throw new Error("GitHub release assets must be an array");
  }

  const matches = release.assets.filter(
    (asset): asset is GitHubReleaseAsset =>
      typeof asset === "object" && asset !== null && asset.name === expectedFileName,
  );
  if (matches.length !== 1) {
    throw new Error(
      `GitHub release must contain exactly one ${expectedFileName} asset; found ${matches.length}`,
    );
  }
  return matches[0];
};

export const resolveWindowsRelease = (payload: unknown, exactTag: string): WindowsRelease => {
  const version = parseStableTag(exactTag);
  if (typeof payload !== "object" || payload === null) {
    throw new Error("GitHub release response must be an object");
  }

  const release = payload as GitHubRelease;
  if (release.tag_name !== exactTag) {
    throw new Error(`GitHub release tag must equal ${exactTag}`);
  }
  if (release.draft !== false || release.prerelease !== false) {
    throw new Error(`GitHub release ${exactTag} must be published and stable`);
  }

  const releaseDate = parseReleaseDate(release.published_at);
  const expectedFileName = `Pomerium-Desktop-Setup-${version}.exe`;
  const expectedUrl = `https://github.com/${githubRepository}/releases/download/${exactTag}/${expectedFileName}`;
  const asset = getReleaseAsset(release, expectedFileName);

  if (asset.state !== "uploaded") {
    throw new Error(`GitHub release asset ${expectedFileName} must be uploaded`);
  }
  if (asset.browser_download_url !== expectedUrl) {
    throw new Error(`GitHub release asset URL must be ${expectedUrl}`);
  }
  if (typeof asset.digest !== "string" || !asset.digest.startsWith("sha256:")) {
    throw new Error(`GitHub release asset ${expectedFileName} must have a SHA-256 digest`);
  }

  const installerSha256 = asset.digest.slice("sha256:".length);
  if (!sha256Pattern.test(installerSha256)) {
    throw new Error("GitHub release asset SHA-256 must contain 64 hexadecimal characters");
  }
  if (typeof asset.size !== "number" || !Number.isSafeInteger(asset.size) || asset.size <= 0) {
    throw new Error(`GitHub release asset ${expectedFileName} must have a positive byte size`);
  }

  return {
    tag: exactTag,
    version,
    installerName: expectedFileName,
    installerUrl: expectedUrl,
    installerSha256: installerSha256.toUpperCase(),
    installerSize: asset.size,
    releaseDate,
  };
};

export const fetchWindowsRelease = async (
  exactTag: string,
  fetcher: ReleaseFetcher = fetch,
  githubToken = process.env.GITHUB_TOKEN,
): Promise<WindowsRelease> => {
  parseStableTag(exactTag);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetcher(
    `https://api.github.com/repos/${githubRepository}/releases/tags/${exactTag}`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(
      `failed to fetch GitHub release ${exactTag}: ${response.status} ${response.statusText}`,
    );
  }

  return resolveWindowsRelease(await response.json(), exactTag);
};

const renderChocolateyNuspec = (release: WindowsRelease) => `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>pomerium-desktop</id>
    <version>${release.version}</version>
    <title>${packageName}</title>
    <authors>Pomerium Inc</authors>
    <owners>Pomerium Inc</owners>
    <projectUrl>https://github.com/pomerium/desktop-client</projectUrl>
    <projectSourceUrl>https://github.com/pomerium/desktop-client</projectSourceUrl>
    <packageSourceUrl>https://github.com/pomerium/desktop-client/blob/main/scripts/GenerateWindowsPackageMetadata.ts</packageSourceUrl>
    <iconUrl>https://raw.githubusercontent.com/pomerium/desktop-client/v${release.version}/assets/icons/128x128.png</iconUrl>
    <licenseUrl>https://github.com/pomerium/desktop-client/blob/v${release.version}/LICENSE</licenseUrl>
    <bugTrackerUrl>https://github.com/pomerium/desktop-client/issues</bugTrackerUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>${packageDescription}</description>
    <summary>Connect to services through Pomerium from the Windows desktop.</summary>
    <releaseNotes>https://github.com/pomerium/desktop-client/releases/tag/v${release.version}</releaseNotes>
    <copyright>Copyright Pomerium Inc</copyright>
    <tags>pomerium zero-trust networking desktop windows</tags>
  </metadata>
  <files>
    <file src="tools\\**" target="tools" />
  </files>
</package>
`;

const renderChocolateyInstall = (release: WindowsRelease) => `$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  fileType       = 'exe'
  url64bit       = '${release.installerUrl}'
  checksum64     = '${release.installerSha256}'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
`;

const chocolateyUninstall = `$ErrorActionPreference = 'Stop'

$softwareName = 'Pomerium Desktop*'
$registryKeys = @(Get-UninstallRegistryKey -SoftwareName $softwareName)

if ($registryKeys.Count -eq 0) {
  Write-Warning "$softwareName is not installed."
  return
}
if ($registryKeys.Count -ne 1) {
  throw "Found $($registryKeys.Count) uninstall entries for $softwareName."
}

$uninstallCommand = [string]$registryKeys[0].UninstallString
if ($uninstallCommand -notmatch '^"(?<file>[^"]+\\.exe)"(?:\\s.*)?$') {
  throw "The uninstall command has an unexpected format: $uninstallCommand"
}

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  fileType       = 'exe'
  silentArgs     = '/currentuser /S'
  file           = $Matches.file
  validExitCodes = @(0)
}

Uninstall-ChocolateyPackage @packageArgs
`;

const renderChocolateyPackage = (release: WindowsRelease) =>
  new Map<string, string>([
    ["chocolatey/pomerium-desktop.nuspec", renderChocolateyNuspec(release)],
    ["chocolatey/tools/chocolateyInstall.ps1", renderChocolateyInstall(release)],
    ["chocolatey/tools/chocolateyUninstall.ps1", chocolateyUninstall],
  ]);

const renderWingetVersion = (
  release: WindowsRelease,
) => `# yaml-language-server: $schema=https://aka.ms/winget-manifest.version.1.10.0.schema.json

PackageIdentifier: ${packageIdentifier}
PackageVersion: ${release.version}
DefaultLocale: en-US
ManifestType: version
ManifestVersion: 1.10.0
`;

const renderWingetInstaller = (
  release: WindowsRelease,
) => `# yaml-language-server: $schema=https://aka.ms/winget-manifest.installer.1.10.0.schema.json

PackageIdentifier: ${packageIdentifier}
PackageVersion: ${release.version}
InstallerType: nullsoft
Scope: user
ElevationRequirement: elevationProhibited
InstallModes:
  - interactive
  - silent
  - silentWithProgress
UpgradeBehavior: install
ReleaseDate: ${release.releaseDate}
Installers:
  - Architecture: x64
    ProductCode: ${productCode}
    InstallerUrl: ${release.installerUrl}
    InstallerSha256: ${release.installerSha256}
    AppsAndFeaturesEntries:
      - DisplayName: ${packageName} ${release.version}
        Publisher: Pomerium Inc
        ProductCode: ${productCode}
ManifestType: installer
ManifestVersion: 1.10.0
`;

const renderWingetLocale = (
  release: WindowsRelease,
) => `# yaml-language-server: $schema=https://aka.ms/winget-manifest.defaultLocale.1.10.0.schema.json

PackageIdentifier: ${packageIdentifier}
PackageVersion: ${release.version}
PackageLocale: en-US
Publisher: Pomerium Inc
PublisherUrl: https://www.pomerium.com/
PublisherSupportUrl: https://github.com/pomerium/desktop-client/issues
Author: Pomerium Inc
PackageName: ${packageName}
PackageUrl: https://github.com/pomerium/desktop-client
License: Apache-2.0
LicenseUrl: https://github.com/pomerium/desktop-client/blob/v${release.version}/LICENSE
Copyright: Copyright Pomerium Inc
ShortDescription: Connect to services through Pomerium from the Windows desktop.
Description: ${packageDescription}
Moniker: pomerium-desktop
Tags:
  - access
  - networking
  - security
  - zero-trust
ReleaseNotesUrl: https://github.com/pomerium/desktop-client/releases/tag/v${release.version}
ManifestType: defaultLocale
ManifestVersion: 1.10.0
`;

const renderWingetPackage = (release: WindowsRelease) => {
  const wingetBase = `winget/manifests/p/Pomerium/PomeriumDesktop/${release.version}`;
  return new Map<string, string>([
    [`${wingetBase}/${packageIdentifier}.yaml`, renderWingetVersion(release)],
    [`${wingetBase}/${packageIdentifier}.installer.yaml`, renderWingetInstaller(release)],
    [`${wingetBase}/${packageIdentifier}.locale.en-US.yaml`, renderWingetLocale(release)],
  ]);
};

export const renderWindowsPackageMetadata = (release: WindowsRelease) =>
  new Map([...renderChocolateyPackage(release), ...renderWingetPackage(release)]);

export const writeWindowsPackageMetadata = (release: WindowsRelease, outputDirectory: string) => {
  // WinGet manifests live under a per-version path, so writing a second version into the same
  // directory would leave both behind and give the harness two installer manifests to choose from.
  for (const packageRoot of ["chocolatey", "winget"]) {
    rmSync(path.join(outputDirectory, packageRoot), { recursive: true, force: true });
  }

  for (const [relativePath, contents] of renderWindowsPackageMetadata(release)) {
    const outputPath = path.join(outputDirectory, ...relativePath.split("/"));
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, contents, "utf8");
  }
  writeFileSync(
    path.join(outputDirectory, "release.json"),
    `${JSON.stringify(release, null, 2)}\n`,
    "utf8",
  );
};

const main = async () => {
  const { values } = parseArgs({
    options: { tag: { type: "string" }, output: { type: "string" } },
  });
  if (!values.tag || !values.output) {
    throw new Error("usage: --tag vX.Y.Z --output <directory>");
  }

  const release = await fetchWindowsRelease(values.tag);
  writeWindowsPackageMetadata(release, values.output);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

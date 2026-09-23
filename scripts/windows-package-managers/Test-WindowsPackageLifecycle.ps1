[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Chocolatey", "WinGet")]
  [string]$PackageManager,

  [Parameter(Mandatory = $true)]
  [string]$OldMetadataRoot,

  [Parameter(Mandatory = $true)]
  [string]$NewMetadataRoot,

  [Parameter(Mandatory = $true)]
  [string]$EvidenceDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
if (Test-Path Variable:PSNativeCommandUseErrorActionPreference) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$script:RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$script:EvidenceDirectory = [System.IO.Path]::GetFullPath($EvidenceDirectory)
$script:Assertions = [System.Collections.Generic.List[object]]::new()
$script:Commands = [System.Collections.Generic.List[object]]::new()
$script:StartedAt = [DateTime]::UtcNow
$script:LifecycleCompleted = $false
$script:Failure = $null
# electron-builder derives this UUIDv5 from the io.pomerium.PomeriumDesktop application ID.
$script:ProductCode = "1f7d9fda-695d-5026-9065-253047710988"
$script:PackageIdentifier = "Pomerium.PomeriumDesktop"
$script:ChocolateyPackageId = "pomerium-desktop"
$script:IsElevated = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$script:SkipReason = $null

New-Item -ItemType Directory -Force -Path $script:EvidenceDirectory | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $script:EvidenceDirectory "logs") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $script:EvidenceDirectory "generated") | Out-Null

function Add-Assertion {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][bool]$Passed,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Details
  )

  $script:Assertions.Add([ordered]@{
      name = $Name
      passed = $Passed
      details = $Details
      time = [DateTime]::UtcNow.ToString("o")
    })

  if (-not $Passed) {
    throw "assertion failed: ${Name}: ${Details}"
  }
}

function Invoke-EvidenceCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string[]]$ArgumentList,
    [switch]$AllowFailure,
    # Commands that pull the installer from GitHub releases; that endpoint returns intermittent
    # 503s from hosted runners, so give them more than one chance before failing the run.
    [int]$RetryCount = 0,
    # For a command that is meant to fail, a failed download looks the same as the failure under
    # test. Retry until the output shows the real verdict rather than accepting any failure.
    [string]$RetryUntilOutputMatches = ""
  )

  $logPath = Join-Path $script:EvidenceDirectory "logs\${Name}.log"
  "command: $FilePath $($ArgumentList -join ' ')" | Set-Content -Encoding utf8 $logPath
  $startedAt = [DateTime]::UtcNow

  for ($attempt = 1; ; $attempt++) {
    "attempt ${attempt}:" | Out-File -Encoding utf8 -Append $logPath
    $output = @(& $FilePath @ArgumentList 2>&1)
    $exitCode = $LASTEXITCODE
    $output | Out-File -Encoding utf8 -Append $logPath
    "exit code: $exitCode" | Out-File -Encoding utf8 -Append $logPath

    $satisfied = if ($RetryUntilOutputMatches) {
      (@($output) -join "`n") -imatch $RetryUntilOutputMatches
    } else {
      $exitCode -eq 0
    }
    if ($satisfied -or $attempt -gt $RetryCount) {
      break
    }
    Start-Sleep -Seconds (15 * $attempt)
  }

  $script:Commands.Add([ordered]@{
      name = $Name
      file = $FilePath
      arguments = $ArgumentList
      exitCode = $exitCode
      attempts = $attempt
      log = $logPath
      startedAt = $startedAt.ToString("o")
      finishedAt = [DateTime]::UtcNow.ToString("o")
    })

  if ($exitCode -ne 0 -and -not $AllowFailure) {
    throw "command failed with exit code ${exitCode} after ${attempt} attempt(s): ${Name}. See ${logPath}."
  }
  return [ordered]@{ exitCode = $exitCode; output = @($output | ForEach-Object { $_.ToString() }) }
}

function Get-WinGetManifestDirectory {
  param([Parameter(Mandatory = $true)][string]$MetadataRoot)

  $manifest = @(Get-ChildItem -Path (Join-Path $MetadataRoot "winget\manifests") -Filter "*.installer.yaml" -File -Recurse)
  Add-Assertion "one WinGet installer manifest" ($manifest.Count -eq 1) "found $($manifest.Count) installer manifests under $MetadataRoot"
  return $manifest[0].Directory.FullName
}

function Get-ReleaseDescriptor {
  param([Parameter(Mandatory = $true)][string]$MetadataRoot)

  $descriptorPath = Join-Path $MetadataRoot "release.json"
  Add-Assertion "release descriptor exists" (Test-Path -LiteralPath $descriptorPath -PathType Leaf) $descriptorPath
  $release = Get-Content -Raw $descriptorPath | ConvertFrom-Json
  return [ordered]@{
    version = [string]$release.version
    url = [string]$release.installerUrl
    sha256 = ([string]$release.installerSha256).ToUpperInvariant()
    metadataRoot = [System.IO.Path]::GetFullPath($MetadataRoot)
  }
}

# Both package managers download the installer themselves. Probe the asset first so a runner
# that cannot reach GitHub is not reported as a broken package.
function Assert-InstallerReachable {
  param([Parameter(Mandatory = $true)][object]$Descriptor)

  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      $status = (Invoke-WebRequest -Uri $Descriptor.url -Method Head -MaximumRedirection 5).StatusCode
    } catch {
      $status = "request failed: $($_.Exception.Message)"
    }
    if ($status -eq 200) {
      break
    }
    Start-Sleep -Seconds (10 * $attempt)
  }
  Add-Assertion "installer $($Descriptor.version) is reachable" ($status -eq 200) "$($Descriptor.url) returned ${status} after ${attempt} attempt(s)"
}

# A partially written or partially removed uninstall key can be missing any value, and
# Set-StrictMode turns a direct property read on one into a terminating error.
function Get-RegistryValue {
  param(
    [Parameter(Mandatory = $true)][AllowNull()][object]$Entry,
    [Parameter(Mandatory = $true)][string]$Name
  )

  if ($null -eq $Entry -or $Entry.PSObject.Properties.Name -notcontains $Name) {
    return $null
  }
  return $Entry.$Name
}

function Get-ArpState {
  $locations = @(
    [ordered]@{ scope = "user"; path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$($script:ProductCode)" },
    [ordered]@{ scope = "machine"; path = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$($script:ProductCode)" },
    [ordered]@{ scope = "machine32"; path = "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$($script:ProductCode)" }
  )

  return @($locations | ForEach-Object {
      if (Test-Path $_.path) {
        $entry = Get-ItemProperty $_.path
        [ordered]@{
          scope = $_.scope
          registryPath = $_.path
          displayName = Get-RegistryValue $entry "DisplayName"
          displayVersion = Get-RegistryValue $entry "DisplayVersion"
          publisher = Get-RegistryValue $entry "Publisher"
          uninstallString = Get-RegistryValue $entry "UninstallString"
          quietUninstallString = Get-RegistryValue $entry "QuietUninstallString"
        }
      }
    })
}

# The NSIS installer records the install directory on its own key, not on the uninstall key.
function Get-InstallLocation {
  $path = "HKCU:\Software\$($script:ProductCode)"
  if (-not (Test-Path $path)) {
    return $null
  }
  return Get-RegistryValue (Get-ItemProperty $path) "InstallLocation"
}

function Get-Shortcuts {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
  $paths = @(
    Get-ChildItem -Path $desktop -Filter "Pomerium Desktop.lnk" -File -ErrorAction SilentlyContinue
    Get-ChildItem -Path $startMenu -Filter "Pomerium Desktop.lnk" -File -Recurse -ErrorAction SilentlyContinue
  ) | Select-Object -ExpandProperty FullName -Unique
  return [ordered]@{
    desktop = Join-Path $desktop "Pomerium Desktop.lnk"
    startMenuRoot = $startMenu
    paths = @($paths)
  }
}

function Save-InstalledState {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$ExpectedVersion
  )

  $arp = @(Get-ArpState)
  $arp | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 (Join-Path $script:EvidenceDirectory "${Name}-arp.json")
  $userEntries = @($arp | Where-Object { $_.scope -eq "user" })
  $machineEntries = @($arp | Where-Object { $_.scope -ne "user" })
  Add-Assertion "${Name} has one user ARP entry" ($userEntries.Count -eq 1) ($arp | ConvertTo-Json -Compress)
  Add-Assertion "${Name} has no machine ARP entry" ($machineEntries.Count -eq 0) ($arp | ConvertTo-Json -Compress)
  $entry = $userEntries[0]
  Add-Assertion "${Name} ARP display name" ($entry.displayName -ceq "Pomerium Desktop ${ExpectedVersion}") "got $($entry.displayName)"
  Add-Assertion "${Name} ARP version" ($entry.displayVersion -ceq $ExpectedVersion) "expected ${ExpectedVersion}, got $($entry.displayVersion)"
  Add-Assertion "${Name} ARP publisher" ($entry.publisher -ceq "Pomerium Inc") "got $($entry.publisher)"
  Add-Assertion "${Name} has quiet uninstall" (-not [string]::IsNullOrWhiteSpace($entry.quietUninstallString)) "quiet uninstall is $($entry.quietUninstallString)"
  $installLocation = Get-InstallLocation
  Add-Assertion "${Name} install path exists" ((-not [string]::IsNullOrWhiteSpace($installLocation)) -and (Test-Path -LiteralPath $installLocation -PathType Container)) "install location is ${installLocation}"

  $executable = Join-Path $installLocation "Pomerium Desktop.exe"
  Add-Assertion "${Name} executable exists" (Test-Path -LiteralPath $executable -PathType Leaf) $executable
  # Windows reports a four-part product version, so compare the parts the release carries.
  $fileVersion = (Get-Item $executable).VersionInfo.ProductVersion
  $expected = [version]$ExpectedVersion
  $actual = [version]$fileVersion
  $versionMatches = $actual.Major -eq $expected.Major -and $actual.Minor -eq $expected.Minor -and $actual.Build -eq $expected.Build
  Add-Assertion "${Name} executable version" $versionMatches "expected ${ExpectedVersion}, got ${fileVersion}"

  $shortcutState = Get-Shortcuts
  $shortcuts = @($shortcutState.paths)
  $shortcuts | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $script:EvidenceDirectory "${Name}-shortcuts.json")
  Add-Assertion "${Name} desktop shortcut exists" ($shortcuts -contains $shortcutState.desktop) ($shortcuts -join "; ")
  Add-Assertion "${Name} Start menu shortcut exists" (@($shortcuts | Where-Object { $_.StartsWith($shortcutState.startMenuRoot, [StringComparison]::OrdinalIgnoreCase) }).Count -eq 1) ($shortcuts -join "; ")

  return [ordered]@{ arp = $entry; installLocation = $installLocation; executable = $executable; fileVersion = $fileVersion }
}

function Assert-NotInstalled {
  param([Parameter(Mandatory = $true)][string]$Name)

  $arp = @(Get-ArpState)
  Add-Assertion "${Name} has no ARP entry" ($arp.Count -eq 0) (ConvertTo-Json -InputObject $arp -Compress)
  $installMetadataPath = "HKCU:\Software\$($script:ProductCode)"
  if (Test-Path $installMetadataPath) {
    $stale = Get-RegistryValue (Get-ItemProperty $installMetadataPath) "InstallLocation"
    if ($stale) {
      Add-Assertion "${Name} has no install directory" (-not (Test-Path -LiteralPath $stale)) $stale
    }
  }
  Add-Assertion "${Name} has no installer metadata" (-not (Test-Path $installMetadataPath)) $installMetadataPath
  $shortcuts = @((Get-Shortcuts).paths)
  Add-Assertion "${Name} has no application shortcuts" ($shortcuts.Count -eq 0) ($shortcuts -join "; ")
}

function Assert-PackageManagerState {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [AllowEmptyString()][string]$ExpectedVersion = ""
  )

  if ($PackageManager -eq "Chocolatey") {
    $identifier = $script:ChocolateyPackageId
    $result = Invoke-EvidenceCommand "${Name}-choco-list" (Get-Command choco.exe -ErrorAction Stop).Source @("list", "--exact", $script:ChocolateyPackageId, "--limit-output")
    $lines = @($result.output)
    $pattern = "^$([regex]::Escape($script:ChocolateyPackageId))\|$([regex]::Escape($ExpectedVersion))$"
  } else {
    $identifier = $script:PackageIdentifier
    $result = Invoke-EvidenceCommand "${Name}-winget-list" (Get-Command winget.exe -ErrorAction Stop).Source @("list", "--id", $script:PackageIdentifier, "--exact", "--scope", "user", "--disable-interactivity", "--accept-source-agreements") -AllowFailure
    $lines = @($result.output)
    # WinGet prints one aligned row for the package. Match the identifier and the version on that row.
    $pattern = "^\S.*\s$([regex]::Escape($script:PackageIdentifier))\s+$([regex]::Escape($ExpectedVersion))(\s|$)"
  }

  $joined = $lines -join "`n"
  if ($ExpectedVersion) {
    Add-Assertion "${Name} package manager version" (@($lines | Where-Object { $_ -match $pattern }).Count -eq 1) "expected ${ExpectedVersion}; output: ${joined}"
  } else {
    Add-Assertion "${Name} has no package manager record" ($joined -notmatch [regex]::Escape($identifier)) $joined
  }
}

# A failed download also exits non-zero, so a bare exit-code check would pass without the
# package manager ever comparing a hash. Require the rejection to name the checksum.
function Assert-ChecksumRejection {
  param(
    [Parameter(Mandatory = $true)][object]$Result,
    [Parameter(Mandatory = $true)][string]$Manager,
    [Parameter(Mandatory = $true)][string]$Term
  )

  $output = @($Result.output) -join "`n"
  Add-Assertion "${Manager} fails on a corrupt checksum" ($Result.exitCode -ne 0) "exit code $($Result.exitCode)"
  Add-Assertion "${Manager} rejects it for the checksum" ($output -imatch $Term) $output
}

function New-CorruptMetadata {
  param([Parameter(Mandatory = $true)][object]$Descriptor)

  $destination = Join-Path $script:EvidenceDirectory "generated\corrupt-$($Descriptor.version)"
  Copy-Item -Path $Descriptor.metadataRoot -Destination $destination -Recurse
  $badHash = "0" * 64
  if ($PackageManager -eq "Chocolatey") {
    $path = Join-Path $destination "chocolatey\tools\chocolateyInstall.ps1"
  } else {
    $path = (Get-ChildItem -Path (Join-Path $destination "winget\manifests") -Filter "*.installer.yaml" -File -Recurse)[0].FullName
  }
  $contents = Get-Content -Raw $path
  $contents = $contents.Replace($Descriptor.sha256, $badHash).Replace($Descriptor.sha256.ToLowerInvariant(), $badHash)
  Set-Content -Encoding utf8 -Path $path -Value $contents
  Add-Assertion "corrupted checksum was written" ((Get-Content -Raw $path).Contains($badHash)) $path
  return $destination
}

function Invoke-ChocolateyLifecycle {
  param([object]$OldDescriptor, [object]$NewDescriptor, [string]$CorruptRoot)

  $choco = (Get-Command choco.exe -ErrorAction Stop).Source
  $corruptPackages = Join-Path $script:EvidenceDirectory "generated\corrupt-package"
  $oldPackages = Join-Path $script:EvidenceDirectory "generated\old-package"
  $newPackages = Join-Path $script:EvidenceDirectory "generated\new-package"
  New-Item -ItemType Directory -Force -Path $corruptPackages, $oldPackages, $newPackages | Out-Null

  Invoke-EvidenceCommand "choco-pack-corrupt" $choco @("pack", (Join-Path $CorruptRoot "chocolatey\pomerium-desktop.nuspec"), "--output-directory", $corruptPackages) | Out-Null
  $corrupt = Invoke-EvidenceCommand "choco-corrupt-checksum" -RetryCount 2 -RetryUntilOutputMatches "checksum" $choco @("install", $script:ChocolateyPackageId, "--version", $OldDescriptor.version, "--source", $corruptPackages, "--yes", "--no-progress", "--limit-output") -AllowFailure
  Assert-ChecksumRejection $corrupt "Chocolatey" "checksum"
  Assert-NotInstalled "after Chocolatey corrupt checksum"
  Assert-PackageManagerState "after-corrupt-checksum"

  Invoke-EvidenceCommand "choco-pack-$($OldDescriptor.version)" $choco @("pack", (Join-Path $OldDescriptor.metadataRoot "chocolatey\pomerium-desktop.nuspec"), "--output-directory", $oldPackages) | Out-Null
  Invoke-EvidenceCommand "choco-pack-$($NewDescriptor.version)" $choco @("pack", (Join-Path $NewDescriptor.metadataRoot "chocolatey\pomerium-desktop.nuspec"), "--output-directory", $newPackages) | Out-Null
  Invoke-EvidenceCommand "choco-install-$($OldDescriptor.version)" -RetryCount 2 $choco @("install", $script:ChocolateyPackageId, "--version", $OldDescriptor.version, "--source", $oldPackages, "--yes", "--no-progress", "--limit-output") | Out-Null
  $oldState = Save-InstalledState "installed-$($OldDescriptor.version)" $OldDescriptor.version
  Assert-PackageManagerState "installed-$($OldDescriptor.version)" $OldDescriptor.version

  Invoke-EvidenceCommand "choco-upgrade-$($NewDescriptor.version)" -RetryCount 2 $choco @("upgrade", $script:ChocolateyPackageId, "--version", $NewDescriptor.version, "--source", $newPackages, "--yes", "--no-progress", "--limit-output") | Out-Null
  $newState = Save-InstalledState "upgraded-$($NewDescriptor.version)" $NewDescriptor.version
  Assert-PackageManagerState "upgraded-$($NewDescriptor.version)" $NewDescriptor.version
  return [ordered]@{ old = $oldState; new = $newState }
}

function Invoke-WinGetLifecycle {
  param([object]$OldDescriptor, [object]$NewDescriptor, [string]$CorruptRoot)

  $winget = (Get-Command winget.exe -ErrorAction Stop).Source
  Invoke-EvidenceCommand "winget-enable-local-manifests" $winget @("settings", "--enable", "LocalManifestFiles") | Out-Null
  $corruptManifest = Get-WinGetManifestDirectory $CorruptRoot
  $oldManifest = Get-WinGetManifestDirectory $OldDescriptor.metadataRoot
  $newManifest = Get-WinGetManifestDirectory $NewDescriptor.metadataRoot
  $common = @("--silent", "--disable-interactivity", "--accept-package-agreements", "--accept-source-agreements")

  Invoke-EvidenceCommand "winget-validate-$($OldDescriptor.version)" $winget @("validate", $oldManifest) | Out-Null
  Invoke-EvidenceCommand "winget-validate-$($NewDescriptor.version)" $winget @("validate", $newManifest) | Out-Null

  # WinGet elevates installers by default, and the manifest declares the per-user installer
  # elevationProhibited, so an elevated session can only prove that WinGet honours that.
  if ($script:IsElevated) {
    $refused = Invoke-EvidenceCommand "winget-elevated-refusal" $winget (@("install", "--manifest", $oldManifest) + $common) -AllowFailure
    $output = @($refused.output) -join "`n"
    Add-Assertion "WinGet refuses to elevate a per-user installer" ($refused.exitCode -ne 0) "exit code $($refused.exitCode)"
    Add-Assertion "WinGet names the administrator context" ($output -imatch "administrator context") $output
    Assert-NotInstalled "after WinGet elevated refusal"
    $script:SkipReason = "WinGet installs were skipped: this session is elevated and the per-user installer is elevationProhibited."
    return $null
  }

  $corrupt = Invoke-EvidenceCommand "winget-corrupt-checksum" -RetryCount 2 -RetryUntilOutputMatches "hash" $winget (@("install", "--manifest", $corruptManifest) + $common) -AllowFailure
  Assert-ChecksumRejection $corrupt "WinGet" "hash"
  Assert-NotInstalled "after WinGet corrupt checksum"
  Assert-PackageManagerState "after-corrupt-checksum"

  Invoke-EvidenceCommand "winget-install-$($OldDescriptor.version)" -RetryCount 2 $winget (@("install", "--manifest", $oldManifest) + $common) | Out-Null
  $oldState = Save-InstalledState "installed-$($OldDescriptor.version)" $OldDescriptor.version
  Assert-PackageManagerState "installed-$($OldDescriptor.version)" $OldDescriptor.version

  Invoke-EvidenceCommand "winget-upgrade-$($NewDescriptor.version)" -RetryCount 2 $winget (@("upgrade", "--manifest", $newManifest) + $common) | Out-Null
  $newState = Save-InstalledState "upgraded-$($NewDescriptor.version)" $NewDescriptor.version
  Assert-PackageManagerState "upgraded-$($NewDescriptor.version)" $NewDescriptor.version
  return [ordered]@{ old = $oldState; new = $newState }
}

function Uninstall-PomeriumDesktop {
  if ($PackageManager -eq "Chocolatey") {
    $choco = (Get-Command choco.exe -ErrorAction Stop).Source
    Invoke-EvidenceCommand "choco-uninstall" $choco @("uninstall", $script:ChocolateyPackageId, "--yes", "--no-progress", "--limit-output") | Out-Null
  } else {
    $winget = (Get-Command winget.exe -ErrorAction Stop).Source
    Invoke-EvidenceCommand "winget-uninstall" $winget @("uninstall", "--id", $script:PackageIdentifier, "--exact", "--scope", "user", "--silent", "--disable-interactivity", "--accept-source-agreements") | Out-Null
  }
}

function Assert-Uninstalled {
  param([Parameter(Mandatory = $true)][string]$InstallLocation)

  $arp = @(Get-ArpState)
  Add-Assertion "uninstall removes ARP entry" ($arp.Count -eq 0) (ConvertTo-Json -InputObject $arp -Compress)
  Add-Assertion "uninstall removes install directory" (-not (Test-Path -LiteralPath $InstallLocation)) $InstallLocation
  $shortcuts = @((Get-Shortcuts).paths)
  Add-Assertion "uninstall removes application shortcuts" ($shortcuts.Count -eq 0) ($shortcuts -join "; ")
}

# An installer that dies on an access violation reports only an exit code, so capture what
# Windows recorded about the crash.
function Save-CrashReports {
  try {
    $events = @(Get-WinEvent -FilterHashtable @{ LogName = "Application"; ProviderName = "Application Error", "Windows Error Reporting" } -MaxEvents 10 -ErrorAction Stop |
        Select-Object TimeCreated, ProviderName, Id, Message)
  } catch {
    $events = @([ordered]@{ error = $_.Exception.Message })
  }
  $events | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $script:EvidenceDirectory "crash-reports.json")
}

function Save-Summary {
  [ordered]@{
    packageManager = $PackageManager
    oldMetadataRoot = [System.IO.Path]::GetFullPath($OldMetadataRoot)
    newMetadataRoot = [System.IO.Path]::GetFullPath($NewMetadataRoot)
    evidenceDirectory = $script:EvidenceDirectory
    startedAt = $script:StartedAt.ToString("o")
    finishedAt = [DateTime]::UtcNow.ToString("o")
    completed = $script:LifecycleCompleted
    skipped = $script:SkipReason
    failure = $script:Failure
    assertions = $script:Assertions
    commands = $script:Commands
  } | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $script:EvidenceDirectory "summary.json")
}

Push-Location $script:RepositoryRoot
try {
  $oldDescriptor = Get-ReleaseDescriptor $OldMetadataRoot
  $newDescriptor = Get-ReleaseDescriptor $NewMetadataRoot
  Add-Assertion "upgrade path goes forward" ([version]$newDescriptor.version -gt [version]$oldDescriptor.version) "$($oldDescriptor.version) to $($newDescriptor.version)"
  Assert-InstallerReachable $oldDescriptor
  Assert-InstallerReachable $newDescriptor
  Assert-NotInstalled "initial state"
  $corruptRoot = New-CorruptMetadata $oldDescriptor

  if ($PackageManager -eq "Chocolatey") {
    $state = Invoke-ChocolateyLifecycle $oldDescriptor $newDescriptor $corruptRoot
  } else {
    $state = Invoke-WinGetLifecycle $oldDescriptor $newDescriptor $corruptRoot
  }

  if ($null -ne $state) {
    $installLocation = $state.new.installLocation
    Uninstall-PomeriumDesktop
    Assert-Uninstalled $installLocation
    Assert-PackageManagerState "after-uninstall"
  }
  $script:LifecycleCompleted = $true
} catch {
  $script:Failure = $_.Exception.ToString()
  Save-CrashReports
  throw
} finally {
  Save-Summary
  Pop-Location
}

# Commands that are expected to fail leave their code in $LASTEXITCODE, and the calling shell
# would exit with it, so report the lifecycle result rather than the last command's.
exit 0

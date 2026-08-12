$ErrorActionPreference = 'Stop'

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
if ($uninstallCommand -notmatch '^"(?<file>[^"]+\.exe)"(?:\s.*)?$') {
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

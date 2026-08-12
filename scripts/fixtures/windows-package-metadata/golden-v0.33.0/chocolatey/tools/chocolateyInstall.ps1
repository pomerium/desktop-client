$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  fileType       = 'exe'
  url64bit       = 'https://github.com/pomerium/desktop-client/releases/download/v0.33.0/Pomerium-Desktop-Setup-0.33.0.exe'
  checksum64     = '6B889F360650019B910FDA8CCA04B3F17C51A6AAB55DF44215DE8EF0FE68800E'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs

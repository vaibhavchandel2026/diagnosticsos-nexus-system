$ErrorActionPreference = "Stop"

Write-Host "Setting up Windows dependencies for iPhone Diagnostic Suite..." -ForegroundColor Cyan

function Ensure-Command($name, $installHint) {
  if (Get-Command $name -ErrorAction SilentlyContinue) {
    Write-Host "$name already available" -ForegroundColor Green
    return $true
  }
  Write-Warning "$name not found. $installHint"
  return $false
}

$pythonOk = Ensure-Command "python" "Install Python 3 from python.org or Microsoft Store."
if ($pythonOk) {
  python -m pip install --upgrade pip
  python -m pip install pymobiledevice3 pywin32
}

$itunesPath = "C:\Program Files\Common Files\Apple\Mobile Device Support\MobileDevice.dll"
if (Test-Path $itunesPath) {
  Write-Host "Apple Mobile Device Support detected" -ForegroundColor Green
} else {
  Write-Warning "Apple Mobile Device Support not found. Install Apple Devices or iTunes for Windows."
}

$adbPath = Join-Path $PSScriptRoot "..\tools\platform-tools\adb.exe"
if (Test-Path $adbPath) {
  Write-Host "Bundled Android platform-tools detected" -ForegroundColor Green
} else {
  Write-Warning "Bundled Android platform-tools not found."
}

Write-Host "Setup complete. Restart the app after installing missing dependencies." -ForegroundColor Cyan

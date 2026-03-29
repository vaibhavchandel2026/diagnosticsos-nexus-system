param(
  [string]$HostAddress = "0.0.0.0",
  [int]$Port = 8787,
  [string]$DirectoryUrl = "",
  [string]$AgentName = "",
  [string]$AgentId = "",
  [string]$AdvertisedUrl = ""
)

$env:DEVICE_API_HOST = $HostAddress
$env:DEVICE_API_PORT = [string]$Port
$env:DEVICE_DIRECTORY_URL = $DirectoryUrl
$env:DEVICE_AGENT_NAME = $AgentName
$env:DEVICE_AGENT_ID = $AgentId
$env:DEVICE_AGENT_PUBLIC_URL = $AdvertisedUrl

Write-Host "Starting Diagnostics agent on http://$HostAddress`:$Port" -ForegroundColor Cyan
if ($DirectoryUrl) {
  Write-Host "Directory: $DirectoryUrl" -ForegroundColor DarkCyan
}
if ($AdvertisedUrl) {
  Write-Host "Advertised URL: $AdvertisedUrl" -ForegroundColor DarkCyan
}
& "C:\Program Files\nodejs\node.exe" "D:\DiagnosticsOS Nexus system\backend\server.mjs"

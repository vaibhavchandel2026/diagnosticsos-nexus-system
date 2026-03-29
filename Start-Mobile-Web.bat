@echo off
setlocal

cd /d "%~dp0"
set "DEVICE_API_HOST=0.0.0.0"
set "DEVICE_API_PORT=8787"

echo Starting Diagnostics mobile web server on http://0.0.0.0:8787
echo Open from another device on the same Wi-Fi using:
echo http://192.168.29.235:8787
echo.

"C:\Program Files\nodejs\node.exe" "backend\server.mjs"

@echo off
setlocal

cd /d "%~dp0"

echo Starting local public tunnel for port 8787...
echo Keep this window open while sharing the app.
echo When the tunnel connects, copy the https URL shown below.
echo.

cmd /c npx localtunnel --port 8787

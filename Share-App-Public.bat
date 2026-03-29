@echo off
setlocal

cd /d "%~dp0"

start "Diagnostics Mobile Web" "%~dp0Start-Mobile-Web.bat"
timeout /t 3 /nobreak >nul
start "Diagnostics Public Link" "%~dp0Start-Public-Link.bat"

echo Started the local web server and public tunnel windows.
echo.
echo 1. Leave both windows open.
echo 2. In the "Diagnostics Public Link" window, copy the https URL.
echo 3. Open that URL from another PC or mobile.

@echo off
setlocal

cd /d "%~dp0"

set /p DIRECTORY_URL=Enter your hosted app URL (example: https://your-app.onrender.com): 
set /p AGENT_NAME=Enter an agent name for this PC (example: Bench-01): 
set /p ADVERTISED_URL=Enter this PC public/LAN agent URL (example: http://192.168.29.235:8787): 

echo.
echo Registering local agent to hosted app...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-agent.ps1" -DirectoryUrl "%DIRECTORY_URL%" -AgentName "%AGENT_NAME%" -AdvertisedUrl "%ADVERTISED_URL%"

@echo off
cd /d "%~dp0"
set HOST=0.0.0.0
start "" "http://localhost:4173"
npm start
pause

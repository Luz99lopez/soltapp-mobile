@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\soltapp-estable.ps1" -Action Start
set "SOLTAPP_RESULT=%ERRORLEVEL%"
if not defined SOLTAPP_NO_PAUSE pause
exit /b %SOLTAPP_RESULT%

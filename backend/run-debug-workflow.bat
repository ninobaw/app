@echo off
echo ========================================
echo    DIAGNOSTIC WORKFLOW CHAT AERODOC
echo ========================================
echo.

cd /d "%~dp0"

echo Execution du diagnostic...
echo.

node debug-workflow-chat.js

echo.
echo Diagnostic termine. Appuyez sur une touche pour fermer...
pause >nul

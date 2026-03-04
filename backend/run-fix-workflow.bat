@echo off
echo ========================================
echo    CORRECTION WORKFLOW CHAT AERODOC
echo ========================================
echo.

cd /d "%~dp0"

echo Application des corrections...
echo.

node fix-workflow-issues.js

echo.
echo Corrections terminees. Appuyez sur une touche pour fermer...
pause >nul

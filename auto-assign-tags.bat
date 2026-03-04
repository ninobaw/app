@echo off
echo ========================================
echo    AUTO-ASSIGNATION DES TAGS
echo ========================================
echo.
echo Ce script va analyser toutes les correspondances
echo et remplacer leurs tags par des tags predifinis
echo appropries selon le contexte.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Execution du script d'auto-assignation...
node src/scripts/auto-assign-tags.js

echo.
echo ========================================
echo Script termine. Appuyez sur une touche...
pause > nul

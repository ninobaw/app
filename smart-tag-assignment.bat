@echo off
echo ========================================
echo    ASSIGNATION INTELLIGENTE DES TAGS
echo ========================================
echo.
echo Ce script va analyser le contenu de toutes
echo les correspondances et assigner automatiquement
echo les tags les plus pertinents depuis la table Tags.
echo.
echo Le systeme utilise:
echo - Analyse contextuelle du contenu
echo - Correspondance avec les noms et descriptions des tags
echo - Algorithme de scoring intelligent
echo - Maximum 3 tags par correspondance
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Execution de l'assignation intelligente...
node src/scripts/smart-tag-assignment.js

echo.
echo ========================================
echo Script termine. Appuyez sur une touche...
pause > nul

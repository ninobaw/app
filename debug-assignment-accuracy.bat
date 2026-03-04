@echo off
echo ========================================
echo    DIAGNOSTIC PRECISION ASSIGNATION
echo ========================================
echo.
echo Ce script va analyser pourquoi
echo l'assignation n'est pas correcte:
echo.
echo - Analyser 10 correspondances reelles
echo - Calculer les scores pour chaque tag
echo - Montrer les mots-cles extraits
echo - Recommander des ameliorations
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Analyse de la precision...
node src/scripts/debug-assignment-accuracy.js

echo.
echo ========================================
echo Analyse terminee. Appuyez sur une touche...
pause > nul

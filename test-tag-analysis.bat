@echo off
echo ========================================
echo    TEST D'ANALYSE DES TAGS
echo ========================================
echo.
echo Ce script va tester l'analyse automatique
echo des tags sans modifier les donnees.
echo.
echo Il va analyser quelques correspondances
echo et montrer quels tags seraient assignes.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Execution du test d'analyse...
node src/scripts/test-tag-analysis.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul

@echo off
echo ========================================
echo    RECHERCHE TAGS PERSONNALISES
echo ========================================
echo.
echo Ce script va chercher en profondeur
echo vos tags personnalises dans la base:
echo - Police, AOCA, Douane
echo - Concessionaire1, Syndicat
echo - Commute consultatif
echo.
echo Il va utiliser plusieurs methodes
echo pour les trouver.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Recherche approfondie...
node src/scripts/find-real-custom-tags.js

echo.
echo ========================================
echo Recherche terminee. Appuyez sur une touche...
pause > nul

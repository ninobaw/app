@echo off
echo ========================================
echo    RECREATION TAGS PERSONNALISES
echo ========================================
echo.
echo Ce script va recreer vos tags personnalises
echo qui ont ete perdus:
echo.
echo - Police (rouge)
echo - AOCA (bleu)
echo - Douane (vert)
echo - Concessionaire1 (vert clair)
echo - Syndicat (violet)
echo - Commute consultatif (orange)
echo.
echo Ces tags seront marques comme personnalises
echo et non comme tags systeme.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Recreation des tags personnalises...
node src/scripts/recreate-custom-tags.js

echo.
echo ========================================
echo Recreation terminee. Appuyez sur une touche...
pause > nul

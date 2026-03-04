@echo off
echo ========================================
echo    VERIFICATION DES TAGS REELS
echo ========================================
echo.
echo Ce script va verifier quels tags
echo existent REELLEMENT dans votre
echo base de donnees MongoDB.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Verification des tags dans MongoDB...
node src/scripts/check-real-tags.js

echo.
echo ========================================
echo Verification terminee. Appuyez sur une touche...
pause > nul

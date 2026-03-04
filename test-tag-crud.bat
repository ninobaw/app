@echo off
title Test CRUD Tags
color 0A

echo.
echo ========================================
echo   Test CRUD des Tags AeroDoc
echo ========================================
echo.

echo 🔍 Test complet des opérations CRUD sur les tags...
echo    - Création
echo    - Lecture
echo    - Modification  
echo    - Suppression
echo.

cd /d "%~dp0"
node backend\src\scripts\test-tag-crud.js

echo.
echo ✨ Test terminé !
pause

@echo off
title Test des Opérations Tags
color 0A

echo.
echo ========================================
echo   Test des Opérations Tags AeroDoc
echo ========================================
echo.

echo 🔍 Test des fonctionnalités de modification et suppression des tags...
echo.

cd /d "%~dp0"
node backend\src\scripts\test-tag-operations.js

echo.
echo ✨ Test terminé !
pause

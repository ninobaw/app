@echo off
echo ========================================
echo    TEST DASHBOARD SUPERVISEUR - FIX
echo ========================================
echo.
echo Ce script va:
echo 1. Tester la connexion au dashboard superviseur
echo 2. Verifier les donnees reelles
echo 3. Corriger les problemes detectes
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test du dashboard superviseur...
node src/scripts/test-supervisor-dashboard.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul

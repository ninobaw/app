@echo off
echo ========================================
echo    AJOUT TAG AOCA MANQUANT
echo ========================================
echo.
echo Ce script va ajouter le tag AOCA
echo qui semble manquer dans vos tags
echo personnalises.
echo.
echo Tag AOCA:
echo - Nom: AOCA
echo - Couleur: Bleu (#3B82F6)
echo - Description: Office Aviation Civile
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Ajout du tag AOCA...
node src/scripts/add-missing-aoca-tag.js

echo.
echo ========================================
echo Ajout termine. Appuyez sur une touche...
pause > nul

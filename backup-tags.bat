@echo off
echo ========================================
echo    SAUVEGARDE DES TAGS ACTUELS
echo ========================================
echo.
echo Ce script va sauvegarder tous les tags
echo actuels des correspondances avant
echo l'auto-assignation.
echo.
echo La sauvegarde sera creee dans:
echo backend/backups/tags-backup-[timestamp].json
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Creation de la sauvegarde...
node src/scripts/backup-tags.js

echo.
echo ========================================
echo Sauvegarde terminee. Appuyez sur une touche...
pause > nul

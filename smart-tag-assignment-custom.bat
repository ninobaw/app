@echo off
echo ========================================
echo    ASSIGNATION TAGS PERSONNALISES
echo ========================================
echo.
echo Ce script va assigner automatiquement
echo VOS TAGS PERSONNALISES aux correspondances:
echo.
echo Tags utilises:
echo - Police (rouge)
echo - AOCA (bleu)  
echo - Douane (vert)
echo - Concessionaire1 (vert clair)
echo - Syndicat (violet)
echo - Commute consultatif (orange)
echo.
echo Les tags systeme seront IGNORES.
echo.
echo ATTENTION: Cette operation va modifier
echo les tags de vos correspondances !
echo.
set /p confirm="Etes-vous sur ? (oui/non): "
if /i "%confirm%" NEQ "oui" (
    echo Operation annulee.
    pause
    exit /b 0
)

cd /d "%~dp0"
cd backend

echo.
echo Assignation avec vos tags personnalises...
node src/scripts/smart-tag-assignment-custom.js

echo.
echo ========================================
echo Assignation terminee. Appuyez sur une touche...
pause > nul

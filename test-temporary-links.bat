@echo off
echo.
echo ========================================
echo  TEST DU SYSTEME DE LIENS TEMPORAIRES
echo ========================================
echo.

cd /d "%~dp0backend"

echo Execution du test des liens temporaires...
echo.

node src/scripts/test-temporary-links.js

echo.
echo Test termine. Appuyez sur une touche pour fermer...
pause >nul

@echo off
echo ========================================
echo TEST DE CORRECTION D'ASSIGNATION
echo ========================================
echo.

echo 1. Test assignation manuelle (doit assigner seulement à la personne spécifiée)
echo ----------------------------------------
node test-manual-assignment.js
echo.

echo 2. Test assignation automatique (doit assigner selon les mots-clés)
echo ----------------------------------------
node test-auto-assignment.js
echo.

echo ========================================
echo TESTS TERMINÉS
echo ========================================
pause

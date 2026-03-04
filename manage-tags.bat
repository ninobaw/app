@echo off
title Gestionnaire de Tags Intelligent
color 0A

:MENU
cls
echo.
echo ========================================
echo    GESTIONNAIRE DE TAGS INTELLIGENT
echo ========================================
echo.
echo Ce systeme analyse le contenu des correspondances
echo et assigne automatiquement les tags les plus
echo pertinents depuis votre table Tags.
echo.
echo Choisissez une option:
echo.
echo 1. Tester l'analyse intelligente (tous les tags)
echo 2. Tester avec VOS TAGS PERSONNALISES uniquement
echo 3. Sauvegarder les tags actuels
echo 4. Assignation intelligente (tous les tags)
echo 5. Assignation avec VOS TAGS PERSONNALISES
echo 6. Restaurer une sauvegarde
echo 7. Quitter
echo.
set /p choice="Votre choix (1-7): "

if "%choice%"=="1" goto TEST
if "%choice%"=="2" goto TEST_CUSTOM
if "%choice%"=="3" goto BACKUP
if "%choice%"=="4" goto ASSIGN
if "%choice%"=="5" goto ASSIGN_CUSTOM
if "%choice%"=="6" goto RESTORE
if "%choice%"=="7" goto EXIT
goto MENU

:TEST
cls
echo ========================================
echo    TEST D'ANALYSE INTELLIGENTE
echo ========================================
echo.
echo Ce test va analyser le contenu de vos
echo correspondances et calculer des scores
echo de pertinence pour chaque tag de la base.
echo.
echo AUCUNE MODIFICATION ne sera apportee.
echo.
pause
call test-smart-analysis.bat
goto MENU

:TEST_CUSTOM
cls
echo ========================================
echo    TEST TAGS PERSONNALISES
echo ========================================
echo.
echo Ce test va analyser vos correspondances
echo avec VOS TAGS PERSONNALISES uniquement:
echo Police, AOCA, Douane, Concessionaire1,
echo Syndicat, Commute consultatif
echo.
echo Les tags systeme seront IGNORES.
echo.
pause
call test-custom-analysis.bat
goto MENU

:BACKUP
cls
echo ========================================
echo    SAUVEGARDE DES TAGS
echo ========================================
echo.
echo Cette operation va sauvegarder tous
echo les tags actuels de vos correspondances.
echo.
echo IMPORTANT: Faites toujours une sauvegarde
echo avant d'auto-assigner les tags !
echo.
pause
call backup-tags.bat
goto MENU

:ASSIGN
cls
echo ========================================
echo    ASSIGNATION INTELLIGENTE DES TAGS
echo ========================================
echo.
echo ATTENTION: Cette operation va analyser
echo le contenu de toutes les correspondances
echo et remplacer leurs tags par les tags
echo les plus pertinents de votre table Tags.
echo.
echo Le systeme utilise un algorithme intelligent
echo qui calcule des scores de pertinence.
echo.
echo Assurez-vous d'avoir fait une sauvegarde !
echo.
set /p confirm="Etes-vous sur ? (oui/non): "
if /i "%confirm%"=="oui" (
    call smart-tag-assignment.bat
) else (
    echo Operation annulee.
    pause
)
goto MENU

:ASSIGN_CUSTOM
cls
echo ========================================
echo    ASSIGNATION TAGS PERSONNALISES
echo ========================================
echo.
echo ATTENTION: Cette operation va analyser
echo le contenu de toutes les correspondances
echo et remplacer leurs tags par VOS TAGS
echo PERSONNALISES les plus pertinents:
echo.
echo Police, AOCA, Douane, Concessionaire1,
echo Syndicat, Commute consultatif
echo.
echo Les tags systeme seront IGNORES.
echo.
echo Assurez-vous d'avoir fait une sauvegarde !
echo.
set /p confirm="Etes-vous sur ? (oui/non): "
if /i "%confirm%"=="oui" (
    call smart-tag-assignment-custom.bat
) else (
    echo Operation annulee.
    pause
)
goto MENU

:RESTORE
cls
echo ========================================
echo    RESTAURATION DES TAGS
echo ========================================
echo.
echo Cette option permet de restaurer les tags
echo depuis une sauvegarde precedente.
echo.
cd /d "%~dp0"
cd backend

echo Fichiers de sauvegarde disponibles:
echo.
if exist "backups\tags-backup-*.json" (
    dir /b backups\tags-backup-*.json
    echo.
    set /p filename="Nom du fichier a restaurer: "
    node src/scripts/restore-tags.js !filename!
) else (
    echo Aucun fichier de sauvegarde trouve.
)
echo.
pause
goto MENU

:EXIT
cls
echo.
echo Merci d'avoir utilise le gestionnaire de tags !
echo.
pause
exit

:ERROR
echo.
echo Erreur: Option invalide
pause
goto MENU

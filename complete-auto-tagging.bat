@echo off
title Auto-Tagging Complet des Correspondances
color 0A

echo.
echo ========================================
echo   AUTO-TAGGING COMPLET - CORRESPONDANCES
echo ========================================
echo.

echo 🎯 PROCESSUS COMPLET:
echo 1. Configuration des mots-clés par tag
echo 2. Analyse intelligente du contenu
echo 3. Attribution automatique des tags
echo 4. Vérification des résultats
echo.

echo 🔧 FONCTIONNALITÉS AVANCÉES:
echo - Dictionnaire de 20+ tags prédéfinis
echo - Plus de 200 mots-clés configurés
echo - Système de poids pour prioriser les tags
echo - Analyse multi-champs (sujet, contenu, adresses)
echo - Préservation des tags existants
echo - Limitation intelligente (5 tags max par correspondance)
echo.

echo 📋 TAGS SUPPORTÉS:
echo Administrative: urgent, important, confidentiel
echo Départements: technique, commercial, rh, financier, juridique
echo Opérations: sécurité, qualité, formation, maintenance
echo Processus: réunion, rapport, projet, procédure
echo Relations: client, fournisseur
echo Aéroportuaire: aviation, piste, passager, douane, météo
echo.

echo ⚠️  PRÉCAUTIONS:
echo - Sauvegarde recommandée avant exécution
echo - Test sur un échantillon d'abord
echo - Vérification manuelle conseillée
echo - Possibilité d'ajustement des configurations
echo.

echo.
echo ========================================
echo ÉTAPE 1: CONFIGURATION DES MOTS-CLÉS
echo ========================================
echo.

echo 🔧 Analyse des tags existants et configuration des mots-clés...
node backend\src\scripts\configure-tag-keywords.js

echo.
echo ========================================
echo ÉTAPE 2: AUTO-TAGGING DES CORRESPONDANCES
echo ========================================
echo.

echo 🏷️  Démarrage de l'auto-tagging intelligent...
node backend\src\scripts\auto-tag-correspondances.js

echo.
echo ========================================
echo ÉTAPE 3: VÉRIFICATION DES RÉSULTATS
echo ========================================
echo.

echo 📊 Vérification de l'état final des tags...
node backend\src\scripts\test-correspondance-tags.js

echo.
echo ========================================
echo   PROCESSUS TERMINÉ
echo ========================================
echo.

echo ✅ RÉSULTATS:
echo - Configuration des mots-clés appliquée
echo - Correspondances analysées et taguées
echo - Statistiques d'utilisation générées
echo.

echo 🚀 PROCHAINES ÉTAPES:
echo 1. Vérifier les résultats dans l'interface web
echo 2. Aller dans Correspondances
echo 3. Utiliser le nuage de tags pour filtrer
echo 4. Ajuster les configurations si nécessaire
echo.

echo 🔧 PERSONNALISATION:
echo Pour personnaliser les mots-clés:
echo 1. Modifier backend\src\scripts\configure-tag-keywords.js
echo 2. Ajouter vos propres tags et mots-clés
echo 3. Ajuster les poids selon vos priorités
echo 4. Relancer le processus
echo.

echo 📁 FICHIERS GÉNÉRÉS:
echo - tag-keywords-config.json: Configuration exportée
echo - Logs détaillés dans la console
echo.

echo ========================================
pause

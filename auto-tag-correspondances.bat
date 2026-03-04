@echo off
title Auto-Tagging des Correspondances
color 0A

echo.
echo ========================================
echo   AUTO-TAGGING DES CORRESPONDANCES
echo ========================================
echo.

echo 🎯 OBJECTIF:
echo Analyser le contenu de chaque correspondance et ajouter
echo automatiquement les tags appropriés selon les mots-clés trouvés
echo.

echo 🔧 FONCTIONNEMENT:
echo 1. Récupération de tous les tags actifs
echo 2. Analyse du contenu de chaque correspondance
echo 3. Recherche de mots-clés correspondants aux tags
echo 4. Ajout automatique des tags pertinents
echo 5. Fusion avec les tags existants (pas de doublons)
echo.

echo 📋 MOTS-CLÉS ANALYSÉS:
echo - Sujet de la correspondance
echo - Contenu textuel
echo - Adresse expéditeur
echo - Adresse destinataire
echo.

echo 🏷️  TAGS INTELLIGENTS:
echo Le script utilise un dictionnaire de mots-clés:
echo - "urgent" : urgent, urgence, prioritaire, immédiat...
echo - "technique" : technique, informatique, système...
echo - "commercial" : commercial, vente, client, contrat...
echo - "rh" : ressources humaines, personnel, employé...
echo - "financier" : financier, budget, comptabilité...
echo - Et bien d'autres selon vos tags existants
echo.

echo ⚠️  PRÉCAUTIONS:
echo - Analyse limitée à 100 correspondances par exécution
echo - Maximum 5 tags ajoutés par correspondance
echo - Préservation des tags existants
echo - Pas de suppression de tags existants
echo.

echo 🚀 Démarrage de l'auto-tagging...
echo.

cd /d "%~dp0"
node backend\src\scripts\auto-tag-correspondances.js

echo.
echo ✨ Auto-tagging terminé !
echo.

echo 📊 PROCHAINES ÉTAPES:
echo 1. Vérifier les résultats dans l'interface
echo 2. Aller dans Correspondances
echo 3. Vérifier que les tags apparaissent
echo 4. Utiliser le nuage de tags pour filtrer
echo.

echo 🔧 SI BESOIN D'AJUSTEMENTS:
echo - Modifier les mots-clés dans le script
echo - Ajuster le seuil de correspondance
echo - Limiter/augmenter le nombre de tags par correspondance
echo - Personnaliser le dictionnaire de mots-clés
echo.

echo ========================================
pause

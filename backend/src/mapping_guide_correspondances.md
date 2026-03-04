# Guide de Mapping - Fichier Excel Correspondances

## 📋 Colonnes Requises par l'Application

L'application attend exactement ces 16 colonnes dans cet ordre :

```
title | type | from_address | to_address | subject | content | priority | status | airport | tags | file_name | responseReference | responseDate | informationTransmittedTo | informationAcknowledged | informationActions
```

## 🔄 Mapping de votre Fichier Existant

### Étape 1 : Identifier vos Colonnes Actuelles

Ouvrez votre fichier `Mise à jour correspondances -pending Revue ML.xlsx` et notez les noms de colonnes existants.

### Étape 2 : Correspondance des Colonnes

**Colonnes Probables dans votre Fichier → Nouvelles Colonnes :**

| Votre Colonne (probable) | → | Nouvelle Colonne | Exemple de Valeur |
|---------------------------|---|------------------|-------------------|
| Titre/Objet/Sujet | → | `title` | "Maintenance piste principale" |
| Type/Direction | → | `type` | `INCOMING` ou `OUTGOING` |
| Expéditeur/De | → | `from_address` | "maintenance@enfidha.tn" |
| Destinataire/À | → | `to_address` | "direction@enfidha.tn" |
| Objet/Sujet | → | `subject` | "Rapport maintenance" |
| Contenu/Description | → | `content` | "Description détaillée..." |
| Priorité | → | `priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| Statut | → | `status` | `PENDING`, `REPLIED`, `INFORMATIF` |
| Aéroport/Site | → | `airport` | `ENFIDHA`, `MONASTIR`, `GENERALE` |
| Tags/Mots-clés | → | `tags` | "maintenance,urgent" |
| Fichier/Pièce jointe | → | `file_name` | "rapport.pdf" |

### Étape 3 : Nouvelles Colonnes à Ajouter

**Colonnes GM à ajouter manuellement :**

| Nouvelle Colonne | Valeur par Défaut | Description |
|------------------|-------------------|-------------|
| `responseReference` | (vide) | Référence de la réponse (ex: "REP-2024-001") |
| `responseDate` | (vide) | Date de réponse (format: "2024-01-15") |
| `informationTransmittedTo` | (vide) | Personne/service destinataire |
| `informationAcknowledged` | `false` | Accusé réception (true/false) |
| `informationActions` | (vide) | Actions prises suite à l'information |

## 🛠️ Instructions de Conversion

### Option A : Modification Manuelle
1. Ouvrez votre fichier Excel
2. Renommez les colonnes selon le mapping ci-dessus
3. Ajoutez les 5 nouvelles colonnes GM
4. Remplissez les valeurs par défaut
5. Sauvegardez au format .xlsx

### Option B : Utilisation du Modèle
1. Téléchargez le modèle depuis l'interface d'import
2. Copiez vos données ligne par ligne
3. Adaptez les valeurs selon les formats requis

## ⚠️ Valeurs Importantes à Vérifier

- **type** : Doit être exactement `INCOMING` ou `OUTGOING`
- **priority** : `LOW`, `MEDIUM`, `HIGH`, ou `URGENT`
- **status** : `PENDING`, `REPLIED`, ou `INFORMATIF`
- **airport** : `ENFIDHA`, `MONASTIR`, ou `GENERALE`
- **informationAcknowledged** : `true` ou `false` (pas de majuscules)

## 🎯 Exemple de Ligne Complète

```
Maintenance Piste,INCOMING,maintenance@enfidha.tn,direction@enfidha.tn,Rapport maintenance,Intervention requise sur piste principale,HIGH,PENDING,ENFIDHA,maintenance;urgent,rapport.pdf,,,,,
```

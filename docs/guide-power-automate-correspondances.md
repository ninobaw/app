# Guide d'Adaptation Power Automate pour AeroDoc

## Vue d'ensemble

Ce guide détaille l'adaptation de votre script Power Automate pour extraire les correspondances emails et les formater selon les exigences de l'application AeroDoc.

## Améliorations Apportées

### 1. Génération Automatique d'Identifiants

**Avant :**
```json
"item/title": "@items('For_each_2')?['subject']"
```

**Après :**
```json
"item/ID": "CORR-@{formatDateTime(utcNow(), 'yyyy-MM')}-@{padLeft(variables('SequenceCounter'), 3, '0')}"
"item/QRCode": "QR-@{outputs('Compose_-_Generate_ID')}"
```

### 2. Classification Intelligente

#### Type de Correspondance
- **INCOMING** : Emails provenant d'expéditeurs externes (non @tav.aero)
- **OUTGOING** : Emails envoyés depuis TAV (@tav.aero)

#### Priorité Automatique
- **URGENT** : Importance "high" + mots-clés "urgent"
- **HIGH** : Importance "high"
- **MEDIUM** : Importance "normal" (défaut)
- **LOW** : Importance "low"

#### Statut Intelligent
- **INFORMATIF** : Sujet contient "FYI"
- **REPLIED** : Sujet contient "RE:"
- **PENDING** : Défaut pour nouvelles correspondances

### 3. Extraction de Métadonnées

#### Aéroport de Destination
```json
"@if(or(contains(toLower(items('For_each_email')?['subject']), 'enfidha'), 
       contains(toLower(items('For_each_email')?['subject']), 'nbe')), 
   'ENFIDHA', 
   if(or(contains(toLower(items('For_each_email')?['subject']), 'monastir'), 
         contains(toLower(items('For_each_email')?['subject']), 'skanes')), 
      'MONASTIR', 
      'GENERALE'))"
```

#### Tags Automatiques
- Extraction basée sur mots-clés : urgent, sécurité, maintenance, opération
- Format : tags séparés par point-virgule

#### Langue de Détection
- **FR** : Contenu contient "bonjour"
- **EN** : Contenu contient "hello"
- **AR** : Défaut

### 4. Gestion des Pièces Jointes

#### Organisation des Fichiers
```
/AeroDoc/Correspondances/YYYY-MM/
├── CORR-2024-01-001_document.pdf
├── CORR-2024-01-002_rapport.xlsx
└── ...
```

#### Nommage Standardisé
Format : `{ID_CORRESPONDANCE}_{NOM_ORIGINAL}`

### 5. Délais de Réponse Automatiques

```json
"item/ResponseDeadline": "@if(equals(outputs('Compose_-_Determine_Priority'), 'HIGH'), 
                            formatDateTime(addDays(utcNow(), 2), 'yyyy-MM-ddTHH:mm:ssZ'), 
                            if(equals(outputs('Compose_-_Determine_Priority'), 'URGENT'), 
                               formatDateTime(addDays(utcNow(), 1), 'yyyy-MM-ddTHH:mm:ssZ'), 
                               formatDateTime(addDays(utcNow(), 7), 'yyyy-MM-ddTHH:mm:ssZ')))"
```

- **URGENT** : 1 jour
- **HIGH** : 2 jours  
- **MEDIUM/LOW** : 7 jours

## Format Excel de Sortie

### Colonnes Obligatoires

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| ID | String | Identifiant unique | CORR-2024-01-001 |
| Title | String | Titre/Sujet | RE: Procédures sécurité |
| Type | Enum | INCOMING/OUTGOING | INCOMING |
| FromAddress | String | Expéditeur | asma@example.com |
| ToAddress | String | Destinataires | user@tav.aero;cc@tav.aero |
| Subject | String | Sujet original | RE: Procédures sécurité |
| Content | String | Contenu texte | Contenu converti HTML→Text |
| Priority | Enum | LOW/MEDIUM/HIGH/URGENT | HIGH |
| Status | Enum | PENDING/REPLIED/INFORMATIF | PENDING |
| Airport | Enum | ENFIDHA/MONASTIR/GENERALE | ENFIDHA |
| QRCode | String | Code QR unique | QR-CORR-2024-01-001 |

### Colonnes Optionnelles

| Colonne | Description | Valeur par Défaut |
|---------|-------------|-------------------|
| Code | Code manuel | "" |
| AuthorId | Utilisateur créateur | "system-import" |
| FilePath | Chemin fichier | Auto-généré si PJ |
| FileType | Extension fichier | Extrait du nom |
| Tags | Mots-clés | Auto-extraits |
| ResponseReference | Référence réponse | "" |
| ResponseDate | Date réponse | "" |
| IsUrgent | Urgence | TRUE/FALSE |
| IsConfidential | Confidentialité | TRUE/FALSE |

## Configuration Recommandée

### Fréquence d'Exécution
```json
"recurrence": {
  "interval": 1,
  "frequency": "Hour",
  "schedule": {
    "hours": [8, 10, 12, 14, 16, 18],
    "minutes": [0]
  }
}
```

### Paramètres Email
- **fetchOnlyUnread**: `true` (traiter seulement nouveaux emails)
- **includeAttachments**: `true`
- **top**: `50` (limite raisonnable)

### Actions Post-Traitement
1. **Marquer comme lu** : Évite les doublons
2. **Incrémenter compteur** : Séquence unique
3. **Sauvegarder PJ** : Organisation par mois

## Import dans AeroDoc

### API d'Import
L'application dispose d'une API d'import des correspondances :
```
POST /api/correspondances/import
Content-Type: multipart/form-data
```

### Format Attendu
- Fichier Excel avec colonnes standardisées
- Validation automatique des données
- Génération des codes de correspondance
- Notification des utilisateurs concernés

## Bonnes Pratiques

### Gestion des Erreurs
- Vérifier la présence des champs obligatoires
- Valider les formats d'email
- Gérer les pièces jointes volumineuses

### Performance
- Limiter le nombre d'emails traités par exécution
- Utiliser le mode chunked pour les gros fichiers
- Optimiser les expressions Power Automate

### Sécurité
- Ne pas exposer les contenus confidentiels
- Respecter les permissions des dossiers
- Chiffrer les données sensibles

## Dépannage

### Erreurs Communes
1. **Dossier non trouvé** : Vérifier les IDs de dossiers Outlook
2. **Limite de taille** : Pièces jointes > 25MB
3. **Format Excel** : Colonnes manquantes ou mal nommées
4. **Permissions** : Accès OneDrive/SharePoint

### Logs Utiles
- Historique d'exécution Power Automate
- Contenu des variables intermédiaires
- Réponses des API Excel/OneDrive

## Migration depuis l'Ancien Script

### Étapes
1. Sauvegarder l'ancien script
2. Créer nouveau fichier Excel avec colonnes AeroDoc
3. Tester avec quelques emails
4. Migrer progressivement les dossiers
5. Valider les imports dans AeroDoc

### Vérifications
- [ ] IDs uniques générés
- [ ] QR codes valides
- [ ] Classifications correctes
- [ ] Pièces jointes sauvegardées
- [ ] Emails marqués comme lus

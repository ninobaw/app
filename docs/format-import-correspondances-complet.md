# Format d'Import Complet des Correspondances AeroDoc

## Colonnes Obligatoires du Modèle

Le fichier CSV d'import doit contenir **toutes** les colonnes suivantes pour être compatible avec le modèle Correspondance de l'application :

### 1. Identification et Métadonnées
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `_id` | String | Identifiant unique | CORR-2024-001 |
| `title` | String | Titre de la correspondance | RE: Procédures de sécurité |
| `authorId` | String | ID utilisateur créateur | user-admin-001 |
| `qrCode` | String | Code QR unique | QR-CORR-2024-001 |

### 2. Fichiers et Versions
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `filePath` | String | Chemin du fichier | /uploads/correspondances/doc.pdf |
| `fileType` | String | Extension du fichier | pdf |
| `version` | Number | Version du document | 1 |
| `viewsCount` | Number | Nombre de vues | 0 |
| `downloadsCount` | Number | Nombre de téléchargements | 0 |

### 3. Classification
| Colonne | Type | Description | Valeurs Possibles |
|---------|------|-------------|-------------------|
| `type` | Enum | Type de correspondance | INCOMING, OUTGOING |
| `code` | String | Code manuel (optionnel) | "" |
| `priority` | Enum | Niveau de priorité | LOW, MEDIUM, HIGH, URGENT |
| `status` | Enum | Statut actuel | PENDING, REPLIED, INFORMATIF, CLOTURER, DRAFT |
| `airport` | Enum | Aéroport concerné | ENFIDHA, MONASTIR, GENERALE |

### 4. Contenu Email
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `fromAddress` | String | Adresse expéditeur | user@external.com |
| `toAddress` | String | Adresse(s) destinataire(s) | user@tav.aero;cc@tav.aero |
| `subject` | String | Sujet de l'email | RE: Procédures de sécurité |
| `content` | String | Contenu du message | Bonjour, suite à... |

### 5. Pièces Jointes et Tags
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `attachments` | String | Nom(s) des fichiers joints | document.pdf |
| `tags` | String | Mots-clés séparés par ; | sécurité;urgent;procédures |

### 6. Suivi des Réponses
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `responseReference` | String | Référence de la réponse | REP-2024-001 |
| `responseDate` | Date | Date de la réponse | 2024-01-16T14:00:00Z |
| `responseDeadline` | Date | Date limite de réponse | 2024-01-20T23:59:59Z |

### 7. Gestion Informative
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `informationTransmittedTo` | String | Destinataire de l'info | team@tav.aero |
| `informationAcknowledged` | Boolean | Information prise en compte | TRUE/FALSE |
| `informationActions` | String | Actions prises | Diffusion effectuée |

### 8. Indicateurs
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `isUrgent` | Boolean | Correspondance urgente | TRUE/FALSE |
| `isConfidential` | Boolean | Correspondance confidentielle | TRUE/FALSE |

### 9. Codes de Classification
| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `company_code` | String | Code société | TAV |
| `scope_code` | String | Code domaine | SEC, MAINT, OPS, REG, ADMIN |
| `department_code` | String | Code département | OPS, ADMIN, CERT |
| `sub_department_code` | String | Code sous-département | ENFIDHA, MONASTIR, GENERALE |
| `language_code` | String | Code langue | FR, EN, AR |
| `sequence_number` | Number | Numéro de séquence | 1, 2, 3... |

### 10. Horodatage
| Colonne | Type | Description | Format |
|---------|------|-------------|--------|
| `createdAt` | Date | Date de création | 2024-01-15T10:30:00Z |
| `updatedAt` | Date | Date de modification | 2024-01-15T10:30:00Z |

## Exemples de Données par Statut

### Correspondance PENDING (En attente)
```csv
CORR-2024-001,RE: Procédures de sécurité,user-admin-001,QR-CORR-2024-001,/uploads/correspondances/doc.pdf,pdf,1,0,0,INCOMING,,sender@external.com,user@tav.aero,RE: Procédures de sécurité,Contenu du message...,HIGH,PENDING,ENFIDHA,doc.pdf,sécurité;procédures,,,,,2024-01-20T23:59:59Z,FALSE,FALSE,TAV,SEC,OPS,ENFIDHA,FR,1,2024-01-15T10:30:00Z,2024-01-15T10:30:00Z
```

### Correspondance REPLIED (Répondue)
```csv
CORR-2024-002,Rapport maintenance,user-admin-001,QR-CORR-2024-002,/uploads/correspondances/rapport.xlsx,xlsx,1,0,0,OUTGOING,,user@tav.aero,maintenance@tav.aero,Rapport maintenance,Rapport mensuel...,MEDIUM,REPLIED,MONASTIR,rapport.xlsx,maintenance;rapport,REP-2024-002,2024-01-16T14:00:00Z,maintenance@tav.aero,TRUE,Maintenance programmée,2024-01-22T23:59:59Z,FALSE,FALSE,TAV,MAINT,OPS,MONASTIR,FR,2,2024-01-15T11:00:00Z,2024-01-16T14:00:00Z
```

### Correspondance INFORMATIF
```csv
CORR-2024-003,FYI: Nouvelle réglementation,user-admin-001,QR-CORR-2024-003,/uploads/correspondances/regulation.pdf,pdf,1,0,0,INCOMING,,regulation@oaci.int,user@tav.aero,FYI: Nouvelle réglementation,Information réglementaire...,MEDIUM,INFORMATIF,GENERALE,regulation.pdf,réglementation;oaci,,,team@tav.aero,TRUE,Diffusion effectuée,,FALSE,FALSE,TAV,REG,ADMIN,GENERALE,FR,3,2024-01-15T12:00:00Z,2024-01-15T12:00:00Z
```

## Règles de Validation

### Champs Obligatoires
- `_id`, `title`, `authorId`, `qrCode`
- `type`, `fromAddress`, `toAddress`, `subject`, `content`
- `priority`, `status`, `airport`
- `createdAt`, `updatedAt`

### Valeurs d'Énumération
- **type** : INCOMING, OUTGOING
- **priority** : LOW, MEDIUM, HIGH, URGENT
- **status** : PENDING, REPLIED, INFORMATIF, CLOTURER, DRAFT
- **airport** : ENFIDHA, MONASTIR, GENERALE

### Formats de Date
- Format ISO 8601 : `2024-01-15T10:30:00Z`
- Toujours en UTC

### Booléens
- Valeurs acceptées : `TRUE`, `FALSE` (en majuscules)

## Conseils d'Import

### Génération d'IDs
- Format recommandé : `CORR-YYYY-NNN`
- QR Code : `QR-{ID}`

### Gestion des Fichiers
- Chemin relatif depuis `/uploads/correspondances/`
- Extension extraite automatiquement du nom de fichier

### Tags
- Séparés par point-virgule (`;`)
- Pas d'espaces avant/après les points-virgules

### Dates de Délai
- URGENT : +1 jour
- HIGH : +2 jours
- MEDIUM/LOW : +7 jours

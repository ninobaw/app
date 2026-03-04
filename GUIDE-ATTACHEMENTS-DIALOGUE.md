# 📎 Guide des Attachements - Dialogue Conversationnel

## 🎯 **Vue d'ensemble**

Le dialogue conversationnel supporte maintenant les **attachements de fichiers** pour les **directeurs** ET le **Directeur Général**, permettant un échange complet de documents dans le processus de validation.

## 👥 **Qui peut joindre des fichiers ?**

### **✅ Directeurs (DIRECTEUR, SOUS_DIRECTEUR)**
- **Propositions initiales** : Joindre documents de travail, brouillons, références
- **Révisions** : Joindre versions corrigées, documents complémentaires
- **Exemples** : Lettres types, rapports, analyses, tableaux Excel

### **✅ Directeur Général (DIRECTEUR_GENERAL)**
- **Commentaires de révision** : Joindre guides, modèles, exemples
- **Approbations** : Joindre références, validations, signatures
- **Exemples** : Templates officiels, directives, exemples de bonnes pratiques

## 📁 **Types de fichiers supportés**

### **Formats acceptés :**
- **Documents** : PDF, DOC, DOCX, TXT
- **Images** : JPG, JPEG, PNG
- **Autres** : Selon configuration serveur

### **Limites :**
- **Taille maximale** : Selon configuration serveur
- **Nombre de fichiers** : Illimité par message
- **Sécurité** : Scan antivirus automatique

## 🚀 **Comment utiliser les attachements**

### **1. Ajouter des fichiers**

#### **Méthode 1 : Drag & Drop**
```
1. Glissez vos fichiers dans la zone de saisie
2. Les fichiers apparaissent dans la liste "Pièces jointes à envoyer"
3. Vérifiez la liste avant d'envoyer
```

#### **Méthode 2 : Sélection manuelle**
```
1. Cliquez sur "Joindre fichier" 📎
2. Sélectionnez un ou plusieurs fichiers
3. Confirmez la sélection
```

### **2. Gérer les fichiers sélectionnés**

#### **Prévisualisation :**
- **Nom du fichier** affiché
- **Taille** en MB
- **Icône** selon le type de fichier

#### **Suppression :**
- **Bouton X** pour retirer un fichier
- **Avant envoi** seulement
- **Après envoi** : fichiers définitifs

### **3. Envoyer avec attachements**

```
1. Rédigez votre message
2. Ajoutez vos fichiers
3. Vérifiez la liste des attachements
4. Cliquez "Envoyer proposition" ou "Envoyer feedback"
5. Upload automatique + envoi du message
```

## 💬 **Cas d'usage par rôle**

### **📋 Directeurs - Propositions**

#### **Proposition initiale :**
```
Message : "Voici ma proposition de réponse pour cette correspondance..."
Fichiers : 
- brouillon_reponse.docx
- analyse_situation.pdf
- donnees_support.xlsx
```

#### **Révision après feedback :**
```
Message : "J'ai intégré vos commentaires. Voici la version révisée..."
Fichiers :
- reponse_revisee_v2.docx
- corrections_apportees.pdf
```

### **👑 Directeur Général - Feedbacks**

#### **Demande de révision :**
```
Message : "Merci pour cette proposition. Veuillez réviser selon les points suivants..."
Fichiers :
- template_officiel.docx
- guide_redaction.pdf
- exemple_reponse_similaire.pdf
```

#### **Approbation avec commentaires :**
```
Message : "Excellente proposition ! Approuvée avec ces références complémentaires..."
Fichiers :
- validation_dg.pdf
- references_juridiques.pdf
```

## 📱 **Interface utilisateur**

### **Zone de saisie enrichie :**

```
┌─────────────────────────────────────────┐
│ [Demander révision] [Approuver]         │ ← DG uniquement
│ 💡 Vous pouvez joindre des documents... │
├─────────────────────────────────────────┤
│ Pièces jointes à envoyer :              │
│ 📄 document.pdf (2.5 MB) [X]           │
│ 📄 guide.docx (1.2 MB) [X]             │
├─────────────────────────────────────────┤
│ [Zone de texte pour message]            │
├─────────────────────────────────────────┤
│ [📎 Joindre fichier] [Envoyer ➤]       │
└─────────────────────────────────────────┘
```

### **Affichage dans la conversation :**

```
┌─────────────────────────────────────────┐
│ 👑 Mohamed Sassi (DG) - 14:30          │
│ ├─────────────────────────────────────┤ │
│ │ Voici mes commentaires de révision  │ │
│ │                                     │ │
│ │ Pièces jointes :                    │ │
│ │ 📄 template_officiel.docx [⬇]      │ │
│ │ 📄 guide_style.pdf [⬇]             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔧 **Fonctionnalités techniques**

### **Upload intelligent :**
- **Upload automatique** lors de l'envoi
- **Gestion d'erreurs** avec fallback
- **Indicateur de progression** (à venir)
- **Validation côté client** et serveur

### **Stockage sécurisé :**
- **Dossiers organisés** par correspondance
- **Noms uniques** pour éviter conflits
- **Accès contrôlé** selon permissions
- **Backup automatique** (selon config)

### **Téléchargement :**
- **Bouton de téléchargement** sur chaque fichier
- **Nom original** préservé
- **Authentification requise**
- **Logs d'accès** pour audit

## ✅ **Avantages des attachements**

### **Pour les Directeurs :**
- **Documentation complète** des propositions
- **Versions multiples** et historique
- **Références** et sources jointes
- **Collaboration** enrichie

### **Pour le Directeur Général :**
- **Guides** et templates partagés
- **Exemples** de bonnes pratiques
- **Références** officielles
- **Validation** documentée

### **Pour le processus :**
- **Traçabilité** complète
- **Qualité** améliorée des réponses
- **Efficacité** du cycle de révision
- **Conformité** documentaire

## 🎯 **Bonnes pratiques**

### **Nommage des fichiers :**
```
✅ Bon : "reponse_correspondance_123_v2.docx"
❌ Éviter : "document.docx"

✅ Bon : "template_reponse_reclamation.pdf"
❌ Éviter : "temp.pdf"
```

### **Organisation :**
- **Un fichier principal** + documents support
- **Versions numérotées** (v1, v2, v3...)
- **Types séparés** (brouillon, final, référence)

### **Taille et format :**
- **Privilégier PDF** pour les documents finaux
- **Compresser** les images si nécessaire
- **Éviter** les fichiers trop volumineux

## 🚀 **Prochaines améliorations**

### **Fonctionnalités à venir :**
- **Prévisualisation** des fichiers dans le dialogue
- **Commentaires** sur les fichiers
- **Versions** et comparaison
- **Signatures électroniques**

---

**Les attachements transforment le dialogue conversationnel en un véritable espace de travail collaboratif ! 📎✨**

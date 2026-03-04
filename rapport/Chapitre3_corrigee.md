# Chapitre 3
## Réalisation du Projet

### Introduction

La phase de réalisation constitue l’étape clé de concrétisation du projet **AeroDoc** (Application de Gestion Documentaire Opérationnelle). Elle repose sur la méthodologie SCRUM, permettant une organisation itérative et incrémentale à travers des sprints de 4 semaines chacun. Ce chapitre décrit en détail le backlog produit, les user stories retenues, ainsi que les tâches concrètement réalisées pour chaque sprint.

---

### I. Organisation de la réalisation

#### 1. Méthodologie SCRUM adoptée

La gestion du projet a été structurée selon les rôles SCRUM suivants :
*   Product Owner : Responsable de la définition des besoins métier.
*   SCRUM Master : Garant de la méthodologie et du bon déroulement des sprints.
*   Équipe de développement : Réalise l’implémentation technique.

Le projet est découpé en 4 sprints :
*   Sprint 0 : Initialisation du projet.
*   Sprint 1 : Gestion des documents, correspondances et procès-verbaux.
*   Sprint 2 : Gestion des utilisateurs, rôles, journaux d'audit, Dashboard et rapports.
*   Sprint 3 : Profils, notifications, QR Code, authentification sécurisée et paramètres.

---

### II. Sprint 0 – Initialisation du projet (du 10 mars au 24 Mars)

**Objectifs :**
*   Mettre en place l’environnement technique et de développement.
*   Structurer le projet côté frontend et backend.
*   Choisir les technologies.

**Tâches réalisées :**
*   Création du dépôt GitHub et mise en place des branches.
*   Initialisation du backend (Node.js + Express).
*   Initialisation du frontend (React.js + Vite + TailwindCSS).
*   Configuration de la base de données MongoDB.
*   Configuration ESLint, Prettier et conventions de commit.
*   Mise en place de la sécurité de base (CORS).

---

### III. Sprint 1 – Gestion des Documents, Correspondances et PV (du 24 Mars au 21 Avril)

**Objectifs :**
*   Permettre la gestion des documents, correspondances, et procès-verbaux.
*   Assurer la traçabilité, la recherche, et le suivi des documents.

#### User Stories (Backlog)

| ID    | User Story                                                              | Rôle        | Priorité |
| :---- | :---------------------------------------------------------------------- | :---------- | :------- |
| US1   | En tant qu’utilisateur, je veux pouvoir créer un nouveau document avec un fichier joint. | Admin       | Haute    |
| US2   | En tant qu’utilisateur, je veux consulter tous les documents classés.   | Tous        | Haute    |
| US3   | En tant qu’utilisateur, je veux créer une correspondance sortante avec pièce jointe. | Admin       | Haute    |
| US4   | En tant qu’utilisateur, je veux suivre l’historique des actions sur un document. | Admin       | Moyenne  |
| US5   | En tant qu’agent qualité, je veux gérer les documents de type Qualité. | Qualité     | Moyenne  |
| US6   | En tant qu’utilisateur, je veux enregistrer un procès-verbal et suivre les actions correctives associées. | Admin       | Haute    |

#### Tâches réalisées pour chaque User Story

**US1 – Création de document**
*   Création du modèle Document (Mongoose).
*   API REST : POST /api/documents.
*   Middleware Multer pour l’import de fichiers (PDF, Word, Excel, PowerPoint).
*   Frontend : Formulaire de création avec validation, upload et aperçu.
*   Génération automatique d’un QR Code structuré basé sur la codification documentaire.

**US2 – Consultation des documents**
*   API REST : GET /api/documents.
*   Filtrage par date, type et auteur.
*   Frontend : Tableau dynamique avec recherche.

**US3 – Création d’une correspondance**
*   Modèle Correspondance.
*   API : POST /api/correspondances.
*   Champ de texte simple pour le contenu.
*   Suivi du statut (Brouillon, Envoyée, Reçue, Archivée).

**US4 – Historique d’un document**
*   Ajout de journaux de modification (logs d'activité).
*   Endpoint d’audit par document : GET /api/documents/:id/history.

**US5 – Gestion des documents de type Qualité**
*   Utilisation du type `QUALITE_DOC` dans le modèle Document.
*   Intégration dans les listes et filtres de documents.

**US6 – Gestion de procès-verbal**
*   Modèle PV avec champs pour les actions décidées (titre, responsable, échéance).
*   Interface de visualisation et de création des PVs.
*   Suivi des actions décidées (statut, date de réalisation).

---

### IV. Sprint 2 : Utilisateurs, rôles, actions, journaux d'audit, Dashboard, rapports (du 21 Avril au 19 Mai)

**Objectifs :**
*   Mettre en place la gestion des comptes utilisateurs.
*   Suivre les activités via les journaux d'audit et tableaux de bord.

#### User Stories (Backlog)

| ID    | User Story                                                              | Rôle        | Priorité |
| :---- | :---------------------------------------------------------------------- | :---------- | :------- |
| US7   | En tant que superadmin, je veux créer, modifier ou désactiver un utilisateur. | Superadmin  | Haute    |
| US8   | En tant qu’admin, je veux attribuer des rôles et permissions.           | Admin       | Haute    |
| US9   | En tant qu’utilisateur, je veux voir mon tableau de bord personnalisé.  | Tous        | Moyenne  |
| US10  | En tant que superadmin, je veux consulter les journaux d’activité du système. | Superadmin  | Moyenne  |
| US11  | En tant qu’utilisateur, je veux générer un rapport de mes documents.    | Tous        | Moyenne  |

#### Tâches réalisées

**US7 – Gestion utilisateurs**
*   Modèle User (Mongoose) avec rôle.
*   API sécurisée : CRUD utilisateur.
*   Frontend : Interface d’administration accessible via permissions (`manage_users`).

**US8 – Attribution des rôles**
*   Gestion des permissions via le contexte d'authentification et les rôles prédéfinis (SUPER_ADMIN, ADMINISTRATOR, APPROVER, USER, VISITOR, AGENT_BUREAU_ORDRE).
*   Interface pour définir les rôles lors de la création/modification d'utilisateur.

**US9 – Dashboard utilisateur**
*   Widgets affichant le nombre total de documents, d'utilisateurs actifs, d'actions complétées/en attente, de documents/correspondances créés par mois et par type, et de correspondances par priorité.
*   Requêtes optimisées avec agrégation MongoDB.
*   Design responsive (TailwindCSS).

**US10 – Journaux d’activité**
*   Audit automatique des actions clés (connexion, création/modification/suppression de documents, actions).
*   Stockage dans la collection `ActivityLog`.
*   Interface de visualisation des journaux.

**US11 – Rapport de données**
*   Génération de rapports de données structurées (JSON).
*   Export de données brutes filtrées par type de rapport.
*   Téléchargement côté frontend.

---

### V. Sprint 3 – Profils, notifications, QR Code, sécurité, paramètres (du 19 Mai au 16 juin)

**Objectifs :**
*   Renforcer la sécurité et personnalisation.
*   Gérer les QR Codes, notifications et configurations globales.

#### User Stories (Backlog)

| ID    | User Story                                                              | Rôle        | Priorité |
| :---- | :---------------------------------------------------------------------- | :---------- | :------- |
| US12  | En tant qu’utilisateur, je veux modifier mes informations de profil.    | Tous        | Moyenne  |
| US13  | En tant qu’utilisateur, je veux être notifié lorsqu’un délai d’action approche. | Tous        | Haute    |
| US14  | En tant qu’utilisateur, je veux scanner un QR Code pour voir un document. | Tous        | Haute    |
| US15  | En tant qu’admin, je veux modifier les paramètres de l’application.     | Admin       | Moyenne  |
| US16  | En tant qu’utilisateur, je veux m’authentifier de manière sécurisée.    | Tous        | Haute    |

#### Tâches réalisées

**US12 – Gestion des profils**
*   API : GET/PUT /api/users/:id.
*   Upload d’avatar.

**US13 – Notifications**
*   Déclenchement de notifications lors d'événements clés (création/mise à jour d'actions, etc.).
*   Envoi d’e-mails (nodemailer) et de SMS (Twilio) + alertes UI (toasts, dropdown).

**US14 – QR Code**
*   Génération de QR Code structurés à la création/mise à jour du document/correspondance/PV.
*   Affichage des QR Codes dans l'interface pour consultation et téléchargement.

**US15 – Paramètres globaux**
*   Interface d’administration pour définir les paramètres généraux (nom de l'organisation, aéroport par défaut, langue, thème), les paramètres de documents (rétention, taille max), les paramètres de sécurité (expiration session/mdp, 2FA), et la configuration des codes documentaires.
*   Enregistrement dynamique via la collection `AppSettings`.

**US16 – Authentification sécurisée**
*   Utilisation de bcryptjs pour le hachage des mots de passe.
*   JWT (token simulé) pour la session utilisateur.
*   Middleware de protection des routes sensibles.

---

### Conclusion

Ce chapitre a détaillé la réalisation complète du projet AeroDoc à travers les sprints successifs, en décrivant les user stories, tâches concrètes, technologies mobilisées, et fonctionnalités livrées. Grâce à une démarche SCRUM rigoureuse, les objectifs ont été atteints à chaque itération, aboutissant à une solution robuste, personnalisée, et parfaitement alignée sur les besoins opérationnels des aéroports ciblés.
# Chapitre 2
## Conception et planification du projet

### 2.1. Introduction

La réussite d’un projet de développement logiciel repose sur une planification rigoureuse, une gestion efficace des ressources, ainsi qu’une méthodologie adaptée. Ce chapitre présente la stratégie adoptée pour la conception et l'organisation du projet **AeroDoc** (Application de Gestion Documentaire Opérationnelle), en mettant en lumière les choix technologiques, l’architecture logicielle, la méthodologie de gestion, ainsi que la découpe en Sprints selon une approche agile.

### 2.2. Méthodologie de développement adoptée

Afin de garantir une flexibilité maximale face à l'évolution des besoins et assurer une livraison incrémentale des fonctionnalités, nous avons opté pour une approche Agile avec gestion par Sprints. Cette méthode offre plusieurs avantages :
*   Livraison progressive et testable.
*   Meilleure communication avec les parties prenantes.
*   Capacité à réajuster les priorités selon le retour d’expérience.
*   Déploiement rapide de modules critiques et prioritaires.

### 2.3. Architecture logicielle

Le projet repose sur une architecture client-serveur organisée comme suit :

*   **Frontend (Client) :** Développé en **React 18** avec **TypeScript**, utilisant **Vite** comme outil de build. Le design est assuré par **Tailwind CSS** et les composants **shadcn/ui**. La gestion des requêtes API est effectuée via **Axios**, la gestion d'état et le fetching de données par **TanStack Query**, et le routage par **React Router (react-router-dom)**. Les icônes proviennent de **Lucide React**, les formulaires sont gérés avec **React Hook Form**, et les utilitaires de date avec **date-fns**.
*   **Backend (Serveur) :** Réalisé avec **Node.js** et le framework **Express.js**. Il expose une API REST sécurisée, gère les rôles, la persistance des données, la génération des rapports et l’authentification. L'authentification utilise **bcryptjs** pour le hachage des mots de passe. Les notifications sont gérées via **Nodemailer** pour les emails et **Twilio** pour les SMS. L'intégration avec l'éditeur de documents est facilitée par des routes dédiées pour le **OnlyOffice Document Server**.
*   **Base de données :** **MongoDB**, choisie pour sa flexibilité documentaire, son évolutivité, et son intégration fluide avec les applications Node.js.
*   **Système de fichiers :** Utilisation de **Multer** pour la gestion des fichiers téléchargés (PDF, DOCX, XLSX) et leur organisation structurée.
*   **Sécurité :** Authentification basée sur des sessions (simulées par un token côté client), gestion des permissions granulaires via les rôles utilisateurs, et protection des routes.

### 2.4. Outils et technologies

| Technologie           | Rôle                                                              |
| :--------------------- | :---------------------------------------------------------------- |
| React 18               | Interface utilisateur                                             |
| TypeScript             | Langage de programmation typé                                     |
| Vite                   | Bundler JS et environnement de développement                      |
| Tailwind CSS           | Framework CSS utilitaire pour le design responsive                |
| shadcn/ui              | Composants UI modernes et accessibles                             |
| Node.js + Express.js   | Serveur backend et API REST                                       |
| MongoDB                | Stockage de données NoSQL                                         |
| bcryptjs               | Hachage des mots de passe                                         |
| Nodemailer             | Envoi de notifications par email                                  |
| Twilio                 | Envoi de notifications par SMS                                    |
| OnlyOffice Document Server | Édition collaborative de documents (intégration)                  |
| TanStack Query         | Gestion d'état et fetching de données côté client                 |
| React Router           | Routage côté client                                               |
| Lucide React           | Bibliothèque d'icônes                                             |
| React Hook Form        | Gestion des formulaires et validation                             |
| date-fns               | Utilitaires de manipulation de dates                              |
| Axios                  | Client HTTP pour les appels API                                   |
| Multer                 | Gestion des fichiers téléchargés                                  |
| Postman                | Test des API                                                      |
| Git / GitHub           | Gestion du code source et collaboration                           |
| Figma                  | Maquettage de l’interface utilisateur                             |

### 2.5. Planification par Sprints

La planification du développement du projet a été réalisée en quatre phases principales : un Sprint 0 pour l'initiation et trois Sprints fonctionnels correspondant à des blocs logiques du système.

### Sprint 0 : Initialisation du projet

**Objectifs :**
*   Analyse des besoins fonctionnels et techniques.
*   Étude de l’existant (système manuel de gestion).
*   Rédaction du cahier des charges.
*   Mise en place de l’environnement de développement.
*   Création des maquettes initiales (Figma).
*   Définition de l’architecture technique.

Ce sprint a permis de poser les bases du projet, valider les choix technologiques, et organiser l’ensemble des fonctionnalités à venir.

---

### Sprint 1 : Gestion documentaire et communication officielle

**Modules concernés :**
*   Gestion des Documents
*   Gestion des Correspondances
*   Gestion des Procès-verbaux

**Objectifs :**
*   Implémentation des interfaces pour créer, modifier, qualifier et importer des documents.
*   **Intégration d'un éditeur de documents complet (OnlyOffice) pour l'édition avancée, incluant la gestion des en-têtes et pieds de page.**
*   Système de suivi des correspondances avec identification des acteurs.
*   Enregistrement et visualisation des procès-verbaux par service.
*   Ajout de la gestion des formulaires liés aux documents.
*   Fonction de tri, de recherche et de téléchargement.

Ce premier sprint représente le cœur fonctionnel initial de l'application, garantissant la dématérialisation des processus papier les plus fréquents.

---

### Sprint 2 : Supervision, utilisateurs et traçabilité

**Modules concernés :**
*   Gestion des Utilisateurs et des Rôles
*   Gestion des Actions et Journaux d'Audit
*   Dashboard récapitulatif
*   Génération des Rapports d’activité

**Objectifs :**
*   Création et gestion des comptes utilisateurs avec affectation de rôles (superadmin, admin, approbateur, etc.).
*   Historique complet des actions réalisées (traçabilité via les journaux d'audit).
*   Visualisation centralisée des indicateurs de performance (KPIs).
*   Génération de rapports filtrables et exportables.
*   Système d’autorisation et middleware de validation des droits.

Ce sprint permet de centraliser la gestion administrative, de renforcer la traçabilité et d’offrir une vue stratégique de l’usage du système.

---

### Sprint 3 : Expérience utilisateur, sécurité et paramètres avancés

**Modules concernés :**
*   Profils utilisateurs personnalisés
*   Notifications en temps réel (retards, échéances, actions à réaliser)
*   Intégration de QR Code pour la traçabilité des documents physiques
*   Renforcement de l’authentification sécurisée
*   Paramètres globaux de l’application

**Objectifs :**
*   Ajout de la gestion de profils utilisateurs avec informations personnalisées.
*   Envoi de notifications internes via le Dashboard.
*   Génération et scan de QR Code liés à chaque document pour un suivi physique et numérique.
*   Mise en place de couches de sécurité supplémentaires (protection des routes, mot de passe fort).
*   Interface d’administration pour gérer les paramètres du système (délais, affectations, etc.).

Ce sprint vise à améliorer l’ergonomie, la sécurité et la maturité du produit pour une mise en production fiable.

### 2.6. Diagrammes de planification

Deux représentations ont été réalisées pour visualiser l’avancement et la coordination entre les tâches :
*   Diagramme de Gantt : Illustrant la répartition temporelle des sprints.
*   Kanban Board (Trello) : Organisation des tâches selon le statut (à faire, en cours, terminé).

### 2.7. Conclusion

La planification détaillée du projet AeroDoc en sprints distincts a permis d’organiser efficacement le développement tout en respectant les priorités fonctionnelles. L’approche Agile, combinée à une architecture modulaire et une vision orientée utilisateur, assure un produit robuste, évolutif et en phase avec les besoins de digitalisation de l’administration.
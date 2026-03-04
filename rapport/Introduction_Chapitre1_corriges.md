# Introduction générale

Dans un monde professionnel où la rapidité d’exécution, la rigueur réglementaire et la sécurité de l’information sont devenues des exigences incontournables, la gestion documentaire se révèle être un enjeu stratégique pour les organisations modernes.

Aujourd’hui, les entreprises évoluent dans un environnement numérique dense, où l'information circule en grande quantité, sous différentes formes, et sur une multitude de canaux. Pourtant, cette profusion documentaire devient rapidement contre-productive si elle n’est ni structurée, ni maîtrisée. Perte de documents critiques, non-conformité aux normes, retards opérationnels : les risques sont nombreux, et leurs impacts potentiellement graves.

Face à ces constats, il devient impératif pour les structures, publiques comme privées, de mettre en place des systèmes de gestion documentaire robustes, évolutifs et adaptés à leurs processus métiers. Cette nécessité est encore plus marquée dans des environnements sensibles et réglementés, comme celui des aéroports, où la traçabilité, la conformité et l’efficience sont des impératifs quotidiens.

C’est dans ce contexte qu’est né le projet **AeroDoc** (Application de Gestion Documentaire Opérationnelle), conçu pour accompagner les aéroports d’Enfidha et de Monastir dans leur transformation numérique. Plus qu’un simple outil de classement, AeroDoc vise à optimiser l’ensemble du cycle de vie documentaire : de la création à l’archivage, en passant par la validation, la consultation et le suivi des actions. Grâce à l'intégration d'un éditeur de documents complet et à un système de codification automatique, AeroDoc assure une gestion rigoureuse et une édition avancée des documents, y compris les en-têtes et pieds de page.

Le présent mémoire s’inscrit dans le cadre d’un projet de fin d’études d’une licence de Développement des Système Informatiques (DSI). Il retrace les différentes étapes de la conception et du développement de la solution AeroDoc, tout en proposant une réflexion plus large sur les enjeux de la gestion documentaire à l’ère du numérique.

## Objectifs du projet

*   Analyser les besoins réels en gestion documentaire dans un environnement aéroportuaire.
*   Concevoir une solution web moderne, sécurisée et conforme aux normes métier.
*   Déployer une application complète assurant centralisation, traçabilité, accessibilité et performance documentaire.
*   Offrir un système évolutif capable de s’adapter aux contraintes réglementaires et organisationnelles.

## Démarche adoptée

La conduite du projet s’est appuyée sur une méthode agile, itérative, découpée en trois sprints majeurs, couvrant les phases suivantes :

*   Analyse du besoin et modélisation du système,
*   Conception et développement des modules fonctionnels,
*   Intégration, tests et déploiement dans un environnement simulé.

---

# Chapitre 1
## Fondements théoriques de la gestion documentaire

### 1.1 Définition et rôle stratégique de la gestion documentaire

La gestion documentaire englobe l’ensemble des méthodes, outils et processus permettant de gérer efficacement les documents au sein d’une organisation. Selon la norme ISO 15489, elle vise à garantir l’authenticité, la fiabilité, l’intégrité et l’exploitabilité des documents tout au long de leur cycle de vie.

Autrefois limitée au classement physique des dossiers, la gestion documentaire a profondément évolué pour devenir un véritable pilier de la gouvernance de l'information, en lien direct avec la performance opérationnelle, la conformité réglementaire et la préservation de la mémoire organisationnelle.

### 1.2 Enjeux et risques liés à une mauvaise gestion documentaire

Une gestion documentaire déficiente peut générer des conséquences importantes :

➤ Sur le plan juridique :
*   Risques en cas d’audit ou de contrôle,
*   Perte de valeur probante des documents,
*   Absence de justificatifs en cas de litige.

➤ Sur le plan financier :
*   Amendes et sanctions en cas de non-respect des normes (ex : RGPD, ISO, OACI),
*   Coûts cachés liés à la perte de temps ou à la duplication des documents.

➤ Sur le plan organisationnel :
*   Difficultés à retrouver une information pertinente,
*   Retards dans le traitement des dossiers,
*   Perte de connaissance stratégique.

À noter : selon une étude McKinsey, un salarié passe en moyenne 20 à 30 % de son temps à rechercher de l’information. Ce chiffre illustre bien l’impact concret d’un mauvais système documentaire sur la productivité.

### 1.3 Normes et bonnes pratiques

Parmi les références majeures en matière de gestion documentaire, on retrouve :

*   ISO 15489 : Cadre de gestion des documents d’activité,
*   MoReq (Model Requirements for the Management of Electronic Records) : exigences pour la gestion des enregistrements électroniques,
*   RGPD : obligations liées à la protection des données personnelles.

Ces normes imposent des exigences strictes en matière de :

*   Conservation,
*   Accès,
*   Sécurité,
*   Archivage,
*   Traçabilité.

### 1.4 Typologie des systèmes de gestion documentaire

Il existe plusieurs types de solutions adaptées aux besoins variés des organisations :

| Type de système                     | Description                                                                                             | Exemples                 |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------ | :----------------------- |
| GED (Gestion Électronique des Documents) | Numérisation, classement, indexation et consultation centralisée des documents.                         | Alfresco, Nuxeo          |
| DMS (Document Management System)    | Gestion documentaire axée sur les droits d’accès et les versions.                                       | LogicalDOC, M-Files      |
| ECM (Enterprise Content Management) | Gestion globale du contenu d’entreprise (documents, emails, formulaires, etc.).                         | SharePoint, IBM FileNet  |

L’adoption de ces systèmes permet de :

*   Gagner en productivity,
*   Renforcer la sécurité,
*   Améliorer la collaboration,
*   Réduire les risques liés à la perte ou la diffusion d’information non maîtrisée.

### 1.5 Intérêt d’un système GED dans un environnement réglementé

Les environnements comme les aéroports sont soumis à des exigences strictes :

*   Normes internes (qualité, sécurité),
*   Normes externes (OACA, OACI, IATA, EASA),
*   Circulation multi-acteurs de l’information (direction, maintenance, sécurité, fournisseurs, auditeurs...).

Un système de gestion documentaire performant y apporte une valeur ajoutée immédiate, comme c'est le cas avec AeroDoc, qui offre :

*   Centralisation des flux documentaires (correspondances, PV, rapports...),
*   Traçabilité des actions (validation, approbation, modification) via des journaux d'audit détaillés,
*   Sécurisation de l’accès selon les rôles (authentification, permissions fines) et gestion multi-aéroports,
*   Réactivité lors des audits ou inspections réglementaires grâce à la recherche avancée et la codification automatique des documents.
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Modèles
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

/**
 * Script pour créer des données de test réalistes
 * Après un nettoyage complet de l'application
 */
class TestDataCreator {
  
  constructor() {
    this.users = {};
    this.stats = {
      correspondancesCreated: 0,
      errors: []
    };
  }

  /**
   * Connexion à MongoDB
   */
  async connectDatabase() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connexion MongoDB établie');
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB:', error);
      throw error;
    }
  }

  /**
   * Récupération des utilisateurs existants
   */
  async loadUsers() {
    console.log('\n👥 Chargement des utilisateurs...');
    
    try {
      // Récupérer les utilisateurs par rôle
      this.users.bureauOrdre = await User.find({ 
        role: { $in: ['AGENT_BUREAU_ORDRE', 'SUPERVISEUR_BUREAU_ORDRE'] }
      });
      
      this.users.directeurs = await User.find({ 
        role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
      });
      
      this.users.dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
      
      console.log(`📧 Bureau d'ordre: ${this.users.bureauOrdre.length} utilisateurs`);
      console.log(`👤 Directeurs: ${this.users.directeurs.length} utilisateurs`);
      console.log(`👑 DG: ${this.users.dg ? 'Trouvé' : 'Non trouvé'}`);
      
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Création de correspondances de test réalistes
   */
  async createTestCorrespondances() {
    console.log('\n📧 Création des correspondances de test...');
    
    const testCorrespondances = [
      {
        title: "Demande d'autorisation de vol charter - Air Tunisie Express",
        type: "Arrivee",
        from_address: "operations@airtunisiaexpress.tn",
        to_address: "enfidha@tav.aero",
        subject: "Autorisation vol charter ATE2024 - 15 passagers",
        content: `Madame, Monsieur,

Nous sollicitons par la présente l'autorisation d'effectuer un vol charter avec les caractéristiques suivantes :

- Compagnie : Air Tunisie Express
- Numéro de vol : ATE2024
- Aéronef : Boeing 737-800 (TC-ATE)
- Route : Istanbul (IST) → Enfidha (NBE)
- Date/Heure d'arrivée prévue : 25/10/2024 à 14:30 UTC
- Nombre de passagers : 15
- Nature du vol : Transport de délégation officielle

Documents joints :
- Certificat de navigabilité
- Assurance aéronef
- Liste des passagers
- Autorisation diplomatique

Nous vous prions de bien vouloir nous confirmer cette autorisation dans les meilleurs délais.

Cordialement,
Service Opérations
Air Tunisie Express`,
        priority: "HIGH",
        airport: "ENFIDHA",
        status: "PENDING",
        workflowStatus: "DRAFT_PENDING"
      },
      {
        title: "Réclamation retard vol TU786 - Indemnisation passagers",
        type: "Arrivee", 
        from_address: "reclamations@tunisair.com.tn",
        to_address: "monastir@tav.aero",
        subject: "Demande indemnisation retard vol TU786 du 20/09/2024",
        content: `Madame, Monsieur,

Suite au retard important du vol TU786 du 20 septembre 2024 (Monastir-Paris), nous vous transmettons les réclamations de 45 passagers demandant une indemnisation conformément au règlement européen EC 261/2004.

Détails du vol :
- Vol : TU786 
- Route : Monastir (MIR) → Paris CDG (CDG)
- Départ prévu : 20/09/2024 à 08:15
- Départ effectif : 20/09/2024 à 14:30
- Retard : 6h15 minutes
- Cause : Problème technique moteur

Les passagers concernés demandent :
- Indemnisation de 400€ par passager (vol > 1500km, retard > 4h)
- Remboursement des frais d'hébergement et restauration
- Certificat de retard pour assurances

Montant total réclamé : 18,000€ + frais annexes

Merci de nous indiquer la procédure à suivre et les documents nécessaires.

Cordialement,
Service Réclamations
Tunisair`,
        priority: "URGENT",
        airport: "MONASTIR", 
        status: "PENDING",
        workflowStatus: "DRAFT_PENDING"
      },
      {
        title: "Demande modification horaires slots - Nouvelair",
        type: "Depart",
        from_address: "slots@nouvelair.com",
        to_address: "generale@tav.aero",
        subject: "Modification créneaux horaires saison hiver 2024-2025",
        content: `Madame, Monsieur,

Dans le cadre de la planification de la saison hiver 2024-2025, Nouvelair souhaite modifier ses créneaux horaires sur les aéroports de Monastir et Enfidha.

Modifications demandées :

MONASTIR (MIR) :
- Vol BJ450 MIR-CDG : 07:30 → 08:45 (avance de 1h15)
- Vol BJ452 MIR-ORY : 15:20 → 16:30 (retard de 1h10)
- Vol BJ454 MIR-LYS : 11:00 → 12:15 (retard de 1h15)

ENFIDHA (NBE) :
- Vol BJ350 NBE-CDG : 09:15 → 10:30 (retard de 1h15)
- Vol BJ352 NBE-NCE : 14:45 → 13:30 (avance de 1h15)

Justifications :
- Optimisation des rotations aéronefs
- Meilleure correspondance avec vols domestiques
- Réduction des coûts opérationnels
- Amélioration ponctualité

Période d'application : 27/10/2024 au 29/03/2025

Ces modifications nécessitent-elles une nouvelle demande de slots ou un amendement suffit-il ?

Cordialement,
Département Planification
Nouvelair`,
        priority: "MEDIUM",
        airport: "GENERALE",
        status: "PENDING", 
        workflowStatus: "DRAFT_PENDING"
      }
    ];

    try {
      for (const corrData of testCorrespondances) {
        // Sélectionner un agent bureau d'ordre aléatoire comme auteur
        const author = this.users.bureauOrdre[Math.floor(Math.random() * this.users.bureauOrdre.length)];
        
        // Sélectionner des directeurs concernés (2-3 directeurs)
        const shuffledDirectors = [...this.users.directeurs].sort(() => 0.5 - Math.random());
        const concernedDirectors = shuffledDirectors.slice(0, Math.min(3, this.users.directeurs.length));

        const correspondance = new Correspondance({
          _id: uuidv4(),
          title: corrData.title,
          type: corrData.type,
          from_address: corrData.from_address,
          to_address: corrData.to_address,
          subject: corrData.subject,
          content: corrData.content,
          priority: corrData.priority,
          airport: corrData.airport,
          status: corrData.status,
          workflowStatus: corrData.workflowStatus,
          authorId: author._id,
          personnesConcernees: concernedDirectors.map(d => d._id),
          attachments: [], // Pas de fichiers pour les données de test
          createdAt: new Date(),
          updatedAt: new Date(),
          response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
          tags: this.generateTags(corrData),
          isUrgent: corrData.priority === 'URGENT'
        });

        await correspondance.save();
        this.stats.correspondancesCreated++;
        
        console.log(`✅ Créée: ${corrData.title.substring(0, 50)}...`);
      }
      
    } catch (error) {
      console.error('❌ Erreur création correspondances:', error);
      this.stats.errors.push(`Correspondances: ${error.message}`);
    }
  }

  /**
   * Génération de tags automatiques
   */
  generateTags(corrData) {
    const tags = [];
    
    // Tags basés sur le contenu
    if (corrData.content.includes('charter')) tags.push('vol-charter');
    if (corrData.content.includes('retard')) tags.push('retard');
    if (corrData.content.includes('réclamation')) tags.push('reclamation');
    if (corrData.content.includes('indemnisation')) tags.push('indemnisation');
    if (corrData.content.includes('slots')) tags.push('slots');
    if (corrData.content.includes('horaires')) tags.push('horaires');
    if (corrData.content.includes('autorisation')) tags.push('autorisation');
    
    // Tags basés sur la priorité
    if (corrData.priority === 'URGENT') tags.push('urgent');
    if (corrData.priority === 'HIGH') tags.push('prioritaire');
    
    // Tags basés sur l'aéroport
    tags.push(corrData.airport.toLowerCase());
    
    return tags;
  }

  /**
   * Affichage du rapport final
   */
  displayReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE CRÉATION DES DONNÉES DE TEST');
    console.log('='.repeat(60));
    
    console.log(`📧 Correspondances créées: ${this.stats.correspondancesCreated}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERREURS RENCONTRÉES:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ CRÉATION TERMINÉE SANS ERREUR');
    }
    
    console.log('\n🎯 DONNÉES DE TEST PRÊTES');
    console.log('💡 Vous pouvez maintenant tester le workflow complet');
    console.log('='.repeat(60));
  }

  /**
   * Exécution complète
   */
  async run() {
    console.log('🏗️  CRÉATION DES DONNÉES DE TEST');
    console.log('='.repeat(60));
    
    try {
      await this.connectDatabase();
      await this.loadUsers();
      
      if (this.users.bureauOrdre.length === 0 || this.users.directeurs.length === 0) {
        throw new Error('Utilisateurs manquants. Assurez-vous que les utilisateurs existent.');
      }
      
      await this.createTestCorrespondances();
      this.displayReport();
      
    } catch (error) {
      console.error('❌ Erreur critique:', error);
      this.stats.errors.push(`Erreur critique: ${error.message}`);
      this.displayReport();
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Connexion MongoDB fermée');
    }
  }
}

// Exécution du script
async function main() {
  try {
    const creator = new TestDataCreator();
    await creator.run();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancement du script
if (require.main === module) {
  main();
}

module.exports = TestDataCreator;

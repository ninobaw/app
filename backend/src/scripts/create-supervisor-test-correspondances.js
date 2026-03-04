const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script pour créer des correspondances de test pour le superviseur bureau d'ordre
 * Avec différents statuts et échéances pour tester le dashboard
 */

async function createSupervisorTestCorrespondances() {
  try {
    console.log('🚀 CRÉATION DE CORRESPONDANCES DE TEST POUR SUPERVISEUR');
    console.log('=' .repeat(60));

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie');

    // Récupérer les utilisateurs pour les assignations
    const supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    const director = await User.findOne({ role: 'DIRECTEUR_GENERAL' });

    if (!supervisor) {
      console.log('❌ Aucun superviseur trouvé. Créez d\'abord un superviseur avec create-supervisor-user.js');
      return;
    }

    console.log(`📋 Utilisateurs trouvés:`);
    console.log(`   • Superviseur: ${supervisor.email}`);
    console.log(`   • Agent: ${agent?.email || 'Non trouvé'}`);
    console.log(`   • Directeur: ${director?.email || 'Non trouvé'}`);

    // Correspondances de test avec différents statuts et échéances
    const testCorrespondances = [
      // Correspondances CRITIQUES (échéance < 24h)
      {
        title: 'Demande autorisation survol urgente',
        subject: 'Autorisation survol zone contrôlée - Vol spécial VIP',
        content: 'Demande urgente d\'autorisation de survol pour un vol spécial VIP prévu demain matin. Coordination avec les autorités de sécurité requise.',
        type: 'INCOMING',
        from_address: 'operations@tunisair.tn',
        to_address: 'bureau.ordre@enfidha-airport.tn',
        priority: 'URGENT',
        status: 'PENDING',
        airport: 'ENFIDHA',
        date_correspondance: new Date(),
        response_deadline: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 heures
        author: agent?._id,
        tags: ['AOCA', 'urgent'],
        directorValidation: 'PENDING'
      },
      {
        title: 'Incident sécurité terminal',
        subject: 'Rapport incident sécurité - Terminal A',
        content: 'Incident de sécurité au terminal A nécessitant une réponse officielle aux autorités. Rapport détaillé en pièce jointe.',
        type: 'INCOMING',
        from_address: 'securite@police.interieur.tn',
        to_address: 'direction@enfidha-airport.tn',
        priority: 'URGENT',
        status: 'PENDING',
        airport: 'ENFIDHA',
        date_correspondance: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
        response_deadline: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 heures
        author: agent?._id,
        tags: ['Police', 'securite'],
        directorValidation: 'PENDING'
      },

      // Correspondances VALIDÉES pour réponse
      {
        title: 'Réponse réclamation passager',
        subject: 'RE: Réclamation perte bagages vol TU456',
        content: 'Réclamation d\'un passager concernant la perte de ses bagages sur le vol TU456. Procédure de compensation à appliquer.',
        type: 'INCOMING',
        from_address: 'reclamations@tunisair.tn',
        to_address: 'service.client@enfidha-airport.tn',
        priority: 'HIGH',
        status: 'PENDING',
        airport: 'ENFIDHA',
        date_correspondance: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4h
        response_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours
        author: agent?._id,
        tags: ['service-client'],
        directorValidation: 'APPROVED',
        directorComments: 'Approuvé - Appliquer la procédure de compensation standard et présenter nos excuses',
        directorValidatedBy: director?._id,
        directorValidationDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // Il y a 1h
        validatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        title: 'Réponse demande information douane',
        subject: 'RE: Procédures import équipements techniques',
        content: 'Demande d\'information sur les procédures d\'importation d\'équipements techniques pour la maintenance.',
        type: 'INCOMING',
        from_address: 'import@douane.finances.tn',
        to_address: 'logistique@enfidha-airport.tn',
        priority: 'MEDIUM',
        status: 'PENDING',
        airport: 'ENFIDHA',
        date_correspondance: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6h
        response_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
        author: agent?._id,
        tags: ['Douane', 'logistique'],
        directorValidation: 'APPROVED',
        directorComments: 'Approuvé - Fournir la liste des procédures et contacts utiles',
        directorValidatedBy: director?._id,
        directorValidationDate: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30min
        validatedAt: new Date(Date.now() - 30 * 60 * 1000)
      },

      // Correspondances EN RETARD
      {
        title: 'Demande renouvellement concession',
        subject: 'Renouvellement concession restaurant terminal B',
        content: 'Demande de renouvellement de la concession du restaurant du terminal B. Contrat arrivant à échéance.',
        type: 'INCOMING',
        from_address: 'commercial@restaurant-aero.tn',
        to_address: 'commercial@enfidha-airport.tn',
        priority: 'MEDIUM',
        status: 'PENDING',
        airport: 'ENFIDHA',
        date_correspondance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        response_deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours (EN RETARD)
        author: agent?._id,
        tags: ['Concessionaire1', 'commercial'],
        directorValidation: 'PENDING'
      },

      // Correspondances MONASTIR
      {
        title: 'Coordination syndicale',
        subject: 'Réunion syndicat personnel - Monastir',
        content: 'Convocation à la réunion du syndicat du personnel de l\'aéroport de Monastir. Points à l\'ordre du jour.',
        type: 'INCOMING',
        from_address: 'syndicat@monastir-airport.tn',
        to_address: 'rh@monastir-airport.tn',
        priority: 'MEDIUM',
        status: 'PENDING',
        airport: 'MONASTIR',
        date_correspondance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
        response_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
        author: agent?._id,
        tags: ['Syndicat', 'rh'],
        directorValidation: 'PENDING'
      },

      // Correspondances INFORMATIF
      {
        title: 'Information comité consultatif',
        subject: 'Compte-rendu réunion comité consultatif',
        content: 'Compte-rendu de la dernière réunion du comité consultatif de l\'aéroport. Décisions prises et recommandations.',
        type: 'INCOMING',
        from_address: 'secretariat@comite-consultatif.tn',
        to_address: 'direction@enfidha-airport.tn',
        priority: 'LOW',
        status: 'INFORMATIF',
        airport: 'GENERALE',
        date_correspondance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        author: agent?._id,
        tags: ['Commuté consultatif', 'information']
      },

      // Correspondances REPLIED
      {
        title: 'Réponse certification OACA',
        subject: 'RE: Certification équipements navigation',
        content: 'Réponse concernant la certification OACA des équipements de navigation. Documents fournis.',
        type: 'OUTGOING',
        from_address: 'technique@enfidha-airport.tn',
        to_address: 'certification@oaca.aviation.tn',
        priority: 'HIGH',
        status: 'REPLIED',
        airport: 'ENFIDHA',
        date_correspondance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        response_deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        responseReference: 'REP-2024-001',
        author: agent?._id,
        tags: ['AOCA', 'technique'],
        directorValidation: 'APPROVED'
      }
    ];

    console.log(`\n📝 Création de ${testCorrespondances.length} correspondances de test...`);

    let created = 0;
    let errors = 0;

    for (const corrData of testCorrespondances) {
      try {
        const correspondance = new Correspondance(corrData);
        await correspondance.save();
        
        console.log(`✅ ${corrData.title} (${corrData.priority} - ${corrData.status})`);
        created++;
      } catch (error) {
        console.error(`❌ Erreur pour "${corrData.title}":`, error.message);
        errors++;
      }
    }

    console.log('\n📊 RÉSUMÉ DE LA CRÉATION:');
    console.log(`   • Correspondances créées: ${created}`);
    console.log(`   • Erreurs: ${errors}`);
    console.log(`   • Total traité: ${testCorrespondances.length}`);

    // Statistiques par statut
    const stats = await Correspondance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n📈 STATISTIQUES PAR STATUT:');
    stats.forEach(stat => {
      console.log(`   • ${stat._id}: ${stat.count}`);
    });

    // Statistiques par priorité
    const priorityStats = await Correspondance.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    console.log('\n🎯 STATISTIQUES PAR PRIORITÉ:');
    priorityStats.forEach(stat => {
      console.log(`   • ${stat._id}: ${stat.count}`);
    });

    console.log('\n🎉 Correspondances de test créées avec succès !');
    console.log('\n💡 UTILISATION:');
    console.log('   1. Connectez-vous avec le superviseur: superviseur.bureau@aeroport.tn');
    console.log('   2. Accédez au dashboard superviseur');
    console.log('   3. Testez les fonctionnalités d\'échéances et de validation');
    console.log('\n🔗 DONNÉES CRÉÉES:');
    console.log('   • Correspondances critiques (échéance < 24h)');
    console.log('   • Correspondances validées pour réponse');
    console.log('   • Correspondances en retard');
    console.log('   • Correspondances de différents aéroports');
    console.log('   • Correspondances avec différents statuts');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécution du script
createSupervisorTestCorrespondances();

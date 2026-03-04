const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
require('dotenv').config();

// Correspondances de test pour chaque tag personnalisé
const testCorrespondances = [
  {
    subject: 'Incident de sécurité - Terminal A',
    content: 'Un incident de sécurité s\'est produit au terminal A nécessitant l\'intervention de la police et de la sûreté aéroportuaire. Merci de prendre les mesures nécessaires.',
    from_address: 'securite@police.interieur.tn',
    to_address: 'direction@enfidha-airport.tn',
    status: 'received',
    priority: 'high'
  },
  {
    subject: 'Nouvelle réglementation OACA - Contrôle aérien',
    content: 'L\'Office de l\'Aviation Civile et des Aéroports publie une nouvelle réglementation concernant les procédures de contrôle aérien et la certification des équipements.',
    from_address: 'reglementation@oaca.aviation.tn',
    to_address: 'technique@enfidha-airport.tn',
    status: 'received',
    priority: 'medium'
  },
  {
    subject: 'Contrôle douanier - Importation équipements',
    content: 'Procédure de contrôle douanier pour l\'importation d\'équipements techniques. Déclaration en douane requise pour les marchandises en provenance de l\'étranger.',
    from_address: 'controle@douane.finances.tn',
    to_address: 'logistique@enfidha-airport.tn',
    status: 'received',
    priority: 'medium'
  },
  {
    subject: 'Renouvellement concession - Boutique Duty Free',
    content: 'Demande de renouvellement de la concession pour l\'exploitation de la boutique duty-free du terminal. Contrat de concession arrivant à échéance.',
    from_address: 'commercial@concessionnaire-dutyfree.com',
    to_address: 'commercial@enfidha-airport.tn',
    status: 'received',
    priority: 'low'
  },
  {
    subject: 'Négociation collective - Personnel aéroportuaire',
    content: 'Le syndicat du personnel aéroportuaire demande l\'ouverture de négociations collectives concernant les conditions de travail et les revendications salariales.',
    from_address: 'secretaire@syndicat-aero.ugtt.tn',
    to_address: 'rh@enfidha-airport.tn',
    status: 'received',
    priority: 'medium'
  },
  {
    subject: 'Convocation - Comité consultatif',
    content: 'Convocation à la réunion du comité consultatif de l\'aéroport. Ordre du jour : nouvelles procédures d\'exploitation et avis sur les projets d\'extension.',
    from_address: 'secretariat@comite-consultatif.enfidha.tn',
    to_address: 'direction@enfidha-airport.tn',
    status: 'received',
    priority: 'medium'
  },
  {
    subject: 'Rapport mensuel - Activité police aéroportuaire',
    content: 'Rapport mensuel d\'activité de la police aéroportuaire. Statistiques des interventions, incidents de sécurité et mesures préventives mises en place.',
    from_address: 'rapport@police.aeroport.tn',
    to_address: 'securite@enfidha-airport.tn',
    status: 'received',
    priority: 'low'
  },
  {
    subject: 'Certification OACA - Équipements navigation',
    content: 'Procédure de certification OACA pour les nouveaux équipements de navigation aérienne. Inspection technique et validation réglementaire requises.',
    from_address: 'certification@oaca.aviation.tn',
    to_address: 'maintenance@enfidha-airport.tn',
    status: 'received',
    priority: 'high'
  }
];

async function createTestCorrespondances() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    console.log('\n📧 CRÉATION DE CORRESPONDANCES DE TEST');
    console.log('=' .repeat(50));

    // Vérifier s'il y a déjà des correspondances
    const existingCount = await Correspondance.countDocuments();
    console.log(`📊 Correspondances existantes: ${existingCount}`);

    if (existingCount > 0) {
      console.log('\n⚠️  Des correspondances existent déjà.');
      console.log('💡 Voulez-vous quand même ajouter les correspondances de test ?');
      // Pour ce script, on continue quand même
    }

    let createdCount = 0;
    let errorCount = 0;

    for (const corrData of testCorrespondances) {
      try {
        // Ajouter des champs requis
        const correspondance = new Correspondance({
          ...corrData,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [] // Pas de tags initialement, ils seront assignés par l'IA
        });

        await correspondance.save();
        console.log(`✅ Créée: "${corrData.subject}"`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Erreur pour "${corrData.subject}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Résumé de la création:');
    console.log(`   • Correspondances créées: ${createdCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log(`   • Total traité: ${testCorrespondances.length}`);

    // Vérification finale
    const finalCount = await Correspondance.countDocuments();
    console.log(`   • Total correspondances dans la base: ${finalCount}`);

    if (createdCount > 0) {
      console.log('\n🎉 Correspondances de test créées avec succès !');
      console.log('\n💡 Prochaines étapes:');
      console.log('   1. Testez l\'assignation: test-custom-analysis.bat');
      console.log('   2. Appliquez les tags: smart-tag-assignment-custom.bat');
      console.log('\n🏷️  Ces correspondances couvrent tous vos tags:');
      console.log('   • Police (2 correspondances)');
      console.log('   • AOCA (2 correspondances)');
      console.log('   • Douane (1 correspondance)');
      console.log('   • Concessionaire1 (1 correspondance)');
      console.log('   • Syndicat (1 correspondance)');
      console.log('   • Commuté consultatif (1 correspondance)');
    } else {
      console.log('\n❌ Aucune correspondance créée.');
      console.log('💡 Vérifiez les erreurs ci-dessus');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter la création
console.log('📧 CRÉATION DE CORRESPONDANCES DE TEST POUR VOS TAGS PERSONNALISÉS\n');
createTestCorrespondances();

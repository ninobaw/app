const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const CorrespondanceAssignmentService = require('../services/correspondanceAssignmentService');

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function fixExistingCorrespondances() {
  console.log('\n🔧 === CORRECTION DES CORRESPONDANCES EXISTANTES ===\n');

  try {
    // Trouver toutes les correspondances non assignées ou mal assignées
    const unassignedCorrespondances = await Correspondance.find({
      $or: [
        { personnesConcernees: { $exists: false } },
        { personnesConcernees: { $size: 0 } },
        { workflowStatus: { $exists: false } },
        { workflowStatus: 'PENDING' }
      ]
    }).populate('authorId', 'firstName lastName');

    console.log(`📋 Correspondances à corriger: ${unassignedCorrespondances.length}`);

    if (unassignedCorrespondances.length === 0) {
      console.log('✅ Toutes les correspondances sont déjà correctement assignées');
      return;
    }

    // Vérifier les directeurs disponibles
    const directors = await User.find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'] },
      isActive: true
    });

    console.log(`👥 Directeurs disponibles: ${directors.length}`);
    
    if (directors.length === 0) {
      console.log('❌ Aucun directeur trouvé pour l\'assignation');
      return;
    }

    let correctedCount = 0;
    let errorCount = 0;

    // Corriger chaque correspondance
    for (const correspondance of unassignedCorrespondances) {
      try {
        console.log(`\n🔄 Correction de: "${correspondance.subject}"`);
        console.log(`   ID: ${correspondance._id}`);
        console.log(`   Auteur: ${correspondance.authorId?.firstName || 'Inconnu'} ${correspondance.authorId?.lastName || ''}`);
        console.log(`   Priorité: ${correspondance.priority}`);
        console.log(`   Avant - Personnes concernées: ${correspondance.personnesConcernees?.length || 0}`);

        // Assigner automatiquement
        const assignedCorrespondance = await CorrespondanceAssignmentService.assignCorrespondance(correspondance);
        
        // Sauvegarder
        await assignedCorrespondance.save();
        
        console.log(`   ✅ Après - Personnes concernées: ${assignedCorrespondance.personnesConcernees?.length || 0}`);
        console.log(`   Status workflow: ${assignedCorrespondance.workflowStatus}`);
        
        // Afficher les directeurs assignés
        if (assignedCorrespondance.personnesConcernees?.length > 0) {
          const assignedDirectors = await User.find({
            _id: { $in: assignedCorrespondance.personnesConcernees }
          }).select('firstName lastName role directorate');
          
          console.log(`   👤 Directeurs assignés:`);
          assignedDirectors.forEach(director => {
            console.log(`      - ${director.firstName} ${director.lastName} (${director.role})`);
          });
        }
        
        correctedCount++;
        
      } catch (error) {
        console.error(`   ❌ Erreur pour correspondance ${correspondance._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 === RÉSUMÉ ===`);
    console.log(`✅ Correspondances corrigées: ${correctedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📋 Total traité: ${unassignedCorrespondances.length}`);

    // Vérification finale
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    const stillUnassigned = await Correspondance.countDocuments({
      $or: [
        { personnesConcernees: { $exists: false } },
        { personnesConcernees: { $size: 0 } }
      ]
    });

    console.log(`📋 Correspondances encore non assignées: ${stillUnassigned}`);

    // Statistiques par directeur
    console.log(`\n📊 === STATISTIQUES PAR DIRECTEUR ===`);
    for (const director of directors) {
      const assignedCount = await Correspondance.countDocuments({
        personnesConcernees: director._id
      });
      console.log(`👤 ${director.firstName} ${director.lastName} (${director.role}): ${assignedCount} correspondance(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function main() {
  await connectDB();
  await fixExistingCorrespondances();
  
  console.log('\n✅ Correction terminée');
  process.exit(0);
}

main();

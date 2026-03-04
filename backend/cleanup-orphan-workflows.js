const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const Correspondance = require('./src/models/Correspondance');

/**
 * Script de nettoyage des workflows orphelins
 * Supprime les workflows qui n'ont pas de correspondance associée
 */

async function cleanupOrphanWorkflows() {
  try {
    console.log('🧹 ========================================');
    console.log('🧹 NETTOYAGE DES WORKFLOWS ORPHELINS');
    console.log('🧹 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. Récupérer tous les workflows
    console.log('📊 Analyse des workflows existants...');
    const workflows = await CorrespondenceWorkflow.find({}).lean();
    console.log(`📋 Total workflows trouvés: ${workflows.length}`);

    if (workflows.length === 0) {
      console.log('✅ Aucun workflow à analyser');
      return;
    }

    // 2. Récupérer tous les IDs de correspondances existantes
    const correspondances = await Correspondance.find({}).select('_id').lean();
    const existingCorrespondanceIds = correspondances.map(c => c._id.toString());
    console.log(`📋 Total correspondances existantes: ${correspondances.length}`);

    // 3. Identifier les workflows orphelins
    const orphanWorkflows = [];
    const validWorkflows = [];

    workflows.forEach(workflow => {
      const correspondanceId = workflow.correspondanceId.toString();
      
      if (existingCorrespondanceIds.includes(correspondanceId)) {
        validWorkflows.push(workflow);
      } else {
        orphanWorkflows.push({
          workflowId: workflow._id,
          correspondanceId: workflow.correspondanceId,
          currentStatus: workflow.currentStatus,
          createdAt: workflow.createdAt,
          assignedDirector: workflow.assignedDirector
        });
      }
    });

    console.log(`✅ Workflows valides: ${validWorkflows.length}`);
    console.log(`⚠️ Workflows orphelins: ${orphanWorkflows.length}`);

    // 4. Afficher les détails des workflows orphelins
    if (orphanWorkflows.length > 0) {
      console.log('\n📋 Détails des workflows orphelins:');
      orphanWorkflows.forEach((orphan, index) => {
        console.log(`   ${index + 1}. Workflow ID: ${orphan.workflowId}`);
        console.log(`      Correspondance ID manquante: ${orphan.correspondanceId}`);
        console.log(`      Status: ${orphan.currentStatus}`);
        console.log(`      Créé le: ${orphan.createdAt}`);
        console.log(`      Directeur assigné: ${orphan.assignedDirector || 'Aucun'}\n`);
      });

      // 5. Demander confirmation et supprimer
      console.log('🗑️ Suppression des workflows orphelins...');
      
      const orphanIds = orphanWorkflows.map(o => o.workflowId);
      const deleteResult = await CorrespondenceWorkflow.deleteMany({
        _id: { $in: orphanIds }
      });

      console.log(`✅ ${deleteResult.deletedCount} workflows orphelins supprimés`);

      // 6. Vérification finale
      const remainingWorkflows = await CorrespondenceWorkflow.find({}).lean();
      console.log(`📊 Workflows restants: ${remainingWorkflows.length}`);
      
      if (remainingWorkflows.length === validWorkflows.length) {
        console.log('✅ Nettoyage réussi - Tous les workflows orphelins ont été supprimés');
      } else {
        console.log('⚠️ Incohérence détectée après nettoyage');
      }

    } else {
      console.log('✅ Aucun workflow orphelin détecté - Base de données propre');
    }

    // 7. Statistiques finales
    console.log('\n📊 === STATISTIQUES FINALES ===');
    console.log(`📋 Correspondances: ${correspondances.length}`);
    console.log(`🔄 Workflows valides: ${validWorkflows.length}`);
    console.log(`🗑️ Workflows supprimés: ${orphanWorkflows.length}`);
    
    if (orphanWorkflows.length > 0) {
      console.log('\n✅ NETTOYAGE TERMINÉ - Base de données optimisée');
    } else {
      console.log('\n✅ AUCUNE ACTION REQUISE - Base de données déjà propre');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le nettoyage
cleanupOrphanWorkflows();

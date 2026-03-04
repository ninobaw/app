const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script pour supprimer toutes les correspondances et workflows de test
 */

async function cleanAllTestData() {
  try {
    console.log('🧹 ========================================');
    console.log('🧹 NETTOYAGE COMPLET DONNÉES DE TEST');
    console.log('🧹 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. ANALYSER L'ÉTAT ACTUEL
    console.log('📊 === ANALYSE ÉTAT ACTUEL ===');
    
    const allCorrespondances = await Correspondance.find({}).lean();
    const allWorkflows = await CorrespondenceWorkflow.find({}).lean();
    
    console.log(`📋 Total correspondances: ${allCorrespondances.length}`);
    console.log(`🔄 Total workflows: ${allWorkflows.length}`);

    // Identifier les correspondances de test
    const testCorrespondances = allCorrespondances.filter(corr => 
      corr.code && (
        corr.code.includes('TEST-') ||
        corr.code.includes('DEBUG-') ||
        corr.code.includes('INSPECT-') ||
        corr.title?.includes('Test') ||
        corr.title?.includes('Debug') ||
        corr.title?.includes('Inspection')
      )
    );

    console.log(`🧪 Correspondances de test identifiées: ${testCorrespondances.length}`);
    
    if (testCorrespondances.length > 0) {
      console.log('\n📋 Liste des correspondances de test:');
      testCorrespondances.forEach((corr, index) => {
        console.log(`   ${index + 1}. ${corr.title || corr.subject} (${corr.code})`);
        console.log(`      ID: ${corr._id}`);
        console.log(`      Status: ${corr.workflowStatus || corr.status}`);
        console.log(`      Drafts: ${corr.responseDrafts?.length || 0}`);
      });
    }

    // 2. OPTION 1: SUPPRIMER SEULEMENT LES CORRESPONDANCES DE TEST
    console.log('\n🎯 === OPTION 1: SUPPRESSION CORRESPONDANCES DE TEST ===');
    
    if (testCorrespondances.length > 0) {
      console.log(`🗑️ Suppression de ${testCorrespondances.length} correspondances de test...`);
      
      const testIds = testCorrespondances.map(corr => corr._id);
      
      // Supprimer les workflows associés
      const deletedWorkflows = await CorrespondenceWorkflow.deleteMany({
        correspondanceId: { $in: testIds }
      });
      
      // Supprimer les correspondances de test
      const deletedCorrespondances = await Correspondance.deleteMany({
        _id: { $in: testIds }
      });
      
      console.log(`✅ ${deletedCorrespondances.deletedCount} correspondances de test supprimées`);
      console.log(`✅ ${deletedWorkflows.deletedCount} workflows associés supprimés`);
    } else {
      console.log('✅ Aucune correspondance de test trouvée');
    }

    // 3. OPTION 2: SUPPRIMER TOUTES LES CORRESPONDANCES (DÉCOMMENTEZ SI NÉCESSAIRE)
    console.log('\n⚠️ === OPTION 2: SUPPRESSION COMPLÈTE (DÉSACTIVÉE) ===');
    console.log('💡 Pour supprimer TOUTES les correspondances, décommentez la section ci-dessous');
    
    /*
    // DÉCOMMENTEZ CETTE SECTION POUR SUPPRIMER TOUT
    console.log('🗑️ SUPPRESSION COMPLÈTE DE TOUTES LES DONNÉES...');
    
    const allWorkflowsDeleted = await CorrespondenceWorkflow.deleteMany({});
    const allCorrespondancesDeleted = await Correspondance.deleteMany({});
    
    console.log(`🗑️ ${allCorrespondancesDeleted.deletedCount} correspondances supprimées`);
    console.log(`🗑️ ${allWorkflowsDeleted.deletedCount} workflows supprimés`);
    console.log('⚠️ TOUTES LES DONNÉES ONT ÉTÉ SUPPRIMÉES !');
    */

    // 4. VÉRIFICATION FINALE
    console.log('\n📊 === VÉRIFICATION FINALE ===');
    
    const finalCorrespondances = await Correspondance.find({}).lean();
    const finalWorkflows = await CorrespondenceWorkflow.find({}).lean();
    
    console.log(`📋 Correspondances restantes: ${finalCorrespondances.length}`);
    console.log(`🔄 Workflows restants: ${finalWorkflows.length}`);

    // Vérifier s'il reste des correspondances de test
    const remainingTestCorr = finalCorrespondances.filter(corr => 
      corr.code && (
        corr.code.includes('TEST-') ||
        corr.code.includes('DEBUG-') ||
        corr.code.includes('INSPECT-')
      )
    );

    if (remainingTestCorr.length > 0) {
      console.log(`⚠️ ${remainingTestCorr.length} correspondances de test restantes:`);
      remainingTestCorr.forEach(corr => {
        console.log(`   - ${corr.title} (${corr.code})`);
      });
    } else {
      console.log('✅ Aucune correspondance de test restante');
    }

    // 5. STATISTIQUES FINALES
    console.log('\n📈 === STATISTIQUES FINALES ===');
    
    if (finalCorrespondances.length > 0) {
      console.log('📋 Correspondances restantes par statut:');
      const statusCount = {};
      finalCorrespondances.forEach(corr => {
        const status = corr.workflowStatus || corr.status || 'UNKNOWN';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

      console.log('\n📝 Correspondances avec drafts:');
      const withDrafts = finalCorrespondances.filter(corr => 
        corr.responseDrafts && corr.responseDrafts.length > 0
      );
      console.log(`   Total avec drafts: ${withDrafts.length}`);
      
      withDrafts.forEach(corr => {
        console.log(`   - ${corr.title || corr.subject}: ${corr.responseDrafts.length} draft(s)`);
      });
    }

    console.log('\n✅ === NETTOYAGE TERMINÉ ===');
    console.log('🎯 Environnement prêt pour les tests');
    console.log('💡 Vous pouvez maintenant créer de nouvelles correspondances de test');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le nettoyage
cleanAllTestData();

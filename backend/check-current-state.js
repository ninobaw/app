const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script pour vérifier l'état actuel des correspondances avec drafts
 */

async function checkCurrentState() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 VÉRIFICATION ÉTAT ACTUEL');
    console.log('🔍 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. TOUTES LES CORRESPONDANCES AVEC DRAFTS
    console.log('📋 === CORRESPONDANCES AVEC DRAFTS ===');
    
    const correspondancesWithDrafts = await Correspondance.find({
      responseDrafts: { $exists: true, $ne: [] }
    }).lean();

    console.log(`📝 Total correspondances avec drafts: ${correspondancesWithDrafts.length}\n`);

    correspondancesWithDrafts.forEach((corr, index) => {
      console.log(`📋 Correspondance ${index + 1}:`);
      console.log(`   ID: ${corr._id}`);
      console.log(`   Titre: ${corr.title}`);
      console.log(`   Workflow Status: ${corr.workflowStatus}`);
      console.log(`   Drafts: ${corr.responseDrafts?.length || 0}`);
      
      if (corr.responseDrafts && corr.responseDrafts.length > 0) {
        corr.responseDrafts.forEach((draft, draftIndex) => {
          console.log(`     Draft ${draftIndex + 1}:`);
          console.log(`       Status: ${draft.status}`);
          console.log(`       Directeur: ${draft.directorName}`);
          console.log(`       Urgent: ${draft.isUrgent ? 'Oui' : 'Non'}`);
          console.log(`       Créé: ${new Date(draft.createdAt).toLocaleString('fr-FR')}`);
        });
      }
      console.log('');
    });

    // 2. WORKFLOWS CORRESPONDANTS
    console.log('🔄 === WORKFLOWS CORRESPONDANTS ===');
    
    for (const corr of correspondancesWithDrafts) {
      const workflow = await CorrespondenceWorkflow.findOne({
        correspondanceId: corr._id
      }).lean();

      if (workflow) {
        console.log(`🔄 Workflow pour ${corr.title}:`);
        console.log(`   ID: ${workflow._id}`);
        console.log(`   Status: ${workflow.currentStatus}`);
        console.log(`   DG: ${workflow.directeurGeneral}`);
        console.log(`   Directeur: ${workflow.assignedDirector}`);
        console.log('');
      } else {
        console.log(`❌ Pas de workflow pour: ${corr.title}\n`);
      }
    }

    // 3. CONDITIONS POUR CHAQUE CORRESPONDANCE
    console.log('🎯 === CONDITIONS BOUTON DG ===');
    
    correspondancesWithDrafts.forEach((corr, index) => {
      const condition1 = true; // user.role === 'DIRECTEUR_GENERAL'
      const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(corr.workflowStatus);
      const condition4 = corr.responseDrafts && 
                        corr.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');
      
      const shouldShow = condition1 && (condition3 || condition4);
      
      console.log(`🎯 Correspondance ${index + 1}: ${corr.title}`);
      console.log(`   Workflow Status: ${corr.workflowStatus} → ${condition3 ? '✅' : '❌'}`);
      console.log(`   PENDING_DG_REVIEW: ${condition4 ? '✅' : '❌'} (${corr.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW').length || 0} drafts)`);
      console.log(`   BOUTON DG: ${shouldShow ? '✅ VISIBLE' : '❌ CACHÉ'}`);
      console.log('');
    });

    // 4. RECOMMANDATIONS
    console.log('💡 === RECOMMANDATIONS ===');
    
    const validCorrespondances = correspondancesWithDrafts.filter(corr => {
      const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(corr.workflowStatus);
      const condition4 = corr.responseDrafts && 
                        corr.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');
      return condition3 || condition4;
    });

    if (validCorrespondances.length > 0) {
      console.log(`✅ ${validCorrespondances.length} correspondance(s) devraient afficher le bouton DG`);
      console.log('🔍 Si le bouton ne s\'affiche pas:');
      console.log('   1. Vérifiez que vous êtes connecté en tant que DG');
      console.log('   2. Vérifiez les logs console du browser');
      console.log('   3. Testez la route API workflow-chat');
      console.log('   4. Redémarrez le serveur backend');
      
      console.log('\n📋 Correspondances à tester:');
      validCorrespondances.forEach(corr => {
        console.log(`   - "${corr.title}" (ID: ${corr._id})`);
      });
    } else {
      console.log('❌ Aucune correspondance ne devrait afficher le bouton DG');
      console.log('💡 Utilisez le script fix-dg-button-unified.js pour créer des données de test');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

checkCurrentState();

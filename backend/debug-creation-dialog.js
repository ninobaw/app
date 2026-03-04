const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Debug du processus de création via le dialogue
 */

async function debugCreationDialog() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DEBUG CRÉATION VIA DIALOGUE');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. ANALYSER LES CORRESPONDANCES EXISTANTES
    console.log('📊 === ANALYSE CORRESPONDANCES EXISTANTES ===');
    
    const allCorrespondances = await Correspondance.find({})
      .populate('personnesConcernees', 'firstName lastName role')
      .lean();
    
    console.log(`📋 Total correspondances: ${allCorrespondances.length}`);
    
    // Analyser les correspondances récentes (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCorrespondances = allCorrespondances.filter(corr => 
      new Date(corr.createdAt) > yesterday
    );
    
    console.log(`📋 Correspondances récentes (24h): ${recentCorrespondances.length}`);
    
    if (recentCorrespondances.length > 0) {
      console.log('\n📋 Détails correspondances récentes:');
      recentCorrespondances.forEach((corr, index) => {
        console.log(`   ${index + 1}. ${corr.title || corr.subject}`);
        console.log(`      ID: ${corr._id}`);
        console.log(`      Code: ${corr.code}`);
        console.log(`      Status: ${corr.status}`);
        console.log(`      Workflow Status: ${corr.workflowStatus || 'Non défini'}`);
        console.log(`      Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
        console.log(`      Drafts: ${corr.responseDrafts?.length || 0}`);
        console.log(`      Créée le: ${new Date(corr.createdAt).toLocaleString()}`);
        
        if (corr.personnesConcernees && corr.personnesConcernees.length > 0) {
          corr.personnesConcernees.forEach((person, pIndex) => {
            console.log(`         ${pIndex + 1}. ${person.firstName} ${person.lastName} (${person.role})`);
          });
        }
        console.log('');
      });
    }

    // 2. ANALYSER LES WORKFLOWS ASSOCIÉS
    console.log('🔄 === ANALYSE WORKFLOWS ASSOCIÉS ===');
    
    const allWorkflows = await CorrespondenceWorkflow.find({})
      .populate('assignedDirector', 'firstName lastName role')
      .populate('directeurGeneral', 'firstName lastName role')
      .lean();
    
    console.log(`🔄 Total workflows: ${allWorkflows.length}`);
    
    // Workflows récents
    const recentWorkflows = allWorkflows.filter(workflow => 
      new Date(workflow.createdAt) > yesterday
    );
    
    console.log(`🔄 Workflows récents (24h): ${recentWorkflows.length}`);
    
    if (recentWorkflows.length > 0) {
      console.log('\n🔄 Détails workflows récents:');
      recentWorkflows.forEach((workflow, index) => {
        console.log(`   ${index + 1}. Workflow ${workflow._id}`);
        console.log(`      Correspondance: ${workflow.correspondanceId}`);
        console.log(`      Status: ${workflow.currentStatus}`);
        console.log(`      Directeur: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);
        console.log(`      DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
        console.log(`      Drafts: ${workflow.responseDrafts?.length || 0}`);
        console.log(`      Créé le: ${new Date(workflow.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    // 3. IDENTIFIER LES CORRESPONDANCES SANS WORKFLOW
    console.log('⚠️ === CORRESPONDANCES SANS WORKFLOW ===');
    
    const correspondancesWithoutWorkflow = [];
    
    for (const corr of recentCorrespondances) {
      const hasWorkflow = allWorkflows.some(w => 
        w.correspondanceId.toString() === corr._id.toString()
      );
      
      if (!hasWorkflow && corr.personnesConcernees && corr.personnesConcernees.length > 0) {
        correspondancesWithoutWorkflow.push(corr);
      }
    }
    
    console.log(`⚠️ Correspondances récentes sans workflow: ${correspondancesWithoutWorkflow.length}`);
    
    if (correspondancesWithoutWorkflow.length > 0) {
      console.log('\n⚠️ Détails correspondances sans workflow:');
      correspondancesWithoutWorkflow.forEach((corr, index) => {
        console.log(`   ${index + 1}. ${corr.title || corr.subject}`);
        console.log(`      ID: ${corr._id}`);
        console.log(`      Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
        console.log(`      Workflow Status: ${corr.workflowStatus || 'Non défini'}`);
        console.log(`      ❌ PROBLÈME: Correspondance avec assignation mais sans workflow !`);
        console.log('');
      });
    }

    // 4. IDENTIFIER LES CORRESPONDANCES SANS DRAFTS
    console.log('📝 === CORRESPONDANCES SANS DRAFTS ===');
    
    const correspondancesWithoutDrafts = recentCorrespondances.filter(corr => 
      corr.personnesConcernees && corr.personnesConcernees.length > 0 &&
      (!corr.responseDrafts || corr.responseDrafts.length === 0)
    );
    
    console.log(`📝 Correspondances récentes sans drafts: ${correspondancesWithoutDrafts.length}`);
    
    if (correspondancesWithoutDrafts.length > 0) {
      console.log('\n📝 Détails correspondances sans drafts:');
      correspondancesWithoutDrafts.forEach((corr, index) => {
        console.log(`   ${index + 1}. ${corr.title || corr.subject}`);
        console.log(`      ID: ${corr._id}`);
        console.log(`      Workflow Status: ${corr.workflowStatus}`);
        console.log(`      ℹ️ Normal: Le directeur n'a pas encore créé de proposition`);
        console.log('');
      });
    }

    // 5. RECOMMANDATIONS
    console.log('💡 === RECOMMANDATIONS ===');
    
    if (correspondancesWithoutWorkflow.length > 0) {
      console.log('🔧 PROBLÈME IDENTIFIÉ: Correspondances avec assignation mais sans workflow');
      console.log('   Solutions possibles:');
      console.log('   1. Vérifier que la route de création appelle bien createWorkflowForCorrespondance');
      console.log('   2. Vérifier les logs de création dans la console backend');
      console.log('   3. Créer manuellement les workflows manquants');
      
      console.log('\n🔧 Création automatique des workflows manquants...');
      
      for (const corr of correspondancesWithoutWorkflow) {
        try {
          console.log(`🔄 Création workflow pour: ${corr.title}`);
          
          const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
          const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
            corr._id.toString(),
            corr.authorId.toString()
          );
          
          if (workflow) {
            console.log(`   ✅ Workflow créé: ${workflow._id}`);
          } else {
            console.log(`   ❌ Échec création workflow`);
          }
          
        } catch (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Aucun problème majeur détecté');
      console.log('💡 Pour tester le bouton DG:');
      console.log('   1. Créez une nouvelle correspondance via l\'interface');
      console.log('   2. Assignez-la à un directeur');
      console.log('   3. Connectez-vous en tant que directeur et créez une proposition');
      console.log('   4. Connectez-vous en tant que DG et ouvrez le chat');
    }

    // 6. ÉTAT FINAL
    console.log('\n📊 === RÉSUMÉ FINAL ===');
    console.log(`📋 Total correspondances: ${allCorrespondances.length}`);
    console.log(`🔄 Total workflows: ${allWorkflows.length}`);
    console.log(`📋 Correspondances récentes: ${recentCorrespondances.length}`);
    console.log(`🔄 Workflows récents: ${recentWorkflows.length}`);
    console.log(`⚠️ Correspondances sans workflow: ${correspondancesWithoutWorkflow.length}`);
    console.log(`📝 Correspondances sans drafts: ${correspondancesWithoutDrafts.length}`);

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le debug
debugCreationDialog();

const mongoose = require('mongoose');

async function verifyCorrectionsApplied() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔍 === VÉRIFICATION CORRECTIONS APPLIQUÉES ===\n');
    
    // 1. Tester le service DirectorGeneralService
    console.log('📊 === TEST COMPTEUR DG ===');
    
    try {
      const DirectorGeneralService = require('./src/services/directorGeneralService');
      const db = mongoose.connection.db;
      
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      
      if (dg) {
        const pendingCount = await DirectorGeneralService.getPendingDraftsCount(dg._id);
        console.log(`✅ Service DirectorGeneralService.getPendingDraftsCount: ${pendingCount}`);
        
        const dashboardData = await DirectorGeneralService.getDashboardData(dg._id);
        console.log(`✅ Dashboard pendingApproval: ${dashboardData.pendingApproval}`);
      }
    } catch (serviceError) {
      console.error('❌ Erreur service DirectorGeneralService:', serviceError.message);
    }
    
    // 2. Tester la route DG pending
    console.log('\n🌐 === TEST ROUTE DG PENDING ===');
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      const db = mongoose.connection.db;
      
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      
      if (dg) {
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
        console.log(`✅ Route dg-pending simulation: ${dgTasks.length} correspondances`);
        
        dgTasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.title || task.subject}`);
          console.log(`      - WorkflowStatus: ${task.workflowStatus}`);
          console.log(`      - Drafts: ${task.responseDrafts?.length || 0}`);
        });
      }
    } catch (routeError) {
      console.error('❌ Erreur route DG pending:', routeError.message);
    }
    
    // 3. Vérifier l'état des correspondances actuelles
    console.log('\n📧 === ÉTAT CORRESPONDANCES ACTUELLES ===');
    
    const db = mongoose.connection.db;
    
    const correspondances = await db.collection('correspondances').find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`Correspondances récentes: ${correspondances.length}`);
    
    for (const corresp of correspondances) {
      console.log(`\n📧 ${corresp.title || corresp.subject}`);
      console.log(`   - Status: ${corresp.status}`);
      console.log(`   - WorkflowStatus: ${corresp.workflowStatus || 'undefined'}`);
      console.log(`   - AssignedTo: ${corresp.assignedTo || 'undefined'}`);
      
      // Chercher le workflow lié
      const workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: corresp._id
      });
      
      if (workflow) {
        console.log(`   - ✅ Workflow: ${workflow.currentStatus}`);
        console.log(`   - Drafts: ${workflow.responseDrafts?.length || 0}`);
        
        if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
          workflow.responseDrafts.forEach((draft, index) => {
            console.log(`     Draft ${index + 1}: ${draft.status} par ${draft.directorName}`);
          });
        }
      } else {
        console.log(`   - ❌ Pas de workflow`);
      }
    }
    
    // 4. Actions recommandées
    console.log('\n🎯 === ACTIONS RECOMMANDÉES ===');
    
    const correspondancesWithoutWorkflow = [];
    const correspondancesWithWrongStatus = [];
    
    for (const corresp of correspondances) {
      const workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: corresp._id
      });
      
      if (!workflow) {
        correspondancesWithoutWorkflow.push(corresp);
      } else if (corresp.workflowStatus !== workflow.currentStatus) {
        correspondancesWithWrongStatus.push({
          correspondance: corresp,
          workflow: workflow
        });
      }
    }
    
    if (correspondancesWithoutWorkflow.length > 0) {
      console.log(`❌ ${correspondancesWithoutWorkflow.length} correspondance(s) sans workflow`);
      console.log('   → Redémarrer le serveur pour activer le middleware');
    }
    
    if (correspondancesWithWrongStatus.length > 0) {
      console.log(`❌ ${correspondancesWithWrongStatus.length} correspondance(s) avec statut désynchronisé`);
      console.log('   → Synchroniser les statuts manuellement');
    }
    
    if (correspondancesWithoutWorkflow.length === 0 && correspondancesWithWrongStatus.length === 0) {
      console.log('✅ Toutes les correspondances ont un workflow correctement synchronisé');
    }
    
    console.log('\n📋 === ÉTAPES SUIVANTES ===');
    console.log('1. 🔄 REDÉMARRER le serveur backend (npm start)');
    console.log('2. 🧪 Créer une nouvelle correspondance pour tester le middleware');
    console.log('3. 👤 Se connecter en tant que directeur et créer un draft');
    console.log('4. 👑 Se connecter en tant que DG et vérifier l\'interface');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

verifyCorrectionsApplied();

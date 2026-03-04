const mongoose = require('mongoose');

async function debugDGDashboardIssues() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC PROBLÈMES DG DASHBOARD ===\n');
    
    // 1. Vérifier le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    // 2. Vérifier les workflows avec le DG assigné
    console.log('\n🔄 === ANALYSE WORKFLOWS DG ===');
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { directeurGeneral: dg._id },
        { directeurGeneral: dg._id.toString() }
      ]
    }).toArray();
    
    console.log(`Workflows avec DG assigné: ${dgWorkflows.length}`);
    
    dgWorkflows.forEach((workflow, index) => {
      console.log(`\n   ${index + 1}. Workflow ${workflow._id}`);
      console.log(`      - CorrespondanceId: ${workflow.correspondanceId}`);
      console.log(`      - Status: ${workflow.currentStatus}`);
      console.log(`      - DirecteurGeneral: ${workflow.directeurGeneral}`);
      console.log(`      - AssignedDirector: ${workflow.assignedDirector}`);
      console.log(`      - Drafts: ${workflow.responseDrafts?.length || 0}`);
      
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        workflow.responseDrafts.forEach((draft, draftIndex) => {
          console.log(`         Draft ${draftIndex}: Status=${draft.status}, Director=${draft.directorName}`);
          console.log(`         DG Feedbacks: ${draft.dgFeedbacks?.length || 0}`);
        });
      }
    });
    
    // 3. Tester le service DG
    console.log('\n🧪 === TEST SERVICE DG ===');
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      
      const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
      
      console.log(`📊 Service DG retourne: ${dgTasks.length} correspondances`);
      
      if (dgTasks.length > 0) {
        console.log('✅ Service DG fonctionne !');
        
        dgTasks.forEach((task, index) => {
          console.log(`\n   ${index + 1}. ${task.title || task.subject}`);
          console.log(`      - ID: ${task._id}`);
          console.log(`      - Status: ${task.status}`);
          console.log(`      - WorkflowStatus: ${task.workflowStatus}`);
          console.log(`      - ResponseDrafts: ${task.responseDrafts?.length || 0}`);
          console.log(`      - WorkflowInfo: ${JSON.stringify(task.workflowInfo)}`);
          
          if (task.responseDrafts && task.responseDrafts.length > 0) {
            task.responseDrafts.forEach((draft, draftIndex) => {
              console.log(`         Draft ${draftIndex}:`);
              console.log(`            - Status: ${draft.status}`);
              console.log(`            - DirectorName: ${draft.directorName}`);
              console.log(`            - DG Feedbacks: ${draft.dgFeedbacks?.length || 0}`);
            });
          }
        });
      } else {
        console.log('❌ Service DG ne retourne aucune correspondance');
      }
      
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    // 4. Vérifier les correspondances avec drafts PENDING_DG_REVIEW
    console.log('\n📝 === ANALYSE DRAFTS PENDING_DG_REVIEW ===');
    
    const workflowsWithPendingDrafts = await db.collection('correspondenceworkflows').find({
      'responseDrafts.status': 'PENDING_DG_REVIEW'
    }).toArray();
    
    console.log(`Workflows avec drafts PENDING_DG_REVIEW: ${workflowsWithPendingDrafts.length}`);
    
    workflowsWithPendingDrafts.forEach((workflow, index) => {
      console.log(`\n   ${index + 1}. Workflow ${workflow._id}`);
      console.log(`      - DG assigné: ${workflow.directeurGeneral}`);
      console.log(`      - Status: ${workflow.currentStatus}`);
      
      const pendingDrafts = workflow.responseDrafts?.filter(draft => draft.status === 'PENDING_DG_REVIEW') || [];
      console.log(`      - Drafts PENDING_DG_REVIEW: ${pendingDrafts.length}`);
      
      pendingDrafts.forEach((draft, draftIndex) => {
        console.log(`         Draft ${draftIndex}:`);
        console.log(`            - DirectorName: ${draft.directorName}`);
        console.log(`            - Content: "${draft.responseContent?.substring(0, 50)}..."`);
        console.log(`            - CreatedAt: ${draft.createdAt}`);
      });
    });
    
    // 5. Vérifier la route API DG
    console.log('\n🌐 === TEST ROUTE API DG ===');
    
    try {
      // Simuler l'appel à /api/correspondances/workflow/dg-pending
      const dgPendingResults = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
      
      console.log(`Route dg-pending simulation: ${dgPendingResults.length} résultats`);
      
      if (dgPendingResults.length > 0) {
        console.log('✅ Route DG fonctionne');
        
        // Vérifier si les drafts sont présents
        const totalDrafts = dgPendingResults.reduce((sum, corresp) => {
          return sum + (corresp.responseDrafts?.length || 0);
        }, 0);
        
        console.log(`📊 Total drafts dans les résultats: ${totalDrafts}`);
        
        const pendingDrafts = dgPendingResults.reduce((sum, corresp) => {
          const pending = corresp.responseDrafts?.filter(draft => draft.status === 'PENDING_DG_REVIEW') || [];
          return sum + pending.length;
        }, 0);
        
        console.log(`📊 Drafts PENDING_DG_REVIEW: ${pendingDrafts}`);
        
      } else {
        console.log('❌ Route DG ne retourne aucun résultat');
      }
      
    } catch (routeError) {
      console.error('❌ Erreur route DG:', routeError.message);
    }
    
    // 6. Diagnostic du problème de compteur
    console.log('\n📊 === DIAGNOSTIC COMPTEUR DG ===');
    
    // Compter manuellement les drafts en attente
    const allWorkflows = await db.collection('correspondenceworkflows').find({}).toArray();
    
    let totalPendingDrafts = 0;
    let draftsForThisDG = 0;
    
    allWorkflows.forEach(workflow => {
      if (workflow.responseDrafts) {
        workflow.responseDrafts.forEach(draft => {
          if (draft.status === 'PENDING_DG_REVIEW') {
            totalPendingDrafts++;
            
            // Vérifier si ce draft est pour ce DG
            if (workflow.directeurGeneral === dg._id.toString() || 
                workflow.directeurGeneral === dg._id) {
              draftsForThisDG++;
            }
          }
        });
      }
    });
    
    console.log(`📊 Total drafts PENDING_DG_REVIEW dans la base: ${totalPendingDrafts}`);
    console.log(`📊 Drafts PENDING_DG_REVIEW pour ce DG: ${draftsForThisDG}`);
    
    // 7. Recommandations
    console.log('\n💡 === DIAGNOSTIC ET RECOMMANDATIONS ===');
    
    if (draftsForThisDG === 0) {
      console.log('❌ PROBLÈME: Aucun draft en attente pour le DG');
      console.log('🔧 CAUSES POSSIBLES:');
      console.log('1. Aucun draft créé par les directeurs');
      console.log('2. DG pas correctement assigné aux workflows');
      console.log('3. Statut des drafts incorrect');
      console.log('4. Service DG ne trouve pas les workflows');
    } else {
      console.log(`✅ ${draftsForThisDG} draft(s) en attente pour le DG`);
      
      if (dgTasks.length === 0) {
        console.log('❌ PROBLÈME: Service DG ne retourne pas les drafts');
        console.log('🔧 VÉRIFIER: Logique du service directorGeneralWorkflowService');
      } else {
        console.log('✅ Service DG fonctionne correctement');
        console.log('🔧 VÉRIFIER: Interface frontend DG');
      }
    }
    
    console.log('\n🎯 === ACTIONS IMMÉDIATES ===');
    console.log('1. Vérifier l\'interface DG dans le navigateur');
    console.log('2. Vérifier les logs de la console browser');
    console.log('3. Tester la création d\'un nouveau draft par un directeur');
    console.log('4. Vérifier que le bouton "Approuver" apparaît dans le chat DG');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGDashboardIssues();

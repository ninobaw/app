const mongoose = require('mongoose');

async function testDraftsCreated() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🧪 === TEST APRÈS CRÉATION DES DRAFTS ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Vérifier les workflows avec drafts
    console.log('📝 === VÉRIFICATION DRAFTS CRÉÉS ===');
    
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    
    let totalDrafts = 0;
    let pendingDGReviewDrafts = 0;
    
    workflows.forEach((workflow, index) => {
      console.log(`\n🔄 Workflow ${index + 1}: ${workflow._id}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - Drafts: ${workflow.responseDrafts?.length || 0}`);
      
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        workflow.responseDrafts.forEach((draft, draftIndex) => {
          console.log(`     Draft ${draftIndex + 1}:`);
          console.log(`       - Status: ${draft.status}`);
          console.log(`       - DirectorName: ${draft.directorName}`);
          console.log(`       - Content: "${draft.responseContent?.substring(0, 50)}..."`);
          
          totalDrafts++;
          if (draft.status === 'PENDING_DG_REVIEW') {
            pendingDGReviewDrafts++;
          }
        });
      }
    });
    
    console.log(`\n📊 === STATISTIQUES DRAFTS ===`);
    console.log(`Total drafts créés: ${totalDrafts}`);
    console.log(`Drafts PENDING_DG_REVIEW: ${pendingDGReviewDrafts}`);
    
    // 2. Tester le service DG
    console.log(`\n🧪 === TEST SERVICE DG AVEC DRAFTS ===`);
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      
      if (dg) {
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
        
        console.log(`📊 Service DG: ${dgTasks.length} correspondances`);
        
        dgTasks.forEach((task, index) => {
          console.log(`\n   ${index + 1}. ${task.title || task.subject}`);
          console.log(`      - Status: ${task.status}`);
          console.log(`      - WorkflowStatus: ${task.workflowStatus}`);
          console.log(`      - Drafts: ${task.responseDrafts?.length || 0}`);
          
          if (task.responseDrafts && task.responseDrafts.length > 0) {
            task.responseDrafts.forEach((draft, draftIndex) => {
              console.log(`        Draft ${draftIndex + 1}: ${draft.status} par ${draft.directorName}`);
            });
          }
        });
      }
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    // 3. Tester le compteur dashboard
    console.log(`\n📊 === TEST COMPTEUR DASHBOARD ===`);
    
    try {
      const DirectorGeneralService = require('./src/services/directorGeneralService');
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      
      if (dg) {
        const pendingCount = await DirectorGeneralService.getPendingDraftsCount(dg._id);
        console.log(`📊 Compteur dashboard: ${pendingCount} drafts en attente`);
        
        const dashboardData = await DirectorGeneralService.getDashboardData(dg._id);
        console.log(`📊 Dashboard pendingApproval: ${dashboardData.pendingApproval}`);
        
        if (pendingCount > 0) {
          console.log('✅ Le compteur DG devrait maintenant afficher un nombre > 0');
        } else {
          console.log('❌ Le compteur est encore à 0');
        }
      }
    } catch (dashboardError) {
      console.error('❌ Erreur compteur dashboard:', dashboardError.message);
    }
    
    // 4. Vérifications pour l'interface
    console.log(`\n🎯 === VÉRIFICATIONS INTERFACE DG ===`);
    
    if (pendingDGReviewDrafts > 0) {
      console.log(`✅ ${pendingDGReviewDrafts} draft(s) PENDING_DG_REVIEW trouvé(s)`);
      console.log('🎯 L\'interface DG devrait maintenant afficher:');
      console.log(`   - Compteur: ${pendingDGReviewDrafts}`);
      console.log('   - Badge: "X proposition(s) 🔔"');
      console.log('   - Mise en évidence: Bordure ambre');
      console.log('   - Boutons d\'approbation: Visibles dans le chat');
    } else {
      console.log('❌ Aucun draft PENDING_DG_REVIEW trouvé');
      console.log('🔧 Vérifiez que les drafts ont le bon statut');
    }
    
    // 5. Recommandations
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    if (totalDrafts > 0 && pendingDGReviewDrafts > 0) {
      console.log('✅ Drafts créés avec succès !');
      console.log('🎯 Actions:');
      console.log('1. Redémarrer le serveur backend si pas encore fait');
      console.log('2. Se connecter en tant que DG dans l\'interface');
      console.log('3. Vérifier le compteur dashboard');
      console.log('4. Aller dans "Révision Propositions"');
      console.log('5. Vérifier la mise en évidence et les badges');
      console.log('6. Ouvrir une correspondance et tester les boutons d\'approbation');
    } else if (totalDrafts > 0 && pendingDGReviewDrafts === 0) {
      console.log('⚠️ Drafts créés mais statut incorrect');
      console.log('🔧 Vérifiez que le statut est "PENDING_DG_REVIEW"');
    } else {
      console.log('❌ Aucun draft détecté');
      console.log('🔧 Vérifiez la création des drafts côté interface directeur');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDraftsCreated();

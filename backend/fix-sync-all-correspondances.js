const mongoose = require('mongoose');

async function fixSyncAllCorrespondances() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔧 === SYNCHRONISATION AUTOMATIQUE TOUS STATUTS ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Récupérer toutes les correspondances
    const correspondances = await db.collection('correspondances').find({}).toArray();
    console.log(`📧 Total correspondances: ${correspondances.length}`);
    
    let fixed = 0;
    let alreadySync = 0;
    
    // 2. Pour chaque correspondance, synchroniser avec son workflow
    for (const corresp of correspondances) {
      const workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: corresp._id
      });
      
      if (workflow) {
        // Vérifier si synchronisation nécessaire
        if (corresp.workflowStatus !== workflow.currentStatus || 
            corresp.assignedTo?.toString() !== workflow.assignedDirector?.toString()) {
          
          console.log(`🔧 Synchronisation: ${corresp.title || corresp.subject}`);
          console.log(`   Avant: workflowStatus=${corresp.workflowStatus}, assignedTo=${corresp.assignedTo}`);
          console.log(`   Après: workflowStatus=${workflow.currentStatus}, assignedTo=${workflow.assignedDirector}`);
          
          // Synchroniser
          const updateResult = await db.collection('correspondances').updateOne(
            { _id: corresp._id },
            {
              $set: {
                workflowStatus: workflow.currentStatus,
                assignedTo: workflow.assignedDirector,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount === 1) {
            fixed++;
            console.log(`   ✅ Synchronisé`);
          } else {
            console.log(`   ❌ Échec synchronisation`);
          }
        } else {
          alreadySync++;
          console.log(`✅ ${corresp.title || corresp.subject} - Déjà synchronisé`);
        }
      } else {
        console.log(`❌ ${corresp.title || corresp.subject} - Pas de workflow`);
      }
    }
    
    console.log(`\n📊 === RÉSULTATS ===`);
    console.log(`✅ Correspondances synchronisées: ${fixed}`);
    console.log(`✅ Déjà synchronisées: ${alreadySync}`);
    console.log(`📧 Total traitées: ${correspondances.length}`);
    
    // 3. Vérification finale
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    
    const updatedCorrespondances = await db.collection('correspondances').find({}).toArray();
    
    for (const corresp of updatedCorrespondances) {
      const workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: corresp._id
      });
      
      if (workflow) {
        const isSync = (corresp.workflowStatus === workflow.currentStatus);
        console.log(`${isSync ? '✅' : '❌'} ${corresp.title || corresp.subject}`);
        console.log(`   Correspondance: ${corresp.workflowStatus}`);
        console.log(`   Workflow: ${workflow.currentStatus}`);
        console.log(`   Drafts: ${workflow.responseDrafts?.length || 0}`);
      }
    }
    
    // 4. Tester le service DG après synchronisation
    console.log(`\n🧪 === TEST SERVICE DG APRÈS SYNC ===`);
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      
      if (dg) {
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
        
        console.log(`📊 Service DG après sync: ${dgTasks.length} correspondances`);
        
        dgTasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.title || task.subject}`);
          console.log(`      - Status: ${task.status}`);
          console.log(`      - WorkflowStatus: ${task.workflowStatus}`);
          console.log(`      - Drafts: ${task.responseDrafts?.length || 0}`);
        });
      }
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    console.log(`\n🎯 === PROCHAINES ÉTAPES ===`);
    console.log('1. 🔄 Redémarrer le serveur backend');
    console.log('2. 🧪 Tester l\'interface DG - toutes les correspondances doivent avoir le bon statut');
    console.log('3. 👤 Se connecter en tant que directeur et créer un draft');
    console.log('4. 👑 Vérifier que le compteur DG passe à 1 et que les boutons apparaissent');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixSyncAllCorrespondances();

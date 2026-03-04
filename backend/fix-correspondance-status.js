const mongoose = require('mongoose');

async function fixCorrespondanceStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION STATUS CORRESPONDANCE ===\n');
    
    // 1. Trouver la correspondance avec status incorrect
    const correspondance = await db.collection('correspondances').findOne({
      _id: new mongoose.Types.ObjectId('68e8709bd7e8c37afa328257')
    });
    
    if (!correspondance) {
      console.log('❌ Correspondance non trouvée');
      process.exit(1);
    }
    
    console.log(`📧 Correspondance: ${correspondance.title || correspondance.subject}`);
    console.log(`   Status actuel: ${correspondance.status}`);
    console.log(`   WorkflowStatus actuel: ${correspondance.workflowStatus}`);
    
    // 2. Trouver le workflow lié
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: correspondance._id
    });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé');
      process.exit(1);
    }
    
    console.log(`🔄 Workflow: ${workflow._id}`);
    console.log(`   Status workflow: ${workflow.currentStatus}`);
    
    // 3. Synchroniser les statuts
    console.log('\n🔧 Synchronisation des statuts...');
    
    const updateResult = await db.collection('correspondances').updateOne(
      { _id: correspondance._id },
      {
        $set: {
          workflowStatus: workflow.currentStatus, // ASSIGNED_TO_DIRECTOR
          assignedTo: workflow.assignedDirector,
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log('✅ Correspondance mise à jour !');
      
      // Vérifier le résultat
      const updatedCorrespondance = await db.collection('correspondances').findOne({
        _id: correspondance._id
      });
      
      console.log('\n📊 Résultat:');
      console.log(`   Status: ${updatedCorrespondance.status}`);
      console.log(`   WorkflowStatus: ${updatedCorrespondance.workflowStatus}`);
      console.log(`   AssignedTo: ${updatedCorrespondance.assignedTo}`);
      
    } else {
      console.log('❌ Échec de la mise à jour');
    }
    
    // 4. Tester le service DG
    console.log('\n🧪 === TEST SERVICE DG ===');
    
    try {
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      
      const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
      
      console.log(`📊 Service DG: ${dgTasks.length} correspondances`);
      
      if (dgTasks.length > 0) {
        const task = dgTasks[0];
        console.log(`   - Titre: ${task.title || task.subject}`);
        console.log(`   - Status: ${task.status}`);
        console.log(`   - WorkflowStatus: ${task.workflowStatus}`);
        console.log(`   - Drafts: ${task.responseDrafts?.length || 0}`);
      }
      
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    console.log('\n🎯 === ACTIONS SUIVANTES ===');
    console.log('1. Redémarrer le serveur backend');
    console.log('2. Se connecter en tant que directeur (Anis Ben Janet)');
    console.log('3. Créer un draft de réponse');
    console.log('4. Vérifier l\'interface DG');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixCorrespondanceStatus();

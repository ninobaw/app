const mongoose = require('mongoose');

async function setRevisionStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔄 === MISE EN STATUT REVISION ===\n');
    
    // Trouver le workflow
    const workflow = await db.collection('correspondenceworkflows').findOne({});
    
    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      process.exit(1);
    }
    
    console.log(`📋 Workflow: ${workflow._id}`);
    console.log(`   - Status actuel: ${workflow.currentStatus}`);
    
    // Mettre en statut DIRECTOR_REVISION pour tester
    const result = await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      { 
        $set: { 
          currentStatus: 'DIRECTOR_REVISION',
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Statut mis à DIRECTOR_REVISION');
      
      // Aussi mettre à jour la correspondance
      await db.collection('correspondances').updateOne(
        { _id: workflow.correspondanceId },
        { 
          $set: { 
            workflowStatus: 'DIRECTOR_REVISION',
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Correspondance aussi mise à jour');
    }
    
    console.log('\n🎯 Maintenant testez:');
    console.log('1. Connectez-vous comme DG');
    console.log('2. Vous devriez voir la correspondance dans le dashboard');
    console.log('3. Dans le chat, vous devriez voir "Révision en cours"');
    console.log('4. Pas de boutons d\'approbation (révision en cours)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

setRevisionStatus();

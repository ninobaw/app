const mongoose = require('mongoose');

async function debugDGAssignment() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('👑 === DIAGNOSTIC ASSIGNATION DG ===\n');
    
    // 1. Vérifier tous les workflows
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`📋 Total workflows: ${workflows.length}\n`);
    
    workflows.forEach((w, index) => {
      console.log(`${index + 1}. Workflow ${w._id}`);
      console.log(`   - Status: ${w.currentStatus}`);
      console.log(`   - Correspondance: ${w.correspondanceId}`);
      console.log(`   - Directeur assigné: ${w.assignedDirector}`);
      console.log(`   - DG assigné: ${w.directeurGeneral}`);
      console.log(`   - Créé le: ${w.createdAt}`);
      console.log('');
    });
    
    // 2. Vérifier les utilisateurs DG
    const dgUsers = await db.collection('users').find({ role: 'DIRECTEUR_GENERAL' }).toArray();
    console.log(`👑 Utilisateurs DG trouvés: ${dgUsers.length}`);
    
    dgUsers.forEach((dg, index) => {
      console.log(`${index + 1}. ${dg.firstName} ${dg.lastName}`);
      console.log(`   - ID: ${dg._id}`);
      console.log(`   - Email: ${dg.email}`);
      console.log('');
    });
    
    // 3. Vérifier si les workflows ont le bon DG assigné
    if (dgUsers.length > 0) {
      const dgId = dgUsers[0]._id.toString();
      console.log(`🔍 Vérification assignation DG (${dgId}):`);
      
      workflows.forEach((w, index) => {
        const isAssigned = w.directeurGeneral === dgId;
        console.log(`${index + 1}. Workflow ${w._id}: ${isAssigned ? '✅ DG ASSIGNÉ' : '❌ DG NON ASSIGNÉ'}`);
        if (!isAssigned) {
          console.log(`   - DG dans workflow: ${w.directeurGeneral}`);
          console.log(`   - DG attendu: ${dgId}`);
        }
      });
    }
    
    // 4. Vérifier les correspondances
    console.log('\n📝 Correspondances:');
    const correspondances = await db.collection('correspondances').find({}).toArray();
    
    correspondances.forEach((c, index) => {
      console.log(`${index + 1}. "${c.objet || c.subject}"`);
      console.log(`   - ID: ${c._id}`);
      console.log(`   - Personnes concernées: ${c.personnesConcernees?.length || 0}`);
      console.log(`   - Workflow status: ${c.workflowStatus}`);
      
      // Vérifier si cette correspondance a un workflow
      const hasWorkflow = workflows.some(w => w.correspondanceId?.toString() === c._id.toString());
      console.log(`   - A un workflow: ${hasWorkflow ? '✅ OUI' : '❌ NON'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGAssignment();

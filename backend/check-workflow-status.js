const mongoose = require('mongoose');

async function checkWorkflowStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📋 === ÉTAT ACTUEL DES WORKFLOWS ===\n');
    
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    
    workflows.forEach((w, index) => {
      console.log(`${index + 1}. Workflow ${w._id}`);
      console.log(`   - Status: ${w.currentStatus}`);
      console.log(`   - DG: ${w.directeurGeneral}`);
      console.log(`   - Correspondance: ${w.correspondanceId}`);
      console.log(`   - Créé: ${w.createdAt}`);
      console.log(`   - Modifié: ${w.updatedAt}`);
      console.log('');
    });
    
    console.log('📝 === ÉTAT DES CORRESPONDANCES ===\n');
    const correspondances = await db.collection('correspondances').find({}).toArray();
    
    correspondances.forEach((c, index) => {
      console.log(`${index + 1}. "${c.objet || c.subject}"`);
      console.log(`   - Workflow Status: ${c.workflowStatus}`);
      console.log(`   - Response Drafts: ${c.responseDrafts?.length || 0}`);
      if (c.responseDrafts?.length > 0) {
        c.responseDrafts.forEach((draft, dIndex) => {
          console.log(`     Draft ${dIndex + 1}:`);
          console.log(`       - Status: ${draft.status}`);
          console.log(`       - Créé: ${draft.createdAt}`);
          console.log(`       - Contenu: ${draft.responseContent?.substring(0, 50)}...`);
        });
      }
      console.log('');
    });
    
    // Vérifier si le DG devrait voir des correspondances
    console.log('👑 === ANALYSE POUR LE DG ===\n');
    
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    
    const workflowsForDG = workflows.filter(w => w.directeurGeneral === dgId);
    console.log(`Workflows assignés au DG: ${workflowsForDG.length}`);
    
    const workflowsWithDrafts = workflowsForDG.filter(w => w.currentStatus === 'DIRECTOR_DRAFT');
    console.log(`Workflows avec status DIRECTOR_DRAFT: ${workflowsWithDrafts.length}`);
    
    workflowsForDG.forEach((w, index) => {
      console.log(`${index + 1}. Workflow ${w._id}:`);
      console.log(`   - Status: ${w.currentStatus}`);
      console.log(`   - Devrait être visible par DG: ${w.currentStatus === 'DIRECTOR_DRAFT' ? 'OUI' : 'NON'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkWorkflowStatus();

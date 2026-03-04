const mongoose = require('mongoose');

async function debugNewCorrespondance() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📋 === DIAGNOSTIC NOUVELLE CORRESPONDANCE ===\n');
    
    // 1. Lister toutes les correspondances
    const correspondances = await db.collection('correspondances').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📝 Total correspondances: ${correspondances.length}\n`);
    
    correspondances.forEach((c, index) => {
      console.log(`${index + 1}. "${c.objet || c.subject}"`);
      console.log(`   - ID: ${c._id}`);
      console.log(`   - Créée: ${c.createdAt}`);
      console.log(`   - Workflow Status: ${c.workflowStatus}`);
      console.log(`   - Assignée à: ${c.assignedTo}`);
      console.log(`   - Response Drafts: ${c.responseDrafts?.length || 0}`);
      if (c.responseDrafts?.length > 0) {
        c.responseDrafts.forEach((draft, dIndex) => {
          console.log(`     Draft ${dIndex + 1}: ${draft.status} (${draft.createdAt})`);
        });
      }
      console.log('');
    });
    
    // 2. Lister tous les workflows
    console.log('🔄 === WORKFLOWS CORRESPONDANTS ===\n');
    
    const workflows = await db.collection('correspondenceworkflows').find({}).sort({ createdAt: -1 }).toArray();
    
    console.log(`📋 Total workflows: ${workflows.length}\n`);
    
    workflows.forEach((w, index) => {
      console.log(`${index + 1}. Workflow ${w._id}`);
      console.log(`   - Correspondance: ${w.correspondanceId}`);
      console.log(`   - Status: ${w.currentStatus}`);
      console.log(`   - DG assigné: ${w.directeurGeneral}`);
      console.log(`   - Directeur assigné: ${w.assignedDirector}`);
      console.log(`   - Créé: ${w.createdAt}`);
      console.log('');
    });
    
    // 3. Vérifier les correspondances sans workflow
    console.log('⚠️ === CORRESPONDANCES SANS WORKFLOW ===\n');
    
    const correspondanceIds = correspondances.map(c => c._id.toString());
    const workflowCorrespondanceIds = workflows.map(w => w.correspondanceId?.toString());
    
    const orphanCorrespondances = correspondances.filter(c => 
      !workflowCorrespondanceIds.includes(c._id.toString())
    );
    
    if (orphanCorrespondances.length > 0) {
      console.log(`❌ ${orphanCorrespondances.length} correspondance(s) sans workflow:\n`);
      orphanCorrespondances.forEach((c, index) => {
        console.log(`${index + 1}. "${c.objet || c.subject}"`);
        console.log(`   - ID: ${c._id}`);
        console.log(`   - Assignée à: ${c.assignedTo}`);
        console.log(`   - Response Drafts: ${c.responseDrafts?.length || 0}`);
        console.log('');
      });
    } else {
      console.log('✅ Toutes les correspondances ont un workflow');
    }
    
    // 4. Vérifier le DG ID
    console.log('👑 === VÉRIFICATION DG ===\n');
    
    const dgUser = await db.collection('users').findOne({ 
      email: 'melanie@tav.aero' 
    });
    
    if (dgUser) {
      console.log(`DG ID: ${dgUser._id}`);
      
      const workflowsWithDG = workflows.filter(w => w.directeurGeneral === dgUser._id.toString());
      console.log(`Workflows avec ce DG: ${workflowsWithDG.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugNewCorrespondance();

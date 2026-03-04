const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function checkCurrentData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    // 1. Vérifier les correspondances existantes
    console.log('📝 1. Correspondances existantes:');
    const correspondances = await db.collection('correspondances').find({}).toArray();
    console.log(`   Total: ${correspondances.length}`);
    
    correspondances.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c._id}`);
      console.log(`      - Objet: ${c.objet || c.subject || 'N/A'}`);
      console.log(`      - Status: ${c.workflowStatus || 'N/A'}`);
      console.log(`      - Drafts: ${c.responseDrafts?.length || 0}`);
    });
    
    // 2. Vérifier les workflows existants
    console.log('\n🔄 2. Workflows existants:');
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`   Total: ${workflows.length}`);
    
    workflows.forEach((w, index) => {
      console.log(`   ${index + 1}. ${w._id}`);
      console.log(`      - Correspondance: ${w.correspondanceId}`);
      console.log(`      - Status: ${w.currentStatus}`);
      console.log(`      - Directeur: ${w.assignedDirector}`);
      console.log(`      - DG: ${w.directeurGeneral}`);
      console.log(`      - Drafts: ${w.responseDrafts?.length || 0}`);
    });
    
    // 3. Vérifier les utilisateurs
    console.log('\n👥 3. Utilisateurs:');
    const users = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'DIRECTEUR_GENERAL'] }
    }).toArray();
    
    users.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.firstName} ${u.lastName} (${u.role})`);
      console.log(`      - ID: ${u._id}`);
      console.log(`      - Email: ${u.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkCurrentData();

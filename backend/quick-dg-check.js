const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function quickDGCheck() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔍 === VÉRIFICATION RAPIDE DG ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    console.log(`👑 DG trouvé: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    // 2. Workflows avec ce DG
    const workflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id
    }).toArray();
    console.log(`\n🔄 Workflows avec DG assigné: ${workflows.length}`);
    
    workflows.forEach((w, index) => {
      console.log(`   ${index + 1}. ${w._id}`);
      console.log(`      - Status: ${w.currentStatus}`);
      console.log(`      - Correspondance: ${w.correspondanceId}`);
      console.log(`      - Drafts: ${w.responseDrafts?.length || 0}`);
    });
    
    // 3. Correspondances existantes
    const correspondances = await db.collection('correspondances').find({}).toArray();
    console.log(`\n📝 Correspondances totales: ${correspondances.length}`);
    
    correspondances.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c._id}`);
      console.log(`      - Objet: ${c.objet || 'N/A'}`);
      console.log(`      - Status: ${c.workflowStatus || 'N/A'}`);
      console.log(`      - Drafts: ${c.responseDrafts?.length || 0}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

quickDGCheck();

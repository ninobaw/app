const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function simpleDGDebug() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    // ID du DG
    const dgUserId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    
    console.log('👑 === DIAGNOSTIC SIMPLE DASHBOARD DG ===\n');
    
    // 1. Tous les workflows avec ce DG
    console.log(`🔍 Recherche workflows pour DG: ${dgUserId}`);
    
    const allWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dgUserId
    }).toArray();
    
    console.log(`📋 Total workflows avec DG: ${allWorkflows.length}\n`);
    
    allWorkflows.forEach((w, index) => {
      console.log(`${index + 1}. Workflow ${w._id}`);
      console.log(`   - Status: ${w.currentStatus}`);
      console.log(`   - Correspondance: ${w.correspondanceId}`);
      console.log(`   - Drafts: ${w.responseDrafts?.length || 0}`);
      
      // Vérifier si ce workflow devrait être compté
      const hasCorrectStatus = [
        'DIRECTOR_DRAFT',
        'DIRECTOR_REVISION', 
        'DG_REVIEW',
        'PENDING_DG_REVIEW'
      ].includes(w.currentStatus);

      const hasPendingDrafts = w.responseDrafts && 
        w.responseDrafts.some(draft => 
          ['PENDING_DG_REVIEW', 'SUBMITTED_TO_DG', 'DRAFT', 'REVISED'].includes(draft.status)
        );

      const shouldBeCounted = hasCorrectStatus || hasPendingDrafts;
      
      console.log(`   - Devrait être compté: ${shouldBeCounted ? 'OUI' : 'NON'}`);
      console.log(`     * Status correct: ${hasCorrectStatus}`);
      console.log(`     * Drafts en attente: ${hasPendingDrafts}`);
      
      if (w.responseDrafts?.length > 0) {
        console.log(`   - Détail drafts:`);
        w.responseDrafts.forEach((draft, dIndex) => {
          console.log(`     ${dIndex + 1}. Status: ${draft.status}`);
        });
      }
      console.log('');
    });
    
    // Compter combien devraient être en attente
    const pendingCount = allWorkflows.filter(w => {
      const hasCorrectStatus = [
        'DIRECTOR_DRAFT',
        'DIRECTOR_REVISION',
        'DG_REVIEW', 
        'PENDING_DG_REVIEW'
      ].includes(w.currentStatus);

      const hasPendingDrafts = w.responseDrafts && 
        w.responseDrafts.some(draft => 
          ['PENDING_DG_REVIEW', 'SUBMITTED_TO_DG', 'DRAFT', 'REVISED'].includes(draft.status)
        );

      return hasCorrectStatus || hasPendingDrafts;
    }).length;
    
    console.log(`🎯 RÉSULTAT: ${pendingCount} workflows devraient être comptés comme "en attente"`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

simpleDGDebug();

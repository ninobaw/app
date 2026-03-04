const mongoose = require('mongoose');
const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function debugDGDashboard() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    // ID du DG
    const dgUserId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117';
    
    console.log('👑 === DIAGNOSTIC DASHBOARD DG ===\n');
    
    // 1. Vérifier les correspondances via le service
    console.log('📊 1. Via DirectorGeneralWorkflowService:');
    try {
      const pendingCorrespondances = await DirectorGeneralWorkflowService.getPendingCorrespondances(dgUserId);
      console.log(`   - Correspondances en attente: ${pendingCorrespondances.length}`);
      
      pendingCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. ${corresp.objet || corresp.subject}`);
        console.log(`      - Status workflow: ${corresp.workflowInfo?.currentStatus}`);
        console.log(`      - ID: ${corresp._id}`);
      });
      
      const stats = await DirectorGeneralWorkflowService.getDashboardStats(dgUserId);
      console.log(`   - Stats totalPending: ${stats.totalPending}`);
      
    } catch (error) {
      console.error('❌ Erreur service DG:', error.message);
    }
    
    // 2. Vérifier directement dans la base
    console.log('\n📋 2. Vérification directe base de données:');
    
    // Tous les workflows avec ce DG
    const allWorkflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { directeurGeneral: dgUserId },
        { directeurGeneral: new mongoose.Types.ObjectId(dgUserId) }
      ]
    }).toArray();
    
    console.log(`   - Total workflows avec DG: ${allWorkflows.length}`);
    
    allWorkflows.forEach((w, index) => {
      console.log(`   ${index + 1}. Workflow ${w._id}`);
      console.log(`      - Status: ${w.currentStatus}`);
      console.log(`      - Correspondance: ${w.correspondanceId}`);
      console.log(`      - Drafts: ${w.responseDrafts?.length || 0}`);
      
      if (w.responseDrafts?.length > 0) {
        w.responseDrafts.forEach((draft, dIndex) => {
          console.log(`        Draft ${dIndex + 1}: ${draft.status}`);
        });
      }
    });
    
    // 3. Vérifier les correspondances liées
    console.log('\n📝 3. Correspondances associées:');
    
    const correspondanceIds = allWorkflows.map(w => w.correspondanceId).filter(Boolean);
    const correspondances = await db.collection('correspondances').find({
      _id: { $in: correspondanceIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();
    
    console.log(`   - Correspondances trouvées: ${correspondances.length}`);
    
    correspondances.forEach((c, index) => {
      console.log(`   ${index + 1}. "${c.objet || c.subject}"`);
      console.log(`      - ID: ${c._id}`);
      console.log(`      - Status: ${c.workflowStatus}`);
      console.log(`      - Drafts: ${c.responseDrafts?.length || 0}`);
    });
    
    // 4. Analyser pourquoi 2 sont comptées
    console.log('\n🔍 4. Analyse du comptage:');
    
    const workflowsWithDrafts = allWorkflows.filter(w => {
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

      console.log(`   - Workflow ${w._id}:`);
      console.log(`     * Status correct: ${hasCorrectStatus} (${w.currentStatus})`);
      console.log(`     * Drafts en attente: ${hasPendingDrafts}`);
      
      return hasCorrectStatus || hasPendingDrafts;
    });
    
    console.log(`\n📊 Résultat: ${workflowsWithDrafts.length} workflows comptés comme "en attente"`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGDashboard();

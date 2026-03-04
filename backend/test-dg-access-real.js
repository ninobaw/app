const mongoose = require('mongoose');

async function testDGAccessReal() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === TEST ACCÈS DG RÉEL ===\n');
    
    // 1. Récupérer le DG réel
    const dgUser = await db.collection('users').findOne({ 
      email: 'melanie@tav.aero' 
    });
    
    if (!dgUser) {
      console.log('❌ DG melanie@tav.aero non trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG trouvé: ${dgUser.firstName} ${dgUser.lastName}`);
    console.log(`   - ID: ${dgUser._id}`);
    console.log(`   - Role: ${dgUser.role}`);
    console.log(`   - Email: ${dgUser.email}`);
    
    // 2. Récupérer le workflow
    const workflow = await db.collection('correspondenceworkflows').findOne({});
    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      process.exit(1);
    }
    
    console.log(`\n📋 Workflow: ${workflow._id}`);
    console.log(`   - DG assigné: ${workflow.directeurGeneral}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
    
    // 3. Test de comparaison exacte
    console.log('\n🔍 Tests de comparaison:');
    const dgId = dgUser._id.toString();
    const workflowDgId = workflow.directeurGeneral;
    
    console.log(`   - DG User ID: "${dgId}"`);
    console.log(`   - Workflow DG ID: "${workflowDgId}"`);
    console.log(`   - Types: ${typeof dgId} vs ${typeof workflowDgId}`);
    console.log(`   - Égalité stricte: ${dgId === workflowDgId}`);
    console.log(`   - Égalité avec toString(): ${dgId === workflowDgId?.toString()}`);
    
    // 4. Simuler la logique exacte du chat
    console.log('\n🔐 Simulation logique chat:');
    
    const userRole = dgUser.role;
    const userId = dgUser._id.toString();
    
    console.log(`   - User role: ${userRole}`);
    console.log(`   - User ID: ${userId}`);
    
    const isDGRole = userRole === 'DIRECTEUR_GENERAL';
    const isDGWithAccess = 
      userRole === 'DIRECTEUR_GENERAL' && 
      workflow.directeurGeneral?.toString() === userId;
    
    console.log(`   - Est DG role: ${isDGRole}`);
    console.log(`   - DG avec accès: ${isDGWithAccess}`);
    console.log(`   - Workflow DG toString(): "${workflow.directeurGeneral?.toString()}"`);
    console.log(`   - User ID: "${userId}"`);
    console.log(`   - Comparaison finale: ${workflow.directeurGeneral?.toString() === userId}`);
    
    // 5. Vérifier s'il y a des caractères cachés
    console.log('\n🔬 Analyse caractères:');
    const wfDgStr = workflow.directeurGeneral?.toString() || '';
    const userIdStr = userId;
    
    console.log(`   - Longueur workflow DG: ${wfDgStr.length}`);
    console.log(`   - Longueur user ID: ${userIdStr.length}`);
    console.log(`   - Workflow DG bytes: [${Array.from(wfDgStr).map(c => c.charCodeAt(0)).join(', ')}]`);
    console.log(`   - User ID bytes: [${Array.from(userIdStr).map(c => c.charCodeAt(0)).join(', ')}]`);
    
    // 6. Test avec trim au cas où
    const trimmedWfDg = wfDgStr.trim();
    const trimmedUserId = userIdStr.trim();
    console.log(`   - Égalité après trim: ${trimmedWfDg === trimmedUserId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDGAccessReal();

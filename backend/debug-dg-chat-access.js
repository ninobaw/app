const mongoose = require('mongoose');
const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');

async function debugDGChatAccess() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('👑 === DEBUG ACCÈS CHAT DG ===\n');
    
    // 1. Récupérer le DG
    const dgUser = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dgUser) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG trouvé: ${dgUser.firstName} ${dgUser.lastName}`);
    console.log(`   - ID: ${dgUser._id}`);
    console.log(`   - Type ID: ${typeof dgUser._id}`);
    
    // 2. Récupérer le workflow
    const workflow = await db.collection('correspondenceworkflows').findOne({});
    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      process.exit(1);
    }
    
    console.log(`\n📋 Workflow trouvé: ${workflow._id}`);
    console.log(`   - DG assigné: ${workflow.directeurGeneral}`);
    console.log(`   - Type DG assigné: ${typeof workflow.directeurGeneral}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    
    // 3. Test de comparaison directe
    console.log('\n🔍 Tests de comparaison:');
    const dgId = dgUser._id.toString();
    const workflowDgId = workflow.directeurGeneral;
    
    console.log(`   - DG ID (string): "${dgId}"`);
    console.log(`   - Workflow DG ID: "${workflowDgId}"`);
    console.log(`   - Égalité directe: ${dgId === workflowDgId}`);
    console.log(`   - Égalité toString(): ${dgId === workflowDgId?.toString()}`);
    
    // 4. Test via le service
    console.log('\n🔧 Test via DirectorGeneralWorkflowService:');
    try {
      const hasAccess = await DirectorGeneralWorkflowService.hasWorkflowAccess(dgId, workflow._id);
      console.log(`   - Résultat hasWorkflowAccess: ${hasAccess}`);
    } catch (error) {
      console.error(`   - Erreur service: ${error.message}`);
    }
    
    // 5. Test avec différents formats d'ID
    console.log('\n🧪 Tests avec différents formats:');
    
    // Test avec ObjectId
    try {
      const hasAccessObjectId = await DirectorGeneralWorkflowService.hasWorkflowAccess(dgUser._id, workflow._id);
      console.log(`   - Avec ObjectId: ${hasAccessObjectId}`);
    } catch (error) {
      console.error(`   - Erreur ObjectId: ${error.message}`);
    }
    
    // Test avec string
    try {
      const hasAccessString = await DirectorGeneralWorkflowService.hasWorkflowAccess(dgId, workflow._id.toString());
      console.log(`   - Avec string: ${hasAccessString}`);
    } catch (error) {
      console.error(`   - Erreur string: ${error.message}`);
    }
    
    // 6. Vérification manuelle du workflow
    console.log('\n📊 Vérification manuelle:');
    const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
    const workflowDoc = await CorrespondenceWorkflow.findById(workflow._id);
    
    if (workflowDoc) {
      console.log(`   - Workflow trouvé via modèle: ✅`);
      console.log(`   - DG dans modèle: ${workflowDoc.directeurGeneral}`);
      console.log(`   - Type DG modèle: ${typeof workflowDoc.directeurGeneral}`);
      
      const manualCheck = workflowDoc.directeurGeneral?.toString() === dgId;
      console.log(`   - Vérification manuelle: ${manualCheck}`);
    } else {
      console.log(`   - Workflow non trouvé via modèle: ❌`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGChatAccess();

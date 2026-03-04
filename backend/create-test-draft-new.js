const mongoose = require('mongoose');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

async function createTestDraft() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📝 === CRÉATION DRAFT DE TEST ===\n');
    
    // 1. Trouver une correspondance avec workflow
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    if (workflows.length === 0) {
      console.log('❌ Aucun workflow trouvé');
      process.exit(1);
    }
    
    const workflow = workflows[0];
    const correspondanceId = workflow.correspondanceId;
    const directorId = workflow.assignedDirector;
    
    console.log(`📋 Correspondance: ${correspondanceId}`);
    console.log(`👤 Directeur: ${directorId}`);
    console.log(`📊 Status actuel: ${workflow.currentStatus}\n`);
    
    // 2. Créer un draft de test
    const draftData = {
      responseContent: 'Ceci est une proposition de réponse de test créée automatiquement pour tester le workflow DG.',
      attachments: [],
      comments: 'Draft créé automatiquement pour test',
      isUrgent: false
    };
    
    console.log('🔄 Création du draft...');
    
    const result = await CorrespondanceWorkflowService.createResponseDraft(
      correspondanceId,
      directorId,
      draftData
    );
    
    console.log('✅ Draft créé avec succès !');
    console.log('📊 Résultat:', result);
    
    // 3. Vérifier le nouveau statut
    const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({ _id: workflow._id });
    console.log(`\n📊 Nouveau statut workflow: ${updatedWorkflow.currentStatus}`);
    
    // 4. Vérifier que le DG peut maintenant voir cette correspondance
    console.log('\n👑 Test accès DG...');
    const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
    
    const dgId = workflow.directeurGeneral;
    const pendingCorrespondances = await DirectorGeneralWorkflowService.getPendingCorrespondances(dgId);
    
    console.log(`📋 Correspondances en attente pour DG: ${pendingCorrespondances.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createTestDraft();

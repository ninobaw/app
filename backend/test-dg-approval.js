const mongoose = require('mongoose');
const axios = require('axios');

async function testDGApproval() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST APPROBATION DG ===\n');
    
    // 1. Trouver le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    // 2. Trouver une correspondance avec draft
    const correspondance = await db.collection('correspondances').findOne({
      'responseDrafts.0': { $exists: true }
    });
    
    if (!correspondance) {
      console.log('❌ Aucune correspondance avec draft trouvée');
      process.exit(1);
    }
    
    console.log(`📄 Correspondance: "${correspondance.objet || correspondance.subject}"`);
    console.log(`   - ID: ${correspondance._id}`);
    console.log(`   - Drafts: ${correspondance.responseDrafts?.length || 0}`);
    
    // 3. Vérifier le service directement
    console.log('\n🔧 Test du service CorrespondanceWorkflowService...');
    
    try {
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      const result = await CorrespondanceWorkflowService.provideDGFeedback(
        correspondance._id.toString(),
        0, // Premier draft
        dg._id,
        {
          action: 'APPROVE',
          feedback: 'Test d\'approbation automatique',
          isApproved: true
        }
      );
      
      console.log('✅ Service fonctionne:', result.success);
      
    } catch (serviceError) {
      console.log('❌ Erreur dans le service:', serviceError.message);
      console.log('Stack:', serviceError.stack);
    }
    
    // 4. Tester la route directement (simulation)
    console.log('\n🌐 Test de la route /dg-feedback...');
    
    // Simuler les données de la requête
    const requestData = {
      action: 'APPROVE',
      feedback: 'Test d\'approbation via route',
      isApproved: true
    };
    
    console.log('📤 Données de test:', requestData);
    console.log(`🎯 URL: /api/correspondances/workflow/dg-feedback/${correspondance._id}/0`);
    
    // Vérifier si la correspondance a des drafts valides
    if (correspondance.responseDrafts && correspondance.responseDrafts.length > 0) {
      const draft = correspondance.responseDrafts[0];
      console.log('\n📋 Premier draft:');
      console.log(`   - Directeur: ${draft.directorName || 'Non spécifié'}`);
      console.log(`   - Status: ${draft.status || 'Non spécifié'}`);
      console.log(`   - Contenu: ${draft.responseContent?.substring(0, 50) || 'Vide'}...`);
      console.log(`   - Feedbacks DG existants: ${draft.dgFeedbacks?.length || 0}`);
    }
    
    console.log('\n🎯 === DIAGNOSTIC ===');
    console.log('1. DG existe et est valide ✅');
    console.log('2. Correspondance avec draft existe ✅');
    console.log('3. Service à tester manuellement');
    console.log('4. Route à tester via API');
    
    console.log('\n📝 Pour tester manuellement:');
    console.log('1. Connectez-vous comme DG dans l\'interface');
    console.log('2. Ouvrez le chat de cette correspondance');
    console.log('3. Cliquez sur "Approuver"');
    console.log('4. Vérifiez les logs du serveur backend');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDGApproval();

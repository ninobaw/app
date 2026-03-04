const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Script pour tester la finalisation par le superviseur
 */

async function testSupervisorFinalize() {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 TEST FINALISATION SUPERVISEUR');
    console.log('🧪 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. TROUVER UNE CORRESPONDANCE APPROUVÉE PAR LE DG
    console.log('🔍 === RECHERCHE CORRESPONDANCE APPROUVÉE ===');
    
    const approvedCorrespondance = await Correspondance.findOne({
      workflowStatus: 'DG_APPROVED',
      responseDrafts: {
        $elemMatch: { status: 'APPROVED' }
      }
    }).lean();

    if (!approvedCorrespondance) {
      console.log('❌ Aucune correspondance approuvée trouvée');
      console.log('💡 Utilisez d\'abord le script test-dg-approval-unified.js pour créer une correspondance approuvée');
      return;
    }

    console.log(`✅ Correspondance trouvée: ${approvedCorrespondance._id}`);
    console.log(`📋 Titre: ${approvedCorrespondance.title}`);
    console.log(`🔄 Status: ${approvedCorrespondance.workflowStatus}`);
    console.log(`📝 Drafts approuvés: ${approvedCorrespondance.responseDrafts.filter(d => d.status === 'APPROVED').length}\n`);

    // 2. TROUVER LE SUPERVISEUR
    console.log('👤 === RECHERCHE SUPERVISEUR ===');
    
    const supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    if (!supervisor) {
      console.log('❌ Aucun superviseur bureau d\'ordre trouvé');
      return;
    }

    console.log(`✅ Superviseur: ${supervisor.firstName} ${supervisor.lastName} (${supervisor._id})\n`);

    // 3. TEST DE FINALISATION
    console.log('📝 === TEST FINALISATION ===');
    
    const finalData = {
      finalResponseContent: `Réponse finale envoyée par le superviseur bureau d'ordre.

Cette réponse fait suite à l'approbation du Directeur Général concernant "${approvedCorrespondance.title}".

La réponse a été finalisée et est prête à être envoyée au destinataire.

Cordialement,
${supervisor.firstName} ${supervisor.lastName}
Superviseur Bureau d'Ordre
Aéroport d'Enfidha`,
      attachments: [],
      sendMethod: 'EMAIL',
      deliveryMethod: 'EMAIL',
      recipientEmail: approvedCorrespondance.from_address,
      deliveryNotes: 'Envoi par email - Test de finalisation'
    };

    console.log('📤 Tentative de finalisation...');
    
    const result = await CorrespondanceWorkflowService.finalizeResponse(
      approvedCorrespondance._id.toString(),
      supervisor._id.toString(),
      finalData
    );

    console.log('✅ FINALISATION RÉUSSIE !');
    console.log('📊 Résultat:', JSON.stringify(result, null, 2));

    // 4. VÉRIFICATION
    console.log('\n🔍 === VÉRIFICATION ===');
    
    const updatedCorrespondance = await Correspondance.findById(approvedCorrespondance._id).lean();
    console.log(`🔄 Nouveau status: ${updatedCorrespondance.workflowStatus}`);
    console.log(`📅 Date réponse: ${updatedCorrespondance.responseDate}`);
    console.log(`📝 Réponse finale: ${updatedCorrespondance.finalResponse ? 'Présente' : 'Absente'}`);

    if (updatedCorrespondance.finalResponse) {
      console.log(`👤 Finalisée par: ${updatedCorrespondance.finalResponse.supervisorName}`);
      console.log(`📤 Méthode envoi: ${updatedCorrespondance.finalResponse.deliveryMethod}`);
    }

    console.log('\n✅ === TEST TERMINÉ ===');
    console.log('🎯 La finalisation par le superviseur fonctionne maintenant !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('📋 Message:', error.message);
    console.error('📊 Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

testSupervisorFinalize();

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function createDraftForExisting() {
  try {
    console.log('🔧 Création d\'un draft pour la correspondance existante...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc');
    
    const db = mongoose.connection.db;
    
    // IDs connus d'après les logs
    const correspondanceId = '68e4e198b56aefda67a832bc';
    const workflowId = '68e4e198b56aefda67a832c5';
    const directeurId = 'd45acede-21a1-4bd2-b1d1-4216f78f8887';
    
    console.log('📝 Correspondance:', correspondanceId);
    console.log('🔄 Workflow:', workflowId);
    console.log('👤 Directeur:', directeurId);
    
    // Créer un draft de réponse
    const draft = {
      directorId: directeurId,
      directorName: 'Anis Ben Janet',
      responseContent: 'Proposition de réponse de test pour validation par le DG.\n\nCette réponse traite les points soulevés dans la correspondance "azaz" et propose une solution appropriée selon nos procédures internes.\n\nMerci de valider cette proposition.',
      status: 'PENDING_DG_REVIEW',
      createdAt: new Date(),
      dgFeedbacks: []
    };
    
    console.log('📄 Draft créé:', draft.status);
    
    // 1. Mettre à jour la correspondance
    const corrResult = await db.collection('correspondances').updateOne(
      { _id: new mongoose.Types.ObjectId(correspondanceId) },
      {
        $push: { responseDrafts: draft },
        $set: { 
          workflowStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Correspondance mise à jour:', corrResult.modifiedCount);
    
    // 2. Mettre à jour le workflow
    const workflowResult = await db.collection('correspondenceworkflows').updateOne(
      { _id: new mongoose.Types.ObjectId(workflowId) },
      {
        $push: { responseDrafts: draft },
        $set: { 
          currentStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Workflow mis à jour:', workflowResult.modifiedCount);
    
    console.log('\n🎉 Draft de test créé avec succès !');
    console.log('\n📋 Résumé :');
    console.log('   - Correspondance: "azaz" → DIRECTOR_DRAFT');
    console.log('   - Workflow: ASSIGNED_TO_DIRECTOR → DIRECTOR_DRAFT');
    console.log('   - Draft: PENDING_DG_REVIEW');
    console.log('   - Directeur: Anis Ben Janet');
    
    console.log('\n🎯 Maintenant testez :');
    console.log('   1. Connectez-vous comme DG (melanie@tav.aero)');
    console.log('   2. Le dashboard devrait afficher 1 correspondance');
    console.log('   3. Le chat devrait être accessible');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createDraftForExisting();

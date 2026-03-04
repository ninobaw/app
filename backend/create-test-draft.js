const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function createTestDraft() {
  try {
    console.log('🔧 Création d\'un draft de test...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver la correspondance et le workflow
    const correspondance = await db.collection('correspondances').findOne({
      objet: 'azaz'
    });
    
    if (!correspondance) {
      console.log('❌ Correspondance "azaz" non trouvée');
      process.exit(1);
    }
    
    console.log('📝 Correspondance trouvée:', correspondance._id);
    
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: correspondance._id.toString()
    });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé pour cette correspondance');
      process.exit(1);
    }
    
    console.log('🔄 Workflow trouvé:', workflow._id);
    
    // 2. Trouver le directeur
    const directeur = await db.collection('users').findOne({
      role: 'DIRECTEUR'
    });
    
    if (!directeur) {
      console.log('❌ Directeur non trouvé');
      process.exit(1);
    }
    
    console.log('👤 Directeur trouvé:', `${directeur.firstName} ${directeur.lastName}`);
    
    // 3. Créer un draft de réponse
    const draft = {
      directorId: directeur._id,
      directorName: `${directeur.firstName} ${directeur.lastName}`,
      responseContent: 'Proposition de réponse de test pour validation par le DG. Cette réponse traite les points soulevés dans la correspondance et propose une solution appropriée.',
      status: 'PENDING_DG_REVIEW',
      createdAt: new Date(),
      dgFeedbacks: []
    };
    
    // 4. Mettre à jour la correspondance
    await db.collection('correspondances').updateOne(
      { _id: correspondance._id },
      {
        $push: { responseDrafts: draft },
        $set: { 
          workflowStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Draft ajouté à la correspondance');
    
    // 5. Mettre à jour le workflow
    await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      {
        $push: { responseDrafts: draft },
        $set: { 
          currentStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Workflow mis à jour');
    
    console.log('\n🎉 Draft de test créé avec succès !');
    console.log('\n📋 Résumé :');
    console.log('   - Correspondance: "azaz"');
    console.log('   - Directeur:', `${directeur.firstName} ${directeur.lastName}`);
    console.log('   - Statut: DIRECTOR_DRAFT');
    console.log('   - Draft: PENDING_DG_REVIEW');
    
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

createTestDraft();

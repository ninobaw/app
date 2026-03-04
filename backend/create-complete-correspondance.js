const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function createCompleteCorrespondance() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const correspondancesCollection = db.collection('correspondances');
    const workflowsCollection = db.collection('correspondenceworkflows');
    
    // Récupérer les utilisateurs
    const directeur = await usersCollection.findOne({ role: 'DIRECTEUR' });
    const dg = await usersCollection.findOne({ role: 'DIRECTEUR_GENERAL' });
    
    console.log('👤 Directeur trouvé:', directeur ? `${directeur.firstName} ${directeur.lastName}` : 'Aucun');
    console.log('👑 DG trouvé:', dg ? `${dg.firstName} ${dg.lastName}` : 'Aucun');
    
    if (!directeur || !dg) {
      console.log('❌ Impossible de créer sans directeur et DG');
      process.exit(1);
    }
    
    const correspondanceId = '68e429b4c08f8b5a157b31e6';
    
    // 1. Créer/Mettre à jour la correspondance
    console.log('\n📝 Création de la correspondance...');
    const correspondance = {
      _id: correspondanceId,
      numeroCorrespondance: 'TEST-CHAT-001',
      dateReception: new Date(),
      expediteur: 'Test Expediteur',
      objet: 'Test Chat Unifié DG-Directeur',
      contenu: 'Correspondance de test pour valider le chat unifié entre DG et Directeur',
      priorite: 'HIGH',
      statut: 'EN_COURS',
      workflowStatus: 'DIRECTOR_DRAFT',
      assignedTo: directeur._id,
      personnesConcernees: [directeur._id],
      createdBy: directeur._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ajouter un draft pour que le DG puisse voir la correspondance
      responseDrafts: [{
        directorId: directeur._id,
        directorName: `${directeur.firstName} ${directeur.lastName}`,
        responseContent: 'Proposition de réponse initiale pour test du chat',
        status: 'PENDING_DG_REVIEW',
        createdAt: new Date(),
        dgFeedbacks: []
      }]
    };
    
    await correspondancesCollection.replaceOne(
      { _id: correspondanceId }, 
      correspondance, 
      { upsert: true }
    );
    console.log('✅ Correspondance créée/mise à jour');
    
    // 2. Mettre à jour le workflow
    console.log('\n🔧 Mise à jour du workflow...');
    const workflowUpdate = {
      correspondanceId: correspondanceId,
      assignedDirector: directeur._id,
      directeurGeneral: dg._id,
      currentStatus: 'DIRECTOR_DRAFT',
      chatMessages: [],
      responseDrafts: [{
        directorId: directeur._id,
        directorName: `${directeur.firstName} ${directeur.lastName}`,
        responseContent: 'Proposition de réponse initiale pour test du chat',
        status: 'PENDING_DG_REVIEW',
        createdAt: new Date(),
        dgFeedbacks: []
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await workflowsCollection.replaceOne(
      { correspondanceId: correspondanceId },
      workflowUpdate,
      { upsert: true }
    );
    console.log('✅ Workflow mis à jour');
    
    console.log('\n🎉 Configuration complète terminée !');
    console.log('\n📋 Résumé :');
    console.log('   - Correspondance ID:', correspondanceId);
    console.log('   - Numéro:', correspondance.numeroCorrespondance);
    console.log('   - Objet:', correspondance.objet);
    console.log('   - Directeur assigné:', `${directeur.firstName} ${directeur.lastName}`);
    console.log('   - DG assigné:', `${dg.firstName} ${dg.lastName}`);
    console.log('   - Statut workflow:', workflowUpdate.currentStatus);
    console.log('   - Statut correspondance:', correspondance.workflowStatus);
    
    console.log('\n✅ Le DG devrait maintenant voir la correspondance dans son dashboard !');
    console.log('✅ Le chat devrait fonctionner pour les deux utilisateurs !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createCompleteCorrespondance();

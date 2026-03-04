const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function createMissingWorkflow() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const workflowsCollection = db.collection('correspondenceworkflows');
    
    // Récupérer les utilisateurs
    const directeur = await usersCollection.findOne({ role: 'DIRECTEUR' });
    const dg = await usersCollection.findOne({ role: 'DIRECTEUR_GENERAL' });
    
    console.log('👤 Directeur trouvé:', directeur ? `${directeur.firstName} ${directeur.lastName}` : 'Aucun');
    console.log('👑 DG trouvé:', dg ? `${dg.firstName} ${dg.lastName}` : 'Aucun');
    
    if (!directeur || !dg) {
      console.log('❌ Impossible de créer le workflow sans directeur et DG');
      process.exit(1);
    }
    
    // Créer le workflow
    const correspondanceId = '68e429b4c08f8b5a157b31e6';
    const newWorkflow = {
      correspondanceId: correspondanceId,
      assignedDirector: directeur._id,
      directeurGeneral: dg._id,
      currentStatus: 'ASSIGNED_TO_DIRECTOR',
      chatMessages: [],
      responseDrafts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\n🔧 Création du workflow...');
    const result = await workflowsCollection.insertOne(newWorkflow);
    console.log('✅ Workflow créé avec l\'ID:', result.insertedId);
    
    console.log('\n📋 Workflow créé:');
    console.log('   - Correspondance ID:', correspondanceId);
    console.log('   - Directeur assigné:', `${directeur.firstName} ${directeur.lastName} (${directeur._id})`);
    console.log('   - DG assigné:', `${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log('   - Statut:', newWorkflow.currentStatus);
    
    console.log('\n🎉 Le chat devrait maintenant fonctionner pour le DG et le directeur !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createMissingWorkflow();

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function simpleDGCheck() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc');
    
    // Accès direct à la collection users
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('\n🔍 Recherche des utilisateurs DG...');
    const dgs = await usersCollection.find({ role: 'DIRECTEUR_GENERAL' }).toArray();
    console.log('👥 Utilisateurs DIRECTEUR_GENERAL trouvés:', dgs.length);
    
    dgs.forEach((dg, index) => {
      console.log(`   ${index + 1}. ${dg.firstName} ${dg.lastName} (${dg.email}) - ${dg.role}`);
      console.log(`      ID: ${dg._id}`);
    });
    
    if (dgs.length === 0) {
      console.log('\n⚠️ Aucun utilisateur avec le rôle DIRECTEUR_GENERAL trouvé');
      console.log('🔍 Recherche d\'autres rôles similaires...');
      const similarRoles = await usersCollection.find({ 
        role: { $regex: /DIRECTEUR|DG|GENERAL/i } 
      }).toArray();
      console.log('👥 Rôles similaires:', similarRoles.length);
      similarRoles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.role}`);
      });
    }
    
    console.log('\n🔍 Vérification du workflow pour la correspondance 68e429b4c08f8b5a157b31e6...');
    const workflowsCollection = db.collection('correspondenceworkflows');
    const workflow = await workflowsCollection.findOne({ correspondanceId: '68e429b4c08f8b5a157b31e6' });
    
    if (workflow) {
      console.log('📋 Workflow trouvé:');
      console.log('   - ID:', workflow._id);
      console.log('   - Directeur assigné ID:', workflow.assignedDirector);
      console.log('   - DG assigné ID:', workflow.directeurGeneral);
      console.log('   - Statut:', workflow.currentStatus);
    } else {
      console.log('❌ Aucun workflow trouvé pour cette correspondance');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

simpleDGCheck();

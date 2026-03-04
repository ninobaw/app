const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Document } = require('./src/models/Document');
const { User } = require('./src/models/User');

dotenv.config();

async function fixDocuments() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les documents
    const documents = await Document.find({});
    console.log(`\nTrouvé ${documents.length} documents à vérifier`);

    // Récupérer le premier utilisateur admin pour assigner comme auteur par défaut
    const adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    console.log('Utilisateur admin trouvé:', adminUser ? adminUser.email : 'Aucun');

    let fixedCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      let needsUpdate = false;
      
      console.log(`\n--- Document ${i + 1} ---`);
      console.log('ID:', doc._id);
      console.log('Titre:', doc.title);
      console.log('Auteur actuel:', doc.author);
      
      // Vérifier et corriger l'auteur manquant
      if (!doc.author && adminUser) {
        doc.author = adminUser._id;
        doc.createdBy = adminUser._id;
        doc.updatedBy = adminUser._id;
        needsUpdate = true;
        console.log('✅ Auteur assigné:', adminUser.email);
      }
      
      // Vérifier les champs obligatoires
      if (!doc.currentVersion) {
        doc.currentVersion = 1;
        needsUpdate = true;
        console.log('✅ Version initialisée à 1');
      }
      
      if (!doc.metadata) {
        doc.metadata = {
          priority: 'MEDIUM',
          revisionNumber: 0
        };
        needsUpdate = true;
        console.log('✅ Métadonnées initialisées');
      }
      
      // Sauvegarder si nécessaire
      if (needsUpdate) {
        await doc.save();
        fixedCount++;
        console.log('✅ Document mis à jour');
      } else {
        console.log('ℹ️ Aucune correction nécessaire');
      }
    }

    console.log(`\n🎉 Correction terminée: ${fixedCount} documents corrigés sur ${documents.length}`);
    
    // Test final
    console.log('\n--- Test final ---');
    const testDocs = await Document.find({})
      .populate('author', 'firstName lastName email')
      .limit(3);
    
    testDocs.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`);
      console.log('- ID:', doc._id);
      console.log('- Titre:', doc.title);
      console.log('- Auteur:', doc.author ? `${doc.author.firstName} ${doc.author.lastName}` : 'Non défini');
      console.log('- Version:', doc.currentVersion);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixDocuments();

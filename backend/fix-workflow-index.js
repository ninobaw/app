const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function fixWorkflowIndex() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('correspondenceworkflows');

    // 1. Lister les index existants
    console.log('\n📋 Index existants:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
      if (index.unique) {
        console.log(`     ⚠️ Index unique`);
      }
    });

    // 2. Supprimer l'index unique sur correspondanceId s'il existe
    console.log('\n🗑️ Suppression des index problématiques...');
    try {
      await collection.dropIndex({ correspondanceId: 1 });
      console.log('✅ Index correspondanceId supprimé');
    } catch (error) {
      console.log('ℹ️ Index correspondanceId n\'existe pas ou déjà supprimé');
    }

    // 3. Recréer un index non-unique sur correspondanceId
    console.log('\n🔧 Création d\'un nouvel index non-unique...');
    await collection.createIndex({ correspondanceId: 1 }, { unique: false });
    console.log('✅ Nouvel index correspondanceId créé (non-unique)');

    // 4. Vérifier les index après modification
    console.log('\n📋 Index après modification:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
      if (index.unique) {
        console.log(`     ⚠️ Index unique`);
      }
    });

    // 5. Nettoyer les doublons potentiels
    console.log('\n🧹 Nettoyage des doublons...');
    const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
    
    const duplicates = await CorrespondenceWorkflow.aggregate([
      {
        $group: {
          _id: "$correspondanceId",
          count: { $sum: 1 },
          docs: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`📊 Doublons trouvés: ${duplicates.length}`);
    
    for (const duplicate of duplicates) {
      console.log(`🔍 Correspondance ${duplicate._id} a ${duplicate.count} workflows`);
      // Garder le premier, supprimer les autres
      const toDelete = duplicate.docs.slice(1);
      for (const docId of toDelete) {
        await CorrespondenceWorkflow.findByIdAndDelete(docId);
        console.log(`   ❌ Workflow supprimé: ${docId}`);
      }
    }

    console.log('\n✅ Correction des index terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

fixWorkflowIndex();

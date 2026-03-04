const mongoose = require('mongoose');
require('dotenv').config();

async function fixQRCodeIndex() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('correspondances');

    // Lister tous les index existants
    console.log('\n📋 Index existants sur la collection correspondances:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    // Chercher et supprimer l'index unique sur qrCode
    const qrCodeIndexes = indexes.filter(index => 
      index.key && index.key.qrCode !== undefined
    );

    if (qrCodeIndexes.length > 0) {
      console.log('\n🔍 Index qrCode trouvés:', qrCodeIndexes.length);
      
      for (const index of qrCodeIndexes) {
        console.log(`\n🗑️ Suppression de l'index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Index ${index.name} supprimé avec succès`);
        } catch (error) {
          console.log(`❌ Erreur lors de la suppression de ${index.name}:`, error.message);
        }
      }
    } else {
      console.log('\n✅ Aucun index qrCode trouvé');
    }

    // Vérifier les correspondances avec qrCode null
    const nullQRCodeCount = await collection.countDocuments({ qrCode: null });
    console.log(`\n📊 Correspondances avec qrCode null: ${nullQRCodeCount}`);

    // Supprimer les qrCode null pour éviter les conflits
    if (nullQRCodeCount > 0) {
      console.log('🧹 Nettoyage des qrCode null...');
      const result = await collection.updateMany(
        { qrCode: null },
        { $unset: { qrCode: 1 } }
      );
      console.log(`✅ ${result.modifiedCount} documents nettoyés`);
    }

    console.log('\n✅ Correction terminée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

fixQRCodeIndex();

const { MongoClient } = require('mongodb');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function purgeCorrespondances() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connexion à MongoDB réussie');
    
    const db = client.db();
    const collection = db.collection('correspondances');
    
    // Compter les correspondances avant suppression
    const countBefore = await collection.countDocuments();
    console.log(`Nombre de correspondances avant purge: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('Aucune correspondance à supprimer');
      return;
    }
    
    // Supprimer toutes les correspondances
    const result = await collection.deleteMany({});
    console.log(`${result.deletedCount} correspondances supprimées avec succès`);
    
    // Vérifier que la collection est vide
    const countAfter = await collection.countDocuments();
    console.log(`Nombre de correspondances après purge: ${countAfter}`);
    
    if (countAfter === 0) {
      console.log('✅ Purge terminée avec succès - Collection vide');
    } else {
      console.log('⚠️ Attention: Des correspondances subsistent après la purge');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la purge des correspondances:', error);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

// Exécuter le script
purgeCorrespondances();

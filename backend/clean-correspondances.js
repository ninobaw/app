const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');

async function cleanCorrespondances() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connexion à MongoDB réussie');
    
    // Compter les correspondances existantes
    const count = await Correspondance.countDocuments();
    console.log(`Nombre de correspondances existantes: ${count}`);
    
    if (count > 0) {
      // Supprimer toutes les correspondances
      const result = await Correspondance.deleteMany({});
      console.log(`✅ ${result.deletedCount} correspondances supprimées`);
    } else {
      console.log('Aucune correspondance à supprimer');
    }
    
    // Vérifier que la collection est vide
    const finalCount = await Correspondance.countDocuments();
    console.log(`Nombre final de correspondances: ${finalCount}`);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
  }
}

cleanCorrespondances();

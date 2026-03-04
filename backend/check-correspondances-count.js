const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');

async function checkCorrespondancesCount() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('=== VÉRIFICATION DES CORRESPONDANCES EN BASE ===');
    
    // Compter toutes les correspondances
    const totalCount = await Correspondance.countDocuments();
    console.log(`Total correspondances en base: ${totalCount}`);
    
    // Compter par statut
    const statusCounts = await Correspondance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log('\n=== RÉPARTITION PAR STATUT ===');
    statusCounts.forEach(item => {
      console.log(`${item._id}: ${item.count}`);
    });
    
    // Vérifier les correspondances avec parentCorrespondanceId
    const repliesCount = await Correspondance.countDocuments({ 
      parentCorrespondanceId: { $exists: true, $ne: null } 
    });
    console.log(`\nCorrespondances de réponse: ${repliesCount}`);
    
    // Correspondances principales (sans parent)
    const mainCount = await Correspondance.countDocuments({ 
      $or: [
        { parentCorrespondanceId: { $exists: false } },
        { parentCorrespondanceId: null }
      ]
    });
    console.log(`Correspondances principales: ${mainCount}`);
    
    // Afficher les 10 premières pour debug
    console.log('\n=== ÉCHANTILLON DES CORRESPONDANCES ===');
    const sample = await Correspondance.find()
      .select('title status parentCorrespondanceId createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    sample.forEach((corr, index) => {
      const isReply = corr.parentCorrespondanceId ? ' (RÉPONSE)' : '';
      console.log(`${index + 1}. ${corr.title} - ${corr.status}${isReply}`);
    });
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Erreur:', error);
    mongoose.connection.close();
  }
}

checkCorrespondancesCount();

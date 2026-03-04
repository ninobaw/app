const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function backupTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer toutes les correspondances avec leurs tags actuels
    const correspondances = await Correspondance.find({}, {
      _id: 1,
      subject: 1,
      tags: 1,
      from_address: 1,
      to_address: 1,
      createdAt: 1
    });

    console.log(`📊 Correspondances trouvées: ${correspondances.length}`);

    // Créer le dossier de sauvegarde s'il n'existe pas
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Créer le fichier de sauvegarde avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `tags-backup-${timestamp}.json`);

    // Préparer les données de sauvegarde
    const backupData = {
      timestamp: new Date().toISOString(),
      totalCorrespondances: correspondances.length,
      correspondances: correspondances.map(corr => ({
        id: corr._id.toString(),
        subject: corr.subject || 'Sans sujet',
        from_address: corr.from_address || '',
        to_address: corr.to_address || '',
        tags: corr.tags || [],
        createdAt: corr.createdAt
      }))
    };

    // Sauvegarder dans le fichier JSON
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`💾 Sauvegarde créée: ${backupFile}`);
    console.log(`📈 Statistiques de sauvegarde:`);
    console.log(`   • Correspondances sauvegardées: ${backupData.totalCorrespondances}`);
    
    // Statistiques des tags
    const tagStats = {};
    let totalTags = 0;
    let correspondancesWithTags = 0;

    backupData.correspondances.forEach(corr => {
      if (corr.tags && corr.tags.length > 0) {
        correspondancesWithTags++;
        totalTags += corr.tags.length;
        corr.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1;
        });
      }
    });

    console.log(`   • Correspondances avec tags: ${correspondancesWithTags}`);
    console.log(`   • Total tags: ${totalTags}`);
    console.log(`   • Tags uniques: ${Object.keys(tagStats).length}`);
    
    if (Object.keys(tagStats).length > 0) {
      console.log(`   • Tags les plus fréquents:`);
      const sortedTags = Object.entries(tagStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      sortedTags.forEach(([tag, count]) => {
        console.log(`     - ${tag}: ${count} fois`);
      });
    }

    console.log('\n🎉 Sauvegarde terminée avec succès !');
    console.log('💡 Vous pouvez maintenant exécuter auto-assign-tags.bat en toute sécurité');

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la sauvegarde
console.log('💾 SAUVEGARDE DES TAGS ACTUELS\n');
backupTags();

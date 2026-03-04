const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function restoreTags(backupFileName) {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Chemin vers le fichier de sauvegarde
    const backupDir = path.join(__dirname, '..', '..', 'backups');
    const backupFile = path.join(backupDir, backupFileName);

    // Vérifier que le fichier existe
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Fichier de sauvegarde non trouvé: ${backupFile}`);
      
      // Lister les fichiers de sauvegarde disponibles
      if (fs.existsSync(backupDir)) {
        const backupFiles = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('tags-backup-') && file.endsWith('.json'));
        
        if (backupFiles.length > 0) {
          console.log('\n📁 Fichiers de sauvegarde disponibles:');
          backupFiles.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
          });
          console.log('\n💡 Utilisez: node src/scripts/restore-tags.js [nom-du-fichier]');
        } else {
          console.log('⚠️  Aucun fichier de sauvegarde trouvé dans le dossier backups/');
        }
      }
      process.exit(1);
    }

    // Lire le fichier de sauvegarde
    console.log(`📖 Lecture du fichier: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`📊 Données de sauvegarde:`);
    console.log(`   • Date de sauvegarde: ${backupData.timestamp}`);
    console.log(`   • Correspondances sauvegardées: ${backupData.totalCorrespondances}`);

    let restoredCount = 0;
    let errorCount = 0;

    // Restaurer les tags pour chaque correspondance
    for (const corrData of backupData.correspondances) {
      try {
        const result = await Correspondance.updateOne(
          { _id: corrData.id },
          { $set: { tags: corrData.tags } }
        );

        if (result.matchedCount > 0) {
          restoredCount++;
          if (corrData.tags && corrData.tags.length > 0) {
            console.log(`✅ Restauré: "${corrData.subject}" → [${corrData.tags.join(', ')}]`);
          }
        } else {
          console.log(`⚠️  Correspondance non trouvée: ${corrData.id}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la restauration de ${corrData.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Résumé de la restauration:');
    console.log(`   • Correspondances restaurées: ${restoredCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log(`   • Total traité: ${restoredCount + errorCount}`);

    if (restoredCount > 0) {
      console.log('\n🎉 Restauration terminée avec succès !');
      console.log('💡 Les tags ont été restaurés à leur état précédent');
    } else {
      console.log('\n⚠️  Aucune correspondance restaurée.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Récupérer le nom du fichier depuis les arguments
const backupFileName = process.argv[2];

if (!backupFileName) {
  console.log('❌ Nom du fichier de sauvegarde requis');
  console.log('💡 Usage: node src/scripts/restore-tags.js [nom-du-fichier]');
  console.log('💡 Exemple: node src/scripts/restore-tags.js tags-backup-2024-01-15T10-30-00-000Z.json');
  
  // Lister les fichiers disponibles
  const backupDir = path.join(__dirname, '..', '..', 'backups');
  if (fs.existsSync(backupDir)) {
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('tags-backup-') && file.endsWith('.json'));
    
    if (backupFiles.length > 0) {
      console.log('\n📁 Fichiers de sauvegarde disponibles:');
      backupFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
    }
  }
  process.exit(1);
}

console.log('🔄 RESTAURATION DES TAGS\n');
restoreTags(backupFileName);

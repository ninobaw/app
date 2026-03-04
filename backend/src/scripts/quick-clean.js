const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Modèles
const Correspondance = require('../models/Correspondance');
const Response = require('../models/Response');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Script de nettoyage rapide pour les tests
 * Supprime uniquement les correspondances et leurs fichiers
 */
async function quickClean() {
  console.log('🧹 NETTOYAGE RAPIDE EN COURS...');
  console.log('='.repeat(40));
  
  let stats = {
    correspondances: 0,
    responses: 0,
    files: 0
  };

  try {
    // Connexion MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB');

    // Supprimer les correspondances
    const corrResult = await Correspondance.deleteMany({});
    stats.correspondances = corrResult.deletedCount;
    console.log(`📧 ${stats.correspondances} correspondances supprimées`);

    // Supprimer les réponses
    const respResult = await Response.deleteMany({});
    stats.responses = respResult.deletedCount;
    console.log(`📤 ${stats.responses} réponses supprimées`);

    // Supprimer uniquement les fichiers de correspondances (pas la structure)
    const corrDir = path.join(UPLOADS_DIR, 'correspondances');
    if (fs.existsSync(corrDir)) {
      stats.files = await cleanFilesOnly(corrDir);
      console.log(`📄 ${stats.files} fichiers supprimés`);
    }

    console.log('='.repeat(40));
    console.log('✅ NETTOYAGE RAPIDE TERMINÉ');
    console.log(`Total: ${stats.correspondances + stats.responses + stats.files} éléments supprimés`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Supprime uniquement les fichiers, pas les dossiers
 */
async function cleanFilesOnly(dirPath) {
  let fileCount = 0;
  
  if (!fs.existsSync(dirPath)) {
    return fileCount;
  }

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Récursion dans les sous-dossiers
      fileCount += await cleanFilesOnly(itemPath);
    } else if (item !== '.gitkeep') {
      // Supprimer le fichier (sauf .gitkeep)
      fs.unlinkSync(itemPath);
      fileCount++;
    }
  }
  
  return fileCount;
}

// Exécution
if (require.main === module) {
  quickClean();
}

module.exports = quickClean;

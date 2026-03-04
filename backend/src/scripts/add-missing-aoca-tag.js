const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

async function addMissingAOCATag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion à MongoDB établie');

    // Vérifier si AOCA existe
    const existingAOCA = await Tag.findOne({ name: 'AOCA' });
    if (existingAOCA) {
      console.log('✅ Tag AOCA existe déjà');
      return;
    }

    // Créer le tag AOCA
    const aocaTag = new Tag({
      name: 'AOCA',
      color: '#3B82F6',
      description: 'Correspondances de l\'Office de l\'Aviation Civile et Aéroports (OACA)',
      createdBy: 'custom-user-' + Date.now(),
      isActive: true
    });

    await aocaTag.save();
    console.log('✅ Tag AOCA créé avec succès');

    // Vérifier tous les tags personnalisés
    const customTagNames = ['Police', 'AOCA', 'Douane', 'Concessionaire1', 'Syndicat', 'Commuté consultatif'];
    const allTags = await Tag.find({});
    
    console.log('\n🏷️  Vérification des tags personnalisés:');
    customTagNames.forEach(tagName => {
      const found = allTags.find(tag => tag.name === tagName);
      if (found) {
        console.log(`   ✅ ${tagName} - ${found.description || 'Pas de description'}`);
      } else {
        console.log(`   ❌ ${tagName} - MANQUANT`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

console.log('🏷️  AJOUT DU TAG AOCA MANQUANT\n');
addMissingAOCATag();

const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

async function findRealCustomTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer TOUS les tags (pas seulement les actifs)
    console.log('\n🔍 RECHERCHE DIRECTE DANS LA COLLECTION TAGS');
    console.log('=' .repeat(60));
    
    // Méthode 1: Tous les tags
    const allTagsMethod1 = await Tag.find({});
    console.log(`📊 Méthode 1 - Tag.find({}): ${allTagsMethod1.length} tags`);
    
    // Méthode 2: Tags actifs seulement
    const allTagsMethod2 = await Tag.find({ isActive: true });
    console.log(`📊 Méthode 2 - Tag.find({isActive: true}): ${allTagsMethod2.length} tags`);
    
    // Méthode 3: getActiveTags()
    const allTagsMethod3 = await Tag.getActiveTags();
    console.log(`📊 Méthode 3 - Tag.getActiveTags(): ${allTagsMethod3.length} tags`);

    // Afficher TOUS les tags trouvés avec la méthode 1
    console.log('\n🏷️  TOUS LES TAGS DANS LA BASE (méthode 1):');
    console.log('=' .repeat(60));
    
    allTagsMethod1.forEach((tag, index) => {
      const status = tag.isActive ? '✅ ACTIF' : '❌ INACTIF';
      const isSystem = tag.createdBy && tag.createdBy.toString().startsWith('system-init-');
      const type = isSystem ? '[SYSTÈME]' : '[PERSONNALISÉ]';
      
      console.log(`\n${index + 1}. ${status} ${type}`);
      console.log(`   ID: ${tag._id}`);
      console.log(`   Nom: "${tag.name}"`);
      console.log(`   Couleur: ${tag.color}`);
      console.log(`   Description: "${tag.description || 'Pas de description'}"`);
      console.log(`   Créé par: ${tag.createdBy}`);
      console.log(`   isActive: ${tag.isActive}`);
      console.log(`   Créé le: ${tag.createdAt}`);
    });

    // Chercher spécifiquement vos tags personnalisés
    console.log('\n🎯 RECHERCHE SPÉCIFIQUE DE VOS TAGS PERSONNALISÉS:');
    console.log('=' .repeat(60));
    
    const customTagNames = ['Police', 'AOCA', 'Douane', 'Concessionaire1', 'Syndicat', 'Commuté consultatif'];
    
    for (const tagName of customTagNames) {
      const foundTags = await Tag.find({ 
        name: { $regex: new RegExp(tagName, 'i') } 
      });
      
      console.log(`\n🔍 Recherche "${tagName}": ${foundTags.length} résultat(s)`);
      foundTags.forEach(tag => {
        console.log(`   ✅ Trouvé: "${tag.name}" (${tag.color}) - isActive: ${tag.isActive} - createdBy: ${tag.createdBy}`);
      });
    }

    // Chercher les tags NON créés par le système
    console.log('\n🎯 TAGS NON-SYSTÈME (createdBy ne commence pas par "system-init-"):');
    console.log('=' .repeat(60));
    
    const nonSystemTags = await Tag.find({
      createdBy: { $not: /^system-init-/ }
    });
    
    console.log(`📊 Tags non-système trouvés: ${nonSystemTags.length}`);
    nonSystemTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" - createdBy: ${tag.createdBy} - isActive: ${tag.isActive}`);
    });

    // Chercher les tags avec createdBy différent
    console.log('\n🎯 TOUS LES CRÉATEURS DIFFÉRENTS:');
    console.log('=' .repeat(60));
    
    const creators = await Tag.distinct('createdBy');
    console.log(`📊 Créateurs uniques: ${creators.length}`);
    creators.forEach((creator, index) => {
      console.log(`   ${index + 1}. "${creator}"`);
    });

    // Pour chaque créateur, compter les tags
    for (const creator of creators) {
      const tagsCount = await Tag.countDocuments({ createdBy: creator });
      const activeTagsCount = await Tag.countDocuments({ createdBy: creator, isActive: true });
      console.log(`   "${creator}": ${tagsCount} tags (${activeTagsCount} actifs)`);
    }

    console.log('\n🎯 RECOMMANDATION:');
    if (nonSystemTags.length > 0) {
      console.log('✅ Tags personnalisés trouvés ! Le problème est dans le filtrage.');
    } else {
      console.log('❌ Aucun tag personnalisé trouvé. Ils ont peut-être été supprimés ou mal créés.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la recherche
console.log('🔍 RECHERCHE APPROFONDIE DES TAGS PERSONNALISÉS\n');
findRealCustomTags();

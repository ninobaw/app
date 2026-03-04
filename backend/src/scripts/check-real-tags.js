const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

async function checkRealTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer TOUS les tags de la base (actifs et inactifs)
    const allTags = await Tag.find({});
    console.log(`📊 Total tags dans la base: ${allTags.length}`);

    if (allTags.length === 0) {
      console.log('⚠️  AUCUN tag trouvé dans la collection Tags');
      console.log('💡 La collection Tags est vide !');
      
      // Vérifier les collections disponibles
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('\n📋 Collections disponibles dans la base:');
      collections.forEach((collection, index) => {
        console.log(`   ${index + 1}. ${collection.name}`);
      });
      
    } else {
      console.log('\n🏷️  TOUS LES TAGS DANS LA BASE:');
      console.log('=' .repeat(60));
      
      allTags.forEach((tag, index) => {
        const status = tag.isActive ? '✅ ACTIF' : '❌ INACTIF';
        console.log(`\n${index + 1}. ${status}`);
        console.log(`   ID: ${tag._id}`);
        console.log(`   Nom: "${tag.name}"`);
        console.log(`   Couleur: ${tag.color}`);
        console.log(`   Description: "${tag.description || 'Pas de description'}"`);
        console.log(`   Créé par: ${tag.createdBy}`);
        console.log(`   Créé le: ${tag.createdAt}`);
        console.log(`   Modifié le: ${tag.updatedAt}`);
      });
      
      // Statistiques
      const activeTags = allTags.filter(tag => tag.isActive);
      const inactiveTags = allTags.filter(tag => !tag.isActive);
      
      console.log('\n📈 STATISTIQUES:');
      console.log(`   • Tags actifs: ${activeTags.length}`);
      console.log(`   • Tags inactifs: ${inactiveTags.length}`);
      console.log(`   • Total: ${allTags.length}`);
      
      if (activeTags.length > 0) {
        console.log('\n✅ TAGS ACTIFS (utilisables par le système):');
        activeTags.forEach((tag, index) => {
          console.log(`   ${index + 1}. "${tag.name}" (${tag.color}) - ${tag.description || 'Pas de description'}`);
        });
      }
      
      if (inactiveTags.length > 0) {
        console.log('\n❌ TAGS INACTIFS (ignorés par le système):');
        inactiveTags.forEach((tag, index) => {
          console.log(`   ${index + 1}. "${tag.name}" (${tag.color}) - ${tag.description || 'Pas de description'}`);
        });
      }
    }

    // Test de la méthode getActiveTags()
    console.log('\n🔍 TEST DE LA MÉTHODE getActiveTags():');
    const activeTagsMethod = await Tag.getActiveTags();
    console.log(`   Résultat: ${activeTagsMethod.length} tags actifs trouvés`);
    
    if (activeTagsMethod.length > 0) {
      console.log('   Tags retournés par getActiveTags():');
      activeTagsMethod.forEach((tag, index) => {
        console.log(`     ${index + 1}. "${tag.name}"`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    
    if (error.name === 'MongooseError') {
      console.log('💡 Problème de connexion MongoDB. Vérifiez:');
      console.log('   - Le serveur MongoDB est-il démarré ?');
      console.log('   - La chaîne de connexion dans .env est-elle correcte ?');
      console.log('   - La base de données existe-t-elle ?');
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
console.log('🔍 VÉRIFICATION DES TAGS RÉELS DANS MONGODB\n');
checkRealTags();

const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function testTagOperations() {
  try {
    console.log('🚀 Test des opérations sur les tags');
    console.log('=====================================');

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // 1. Récupérer un utilisateur SUPER_ADMIN pour les tests
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdmin) {
      console.log('❌ Aucun SUPER_ADMIN trouvé dans la base de données');
      return;
    }
    console.log(`✅ SUPER_ADMIN trouvé: ${superAdmin.email}`);

    // 2. Créer un tag de test
    console.log('\n📝 Test de création de tag...');
    const testTag = new Tag({
      name: 'test-modification',
      color: '#FF0000',
      description: 'Tag de test pour modification',
      createdBy: superAdmin._id
    });

    await testTag.save();
    console.log(`✅ Tag créé avec ID: ${testTag._id}`);

    // 3. Test de récupération de tous les tags
    console.log('\n📋 Test de récupération des tags...');
    const allTags = await Tag.find({}).populate('createdBy', 'firstName lastName email');
    console.log(`✅ ${allTags.length} tags trouvés dans la base`);
    
    allTags.forEach(tag => {
      console.log(`  - ${tag.name} (${tag.color}) - Actif: ${tag.isActive} - Créé par: ${tag.createdBy?.email || 'N/A'}`);
    });

    // 4. Test de modification du tag
    console.log('\n✏️ Test de modification du tag...');
    testTag.name = 'test-modification-updated';
    testTag.color = '#00FF00';
    testTag.description = 'Tag modifié avec succès';
    testTag.isActive = false;

    await testTag.save();
    console.log('✅ Tag modifié avec succès');

    // Vérifier la modification
    const updatedTag = await Tag.findById(testTag._id).populate('createdBy', 'firstName lastName email');
    console.log(`✅ Vérification: ${updatedTag.name} - ${updatedTag.color} - Actif: ${updatedTag.isActive}`);

    // 5. Test de suppression (désactivation)
    console.log('\n🗑️ Test de suppression (désactivation)...');
    updatedTag.isActive = false;
    await updatedTag.save();
    console.log('✅ Tag désactivé avec succès');

    // 6. Test des méthodes statiques
    console.log('\n🔍 Test des méthodes statiques...');
    const activeTags = await Tag.getActiveTags();
    console.log(`✅ ${activeTags.length} tags actifs trouvés`);

    // 7. Nettoyage - Supprimer le tag de test
    console.log('\n🧹 Nettoyage...');
    await Tag.findByIdAndDelete(testTag._id);
    console.log('✅ Tag de test supprimé');

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Connexion MongoDB fermée');
  }
}

// Exécuter les tests
testTagOperations();

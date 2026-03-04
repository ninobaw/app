const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
const User = require('../models/User');
require('dotenv').config();

async function checkDatabaseStatus() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    console.log('\n📊 ÉTAT DE LA BASE DE DONNÉES');
    console.log('=' .repeat(50));

    // Vérifier les correspondances
    const correspondances = await Correspondance.find({});
    console.log(`📧 Correspondances: ${correspondances.length}`);
    
    if (correspondances.length > 0) {
      console.log('\n📝 Échantillon de correspondances:');
      correspondances.slice(0, 3).forEach((corr, index) => {
        console.log(`   ${index + 1}. "${corr.subject || 'Sans sujet'}"`);
        console.log(`      De: ${corr.from_address || 'Non spécifié'}`);
        console.log(`      À: ${corr.to_address || 'Non spécifié'}`);
        console.log(`      Tags: [${(corr.tags || []).join(', ') || 'Aucun'}]`);
        console.log(`      Créé le: ${corr.createdAt || 'Date inconnue'}`);
      });
    } else {
      console.log('❌ Aucune correspondance trouvée dans la base');
    }

    // Vérifier les tags
    const tags = await Tag.find({});
    console.log(`\n🏷️  Tags: ${tags.length}`);
    
    if (tags.length > 0) {
      console.log('\n📋 Liste des tags:');
      tags.forEach((tag, index) => {
        const isCustom = !tag.createdBy?.toString().startsWith('system-init-');
        const type = isCustom ? '[PERSONNALISÉ]' : '[SYSTÈME]';
        console.log(`   ${index + 1}. ${type} "${tag.name}" (${tag.color})`);
        console.log(`      Description: ${tag.description || 'Pas de description'}`);
        console.log(`      Actif: ${tag.isActive}`);
      });
    }

    // Vérifier les utilisateurs
    const users = await User.find({});
    console.log(`\n👥 Utilisateurs: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👤 Liste des utilisateurs:');
      users.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username || user.email || 'Utilisateur sans nom'}`);
        console.log(`      Email: ${user.email || 'Pas d\'email'}`);
        console.log(`      Rôle: ${user.role || 'Pas de rôle'}`);
      });
    }

    // Vérifier les collections disponibles
    console.log('\n🗄️  Collections dans la base:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (correspondances.length === 0) {
      console.log('❌ Pas de correspondances à traiter');
      console.log('   • Importez des correspondances depuis votre interface web');
      console.log('   • Ou créez des correspondances de test');
      console.log('   • Vérifiez que les correspondances sont bien sauvegardées');
    } else {
      console.log('✅ Correspondances disponibles pour l\'assignation');
    }

    if (tags.length === 6) {
      console.log('✅ Vos 6 tags personnalisés sont bien créés');
    } else {
      console.log(`⚠️  Nombre de tags inattendu: ${tags.length}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
console.log('🔍 VÉRIFICATION DE L\'ÉTAT DE LA BASE DE DONNÉES\n');
checkDatabaseStatus();

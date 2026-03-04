const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

// Vos tags personnalisés d'origine
const customTags = [
  {
    name: 'Police',
    color: '#EF4444',
    description: 'Correspondances de la police et sécurité'
  },
  {
    name: 'AOCA',
    color: '#3B82F6',
    description: 'Correspondances de l\'aviation civile OACA'
  },
  {
    name: 'Douane',
    color: '#059669',
    description: 'Correspondances douanières et contrôles frontaliers'
  },
  {
    name: 'Concessionaire1',
    color: '#22C55E',
    description: 'Correspondances des concessionnaires et commerces'
  },
  {
    name: 'Syndicat',
    color: '#6366F1',
    description: 'Correspondances syndicales et personnel'
  },
  {
    name: 'Commuté consultatif',
    color: '#F97316',
    description: 'Correspondances du comité consultatif'
  }
];

async function recreateCustomTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    console.log('\n🏷️  RECRÉATION DE VOS TAGS PERSONNALISÉS');
    console.log('=' .repeat(60));

    // ID générique pour le créateur (différent du système)
    const customCreatorId = 'custom-user-' + Date.now();

    let createdCount = 0;
    let skippedCount = 0;

    for (const tagData of customTags) {
      try {
        // Vérifier si le tag existe déjà
        const existingTag = await Tag.findOne({ name: tagData.name });
        if (existingTag) {
          console.log(`⚠️  Tag "${tagData.name}" existe déjà, ignoré`);
          skippedCount++;
          continue;
        }

        // Créer le nouveau tag personnalisé
        const newTag = new Tag({
          ...tagData,
          createdBy: customCreatorId,
          isActive: true
        });

        await newTag.save();
        console.log(`✅ Tag créé: "${tagData.name}" (${tagData.color})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de la création du tag "${tagData.name}":`, error.message);
      }
    }

    console.log('\n📈 Résumé de la recréation:');
    console.log(`   • Tags créés: ${createdCount}`);
    console.log(`   • Tags ignorés: ${skippedCount}`);
    console.log(`   • Total traités: ${createdCount + skippedCount}`);

    if (createdCount > 0) {
      console.log('\n🎉 Recréation des tags personnalisés terminée avec succès !');
      console.log('💡 Vos tags personnalisés sont maintenant disponibles');
      
      // Afficher les tags créés
      console.log('\n🏷️  Tags personnalisés créés:');
      const createdTags = await Tag.find({ createdBy: customCreatorId });
      createdTags.forEach((tag, index) => {
        console.log(`   ${index + 1}. ${tag.name} (${tag.color}) - ${tag.description}`);
      });

      // Vérifier le total maintenant
      const totalTags = await Tag.countDocuments({ isActive: true });
      console.log(`\n📊 Total tags actifs maintenant: ${totalTags}`);
      
    } else {
      console.log('\n⚠️  Aucun nouveau tag créé.');
      console.log('💡 Tous les tags existent déjà ou il y a eu des erreurs');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la recréation des tags:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter la recréation
console.log('🔧 RECRÉATION DES TAGS PERSONNALISÉS\n');
recreateCustomTags();

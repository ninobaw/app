const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

const defaultTags = [
  {
    name: 'urgent',
    color: '#EF4444',
    description: 'Correspondances nécessitant une attention immédiate'
  },
  {
    name: 'important',
    color: '#F97316',
    description: 'Correspondances importantes à traiter en priorité'
  },
  {
    name: 'confidentiel',
    color: '#DC2626',
    description: 'Correspondances confidentielles'
  },
  {
    name: 'suivi',
    color: '#3B82F6',
    description: 'Correspondances nécessitant un suivi'
  },
  {
    name: 'réunion',
    color: '#6366F1',
    description: 'Correspondances liées aux réunions'
  },
  {
    name: 'formation',
    color: '#22C55E',
    description: 'Correspondances relatives à la formation'
  },
  {
    name: 'technique',
    color: '#059669',
    description: 'Correspondances techniques'
  },
  {
    name: 'administratif',
    color: '#6B7280',
    description: 'Correspondances administratives'
  },
  {
    name: 'financier',
    color: '#EAB308',
    description: 'Correspondances financières'
  },
  {
    name: 'rh',
    color: '#A855F7',
    description: 'Correspondances ressources humaines'
  }
];

async function initTagsSimple() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Vérifier si des tags existent déjà
    const existingTagsCount = await Tag.countDocuments();
    console.log(`📊 Tags existants: ${existingTagsCount}`);

    if (existingTagsCount > 0) {
      console.log('ℹ️  Des tags existent déjà.');
      
      // Afficher les tags existants
      const existingTags = await Tag.find({}, 'name description isActive');
      console.log('\n🏷️  Tags actuels dans la base:');
      existingTags.forEach((tag, index) => {
        const status = tag.isActive ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${tag.name} - ${tag.description || 'Pas de description'}`);
      });
      
      console.log('\n💡 Si vous voulez réinitialiser, supprimez d\'abord les tags existants.');
      process.exit(0);
    }

    // Créer un ID générique pour le créateur (sera remplacé plus tard si nécessaire)
    const genericCreatorId = 'system-init-' + Date.now();

    // Créer les tags par défaut
    let createdCount = 0;
    let skippedCount = 0;

    console.log('\n🏷️  Création des tags par défaut...');

    for (const tagData of defaultTags) {
      try {
        // Vérifier si le tag existe déjà (par nom)
        const existingTag = await Tag.findOne({ name: tagData.name });
        if (existingTag) {
          console.log(`⚠️  Tag "${tagData.name}" existe déjà, ignoré`);
          skippedCount++;
          continue;
        }

        // Créer le nouveau tag
        const newTag = new Tag({
          ...tagData,
          createdBy: genericCreatorId,
          isActive: true
        });

        await newTag.save();
        console.log(`✅ Tag créé: "${tagData.name}" (${tagData.color})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de la création du tag "${tagData.name}":`, error.message);
      }
    }

    console.log('\n📈 Résumé de l\'initialisation:');
    console.log(`   • Tags créés: ${createdCount}`);
    console.log(`   • Tags ignorés: ${skippedCount}`);
    console.log(`   • Total traités: ${createdCount + skippedCount}`);

    if (createdCount > 0) {
      console.log('\n🎉 Initialisation des tags par défaut terminée avec succès !');
      console.log('💡 Les tags sont maintenant disponibles pour l\'assignation intelligente');
      
      // Afficher les tags créés
      console.log('\n🏷️  Tags créés:');
      const createdTags = await Tag.find({ createdBy: genericCreatorId }, 'name description color');
      createdTags.forEach((tag, index) => {
        console.log(`   ${index + 1}. ${tag.name} (${tag.color}) - ${tag.description}`);
      });
    } else {
      console.log('\n⚠️  Aucun nouveau tag créé.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des tags:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
console.log('🚀 Initialisation simple des tags par défaut...\n');
initTagsSimple();

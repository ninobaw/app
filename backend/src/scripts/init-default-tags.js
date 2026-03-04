const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const User = require('../models/User');
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

async function initDefaultTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Vérifier si des tags existent déjà
    const existingTagsCount = await Tag.countDocuments();
    console.log(`📊 Tags existants: ${existingTagsCount}`);

    if (existingTagsCount > 0) {
      console.log('ℹ️  Des tags existent déjà. Initialisation annulée.');
      process.exit(0);
    }

    // Trouver un SUPER_ADMIN pour attribuer la création des tags
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdmin) {
      console.log('❌ Aucun SUPER_ADMIN trouvé. Veuillez créer un SUPER_ADMIN d\'abord.');
      process.exit(1);
    }

    console.log(`👤 Tags seront créés par: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.email})`);

    // Créer les tags par défaut
    let createdCount = 0;
    let skippedCount = 0;

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
          createdBy: superAdmin._id,
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
      console.log('💡 Les tags sont maintenant disponibles dans Paramètres > Tags');
    } else {
      console.log('\n⚠️  Aucun nouveau tag créé.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des tags:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
console.log('🚀 Initialisation des tags par défaut...\n');
initDefaultTags();

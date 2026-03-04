const mongoose = require('mongoose');
const Tag = require('../models/Tag');
const Correspondance = require('../models/Correspondance');
require('dotenv').config();

// Vos 6 tags spécifiques qui remplaceront les tags prédéfinis
const yourCustomTags = [
  {
    name: 'Police',
    color: '#EF4444',
    description: 'Correspondances de la police, sécurité, gendarmerie et forces de l\'ordre'
  },
  {
    name: 'AOCA',
    color: '#3B82F6',
    description: 'Correspondances de l\'Office de l\'Aviation Civile et Aéroports (OACA)'
  },
  {
    name: 'Douane',
    color: '#059669',
    description: 'Correspondances douanières, contrôles frontaliers et importation/exportation'
  },
  {
    name: 'Concessionaire1',
    color: '#22C55E',
    description: 'Correspondances des concessionnaires, commerces et boutiques de l\'aéroport'
  },
  {
    name: 'Syndicat',
    color: '#6366F1',
    description: 'Correspondances syndicales, personnel, employés et revendications'
  },
  {
    name: 'Commuté consultatif',
    color: '#F97316',
    description: 'Correspondances du comité consultatif, réunions et assemblées'
  }
];

async function replaceWithCustomTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    console.log('\n🔄 REMPLACEMENT PAR VOS TAGS SPÉCIFIQUES');
    console.log('=' .repeat(60));

    // ÉTAPE 1: Sauvegarder les correspondances actuelles
    console.log('\n📊 ÉTAPE 1: Analyse des données actuelles');
    const correspondances = await Correspondance.find({});
    const currentTags = await Tag.find({});
    
    console.log(`   • Correspondances trouvées: ${correspondances.length}`);
    console.log(`   • Tags actuels: ${currentTags.length}`);
    
    // Compter les utilisations des tags actuels
    let tagUsage = {};
    correspondances.forEach(corr => {
      if (corr.tags && corr.tags.length > 0) {
        corr.tags.forEach(tagName => {
          tagUsage[tagName] = (tagUsage[tagName] || 0) + 1;
        });
      }
    });
    
    console.log('\n📈 Utilisation des tags actuels:');
    Object.entries(tagUsage).forEach(([tagName, count]) => {
      console.log(`   • "${tagName}": ${count} correspondances`);
    });

    // ÉTAPE 2: Supprimer tous les tags prédéfinis
    console.log('\n🗑️  ÉTAPE 2: Suppression des tags prédéfinis');
    const deleteResult = await Tag.deleteMany({});
    console.log(`   ✅ ${deleteResult.deletedCount} tags prédéfinis supprimés`);

    // ÉTAPE 3: Créer vos tags spécifiques
    console.log('\n🏷️  ÉTAPE 3: Création de vos tags spécifiques');
    const customCreatorId = 'custom-user-' + Date.now();
    let createdCount = 0;

    for (const tagData of yourCustomTags) {
      try {
        const newTag = new Tag({
          ...tagData,
          createdBy: customCreatorId,
          isActive: true
        });

        await newTag.save();
        console.log(`   ✅ "${tagData.name}" créé (${tagData.color})`);
        createdCount++;
      } catch (error) {
        console.error(`   ❌ Erreur pour "${tagData.name}":`, error.message);
      }
    }

    // ÉTAPE 4: Nettoyer les correspondances (retirer les anciens tags)
    console.log('\n🧹 ÉTAPE 4: Nettoyage des correspondances');
    let cleanedCount = 0;
    
    for (const corr of correspondances) {
      if (corr.tags && corr.tags.length > 0) {
        // Retirer tous les anciens tags
        corr.tags = [];
        await corr.save();
        cleanedCount++;
      }
    }
    
    console.log(`   ✅ ${cleanedCount} correspondances nettoyées`);

    // ÉTAPE 5: Vérification finale
    console.log('\n🔍 ÉTAPE 5: Vérification finale');
    const finalTags = await Tag.find({});
    const finalCorrespondances = await Correspondance.find({});
    
    console.log(`   • Tags dans la base: ${finalTags.length}`);
    console.log(`   • Correspondances dans la base: ${finalCorrespondances.length}`);
    
    console.log('\n🏷️  Vos nouveaux tags:');
    finalTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" (${tag.color})`);
      console.log(`      Description: ${tag.description}`);
    });

    console.log('\n🎉 REMPLACEMENT TERMINÉ AVEC SUCCÈS !');
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Testez l\'assignation: test-custom-analysis.bat');
    console.log('   2. Appliquez les tags: smart-tag-assignment-custom.bat');
    console.log('\n⚠️  Note: Toutes les correspondances ont été nettoyées');
    console.log('   Utilisez l\'assignation intelligente pour les re-tagger');

  } catch (error) {
    console.error('❌ Erreur lors du remplacement:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le remplacement
console.log('🔄 REMPLACEMENT DES TAGS PRÉDÉFINIS PAR VOS TAGS SPÉCIFIQUES\n');
replaceWithCustomTags();

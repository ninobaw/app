const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');

async function testCorrespondanceTags() {
  try {
    console.log('🔍 Test des tags dans les correspondances...\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie\n');

    // 1. Vérifier les tags existants
    console.log('📋 TAGS DISPONIBLES:');
    const tags = await Tag.find({ isActive: true }).select('name color');
    if (tags.length === 0) {
      console.log('❌ Aucun tag actif trouvé');
      console.log('💡 Créez des tags dans Paramètres > Tags d\'abord\n');
    } else {
      tags.forEach(tag => {
        console.log(`  - ${tag.name} (${tag.color})`);
      });
      console.log(`\n✅ ${tags.length} tag(s) disponible(s)\n`);
    }

    // 2. Vérifier les correspondances avec tags
    console.log('📬 CORRESPONDANCES AVEC TAGS:');
    const correspondancesWithTags = await Correspondance.find({ 
      tags: { $exists: true, $not: { $size: 0 } } 
    }).select('subject tags createdAt').limit(10);

    if (correspondancesWithTags.length === 0) {
      console.log('❌ Aucune correspondance avec tags trouvée');
      console.log('💡 Créez une correspondance avec des tags pour tester\n');
    } else {
      correspondancesWithTags.forEach(corr => {
        console.log(`  📧 ${corr.subject}`);
        console.log(`     Tags: [${corr.tags.join(', ')}]`);
        console.log(`     Date: ${corr.createdAt.toLocaleDateString('fr-FR')}\n`);
      });
      console.log(`✅ ${correspondancesWithTags.length} correspondance(s) avec tags\n`);
    }

    // 3. Statistiques des tags utilisés
    console.log('📊 STATISTIQUES D\'UTILISATION DES TAGS:');
    const tagStats = await Correspondance.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (tagStats.length === 0) {
      console.log('❌ Aucune statistique d\'utilisation disponible\n');
    } else {
      tagStats.forEach(stat => {
        console.log(`  🏷️  ${stat._id}: ${stat.count} correspondance(s)`);
      });
      console.log(`\n✅ ${tagStats.length} tag(s) utilisé(s)\n`);
    }

    // 4. Vérifier l'intégrité des données
    console.log('🔍 VÉRIFICATION D\'INTÉGRITÉ:');
    const allCorrespondances = await Correspondance.find({}).select('tags');
    let totalTags = 0;
    let invalidTags = 0;
    const tagNames = tags.map(t => t.name);

    allCorrespondances.forEach(corr => {
      if (corr.tags && Array.isArray(corr.tags)) {
        totalTags += corr.tags.length;
        corr.tags.forEach(tagName => {
          if (!tagNames.includes(tagName)) {
            invalidTags++;
            console.log(`  ⚠️  Tag invalide trouvé: "${tagName}" dans correspondance ${corr._id}`);
          }
        });
      }
    });

    console.log(`  📊 Total tags utilisés: ${totalTags}`);
    console.log(`  ❌ Tags invalides: ${invalidTags}`);
    
    if (invalidTags === 0) {
      console.log('  ✅ Tous les tags sont valides\n');
    } else {
      console.log('  ⚠️  Certains tags référencent des tags supprimés\n');
    }

    // 5. Test de requête par tags
    console.log('🔎 TEST DE RECHERCHE PAR TAGS:');
    if (tags.length > 0) {
      const firstTag = tags[0].name;
      const correspondancesByTag = await Correspondance.find({ 
        tags: { $in: [firstTag] } 
      }).select('subject tags').limit(5);

      console.log(`  Recherche pour le tag "${firstTag}"`);
      console.log(`  Résultats: ${correspondancesByTag.length} correspondance(s)`);
      
      correspondancesByTag.forEach(corr => {
        console.log(`    - ${corr.subject}`);
      });
      console.log();
    }

    console.log('🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le test
testCorrespondanceTags();

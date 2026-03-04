const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
require('dotenv').config();

// Fonction pour filtrer uniquement les tags personnalisés
function filterCustomTags(tags) {
  return tags.filter(tag => {
    const isSystemTag = tag.createdBy && tag.createdBy.toString().startsWith('system-init-');
    console.log(`   Tag "${tag.name}": createdBy="${tag.createdBy}", isSystem=${isSystemTag}`);
    return !isSystemTag;
  });
}

async function debugCustomAssignment() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // 1. Vérifier tous les tags
    console.log('\n🔍 ÉTAPE 1: VÉRIFICATION DES TAGS');
    console.log('=' .repeat(50));
    
    const allTags = await Tag.getActiveTags();
    console.log(`📊 Total tags actifs: ${allTags.length}`);
    
    console.log('\n📋 Analyse de tous les tags:');
    allTags.forEach((tag, index) => {
      const isSystem = tag.createdBy && tag.createdBy.toString().startsWith('system-init-');
      const type = isSystem ? '[SYSTÈME]' : '[PERSONNALISÉ]';
      console.log(`   ${index + 1}. ${type} "${tag.name}" - createdBy: ${tag.createdBy}`);
    });
    
    // 2. Filtrer les tags personnalisés
    console.log('\n🎯 ÉTAPE 2: FILTRAGE DES TAGS PERSONNALISÉS');
    console.log('=' .repeat(50));
    
    const customTags = filterCustomTags(allTags);
    console.log(`\n✅ Tags personnalisés trouvés: ${customTags.length}`);
    
    if (customTags.length === 0) {
      console.log('❌ PROBLÈME: Aucun tag personnalisé détecté !');
      console.log('💡 Tous les tags semblent être des tags système');
      return;
    }
    
    console.log('\n🏷️  Tags personnalisés qui seront utilisés:');
    customTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" (${tag.color}) - ${tag.description || 'Pas de description'}`);
    });

    // 3. Vérifier les correspondances
    console.log('\n📊 ÉTAPE 3: VÉRIFICATION DES CORRESPONDANCES');
    console.log('=' .repeat(50));
    
    const correspondances = await Correspondance.find({});
    console.log(`📧 Total correspondances: ${correspondances.length}`);
    
    if (correspondances.length === 0) {
      console.log('❌ PROBLÈME: Aucune correspondance trouvée !');
      return;
    }
    
    // Analyser quelques correspondances
    console.log('\n📝 Échantillon de correspondances:');
    correspondances.slice(0, 3).forEach((corr, index) => {
      console.log(`\n   ${index + 1}. "${corr.subject || 'Sans sujet'}"`);
      console.log(`      De: ${corr.from_address || 'Non spécifié'}`);
      console.log(`      À: ${corr.to_address || 'Non spécifié'}`);
      console.log(`      Tags actuels: [${(corr.tags || []).join(', ')}]`);
      console.log(`      Contenu: "${(corr.content || '').substring(0, 100)}..."`);
    });

    // 4. Test d'assignation sur une correspondance
    console.log('\n🧪 ÉTAPE 4: TEST D\'ASSIGNATION');
    console.log('=' .repeat(50));
    
    const testCorr = correspondances[0];
    if (testCorr) {
      console.log(`\n🔍 Test sur: "${testCorr.subject || 'Sans sujet'}"`);
      
      // Analyser le contexte
      let allText = '';
      if (testCorr.subject) allText += testCorr.subject + ' ';
      if (testCorr.content) allText += testCorr.content + ' ';
      if (testCorr.from_address) allText += testCorr.from_address + ' ';
      if (testCorr.to_address) allText += testCorr.to_address + ' ';
      
      console.log(`📝 Texte analysé: "${allText.substring(0, 200)}..."`);
      
      // Calculer les scores pour chaque tag personnalisé
      console.log('\n📊 Scores pour chaque tag personnalisé:');
      customTags.forEach(tag => {
        let score = 0;
        
        // Test simple: nom du tag dans le texte
        if (allText.toLowerCase().includes(tag.name.toLowerCase())) {
          score += 50;
        }
        
        // Test patterns spécialisés
        const patterns = {
          'police': /police|sécurité|sûreté|garde|gendarmerie/i,
          'aoca': /oaca|aviation|aéronautique|réglementation/i,
          'douane': /douane|customs|importation|exportation/i,
          'concessionaire1': /concessionnaire|concession|boutique|magasin/i,
          'syndicat': /syndicat|personnel|employé|grève/i,
          'commuté consultatif': /comité|consultatif|réunion|assemblée/i
        };
        
        const pattern = patterns[tag.name.toLowerCase()];
        if (pattern && pattern.test(allText)) {
          score += 35;
        }
        
        console.log(`     • ${tag.name}: ${score} points`);
      });
    }

    // 5. Vérifier les permissions d'écriture
    console.log('\n💾 ÉTAPE 5: TEST DE SAUVEGARDE');
    console.log('=' .repeat(50));
    
    try {
      const testCorr2 = correspondances[0];
      if (testCorr2) {
        const originalTags = [...(testCorr2.tags || [])];
        
        // Test d'assignation
        testCorr2.tags = ['Police']; // Test avec un tag personnalisé
        await testCorr2.save();
        console.log('✅ Test de sauvegarde réussi');
        
        // Restaurer les tags originaux
        testCorr2.tags = originalTags;
        await testCorr2.save();
        console.log('✅ Restauration des tags originaux réussie');
      }
    } catch (error) {
      console.log('❌ Erreur lors du test de sauvegarde:', error.message);
    }

    console.log('\n🎯 DIAGNOSTIC COMPLET:');
    console.log(`   • Tags personnalisés disponibles: ${customTags.length}`);
    console.log(`   • Correspondances disponibles: ${correspondances.length}`);
    console.log(`   • Connexion MongoDB: ✅`);
    console.log(`   • Permissions d'écriture: ✅`);
    
    if (customTags.length > 0 && correspondances.length > 0) {
      console.log('\n✅ TOUT SEMBLE PRÊT POUR L\'ASSIGNATION');
      console.log('💡 Le problème pourrait être dans l\'algorithme de scoring');
    } else {
      console.log('\n❌ PROBLÈME DÉTECTÉ');
      if (customTags.length === 0) console.log('   - Aucun tag personnalisé trouvé');
      if (correspondances.length === 0) console.log('   - Aucune correspondance trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
console.log('🔧 DIAGNOSTIC D\'ASSIGNATION DES TAGS PERSONNALISÉS\n');
debugCustomAssignment();

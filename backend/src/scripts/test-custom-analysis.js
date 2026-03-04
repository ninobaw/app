const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
require('dotenv').config();

// Fonction pour filtrer uniquement vos tags spécifiques
function filterCustomTags(tags) {
  // Vos 6 tags spécifiques
  const customTagNames = ['Police', 'AOCA', 'Douane', 'Concessionaire1', 'Syndicat', 'Commuté consultatif'];
  
  return tags.filter(tag => customTagNames.includes(tag.name));
}

// Fonction pour extraire les mots-clés d'un texte
function extractKeywords(text) {
  if (!text) return [];
  
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
    'ce', 'cette', 'ces', 'cet', 'à', 'au', 'aux', 'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous',
    'est', 'sont', 'être', 'avoir', 'fait', 'faire', 'dit', 'dire', 'va', 'aller', 'vient', 'venir'
  ];
  
  return text.toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .filter(word => !/^\d+$/.test(word));
}

// Fonction pour analyser le contexte d'une correspondance
function analyzeCorrespondanceContext(correspondance) {
  let allText = '';
  
  if (correspondance.subject) allText += correspondance.subject + ' ';
  if (correspondance.content) allText += correspondance.content + ' ';
  if (correspondance.from_address) allText += correspondance.from_address + ' ';
  if (correspondance.to_address) allText += correspondance.to_address + ' ';
  if (correspondance.description) allText += correspondance.description + ' ';
  
  const keywords = extractKeywords(allText);
  
  return {
    fullText: allText.trim(),
    keywords: keywords,
    keywordString: keywords.join(' ')
  };
}

// Fonction pour calculer le score de pertinence
function calculateTagRelevance(correspondanceContext, tag) {
  let score = 0;
  const tagKeywords = extractKeywords(tag.name + ' ' + (tag.description || ''));
  
  // 1. Correspondance exacte du nom du tag
  const tagNameInText = correspondanceContext.fullText.toLowerCase().includes(tag.name.toLowerCase());
  if (tagNameInText) {
    score += 50;
  }
  
  // 2. Correspondance des mots-clés
  tagKeywords.forEach(tagKeyword => {
    correspondanceContext.keywords.forEach(corrKeyword => {
      if (tagKeyword === corrKeyword) {
        score += 20;
      } else if (tagKeyword.includes(corrKeyword) || corrKeyword.includes(tagKeyword)) {
        score += 10;
      }
    });
  });
  
  // 3. Patterns spécialisés pour vos tags
  const customTagPatterns = {
    'police': /police|sécurité|sûreté|garde|gendarmerie|incident|urgence|intervention/i,
    'aoca': /oaca|aviation.civile|aéronautique|réglementation|certification|contrôle.aérien/i,
    'douane': /douane|customs|importation|exportation|marchandises|contrôle.frontalier|déclaration/i,
    'concessionaire1': /concessionnaire|concession|boutique|magasin|commerce|location|service/i,
    'syndicat': /syndicat|personnel|employé|grève|revendication|négociation|représentation/i,
    'commuté consultatif': /comité|consultatif|réunion|assemblée|conseil|consultation|avis/i
  };
  
  const pattern = customTagPatterns[tag.name.toLowerCase()];
  if (pattern && pattern.test(correspondanceContext.fullText)) {
    score += 35;
  }
  
  return score;
}

async function testCustomAnalysis() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer les tags personnalisés
    const allTags = await Tag.getActiveTags();
    const customTags = filterCustomTags(allTags);
    
    console.log(`📋 Tags personnalisés disponibles: ${customTags.length}`);
    
    if (customTags.length === 0) {
      console.log('⚠️  Aucun tag personnalisé trouvé');
      process.exit(1);
    }

    // Afficher les tags personnalisés
    console.log('\n🏷️  Vos tags personnalisés:');
    customTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" (${tag.color}) - ${tag.description || 'Pas de description'}`);
    });

    // Tests avec des exemples spécifiques à vos tags
    console.log('\n🧪 TESTS D\'ANALYSE AVEC VOS TAGS PERSONNALISÉS:');
    console.log('=' .repeat(60));

    const testCases = [
      {
        subject: 'Correspondance de la police nationale',
        content: 'Incident de sécurité à l\'aéroport nécessitant une intervention de la sûreté',
        from_address: 'police.nationale@interieur.tn',
        to_address: 'securite@enfidha-airport.tn'
      },
      {
        subject: 'Réglementation OACA',
        content: 'Nouvelle réglementation de l\'aviation civile concernant les contrôles aériens',
        from_address: 'reglementation@oaca.tn',
        to_address: 'direction@enfidha-airport.tn'
      },
      {
        subject: 'Contrôle douanier',
        content: 'Procédure d\'importation de marchandises et contrôle frontalier',
        from_address: 'controle@douane.tn',
        to_address: 'administration@enfidha-airport.tn'
      },
      {
        subject: 'Concession boutique',
        content: 'Demande de renouvellement de concession pour magasin duty-free',
        from_address: 'commercial@concessionnaire.com',
        to_address: 'commercial@enfidha-airport.tn'
      },
      {
        subject: 'Revendications syndicales',
        content: 'Négociation collective du personnel et représentation syndicale',
        from_address: 'secretaire@syndicat-aero.tn',
        to_address: 'rh@enfidha-airport.tn'
      },
      {
        subject: 'Réunion comité consultatif',
        content: 'Assemblée du conseil consultatif pour avis sur les nouvelles procédures',
        from_address: 'secretariat@comite-consultatif.tn',
        to_address: 'direction@enfidha-airport.tn'
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. TEST: "${testCase.subject}"`);
      console.log(`   Contenu: "${testCase.content}"`);
      console.log(`   De: ${testCase.from_address} → À: ${testCase.to_address}`);
      
      // Analyser le contexte
      const context = analyzeCorrespondanceContext(testCase);
      console.log(`   🔑 Mots-clés extraits: [${context.keywords.join(', ')}]`);
      
      // Calculer les scores pour tous les tags personnalisés
      const tagScores = customTags.map(tag => ({
        name: tag.name,
        description: tag.description,
        score: calculateTagRelevance(context, tag)
      })).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
      
      console.log(`   📊 Scores calculés (tags personnalisés uniquement):`);
      if (tagScores.length > 0) {
        tagScores.forEach(item => {
          console.log(`     • ${item.name}: ${item.score.toFixed(1)} points`);
        });
        
        // Tags recommandés (score > 20)
        const recommendedTags = tagScores.filter(item => item.score >= 20).slice(0, 2);
        console.log(`   ✅ Tags recommandés: [${recommendedTags.map(t => t.name).join(', ')}]`);
      } else {
        console.log(`     ⚠️  Aucun tag personnalisé pertinent trouvé`);
      }
    }

    // Test sur des vraies correspondances de la base
    console.log('\n\n🔍 ANALYSE D\'ÉCHANTILLON DE CORRESPONDANCES RÉELLES:');
    console.log('=' .repeat(60));

    const realCorrespondances = await Correspondance.find({}).limit(5);
    
    if (realCorrespondances.length === 0) {
      console.log('⚠️  Aucune correspondance trouvée dans la base de données');
    } else {
      for (let i = 0; i < realCorrespondances.length; i++) {
        const corr = realCorrespondances[i];
        console.log(`\n${i + 1}. CORRESPONDANCE RÉELLE:`);
        console.log(`   Sujet: "${corr.subject || 'Sans sujet'}"`);
        console.log(`   De: ${corr.from_address || 'Non spécifié'}`);
        console.log(`   À: ${corr.to_address || 'Non spécifié'}`);
        console.log(`   Tags actuels: [${(corr.tags || []).join(', ')}]`);
        
        const context = analyzeCorrespondanceContext(corr);
        console.log(`   🔑 Mots-clés: [${context.keywords.slice(0, 8).join(', ')}${context.keywords.length > 8 ? '...' : ''}]`);
        
        const tagScores = customTags.map(tag => ({
          name: tag.name,
          score: calculateTagRelevance(context, tag)
        })).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        
        if (tagScores.length > 0) {
          console.log(`   📊 Top scores (tags personnalisés):`);
          tagScores.forEach(item => {
            console.log(`     • ${item.name}: ${item.score.toFixed(1)} points`);
          });
          
          const recommendedTags = tagScores.filter(item => item.score >= 20).slice(0, 2);
          console.log(`   ✅ Tags recommandés: [${recommendedTags.map(t => t.name).join(', ')}]`);
        } else {
          console.log(`   ⚠️  Aucun tag personnalisé pertinent trouvé`);
        }
      }
    }

    console.log('\n🎯 RECOMMANDATION:');
    console.log('✅ Le système est configuré pour utiliser uniquement vos tags personnalisés');
    console.log('💡 Vous pouvez maintenant exécuter smart-tag-assignment-custom.js');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
console.log('🧪 TEST D\'ANALYSE AVEC TAGS PERSONNALISÉS\n');
testCustomAnalysis();

const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
require('dotenv').config();

// Fonction pour extraire les mots-clés d'un texte
function extractKeywords(text) {
  if (!text) return [];
  
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
    'ce', 'cette', 'ces', 'cet', 'à', 'au', 'aux', 'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous',
    'est', 'sont', 'être', 'avoir', 'fait', 'faire', 'dit', 'dire', 'va', 'aller', 'vient', 'venir',
    'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'si', 'comme', 'très', 'plus', 'moins'
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
  if (correspondanceContext.fullText.toLowerCase().includes(tag.name.toLowerCase())) {
    score += 50;
  }
  
  // 2. Patterns spécialisés améliorés
  const customTagPatterns = {
    'police': /police|sécurité|sûreté|garde|gendarmerie|incident|urgence|intervention|contrôle|surveillance|agent/i,
    'aoca': /oaca|aviation.civile|aéronautique|réglementation|certification|contrôle.aérien|navigation|vol|pilote|aéroport/i,
    'douane': /douane|customs|importation|exportation|marchandises|contrôle.frontalier|déclaration|transit|fret/i,
    'concessionaire1': /concessionnaire|concession|boutique|magasin|commerce|location|service|duty.free|restaurant|café/i,
    'syndicat': /syndicat|personnel|employé|grève|revendication|négociation|représentation|ugtt|travail|salaire/i,
    'commuté consultatif': /comité|consultatif|réunion|assemblée|conseil|consultation|avis|séance|délibération/i
  };
  
  const pattern = customTagPatterns[tag.name.toLowerCase()];
  if (pattern && pattern.test(correspondanceContext.fullText)) {
    score += 40;
  }
  
  // 3. Mots-clés dans les adresses email
  const emailDomains = {
    'police': /police|interieur|securite|surete|gendarmerie/i,
    'aoca': /oaca|aviation|aero|civil/i,
    'douane': /douane|customs|finance/i,
    'concessionaire1': /boutique|shop|commerce|retail|duty|restaurant/i,
    'syndicat': /syndicat|union|ugtt|personnel/i,
    'commuté consultatif': /comite|conseil|consultatif/i
  };
  
  const emailPattern = emailDomains[tag.name.toLowerCase()];
  if (emailPattern && emailPattern.test(correspondanceContext.fullText)) {
    score += 30;
  }
  
  // 4. Correspondance des mots-clés
  tagKeywords.forEach(tagKeyword => {
    correspondanceContext.keywords.forEach(corrKeyword => {
      if (tagKeyword === corrKeyword) {
        score += 15;
      } else if (tagKeyword.includes(corrKeyword) || corrKeyword.includes(tagKeyword)) {
        score += 8;
      }
    });
  });
  
  return score;
}

async function debugAssignmentAccuracy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer les tags personnalisés
    const allTags = await Tag.find({});
    const customTagNames = ['Police', 'AOCA', 'Douane', 'Concessionaire1', 'Syndicat', 'Commuté consultatif'];
    const customTags = allTags.filter(tag => customTagNames.includes(tag.name));
    
    console.log(`🏷️  Tags personnalisés trouvés: ${customTags.length}`);
    customTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" - ${tag.description}`);
    });

    // Récupérer les correspondances
    const correspondances = await Correspondance.find({}).limit(10);
    console.log(`\n📧 Analyse de ${correspondances.length} correspondances (échantillon):`);

    console.log('\n🔍 ANALYSE DÉTAILLÉE:');
    console.log('=' .repeat(80));

    correspondances.forEach((corr, index) => {
      console.log(`\n${index + 1}. 📧 "${corr.subject || 'Sans sujet'}"`);
      console.log(`   De: ${corr.from_address || 'Non spécifié'}`);
      console.log(`   À: ${corr.to_address || 'Non spécifié'}`);
      console.log(`   Tags actuels: [${(corr.tags || []).join(', ') || 'Aucun'}]`);
      
      // Analyser le contexte
      const context = analyzeCorrespondanceContext(corr);
      console.log(`   🔑 Mots-clés: [${context.keywords.slice(0, 8).join(', ')}${context.keywords.length > 8 ? '...' : ''}]`);
      
      // Calculer les scores pour chaque tag
      const tagScores = customTags.map(tag => ({
        tag: tag,
        score: calculateTagRelevance(context, tag)
      })).sort((a, b) => b.score - a.score);
      
      console.log(`   📊 Scores calculés:`);
      tagScores.forEach(item => {
        const indicator = item.score >= 20 ? '✅' : item.score >= 10 ? '⚠️' : '❌';
        console.log(`      ${indicator} ${item.tag.name}: ${item.score.toFixed(1)} points`);
      });
      
      // Recommandation
      const recommendedTags = tagScores
        .filter(item => item.score >= 20)
        .slice(0, 2)
        .map(item => item.tag.name);
      
      console.log(`   💡 Recommandation: [${recommendedTags.join(', ') || 'Aucun tag pertinent'}]`);
      
      // Afficher le contenu pour debug si nécessaire
      if (context.fullText.length > 0) {
        console.log(`   📝 Contenu (extrait): "${context.fullText.substring(0, 150)}..."`);
      }
    });

    // Statistiques globales
    console.log('\n📈 STATISTIQUES GLOBALES:');
    console.log('=' .repeat(50));
    
    const allCorrespondances = await Correspondance.find({});
    console.log(`📊 Total correspondances: ${allCorrespondances.length}`);
    
    let tagUsageStats = {};
    allCorrespondances.forEach(corr => {
      if (corr.tags && corr.tags.length > 0) {
        corr.tags.forEach(tag => {
          tagUsageStats[tag] = (tagUsageStats[tag] || 0) + 1;
        });
      }
    });
    
    console.log('\n🏷️  Utilisation actuelle des tags:');
    Object.entries(tagUsageStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([tag, count]) => {
        console.log(`   • ${tag}: ${count} fois`);
      });

    console.log('\n💡 RECOMMANDATIONS POUR AMÉLIORER L\'ASSIGNATION:');
    console.log('1. Ajustez le seuil minimum (actuellement 20 points)');
    console.log('2. Enrichissez les patterns de reconnaissance');
    console.log('3. Analysez les correspondances mal classées');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

console.log('🔍 DIAGNOSTIC DE LA PRÉCISION D\'ASSIGNATION\n');
debugAssignmentAccuracy();

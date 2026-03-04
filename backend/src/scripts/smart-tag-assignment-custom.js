const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
require('dotenv').config();

// Fonction pour calculer la similarité entre deux textes
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  let commonWords = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  words1.forEach(word => {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      commonWords++;
    }
  });
  
  return totalWords > 0 ? commonWords / totalWords : 0;
}

// Fonction pour extraire les mots-clés d'un texte
function extractKeywords(text) {
  if (!text) return [];
  
  // Mots vides à ignorer
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
    'ce', 'cette', 'ces', 'cet', 'à', 'au', 'aux', 'avec', 'sans', 'pour', 'par', 'dans', 'sur', 'sous',
    'est', 'sont', 'être', 'avoir', 'fait', 'faire', 'dit', 'dire', 'va', 'aller', 'vient', 'venir',
    'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'si', 'comme', 'très', 'plus', 'moins',
    'bien', 'mal', 'tout', 'tous', 'toute', 'toutes', 'autre', 'autres', 'même', 'mêmes'
  ];
  
  return text.toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç]/g, ' ') // Garder les accents
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .filter(word => !/^\d+$/.test(word)); // Exclure les nombres purs
}

// Fonction pour analyser le contexte d'une correspondance
function analyzeCorrespondanceContext(correspondance) {
  let allText = '';
  
  // Collecter tout le texte de la correspondance
  if (correspondance.subject) allText += correspondance.subject + ' ';
  if (correspondance.content) allText += correspondance.content + ' ';
  if (correspondance.from_address) allText += correspondance.from_address + ' ';
  if (correspondance.to_address) allText += correspondance.to_address + ' ';
  if (correspondance.description) allText += correspondance.description + ' ';
  
  // Extraire les mots-clés
  const keywords = extractKeywords(allText);
  
  return {
    fullText: allText.trim(),
    keywords: keywords,
    keywordString: keywords.join(' ')
  };
}

// Fonction pour calculer le score de pertinence d'un tag pour une correspondance
function calculateTagRelevance(correspondanceContext, tag) {
  let score = 0;
  const tagKeywords = extractKeywords(tag.name + ' ' + (tag.description || ''));
  
  // 1. Correspondance exacte du nom du tag dans le texte
  const tagNameInText = correspondanceContext.fullText.toLowerCase().includes(tag.name.toLowerCase());
  if (tagNameInText) {
    score += 50; // Score élevé pour correspondance exacte
  }
  
  // 2. Correspondance des mots-clés du tag avec ceux de la correspondance
  tagKeywords.forEach(tagKeyword => {
    correspondanceContext.keywords.forEach(corrKeyword => {
      if (tagKeyword === corrKeyword) {
        score += 20; // Correspondance exacte de mot-clé
      } else if (tagKeyword.includes(corrKeyword) || corrKeyword.includes(tagKeyword)) {
        score += 10; // Correspondance partielle
      }
    });
  });
  
  // 3. Similarité globale entre la description du tag et le contexte
  if (tag.description) {
    const similarity = calculateSimilarity(tag.description, correspondanceContext.keywordString);
    score += similarity * 30;
  }
  
  // 4. Bonus spécialisés pour vos tags personnalisés (patterns améliorés)
  const customTagPatterns = {
    'police': /police|sécurité|sûreté|garde|gendarmerie|incident|urgence|intervention|frontière|frontiere|contrôle|surveillance/i,
    'aoca': /oaca|aimhb|aviation.civile|aéronautique|réglementation|certification|contrôle.aérien|mission.de.controle|qualité.de.service|rapport.de.mission/i,
    'douane': /douane|customs|importation|exportation|marchandises|contrôle.frontalier|déclaration|transit|fret/i,
    'concessionaire1': /concessionnaire|concession|boutique|magasin|commerce|location|service|duty.free|restaurant|café/i,
    'syndicat': /syndicat|personnel|employé|grève|revendication|négociation|représentation|ugtt|travail|salaire/i,
    'commuté consultatif': /comité|consultatif|réunion|assemblée|conseil|consultation|avis|séance|délibération|consultatif/i
  };
  
  const pattern = customTagPatterns[tag.name.toLowerCase()];
  if (pattern && pattern.test(correspondanceContext.fullText)) {
    score += 35; // Bonus élevé pour correspondances spécialisées
  }
  
  // 5. Bonus pour mots-clés dans les adresses email
  const emailDomains = {
    'police': /police|interieur|securite|surete/i,
    'aoca': /oaca|aviation|aero/i,
    'douane': /douane|customs/i,
    'concessionaire1': /boutique|shop|commerce|retail/i,
    'syndicat': /syndicat|union|ugtt/i
  };
  
  const emailPattern = emailDomains[tag.name.toLowerCase()];
  if (emailPattern && emailPattern.test(correspondanceContext.fullText)) {
    score += 25; // Bonus pour correspondance dans les adresses email
  }
  
  return score;
}

// Fonction pour filtrer uniquement vos tags spécifiques
function filterCustomTags(tags) {
  // Vos 6 tags spécifiques
  const customTagNames = ['Police', 'AOCA', 'Douane', 'Concessionaire1', 'Syndicat', 'Commuté consultatif'];
  
  return tags.filter(tag => customTagNames.includes(tag.name));
}

// Fonction principale d'assignation intelligente des tags personnalisés
async function smartTagAssignmentCustom() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer tous les tags actifs
    const allTags = await Tag.getActiveTags();
    console.log(`📋 Total tags actifs dans la base: ${allTags.length}`);
    
    // Filtrer pour garder uniquement les tags personnalisés
    const customTags = filterCustomTags(allTags);
    console.log(`🎯 Tags personnalisés (non-système): ${customTags.length}`);
    
    if (customTags.length === 0) {
      console.log('⚠️  Aucun tag personnalisé trouvé');
      console.log('💡 Tous les tags semblent être des tags système');
      
      console.log('\n📋 Tags disponibles (tous):');
      allTags.forEach((tag, index) => {
        const isSystem = tag.createdBy && tag.createdBy.toString().startsWith('system-init-');
        const type = isSystem ? '[SYSTÈME]' : '[PERSONNALISÉ]';
        console.log(`   ${index + 1}. ${type} ${tag.name} - ${tag.description || 'Pas de description'}`);
      });
      
      process.exit(1);
    }

    // Afficher les tags personnalisés qui seront utilisés
    console.log('\n🏷️  Tags personnalisés qui seront utilisés:');
    customTags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" (${tag.color}) - ${tag.description || 'Pas de description'}`);
    });

    // Récupérer toutes les correspondances
    const correspondances = await Correspondance.find({});
    console.log(`\n📊 Correspondances à analyser: ${correspondances.length}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let totalTagsAssigned = 0;

    // Analyser chaque correspondance
    for (const correspondance of correspondances) {
      try {
        console.log(`\n🔍 Analyse: "${correspondance.subject || 'Sans sujet'}"`);
        
        // Analyser le contexte de la correspondance
        const context = analyzeCorrespondanceContext(correspondance);
        console.log(`   Mots-clés extraits: [${context.keywords.slice(0, 5).join(', ')}${context.keywords.length > 5 ? '...' : ''}]`);
        
        // Calculer le score de pertinence pour chaque tag personnalisé
        const tagScores = customTags.map(tag => ({
          tag: tag,
          score: calculateTagRelevance(context, tag)
        })).filter(item => item.score > 0) // Garder seulement les tags avec un score > 0
          .sort((a, b) => b.score - a.score); // Trier par score décroissant
        
        if (tagScores.length === 0) {
          console.log(`   ⚠️  Aucun tag personnalisé pertinent trouvé`);
          skippedCount++;
          continue;
        }
        
        // Sélectionner les meilleurs tags (score > seuil minimum)
        const minScore = 15; // Seuil réduit pour plus de flexibilité
        const maxTags = 2; // Maximum 2 tags personnalisés par correspondance
        
        const selectedTags = tagScores
          .filter(item => item.score >= minScore)
          .slice(0, maxTags)
          .map(item => item.tag.name);
        
        if (selectedTags.length === 0) {
          console.log(`   ⚠️  Aucun tag avec score suffisant (min: ${minScore})`);
          console.log(`   📊 Meilleur score: ${tagScores[0]?.score.toFixed(1) || 0}`);
          skippedCount++;
          continue;
        }
        
        // Afficher les scores pour debug
        console.log(`   📊 Scores calculés (tags personnalisés uniquement):`);
        tagScores.slice(0, 5).forEach(item => {
          const selected = selectedTags.includes(item.tag.name) ? '✅' : '  ';
          console.log(`   ${selected} ${item.tag.name}: ${item.score.toFixed(1)} points`);
        });
        
        // Mettre à jour la correspondance
        const oldTags = correspondance.tags || [];
        correspondance.tags = selectedTags;
        await correspondance.save();
        
        console.log(`   ✅ Tags assignés: [${selectedTags.join(', ')}]`);
        console.log(`   📝 Ancien: [${oldTags.join(', ')}] → Nouveau: [${selectedTags.join(', ')}]`);
        
        updatedCount++;
        totalTagsAssigned += selectedTags.length;
        
      } catch (error) {
        console.error(`   ❌ Erreur lors de l'analyse de "${correspondance.subject}":`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Résumé de l\'assignation intelligente (tags personnalisés):');
    console.log(`   • Correspondances analysées: ${correspondances.length}`);
    console.log(`   • Correspondances mises à jour: ${updatedCount}`);
    console.log(`   • Correspondances ignorées: ${skippedCount}`);
    console.log(`   • Total tags assignés: ${totalTagsAssigned}`);
    console.log(`   • Moyenne tags par correspondance: ${updatedCount > 0 ? (totalTagsAssigned / updatedCount).toFixed(1) : 0}`);

    // Statistiques des tags utilisés
    if (updatedCount > 0) {
      const updatedCorrespondances = await Correspondance.find({ tags: { $exists: true, $ne: [] } });
      const tagUsage = {};
      
      updatedCorrespondances.forEach(corr => {
        if (corr.tags) {
          corr.tags.forEach(tag => {
            // Compter seulement les tags personnalisés
            const isCustomTag = customTags.some(ct => ct.name === tag);
            if (isCustomTag) {
              tagUsage[tag] = (tagUsage[tag] || 0) + 1;
            }
          });
        }
      });
      
      console.log('\n📊 Utilisation des tags personnalisés:');
      Object.entries(tagUsage)
        .sort(([,a], [,b]) => b - a)
        .forEach(([tag, count]) => {
          console.log(`   • ${tag}: ${count} fois`);
        });
    }

    if (updatedCount > 0) {
      console.log('\n🎉 Assignation intelligente des tags personnalisés terminée avec succès !');
      console.log('💡 Les correspondances utilisent maintenant vos tags métier spécialisés');
    } else {
      console.log('\n⚠️  Aucune correspondance mise à jour.');
      console.log('💡 Vérifiez le contenu des correspondances ou ajustez les seuils de pertinence');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation intelligente:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
console.log('🎯 ASSIGNATION INTELLIGENTE DES TAGS PERSONNALISÉS\n');
smartTagAssignmentCustom();

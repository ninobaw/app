const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');

// Fonction pour nettoyer et normaliser le texte
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim();
}

// Importer la configuration des mots-clés
const { tagKeywordsConfig } = require('./configure-tag-keywords');

// Fonction pour générer des mots-clés à partir du nom du tag
function generateKeywords(tagName, tagDescription = '') {
  const keywords = new Set();
  const normalizedTagName = normalizeText(tagName);
  
  // Ajouter le nom du tag lui-même
  keywords.add(normalizedTagName);
  
  // Chercher dans la configuration prédéfinie
  const config = tagKeywordsConfig[normalizedTagName];
  if (config && config.keywords) {
    config.keywords.forEach(keyword => keywords.add(normalizeText(keyword)));
  }
  
  // Ajouter des mots de la description si disponible
  if (tagDescription) {
    const descWords = normalizeText(tagDescription).split(' ');
    descWords.forEach(word => {
      if (word.length > 3) { // Ignorer les mots trop courts
        keywords.add(word);
      }
    });
  }
  
  // Si aucune configuration spécifique, utiliser des mots-clés génériques
  if (!config) {
    // Ajouter des variations du nom
    const words = normalizedTagName.split(' ');
    words.forEach(word => {
      if (word.length > 2) {
        keywords.add(word);
        // Ajouter des variations (pluriel, etc.)
        if (!word.endsWith('s')) keywords.add(word + 's');
      }
    });
  }
  
  return Array.from(keywords);
}

// Fonction pour obtenir le poids d'un tag
function getTagWeight(tagName) {
  const normalizedTagName = normalizeText(tagName);
  const config = tagKeywordsConfig[normalizedTagName];
  return config ? config.weight : 5; // Poids par défaut
}

// Fonction pour analyser le contenu et trouver les tags correspondants
function findMatchingTags(content, tags) {
  const normalizedContent = normalizeText(content);
  const matchingTags = [];
  
  tags.forEach(tag => {
    const keywords = generateKeywords(tag.name, tag.description);
    let matchScore = 0;
    const foundKeywords = [];
    
    keywords.forEach(keyword => {
      if (normalizedContent.includes(keyword)) {
        matchScore++;
        foundKeywords.push(keyword);
      }
    });
    
    // Appliquer le poids du tag au score
    const tagWeight = getTagWeight(tag.name);
    const weightedScore = matchScore * (tagWeight / 10);
    
    // Seuil de correspondance (au moins 1 mot-clé trouvé)
    if (matchScore > 0) {
      matchingTags.push({
        tag: tag,
        score: weightedScore,
        rawScore: matchScore,
        weight: tagWeight,
        keywords: foundKeywords
      });
    }
  });
  
  // Trier par score décroissant
  return matchingTags.sort((a, b) => b.score - a.score);
}

async function autoTagCorrespondances() {
  try {
    console.log('🏷️  Auto-tagging des correspondances...\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie\n');

    // 1. Récupérer tous les tags actifs
    console.log('📋 Récupération des tags actifs...');
    const tags = await Tag.find({ isActive: true }).select('name color description');
    
    if (tags.length === 0) {
      console.log('❌ Aucun tag actif trouvé');
      console.log('💡 Créez des tags dans Paramètres > Tags d\'abord\n');
      return;
    }
    
    console.log(`✅ ${tags.length} tag(s) actif(s) trouvé(s):`);
    tags.forEach(tag => {
      console.log(`  - ${tag.name} (${tag.description || 'pas de description'})`);
    });
    console.log();

    // 2. Récupérer toutes les correspondances
    console.log('📬 Récupération des correspondances...');
    const correspondances = await Correspondance.find({})
      .select('subject content from_address to_address tags')
      .limit(100); // Limiter pour éviter la surcharge
    
    console.log(`✅ ${correspondances.length} correspondance(s) trouvée(s)\n`);

    // 3. Analyser et tagger chaque correspondance
    console.log('🔍 Analyse et tagging automatique...\n');
    
    let processedCount = 0;
    let updatedCount = 0;
    let totalTagsAdded = 0;

    for (const correspondance of correspondances) {
      processedCount++;
      
      // Combiner tout le contenu textuel
      const fullContent = [
        correspondance.subject || '',
        correspondance.content || '',
        correspondance.from_address || '',
        correspondance.to_address || ''
      ].join(' ');
      
      if (!fullContent.trim()) {
        console.log(`⚠️  Correspondance ${correspondance._id}: Pas de contenu à analyser`);
        continue;
      }
      
      // Trouver les tags correspondants
      const matchingTags = findMatchingTags(fullContent, tags);
      
      if (matchingTags.length === 0) {
        console.log(`📄 Correspondance ${processedCount}: "${correspondance.subject}" - Aucun tag trouvé`);
        continue;
      }
      
      // Préparer les nouveaux tags (limiter à 5 maximum)
      const newTags = matchingTags.slice(0, 5).map(match => match.tag.name);
      const existingTags = correspondance.tags || [];
      
      // Fusionner avec les tags existants (éviter les doublons)
      const allTags = [...new Set([...existingTags, ...newTags])];
      
      // Mettre à jour seulement si de nouveaux tags ont été ajoutés
      if (allTags.length > existingTags.length) {
        await Correspondance.updateOne(
          { _id: correspondance._id },
          { $set: { tags: allTags } }
        );
        
        updatedCount++;
        const addedTags = allTags.filter(tag => !existingTags.includes(tag));
        totalTagsAdded += addedTags.length;
        
        console.log(`✅ Correspondance ${processedCount}: "${correspondance.subject}"`);
        console.log(`   Tags ajoutés: [${addedTags.join(', ')}]`);
        console.log(`   Tags finaux: [${allTags.join(', ')}]`);
        
        // Afficher les mots-clés trouvés pour les premiers tags
        matchingTags.slice(0, 3).forEach(match => {
          console.log(`   "${match.tag.name}": ${match.keywords.slice(0, 3).join(', ')}`);
        });
        console.log();
      } else {
        console.log(`📄 Correspondance ${processedCount}: "${correspondance.subject}" - Tags déjà présents`);
      }
    }

    // 4. Statistiques finales
    console.log('📊 STATISTIQUES FINALES:');
    console.log(`  Correspondances analysées: ${processedCount}`);
    console.log(`  Correspondances mises à jour: ${updatedCount}`);
    console.log(`  Total tags ajoutés: ${totalTagsAdded}`);
    console.log(`  Moyenne tags par correspondance: ${(totalTagsAdded / Math.max(updatedCount, 1)).toFixed(1)}`);
    
    // 5. Vérification post-traitement
    console.log('\n🔍 Vérification post-traitement...');
    const updatedCorrespondances = await Correspondance.find({ 
      tags: { $exists: true, $not: { $size: 0 } } 
    }).countDocuments();
    
    console.log(`✅ ${updatedCorrespondances} correspondance(s) ont maintenant des tags`);
    
    // 6. Statistiques par tag
    console.log('\n📈 UTILISATION DES TAGS:');
    const tagStats = await Correspondance.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    tagStats.forEach(stat => {
      console.log(`  🏷️  ${stat._id}: ${stat.count} correspondance(s)`);
    });

    console.log('\n🎉 Auto-tagging terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'auto-tagging:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le script
autoTagCorrespondances();

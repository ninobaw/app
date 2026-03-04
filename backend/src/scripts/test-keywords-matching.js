const mongoose = require('mongoose');
require('dotenv').config();

// Import models et configuration
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
const { tagKeywordsConfig } = require('./configure-tag-keywords');

// Fonction pour nettoyer et normaliser le texte
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction pour générer des mots-clés
function generateKeywords(tagName, tagDescription = '') {
  const keywords = new Set();
  const normalizedTagName = normalizeText(tagName);
  
  keywords.add(normalizedTagName);
  
  const config = tagKeywordsConfig[normalizedTagName];
  if (config && config.keywords) {
    config.keywords.forEach(keyword => keywords.add(normalizeText(keyword)));
  }
  
  if (tagDescription) {
    const descWords = normalizeText(tagDescription).split(' ');
    descWords.forEach(word => {
      if (word.length > 3) {
        keywords.add(word);
      }
    });
  }
  
  return Array.from(keywords);
}

async function testKeywordsMatching() {
  try {
    console.log('🧪 Test de correspondance des mots-clés...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie\n');

    // Récupérer quelques correspondances pour test
    const correspondances = await Correspondance.find({})
      .select('subject content from_address to_address tags')
      .limit(10);
    
    const tags = await Tag.find({ isActive: true }).select('name description');
    
    console.log(`📋 Test sur ${correspondances.length} correspondances avec ${tags.length} tags\n`);

    // Tester chaque correspondance
    correspondances.forEach((correspondance, index) => {
      console.log(`📧 CORRESPONDANCE ${index + 1}:`);
      console.log(`   Sujet: "${correspondance.subject}"`);
      console.log(`   Contenu: "${correspondance.content?.substring(0, 100)}..."`);
      console.log(`   Tags actuels: [${(correspondance.tags || []).join(', ')}]`);
      
      // Combiner le contenu
      const fullContent = [
        correspondance.subject || '',
        correspondance.content || '',
        correspondance.from_address || '',
        correspondance.to_address || ''
      ].join(' ');
      
      const normalizedContent = normalizeText(fullContent);
      console.log(`   Contenu normalisé: "${normalizedContent.substring(0, 150)}..."`);
      
      // Tester chaque tag
      const matches = [];
      tags.forEach(tag => {
        const keywords = generateKeywords(tag.name, tag.description);
        const foundKeywords = [];
        
        keywords.forEach(keyword => {
          if (normalizedContent.includes(keyword)) {
            foundKeywords.push(keyword);
          }
        });
        
        if (foundKeywords.length > 0) {
          const config = tagKeywordsConfig[normalizeText(tag.name)];
          matches.push({
            tag: tag.name,
            keywords: foundKeywords,
            weight: config ? config.weight : 5,
            score: foundKeywords.length * (config ? config.weight : 5) / 10
          });
        }
      });
      
      // Afficher les correspondances trouvées
      if (matches.length > 0) {
        console.log(`   🎯 TAGS SUGGÉRÉS (${matches.length}):`);
        matches
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .forEach(match => {
            console.log(`     "${match.tag}" (score: ${match.score.toFixed(1)}, poids: ${match.weight})`);
            console.log(`       Mots-clés trouvés: ${match.keywords.join(', ')}`);
          });
      } else {
        console.log(`   ⚠️  Aucun tag suggéré`);
      }
      
      console.log('');
    });

    // Statistiques globales
    console.log('📊 STATISTIQUES DES MOTS-CLÉS:\n');
    
    tags.forEach(tag => {
      const normalizedTagName = normalizeText(tag.name);
      const config = tagKeywordsConfig[normalizedTagName];
      const keywords = generateKeywords(tag.name, tag.description);
      
      console.log(`🏷️  Tag "${tag.name}":`);
      console.log(`   Configuration: ${config ? '✅ Oui' : '❌ Non'}`);
      console.log(`   Poids: ${config ? config.weight : 5}/10`);
      console.log(`   Mots-clés: ${keywords.length}`);
      console.log(`   Exemples: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''}`);
      console.log('');
    });

    // Test de mots-clés spécifiques
    console.log('🔍 TEST DE MOTS-CLÉS SPÉCIFIQUES:\n');
    
    const testPhrases = [
      'Demande urgente de maintenance du système informatique',
      'Réunion importante avec le client demain matin',
      'Formation du personnel sur les nouvelles procédures de sécurité',
      'Rapport financier confidentiel pour le budget 2024',
      'Problème technique sur la piste principale',
      'Réclamation passager concernant les bagages perdus'
    ];
    
    testPhrases.forEach((phrase, index) => {
      console.log(`📝 Phrase ${index + 1}: "${phrase}"`);
      const normalizedPhrase = normalizeText(phrase);
      
      const matches = [];
      tags.forEach(tag => {
        const keywords = generateKeywords(tag.name, tag.description);
        const foundKeywords = keywords.filter(keyword => 
          normalizedPhrase.includes(keyword)
        );
        
        if (foundKeywords.length > 0) {
          const config = tagKeywordsConfig[normalizeText(tag.name)];
          matches.push({
            tag: tag.name,
            keywords: foundKeywords,
            score: foundKeywords.length * (config ? config.weight : 5) / 10
          });
        }
      });
      
      if (matches.length > 0) {
        console.log('   Tags détectés:');
        matches
          .sort((a, b) => b.score - a.score)
          .forEach(match => {
            console.log(`     "${match.tag}" (${match.keywords.join(', ')})`);
          });
      } else {
        console.log('   Aucun tag détecté');
      }
      console.log('');
    });

    console.log('🎉 Test terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le test
testKeywordsMatching();

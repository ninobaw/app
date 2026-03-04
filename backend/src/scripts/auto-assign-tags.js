const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
require('dotenv').config();

// Système de mapping contextuel intelligent
const contextualMapping = {
  'urgent': {
    keywords: ['urgent', 'urgence', 'immédiat', 'priorité', 'critique', 'asap', 'rapidement', 'vite'],
    patterns: [/urgent/i, /priorité/i, /immédiat/i, /critique/i, /asap/i]
  },
  'important': {
    keywords: ['important', 'essentiel', 'crucial', 'majeur', 'significatif', 'capital'],
    patterns: [/important/i, /essentiel/i, /crucial/i, /majeur/i]
  },
  'confidentiel': {
    keywords: ['confidentiel', 'secret', 'privé', 'classé', 'restreint', 'sensible'],
    patterns: [/confidentiel/i, /secret/i, /privé/i, /classé/i, /restreint/i]
  },
  'suivi': {
    keywords: ['suivi', 'follow-up', 'contrôle', 'vérification', 'monitoring', 'surveillance'],
    patterns: [/suivi/i, /follow.?up/i, /contrôle/i, /vérification/i]
  },
  'réunion': {
    keywords: ['réunion', 'meeting', 'assemblée', 'conférence', 'séance', 'comité', 'conseil'],
    patterns: [/réunion/i, /meeting/i, /assemblée/i, /conférence/i, /séance/i]
  },
  'formation': {
    keywords: ['formation', 'training', 'cours', 'apprentissage', 'éducation', 'enseignement', 'stage'],
    patterns: [/formation/i, /training/i, /cours/i, /apprentissage/i, /stage/i]
  },
  'technique': {
    keywords: ['technique', 'technical', 'ingénierie', 'maintenance', 'réparation', 'équipement', 'système', 'technologie'],
    patterns: [/technique/i, /technical/i, /ingénierie/i, /maintenance/i, /équipement/i]
  },
  'administratif': {
    keywords: ['administratif', 'administration', 'bureaucratie', 'procédure', 'formalité', 'dossier', 'document'],
    patterns: [/administratif/i, /administration/i, /procédure/i, /formalité/i]
  },
  'financier': {
    keywords: ['financier', 'finance', 'budget', 'coût', 'prix', 'facture', 'paiement', 'économique', 'comptabilité'],
    patterns: [/financier/i, /finance/i, /budget/i, /coût/i, /prix/i, /facture/i, /paiement/i]
  },
  'rh': {
    keywords: ['rh', 'ressources humaines', 'personnel', 'employé', 'recrutement', 'salaire', 'congé', 'formation du personnel'],
    patterns: [/rh/i, /ressources.?humaines/i, /personnel/i, /employé/i, /recrutement/i, /salaire/i]
  }
};

// Mapping spécialisé pour les entités/organisations
const entityMapping = {
  // Sécurité et forces de l'ordre
  'police': ['urgent', 'confidentiel', 'suivi'],
  'gendarmerie': ['urgent', 'confidentiel', 'suivi'],
  'garde nationale': ['urgent', 'confidentiel', 'suivi'],
  'sûreté': ['urgent', 'confidentiel', 'suivi'],
  'sécurité': ['urgent', 'confidentiel', 'suivi'],
  
  // Administrations
  'douane': ['administratif', 'confidentiel'],
  'ministère': ['important', 'administratif'],
  'préfecture': ['administratif', 'important'],
  'gouvernorat': ['administratif', 'important'],
  'municipalité': ['administratif'],
  'mairie': ['administratif'],
  'wilaya': ['administratif', 'important'],
  
  // Justice
  'tribunal': ['confidentiel', 'important', 'suivi'],
  'cour': ['confidentiel', 'important', 'suivi'],
  'procureur': ['confidentiel', 'urgent', 'suivi'],
  'avocat': ['confidentiel', 'suivi'],
  
  // Finances
  'banque': ['financier', 'confidentiel'],
  'assurance': ['financier', 'administratif'],
  'trésor': ['financier', 'important'],
  'impôts': ['financier', 'administratif'],
  'contrôle financier': ['financier', 'confidentiel'],
  
  // Éducation et formation
  'université': ['formation', 'administratif'],
  'école': ['formation', 'administratif'],
  'institut': ['formation', 'administratif'],
  'centre de formation': ['formation'],
  
  // Santé
  'hôpital': ['urgent', 'important'],
  'clinique': ['urgent', 'important'],
  'médecin': ['important', 'suivi'],
  'urgence': ['urgent', 'important'],
  
  // Aviation et aéroports
  'oaca': ['technique', 'important', 'administratif'],
  'tav': ['technique', 'administratif'],
  'enfidha': ['technique', 'administratif'],
  'monastir': ['technique', 'administratif'],
  'aéroport': ['technique', 'administratif'],
  'aviation civile': ['technique', 'important'],
  'contrôle aérien': ['technique', 'urgent'],
  'tour de contrôle': ['technique', 'urgent'],
  'piste': ['technique', 'urgent'],
  'terminal': ['technique', 'administratif'],
  'bagages': ['technique', 'suivi'],
  'passagers': ['important', 'suivi'],
  'vol': ['technique', 'suivi'],
  'compagnie aérienne': ['technique', 'administratif'],
  'pilote': ['technique', 'important'],
  'équipage': ['technique', 'rh'],
  
  // Technique et maintenance
  'maintenance': ['technique', 'suivi'],
  'réparation': ['technique', 'urgent'],
  'équipement': ['technique', 'suivi'],
  'système': ['technique'],
  'informatique': ['technique'],
  'réseau': ['technique'],
  'serveur': ['technique', 'urgent'],
  
  // Ressources humaines
  'personnel': ['rh', 'administratif'],
  'employé': ['rh', 'administratif'],
  'recrutement': ['rh', 'administratif'],
  'salaire': ['rh', 'financier'],
  'congé': ['rh', 'administratif'],
  'formation du personnel': ['rh', 'formation'],
  'évaluation': ['rh', 'suivi'],
  
  // Environnement et qualité
  'environnement': ['technique', 'suivi'],
  'qualité': ['important', 'suivi'],
  'certification': ['important', 'administratif'],
  'audit': ['important', 'suivi'],
  'inspection': ['important', 'suivi']
};

// Fonction pour analyser le contenu et suggérer des tags
function analyzeContentForTags(content) {
  const suggestedTags = new Set();
  const contentLower = content.toLowerCase();
  
  // 1. Analyse par mots-clés contextuels
  for (const [tagName, config] of Object.entries(contextualMapping)) {
    // Vérifier les mots-clés
    const hasKeyword = config.keywords.some(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    
    // Vérifier les patterns regex
    const hasPattern = config.patterns.some(pattern => 
      pattern.test(content)
    );
    
    if (hasKeyword || hasPattern) {
      suggestedTags.add(tagName);
    }
  }
  
  // 2. Analyse par entités/organisations
  for (const [entity, tags] of Object.entries(entityMapping)) {
    if (contentLower.includes(entity.toLowerCase())) {
      tags.forEach(tag => suggestedTags.add(tag));
    }
  }
  
  return Array.from(suggestedTags);
}

// Fonction pour analyser une correspondance complète
function analyzeCorrespondance(correspondance) {
  let allContent = '';
  
  // Analyser tous les champs textuels
  if (correspondance.subject) allContent += correspondance.subject + ' ';
  if (correspondance.content) allContent += correspondance.content + ' ';
  if (correspondance.from_address) allContent += correspondance.from_address + ' ';
  if (correspondance.to_address) allContent += correspondance.to_address + ' ';
  if (correspondance.description) allContent += correspondance.description + ' ';
  
  return analyzeContentForTags(allContent);
}

async function autoAssignTags() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer tous les tags prédéfinis actifs
    const predefinedTags = await Tag.find({ isActive: true });
    const predefinedTagNames = predefinedTags.map(tag => tag.name);
    console.log(`📋 Tags prédéfinis disponibles: ${predefinedTagNames.join(', ')}`);

    // Récupérer toutes les correspondances
    const correspondances = await Correspondance.find({});
    console.log(`📊 Correspondances à analyser: ${correspondances.length}`);

    let updatedCount = 0;
    let skippedCount = 0;
    let totalTagsAssigned = 0;

    for (const correspondance of correspondances) {
      try {
        // Analyser le contenu pour suggérer des tags
        const suggestedTags = analyzeCorrespondance(correspondance);
        
        // Filtrer uniquement les tags prédéfinis disponibles
        const validTags = suggestedTags.filter(tag => predefinedTagNames.includes(tag));
        
        if (validTags.length === 0) {
          console.log(`⚠️  Aucun tag approprié trouvé pour: "${correspondance.subject || 'Sans sujet'}"`);
          skippedCount++;
          continue;
        }

        // Remplacer les anciens tags par les nouveaux tags prédéfinis
        const oldTags = correspondance.tags || [];
        correspondance.tags = validTags;
        
        await correspondance.save();
        
        console.log(`✅ Correspondance mise à jour: "${correspondance.subject || 'Sans sujet'}"`);
        console.log(`   Anciens tags: [${oldTags.join(', ')}]`);
        console.log(`   Nouveaux tags: [${validTags.join(', ')}]`);
        
        updatedCount++;
        totalTagsAssigned += validTags.length;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de la correspondance ${correspondance._id}:`, error.message);
      }
    }

    console.log('\n📈 Résumé de l\'assignation automatique:');
    console.log(`   • Correspondances analysées: ${correspondances.length}`);
    console.log(`   • Correspondances mises à jour: ${updatedCount}`);
    console.log(`   • Correspondances ignorées: ${skippedCount}`);
    console.log(`   • Total tags assignés: ${totalTagsAssigned}`);
    console.log(`   • Moyenne tags par correspondance: ${updatedCount > 0 ? (totalTagsAssigned / updatedCount).toFixed(1) : 0}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Assignation automatique des tags terminée avec succès !');
      console.log('💡 Les correspondances ont maintenant des tags prédéfinis appropriés');
    } else {
      console.log('\n⚠️  Aucune correspondance mise à jour.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation automatique des tags:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Fonction pour tester l'analyse sur un texte
function testAnalysis(text) {
  console.log(`\n🔍 Test d'analyse pour: "${text}"`);
  const tags = analyzeContentForTags(text);
  console.log(`   Tags suggérés: [${tags.join(', ')}]`);
  return tags;
}

// Tests d'exemple
if (require.main === module) {
  console.log('🚀 Assignation automatique des tags...\n');
  
  // Tests rapides
  console.log('🧪 Tests d\'analyse contextuelle:');
  testAnalysis('Correspondance urgente de la police concernant un incident');
  testAnalysis('Réunion de formation technique prévue la semaine prochaine');
  testAnalysis('Facture confidentielle du ministère des finances');
  testAnalysis('Suivi administratif du dossier de recrutement RH');
  testAnalysis('Maintenance technique des équipements de l\'aéroport d\'Enfidha');
  
  console.log('\n' + '='.repeat(60));
  
  // Exécuter l'assignation automatique
  autoAssignTags();
}

module.exports = { analyzeContentForTags, analyzeCorrespondance, contextualMapping, entityMapping };

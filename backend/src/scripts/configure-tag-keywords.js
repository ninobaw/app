const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Tag = require('../models/Tag');

// Configuration des mots-clés par tag
const tagKeywordsConfig = {
  // Tags administratifs
  'urgent': {
    keywords: ['urgent', 'urgence', 'prioritaire', 'immediat', 'rapidement', 'vite', 'asap', 'critique', 'emergency'],
    weight: 10
  },
  'important': {
    keywords: ['important', 'importance', 'crucial', 'essentiel', 'majeur', 'significatif', 'priorite', 'capital'],
    weight: 8
  },
  'confidentiel': {
    keywords: ['confidentiel', 'secret', 'prive', 'sensible', 'discretion', 'confidentialite', 'interne', 'restreint'],
    weight: 9
  },
  
  // Tags départementaux
  'technique': {
    keywords: ['technique', 'technologie', 'informatique', 'systeme', 'logiciel', 'materiel', 'maintenance', 'it', 'server', 'reseau'],
    weight: 7
  },
  'commercial': {
    keywords: ['commercial', 'vente', 'client', 'contrat', 'facture', 'devis', 'commande', 'marketing', 'prospection', 'negociation'],
    weight: 7
  },
  'rh': {
    keywords: ['ressources humaines', 'personnel', 'employe', 'recrutement', 'formation', 'salaire', 'conge', 'rh', 'staff', 'equipe'],
    weight: 7
  },
  'ressources humaines': {
    keywords: ['ressources humaines', 'personnel', 'employe', 'recrutement', 'formation', 'salaire', 'conge', 'rh', 'staff', 'equipe'],
    weight: 7
  },
  'financier': {
    keywords: ['financier', 'budget', 'comptabilite', 'facture', 'paiement', 'cout', 'depense', 'finance', 'tresorerie', 'investissement'],
    weight: 7
  },
  'juridique': {
    keywords: ['juridique', 'legal', 'contrat', 'clause', 'tribunal', 'avocat', 'procedure', 'droit', 'legislation', 'reglementation'],
    weight: 8
  },
  
  // Tags opérationnels
  'securite': {
    keywords: ['securite', 'protection', 'surveillance', 'incident', 'risque', 'prevention', 'safety', 'accident', 'danger'],
    weight: 9
  },
  'qualite': {
    keywords: ['qualite', 'norme', 'certification', 'audit', 'amelioration', 'controle', 'iso', 'standard', 'excellence'],
    weight: 6
  },
  'formation': {
    keywords: ['formation', 'cours', 'apprentissage', 'competence', 'certification', 'stage', 'education', 'enseignement', 'skill'],
    weight: 6
  },
  'maintenance': {
    keywords: ['maintenance', 'reparation', 'entretien', 'panne', 'dysfonctionnement', 'preventif', 'correctif', 'intervention'],
    weight: 7
  },
  
  // Tags de processus
  'reunion': {
    keywords: ['reunion', 'meeting', 'conference', 'assemblee', 'rendez-vous', 'seance', 'comite', 'conseil', 'briefing'],
    weight: 5
  },
  'rapport': {
    keywords: ['rapport', 'compte-rendu', 'bilan', 'analyse', 'evaluation', 'synthese', 'document', 'etude', 'review'],
    weight: 5
  },
  'projet': {
    keywords: ['projet', 'programme', 'initiative', 'developpement', 'implementation', 'planification', 'roadmap', 'milestone'],
    weight: 6
  },
  'procedure': {
    keywords: ['procedure', 'processus', 'protocole', 'methode', 'instruction', 'workflow', 'etape', 'guide'],
    weight: 6
  },
  
  // Tags relationnels
  'client': {
    keywords: ['client', 'clientele', 'service client', 'satisfaction', 'reclamation', 'customer', 'usager', 'beneficiaire'],
    weight: 7
  },
  'fournisseur': {
    keywords: ['fournisseur', 'prestataire', 'partenaire', 'sous-traitant', 'livraison', 'supplier', 'vendor', 'contractant'],
    weight: 6
  },
  
  // Tags spécifiques aéroportuaires
  'aviation': {
    keywords: ['aviation', 'aerien', 'vol', 'avion', 'aeronef', 'pilote', 'equipage', 'compagnie aerienne', 'flight'],
    weight: 8
  },
  'piste': {
    keywords: ['piste', 'runway', 'atterrissage', 'decollage', 'taxiway', 'aire de stationnement', 'tarmac'],
    weight: 8
  },
  'passager': {
    keywords: ['passager', 'voyageur', 'passenger', 'terminal', 'embarquement', 'debarquement', 'baggage'],
    weight: 7
  },
  'douane': {
    keywords: ['douane', 'customs', 'controle', 'declaration', 'import', 'export', 'frontiere', 'inspection'],
    weight: 8
  },
  'meteo': {
    keywords: ['meteo', 'meteorologie', 'temps', 'climat', 'vent', 'visibilite', 'weather', 'forecast'],
    weight: 7
  }
};

async function configureTagKeywords() {
  try {
    console.log('🔧 Configuration des mots-clés pour les tags...\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie\n');

    // Récupérer tous les tags
    const tags = await Tag.find({}).select('name description');
    console.log(`📋 ${tags.length} tag(s) trouvé(s) en base\n`);

    // Analyser et suggérer des configurations
    console.log('🔍 ANALYSE DES TAGS EXISTANTS:\n');
    
    let configuredCount = 0;
    let suggestionsCount = 0;

    for (const tag of tags) {
      const normalizedName = tag.name.toLowerCase().trim();
      
      if (tagKeywordsConfig[normalizedName]) {
        const config = tagKeywordsConfig[normalizedName];
        console.log(`✅ Tag "${tag.name}" - Configuration trouvée:`);
        console.log(`   Mots-clés: ${config.keywords.slice(0, 5).join(', ')}${config.keywords.length > 5 ? '...' : ''}`);
        console.log(`   Poids: ${config.weight}/10`);
        console.log(`   Total mots-clés: ${config.keywords.length}\n`);
        configuredCount++;
      } else {
        console.log(`⚠️  Tag "${tag.name}" - Pas de configuration spécifique`);
        
        // Suggérer des mots-clés basés sur le nom et la description
        const suggestions = [];
        suggestions.push(normalizedName);
        
        if (tag.description) {
          const descWords = tag.description.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(' ')
            .filter(word => word.length > 3);
          suggestions.push(...descWords.slice(0, 3));
        }
        
        console.log(`   Suggestions: ${suggestions.join(', ')}`);
        console.log(`   Description: ${tag.description || 'Aucune'}\n`);
        suggestionsCount++;
      }
    }

    // Statistiques
    console.log('📊 STATISTIQUES:');
    console.log(`  Tags avec configuration: ${configuredCount}`);
    console.log(`  Tags nécessitant configuration: ${suggestionsCount}`);
    console.log(`  Couverture: ${((configuredCount / tags.length) * 100).toFixed(1)}%\n`);

    // Afficher les configurations disponibles non utilisées
    const unusedConfigs = Object.keys(tagKeywordsConfig).filter(configName => 
      !tags.some(tag => tag.name.toLowerCase().trim() === configName)
    );

    if (unusedConfigs.length > 0) {
      console.log('💡 CONFIGURATIONS DISPONIBLES NON UTILISÉES:');
      unusedConfigs.forEach(configName => {
        const config = tagKeywordsConfig[configName];
        console.log(`  "${configName}": ${config.keywords.slice(0, 3).join(', ')}... (${config.keywords.length} mots-clés)`);
      });
      console.log('\n💡 Créez ces tags dans l\'interface pour utiliser ces configurations\n');
    }

    // Exporter la configuration pour utilisation
    console.log('📤 EXPORT DE LA CONFIGURATION:');
    console.log('La configuration des mots-clés est maintenant disponible pour l\'auto-tagging');
    
    // Sauvegarder dans un fichier JSON pour référence
    const fs = require('fs');
    const configPath = './tag-keywords-config.json';
    fs.writeFileSync(configPath, JSON.stringify(tagKeywordsConfig, null, 2));
    console.log(`✅ Configuration sauvegardée dans: ${configPath}`);

    console.log('\n🎉 Configuration terminée !');
    console.log('💡 Vous pouvez maintenant exécuter l\'auto-tagging avec ces configurations');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exporter la configuration pour utilisation dans d'autres scripts
module.exports = { tagKeywordsConfig };

// Exécuter si appelé directement
if (require.main === module) {
  configureTagKeywords();
}

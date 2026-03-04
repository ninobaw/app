const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
const { 
  calculateTagRelevance, 
  analyzeCorrespondanceContext, 
  extractKeywords 
} = require('./smart-tag-assignment');
require('dotenv').config();

async function testSmartAnalysis() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer tous les tags actifs
    const tags = await Tag.getActiveTags();
    console.log(`📋 Tags disponibles: ${tags.length}`);
    
    if (tags.length === 0) {
      console.log('⚠️  Aucun tag trouvé. Exécutez d\'abord init-default-tags.js');
      process.exit(1);
    }

    // Afficher les tags disponibles
    console.log('\n🏷️  Tags dans la base de données:');
    tags.forEach((tag, index) => {
      console.log(`   ${index + 1}. "${tag.name}" - ${tag.description || 'Pas de description'}`);
    });

    // Tests avec des exemples de correspondances
    console.log('\n🧪 TESTS D\'ANALYSE INTELLIGENTE:');
    console.log('=' .repeat(60));

    const testCases = [
      {
        subject: 'Correspondance urgente de la police nationale',
        content: 'Incident de sécurité à l\'aéroport nécessitant une intervention immédiate',
        from_address: 'police.nationale@interieur.tn',
        to_address: 'securite@enfidha-airport.tn'
      },
      {
        subject: 'Réunion de formation technique',
        content: 'Formation sur les nouveaux équipements de maintenance des systèmes aéroportuaires',
        from_address: 'formation@tav.aero',
        to_address: 'personnel.technique@enfidha-airport.tn'
      },
      {
        subject: 'Facture services financiers',
        content: 'Facture pour les services de comptabilité et gestion budgétaire du mois',
        from_address: 'comptabilite@ministere-finance.tn',
        to_address: 'finance@enfidha-airport.tn'
      },
      {
        subject: 'Procédure administrative douane',
        content: 'Nouvelle procédure pour l\'importation d\'équipements administratifs',
        from_address: 'douane@douane.tn',
        to_address: 'administration@enfidha-airport.tn'
      },
      {
        subject: 'Recrutement personnel RH',
        content: 'Processus de recrutement pour le poste d\'agent ressources humaines',
        from_address: 'rh@tav.aero',
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
      
      // Calculer les scores pour tous les tags
      const tagScores = tags.map(tag => ({
        name: tag.name,
        description: tag.description,
        score: calculateTagRelevance(context, tag)
      })).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
      
      console.log(`   📊 Scores calculés:`);
      if (tagScores.length > 0) {
        tagScores.slice(0, 5).forEach(item => {
          console.log(`     • ${item.name}: ${item.score.toFixed(1)} points`);
        });
        
        // Tags recommandés (score > 15)
        const recommendedTags = tagScores.filter(item => item.score >= 15).slice(0, 3);
        console.log(`   ✅ Tags recommandés: [${recommendedTags.map(t => t.name).join(', ')}]`);
      } else {
        console.log(`     ⚠️  Aucun tag pertinent trouvé`);
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
        
        const tagScores = tags.map(tag => ({
          name: tag.name,
          score: calculateTagRelevance(context, tag)
        })).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        
        if (tagScores.length > 0) {
          console.log(`   📊 Top 5 scores:`);
          tagScores.forEach(item => {
            console.log(`     • ${item.name}: ${item.score.toFixed(1)} points`);
          });
          
          const recommendedTags = tagScores.filter(item => item.score >= 15).slice(0, 3);
          console.log(`   ✅ Tags recommandés: [${recommendedTags.map(t => t.name).join(', ')}]`);
          
          if (recommendedTags.length > 0) {
            const currentTags = corr.tags || [];
            const newTags = recommendedTags.map(t => t.name);
            console.log(`   🔄 Changement: [${currentTags.join(', ')}] → [${newTags.join(', ')}]`);
          }
        } else {
          console.log(`   ⚠️  Aucun tag pertinent trouvé`);
        }
      }
    }

    // Statistiques prévisionnelles
    console.log('\n\n📊 STATISTIQUES PRÉVISIONNELLES:');
    console.log('=' .repeat(40));

    const allCorrespondances = await Correspondance.find({});
    let wouldBeUpdated = 0;
    let wouldBeSkipped = 0;
    let totalTagsWouldBeAssigned = 0;
    const tagUsagePreview = {};

    allCorrespondances.forEach(corr => {
      const context = analyzeCorrespondanceContext(corr);
      const tagScores = tags.map(tag => ({
        name: tag.name,
        score: calculateTagRelevance(context, tag)
      })).filter(item => item.score >= 15).slice(0, 3);
      
      if (tagScores.length > 0) {
        wouldBeUpdated++;
        totalTagsWouldBeAssigned += tagScores.length;
        tagScores.forEach(item => {
          tagUsagePreview[item.name] = (tagUsagePreview[item.name] || 0) + 1;
        });
      } else {
        wouldBeSkipped++;
      }
    });

    console.log(`   • Total correspondances: ${allCorrespondances.length}`);
    console.log(`   • Seraient mises à jour: ${wouldBeUpdated}`);
    console.log(`   • Seraient ignorées: ${wouldBeSkipped}`);
    console.log(`   • Total tags à assigner: ${totalTagsWouldBeAssigned}`);
    console.log(`   • Moyenne tags par correspondance: ${wouldBeUpdated > 0 ? (totalTagsWouldBeAssigned / wouldBeUpdated).toFixed(1) : 0}`);

    if (Object.keys(tagUsagePreview).length > 0) {
      console.log('\n📈 Prévision d\'utilisation des tags:');
      Object.entries(tagUsagePreview)
        .sort(([,a], [,b]) => b - a)
        .forEach(([tag, count]) => {
          console.log(`   • ${tag}: ${count} fois`);
        });
    }

    console.log('\n🎯 RECOMMANDATION:');
    if (wouldBeUpdated > 0) {
      console.log(`✅ Le système peut traiter ${wouldBeUpdated} correspondances sur ${allCorrespondances.length}`);
      console.log('💡 Vous pouvez exécuter smart-tag-assignment.js pour appliquer les changements');
    } else {
      console.log('⚠️  Aucune correspondance ne peut être traitée automatiquement');
      console.log('💡 Vérifiez le contenu des correspondances ou ajustez les seuils de pertinence');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
console.log('🧪 TEST D\'ANALYSE INTELLIGENTE DES TAGS\n');
testSmartAnalysis();

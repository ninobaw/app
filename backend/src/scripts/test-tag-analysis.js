const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const Tag = require('../models/Tag');
const { analyzeContentForTags, analyzeCorrespondance } = require('./auto-assign-tags');
require('dotenv').config();

async function testTagAnalysis() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion à MongoDB établie');

    // Récupérer les tags prédéfinis
    const predefinedTags = await Tag.find({ isActive: true });
    const predefinedTagNames = predefinedTags.map(tag => tag.name);
    console.log(`📋 Tags prédéfinis: ${predefinedTagNames.join(', ')}\n`);

    // Tests avec des exemples de texte
    console.log('🧪 TESTS D\'ANALYSE CONTEXTUELLE:');
    console.log('=' .repeat(50));

    const testCases = [
      {
        title: 'Correspondance de police urgente',
        content: 'Correspondance urgente de la police nationale concernant un incident de sécurité à l\'aéroport'
      },
      {
        title: 'Réunion de formation',
        content: 'Invitation à une réunion de formation technique sur les nouveaux équipements'
      },
      {
        title: 'Facture confidentielle',
        content: 'Facture confidentielle du ministère des finances pour les services rendus'
      },
      {
        title: 'Suivi RH',
        content: 'Suivi du dossier de recrutement du personnel administratif - ressources humaines'
      },
      {
        title: 'Maintenance technique',
        content: 'Rapport de maintenance technique des systèmes de l\'aéroport d\'Enfidha'
      },
      {
        title: 'Correspondance douane',
        content: 'Procédure administrative de la douane tunisienne pour l\'importation d\'équipements'
      },
      {
        title: 'Tribunal important',
        content: 'Convocation importante du tribunal de première instance de Sousse'
      },
      {
        title: 'Formation universitaire',
        content: 'Programme de formation continue en partenariat avec l\'université de Monastir'
      }
    ];

    testCases.forEach((testCase, index) => {
      console.log(`\n${index + 1}. ${testCase.title}`);
      console.log(`   Contenu: "${testCase.content}"`);
      const suggestedTags = analyzeContentForTags(testCase.content);
      const validTags = suggestedTags.filter(tag => predefinedTagNames.includes(tag));
      console.log(`   Tags suggérés: [${validTags.join(', ')}]`);
    });

    // Test sur des vraies correspondances (échantillon)
    console.log('\n\n🔍 ANALYSE D\'ÉCHANTILLON DE CORRESPONDANCES RÉELLES:');
    console.log('=' .repeat(60));

    const sampleCorrespondances = await Correspondance.find({}).limit(5);
    
    if (sampleCorrespondances.length === 0) {
      console.log('⚠️  Aucune correspondance trouvée dans la base de données');
    } else {
      sampleCorrespondances.forEach((corr, index) => {
        console.log(`\n${index + 1}. Correspondance: "${corr.subject || 'Sans sujet'}"`);
        console.log(`   De: ${corr.from_address || 'Non spécifié'}`);
        console.log(`   À: ${corr.to_address || 'Non spécifié'}`);
        console.log(`   Tags actuels: [${(corr.tags || []).join(', ')}]`);
        
        const suggestedTags = analyzeCorrespondance(corr);
        const validTags = suggestedTags.filter(tag => predefinedTagNames.includes(tag));
        console.log(`   Tags suggérés: [${validTags.join(', ')}]`);
        
        if (validTags.length > 0) {
          console.log(`   ✅ Changement recommandé: ${(corr.tags || []).join(', ')} → ${validTags.join(', ')}`);
        } else {
          console.log(`   ⚠️  Aucun tag approprié trouvé`);
        }
      });
    }

    // Statistiques prévisionnelles
    console.log('\n\n📊 STATISTIQUES PRÉVISIONNELLES:');
    console.log('=' .repeat(40));

    const allCorrespondances = await Correspondance.find({});
    let wouldBeUpdated = 0;
    let wouldBeSkipped = 0;
    let totalTagsWouldBeAssigned = 0;

    allCorrespondances.forEach(corr => {
      const suggestedTags = analyzeCorrespondance(corr);
      const validTags = suggestedTags.filter(tag => predefinedTagNames.includes(tag));
      
      if (validTags.length > 0) {
        wouldBeUpdated++;
        totalTagsWouldBeAssigned += validTags.length;
      } else {
        wouldBeSkipped++;
      }
    });

    console.log(`   • Total correspondances: ${allCorrespondances.length}`);
    console.log(`   • Seraient mises à jour: ${wouldBeUpdated}`);
    console.log(`   • Seraient ignorées: ${wouldBeSkipped}`);
    console.log(`   • Total tags à assigner: ${totalTagsWouldBeAssigned}`);
    console.log(`   • Moyenne tags par correspondance: ${wouldBeUpdated > 0 ? (totalTagsWouldBeAssigned / wouldBeUpdated).toFixed(1) : 0}`);

    console.log('\n🎯 RECOMMANDATION:');
    if (wouldBeUpdated > 0) {
      console.log(`✅ Le script peut traiter ${wouldBeUpdated} correspondances sur ${allCorrespondances.length}`);
      console.log('💡 Vous pouvez exécuter auto-assign-tags.bat pour appliquer les changements');
    } else {
      console.log('⚠️  Aucune correspondance ne peut être traitée automatiquement');
      console.log('💡 Vérifiez le contenu des correspondances ou ajustez les règles d\'analyse');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
console.log('🧪 TEST D\'ANALYSE DES TAGS\n');
testTagAnalysis();

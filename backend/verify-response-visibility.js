const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');

/**
 * Script pour vérifier la visibilité des réponses et donner des instructions
 */

async function verifyResponseVisibility() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 VÉRIFICATION VISIBILITÉ RÉPONSES');
    console.log('🔍 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. STATISTIQUES ACTUELLES
    console.log('📊 === STATISTIQUES ACTUELLES ===');
    
    const totalCorrespondances = await Correspondance.countDocuments({});
    const incomingCorrespondances = await Correspondance.countDocuments({ type: 'INCOMING' });
    const outgoingCorrespondances = await Correspondance.countDocuments({ type: 'OUTGOING' });
    const responseCorrespondances = await Correspondance.countDocuments({ 
      parentCorrespondanceId: { $exists: true } 
    });

    console.log(`📋 Total correspondances: ${totalCorrespondances}`);
    console.log(`📥 INCOMING: ${incomingCorrespondances}`);
    console.log(`📤 OUTGOING: ${outgoingCorrespondances}`);
    console.log(`🔗 Réponses (avec parent): ${responseCorrespondances}\n`);

    // 2. LISTER LES RÉPONSES EXISTANTES
    console.log('📤 === RÉPONSES EXISTANTES ===');
    
    const responses = await Correspondance.find({ 
      parentCorrespondanceId: { $exists: true } 
    })
    .populate('parentCorrespondanceId', 'title subject code type')
    .sort({ createdAt: -1 })
    .lean();

    if (responses.length === 0) {
      console.log('❌ Aucune réponse trouvée');
    } else {
      console.log(`✅ ${responses.length} réponse(s) trouvée(s):\n`);
      
      responses.forEach((response, index) => {
        console.log(`📤 Réponse ${index + 1}:`);
        console.log(`   Titre: ${response.title}`);
        console.log(`   Type: ${response.type}`);
        console.log(`   Code: ${response.code}`);
        console.log(`   Parent: ${response.parentCorrespondanceId?.title} (${response.parentCorrespondanceId?.type})`);
        console.log(`   Créée: ${new Date(response.createdAt).toLocaleString('fr-FR')}`);
        console.log('');
      });
    }

    // 3. SIMULATION FILTRES FRONTEND
    console.log('🎯 === SIMULATION FILTRES FRONTEND ===');
    
    // Toutes les correspondances (includeReplies=true)
    const allCorrespondances = await Correspondance.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`📋 Toutes les correspondances: ${allCorrespondances.length}`);
    
    // Filtre INCOMING seulement
    const incomingOnly = allCorrespondances.filter(c => c.type === 'INCOMING');
    console.log(`📥 Avec filtre INCOMING: ${incomingOnly.length}`);
    
    // Filtre OUTGOING seulement
    const outgoingOnly = allCorrespondances.filter(c => c.type === 'OUTGOING');
    console.log(`📤 Avec filtre OUTGOING: ${outgoingOnly.length}`);
    
    // Réponses dans chaque filtre
    const responsesInIncoming = incomingOnly.filter(c => c.parentCorrespondanceId);
    const responsesInOutgoing = outgoingOnly.filter(c => c.parentCorrespondanceId);
    
    console.log(`🔗 Réponses visibles avec filtre INCOMING: ${responsesInIncoming.length}`);
    console.log(`🔗 Réponses visibles avec filtre OUTGOING: ${responsesInOutgoing.length}\n`);

    // 4. DIAGNOSTIC DU PROBLÈME
    console.log('🚨 === DIAGNOSTIC DU PROBLÈME ===');
    
    if (responseCorrespondances > 0) {
      console.log('✅ Des réponses existent dans la base de données');
      
      if (responsesInOutgoing.length > 0) {
        console.log('✅ Les réponses sont de type OUTGOING (correct)');
        console.log('⚠️ PROBLÈME IDENTIFIÉ: Filtre de type sur le frontend !');
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('   1. Dans l\'interface, assurez-vous que le filtre de type est sur "Tous"');
        console.log('   2. Ou sélectionnez "OUTGOING" pour voir les réponses');
        console.log('   3. Les réponses n\'apparaissent PAS avec le filtre "INCOMING"');
      } else {
        console.log('⚠️ Les réponses ne sont pas de type OUTGOING');
      }
    } else {
      console.log('❌ Aucune réponse dans la base de données');
      console.log('💡 Utilisez create-test-response.js pour créer une réponse de test');
    }

    // 5. INSTRUCTIONS DÉTAILLÉES
    console.log('\n📋 === INSTRUCTIONS POUR L\'UTILISATEUR ===');
    console.log('');
    console.log('🎯 POUR VOIR LES RÉPONSES DANS L\'INTERFACE:');
    console.log('');
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│                   ÉTAPES À SUIVRE                  │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log('│ 1. Ouvrir la page Correspondances                  │');
    console.log('│ 2. Regarder les filtres en haut de la page         │');
    console.log('│ 3. Dans le filtre "Type", sélectionner:            │');
    console.log('│    • "Tous" pour voir toutes les correspondances   │');
    console.log('│    • "OUTGOING" pour voir seulement les réponses   │');
    console.log('│ 4. Les réponses apparaîtront dans la liste         │');
    console.log('│                                                     │');
    console.log('│ ⚠️  IMPORTANT:                                      │');
    console.log('│ Les réponses sont de type OUTGOING                 │');
    console.log('│ Elles ne s\'affichent PAS avec le filtre INCOMING   │');
    console.log('└─────────────────────────────────────────────────────┘');

    if (responses.length > 0) {
      console.log('\n🔍 RÉPONSES À RECHERCHER:');
      responses.forEach((response, index) => {
        console.log(`   ${index + 1}. "${response.title}" (Code: ${response.code})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

verifyResponseVisibility();

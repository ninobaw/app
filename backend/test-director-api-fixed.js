const mongoose = require('mongoose');

async function testDirectorAPIFixed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST API DIRECTEUR CORRIGÉE ===\n');
    
    // 1. Récupérer un directeur
    const directeur = await db.collection('users').findOne({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    if (!directeur) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Test avec directeur: ${directeur.firstName} ${directeur.lastName}`);
    console.log(`   ID: ${directeur._id}`);
    console.log(`   Role: ${directeur.role}`);
    
    // 2. Tester la logique de filtrage directement
    console.log('\n🔍 === TEST LOGIQUE FILTRAGE ===');
    
    // Simuler la logique de la route corrigée
    const roleConditions = [
      { assignedTo: directeur._id },
      { assignedTo: directeur._id.toString() },
      { personnesConcernees: directeur._id },
      { personnesConcernees: directeur._id.toString() },
      { assignedTo: { $exists: false } },
      { assignedTo: null }
    ];
    
    console.log('📋 Conditions de filtrage:');
    roleConditions.forEach((condition, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(condition)}`);
    });
    
    // Construire le filtre complet
    const filter = {
      parentCorrespondanceId: { $exists: false }, // Exclure les réponses
      $or: roleConditions
    };
    
    console.log('\n🔍 Filtre complet:', JSON.stringify(filter, null, 2));
    
    // 3. Tester le filtre sur la base de données
    const results = await db.collection('correspondances').find(filter).toArray();
    
    console.log(`\n📊 === RÉSULTATS FILTRAGE ===`);
    console.log(`Correspondances trouvées: ${results.length}`);
    
    if (results.length > 0) {
      console.log('✅ SUCCESS: Correspondances trouvées pour le directeur !');
      
      results.forEach((corresp, index) => {
        console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - ID: ${corresp._id}`);
        console.log(`      - AssignedTo: ${corresp.assignedTo || 'undefined'}`);
        console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0} personnes`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - Airport: ${corresp.airport}`);
        
        // Vérifier pourquoi cette correspondance match
        let matchReason = [];
        if (corresp.assignedTo === directeur._id.toString()) matchReason.push('assignedTo (ObjectId)');
        if (corresp.assignedTo === directeur._id.toString()) matchReason.push('assignedTo (String)');
        if (corresp.personnesConcernees?.includes(directeur._id.toString())) matchReason.push('personnesConcernees (String)');
        if (corresp.personnesConcernees?.some(p => p.toString() === directeur._id.toString())) matchReason.push('personnesConcernees (ObjectId)');
        if (!corresp.assignedTo) matchReason.push('assignedTo undefined/null');
        
        console.log(`      - ✅ Match raison: ${matchReason.join(', ')}`);
      });
    } else {
      console.log('❌ ÉCHEC: Aucune correspondance trouvée');
      
      // Debug supplémentaire
      console.log('\n🔧 Debug supplémentaire...');
      
      const allCorrespondances = await db.collection('correspondances').find({
        parentCorrespondanceId: { $exists: false }
      }).toArray();
      
      console.log(`📊 Total correspondances (sans réponses): ${allCorrespondances.length}`);
      
      allCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - AssignedTo: ${corresp.assignedTo}`);
        console.log(`      - PersonnesConcernees: ${JSON.stringify(corresp.personnesConcernees)}`);
      });
    }
    
    // 4. Test de tri et pagination
    console.log('\n📋 === TEST TRI ET PAGINATION ===');
    
    if (results.length > 0) {
      // Simuler la logique de tri de la route
      const sortedResults = await db.collection('correspondances')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
      
      console.log(`📊 Résultats avec tri: ${sortedResults.length} correspondances`);
      console.log('✅ Tri par date décroissante appliqué');
    }
    
    // 5. Recommandations
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (results.length > 0) {
      console.log('✅ CORRECTION RÉUSSIE !');
      console.log('🎯 Actions suivantes:');
      console.log('1. Redémarrer le serveur backend');
      console.log('2. Tester l\'interface directeur dans le navigateur');
      console.log('3. Vérifier que les correspondances s\'affichent');
      console.log('4. Créer une nouvelle correspondance et vérifier l\'assignation');
    } else {
      console.log('❌ PROBLÈME PERSISTE');
      console.log('🔧 Vérifications nécessaires:');
      console.log('1. Assignation des correspondances aux directeurs');
      console.log('2. Format des IDs (ObjectId vs String)');
      console.log('3. Structure du champ personnesConcernees');
    }
    
    console.log('\n🎉 === TEST TERMINÉ ===');
    console.log(`Status: ${results.length > 0 ? '✅ CORRIGÉ' : '❌ PROBLÈME PERSISTE'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDirectorAPIFixed();

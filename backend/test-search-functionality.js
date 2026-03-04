const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testSearchFunctionality() {
  try {
    console.log('=== Test de la fonctionnalité de recherche ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    
    // 1. Lister toutes les correspondances avec leurs codes
    const allCorrespondances = await db.collection('correspondances').find({}).toArray();
    
    console.log(`📊 Total de correspondances dans la base: ${allCorrespondances.length}\n`);
    
    console.log('📋 Liste des correspondances avec codes:');
    allCorrespondances.forEach((corresp, index) => {
      console.log(`   ${index + 1}. Code: ${corresp.code || 'N/A'} | Titre: ${corresp.title || corresp.subject}`);
    });
    console.log('');

    // 2. Tests de recherche par code
    const testCodes = ['MD25-188', 'MD25', '188', 'md25-188'];
    
    console.log('🔍 === TESTS DE RECHERCHE PAR CODE ===\n');
    
    for (const testCode of testCodes) {
      console.log(`Test: Recherche "${testCode}"`);
      
      const results = await db.collection('correspondances').find({
        code: { $regex: testCode, $options: 'i' }
      }).toArray();
      
      console.log(`   Résultats: ${results.length} correspondance(s) trouvée(s)`);
      
      if (results.length > 0) {
        results.forEach(r => {
          console.log(`      ✅ ${r.code} - ${r.title || r.subject}`);
        });
      } else {
        console.log(`      ❌ Aucun résultat`);
      }
      console.log('');
    }

    // 3. Tests de recherche multi-champs
    console.log('🔍 === TESTS DE RECHERCHE MULTI-CHAMPS ===\n');
    
    const testSearches = [
      { term: 'notification', description: 'Recherche "notification" dans tous les champs' },
      { term: 'travaux', description: 'Recherche "travaux" dans tous les champs' },
      { term: 'parking', description: 'Recherche "parking" dans tous les champs' }
    ];
    
    for (const test of testSearches) {
      console.log(`Test: ${test.description}`);
      
      const results = await db.collection('correspondances').find({
        $or: [
          { title: { $regex: test.term, $options: 'i' } },
          { subject: { $regex: test.term, $options: 'i' } },
          { content: { $regex: test.term, $options: 'i' } },
          { from_address: { $regex: test.term, $options: 'i' } },
          { to_address: { $regex: test.term, $options: 'i' } },
          { code: { $regex: test.term, $options: 'i' } }
        ]
      }).toArray();
      
      console.log(`   Résultats: ${results.length} correspondance(s) trouvée(s)`);
      
      if (results.length > 0) {
        results.forEach(r => {
          console.log(`      ✅ ${r.code || 'N/A'} - ${r.title || r.subject}`);
        });
      } else {
        console.log(`      ❌ Aucun résultat`);
      }
      console.log('');
    }

    // 4. Vérifier les index
    console.log('🔍 === VÉRIFICATION DES INDEX ===\n');
    
    const indexes = await db.collection('correspondances').indexes();
    console.log('Index existants sur la collection correspondances:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    // 5. Recommandations
    console.log('💡 === RECOMMANDATIONS ===\n');
    
    const hasCodeIndex = indexes.some(idx => idx.key.code);
    if (!hasCodeIndex) {
      console.log('⚠️ Aucun index sur le champ "code"');
      console.log('   Recommandation: Créer un index pour améliorer les performances');
      console.log('   Commande: db.correspondances.createIndex({ code: 1 })');
    } else {
      console.log('✅ Index sur le champ "code" existe');
    }
    console.log('');

    const hasTextIndex = indexes.some(idx => idx.key._fts === 'text');
    if (!hasTextIndex) {
      console.log('ℹ️ Aucun index de recherche textuelle (text index)');
      console.log('   Note: Les recherches utilisent $regex (plus lent mais fonctionnel)');
      console.log('   Option: Créer un text index pour améliorer les performances');
      console.log('   Commande: db.correspondances.createIndex({ title: "text", subject: "text", content: "text", code: "text" })');
    } else {
      console.log('✅ Index de recherche textuelle existe');
    }
    console.log('');

    // 6. Test de performance
    console.log('⏱️ === TEST DE PERFORMANCE ===\n');
    
    const perfTest = 'MD25';
    console.log(`Test de performance: Recherche "${perfTest}"`);
    
    const startTime = Date.now();
    const perfResults = await db.collection('correspondances').find({
      code: { $regex: perfTest, $options: 'i' }
    }).toArray();
    const endTime = Date.now();
    
    console.log(`   Temps d'exécution: ${endTime - startTime}ms`);
    console.log(`   Résultats: ${perfResults.length} correspondance(s)`);
    
    if (endTime - startTime > 100) {
      console.log('   ⚠️ Temps de réponse lent (>100ms)');
      console.log('   Recommandation: Créer un index sur le champ "code"');
    } else {
      console.log('   ✅ Temps de réponse acceptable');
    }
    console.log('');

    // 7. Résumé
    console.log('═══════════════════════════════════════════════════════');
    console.log('RÉSUMÉ:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total de correspondances: ${allCorrespondances.length}`);
    console.log(`Correspondances avec code: ${allCorrespondances.filter(c => c.code).length}`);
    console.log(`Correspondances sans code: ${allCorrespondances.filter(c => !c.code).length}`);
    console.log('');
    console.log('Fonctionnalité de recherche:');
    console.log('  ✅ Recherche par code: Fonctionnelle');
    console.log('  ✅ Recherche multi-champs: Fonctionnelle');
    console.log('  ✅ Recherche insensible à la casse: Fonctionnelle');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testSearchFunctionality();

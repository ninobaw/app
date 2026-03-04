const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function debugCorrespondance() {
  try {
    console.log('=== Debug de la correspondance MD25-188 ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    
    // 1. Trouver la correspondance MD25-188
    const correspondance = await db.collection('correspondances').findOne({
      code: 'MD25-188'
    });

    if (!correspondance) {
      console.log('❌ Correspondance MD25-188 non trouvée');
      return;
    }

    console.log('📋 Détails de la correspondance MD25-188:\n');
    console.log('ID:', correspondance._id);
    console.log('Code:', correspondance.code);
    console.log('Titre:', correspondance.title);
    console.log('Type:', correspondance.type);
    console.log('Status:', correspondance.status);
    console.log('Airport:', correspondance.airport);
    console.log('Priority:', correspondance.priority);
    console.log('');
    
    console.log('🔍 Champs critiques pour la recherche:\n');
    console.log('parentCorrespondanceId:', correspondance.parentCorrespondanceId || 'undefined');
    console.log('assignedTo:', correspondance.assignedTo || 'undefined');
    console.log('personnesConcernees:', correspondance.personnesConcernees || []);
    console.log('');

    // 2. Simuler le filtre pour SUPERVISEUR_BUREAU_ORDRE
    console.log('🧪 Simulation du filtre pour SUPERVISEUR_BUREAU_ORDRE:\n');
    
    // Filtre de base (sans recherche)
    const baseFilter = {
      parentCorrespondanceId: { $exists: false }
    };
    
    console.log('Filtre de base (sans recherche):');
    console.log(JSON.stringify(baseFilter, null, 2));
    
    const baseResults = await db.collection('correspondances').find(baseFilter).toArray();
    console.log(`Résultats: ${baseResults.length} correspondance(s)`);
    console.log('');

    // Filtre avec recherche par code
    const searchFilter = {
      parentCorrespondanceId: { $exists: false },
      $or: [
        { title: { $regex: 'MD25-188', $options: 'i' } },
        { subject: { $regex: 'MD25-188', $options: 'i' } },
        { content: { $regex: 'MD25-188', $options: 'i' } },
        { from_address: { $regex: 'MD25-188', $options: 'i' } },
        { to_address: { $regex: 'MD25-188', $options: 'i' } },
        { code: { $regex: 'MD25-188', $options: 'i' } }
      ]
    };
    
    console.log('Filtre avec recherche "MD25-188":');
    console.log(JSON.stringify(searchFilter, null, 2));
    
    const searchResults = await db.collection('correspondances').find(searchFilter).toArray();
    console.log(`Résultats: ${searchResults.length} correspondance(s)`);
    
    if (searchResults.length > 0) {
      console.log('✅ La correspondance est trouvée avec ce filtre');
      searchResults.forEach(r => {
        console.log(`   - ${r.code}: ${r.title}`);
      });
    } else {
      console.log('❌ La correspondance N\'EST PAS trouvée avec ce filtre');
      console.log('');
      console.log('🔍 Diagnostic:');
      
      // Vérifier si c'est à cause de parentCorrespondanceId
      if (correspondance.parentCorrespondanceId) {
        console.log('   ❌ PROBLÈME: La correspondance a un parentCorrespondanceId');
        console.log(`      parentCorrespondanceId: ${correspondance.parentCorrespondanceId}`);
        console.log('      → Elle est considérée comme une réponse et est exclue par défaut');
        console.log('');
        console.log('   💡 Solution: Ajouter includeReplies=true à la requête');
        console.log('      GET /api/correspondances?search=MD25-188&includeReplies=true');
      } else {
        console.log('   ✅ La correspondance n\'a pas de parentCorrespondanceId');
        console.log('   🔍 Vérification si le code correspond...');
        
        const codeMatch = /MD25-188/i.test(correspondance.code);
        console.log(`      Code "${correspondance.code}" correspond à "MD25-188": ${codeMatch}`);
      }
    }
    console.log('');

    // 3. Test sans le filtre parentCorrespondanceId
    console.log('🧪 Test SANS le filtre parentCorrespondanceId:\n');
    
    const noParentFilter = {
      $or: [
        { title: { $regex: 'MD25-188', $options: 'i' } },
        { subject: { $regex: 'MD25-188', $options: 'i' } },
        { content: { $regex: 'MD25-188', $options: 'i' } },
        { from_address: { $regex: 'MD25-188', $options: 'i' } },
        { to_address: { $regex: 'MD25-188', $options: 'i' } },
        { code: { $regex: 'MD25-188', $options: 'i' } }
      ]
    };
    
    const noParentResults = await db.collection('correspondances').find(noParentFilter).toArray();
    console.log(`Résultats: ${noParentResults.length} correspondance(s)`);
    
    if (noParentResults.length > 0) {
      console.log('✅ La correspondance est trouvée SANS le filtre parentCorrespondanceId');
      console.log('   → Le problème vient du filtre parentCorrespondanceId');
    }
    console.log('');

    // 4. Recommandations
    console.log('═══════════════════════════════════════════════════════');
    console.log('DIAGNOSTIC:');
    console.log('═══════════════════════════════════════════════════════');
    
    if (correspondance.parentCorrespondanceId) {
      console.log('❌ PROBLÈME IDENTIFIÉ:');
      console.log('   La correspondance MD25-188 a un parentCorrespondanceId');
      console.log('   Elle est donc considérée comme une réponse');
      console.log('   Le filtre par défaut exclut les réponses');
      console.log('');
      console.log('✅ SOLUTIONS:');
      console.log('   1. Ajouter includeReplies=true à la recherche');
      console.log('   2. Supprimer le parentCorrespondanceId de cette correspondance');
      console.log('   3. Modifier le filtre pour ne pas exclure les OUTGOING avec parentId');
    } else {
      console.log('✅ La correspondance n\'a pas de parentCorrespondanceId');
      console.log('   Le problème vient d\'ailleurs');
      console.log('');
      console.log('🔍 Vérifications supplémentaires nécessaires:');
      console.log('   - Vérifier les logs du serveur');
      console.log('   - Vérifier le token d\'authentification');
      console.log('   - Vérifier la requête envoyée par le frontend');
    }
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugCorrespondance();

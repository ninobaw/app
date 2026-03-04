const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testSearchDirect() {
  try {
    console.log('=== Test direct de la recherche ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const Correspondance = require('./src/models/Correspondance');
    
    // Test 1 : Recherche simple par code
    console.log('Test 1 : Recherche simple par code "MD25-188"\n');
    
    const filter1 = {
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
    
    console.log('Filtre appliqué:');
    console.log(JSON.stringify(filter1, null, 2));
    console.log('');
    
    const results1 = await Correspondance.find(filter1);
    console.log(`Résultats: ${results1.length} correspondance(s)`);
    
    if (results1.length > 0) {
      results1.forEach(r => {
        console.log(`✅ Trouvé: ${r.code} - ${r.title}`);
        console.log(`   Status: ${r.status}`);
        console.log(`   Airport: ${r.airport}`);
        console.log(`   Type: ${r.type}`);
      });
    } else {
      console.log('❌ Aucun résultat trouvé');
    }
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2 : Recherche partielle
    console.log('Test 2 : Recherche partielle "MD25"\n');
    
    const filter2 = {
      parentCorrespondanceId: { $exists: false },
      $or: [
        { code: { $regex: 'MD25', $options: 'i' } }
      ]
    };
    
    const results2 = await Correspondance.find(filter2);
    console.log(`Résultats: ${results2.length} correspondance(s)`);
    
    if (results2.length > 0) {
      results2.forEach(r => {
        console.log(`✅ ${r.code} - ${r.title}`);
      });
    }
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3 : Recherche par code exact (sans regex)
    console.log('Test 3 : Recherche par code exact\n');
    
    const filter3 = {
      code: 'MD25-188'
    };
    
    const results3 = await Correspondance.find(filter3);
    console.log(`Résultats: ${results3.length} correspondance(s)`);
    
    if (results3.length > 0) {
      results3.forEach(r => {
        console.log(`✅ ${r.code} - ${r.title}`);
      });
    }
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 4 : Lister TOUTES les correspondances avec leur code
    console.log('Test 4 : Liste de TOUTES les correspondances\n');
    
    const allCorrespondances = await Correspondance.find({})
      .select('code title type status airport')
      .sort({ createdAt: -1 });
    
    console.log(`Total: ${allCorrespondances.length} correspondance(s)\n`);
    
    allCorrespondances.forEach((c, index) => {
      console.log(`${index + 1}. Code: ${c.code || 'N/A'}`);
      console.log(`   Titre: ${c.title}`);
      console.log(`   Type: ${c.type} | Status: ${c.status} | Airport: ${c.airport}`);
      console.log('');
    });
    
    console.log('='.repeat(60) + '\n');

    // Test 5 : Vérifier si le champ code existe
    console.log('Test 5 : Vérification du champ "code"\n');
    
    const withCode = await Correspondance.countDocuments({ code: { $exists: true, $ne: null } });
    const withoutCode = await Correspondance.countDocuments({ $or: [{ code: { $exists: false } }, { code: null }] });
    
    console.log(`Correspondances AVEC code: ${withCode}`);
    console.log(`Correspondances SANS code: ${withoutCode}`);
    console.log('');

    // Test 6 : Recherche insensible à la casse
    console.log('Test 6 : Recherche insensible à la casse\n');
    
    const testCases = ['MD25-188', 'md25-188', 'Md25-188', 'MD25'];
    
    for (const testCase of testCases) {
      const filter = {
        code: { $regex: testCase, $options: 'i' }
      };
      const results = await Correspondance.find(filter);
      console.log(`"${testCase}" → ${results.length} résultat(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testSearchDirect();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixOutgoingCorrespondancesStatus() {
  try {
    console.log('=== Correction du statut des correspondances sortantes ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    
    // 1. Trouver toutes les correspondances OUTGOING
    const outgoingCorrespondances = await db.collection('correspondances').find({
      type: 'OUTGOING'
    }).toArray();

    console.log(`📊 Statistiques:`);
    console.log(`   Total de correspondances OUTGOING trouvées: ${outgoingCorrespondances.length}\n`);

    if (outgoingCorrespondances.length === 0) {
      console.log('ℹ️ Aucune correspondance OUTGOING à corriger');
      return;
    }

    // 2. Analyser les statuts actuels
    const statusCounts = {};
    outgoingCorrespondances.forEach(corresp => {
      const status = corresp.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📋 Répartition des statuts actuels:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    console.log('');

    // 3. Identifier celles qui ne sont pas INFORMATIF
    const toUpdate = outgoingCorrespondances.filter(c => c.status !== 'INFORMATIF');
    
    console.log(`🔧 Correspondances à mettre à jour: ${toUpdate.length}\n`);

    if (toUpdate.length === 0) {
      console.log('✅ Toutes les correspondances OUTGOING ont déjà le statut INFORMATIF');
      return;
    }

    // 4. Afficher les détails des correspondances à corriger
    console.log('📝 Détails des correspondances à corriger:');
    toUpdate.forEach((corresp, index) => {
      console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
      console.log(`      - ID: ${corresp._id}`);
      console.log(`      - Code: ${corresp.code || 'N/A'}`);
      console.log(`      - Statut actuel: ${corresp.status || 'undefined'}`);
      console.log(`      - De: ${corresp.from_address}`);
      console.log(`      - À: ${corresp.to_address}`);
      console.log(`      - Date: ${corresp.date_correspondance || corresp.createdAt}`);
    });

    // 5. Demander confirmation (simulation)
    console.log('\n⚠️ Préparation de la mise à jour...\n');

    // 6. Mettre à jour les correspondances
    const updateResult = await db.collection('correspondances').updateMany(
      {
        type: 'OUTGOING',
        status: { $ne: 'INFORMATIF' }
      },
      {
        $set: {
          status: 'INFORMATIF',
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Mise à jour terminée !');
    console.log(`   Documents modifiés: ${updateResult.modifiedCount}`);
    console.log(`   Documents correspondants: ${updateResult.matchedCount}\n`);

    // 7. Vérifier le résultat
    const verifyOutgoing = await db.collection('correspondances').find({
      type: 'OUTGOING'
    }).toArray();

    const newStatusCounts = {};
    verifyOutgoing.forEach(corresp => {
      const status = corresp.status || 'undefined';
      newStatusCounts[status] = (newStatusCounts[status] || 0) + 1;
    });

    console.log('📊 Répartition des statuts après correction:');
    Object.entries(newStatusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    console.log('');

    // 8. Vérifier que toutes sont INFORMATIF
    const nonInformatif = verifyOutgoing.filter(c => c.status !== 'INFORMATIF');
    
    if (nonInformatif.length === 0) {
      console.log('✅ ✅ ✅ SUCCÈS ! ✅ ✅ ✅');
      console.log('   Toutes les correspondances OUTGOING ont maintenant le statut INFORMATIF\n');
    } else {
      console.log(`⚠️ Attention: ${nonInformatif.length} correspondance(s) OUTGOING n'ont pas le statut INFORMATIF`);
      nonInformatif.forEach(c => {
        console.log(`   - ${c._id}: ${c.status}`);
      });
    }

    // 9. Statistiques finales
    console.log('═══════════════════════════════════════════════════════');
    console.log('RÉSUMÉ:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total de correspondances OUTGOING: ${verifyOutgoing.length}`);
    console.log(`Correspondances mises à jour: ${updateResult.modifiedCount}`);
    console.log(`Statut INFORMATIF: ${newStatusCounts['INFORMATIF'] || 0}`);
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

fixOutgoingCorrespondancesStatus();

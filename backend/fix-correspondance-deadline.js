const mongoose = require('mongoose');

async function fixCorrespondanceDeadline() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION ÉCHÉANCE CORRESPONDANCE ===\n');
    
    // 1. Trouver la correspondance "aaaaa"
    const correspondanceId = '68e8469115eeac63a2fefc8e';
    
    const correspondance = await db.collection('correspondances').findOne({
      _id: new mongoose.Types.ObjectId(correspondanceId)
    });
    
    if (!correspondance) {
      console.log('❌ Correspondance non trouvée');
      process.exit(1);
    }
    
    console.log(`📄 Correspondance: "${correspondance.objet || correspondance.subject}"`);
    console.log(`   - ID: ${correspondance._id}`);
    console.log(`   - Échéance actuelle: ${correspondance.deadline}`);
    console.log(`   - Créée le: ${correspondance.createdAt}`);
    
    // 2. Calculer la nouvelle échéance (3 jours au lieu de 5)
    const createdDate = new Date(correspondance.createdAt);
    const newDeadline = new Date(createdDate);
    newDeadline.setDate(createdDate.getDate() + 3); // 3 jours au lieu de 5
    
    console.log(`\n🔄 Correction de l'échéance:`);
    console.log(`   - Ancienne échéance: ${correspondance.deadline}`);
    console.log(`   - Nouvelle échéance: ${newDeadline.toISOString()}`);
    
    // 3. Mettre à jour la correspondance
    await db.collection('correspondances').updateOne(
      { _id: correspondance._id },
      { 
        $set: { 
          deadline: newDeadline,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Échéance de la correspondance mise à jour');
    
    // 4. Mettre à jour le workflow associé si nécessaire
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: correspondance._id
    });
    
    if (workflow) {
      await db.collection('correspondenceworkflows').updateOne(
        { _id: workflow._id },
        { 
          $set: { 
            deadline: newDeadline,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Échéance du workflow mise à jour');
    }
    
    // 5. Vérification finale
    const updatedCorrespondance = await db.collection('correspondances').findOne({
      _id: correspondance._id
    });
    
    console.log('\n🔍 Vérification finale:');
    console.log(`   - Nouvelle échéance: ${updatedCorrespondance.deadline}`);
    
    // Calculer le temps restant
    const now = new Date();
    const timeRemaining = new Date(updatedCorrespondance.deadline) - now;
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    console.log(`   - Temps restant: ${daysRemaining} jours, ${hoursRemaining} heures`);
    console.log(`   - Affichage corrigé: ${daysRemaining}j ${hoursRemaining}h`);
    
    console.log('\n🎉 Correction terminée !');
    console.log('Le dashboard du superviseur devrait maintenant afficher le bon délai.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixCorrespondanceDeadline();

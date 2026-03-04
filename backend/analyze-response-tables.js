const mongoose = require('mongoose');

async function analyzeResponseTables() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📋 === ANALYSE DES TABLES RESPONSES ===\n');
    
    // 1. Table responsedrafts
    console.log('1. 📝 Table: responsedrafts');
    const drafts = await db.collection('responsedrafts').find({}).toArray();
    console.log(`   - Nombre d'entrées: ${drafts.length}`);
    
    if (drafts.length > 0) {
      console.log('   - Structure du premier document:');
      const firstDraft = drafts[0];
      console.log(`     * _id: ${firstDraft._id}`);
      console.log(`     * correspondanceId: ${firstDraft.correspondanceId}`);
      console.log(`     * content: ${firstDraft.content ? 'Présent' : 'Absent'}`);
      console.log(`     * status: ${firstDraft.status}`);
      console.log(`     * createdBy: ${firstDraft.createdBy}`);
      console.log(`     * createdAt: ${firstDraft.createdAt}`);
    }
    
    console.log('\n2. 📄 Table: responses');
    const responses = await db.collection('responses').find({}).toArray();
    console.log(`   - Nombre d'entrées: ${responses.length}`);
    
    if (responses.length > 0) {
      console.log('   - Structure du premier document:');
      const firstResponse = responses[0];
      console.log(`     * _id: ${firstResponse._id}`);
      console.log(`     * correspondanceId: ${firstResponse.correspondanceId}`);
      console.log(`     * content: ${firstResponse.content ? 'Présent' : 'Absent'}`);
      console.log(`     * status: ${firstResponse.status}`);
      console.log(`     * createdBy: ${firstResponse.createdBy}`);
      console.log(`     * sentAt: ${firstResponse.sentAt}`);
    }
    
    // 3. Vérifier les correspondances qui utilisent ces tables
    console.log('\n3. 🔗 Utilisation dans les correspondances:');
    const correspondances = await db.collection('correspondances').find({}).toArray();
    
    let draftsInCorrespondances = 0;
    let responsesInCorrespondances = 0;
    
    correspondances.forEach(c => {
      if (c.responseDrafts && c.responseDrafts.length > 0) {
        draftsInCorrespondances++;
        console.log(`   - Correspondance ${c._id} a ${c.responseDrafts.length} drafts`);
      }
      if (c.responses && c.responses.length > 0) {
        responsesInCorrespondances++;
        console.log(`   - Correspondance ${c._id} a ${c.responses.length} responses`);
      }
    });
    
    console.log(`\n   📊 Résumé correspondances:`);
    console.log(`   - Avec responseDrafts: ${draftsInCorrespondances}`);
    console.log(`   - Avec responses: ${responsesInCorrespondances}`);
    
    // 4. Vérifier les workflows
    console.log('\n4. 🔄 Utilisation dans les workflows:');
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    
    let draftsInWorkflows = 0;
    let responsesInWorkflows = 0;
    
    workflows.forEach(w => {
      if (w.responseDrafts && w.responseDrafts.length > 0) {
        draftsInWorkflows++;
        console.log(`   - Workflow ${w._id} a ${w.responseDrafts.length} drafts`);
      }
      if (w.responses && w.responses.length > 0) {
        responsesInWorkflows++;
        console.log(`   - Workflow ${w._id} a ${w.responses.length} responses`);
      }
    });
    
    console.log(`\n   📊 Résumé workflows:`);
    console.log(`   - Avec responseDrafts: ${draftsInWorkflows}`);
    console.log(`   - Avec responses: ${responsesInWorkflows}`);
    
    // 5. Analyser les doublons potentiels
    console.log('\n5. 🔍 Analyse des doublons:');
    
    // Vérifier si les mêmes données existent dans les deux formats
    const allCorrespondanceIds = [...new Set([
      ...drafts.map(d => d.correspondanceId?.toString()).filter(Boolean),
      ...responses.map(r => r.correspondanceId?.toString()).filter(Boolean)
    ])];
    
    console.log(`   - Correspondances référencées dans les tables séparées: ${allCorrespondanceIds.length}`);
    
    allCorrespondanceIds.forEach(corrId => {
      const draftsForCorr = drafts.filter(d => d.correspondanceId?.toString() === corrId);
      const responsesForCorr = responses.filter(r => r.correspondanceId?.toString() === corrId);
      
      if (draftsForCorr.length > 0 && responsesForCorr.length > 0) {
        console.log(`   ⚠️ DOUBLON: Correspondance ${corrId} a des données dans les 2 tables`);
        console.log(`      - ${draftsForCorr.length} drafts dans responsedrafts`);
        console.log(`      - ${responsesForCorr.length} responses dans responses`);
      }
    });
    
    console.log('\n📋 === RECOMMANDATIONS ===');
    console.log('1. responseDrafts: Propositions de réponse en cours de rédaction/révision');
    console.log('2. responses: Réponses finales envoyées');
    console.log('3. Vérifier s\'il y a des doublons à nettoyer');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

analyzeResponseTables();

const mongoose = require('mongoose');

async function createCompleteWorkflowTest() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === CRÉATION WORKFLOW COMPLET TEST ===\n');
    
    // 1. Trouver le DG et un directeur
    const dg = await db.collection('users').findOne({
      role: 'DIRECTEUR_GENERAL'
    });
    
    const director = await db.collection('users').findOne({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    if (!dg) {
      console.log('❌ Aucun Directeur Général trouvé !');
      process.exit(1);
    }
    
    if (!director) {
      console.log('❌ Aucun Directeur trouvé !');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName} (${director._id})`);
    
    // 2. Créer une correspondance de test complète
    const testCorrespondance = {
      title: 'Test Workflow Complet DG-Directeur',
      subject: 'Test Workflow Complet DG-Directeur',
      objet: 'Test Workflow Complet DG-Directeur',
      content: 'Ceci est une correspondance de test pour vérifier que le workflow inclut correctement le DG et le directeur dès la création.',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: 'aerodoc@tav.aero',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      assignedTo: director._id, // Assigné au directeur
      workflowStatus: 'DIRECTOR_DRAFT', // Status qui permet au DG de voir
      authorId: director._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      responseDrafts: [] // Vide au début
    };
    
    // Insérer la correspondance
    const insertResult = await db.collection('correspondances').insertOne(testCorrespondance);
    const correspondanceId = insertResult.insertedId;
    
    console.log(`\n📝 Correspondance créée: ${correspondanceId}`);
    
    // 3. Créer le workflow complet avec DG ET directeur
    const completeWorkflow = {
      correspondanceId: correspondanceId,
      assignedDirector: director._id, // Directeur assigné
      directeurGeneral: dg._id,       // DG inclus dès le début
      currentStatus: 'DIRECTOR_DRAFT', // Status visible par les deux
      createdAt: new Date(),
      updatedAt: new Date(),
      actions: [
        {
          actionType: 'ASSIGN_TO_DIRECTOR',
          performedBy: 'SYSTEM',
          performedAt: new Date(),
          comment: `Correspondance assignée au directeur ${director.firstName} ${director.lastName}`,
          assignedTo: director._id
        },
        {
          actionType: 'INCLUDE_DG',
          performedBy: 'SYSTEM',
          performedAt: new Date(),
          comment: `DG ${dg.firstName} ${dg.lastName} inclus dans le workflow pour supervision`,
          assignedTo: dg._id
        }
      ],
      chatMessages: [],
      responseDrafts: []
    };
    
    // Insérer le workflow
    const workflowResult = await db.collection('correspondenceworkflows').insertOne(completeWorkflow);
    console.log(`📋 Workflow créé: ${workflowResult.insertedId}`);
    
    // 4. Créer un draft de test pour le directeur
    const testDraft = {
      directorId: director._id,
      directorName: `${director.firstName} ${director.lastName}`,
      directorate: director.directorate || 'Direction Test',
      responseContent: `Proposition de réponse pour "${testCorrespondance.subject}".\n\nCeci est un draft de test créé automatiquement pour vérifier la visibilité du DG.`,
      attachments: [],
      comments: 'Draft créé automatiquement pour test workflow complet',
      isUrgent: false,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      dgFeedbacks: [] // Vide, le DG peut ajouter des feedbacks
    };
    
    // Ajouter le draft à la correspondance
    await db.collection('correspondances').updateOne(
      { _id: correspondanceId },
      { 
        $push: { responseDrafts: testDraft },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log(`✅ Draft de test ajouté`);
    
    // 5. Vérifications complètes
    console.log(`\n🔍 === VÉRIFICATIONS ===`);
    
    // Test visibilité directeur
    const directorCorrespondances = await db.collection('correspondances').find({
      $or: [
        { assignedTo: director._id },
        { 'responseDrafts.directorId': director._id }
      ]
    }).toArray();
    
    console.log(`👤 Correspondances visibles par le directeur: ${directorCorrespondances.length}`);
    
    // Test visibilité DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id,
      currentStatus: { $in: ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION', 'DG_REVIEW'] }
    }).toArray();
    
    console.log(`👑 Workflows visibles par le DG: ${dgWorkflows.length}`);
    
    // Test requête service DG
    const dgCorrespondanceIds = dgWorkflows.map(w => w.correspondanceId);
    const dgCorrespondances = await db.collection('correspondances').find({
      _id: { $in: dgCorrespondanceIds }
    }).toArray();
    
    console.log(`👑 Correspondances visibles par le DG: ${dgCorrespondances.length}`);
    
    // 6. Affichage détaillé
    if (dgCorrespondances.length > 0) {
      console.log(`\n✅ SUCCÈS - Le DG peut voir:`);
      dgCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. "${corresp.objet || corresp.subject}"`);
        console.log(`      Status: ${corresp.status} | Workflow: ${corresp.workflowStatus}`);
        console.log(`      Assigné à: ${corresp.assignedTo}`);
        console.log(`      Drafts: ${corresp.responseDrafts?.length || 0}`);
      });
    } else {
      console.log(`\n❌ PROBLÈME - Le DG ne voit aucune correspondance`);
    }
    
    if (directorCorrespondances.length > 0) {
      console.log(`\n✅ SUCCÈS - Le directeur peut voir:`);
      directorCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. "${corresp.objet || corresp.subject}"`);
        console.log(`      Status: ${corresp.status} | Workflow: ${corresp.workflowStatus}`);
        console.log(`      Drafts: ${corresp.responseDrafts?.length || 0}`);
      });
    }
    
    console.log(`\n🎯 === INSTRUCTIONS DE TEST ===`);
    console.log(`\n1. TEST DIRECTEUR:`);
    console.log(`   - Connectez-vous comme: ${director.email}`);
    console.log(`   - Vous devriez voir la correspondance assignée`);
    console.log(`   - Vous pouvez créer/modifier des drafts`);
    
    console.log(`\n2. TEST DG:`);
    console.log(`   - Connectez-vous comme: ${dg.email}`);
    console.log(`   - Vous devriez voir la même correspondance`);
    console.log(`   - Vous pouvez initier des demandes de révision`);
    console.log(`   - Vous pouvez voir les drafts du directeur`);
    
    console.log(`\n💡 === WORKFLOW FONCTIONNEL ===`);
    console.log(`✅ Correspondance créée avec assignation directeur`);
    console.log(`✅ Workflow créé avec DG + directeur inclus`);
    console.log(`✅ Status DIRECTOR_DRAFT → visible par les deux`);
    console.log(`✅ Draft de test créé pour interaction`);
    console.log(`✅ Visibilité vérifiée pour les deux rôles`);
    
    console.log(`\n📋 IDs pour référence:`);
    console.log(`   Correspondance: ${correspondanceId}`);
    console.log(`   Workflow: ${workflowResult.insertedId}`);
    console.log(`   Directeur: ${director._id}`);
    console.log(`   DG: ${dg._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createCompleteWorkflowTest();

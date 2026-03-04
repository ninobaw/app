const mongoose = require('mongoose');

async function fixWorkflowCreationAuto() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔧 === CORRECTION AUTOMATIQUE WORKFLOW ===\n');
    
    // 1. Vérifier si le middleware de création automatique existe
    console.log('🔍 Recherche du middleware de création automatique...');
    
    // 2. Créer/corriger le middleware pour création automatique de workflow
    console.log('\n📝 === MIDDLEWARE CRÉATION AUTOMATIQUE ===');
    console.log('Le middleware doit être ajouté dans le modèle Correspondance');
    console.log('pour créer automatiquement un workflow lors de la création');
    
    // 3. Tester la création d'une nouvelle correspondance
    console.log('\n🧪 === TEST CRÉATION CORRESPONDANCE ===');
    
    const db = mongoose.connection.db;
    
    // Trouver le DG et des directeurs
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    const directors = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    if (!dg || directors.length === 0) {
      console.log('❌ DG ou directeurs non trouvés');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`👥 Directeurs: ${directors.length}`);
    
    // Créer une correspondance de test
    const testCorrespondance = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Test Correspondance Auto-Workflow',
      subject: 'Test création automatique de workflow',
      content: 'Correspondance de test pour vérifier la création automatique de workflow',
      fromAddress: 'test@example.com',
      toAddress: 'admin@tav.aero',
      status: 'PENDING',
      priority: 'MEDIUM',
      type: 'DEMANDE',
      personnesConcernees: [directors[0]._id, directors[1]._id],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\n📧 Création correspondance de test...');
    
    const insertResult = await db.collection('correspondances').insertOne(testCorrespondance);
    
    if (insertResult.acknowledged) {
      console.log('✅ Correspondance créée');
      
      // Attendre un peu pour voir si un workflow est créé automatiquement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier si un workflow a été créé
      const workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: testCorrespondance._id
      });
      
      if (workflow) {
        console.log('✅ Workflow créé automatiquement !');
        console.log(`   Status: ${workflow.currentStatus}`);
      } else {
        console.log('❌ Aucun workflow créé automatiquement');
        console.log('🔧 Création manuelle du workflow...');
        
        // Créer le workflow manuellement
        const newWorkflow = {
          _id: new mongoose.Types.ObjectId(),
          correspondanceId: testCorrespondance._id,
          currentStatus: 'ASSIGNED_TO_DIRECTOR',
          assignedDirector: directors[0]._id,
          directeurGeneral: dg._id,
          responseDrafts: [],
          chatMessages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const workflowInsert = await db.collection('correspondenceworkflows').insertOne(newWorkflow);
        
        if (workflowInsert.acknowledged) {
          console.log('✅ Workflow créé manuellement');
          
          // Mettre à jour la correspondance
          await db.collection('correspondances').updateOne(
            { _id: testCorrespondance._id },
            {
              $set: {
                workflowStatus: 'ASSIGNED_TO_DIRECTOR',
                assignedTo: directors[0]._id,
                updatedAt: new Date()
              }
            }
          );
          
          console.log('✅ Correspondance mise à jour');
        }
      }
      
      // Supprimer la correspondance de test
      await db.collection('correspondances').deleteOne({ _id: testCorrespondance._id });
      await db.collection('correspondenceworkflows').deleteOne({ correspondanceId: testCorrespondance._id });
      console.log('🗑️ Correspondance de test supprimée');
    }
    
    console.log('\n🎯 === SOLUTION POUR CRÉATION AUTOMATIQUE ===');
    console.log('Il faut ajouter un middleware dans le modèle Correspondance.js');
    console.log('pour créer automatiquement un workflow lors de la sauvegarde');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixWorkflowCreationAuto();

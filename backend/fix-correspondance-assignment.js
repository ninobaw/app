const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function fixCorrespondanceAssignment() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔧 CORRECTION - Assignation Correspondance Asma → Anis');
    console.log('=========================================================');

    // 1. Trouver Asma et Anis
    const asma = await User.findOne({
      $or: [
        { firstName: { $regex: /asma/i } },
        { email: { $regex: /asma/i } }
      ]
    });

    const anis = await User.findOne({
      $or: [
        { firstName: { $regex: /anis/i } },
        { lastName: { $regex: /janet/i } }
      ]
    });

    if (!asma || !anis) {
      console.log('❌ Utilisateurs non trouvés');
      if (!asma) console.log('   - Asma non trouvée');
      if (!anis) console.log('   - Anis non trouvé');
      return;
    }

    console.log(`✅ Utilisateurs trouvés:`);
    console.log(`   - Asma: ${asma.firstName} ${asma.lastName} (${asma._id})`);
    console.log(`   - Anis: ${anis.firstName} ${anis.lastName} (${anis._id})`);

    // 2. Trouver les correspondances créées par Asma
    const correspondancesAsma = await Correspondance.find({ 
      authorId: asma._id 
    }).sort({ createdAt: -1 });

    console.log(`\n📋 Correspondances créées par Asma: ${correspondancesAsma.length}`);

    let correctionsMade = 0;
    let workflowsCreated = 0;

    for (const corr of correspondancesAsma) {
      console.log(`\n🔍 Analyse: ${corr.subject || corr.title} (${corr._id})`);
      console.log(`   - Créée: ${corr.createdAt}`);
      console.log(`   - Status: ${corr.status}`);
      console.log(`   - AssignedTo: ${corr.assignedTo || 'Non défini'}`);
      console.log(`   - PersonnesConcernees: ${corr.personnesConcernees?.length || 0}`);

      let needsCorrection = false;

      // Vérifier si Anis est dans personnesConcernees
      if (!corr.personnesConcernees || !corr.personnesConcernees.includes(anis._id)) {
        console.log('   ⚠️ Anis manquant dans personnesConcernees');
        needsCorrection = true;
      }

      // Vérifier si assignedTo est défini
      if (!corr.assignedTo) {
        console.log('   ⚠️ AssignedTo non défini');
        needsCorrection = true;
      }

      // Appliquer les corrections
      if (needsCorrection) {
        console.log('   🔧 Application des corrections...');
        
        // Ajouter Anis dans personnesConcernees s'il n'y est pas
        if (!corr.personnesConcernees) {
          corr.personnesConcernees = [];
        }
        if (!corr.personnesConcernees.includes(anis._id)) {
          corr.personnesConcernees.push(anis._id);
          console.log('   ✅ Anis ajouté dans personnesConcernees');
        }

        // Définir assignedTo si pas défini
        if (!corr.assignedTo) {
          corr.assignedTo = anis._id;
          console.log('   ✅ AssignedTo défini sur Anis');
        }

        // Définir un workflowStatus si pas défini
        if (!corr.workflowStatus) {
          corr.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
          console.log('   ✅ WorkflowStatus défini');
        }

        // Sauvegarder
        await corr.save();
        correctionsMade++;
        console.log('   ✅ Correspondance corrigée');

        // Créer le workflow si il n'existe pas
        const existingWorkflow = await CorrespondenceWorkflow.findOne({ 
          correspondanceId: corr._id 
        });

        if (!existingWorkflow) {
          console.log('   🔄 Création du workflow...');
          try {
            const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
              corr._id.toString(),
              asma._id
            );
            if (workflow) {
              workflowsCreated++;
              console.log(`   ✅ Workflow créé: ${workflow._id}`);
            }
          } catch (workflowError) {
            console.log(`   ❌ Erreur création workflow: ${workflowError.message}`);
          }
        } else {
          console.log('   ℹ️ Workflow existe déjà');
        }
      } else {
        console.log('   ✅ Correspondance déjà correcte');
      }
    }

    // 3. Vérification finale
    console.log('\n🔍 VÉRIFICATION FINALE...');
    
    const anisCorrespondances = await Correspondance.find({
      $or: [
        { assignedTo: anis._id },
        { personnesConcernees: { $in: [anis._id] } }
      ]
    }).sort({ createdAt: -1 });

    console.log(`📊 Correspondances visibles par Anis: ${anisCorrespondances.length}`);

    const anisWorkflows = await CorrespondenceWorkflow.find({
      assignedDirector: anis._id
    });

    console.log(`📊 Workflows assignés à Anis: ${anisWorkflows.length}`);

    // 4. Test de la route my-tasks
    console.log('\n🧪 TEST DE LA ROUTE MY-TASKS...');
    
    // Simuler la logique de la route pour Anis
    const filter = {
      $or: [
        { 
          assignedTo: anis._id,
          workflowStatus: { 
            $in: [
              'ASSIGNED_TO_DIRECTOR', 
              'DIRECTOR_DRAFT',
              'DG_FEEDBACK', 
              'DG_REVIEW',
              'DIRECTOR_REVISION'
            ] 
          }
        },
        { 
          personnesConcernees: anis._id,
          workflowStatus: { 
            $in: [
              'ASSIGNED_TO_DIRECTOR', 
              'DIRECTOR_DRAFT',
              'DG_FEEDBACK', 
              'DG_REVIEW',
              'DIRECTOR_REVISION'
            ] 
          }
        },
        {
          'responseDrafts.directorId': anis._id
        },
        { 
          assignedTo: anis._id,
          $or: [
            { workflowStatus: { $exists: false } },
            { workflowStatus: null },
            { workflowStatus: 'PENDING' }
          ]
        }
      ]
    };

    const myTasksResult = await Correspondance.find(filter).sort({ updatedAt: -1 });
    console.log(`📊 Résultat my-tasks pour Anis: ${myTasksResult.length} correspondances`);

    myTasksResult.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.subject || corr.title}`);
      console.log(`      - Status: ${corr.workflowStatus || 'Non défini'}`);
      console.log(`      - AssignedTo: ${corr.assignedTo === anis._id ? 'Anis' : 'Autre'}`);
      console.log(`      - Dans personnesConcernees: ${corr.personnesConcernees?.includes(anis._id) ? 'Oui' : 'Non'}`);
    });

    console.log('\n🎉 CORRECTION TERMINÉE !');
    console.log(`✅ Correspondances corrigées: ${correctionsMade}`);
    console.log(`✅ Workflows créés: ${workflowsCreated}`);
    console.log(`✅ Correspondances visibles par Anis: ${myTasksResult.length}`);

    if (myTasksResult.length > 0) {
      console.log('\n🚀 Anis devrait maintenant voir ses correspondances !');
    } else {
      console.log('\n⚠️ Anis ne voit toujours pas de correspondances. Vérifiez:');
      console.log('   1. Le rôle d\'Anis (doit être DIRECTEUR ou SOUS_DIRECTEUR)');
      console.log('   2. Les filtres côté frontend');
      console.log('   3. L\'authentification d\'Anis');
    }

  } catch (error) {
    console.error('❌ Erreur correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

fixCorrespondanceAssignment();

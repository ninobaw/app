const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugDGChatIssue() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier les utilisateurs DG
    console.log('\n👑 Vérification des Directeurs Généraux...');
    const dgs = await User.find({ role: 'DIRECTEUR_GENERAL' });
    console.log(`📊 Nombre de DG trouvés: ${dgs.length}`);
    
    if (dgs.length === 0) {
      console.log('❌ Aucun DG trouvé - Création d\'un DG de test...');
      const testDG = new User({
        _id: 'dg-test-' + Date.now(),
        firstName: 'Directeur',
        lastName: 'Général',
        email: 'dg@test.com',
        role: 'DIRECTEUR_GENERAL',
        airport: 'ENFIDHA',
        isActive: true
      });
      await testDG.save();
      console.log(`✅ DG de test créé: ${testDG._id}`);
      dgs.push(testDG);
    }

    const dg = dgs[0];
    console.log(`✅ DG utilisé: ${dg.firstName} ${dg.lastName} (${dg._id})`);

    // 2. Vérifier les correspondances
    console.log('\n📋 Vérification des correspondances...');
    const correspondances = await Correspondance.find().limit(5);
    console.log(`📊 Nombre de correspondances: ${correspondances.length}`);
    
    if (correspondances.length === 0) {
      console.log('❌ Aucune correspondance trouvée');
      return;
    }

    // 3. Vérifier les workflows existants
    console.log('\n🔄 Vérification des workflows...');
    const workflows = await CorrespondenceWorkflow.find();
    console.log(`📊 Nombre de workflows: ${workflows.length}`);

    // Workflows avec ce DG
    const dgWorkflows = await CorrespondenceWorkflow.find({ directeurGeneral: dg._id });
    console.log(`📊 Workflows avec ce DG: ${dgWorkflows.length}`);

    if (dgWorkflows.length === 0) {
      console.log('⚠️ Aucun workflow trouvé pour ce DG - Création d\'un workflow de test...');
      
      // Trouver un directeur pour le workflow
      const directeur = await User.findOne({ role: 'DIRECTEUR' });
      if (!directeur) {
        console.log('❌ Aucun directeur trouvé pour créer le workflow');
        return;
      }

      // Créer un workflow de test
      const testWorkflow = new CorrespondenceWorkflow({
        correspondanceId: correspondances[0]._id,
        currentStatus: 'ASSIGNED_TO_DIRECTOR',
        createdBy: directeur._id,
        bureauOrdreAgent: directeur._id,
        superviseurBureauOrdre: directeur._id,
        assignedDirector: directeur._id,
        directeurGeneral: dg._id,
        priority: 'HIGH',
        chatMessages: []
      });

      await testWorkflow.save();
      console.log(`✅ Workflow de test créé: ${testWorkflow._id}`);
      dgWorkflows.push(testWorkflow);
    }

    // 4. Tester l'accès au chat pour chaque workflow du DG
    console.log('\n💬 Test d\'accès au chat pour chaque workflow...');
    for (const workflow of dgWorkflows) {
      console.log(`\n🔍 Workflow: ${workflow._id}`);
      console.log(`   - Correspondance: ${workflow.correspondanceId}`);
      console.log(`   - Status: ${workflow.currentStatus}`);
      console.log(`   - Messages actuels: ${workflow.chatMessages.length}`);

      // Tester l'ajout d'un message
      try {
        await workflow.addChatMessage(
          dg._id,
          workflow.assignedDirector,
          `Message de test DG - ${new Date().toISOString()}`,
          null,
          []
        );
        console.log(`   ✅ Message ajouté avec succès`);
      } catch (error) {
        console.log(`   ❌ Erreur ajout message: ${error.message}`);
      }

      // Vérifier la persistance
      const reloaded = await CorrespondenceWorkflow.findById(workflow._id);
      console.log(`   📊 Messages après reload: ${reloaded.chatMessages.length}`);
    }

    // 5. Tester la route de récupération de workflow
    console.log('\n🌐 Test de la route de récupération...');
    for (const workflow of dgWorkflows) {
      console.log(`\n📡 Test route pour correspondance: ${workflow.correspondanceId}`);
      
      // Simuler la recherche comme le fait la route
      const foundWorkflow = await CorrespondenceWorkflow.findOne({ 
        correspondanceId: workflow.correspondanceId 
      });
      
      if (foundWorkflow) {
        console.log(`   ✅ Workflow trouvé via route: ${foundWorkflow._id}`);
        console.log(`   📊 Messages: ${foundWorkflow.chatMessages.length}`);
        
        // Vérifier les droits d'accès
        const hasAccess = (
          foundWorkflow.assignedDirector?.toString() === dg._id ||
          foundWorkflow.directeurGeneral?.toString() === dg._id
        );
        console.log(`   🔐 Accès DG autorisé: ${hasAccess}`);
      } else {
        console.log(`   ❌ Workflow non trouvé via route`);
      }
    }

    // 6. Vérifier les fichiers d'attachement
    console.log('\n📎 Vérification des dossiers d\'attachements...');
    const fs = require('fs');
    const path = require('path');
    
    const attachmentDirs = [
      'uploads/chat-attachments',
      'uploads/drafts',
      'uploads/correspondances',
      'uploads/documents',
      'uploads'
    ];

    for (const dir of attachmentDirs) {
      const fullPath = path.join(__dirname, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        console.log(`   ✅ ${dir}: ${files.length} fichiers`);
        if (files.length > 0) {
          console.log(`      Exemples: ${files.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log(`   ❌ ${dir}: Dossier manquant`);
        // Créer le dossier
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   ✅ ${dir}: Dossier créé`);
      }
    }

    console.log('\n🎯 RÉSUMÉ DU DIAGNOSTIC:');
    console.log(`   - DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`   - Workflows DG: ${dgWorkflows.length}`);
    console.log(`   - Total correspondances: ${correspondances.length}`);
    console.log(`   - Total workflows: ${workflows.length}`);

    if (dgWorkflows.length > 0) {
      console.log('\n✅ Le DG devrait pouvoir accéder au chat !');
      console.log('🔧 URLs de test:');
      for (const workflow of dgWorkflows) {
        console.log(`   - Chat: /api/workflow-chat/${workflow._id}/messages`);
        console.log(`   - Recherche: /api/workflow-chat/by-correspondance/${workflow.correspondanceId}`);
      }
    } else {
      console.log('\n❌ Problème: Aucun workflow accessible au DG');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le diagnostic
debugDGChatIssue();

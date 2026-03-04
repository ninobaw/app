const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function checkRealData() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier les utilisateurs
    console.log('\n👥 UTILISATEURS:');
    const users = await User.find();
    console.log(`Total utilisateurs: ${users.length}`);
    
    const usersByRole = {};
    users.forEach(user => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });
    
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}`);
    });

    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    if (dg) {
      console.log(`✅ DG trouvé: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    } else {
      console.log('❌ Aucun DG trouvé');
    }

    // 2. Vérifier les correspondances
    console.log('\n📋 CORRESPONDANCES:');
    const correspondances = await Correspondance.find().sort({ createdAt: -1 }).limit(10);
    console.log(`Total correspondances (10 dernières): ${correspondances.length}`);
    
    correspondances.forEach((corr, index) => {
      console.log(`  ${index + 1}. ${corr.subject || corr.title} (${corr._id})`);
      console.log(`     - Créée: ${corr.createdAt}`);
      console.log(`     - Auteur: ${corr.authorId}`);
      console.log(`     - Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
    });

    // 3. Vérifier les workflows
    console.log('\n🔄 WORKFLOWS:');
    const workflows = await CorrespondenceWorkflow.find().sort({ createdAt: -1 }).limit(10);
    console.log(`Total workflows: ${workflows.length}`);
    
    workflows.forEach((workflow, index) => {
      console.log(`  ${index + 1}. Workflow ${workflow._id}`);
      console.log(`     - Correspondance: ${workflow.correspondanceId}`);
      console.log(`     - Status: ${workflow.currentStatus}`);
      console.log(`     - DG: ${workflow.directeurGeneral}`);
      console.log(`     - Directeur: ${workflow.assignedDirector}`);
      console.log(`     - Messages: ${workflow.chatMessages?.length || 0}`);
    });

    // 4. Vérifier les correspondances SANS workflow
    console.log('\n❓ CORRESPONDANCES SANS WORKFLOW:');
    const correspondanceIds = correspondances.map(c => c._id);
    const workflowCorrespondanceIds = workflows.map(w => w.correspondanceId.toString());
    
    const correspondancesSansWorkflow = correspondances.filter(corr => 
      !workflowCorrespondanceIds.includes(corr._id.toString())
    );
    
    console.log(`Correspondances sans workflow: ${correspondancesSansWorkflow.length}`);
    correspondancesSansWorkflow.forEach(corr => {
      console.log(`  - ${corr.subject || corr.title} (${corr._id})`);
    });

    // 5. Vérifier les messages de chat
    console.log('\n💬 MESSAGES DE CHAT:');
    let totalMessages = 0;
    workflows.forEach(workflow => {
      if (workflow.chatMessages && workflow.chatMessages.length > 0) {
        totalMessages += workflow.chatMessages.length;
        console.log(`  Workflow ${workflow._id}: ${workflow.chatMessages.length} messages`);
        workflow.chatMessages.forEach((msg, index) => {
          console.log(`    ${index + 1}. De: ${msg.from} vers: ${msg.to}`);
          console.log(`       Message: "${msg.message.substring(0, 50)}..."`);
        });
      }
    });
    console.log(`Total messages de chat: ${totalMessages}`);

    // 6. Vérifier les fichiers d'attachement
    console.log('\n📎 FICHIERS D\'ATTACHEMENT:');
    const fs = require('fs');
    const path = require('path');
    
    const dirs = [
      'uploads/chat-attachments',
      'uploads/drafts', 
      'uploads/correspondances',
      'uploads/documents',
      'uploads'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        console.log(`  ${dir}: ${files.length} fichiers`);
        if (files.length > 0 && files.length <= 5) {
          files.forEach(file => console.log(`    - ${file}`));
        } else if (files.length > 5) {
          files.slice(0, 3).forEach(file => console.log(`    - ${file}`));
          console.log(`    ... et ${files.length - 3} autres`);
        }
      } else {
        console.log(`  ${dir}: ❌ Dossier manquant`);
      }
    });

    console.log('\n🎯 DIAGNOSTIC:');
    console.log(`✅ Utilisateurs: ${users.length} (DG: ${dg ? 'Oui' : 'Non'})`);
    console.log(`✅ Correspondances: ${correspondances.length}`);
    console.log(`✅ Workflows: ${workflows.length}`);
    console.log(`⚠️ Correspondances sans workflow: ${correspondancesSansWorkflow.length}`);
    console.log(`✅ Messages de chat: ${totalMessages}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

checkRealData();

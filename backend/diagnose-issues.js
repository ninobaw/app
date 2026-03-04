const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function diagnoseIssues() {
  try {
    console.log('🔍 DIAGNOSTIC COMPLET DES PROBLÈMES');
    console.log('=====================================\n');

    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;

    // 1. ANALYSE DU PROBLÈME DG
    console.log('👑 PROBLÈME 1: ACCÈS CHAT DG');
    console.log('-----------------------------');

    // Vérifier les utilisateurs DG
    const dgs = await db.collection('users').find({ role: 'DIRECTEUR_GENERAL' }).toArray();
    console.log(`📊 Nombre de DG: ${dgs.length}`);
    
    if (dgs.length > 0) {
      const dg = dgs[0];
      console.log(`✅ DG principal: ${dg.firstName} ${dg.lastName} (${dg._id})`);
      
      // Vérifier les workflows avec ce DG
      const dgWorkflows = await db.collection('correspondenceworkflows')
        .find({ directeurGeneral: dg._id }).toArray();
      console.log(`📊 Workflows avec ce DG: ${dgWorkflows.length}`);
      
      if (dgWorkflows.length > 0) {
        console.log('✅ Le DG a des workflows assignés');
        dgWorkflows.forEach((workflow, index) => {
          console.log(`   ${index + 1}. Workflow: ${workflow._id}`);
          console.log(`      - Correspondance: ${workflow.correspondanceId}`);
          console.log(`      - Messages: ${workflow.chatMessages?.length || 0}`);
          console.log(`      - Status: ${workflow.currentStatus}`);
        });
      } else {
        console.log('❌ PROBLÈME: Le DG n\'a aucun workflow assigné');
      }
      
      // Vérifier les correspondances
      const correspondances = await db.collection('correspondances')
        .find({ personnesConcernees: { $in: [dg._id] } }).toArray();
      console.log(`📊 Correspondances avec ce DG: ${correspondances.length}`);
      
    } else {
      console.log('❌ PROBLÈME: Aucun DG trouvé dans le système');
    }

    // 2. ANALYSE DU PROBLÈME ATTACHEMENTS
    console.log('\n📎 PROBLÈME 2: ERREURS 404 ATTACHEMENTS');
    console.log('----------------------------------------');

    // Vérifier les dossiers d'attachements
    const attachmentDirs = [
      'uploads',
      'uploads/chat-attachments',
      'uploads/drafts',
      'uploads/correspondances',
      'uploads/documents'
    ];

    console.log('📁 Vérification des dossiers:');
    attachmentDirs.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        console.log(`   ✅ ${dir}: ${files.length} fichiers`);
        if (files.length > 0) {
          console.log(`      Exemples: ${files.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log(`   ❌ ${dir}: Dossier manquant`);
      }
    });

    // Vérifier les attachements dans les messages de chat
    const workflowsWithAttachments = await db.collection('correspondenceworkflows')
      .find({ 'chatMessages.attachments': { $exists: true, $ne: [] } }).toArray();
    
    console.log(`📊 Workflows avec attachements: ${workflowsWithAttachments.length}`);
    
    let totalAttachments = 0;
    workflowsWithAttachments.forEach(workflow => {
      workflow.chatMessages?.forEach(msg => {
        if (msg.attachments && msg.attachments.length > 0) {
          totalAttachments += msg.attachments.length;
          console.log(`   📎 Message avec ${msg.attachments.length} attachements:`);
          msg.attachments.forEach(att => {
            console.log(`      - ${att.filename || att.name || att}`);
          });
        }
      });
    });
    console.log(`📊 Total attachements trouvés: ${totalAttachments}`);

    // 3. ANALYSE DES ROUTES
    console.log('\n🌐 ANALYSE DES ROUTES');
    console.log('---------------------');
    
    // Vérifier si les routes sont bien définies
    console.log('📋 Routes à vérifier:');
    console.log('   - GET /api/workflow-chat/by-correspondance/:id');
    console.log('   - GET /api/workflow-chat/:id/messages');
    console.log('   - GET /api/workflow-chat/attachment/:filename');
    console.log('   - POST /api/workflow-chat/:id/send-message');

    // 4. RECOMMANDATIONS
    console.log('\n🎯 RECOMMANDATIONS DE CORRECTION');
    console.log('=================================');

    if (dgs.length === 0) {
      console.log('1. ❌ CRÉER UN UTILISATEUR DG');
      console.log('   - Aucun DG trouvé dans le système');
      console.log('   - Créer un utilisateur avec role: DIRECTEUR_GENERAL');
    }

    if (dgWorkflows.length === 0 && dgs.length > 0) {
      console.log('2. ❌ CRÉER DES WORKFLOWS POUR LE DG');
      console.log('   - Le DG existe mais n\'a pas de workflows');
      console.log('   - Assigner le DG aux workflows existants');
    }

    const missingDirs = attachmentDirs.filter(dir => 
      !fs.existsSync(path.join(__dirname, dir))
    );
    
    if (missingDirs.length > 0) {
      console.log('3. ❌ CRÉER LES DOSSIERS MANQUANTS');
      console.log(`   - Dossiers manquants: ${missingDirs.join(', ')}`);
    }

    if (totalAttachments === 0) {
      console.log('4. ⚠️ AUCUN ATTACHEMENT TROUVÉ');
      console.log('   - Pas d\'attachements dans les messages');
      console.log('   - Tester avec des attachements réels');
    }

    console.log('\n✅ DIAGNOSTIC TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

diagnoseIssues();

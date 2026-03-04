const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugChatSynchronization() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 DIAGNOSTIC - SYNCHRONISATION CHAT DG/DIRECTEUR');
    console.log('==================================================');

    // 1. Analyser les différents systèmes de chat
    console.log('\n📊 ANALYSE DES SYSTÈMES DE CHAT:');
    
    // Système 1: Messages dans CorrespondenceWorkflow.chatMessages
    const workflowsWithChat = await CorrespondenceWorkflow.find({
      'chatMessages.0': { $exists: true }
    });
    
    console.log(`📱 Système WorkflowChat (CorrespondenceWorkflow.chatMessages):`);
    console.log(`   - Workflows avec messages: ${workflowsWithChat.length}`);
    
    let totalWorkflowMessages = 0;
    workflowsWithChat.forEach(workflow => {
      totalWorkflowMessages += workflow.chatMessages.length;
    });
    console.log(`   - Total messages: ${totalWorkflowMessages}`);

    // Système 2: Propositions dans Correspondance.responseDrafts
    const correspondancesWithDrafts = await Correspondance.find({
      'responseDrafts.0': { $exists: true }
    });
    
    console.log(`\n📝 Système ResponseDrafts (Correspondance.responseDrafts):`);
    console.log(`   - Correspondances avec drafts: ${correspondancesWithDrafts.length}`);
    
    let totalDrafts = 0;
    let totalFeedbacks = 0;
    correspondancesWithDrafts.forEach(corr => {
      totalDrafts += corr.responseDrafts.length;
      corr.responseDrafts.forEach(draft => {
        if (draft.dgFeedbacks) {
          totalFeedbacks += draft.dgFeedbacks.length;
        }
      });
    });
    console.log(`   - Total drafts: ${totalDrafts}`);
    console.log(`   - Total feedbacks DG: ${totalFeedbacks}`);

    // 2. Analyser une correspondance spécifique
    console.log('\n🔍 ANALYSE DÉTAILLÉE D\'UNE CORRESPONDANCE:');
    
    // Trouver une correspondance qui a les deux systèmes
    const correspondanceWithBoth = await Correspondance.findOne({
      'responseDrafts.0': { $exists: true }
    });

    if (correspondanceWithBoth) {
      console.log(`\n📋 Correspondance: ${correspondanceWithBoth._id}`);
      console.log(`   - Sujet: ${correspondanceWithBoth.subject}`);
      console.log(`   - Status: ${correspondanceWithBoth.workflowStatus}`);
      
      // Vérifier le workflow associé
      const associatedWorkflow = await CorrespondenceWorkflow.findOne({
        correspondanceId: correspondanceWithBoth._id
      });

      if (associatedWorkflow) {
        console.log(`\n🔄 Workflow associé: ${associatedWorkflow._id}`);
        console.log(`   - Messages chat: ${associatedWorkflow.chatMessages.length}`);
        console.log(`   - DG: ${associatedWorkflow.directeurGeneral}`);
        console.log(`   - Directeur: ${associatedWorkflow.assignedDirector}`);
        
        // Analyser les messages du chat workflow
        if (associatedWorkflow.chatMessages.length > 0) {
          console.log('\n💬 Messages dans WorkflowChat:');
          associatedWorkflow.chatMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. De: ${msg.from} vers: ${msg.to}`);
            console.log(`      Message: "${msg.message?.substring(0, 50)}..."`);
            console.log(`      Timestamp: ${msg.timestamp}`);
          });
        }
        
        // Analyser les propositions/feedbacks
        if (correspondanceWithBoth.responseDrafts.length > 0) {
          console.log('\n📝 Propositions/Feedbacks:');
          correspondanceWithBoth.responseDrafts.forEach((draft, index) => {
            console.log(`   ${index + 1}. Directeur: ${draft.directorName}`);
            console.log(`      Contenu: "${draft.responseContent?.substring(0, 50)}..."`);
            console.log(`      Status: ${draft.status}`);
            console.log(`      Feedbacks DG: ${draft.dgFeedbacks?.length || 0}`);
          });
        }

        // 3. Identifier le problème de synchronisation
        console.log('\n⚠️ PROBLÈME DE SYNCHRONISATION IDENTIFIÉ:');
        
        const hasWorkflowMessages = associatedWorkflow.chatMessages.length > 0;
        const hasResponseDrafts = correspondanceWithBoth.responseDrafts.length > 0;
        
        if (hasWorkflowMessages && hasResponseDrafts) {
          console.log('❌ DOUBLE SYSTÈME DÉTECTÉ:');
          console.log('   - Le DG voit les propositions/feedbacks (ResponseConversationDialog)');
          console.log('   - Le Directeur voit le chat workflow (WorkflowChatPanel)');
          console.log('   - Les deux systèmes ne sont PAS synchronisés');
        } else if (hasWorkflowMessages && !hasResponseDrafts) {
          console.log('✅ SYSTÈME UNIFIÉ (WorkflowChat seulement)');
        } else if (!hasWorkflowMessages && hasResponseDrafts) {
          console.log('⚠️ ANCIEN SYSTÈME (ResponseDrafts seulement)');
        } else {
          console.log('❓ AUCUN MESSAGE DANS LES DEUX SYSTÈMES');
        }

      } else {
        console.log('❌ Aucun workflow associé trouvé');
      }
    }

    // 4. Recommandations de correction
    console.log('\n💡 RECOMMANDATIONS POUR CORRIGER LA SYNCHRONISATION:');
    
    console.log('\n🔧 SOLUTION 1: Unifier sur WorkflowChat');
    console.log('   - Modifier DGResponseReviewPanel pour utiliser WorkflowChatPanel');
    console.log('   - Migrer les données de responseDrafts vers chatMessages');
    console.log('   - Supprimer l\'ancien système de propositions');

    console.log('\n🔧 SOLUTION 2: Synchronisation bidirectionnelle');
    console.log('   - Synchroniser automatiquement les deux systèmes');
    console.log('   - Convertir les responseDrafts en chatMessages');
    console.log('   - Convertir les chatMessages en responseDrafts');

    console.log('\n🔧 SOLUTION 3: Interface unifiée');
    console.log('   - Créer un composant qui affiche les deux systèmes');
    console.log('   - Permettre la migration progressive');
    console.log('   - Maintenir la compatibilité');

    // 5. Vérifier les utilisateurs concernés
    console.log('\n👥 UTILISATEURS CONCERNÉS:');
    
    const dgs = await User.find({ role: 'DIRECTEUR_GENERAL' });
    const directeurs = await User.find({ role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] } });
    
    console.log(`   - Directeurs Généraux: ${dgs.length}`);
    dgs.forEach(dg => {
      console.log(`     * ${dg.firstName} ${dg.lastName} (${dg._id})`);
    });
    
    console.log(`   - Directeurs: ${directeurs.length}`);
    directeurs.forEach(dir => {
      console.log(`     * ${dir.firstName} ${dir.lastName} (${dir._id}) - ${dir.directorate || 'N/A'}`);
    });

    console.log('\n✅ DIAGNOSTIC TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugChatSynchronization();

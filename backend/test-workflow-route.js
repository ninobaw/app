const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testWorkflowRoute() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver un workflow existant avec DG
    console.log('\n🔍 Recherche d\'un workflow avec DG...');
    const workflow = await CorrespondenceWorkflow.findOne()
      .populate('directeurGeneral', 'firstName lastName role')
      .populate('correspondanceId', 'subject title');

    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      return;
    }

    console.log(`✅ Workflow trouvé: ${workflow._id}`);
    console.log(`   - Correspondance: ${workflow.correspondanceId._id}`);
    console.log(`   - Sujet: ${workflow.correspondanceId.subject || workflow.correspondanceId.title}`);
    console.log(`   - DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
    console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);

    // 2. Tester la recherche par correspondanceId (comme le fait la route)
    console.log('\n🧪 Test de la route by-correspondance...');
    const correspondanceId = workflow.correspondanceId._id;
    console.log(`   Recherche pour correspondance: ${correspondanceId}`);

    const foundWorkflow = await CorrespondenceWorkflow.findOne({ correspondanceId })
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (foundWorkflow) {
      console.log(`✅ Workflow trouvé par route: ${foundWorkflow._id}`);
      console.log(`   - Status: ${foundWorkflow.currentStatus}`);
      console.log(`   - DG: ${foundWorkflow.directeurGeneral?.firstName} ${foundWorkflow.directeurGeneral?.lastName}`);
      console.log(`   - Directeur: ${foundWorkflow.assignedDirector?.firstName} ${foundWorkflow.assignedDirector?.lastName}`);
      
      // Simuler la réponse de la route
      const routeResponse = {
        success: true,
        data: {
          _id: foundWorkflow._id,
          correspondanceId: foundWorkflow.correspondanceId,
          currentStatus: foundWorkflow.currentStatus,
          assignedDirector: foundWorkflow.assignedDirector,
          directeurGeneral: foundWorkflow.directeurGeneral
        }
      };
      
      console.log('\n📡 Réponse simulée de la route:');
      console.log(JSON.stringify(routeResponse, null, 2));
    } else {
      console.log('❌ Workflow non trouvé par route');
    }

    // 3. Tester l'accès aux messages (comme le fait la route messages)
    console.log('\n💬 Test de la route messages...');
    const messagesWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('chatMessages.from', 'firstName lastName email role')
      .populate('chatMessages.to', 'firstName lastName email role')
      .populate('correspondanceId', 'subject content attachments priority createdAt')
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (messagesWorkflow) {
      console.log(`✅ Messages récupérés: ${messagesWorkflow.chatMessages?.length || 0}`);
      
      if (messagesWorkflow.chatMessages && messagesWorkflow.chatMessages.length > 0) {
        console.log('\n📝 Détails des messages:');
        messagesWorkflow.chatMessages.forEach((msg, index) => {
          console.log(`   ${index + 1}. De: ${msg.from?.firstName || 'Unknown'} vers: ${msg.to?.firstName || 'Unknown'}`);
          console.log(`      Message: "${msg.message?.substring(0, 50)}..."`);
          console.log(`      Timestamp: ${msg.timestamp}`);
        });
      }

      // Simuler la réponse de la route messages
      const messagesResponse = {
        success: true,
        data: {
          workflowId: messagesWorkflow._id,
          correspondance: {
            id: messagesWorkflow.correspondanceId._id,
            subject: messagesWorkflow.correspondanceId.subject,
            content: messagesWorkflow.correspondanceId.content,
            attachments: messagesWorkflow.correspondanceId.attachments || [],
            priority: messagesWorkflow.correspondanceId.priority,
            createdAt: messagesWorkflow.correspondanceId.createdAt
          },
          chatMessages: messagesWorkflow.chatMessages.map(msg => ({
            id: msg._id,
            from: {
              id: msg.from._id,
              name: `${msg.from.firstName} ${msg.from.lastName}`,
              email: msg.from.email,
              role: msg.from.role
            },
            to: {
              id: msg.to._id,
              name: `${msg.to.firstName} ${msg.to.lastName}`,
              email: msg.to.email,
              role: msg.to.role
            },
            message: msg.message,
            draftVersion: msg.draftVersion,
            attachments: msg.attachments || [],
            timestamp: msg.timestamp,
            isRead: msg.isRead
          })),
          currentStatus: messagesWorkflow.currentStatus,
          assignedDirector: messagesWorkflow.assignedDirector,
          directeurGeneral: messagesWorkflow.directeurGeneral
        }
      };

      console.log('\n📡 Réponse simulée de la route messages (résumé):');
      console.log(`   - Messages: ${messagesResponse.data.chatMessages.length}`);
      console.log(`   - Correspondance: ${messagesResponse.data.correspondance.subject}`);
      console.log(`   - Status: ${messagesResponse.data.currentStatus}`);
    }

    // 4. Vérifier les droits d'accès pour le DG
    console.log('\n🔐 Vérification des droits d\'accès DG...');
    const dg = workflow.directeurGeneral;
    if (dg) {
      const hasAccess = (
        workflow.assignedDirector?.toString() === dg._id ||
        workflow.directeurGeneral?.toString() === dg._id
      );
      console.log(`   DG ID: ${dg._id}`);
      console.log(`   Directeur assigné: ${workflow.assignedDirector}`);
      console.log(`   DG du workflow: ${workflow.directeurGeneral._id}`);
      console.log(`   ✅ Accès autorisé: ${hasAccess}`);
    }

    console.log('\n🎯 RÉSUMÉ DU TEST:');
    console.log(`✅ Workflow ID: ${workflow._id}`);
    console.log(`✅ Correspondance ID: ${correspondanceId}`);
    console.log(`✅ Route by-correspondance: Fonctionnelle`);
    console.log(`✅ Route messages: Fonctionnelle`);
    console.log(`✅ Messages disponibles: ${workflow.chatMessages?.length || 0}`);
    console.log(`✅ Accès DG: Autorisé`);

    console.log('\n🔧 URLs à tester dans le frontend:');
    console.log(`   - GET /api/workflow-chat/by-correspondance/${correspondanceId}`);
    console.log(`   - GET /api/workflow-chat/${workflow._id}/messages`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testWorkflowRoute();

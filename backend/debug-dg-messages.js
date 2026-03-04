const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

async function debugDGMessages() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB réussie');

    const correspondanceId = '68e80b66948741da98edd3b6';
    
    console.log('\n🔍 DIAGNOSTIC MESSAGES DG');
    console.log('=====================================');
    console.log(`Correspondance ID: ${correspondanceId}`);

    // 1. Récupérer le workflow
    const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId })
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      return;
    }

    console.log('\n📋 WORKFLOW TROUVÉ:');
    console.log(`   - ID: ${workflow._id}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - Nombre de messages: ${workflow.chatMessages.length}`);

    console.log('\n👥 PARTICIPANTS:');
    if (workflow.assignedDirector) {
      console.log(`   - Directeur assigné: ${workflow.assignedDirector.firstName} ${workflow.assignedDirector.lastName}`);
      console.log(`     * ID: ${workflow.assignedDirector._id}`);
      console.log(`     * Rôle: ${workflow.assignedDirector.role}`);
    }
    
    if (workflow.directeurGeneral) {
      console.log(`   - Directeur Général: ${workflow.directeurGeneral.firstName} ${workflow.directeurGeneral.lastName}`);
      console.log(`     * ID: ${workflow.directeurGeneral._id}`);
      console.log(`     * Rôle: ${workflow.directeurGeneral.role}`);
    }

    // 2. Analyser les messages
    console.log('\n💬 ANALYSE DES MESSAGES:');
    if (workflow.chatMessages.length === 0) {
      console.log('❌ Aucun message dans le workflow');
    } else {
      console.log(`✅ ${workflow.chatMessages.length} message(s) trouvé(s)`);
      
      for (let i = 0; i < workflow.chatMessages.length; i++) {
        const msg = workflow.chatMessages[i];
        console.log(`\n   Message ${i + 1}:`);
        console.log(`     - ID: ${msg._id}`);
        console.log(`     - De: ${msg.from}`);
        console.log(`     - Vers: ${msg.to}`);
        console.log(`     - Message: ${msg.message.substring(0, 100)}...`);
        console.log(`     - Timestamp: ${msg.timestamp}`);
        console.log(`     - isRead: ${msg.isRead}`);
        
        // Récupérer les infos des utilisateurs
        try {
          const fromUser = await User.findById(msg.from);
          const toUser = await User.findById(msg.to);
          
          console.log(`     - De (détails): ${fromUser ? `${fromUser.firstName} ${fromUser.lastName} (${fromUser.role})` : 'Utilisateur non trouvé'}`);
          console.log(`     - Vers (détails): ${toUser ? `${toUser.firstName} ${toUser.lastName} (${toUser.role})` : 'Utilisateur non trouvé'}`);
        } catch (err) {
          console.log(`     - Erreur récupération utilisateurs: ${err.message}`);
        }
      }
    }

    // 3. Vérifier l'accès DG
    console.log('\n🔐 VÉRIFICATION ACCÈS DG:');
    const dgId = workflow.directeurGeneral?._id || workflow.directeurGeneral;
    console.log(`   - DG ID dans workflow: ${dgId}`);
    
    // Simuler la logique d'accès
    const testUserId = dgId?.toString();
    const isAssignedDirector = workflow.assignedDirector?.toString() === testUserId;
    const isDirecteurGeneral = workflow.directeurGeneral?.toString() === testUserId || 
                              workflow.directeurGeneral?._id?.toString() === testUserId;
    
    console.log(`   - Test avec DG ID: ${testUserId}`);
    console.log(`   - isAssignedDirector: ${isAssignedDirector}`);
    console.log(`   - isDirecteurGeneral: ${isDirecteurGeneral}`);

    // 4. Test de récupération des messages comme le ferait l'API
    console.log('\n🧪 TEST API RÉCUPÉRATION MESSAGES:');
    
    // Récupérer les informations des utilisateurs pour les messages
    const userIds = new Set();
    workflow.chatMessages.forEach(msg => {
      if (msg.from) userIds.add(msg.from);
      if (msg.to) userIds.add(msg.to);
    });
    
    console.log(`   - Récupération infos pour ${userIds.size} utilisateurs`);
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select('firstName lastName email role');
    
    // Créer un map des utilisateurs
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      };
    });
    
    console.log(`   - Utilisateurs mappés: ${Object.keys(userMap).length}`);
    Object.values(userMap).forEach(u => {
      console.log(`     * ${u.name} (${u.role}) - ID: ${u.id}`);
    });

    // 5. Simuler la réponse API
    console.log('\n📤 SIMULATION RÉPONSE API:');
    const apiResponse = {
      workflowId: workflow._id,
      chatMessages: workflow.chatMessages.map(msg => ({
        id: msg._id,
        from: userMap[msg.from] || {
          id: msg.from,
          name: 'Utilisateur inconnu',
          email: '',
          role: ''
        },
        to: userMap[msg.to] || {
          id: msg.to,
          name: 'Destinataire inconnu',
          email: '',
          role: ''
        },
        message: msg.message,
        timestamp: msg.timestamp,
        isRead: msg.isRead
      })),
      currentStatus: workflow.currentStatus
    };

    console.log(`   - Messages formatés pour API: ${apiResponse.chatMessages.length}`);
    apiResponse.chatMessages.forEach((msg, index) => {
      console.log(`     ${index + 1}. ${msg.from.name} → ${msg.to.name}: ${msg.message.substring(0, 50)}...`);
    });

    // 6. Vérifier les messages visibles pour le DG
    console.log('\n👑 MESSAGES VISIBLES POUR LE DG:');
    const dgMessages = apiResponse.chatMessages.filter(msg => 
      msg.from.id === dgId?.toString() || msg.to.id === dgId?.toString()
    );
    
    console.log(`   - Messages impliquant le DG: ${dgMessages.length}`);
    dgMessages.forEach((msg, index) => {
      console.log(`     ${index + 1}. ${msg.from.name} → ${msg.to.name}: ${msg.message.substring(0, 50)}...`);
    });

    if (dgMessages.length === 0) {
      console.log('\n❌ PROBLÈME IDENTIFIÉ: Aucun message n\'implique le DG');
      console.log('   Solutions possibles:');
      console.log('   1. Vérifier que les messages sont envoyés vers le bon destinataire');
      console.log('   2. Vérifier que le DG est correctement assigné au workflow');
      console.log('   3. Vérifier la logique de détermination du destinataire');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion MongoDB');
  }
}

debugDGMessages();

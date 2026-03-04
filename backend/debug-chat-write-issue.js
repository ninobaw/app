const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugChatWriteIssue() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 DIAGNOSTIC - PROBLÈME D\'ÉCRITURE CHAT');
    console.log('==========================================');

    // 1. Vérifier les workflows existants
    console.log('\n📊 WORKFLOWS DISPONIBLES:');
    const workflows = await CorrespondenceWorkflow.find()
      .populate('directeurGeneral', 'firstName lastName email role')
      .populate('assignedDirector', 'firstName lastName email role')
      .limit(5);

    if (workflows.length === 0) {
      console.log('❌ PROBLÈME: Aucun workflow trouvé');
      console.log('💡 SOLUTION: Créez d\'abord un workflow de test');
      return;
    }

    workflows.forEach((workflow, index) => {
      console.log(`\n🔄 Workflow ${index + 1}: ${workflow._id}`);
      console.log(`   - DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName} (${workflow.directeurGeneral?._id})`);
      console.log(`   - Directeur: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName} (${workflow.assignedDirector?._id})`);
      console.log(`   - Messages: ${workflow.chatMessages.length}`);
      console.log(`   - Status: ${workflow.status}`);
    });

    // 2. Vérifier les utilisateurs et leurs rôles
    console.log('\n👥 UTILISATEURS AUTORISÉS:');
    const authorizedUsers = await User.find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR', 'SUPERVISEUR_BUREAU_ORDRE', 'SUPER_ADMIN'] }
    });

    console.log(`📊 Total utilisateurs autorisés: ${authorizedUsers.length}`);
    authorizedUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.role}) - ID: ${user._id}`);
    });

    // 3. Analyser les permissions d'un workflow spécifique
    const testWorkflow = workflows[0];
    console.log(`\n🔐 ANALYSE PERMISSIONS - Workflow: ${testWorkflow._id}`);
    
    console.log('\n✅ UTILISATEURS AUTORISÉS À ÉCRIRE:');
    authorizedUsers.forEach(user => {
      const hasAccess = (
        testWorkflow.assignedDirector?.toString() === user._id.toString() ||
        testWorkflow.directeurGeneral?.toString() === user._id.toString() ||
        user.role === 'SUPERVISEUR_BUREAU_ORDRE' ||
        user.role === 'SUPER_ADMIN'
      );
      
      console.log(`   ${hasAccess ? '✅' : '❌'} ${user.firstName} ${user.lastName} (${user.role})`);
      if (hasAccess) {
        console.log(`      → Peut écrire dans ce workflow`);
      } else {
        console.log(`      → ACCÈS REFUSÉ pour ce workflow`);
      }
    });

    // 4. Vérifier la route d'envoi de message
    console.log('\n🌐 VÉRIFICATION ROUTE ENVOI MESSAGE:');
    console.log('Route: POST /api/workflow-chat/:workflowId/send-message');
    console.log('Middleware: upload.array(\'attachments\', 5), auth');
    console.log('Paramètres requis:');
    console.log('   - message (string, obligatoire)');
    console.log('   - toUserId (string, optionnel)');
    console.log('   - attachments (files, optionnel)');

    // 5. Tester les conditions d'accès
    console.log('\n🧪 TEST CONDITIONS D\'ACCÈS:');
    
    const testUser = authorizedUsers.find(u => u.role === 'DIRECTEUR_GENERAL');
    if (testUser) {
      console.log(`\n👤 Test avec utilisateur: ${testUser.firstName} ${testUser.lastName}`);
      console.log(`   - Role: ${testUser.role}`);
      console.log(`   - ID: ${testUser._id}`);
      
      const canAccessWorkflow = (
        testWorkflow.assignedDirector?.toString() === testUser._id.toString() ||
        testWorkflow.directeurGeneral?.toString() === testUser._id.toString() ||
        testUser.role === 'SUPERVISEUR_BUREAU_ORDRE' ||
        testUser.role === 'SUPER_ADMIN'
      );
      
      console.log(`   - Peut accéder au workflow: ${canAccessWorkflow ? 'OUI' : 'NON'}`);
      
      if (canAccessWorkflow) {
        console.log(`   ✅ Cet utilisateur PEUT écrire dans le chat`);
      } else {
        console.log(`   ❌ Cet utilisateur NE PEUT PAS écrire dans le chat`);
      }
    }

    // 6. Problèmes courants et solutions
    console.log('\n⚠️ PROBLÈMES COURANTS ET SOLUTIONS:');
    
    console.log('\n🔍 PROBLÈME 1: Utilisateur non autorisé');
    console.log('   Symptômes: Bouton d\'envoi désactivé, message d\'erreur 403');
    console.log('   Solution: Vérifiez que l\'utilisateur connecté a le bon rôle');
    console.log('   Rôles autorisés: DIRECTEUR_GENERAL, DIRECTEUR, SOUS_DIRECTEUR, SUPERVISEUR_BUREAU_ORDRE, SUPER_ADMIN');

    console.log('\n🔍 PROBLÈME 2: Workflow non trouvé');
    console.log('   Symptômes: Erreur 404, chat ne se charge pas');
    console.log('   Solution: Vérifiez que le workflow existe et que l\'ID est correct');

    console.log('\n🔍 PROBLÈME 3: Problème d\'authentification');
    console.log('   Symptômes: Erreur 401, redirection vers login');
    console.log('   Solution: Reconnectez-vous, vérifiez le token JWT');

    console.log('\n🔍 PROBLÈME 4: Message vide');
    console.log('   Symptômes: Bouton d\'envoi désactivé');
    console.log('   Solution: Tapez du texte ou ajoutez un fichier');

    console.log('\n🔍 PROBLÈME 5: Erreur serveur');
    console.log('   Symptômes: Erreur 500, message non envoyé');
    console.log('   Solution: Vérifiez les logs du serveur backend');

    // 7. Instructions de test
    console.log('\n🧪 INSTRUCTIONS DE TEST:');
    console.log('1. Connectez-vous avec un utilisateur autorisé');
    console.log('2. Ouvrez le chat d\'un workflow où vous avez accès');
    console.log('3. Tapez un message dans le champ de texte');
    console.log('4. Cliquez sur "Envoyer" ou appuyez sur Entrée');
    console.log('5. Vérifiez que le message apparaît dans le chat');

    console.log('\n🔧 COMMANDES DE DEBUG:');
    console.log('1. Ouvrez la console du navigateur (F12)');
    console.log('2. Regardez les erreurs dans l\'onglet Console');
    console.log('3. Vérifiez les requêtes dans l\'onglet Network');
    console.log('4. Cherchez les erreurs 401, 403, 404, 500');

    console.log('\n✅ DIAGNOSTIC TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugChatWriteIssue();

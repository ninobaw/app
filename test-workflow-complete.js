const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Données de test
const testUsers = {
  admin: {
    email: 'abdallah.benkhalifa@tav.aero',
    password: 'password123'
  },
  dg: {
    email: 'nourssine.fradi@tav.aero', // Assumons qu'il est DG
    password: 'password123'
  }
};

// Fonction utilitaire pour les requêtes authentifiées
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Erreur ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Étape 1: Connexion
const login = async (userType = 'admin') => {
  console.log(`\n🔐 Connexion en tant que ${userType}...`);
  try {
    const user = testUsers[userType];
    const response = await axios.post(`${BASE_URL}/auth/login`, user);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log(`✅ Connexion réussie pour ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      return response.data.user;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    throw error;
  }
};

// Étape 2: Créer une correspondance de test
const createTestCorrespondence = async () => {
  console.log('\n📧 Création d\'une correspondance de test...');
  
  const correspondenceData = {
    subject: 'Test Workflow - Demande d\'information urgente',
    content: 'Ceci est une correspondance de test pour valider le workflow complet de traitement. Merci de traiter cette demande en priorité.',
    from: 'test.externe@example.com',
    to: 'contact@tav.aero',
    type: 'ENTRANT',
    priority: 'HIGH',
    status: 'PENDING'
  };
  
  try {
    const result = await apiCall('POST', '/correspondances', correspondenceData);
    if (result.success) {
      console.log('✅ Correspondance créée avec succès');
      console.log(`   ID: ${result.data._id}`);
      console.log(`   Sujet: ${result.data.subject}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur création correspondance');
    throw error;
  }
};

// Étape 3: Créer un workflow
const createWorkflow = async (correspondenceId, dgId) => {
  console.log('\n⚡ Création du workflow...');
  
  const workflowData = {
    correspondenceId,
    directeurGeneralId: dgId,
    priority: 'HIGH'
  };
  
  try {
    const result = await apiCall('POST', '/workflow/create', workflowData);
    if (result.success) {
      console.log('✅ Workflow créé avec succès');
      console.log(`   ID: ${result.data._id}`);
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur création workflow');
    throw error;
  }
};

// Étape 4: DG ajoute consigne et assigne
const dgAssignTask = async (workflowId, assignedUserId) => {
  console.log('\n👨‍💼 DG ajoute une consigne et assigne...');
  
  const assignData = {
    comment: 'Merci de traiter cette demande en priorité. Veuillez préparer une réponse détaillée en expliquant notre position sur ce sujet.',
    assignedToId: assignedUserId
  };
  
  try {
    const result = await apiCall('POST', `/workflow/${workflowId}/dg-assign`, assignData);
    if (result.success) {
      console.log('✅ Consigne ajoutée et tâche assignée');
      console.log(`   Statut: ${result.data.currentStatus}`);
      console.log(`   Assigné à: ${result.data.assignedTo?.firstName} ${result.data.assignedTo?.lastName}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur assignation DG');
    throw error;
  }
};

// Étape 5: Personne assignée soumet proposition
const submitDraftResponse = async (workflowId) => {
  console.log('\n✍️ Soumission de la proposition de réponse...');
  
  const draftData = {
    draftResponse: `Monsieur/Madame,

Suite à votre demande d'information, nous avons l'honneur de vous informer que :

1. Notre organisation dispose de toutes les certifications requises
2. Nous respectons scrupuleusement les normes internationales
3. Nos équipes sont formées aux dernières procédures

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
L'équipe TAV`,
    comment: 'Proposition de réponse complète basée sur les consignes du DG'
  };
  
  try {
    const result = await apiCall('POST', `/workflow/${workflowId}/submit-draft`, draftData);
    if (result.success) {
      console.log('✅ Proposition soumise pour approbation');
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur soumission proposition');
    throw error;
  }
};

// Étape 6: DG révise et approuve
const dgReviewAndApprove = async (workflowId, action = 'approve') => {
  console.log(`\n🔍 DG révise la proposition (${action})...`);
  
  const reviewData = {
    action,
    comment: action === 'approve' 
      ? 'Proposition approuvée. Excellente réponse, vous pouvez l\'envoyer.'
      : 'Merci de réviser la proposition en ajoutant plus de détails techniques.',
    finalResponse: action === 'approve' ? undefined : undefined // Utiliser la proposition existante
  };
  
  try {
    const result = await apiCall('POST', `/workflow/${workflowId}/dg-review`, reviewData);
    if (result.success) {
      console.log(`✅ Révision ${action === 'approve' ? 'approuvée' : 'demandée'}`);
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur révision DG');
    throw error;
  }
};

// Étape 7: Envoyer la réponse finale
const sendFinalResponse = async (workflowId) => {
  console.log('\n📤 Envoi de la réponse finale...');
  
  const sendData = {
    comment: 'Réponse envoyée au destinataire par email'
  };
  
  try {
    const result = await apiCall('POST', `/workflow/${workflowId}/send-response`, sendData);
    if (result.success) {
      console.log('✅ Réponse finale envoyée');
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur envoi réponse');
    throw error;
  }
};

// Fonction pour afficher l'historique du workflow
const displayWorkflowHistory = async (workflowId) => {
  console.log('\n📋 Historique du workflow:');
  
  try {
    const result = await apiCall('GET', `/workflow/${workflowId}`);
    if (result.success) {
      const workflow = result.data;
      console.log(`\n   Workflow ID: ${workflow._id}`);
      console.log(`   Correspondance: ${workflow.correspondenceId.subject}`);
      console.log(`   Statut actuel: ${workflow.currentStatus}`);
      console.log(`   Créé le: ${new Date(workflow.createdAt).toLocaleString('fr-FR')}`);
      
      console.log('\n   Actions effectuées:');
      workflow.actions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.actionType} - ${action.performedBy.firstName} ${action.performedBy.lastName}`);
        console.log(`      Date: ${new Date(action.performedAt).toLocaleString('fr-FR')}`);
        if (action.comment) {
          console.log(`      Commentaire: ${action.comment}`);
        }
        if (action.assignedTo) {
          console.log(`      Assigné à: ${action.assignedTo.firstName} ${action.assignedTo.lastName}`);
        }
        console.log('');
      });
      
      if (workflow.finalResponse) {
        console.log(`   Réponse finale: ${workflow.finalResponse.substring(0, 100)}...`);
      }
      
      return workflow;
    }
  } catch (error) {
    console.error('❌ Erreur récupération historique');
    throw error;
  }
};

// Test complet du workflow
const testCompleteWorkflow = async () => {
  console.log('🚀 DÉBUT DU TEST COMPLET DU WORKFLOW DE CORRESPONDANCE');
  console.log('=' .repeat(60));
  
  try {
    // 1. Connexion admin pour créer la correspondance
    const adminUser = await login('admin');
    
    // 2. Créer une correspondance
    const correspondence = await createTestCorrespondence();
    
    // 3. Obtenir la liste des DG (ou utiliser un ID connu)
    console.log('\n👥 Recherche du Directeur Général...');
    const usersResult = await apiCall('GET', '/users');
    const directeurGeneral = usersResult.data.find(user => 
      user.role === 'DIRECTEUR_GENERAL' || user.role === 'ADMINISTRATOR'
    );
    
    if (!directeurGeneral) {
      console.error('❌ Aucun Directeur Général trouvé');
      return;
    }
    
    console.log(`✅ DG trouvé: ${directeurGeneral.firstName} ${directeurGeneral.lastName}`);
    
    // 4. Créer le workflow
    const workflow = await createWorkflow(correspondence._id, directeurGeneral._id);
    
    // 5. Se connecter en tant que DG (si différent)
    if (directeurGeneral._id !== adminUser.id) {
      await login('dg');
    }
    
    // 6. DG assigne la tâche (on assigne à l'admin pour simplifier)
    const updatedWorkflow1 = await dgAssignTask(workflow._id, adminUser.id);
    
    // 7. Se reconnecter en tant que personne assignée
    await login('admin');
    
    // 8. Soumettre une proposition
    const updatedWorkflow2 = await submitDraftResponse(workflow._id);
    
    // 9. Se reconnecter en tant que DG
    if (directeurGeneral._id !== adminUser.id) {
      await login('dg');
    }
    
    // 10. DG révise et approuve
    const updatedWorkflow3 = await dgReviewAndApprove(workflow._id, 'approve');
    
    // 11. Envoyer la réponse finale
    const finalWorkflow = await sendFinalResponse(workflow._id);
    
    // 12. Afficher l'historique complet
    await displayWorkflowHistory(workflow._id);
    
    console.log('\n🎉 TEST COMPLET RÉUSSI !');
    console.log('=' .repeat(60));
    console.log('Le workflow de correspondance a été testé avec succès.');
    console.log(`Workflow ID: ${workflow._id}`);
    console.log(`URL Frontend: http://localhost:8080/workflow/${workflow._id}`);
    
  } catch (error) {
    console.error('\n💥 ERREUR DANS LE TEST:', error.message);
    process.exit(1);
  }
};

// Fonction pour tester un scénario de révision
const testRevisionScenario = async () => {
  console.log('\n🔄 TEST SCÉNARIO AVEC RÉVISION');
  console.log('=' .repeat(40));
  
  try {
    // Répéter les étapes 1-8 du test principal
    const adminUser = await login('admin');
    const correspondence = await createTestCorrespondence();
    
    const usersResult = await apiCall('GET', '/users');
    const directeurGeneral = usersResult.data.find(user => 
      user.role === 'DIRECTEUR_GENERAL' || user.role === 'ADMINISTRATOR'
    );
    
    const workflow = await createWorkflow(correspondence._id, directeurGeneral._id);
    
    if (directeurGeneral._id !== adminUser.id) {
      await login('dg');
    }
    
    await dgAssignTask(workflow._id, adminUser.id);
    await login('admin');
    await submitDraftResponse(workflow._id);
    
    if (directeurGeneral._id !== adminUser.id) {
      await login('dg');
    }
    
    // DG demande une révision
    await dgReviewAndApprove(workflow._id, 'reject');
    
    // Personne assignée révise
    await login('admin');
    await submitDraftResponse(workflow._id);
    
    // DG approuve cette fois
    if (directeurGeneral._id !== adminUser.id) {
      await login('dg');
    }
    await dgReviewAndApprove(workflow._id, 'approve');
    
    // Envoi final
    await sendFinalResponse(workflow._id);
    
    console.log('✅ Scénario avec révision testé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur dans le scénario de révision:', error.message);
  }
};

// Exécution des tests
const runAllTests = async () => {
  try {
    await testCompleteWorkflow();
    
    console.log('\n' + '='.repeat(60));
    console.log('Voulez-vous tester le scénario avec révision ? (Tapez "oui" pour continuer)');
    
    // Pour l'instant, on lance directement le test de révision
    // Dans un vrai environnement, on pourrait attendre une entrée utilisateur
    setTimeout(async () => {
      await testRevisionScenario();
    }, 2000);
    
  } catch (error) {
    console.error('Erreur générale:', error.message);
  }
};

// Lancer les tests
runAllTests();

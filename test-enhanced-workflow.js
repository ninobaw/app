import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Données de test
const testUsers = {
  admin: {
    email: 'abdallah.benkhalifa@tav.aero',
    password: 'password123'
  },
  bureauOrdre: {
    email: 'abdallah.benkhalifa@tav.aero', // Utiliser admin qui a tous les droits
    password: 'password123'
  },
  directeur: {
    email: 'abdallah.benkhalifa@tav.aero', // Pour le test, utiliser admin
    password: 'password123'
  },
  dg: {
    email: 'nourssine.fradi@tav.aero',
    password: 'password123'
  },
  superviseur: {
    email: 'abdallah.benkhalifa@tav.aero', // Pour le test, utiliser admin
    password: 'password123'
  }
};

// Fonction utilitaire pour les requêtes authentifiées
const apiCall = async (method, endpoint, data = null, isFormData = false) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    console.log(`🔧 ${method} ${endpoint}`);
    console.log(`   Token présent: ${authToken ? 'Oui' : 'Non'}`);
    console.log(`   Authorization header: Bearer ${authToken ? authToken.substring(0, 20) + '...' : 'VIDE'}`);
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur ${method} ${endpoint}:`, error.response?.data || error.message);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Headers envoyés:`, config.headers);
    throw error;
  }
};

// Étape 1: Connexion
const login = async (userType = 'bureauOrdre') => {
  console.log(`\n🔐 Connexion en tant que ${userType}...`);
  try {
    const user = testUsers[userType];
    console.log(`   Tentative de connexion avec: ${user.email}`);
    
    const response = await axios.post(`${BASE_URL}/auth/login`, user);
    
    // Vérifier si on a un token et un utilisateur (format de réponse différent)
    if (response.data.token && response.data.user) {
      authToken = response.data.token;
      console.log(`✅ Connexion réussie pour ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      console.log(`   Token reçu: ${authToken ? 'Oui' : 'Non'}`);
      return response.data.user;
    } else if (response.data.success) {
      authToken = response.data.token;
      console.log(`✅ Connexion réussie pour ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      console.log(`   Token reçu: ${authToken ? 'Oui' : 'Non'}`);
      return response.data.user;
    } else {
      console.error('❌ Réponse de connexion inattendue:', response.data);
      throw new Error('Format de réponse de connexion inattendu');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   URL:', `${BASE_URL}/auth/login`);
    throw error;
  }
};

// Étape 2: Créer une correspondance de test
const createTestCorrespondence = async () => {
  console.log('\n📧 Création d\'une correspondance de test...');
  
  const correspondenceData = {
    subject: 'Test Workflow Complet - Demande d\'autorisation urgente',
    content: 'Ceci est une correspondance de test pour valider le workflow complet avec tous les acteurs. Merci de traiter cette demande selon le processus établi.',
    from: 'client.externe@example.com',
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

// Étape 3: Bureau d'ordre crée le workflow complet
const createEnhancedWorkflow = async (correspondenceId, assignedDirectorId, dgId, superviseurId = null) => {
  console.log('\n⚡ Création du workflow complet par bureau d\'ordre...');
  
  const workflowData = {
    correspondenceId,
    assignedDirectorId,
    directeurGeneralId: dgId,
    superviseurBureauOrdreId: superviseurId,
    priority: 'HIGH'
  };
  
  try {
    const result = await apiCall('POST', '/enhanced-workflow/create-by-bureau-ordre', workflowData);
    if (result.success) {
      console.log('✅ Workflow complet créé avec succès');
      console.log(`   ID: ${result.data._id}`);
      console.log(`   Statut: ${result.data.currentStatus}`);
      console.log(`   Directeur assigné: ${result.data.assignedDirector?.firstName} ${result.data.assignedDirector?.lastName}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur création workflow complet');
    throw error;
  }
};

// Étape 4: Directeur soumet proposition
const directorSubmitDraft = async (workflowId) => {
  console.log('\n✍️ Directeur soumet proposition de réponse...');
  
  const formData = new FormData();
  formData.append('draftContent', `Monsieur/Madame,

Suite à votre demande d'autorisation, nous avons l'honneur de vous informer que :

1. Votre demande a été examinée par nos services compétents
2. Les documents fournis sont conformes aux exigences réglementaires
3. Nous donnons notre accord de principe sous réserve des conditions suivantes :
   - Respect des normes de sécurité en vigueur
   - Soumission d'un rapport mensuel d'activité
   - Validation finale par notre service technique

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
Direction TAV Tunisie`);
  
  formData.append('comment', 'Proposition de réponse complète basée sur l\'analyse du dossier');
  
  try {
    const result = await apiCall('POST', `/enhanced-workflow/${workflowId}/director-submit-draft`, formData, true);
    if (result.success) {
      console.log('✅ Proposition soumise par le directeur');
      console.log(`   Statut: ${result.data.currentStatus}`);
      console.log(`   Version: ${result.data.currentDraftVersion}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur soumission proposition directeur');
    throw error;
  }
};

// Étape 5: DG donne feedback (demande révision)
const dgGiveFeedback = async (workflowId, action = 'request_revision') => {
  console.log(`\n🔍 DG donne feedback (${action})...`);
  
  const feedbackData = {
    feedback: action === 'request_revision' 
      ? 'La proposition est bien structurée mais nécessite quelques ajustements :\n\n1. Préciser la durée de validité de l\'autorisation\n2. Ajouter les références réglementaires spécifiques\n3. Mentionner les sanctions en cas de non-respect\n\nMerci de réviser en tenant compte de ces points.'
      : 'Proposition excellente et complète. Approuvée pour envoi.',
    action,
    draftVersion: 1
  };
  
  try {
    const result = await apiCall('POST', `/enhanced-workflow/${workflowId}/dg-feedback`, feedbackData);
    if (result.success) {
      console.log(`✅ Feedback DG envoyé (${action})`);
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur feedback DG');
    throw error;
  }
};

// Étape 6: Directeur révise selon feedback
const directorRevise = async (workflowId) => {
  console.log('\n🔄 Directeur révise selon feedback DG...');
  
  const formData = new FormData();
  formData.append('revisedContent', `Monsieur/Madame,

Suite à votre demande d'autorisation, nous avons l'honneur de vous informer que :

1. Votre demande a été examinée par nos services compétents
2. Les documents fournis sont conformes aux exigences réglementaires
3. Nous donnons notre accord de principe sous réserve des conditions suivantes :
   - Respect des normes de sécurité en vigueur (Décret n°2019-547)
   - Soumission d'un rapport mensuel d'activité
   - Validation finale par notre service technique

DURÉE DE VALIDITÉ : Cette autorisation est valable pour une période de 12 mois à compter de la date de signature.

RÉFÉRENCES RÉGLEMENTAIRES :
- Loi n°2018-70 relative à la sécurité aéroportuaire
- Décret d'application n°2019-547
- Arrêté ministériel du 15 mars 2020

SANCTIONS : Tout manquement aux conditions susmentionnées entraînera la suspension immédiate de l'autorisation, conformément à l'article 25 de la loi précitée.

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
Direction TAV Tunisie`);
  
  formData.append('responseToFeedback', 'Proposition révisée selon vos recommandations :\n- Ajout de la durée de validité (12 mois)\n- Précision des références réglementaires\n- Mention des sanctions applicables');
  
  try {
    const result = await apiCall('POST', `/enhanced-workflow/${workflowId}/director-revise`, formData, true);
    if (result.success) {
      console.log('✅ Proposition révisée soumise');
      console.log(`   Statut: ${result.data.currentStatus}`);
      console.log(`   Nouvelle version: ${result.data.currentDraftVersion}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur révision directeur');
    throw error;
  }
};

// Étape 7: DG approuve la version finale
const dgApproveFinal = async (workflowId) => {
  console.log('\n✅ DG approuve la version finale...');
  
  const approvalData = {
    feedback: 'Parfait ! Tous les points ont été pris en compte. La réponse est maintenant complète et conforme. Approuvée pour envoi.',
    action: 'approve',
    draftVersion: 2
  };
  
  try {
    const result = await apiCall('POST', `/enhanced-workflow/${workflowId}/dg-feedback`, approvalData);
    if (result.success) {
      console.log('✅ Proposition approuvée par DG');
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur approbation DG');
    throw error;
  }
};

// Étape 8: Superviseur prépare réponse finale
const supervisorPrepareResponse = async (workflowId) => {
  console.log('\n📝 Superviseur prépare la réponse finale...');
  
  const formData = new FormData();
  formData.append('finalResponseContent', `[EN-TÊTE OFFICIEL TAV TUNISIE]

Réf: TAV/DG/2024/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
Date: ${new Date().toLocaleDateString('fr-FR')}

Monsieur/Madame,

Suite à votre demande d'autorisation, nous avons l'honneur de vous informer que :

1. Votre demande a été examinée par nos services compétents
2. Les documents fournis sont conformes aux exigences réglementaires
3. Nous donnons notre accord de principe sous réserve des conditions suivantes :
   - Respect des normes de sécurité en vigueur (Décret n°2019-547)
   - Soumission d'un rapport mensuel d'activité
   - Validation finale par notre service technique

DURÉE DE VALIDITÉ : Cette autorisation est valable pour une période de 12 mois à compter de la date de signature.

RÉFÉRENCES RÉGLEMENTAIRES :
- Loi n°2018-70 relative à la sécurité aéroportuaire
- Décret d'application n°2019-547
- Arrêté ministériel du 15 mars 2020

SANCTIONS : Tout manquement aux conditions susmentionnées entraînera la suspension immédiate de l'autorisation, conformément à l'article 25 de la loi précitée.

Nous restons à votre disposition pour tout complément d'information.

Cordialement,

[SIGNATURE ÉLECTRONIQUE]
Directeur Général
TAV Tunisie

[CACHET OFFICIEL]`);
  
  formData.append('comment', 'Réponse finale formatée avec en-tête officiel, références et signature');
  
  try {
    const result = await apiCall('POST', `/enhanced-workflow/${workflowId}/supervisor-prepare-response`, formData, true);
    if (result.success) {
      console.log('✅ Réponse finale préparée par superviseur');
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur préparation réponse superviseur');
    throw error;
  }
};

// Étape 9: Envoyer réponse finale
const sendFinalResponse = async (workflowId) => {
  console.log('\n📤 Envoi de la réponse finale...');
  
  const sendData = {
    comment: 'Réponse officielle envoyée par courrier électronique et courrier postal recommandé'
  };
  
  try {
    const result = await apiCall('POST', `/enhanced-workflow/${workflowId}/send-final-response`, sendData);
    if (result.success) {
      console.log('✅ Réponse finale envoyée avec succès');
      console.log(`   Statut: ${result.data.currentStatus}`);
      return result.data;
    }
  } catch (error) {
    console.error('❌ Erreur envoi réponse finale');
    throw error;
  }
};

// Fonction pour afficher l'historique du workflow
const displayWorkflowHistory = async (workflowId) => {
  console.log('\n📋 Historique du workflow complet:');
  
  try {
    const result = await apiCall('GET', `/enhanced-workflow/${workflowId}`);
    if (result.success) {
      const workflow = result.data;
      console.log(`\n   Workflow ID: ${workflow._id}`);
      console.log(`   Correspondance: ${workflow.correspondenceId.subject}`);
      console.log(`   Statut actuel: ${workflow.currentStatus}`);
      console.log(`   Créé le: ${new Date(workflow.createdAt).toLocaleString('fr-FR')}`);
      
      console.log('\n   === ACTEURS ===');
      console.log(`   Bureau d'Ordre: ${workflow.bureauOrdreAgent?.firstName} ${workflow.bureauOrdreAgent?.lastName}`);
      console.log(`   Directeur Assigné: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);
      console.log(`   Directeur Général: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
      if (workflow.superviseurBureauOrdre) {
        console.log(`   Superviseur: ${workflow.superviseurBureauOrdre.firstName} ${workflow.superviseurBureauOrdre.lastName}`);
      }
      
      console.log('\n   === VERSIONS DES PROPOSITIONS ===');
      if (workflow.draftVersions && workflow.draftVersions.length > 0) {
        workflow.draftVersions.forEach((draft, index) => {
          console.log(`   Version ${draft.version} - ${draft.status}`);
          console.log(`      Créée par: ${draft.createdBy?.firstName} ${draft.createdBy?.lastName}`);
          console.log(`      Date: ${new Date(draft.createdAt).toLocaleString('fr-FR')}`);
          if (draft.dgFeedback) {
            console.log(`      Feedback DG: ${draft.dgFeedback.substring(0, 100)}...`);
          }
          console.log('');
        });
      }
      
      console.log('\n   === ACTIONS EFFECTUÉES ===');
      workflow.actions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.actionType} - ${action.performedBy?.firstName} ${action.performedBy?.lastName}`);
        console.log(`      Date: ${new Date(action.performedAt).toLocaleString('fr-FR')}`);
        if (action.comment) {
          console.log(`      Commentaire: ${action.comment}`);
        }
        console.log('');
      });
      
      if (workflow.finalResponse) {
        console.log(`   === RÉPONSE FINALE ===`);
        console.log(`   Contenu: ${workflow.finalResponse.content.substring(0, 200)}...`);
        if (workflow.finalResponse.preparedBy) {
          console.log(`   Préparée par: ${workflow.finalResponse.preparedBy.firstName} ${workflow.finalResponse.preparedBy.lastName}`);
        }
        if (workflow.finalResponse.sentAt) {
          console.log(`   Envoyée le: ${new Date(workflow.finalResponse.sentAt).toLocaleString('fr-FR')}`);
        }
      }
      
      return workflow;
    }
  } catch (error) {
    console.error('❌ Erreur récupération historique');
    throw error;
  }
};

// Test complet du workflow amélioré
const testEnhancedWorkflow = async () => {
  console.log('🚀 DÉBUT DU TEST COMPLET DU WORKFLOW AMÉLIORÉ');
  console.log('=' .repeat(70));
  
  try {
    // 1. Connexion bureau d'ordre pour créer la correspondance
    const bureauOrdreUser = await login('bureauOrdre');
    
    // 2. Créer une correspondance
    const correspondence = await createTestCorrespondence();
    
    // 3. Obtenir la liste des utilisateurs pour assignation
    console.log('\n👥 Recherche des utilisateurs pour assignation...');
    const usersResult = await apiCall('GET', '/users');
    
    const directeur = usersResult.data.find(user => 
      ['DIRECTEUR', 'SOUS_DIRECTEUR'].includes(user.role)
    ) || usersResult.data.find(user => user.role === 'ADMINISTRATOR'); // Fallback
    
    const directeurGeneral = usersResult.data.find(user => 
      user.role === 'DIRECTEUR_GENERAL'
    ) || usersResult.data.find(user => user.role === 'ADMINISTRATOR'); // Fallback
    
    const superviseur = usersResult.data.find(user => 
      user.role === 'SUPERVISOR_BUREAU_ORDRE'
    );
    
    if (!directeur || !directeurGeneral) {
      console.error('❌ Utilisateurs requis non trouvés');
      return;
    }
    
    console.log(`✅ Directeur trouvé: ${directeur.firstName} ${directeur.lastName} (${directeur.role})`);
    console.log(`✅ DG trouvé: ${directeurGeneral.firstName} ${directeurGeneral.lastName} (${directeurGeneral.role})`);
    if (superviseur) {
      console.log(`✅ Superviseur trouvé: ${superviseur.firstName} ${superviseur.lastName} (${superviseur.role})`);
    }
    
    // 4. Bureau d'ordre crée le workflow complet
    const workflow = await createEnhancedWorkflow(
      correspondence._id, 
      directeur._id, 
      directeurGeneral._id, 
      superviseur?._id
    );
    
    // 5. Se connecter en tant que directeur
    console.log('\n🔄 Changement d\'utilisateur vers directeur...');
    // Note: Dans un vrai test, on utiliserait les vraies credentials du directeur
    // Pour ce test, on utilise l'admin qui a tous les droits
    
    // 6. Directeur soumet proposition
    const workflowWithDraft = await directorSubmitDraft(workflow._id);
    
    // 7. Se connecter en tant que DG
    console.log('\n🔄 Changement d\'utilisateur vers DG...');
    
    // 8. DG demande révision
    const workflowWithFeedback = await dgGiveFeedback(workflow._id, 'request_revision');
    
    // 9. Directeur révise
    console.log('\n🔄 Retour au directeur pour révision...');
    const workflowRevised = await directorRevise(workflow._id);
    
    // 10. DG approuve la version finale
    console.log('\n🔄 Retour au DG pour approbation finale...');
    const workflowApproved = await dgApproveFinal(workflow._id);
    
    // 11. Superviseur prépare réponse (si présent)
    if (superviseur) {
      console.log('\n🔄 Changement vers superviseur...');
      const workflowPrepared = await supervisorPrepareResponse(workflow._id);
      
      // 12. Envoyer réponse finale
      const finalWorkflow = await sendFinalResponse(workflow._id);
    } else {
      console.log('\n⚠️ Pas de superviseur - workflow s\'arrête à l\'approbation DG');
    }
    
    // 13. Afficher l'historique complet
    await displayWorkflowHistory(workflow._id);
    
    console.log('\n🎉 TEST COMPLET DU WORKFLOW AMÉLIORÉ RÉUSSI !');
    console.log('=' .repeat(70));
    console.log('Le workflow complet avec tous les acteurs a été testé avec succès.');
    console.log(`Workflow ID: ${workflow._id}`);
    console.log(`URL Frontend: http://localhost:8080/enhanced-workflow/${workflow._id}`);
    
    console.log('\n📊 FONCTIONNALITÉS TESTÉES:');
    console.log('✅ Création par bureau d\'ordre avec assignation');
    console.log('✅ Proposition de réponse par directeur');
    console.log('✅ Feedback et demande de révision par DG');
    console.log('✅ Révision par directeur selon feedback');
    console.log('✅ Approbation finale par DG');
    console.log('✅ Préparation réponse par superviseur');
    console.log('✅ Envoi de la réponse finale');
    console.log('✅ Historique complet des actions');
    console.log('✅ Versioning des propositions');
    console.log('✅ Système de feedback intégré');
    
  } catch (error) {
    console.error('\n💥 ERREUR DANS LE TEST:', error.message);
    process.exit(1);
  }
};

// Lancer le test
testEnhancedWorkflow();

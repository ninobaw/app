import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const testWorkflowWithExisting = async () => {
  console.log('🚀 TEST WORKFLOW AVEC CORRESPONDANCE EXISTANTE');
  console.log('=' .repeat(60));
  
  try {
    // 1. Connexion
    console.log('\n1️⃣ Connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abdallah.benkhalifa@tav.aero',
      password: 'password123'
    });
    
    const authToken = loginResponse.data.token;
    console.log(`✅ Connecté: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
    console.log(`   Rôle: ${loginResponse.data.user.role}`);
    
    // 2. Récupérer une correspondance existante
    console.log('\n2️⃣ Récupération correspondance existante...');
    const corrListResponse = await axios.get(`${BASE_URL}/correspondances`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!corrListResponse.data.data || corrListResponse.data.data.length === 0) {
      throw new Error('Aucune correspondance existante trouvée');
    }
    
    const correspondence = corrListResponse.data.data[0];
    console.log(`✅ Correspondance sélectionnée: ${correspondence._id}`);
    console.log(`   Sujet: ${correspondence.subject}`);
    console.log(`   De: ${correspondence.from}`);
    console.log(`   À: ${correspondence.to}`);
    
    // 3. Récupérer les utilisateurs
    console.log('\n3️⃣ Récupération utilisateurs...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✅ ${users.length} utilisateurs trouvés`);
    
    // Trouver les rôles nécessaires
    const directeur = users.find(u => ['DIRECTEUR', 'SOUS_DIRECTEUR', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(u.role));
    const dg = users.find(u => ['DIRECTEUR_GENERAL', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(u.role));
    const superviseur = users.find(u => ['SUPERVISOR_BUREAU_ORDRE', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(u.role));
    
    if (!directeur || !dg) {
      console.log('📋 Utilisateurs disponibles:');
      users.forEach(u => console.log(`   - ${u.firstName} ${u.lastName} (${u.role})`));
      throw new Error('Utilisateurs requis non trouvés');
    }
    
    console.log(`✅ Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur.role})`);
    console.log(`✅ DG: ${dg.firstName} ${dg.lastName} (${dg.role})`);
    if (superviseur) {
      console.log(`✅ Superviseur: ${superviseur.firstName} ${superviseur.lastName} (${superviseur.role})`);
    }
    
    // 4. Créer le workflow amélioré
    console.log('\n4️⃣ Création workflow amélioré...');
    const workflowData = {
      correspondenceId: correspondence._id,
      assignedDirectorId: directeur._id || directeur.id,
      directeurGeneralId: dg._id || dg.id,
      superviseurBureauOrdreId: superviseur ? (superviseur._id || superviseur.id) : undefined,
      priority: 'HIGH'
    };
    
    console.log('📋 Données workflow:', {
      correspondenceId: workflowData.correspondenceId,
      assignedDirectorId: workflowData.assignedDirectorId,
      directeurGeneralId: workflowData.directeurGeneralId,
      superviseurBureauOrdreId: workflowData.superviseurBureauOrdreId,
      priority: workflowData.priority
    });
    
    const workflowResponse = await axios.post(`${BASE_URL}/enhanced-workflow/create-by-bureau-ordre`, workflowData, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📋 Réponse complète workflow:');
    console.log(JSON.stringify(workflowResponse.data, null, 2));
    
    if (workflowResponse.data.success) {
      const workflow = workflowResponse.data.data;
      console.log('\n🎉 WORKFLOW CRÉÉ AVEC SUCCÈS !');
      console.log('=' .repeat(50));
      console.log(`✅ Workflow ID: ${workflow._id}`);
      console.log(`✅ Statut: ${workflow.currentStatus}`);
      console.log(`✅ Priorité: ${workflow.priority}`);
      
      // Afficher les acteurs
      console.log('\n👥 ACTEURS ASSIGNÉS:');
      console.log(`   Bureau d'Ordre: ${workflow.bureauOrdreAgent?.firstName} ${workflow.bureauOrdreAgent?.lastName}`);
      console.log(`   Directeur: ${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName}`);
      console.log(`   DG: ${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName}`);
      if (workflow.superviseurBureauOrdre) {
        console.log(`   Superviseur: ${workflow.superviseurBureauOrdre.firstName} ${workflow.superviseurBureauOrdre.lastName}`);
      }
      
      // URLs d'accès
      console.log('\n🌐 ACCÈS AU WORKFLOW:');
      console.log(`   Frontend: http://localhost:8080/enhanced-workflow/${workflow._id}`);
      console.log(`   API: ${BASE_URL}/enhanced-workflow/${workflow._id}`);
      
      // Instructions pour la suite
      console.log('\n📋 ÉTAPES SUIVANTES:');
      console.log('1. Ouvrir l\'URL frontend dans le navigateur');
      console.log('2. Se connecter en tant que directeur assigné');
      console.log('3. Rédiger une proposition de réponse');
      console.log('4. Se connecter en tant que DG pour réviser');
      console.log('5. Utiliser le système de chat pour les échanges');
      console.log('6. Approuver et finaliser le processus');
      
      console.log('\n✅ TEST DE CRÉATION RÉUSSI !');
      return workflow;
      
    } else {
      console.error('❌ Erreur création workflow:', workflowResponse.data);
      throw new Error(`Création workflow échouée: ${workflowResponse.data.message}`);
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   URL:', error.config?.url);
    }
    
    // Suggestions de résolution
    console.log('\n🔧 SUGGESTIONS:');
    if (error.response?.status === 404) {
      console.log('   - Vérifier que les routes enhanced-workflow sont bien configurées');
      console.log('   - Redémarrer le serveur backend après les modifications');
    }
    if (error.response?.status === 403) {
      console.log('   - Vérifier les permissions dans enhancedWorkflowRoutes.js');
      console.log('   - S\'assurer que SUPER_ADMIN est inclus dans les rôles autorisés');
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('   - Démarrer le serveur backend: cd backend && npm start');
    }
    
    throw error;
  }
};

testWorkflowWithExisting();

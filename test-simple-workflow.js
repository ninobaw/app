import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test simple étape par étape
const testSimpleWorkflow = async () => {
  console.log('🚀 TEST SIMPLE DU WORKFLOW AMÉLIORÉ');
  console.log('=' .repeat(50));
  
  try {
    // 1. Connexion
    console.log('\n1️⃣ Connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abdallah.benkhalifa@tav.aero',
      password: 'password123'
    });
    
    if (loginResponse.data.token && loginResponse.data.user) {
      authToken = loginResponse.data.token;
      console.log(`✅ Connecté: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
      console.log(`   Rôle: ${loginResponse.data.user.role}`);
    } else {
      throw new Error('Connexion échouée');
    }
    
    // 2. Créer correspondance
    console.log('\n2️⃣ Création correspondance...');
    const correspondenceData = {
      subject: 'Test Workflow Simple',
      content: 'Test de création de correspondance pour workflow',
      from: 'test@example.com',
      to: 'contact@tav.aero',
      type: 'ENTRANT',
      priority: 'MEDIUM',
      status: 'PENDING'
    };
    
    const corrResponse = await axios.post(`${BASE_URL}/correspondances`, correspondenceData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    let correspondence;
    if (corrResponse.data.success) {
      correspondence = corrResponse.data.data;
      console.log(`✅ Correspondance créée: ${correspondence._id}`);
    } else if (corrResponse.data._id) {
      correspondence = corrResponse.data;
      console.log(`✅ Correspondance créée: ${correspondence._id}`);
    } else {
      console.log('📋 Réponse création:', corrResponse.data);
      throw new Error('Format de réponse inattendu');
    }
    
    // 3. Obtenir utilisateurs
    console.log('\n3️⃣ Récupération utilisateurs...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✅ ${users.length} utilisateurs trouvés`);
    
    // Trouver les rôles nécessaires
    const directeur = users.find(u => ['DIRECTEUR', 'SOUS_DIRECTEUR', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(u.role));
    const dg = users.find(u => ['DIRECTEUR_GENERAL', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(u.role));
    
    if (!directeur || !dg) {
      console.log('📋 Utilisateurs disponibles:');
      users.forEach(u => console.log(`   - ${u.firstName} ${u.lastName} (${u.role})`));
      throw new Error('Utilisateurs requis non trouvés');
    }
    
    console.log(`✅ Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur.role})`);
    console.log(`✅ DG: ${dg.firstName} ${dg.lastName} (${dg.role})`);
    
    // 4. Créer workflow amélioré
    console.log('\n4️⃣ Création workflow amélioré...');
    const workflowData = {
      correspondenceId: correspondence._id,
      assignedDirectorId: directeur._id || directeur.id,
      directeurGeneralId: dg._id || dg.id,
      priority: 'HIGH'
    };
    
    console.log('📋 Données workflow:', workflowData);
    
    const workflowResponse = await axios.post(`${BASE_URL}/enhanced-workflow/create-by-bureau-ordre`, workflowData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('📋 Réponse workflow:', workflowResponse.data);
    
    if (workflowResponse.data.success) {
      const workflow = workflowResponse.data.data;
      console.log(`✅ Workflow créé: ${workflow._id}`);
      console.log(`   Statut: ${workflow.currentStatus}`);
      console.log(`   URL: http://localhost:8080/enhanced-workflow/${workflow._id}`);
      
      console.log('\n🎉 TEST RÉUSSI !');
      console.log('Vous pouvez maintenant tester manuellement dans l\'interface web.');
      
    } else {
      console.log('❌ Erreur création workflow:', workflowResponse.data);
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    // Suggestions de résolution
    console.log('\n🔧 SUGGESTIONS:');
    if (error.message.includes('bureau d\'ordre')) {
      console.log('   - Vérifier les permissions utilisateur');
      console.log('   - Utiliser un compte BUREAU_ORDRE ou ADMINISTRATOR');
    }
    if (error.response?.status === 404) {
      console.log('   - Vérifier que les routes enhanced-workflow sont bien ajoutées');
      console.log('   - Redémarrer le serveur backend');
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('   - Démarrer le serveur backend: cd backend && npm start');
    }
  }
};

testSimpleWorkflow();

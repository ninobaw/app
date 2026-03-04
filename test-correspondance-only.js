import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const testCorrespondenceCreation = async () => {
  console.log('📧 TEST CRÉATION CORRESPONDANCE UNIQUEMENT');
  console.log('=' .repeat(50));
  
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
    
    // 2. Test création correspondance avec différentes approches
    console.log('\n2️⃣ Test création correspondance...');
    
    const correspondenceData = {
      subject: 'Test Correspondance pour Workflow',
      content: 'Contenu de test pour validation du workflow complet',
      from: 'test@example.com',
      to: 'contact@tav.aero',
      type: 'ENTRANT',
      priority: 'MEDIUM',
      status: 'PENDING'
    };
    
    console.log('📋 Données envoyées:', correspondenceData);
    
    try {
      const corrResponse = await axios.post(`${BASE_URL}/correspondances`, correspondenceData, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Correspondance créée avec succès !');
      console.log('📋 Réponse:', corrResponse.data);
      
      // Si la correspondance est créée, testons la récupération
      if (corrResponse.data._id || corrResponse.data.data?._id) {
        const corrId = corrResponse.data._id || corrResponse.data.data._id;
        console.log(`   ID: ${corrId}`);
        
        // Test récupération
        const getResponse = await axios.get(`${BASE_URL}/correspondances/${corrId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log('✅ Correspondance récupérée avec succès');
        return corrResponse.data;
      }
      
    } catch (corrError) {
      console.error('❌ Erreur création correspondance:');
      console.error('   Status:', corrError.response?.status);
      console.error('   Message:', corrError.response?.data?.message);
      console.error('   Data complète:', corrError.response?.data);
      
      // Suggestions basées sur l'erreur
      if (corrError.response?.status === 403) {
        console.log('\n💡 SOLUTION POSSIBLE:');
        console.log('   Le rôle SUPER_ADMIN n\'a peut-être pas les permissions pour créer des correspondances.');
        console.log('   Vérifiez les permissions dans les routes de correspondances.');
        
        // Testons avec un autre endpoint
        console.log('\n3️⃣ Test avec endpoint alternatif...');
        try {
          const altResponse = await axios.get(`${BASE_URL}/correspondances`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          console.log('✅ Récupération des correspondances fonctionne');
          console.log(`   Nombre: ${altResponse.data.data?.length || 0}`);
          
          if (altResponse.data.data && altResponse.data.data.length > 0) {
            const existingCorr = altResponse.data.data[0];
            console.log(`✅ Correspondance existante trouvée: ${existingCorr._id}`);
            console.log(`   Sujet: ${existingCorr.subject}`);
            return existingCorr;
          }
        } catch (altError) {
          console.error('❌ Même problème avec la récupération:', altError.response?.data);
        }
      }
      
      throw corrError;
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR GÉNÉRALE:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 SERVEUR BACKEND NON ACCESSIBLE');
      console.log('   Démarrez le backend: cd backend && npm start');
    }
  }
};

testCorrespondenceCreation();

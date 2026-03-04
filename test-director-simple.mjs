// Test simple du dashboard directeur
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function testDirectorDashboard() {
  console.log('🧪 Test du dashboard directeur...\n');
  
  try {
    // Test de connexion
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abdallah.benkhalifa@tav.aero',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Échec de connexion');
      return;
    }
    
    const token = loginData.token;
    console.log(`✅ Connexion réussie: ${loginData.user.firstName} ${loginData.user.lastName}`);
    
    // Test du dashboard
    const dashboardResponse = await fetch(`${API_BASE_URL}/api/directors/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    
    if (dashboardData.success) {
      console.log('✅ Dashboard chargé avec succès');
      console.log(`   - Total assignées: ${dashboardData.data.totalAssigned}`);
    } else {
      console.error('❌ Erreur dashboard:', dashboardData.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDirectorDashboard();

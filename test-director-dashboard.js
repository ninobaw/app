const axios = require('axios');

// Script de test pour vérifier le dashboard directeur
async function testDirectorDashboard() {
  const API_BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 [TEST] Test du dashboard directeur...\n');
  
  try {
    // 1. Test de connexion avec un directeur
    console.log('1. Test de connexion avec un directeur...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'abdallah.benkhalifa@tav.aero', // Supposons que c'est un directeur
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Échec de connexion');
      return;
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Connexion réussie: ${user.firstName} ${user.lastName} (${user.role})`);
    
    // 2. Test du dashboard directeur
    console.log('\n2. Test du dashboard directeur...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/api/directors/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dashboardResponse.data.success) {
      const metrics = dashboardResponse.data.data;
      console.log('✅ Dashboard chargé avec succès:');
      console.log(`   - Total assignées: ${metrics.totalAssigned}`);
      console.log(`   - En attente: ${metrics.pendingCorrespondances}`);
      console.log(`   - Répondues: ${metrics.repliedCorrespondances}`);
      console.log(`   - En retard: ${metrics.overdueCorrespondances}`);
      console.log(`   - Urgentes: ${metrics.urgentCorrespondances}`);
      console.log(`   - Taux de réponse: ${metrics.responseRate}%`);
      console.log(`   - Correspondances récentes: ${metrics.recentCorrespondances.length}`);
      console.log(`   - Échéances: ${metrics.upcomingDeadlines.length}`);
    } else {
      console.error('❌ Erreur dashboard:', dashboardResponse.data.message);
    }
    
    // 3. Test des notifications directeur
    console.log('\n3. Test des notifications directeur...');
    const notificationsResponse = await axios.get(`${API_BASE_URL}/api/directors/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data.notifications;
      console.log(`✅ Notifications chargées: ${notifications.length} notifications`);
      notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.type}: ${notif.title}`);
      });
    } else {
      console.error('❌ Erreur notifications:', notificationsResponse.data.message);
    }
    
    // 4. Test de l'équipe directeur
    console.log('\n4. Test de l\'équipe directeur...');
    const teamResponse = await axios.get(`${API_BASE_URL}/api/directors/team`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (teamResponse.data.success) {
      const teamMembers = teamResponse.data.data.teamMembers;
      console.log(`✅ Équipe chargée: ${teamMembers.length} membres`);
      teamMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.firstName} ${member.lastName} (${member.role}) - ${member.department}`);
      });
    } else {
      console.error('❌ Erreur équipe:', teamResponse.data.message);
    }
    
    // 5. Test des correspondances directeur
    console.log('\n5. Test des correspondances directeur...');
    const correspondancesResponse = await axios.get(`${API_BASE_URL}/api/directors/correspondances`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (correspondancesResponse.data.success) {
      const correspondances = correspondancesResponse.data.data.correspondances;
      const pagination = correspondancesResponse.data.data.pagination;
      console.log(`✅ Correspondances chargées: ${correspondances.length}/${pagination.total} correspondances`);
      console.log(`   Pages: ${pagination.page}/${pagination.pages}`);
    } else {
      console.error('❌ Erreur correspondances:', correspondancesResponse.data.message);
    }
    
    console.log('\n🎉 [TEST] Tous les tests du dashboard directeur sont terminés !');
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors du test:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Exécuter le test
testDirectorDashboard();

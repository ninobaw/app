const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');
const SupervisorDashboardService = require('../services/supervisorDashboardService');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function testSupervisorDashboard() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier si un utilisateur superviseur existe
    console.log('\n📋 1. Vérification des utilisateurs superviseurs...');
    const supervisors = await User.find({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    console.log(`Nombre de superviseurs trouvés: ${supervisors.length}`);
    
    if (supervisors.length === 0) {
      console.log('❌ Aucun superviseur trouvé. Création d\'un superviseur de test...');
      
      const testSupervisor = new User({
        firstName: 'Superviseur',
        lastName: 'Test',
        email: 'superviseur.test@tav.aero',
        password: 'password123',
        role: 'SUPERVISEUR_BUREAU_ORDRE',
        airport: 'ENFIDHA',
        isActive: true
      });
      
      await testSupervisor.save();
      console.log('✅ Superviseur de test créé:', testSupervisor.email);
      supervisors.push(testSupervisor);
    }

    const supervisor = supervisors[0];
    console.log(`✅ Superviseur utilisé pour le test: ${supervisor.firstName} ${supervisor.lastName} (${supervisor.email})`);

    // 2. Vérifier les correspondances existantes
    console.log('\n📋 2. Vérification des correspondances...');
    const totalCorrespondances = await Correspondance.countDocuments();
    console.log(`Nombre total de correspondances: ${totalCorrespondances}`);

    if (totalCorrespondances === 0) {
      console.log('⚠️  Aucune correspondance trouvée. Création de correspondances de test...');
      
      const testCorrespondances = [
        {
          title: 'Correspondance Test 1',
          subject: 'Test de correspondance urgente',
          content: 'Contenu de test pour correspondance urgente',
          type: 'INCOMING',
          priority: 'URGENT',
          status: 'PENDING',
          airport: 'ENFIDHA',
          author: supervisor._id,
          date_correspondance: new Date(),
          response_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 jour
          sender_email: 'test@example.com',
          recipient_email: supervisor.email
        },
        {
          title: 'Correspondance Test 2',
          subject: 'Test de correspondance normale',
          content: 'Contenu de test pour correspondance normale',
          type: 'INCOMING',
          priority: 'MEDIUM',
          status: 'PENDING',
          airport: 'MONASTIR',
          author: supervisor._id,
          date_correspondance: new Date(),
          response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
          sender_email: 'test2@example.com',
          recipient_email: supervisor.email
        },
        {
          title: 'Correspondance Test 3',
          subject: 'Test de correspondance répondue',
          content: 'Contenu de test pour correspondance répondue',
          type: 'INCOMING',
          priority: 'HIGH',
          status: 'REPLIED',
          airport: 'ENFIDHA',
          author: supervisor._id,
          date_correspondance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 jours passés
          response_date: new Date(),
          sender_email: 'test3@example.com',
          recipient_email: supervisor.email
        }
      ];

      for (const corresp of testCorrespondances) {
        await new Correspondance(corresp).save();
      }
      
      console.log('✅ Correspondances de test créées');
    }

    // 3. Tester le service dashboard
    console.log('\n📋 3. Test du service SupervisorDashboard...');
    
    try {
      const dashboardData = await SupervisorDashboardService.getDashboardData(supervisor._id, 'week');
      
      console.log('✅ Dashboard data récupérée avec succès:');
      console.log('📊 Statistiques générales:');
      console.log(`  - Total correspondances: ${dashboardData.totalCorrespondances}`);
      console.log(`  - En attente: ${dashboardData.pendingCorrespondances}`);
      console.log(`  - Répondues: ${dashboardData.repliedCorrespondances}`);
      console.log(`  - En retard: ${dashboardData.overdueCorrespondances}`);
      console.log(`  - Taux de réponse: ${dashboardData.responseRate}%`);
      
      console.log('\n🚨 Alertes d\'échéances:');
      console.log(`  - Critiques: ${dashboardData.criticalDeadlines.length}`);
      console.log(`  - À venir: ${dashboardData.upcomingDeadlines.length}`);
      console.log(`  - En retard: ${dashboardData.overdueItems.length}`);
      
      console.log('\n✅ Correspondances validées:');
      console.log(`  - Prêtes pour réponse: ${dashboardData.validatedForResponse.length}`);
      
      console.log('\n📈 Répartition par priorité:');
      console.log(`  - URGENT: ${dashboardData.priorityBreakdown.URGENT}`);
      console.log(`  - HIGH: ${dashboardData.priorityBreakdown.HIGH}`);
      console.log(`  - MEDIUM: ${dashboardData.priorityBreakdown.MEDIUM}`);
      console.log(`  - LOW: ${dashboardData.priorityBreakdown.LOW}`);
      
      console.log('\n🏢 Statistiques par aéroport:');
      dashboardData.airportStats.forEach(stat => {
        console.log(`  - ${stat.airport}: ${stat.responded}/${stat.total} (${stat.responseRate}%)`);
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du test du dashboard:', error);
      console.error('Stack trace:', error.stack);
    }

    // 4. Test de la méthode isSuperviseurBureauOrdre
    console.log('\n📋 4. Test de la méthode isSuperviseurBureauOrdre...');
    const isSupervisor = supervisor.isSuperviseurBureauOrdre();
    console.log(`✅ isSuperviseurBureauOrdre() retourne: ${isSupervisor}`);

    console.log('\n🎉 Test terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testSupervisorDashboard();

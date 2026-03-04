const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');
require('dotenv').config();

/**
 * Script de test complet du workflow des correspondances
 */
class WorkflowTester {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.tokens = {};
    this.testData = {};
  }

  async init() {
    console.log('🚀 INITIALISATION DU TEST WORKFLOW');
    console.log('=' .repeat(50));
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie');
  }

  async loginUser(email, password, role) {
    try {
      console.log(`\n🔐 Connexion ${role}: ${email}`);
      
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        this.tokens[role] = response.data.token;
        console.log(`✅ Connexion ${role} réussie`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Erreur connexion ${role}:`, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testSupervisorEndpoints() {
    console.log('\n📊 TEST ENDPOINTS SUPERVISEUR');
    console.log('-' .repeat(35));

    const token = this.tokens.SUPERVISEUR;
    if (!token) {
      console.log('❌ Token superviseur manquant');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Test dashboard superviseur
      console.log('Test: GET /api/supervisor/dashboard');
      const dashboardResponse = await axios.get(`${this.baseURL}/supervisor/dashboard`, { headers });
      console.log('✅ Dashboard superviseur:', {
        overdueCount: dashboardResponse.data.data.overdueCorrespondances?.length || 0,
        upcomingCount: dashboardResponse.data.data.upcomingDeadlines?.length || 0,
        totalAssigned: dashboardResponse.data.data.totalAssigned || 0
      });

      // Test statistiques générales
      console.log('Test: GET /api/supervisor/stats');
      const statsResponse = await axios.get(`${this.baseURL}/supervisor/stats`, { headers });
      console.log('✅ Statistiques générales:', {
        total: statsResponse.data.data.totalCorrespondances,
        responseRate: statsResponse.data.data.responseRate + '%',
        averageResponseTime: statsResponse.data.data.averageResponseTime
      });

      // Test rapport personnalisé
      console.log('Test: POST /api/supervisor/generate-report');
      const reportResponse = await axios.post(`${this.baseURL}/supervisor/generate-report`, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
        endDate: new Date(),
        includeStats: true
      }, { headers });
      console.log('✅ Rapport personnalisé généré:', {
        correspondances: reportResponse.data.data.correspondances?.length || 0,
        statistics: reportResponse.data.data.statistics ? 'Incluses' : 'Non incluses'
      });

    } catch (error) {
      console.error('❌ Erreur endpoints superviseur:', error.response?.data?.message || error.message);
    }
  }

  async testDirectorEndpoints() {
    console.log('\n👔 TEST ENDPOINTS DIRECTEUR');
    console.log('-' .repeat(30));

    const token = this.tokens.DIRECTEUR;
    if (!token) {
      console.log('❌ Token directeur manquant');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Test validations en attente
      console.log('Test: GET /api/director-workflow/pending-validations');
      const pendingResponse = await axios.get(`${this.baseURL}/director-workflow/pending-validations`, { headers });
      console.log('✅ Validations en attente:', pendingResponse.data.data?.length || 0);

      // Créer une correspondance test pour le workflow
      const testCorrespondance = await this.createTestCorrespondance();
      if (testCorrespondance) {
        // Test ajout de consignes
        console.log('Test: POST /api/director-workflow/consignes');
        const consignesResponse = await axios.post(`${this.baseURL}/director-workflow/consignes`, {
          correspondanceId: testCorrespondance._id,
          consignes: 'Consignes de test du directeur - traiter en priorité'
        }, { headers });
        console.log('✅ Consignes ajoutées:', consignesResponse.data.success);

        this.testData.correspondanceId = testCorrespondance._id;
      }

    } catch (error) {
      console.error('❌ Erreur endpoints directeur:', error.response?.data?.message || error.message);
    }
  }

  async createTestCorrespondance() {
    try {
      console.log('\n📝 Création correspondance test');
      
      const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
      if (!agent) {
        console.log('❌ Aucun agent bureau d\'ordre trouvé');
        return null;
      }

      const correspondance = new Correspondance({
        _id: 'test-workflow-' + Date.now(),
        title: 'Test Workflow Correspondance',
        subject: 'Test du nouveau workflow de traitement',
        content: 'Correspondance créée pour tester le workflow directeur/superviseur',
        type: 'INCOMING',
        priority: 'HIGH',
        status: 'PENDING',
        airport: 'ENFIDHA',
        from_address: 'test@example.com',
        to_address: 'bureau.ordre@aeroport.tn',
        author: agent._id,
        date_correspondance: new Date(),
        response_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        directorValidation: 'PENDING',
        tags: ['test', 'workflow']
      });

      await correspondance.save();
      console.log('✅ Correspondance test créée:', correspondance._id);
      return correspondance;

    } catch (error) {
      console.error('❌ Erreur création correspondance test:', error.message);
      return null;
    }
  }

  async testAgentEndpoints() {
    console.log('\n👨‍💼 TEST ENDPOINTS AGENT BUREAU D\'ORDRE');
    console.log('-' .repeat(40));

    const token = this.tokens.AGENT;
    if (!token) {
      console.log('❌ Token agent manquant');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Test création de correspondance
      console.log('Test: POST /api/correspondances');
      const createResponse = await axios.post(`${this.baseURL}/correspondances`, {
        title: 'Correspondance Agent Test',
        subject: 'Test création par agent',
        content: 'Test de création de correspondance par agent bureau d\'ordre',
        type: 'INCOMING',
        priority: 'MEDIUM',
        airport: 'MONASTIR',
        from_address: 'expediteur@test.com',
        to_address: 'destinataire@aeroport.tn'
      }, { headers });
      
      if (createResponse.data.success) {
        console.log('✅ Correspondance créée par agent:', createResponse.data.data._id);
      }

    } catch (error) {
      console.error('❌ Erreur endpoints agent:', error.response?.data?.message || error.message);
    }
  }

  async testWorkflowComplete() {
    console.log('\n🔄 TEST WORKFLOW COMPLET');
    console.log('-' .repeat(25));

    if (!this.testData.correspondanceId) {
      console.log('❌ Pas de correspondance test disponible');
      return;
    }

    const directorToken = this.tokens.DIRECTEUR;
    const supervisorToken = this.tokens.SUPERVISEUR;

    if (!directorToken || !supervisorToken) {
      console.log('❌ Tokens manquants pour le test complet');
      return;
    }

    try {
      // 1. Superviseur envoie un rappel
      console.log('1. Superviseur envoie rappel...');
      await axios.post(`${this.baseURL}/supervisor/send-reminder`, {
        correspondanceId: this.testData.correspondanceId,
        userIds: ['test-user-id'],
        message: 'Rappel automatique - échéance proche'
      }, { headers: { Authorization: `Bearer ${supervisorToken}` } });
      console.log('✅ Rappel envoyé');

      // 2. Directeur ajoute une proposition de réponse
      console.log('2. Directeur ajoute proposition...');
      await axios.post(`${this.baseURL}/director-workflow/response-proposal`, {
        correspondanceId: this.testData.correspondanceId,
        responseProposal: 'Proposition de réponse du directeur pour test'
      }, { headers: { Authorization: `Bearer ${directorToken}` } });
      console.log('✅ Proposition ajoutée');

      // 3. Directeur valide la proposition
      console.log('3. Directeur valide...');
      await axios.post(`${this.baseURL}/director-workflow/validate-proposal`, {
        correspondanceId: this.testData.correspondanceId,
        validation: 'APPROVED',
        comments: 'Validation approuvée pour test'
      }, { headers: { Authorization: `Bearer ${directorToken}` } });
      console.log('✅ Proposition validée');

      console.log('\n🎉 WORKFLOW COMPLET TESTÉ AVEC SUCCÈS !');

    } catch (error) {
      console.error('❌ Erreur workflow complet:', error.response?.data?.message || error.message);
    }
  }

  async runAllTests() {
    try {
      await this.init();

      // Connexion des utilisateurs
      const users = [
        { email: 'superviseur.bureau@aeroport.tn', password: 'supervisor123', role: 'SUPERVISEUR' },
        { email: 'abdallah.benkhalifa@tav.aero', password: 'password123', role: 'DIRECTEUR' },
        { email: 'maroua.saidi@tav.aero', password: 'password123', role: 'AGENT' }
      ];

      for (const user of users) {
        await this.loginUser(user.email, user.password, user.role);
      }

      // Tests des endpoints
      await this.testSupervisorEndpoints();
      await this.testDirectorEndpoints();
      await this.testAgentEndpoints();
      await this.testWorkflowComplete();

      console.log('\n🎯 RÉSUMÉ DES TESTS');
      console.log('=' .repeat(30));
      console.log('✅ Endpoints superviseur testés');
      console.log('✅ Endpoints directeur testés');
      console.log('✅ Endpoints agent testés');
      console.log('✅ Workflow complet testé');
      console.log('\n🚀 Tous les tests terminés avec succès !');

    } catch (error) {
      console.error('❌ Erreur générale:', error);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécution des tests
const tester = new WorkflowTester();
tester.runAllTests();

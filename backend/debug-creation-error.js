const express = require('express');
const mongoose = require('mongoose');

/**
 * Script pour déboguer l'erreur 500 lors de la création de correspondances
 */

async function debugCreationError() {
  try {
    console.log('🚨 ========================================');
    console.log('🚨 DEBUG ERREUR 500 CRÉATION CORRESPONDANCE');
    console.log('🚨 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. TESTER LA CRÉATION MANUELLE
    console.log('🧪 === TEST CRÉATION MANUELLE ===');
    
    const Correspondance = require('./src/models/Correspondance');
    const User = require('./src/models/User');
    
    // Récupérer un utilisateur pour le test
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    const director = await User.findOne({ role: 'DIRECTEUR' });
    
    if (!agent || !director) {
      console.log('❌ Utilisateurs manquants pour le test');
      return;
    }
    
    console.log(`👤 Agent: ${agent.firstName} ${agent.lastName}`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName}`);

    // Simuler les données du formulaire frontend
    const testData = {
      title: 'Test debug erreur 500',
      type: 'INCOMING',
      from_address: 'test@external.com',
      to_address: 'test@enfidha.tn',
      subject: 'Test création correspondance',
      content: 'Test pour déboguer l\'erreur 500',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: `DEBUG-500-${Date.now()}`,
      tags: ['test', 'debug'],
      personnesConcernees: [director._id.toString()],
      deposantInfo: 'Test deposant',
      importanceSubject: 'HIGH',
      authorId: agent._id,
      file_path: 'correspondances\\ENFIDHA\\Arrivee\\test-file.pdf',
      file_type: 'application/pdf',
      responseDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('\n📝 Tentative de création avec données simulées...');
    
    try {
      const testCorrespondance = new Correspondance(testData);
      await testCorrespondance.save();
      
      console.log(`✅ Création manuelle réussie: ${testCorrespondance._id}`);
      
      // Nettoyer
      await Correspondance.findByIdAndDelete(testCorrespondance._id);
      console.log('🧹 Test nettoyé');
      
    } catch (manualError) {
      console.log('❌ Erreur création manuelle:', manualError.message);
      console.log('📋 Détails erreur:', manualError);
    }

    // 2. VÉRIFIER LE SCHÉMA CORRESPONDANCE
    console.log('\n📋 === VÉRIFICATION SCHÉMA CORRESPONDANCE ===');
    
    const schema = Correspondance.schema;
    const requiredFields = [];
    const optionalFields = [];
    
    schema.eachPath((pathname, schematype) => {
      if (schematype.isRequired) {
        requiredFields.push(pathname);
      } else {
        optionalFields.push(pathname);
      }
    });
    
    console.log(`📋 Champs requis (${requiredFields.length}):`, requiredFields);
    console.log(`📋 Champs optionnels (${optionalFields.length}):`, optionalFields.slice(0, 10), '...');

    // 3. VÉRIFIER LES SERVICES UTILISÉS
    console.log('\n🔧 === VÉRIFICATION SERVICES ===');
    
    try {
      const CorrespondanceAssignmentService = require('./src/services/correspondanceAssignmentService');
      console.log('✅ CorrespondanceAssignmentService chargé');
      
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      console.log('✅ CorrespondanceWorkflowService chargé');
      
    } catch (serviceError) {
      console.log('❌ Erreur chargement services:', serviceError.message);
    }

    // 4. TESTER LA ROUTE DIRECTEMENT
    console.log('\n🌐 === TEST ROUTE DIRECTEMENT ===');
    
    // Simuler une requête HTTP
    const mockReq = {
      body: {
        title: 'Test route directe',
        type: 'INCOMING',
        from_address: 'test@external.com',
        to_address: 'test@enfidha.tn',
        subject: 'Test route',
        content: 'Test contenu',
        priority: 'MEDIUM',
        status: 'PENDING',
        airport: 'ENFIDHA',
        code: `ROUTE-TEST-${Date.now()}`,
        tags: ['test'],
        personnesConcernees: [director._id.toString()],
        deposantInfo: 'Test',
        importanceSubject: 'MEDIUM'
      },
      user: {
        id: agent._id.toString(),
        firstName: agent.firstName,
        lastName: agent.lastName,
        role: agent.role
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Réponse ${code}:`, data);
          return data;
        }
      }),
      json: (data) => {
        console.log('📤 Réponse 200:', data);
        return data;
      }
    };

    console.log('🧪 Simulation appel route POST /api/correspondances...');
    
    try {
      // Charger et exécuter la logique de la route
      const Correspondance = require('./src/models/Correspondance');
      const CorrespondanceAssignmentService = require('./src/services/correspondanceAssignmentService');
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      const {
        title, type, from_address, to_address, subject, content,
        priority, status, airport, tags, code, personnesConcernees,
        deposantInfo, importanceSubject
      } = mockReq.body;

      // Vérifier l'unicité du code
      const existingCorrespondance = await Correspondance.findOne({ code });
      if (existingCorrespondance) {
        console.log(`❌ Code "${code}" existe déjà`);
        return;
      }

      const newCorrespondance = new Correspondance({
        title, type, from_address, to_address, subject, content,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        airport, code,
        tags: tags || [],
        personnesConcernees: personnesConcernees || [],
        deposantInfo, importanceSubject,
        authorId: mockReq.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Assignation
      if (!personnesConcernees || personnesConcernees.length === 0) {
        console.log('🎯 Assignation automatique...');
        await CorrespondanceAssignmentService.assignCorrespondance(newCorrespondance);
      } else {
        console.log('✋ Assignation manuelle détectée');
        newCorrespondance.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
      }

      // Sauvegarder
      await newCorrespondance.save();
      console.log(`✅ Correspondance créée via simulation route: ${newCorrespondance._id}`);

      // Créer workflow
      const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
        newCorrespondance._id.toString(),
        mockReq.user.id
      );
      
      if (workflow) {
        console.log(`✅ Workflow créé: ${workflow._id}`);
      }

      // Nettoyer
      await Correspondance.findByIdAndDelete(newCorrespondance._id);
      const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
      if (workflow) {
        await CorrespondenceWorkflow.findByIdAndDelete(workflow._id);
      }
      console.log('🧹 Test route nettoyé');

    } catch (routeError) {
      console.log('❌ Erreur simulation route:', routeError.message);
      console.log('📋 Stack trace:', routeError.stack);
    }

    console.log('\n💡 === RECOMMANDATIONS ===');
    console.log('1. Vérifiez les logs du serveur backend pendant la création');
    console.log('2. Vérifiez que tous les champs requis sont fournis');
    console.log('3. Vérifiez les services d\'assignation et de workflow');
    console.log('4. Testez avec des données plus simples');

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le debug
debugCreationError();

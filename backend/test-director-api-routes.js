const mongoose = require('mongoose');
const axios = require('axios');

async function testDirectorApiRoutes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST DES ROUTES API DIRECTEUR ===\n');
    
    // 1. Trouver un directeur de test
    const directors = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    if (directors.length === 0) {
      console.log('❌ Aucun directeur trouvé !');
      process.exit(1);
    }
    
    const testDirector = directors[0];
    console.log(`👤 Directeur de test: ${testDirector.firstName} ${testDirector.lastName}`);
    console.log(`   Email: ${testDirector.email}`);
    console.log(`   ID: ${testDirector._id}`);
    
    // 2. S'assurer qu'il y a au moins une correspondance assignée
    console.log(`\n🔧 === PRÉPARATION DES DONNÉES ===`);
    
    const directorObjectId = new mongoose.Types.ObjectId(testDirector._id);
    
    // Trouver ou créer une correspondance de test
    let testCorrespondance = await db.collection('correspondances').findOne({
      assignedTo: directorObjectId
    });
    
    if (!testCorrespondance) {
      // Prendre la correspondance la plus récente et l'assigner
      const recentCorrespondance = await db.collection('correspondances')
        .findOne({}, { sort: { createdAt: -1 } });
      
      if (recentCorrespondance) {
        await db.collection('correspondances').updateOne(
          { _id: recentCorrespondance._id },
          { 
            $set: { 
              assignedTo: directorObjectId,
              workflowStatus: 'DIRECTOR_DRAFT',
              updatedAt: new Date()
            }
          }
        );
        
        // Ajouter un draft de test
        const responseDraft = {
          directorId: directorObjectId,
          directorName: `${testDirector.firstName} ${testDirector.lastName}`,
          directorate: testDirector.directorate || 'Direction Test',
          responseContent: `Proposition de réponse de test pour "${recentCorrespondance.objet || recentCorrespondance.subject}"`,
          attachments: [],
          comments: 'Draft créé pour test API',
          isUrgent: false,
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('correspondances').updateOne(
          { _id: recentCorrespondance._id },
          { $push: { responseDrafts: responseDraft } }
        );
        
        testCorrespondance = recentCorrespondance;
        console.log(`✅ Correspondance assignée: "${testCorrespondance.objet || testCorrespondance.subject}"`);
      }
    } else {
      console.log(`✅ Correspondance déjà assignée: "${testCorrespondance.objet || testCorrespondance.subject}"`);
    }
    
    // 3. Tester la connexion et récupérer le token
    console.log(`\n🔐 === TEST DE CONNEXION ===`);
    
    let authToken = null;
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: testDirector.email,
        password: 'password123' // Mot de passe par défaut
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.token;
        console.log(`✅ Connexion réussie, token obtenu`);
      } else {
        console.log(`❌ Échec de connexion: ${loginResponse.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Erreur de connexion: ${error.response?.data?.message || error.message}`);
      console.log(`💡 Essayez avec un autre mot de passe ou vérifiez que le serveur est démarré`);
    }
    
    if (!authToken) {
      console.log(`\n⚠️  Impossible de tester les routes API sans token`);
      console.log(`🔧 Test direct en base de données...`);
      
      // Test direct en base
      const directCorrespondances = await db.collection('correspondances').find({
        $or: [
          { assignedTo: directorObjectId },
          { assignedTo: { $exists: false } },
          { assignedTo: null }
        ]
      }).toArray();
      
      const assigned = directCorrespondances.filter(c => 
        c.assignedTo && c.assignedTo.toString() === directorObjectId.toString()
      );
      
      console.log(`📋 Correspondances trouvées (base directe): ${directCorrespondances.length}`);
      console.log(`📌 Assignées au directeur: ${assigned.length}`);
      
      if (assigned.length > 0) {
        console.log(`\n✅ Correspondances assignées:`);
        assigned.forEach((corr, index) => {
          console.log(`   ${index + 1}. "${corr.objet || corr.subject}"`);
          console.log(`      Status: ${corr.status} | Workflow: ${corr.workflowStatus}`);
        });
      }
      
      process.exit(0);
    }
    
    // 4. Tester les routes API
    console.log(`\n🧪 === TEST DES ROUTES API ===`);
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // Test Route 1: /api/correspondances (route générale)
    console.log(`\n📡 Test Route 1: GET /api/correspondances`);
    try {
      const response1 = await axios.get('http://localhost:5000/api/correspondances', { headers });
      
      if (response1.data.success) {
        const correspondances = response1.data.data || response1.data;
        console.log(`✅ Route 1 réussie: ${correspondances.length} correspondances`);
        
        const assignedToDirector = correspondances.filter(c => 
          c.assignedTo && c.assignedTo.toString() === testDirector._id.toString()
        );
        console.log(`📌 Assignées au directeur: ${assignedToDirector.length}`);
        
        if (assignedToDirector.length > 0) {
          assignedToDirector.forEach((corr, index) => {
            console.log(`   ${index + 1}. "${corr.objet || corr.subject}"`);
          });
        }
      } else {
        console.log(`❌ Route 1 échouée: ${response1.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Erreur Route 1: ${error.response?.data?.message || error.message}`);
    }
    
    // Test Route 2: /api/correspondance-workflow/my-tasks
    console.log(`\n📡 Test Route 2: GET /api/correspondance-workflow/my-tasks`);
    try {
      const response2 = await axios.get('http://localhost:5000/api/correspondance-workflow/my-tasks', { headers });
      
      if (response2.data.success) {
        const tasks = response2.data.data || response2.data.tasks || [];
        console.log(`✅ Route 2 réussie: ${tasks.length} tâches`);
        
        if (tasks.length > 0) {
          tasks.forEach((task, index) => {
            console.log(`   ${index + 1}. "${task.objet || task.subject || task.title}"`);
            console.log(`      Status: ${task.status} | Workflow: ${task.workflowStatus}`);
          });
        }
      } else {
        console.log(`❌ Route 2 échouée: ${response2.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Erreur Route 2: ${error.response?.data?.message || error.message}`);
    }
    
    // Test Route 3: /api/correspondance-workflow/dg-pending (pour comparaison)
    console.log(`\n📡 Test Route 3: GET /api/correspondance-workflow/dg-pending`);
    try {
      const response3 = await axios.get('http://localhost:5000/api/correspondance-workflow/dg-pending', { headers });
      
      if (response3.data.success) {
        const pending = response3.data.data || response3.data.correspondances || [];
        console.log(`✅ Route 3 réussie: ${pending.length} correspondances en attente DG`);
      } else {
        console.log(`❌ Route 3 échouée: ${response3.data.message}`);
      }
    } catch (error) {
      console.log(`❌ Erreur Route 3: ${error.response?.data?.message || error.message}`);
    }
    
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    console.log(`1. Vérifiez quelle route utilise le frontend pour les directeurs`);
    console.log(`2. La route /api/correspondances devrait montrer les correspondances assignées`);
    console.log(`3. La route /api/correspondance-workflow/my-tasks est plus spécialisée`);
    console.log(`4. Assurez-vous que le frontend utilise la bonne route`);
    
    console.log(`\n🎯 === DONNÉES DE TEST ===`);
    console.log(`Directeur: ${testDirector.firstName} ${testDirector.lastName}`);
    console.log(`Email: ${testDirector.email}`);
    console.log(`ID: ${testDirector._id}`);
    if (testCorrespondance) {
      console.log(`Correspondance test: "${testCorrespondance.objet || testCorrespondance.subject}"`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDirectorApiRoutes();

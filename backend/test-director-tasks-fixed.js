const mongoose = require('mongoose');
const express = require('express');

async function testDirectorTasksFixed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST ROUTE MY-TASKS DIRECTEUR CORRIGÉE ===\n');
    
    // 1. Trouver un directeur
    const directeur = await db.collection('users').findOne({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    if (!directeur) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Test avec directeur: ${directeur.firstName} ${directeur.lastName}`);
    console.log(`   ID: ${directeur._id}`);
    console.log(`   Role: ${directeur.role}`);
    
    // 2. Tester la nouvelle logique de filtre
    console.log('\n🔍 === TEST NOUVEAU FILTRE ===');
    
    const filter = {
      parentCorrespondanceId: { $exists: false }, // Exclure les réponses
      $or: [
        { assignedTo: directeur._id },                    // Assignation directe
        { assignedTo: directeur._id.toString() },         // Assignation directe (string)
        { personnesConcernees: directeur._id },           // Dans personnesConcernees
        { personnesConcernees: directeur._id.toString() }, // Dans personnesConcernees (string)
        { assignedTo: { $exists: false } },              // Correspondances non assignées
        { assignedTo: null }                             // Correspondances avec assignedTo null
      ]
    };
    
    console.log('📋 Nouveau filtre:');
    console.log(JSON.stringify(filter, null, 2));
    
    const results = await db.collection('correspondances').find(filter).toArray();
    
    console.log(`\n📊 Résultats: ${results.length} correspondances`);
    
    if (results.length > 0) {
      console.log('✅ SUCCESS: Correspondances trouvées !');
      
      results.forEach((corresp, index) => {
        console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - ID: ${corresp._id}`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - WorkflowStatus: ${corresp.workflowStatus || 'undefined'}`);
        console.log(`      - AssignedTo: ${corresp.assignedTo || 'undefined'}`);
        console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0}`);
        console.log(`      - CreatedAt: ${corresp.createdAt}`);
      });
      
      // 3. Simuler l'appel API
      console.log('\n🌐 === SIMULATION API MY-TASKS ===');
      
      try {
        // Charger les modèles
        const User = require('./src/models/User');
        const Correspondance = require('./src/models/Correspondance');
        
        // Simuler la requête
        const user = await User.findById(directeur._id);
        
        const tasks = await Correspondance.find(filter)
          .populate('assignedTo', 'firstName lastName role directorate')
          .populate('personnesConcernees', 'firstName lastName role directorate')
          .sort({ updatedAt: -1 });
        
        console.log(`📊 API simulation: ${tasks.length} tâches retournées`);
        
        if (tasks.length > 0) {
          console.log('✅ API fonctionne correctement !');
          
          tasks.forEach((task, index) => {
            console.log(`   ${index + 1}. ${task.title || task.subject}`);
            console.log(`      - Status: ${task.status}`);
            console.log(`      - WorkflowStatus: ${task.workflowStatus || 'undefined'}`);
          });
        } else {
          console.log('❌ API ne retourne aucune tâche');
        }
        
      } catch (apiError) {
        console.error('❌ Erreur simulation API:', apiError.message);
      }
      
    } else {
      console.log('❌ ÉCHEC: Aucune correspondance trouvée');
    }
    
    // 4. Comparaison avec l'ancien système
    console.log('\n📊 === COMPARAISON ANCIEN VS NOUVEAU ===');
    
    // Ancien filtre (complexe avec workflowStatus)
    const oldFilter = {
      $or: [
        { 
          assignedTo: directeur._id,
          workflowStatus: { 
            $in: [
              'ASSIGNED_TO_DIRECTOR', 
              'DIRECTOR_DRAFT',
              'DG_FEEDBACK', 
              'DG_REVIEW',
              'DIRECTOR_REVISION'
            ] 
          }
        },
        { 
          personnesConcernees: directeur._id,
          workflowStatus: { 
            $in: [
              'ASSIGNED_TO_DIRECTOR', 
              'DIRECTOR_DRAFT',
              'DG_FEEDBACK', 
              'DG_REVIEW',
              'DIRECTOR_REVISION'
            ] 
          }
        }
      ]
    };
    
    const oldResults = await db.collection('correspondances').find(oldFilter).toArray();
    
    console.log(`Ancien système: ${oldResults.length} correspondances`);
    console.log(`Nouveau système: ${results.length} correspondances`);
    console.log(`Différence: ${results.length - oldResults.length} correspondances supplémentaires`);
    
    // 5. Recommandations
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (results.length > 1) {
      console.log('✅ CORRECTION RÉUSSIE !');
      console.log('🎯 Actions suivantes:');
      console.log('1. Redémarrer le serveur backend');
      console.log('2. Tester l\'interface dashboard directeur');
      console.log('3. Vérifier que toutes les correspondances s\'affichent');
      console.log(`4. Attendu: ${results.length} correspondances dans le dashboard`);
    } else {
      console.log('❌ PROBLÈME PERSISTE');
      console.log('🔧 Vérifications supplémentaires nécessaires');
    }
    
    console.log('\n🎉 === TEST TERMINÉ ===');
    console.log(`Status: ${results.length > 1 ? '✅ CORRIGÉ' : '❌ PROBLÈME PERSISTE'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDirectorTasksFixed();

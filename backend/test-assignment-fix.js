const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const CorrespondanceAssignmentService = require('./src/services/correspondanceAssignmentService');

/**
 * Test rapide de la correction d'assignation
 */

async function testAssignmentFix() {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 TEST CORRECTION ASSIGNATION');
    console.log('🧪 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // Récupérer un agent
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    
    // Créer une correspondance RH de test
    console.log('📝 Création correspondance RH de test...');
    
    const testCorr = new Correspondance({
      title: 'Test correction assignation RH',
      subject: 'Formation ressources humaines urgente',
      content: 'Test pour vérifier que l\'assignation RH fonctionne après correction.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'rh@external.com',
      to_address: 'bureau.ordre@enfidha.tn',
      tags: ['formation', 'rh', 'personnel'],
      code: `TEST-FIX-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'PENDING',
      date_correspondance: new Date()
    });

    await testCorr.save();
    console.log(`✅ Correspondance créée: ${testCorr._id}`);
    console.log(`📋 Tags: ${testCorr.tags.join(', ')}`);

    // Vérifier l'état avant assignation
    console.log('\n📊 État AVANT assignation:');
    console.log(`   personnesConcernees: ${testCorr.personnesConcernees?.length || 0}`);
    console.log(`   workflowStatus: ${testCorr.workflowStatus}`);

    // Appliquer l'assignation automatique
    console.log('\n🎯 Application assignation automatique...');
    
    const assignedCorr = await CorrespondanceAssignmentService.assignCorrespondance(testCorr);

    // Vérifier l'état après assignation (en mémoire)
    console.log('\n📊 État APRÈS assignation (en mémoire):');
    console.log(`   personnesConcernees: ${assignedCorr.personnesConcernees?.length || 0}`);
    console.log(`   workflowStatus: ${assignedCorr.workflowStatus}`);

    // Vérifier l'état en base de données
    console.log('\n📊 Vérification en BASE DE DONNÉES:');
    const corrFromDB = await Correspondance.findById(testCorr._id)
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .lean();

    console.log(`   personnesConcernees: ${corrFromDB.personnesConcernees?.length || 0}`);
    console.log(`   workflowStatus: ${corrFromDB.workflowStatus}`);

    if (corrFromDB.personnesConcernees && corrFromDB.personnesConcernees.length > 0) {
      console.log('   👥 Personnes assignées:');
      corrFromDB.personnesConcernees.forEach((person, index) => {
        console.log(`      ${index + 1}. ${person.firstName} ${person.lastName} (${person.role}) - ${person.directorate}`);
      });
      console.log('\n✅ SUCCÈS: Assignation fonctionne et est sauvegardée !');
    } else {
      console.log('\n❌ ÉCHEC: Assignation non sauvegardée en base');
    }

    // Test dashboard du directeur assigné
    if (corrFromDB.personnesConcernees && corrFromDB.personnesConcernees.length > 0) {
      console.log('\n📊 Test dashboard directeur assigné...');
      
      const DirectorDashboardService = require('./src/services/directorDashboardService');
      const assignedDirector = corrFromDB.personnesConcernees[0];
      
      try {
        const metrics = await DirectorDashboardService.getDirectorMetrics(
          assignedDirector._id.toString(),
          assignedDirector.role
        );
        
        console.log(`👤 Dashboard ${assignedDirector.firstName} ${assignedDirector.lastName}:`);
        console.log(`   Total assigné: ${metrics.totalAssigned}`);
        console.log(`   En attente: ${metrics.pendingCorrespondances}`);
        console.log(`   Récentes: ${metrics.recentCorrespondances?.length || 0}`);
        
        if (metrics.totalAssigned > 0) {
          console.log('   ✅ Dashboard fonctionne - correspondance visible !');
        } else {
          console.log('   ⚠️ Dashboard ne voit pas la correspondance');
        }
        
      } catch (dashError) {
        console.log(`   ❌ Erreur dashboard: ${dashError.message}`);
      }
    }

    // Nettoyage
    console.log('\n🧹 Nettoyage...');
    await Correspondance.findByIdAndDelete(testCorr._id);
    console.log('✅ Correspondance de test supprimée');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testAssignmentFix();

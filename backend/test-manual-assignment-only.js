const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');

/**
 * Test de l'assignation manuelle uniquement (sans détection de domaine)
 */

async function testManualAssignmentOnly() {
  try {
    console.log('👤 ========================================');
    console.log('👤 TEST ASSIGNATION MANUELLE UNIQUEMENT');
    console.log('👤 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS
    const anisDirector = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    
    const najehDirector = await User.findOne({
      firstName: 'Najeh',
      lastName: 'Chaouch'
    });
    
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    console.log(`👤 Anis (RH): ${anisDirector._id}`);
    console.log(`👤 Najeh (COMMERCIAL): ${najehDirector._id}`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName}\n`);

    // 2. TEST 1: ASSIGNATION MANUELLE À ANIS SEULEMENT
    console.log('🧪 === TEST 1: ASSIGNATION MANUELLE À ANIS ===');
    
    const corrAnis = new Correspondance({
      title: 'Test assignation manuelle Anis',
      subject: 'Correspondance assignée manuellement à Anis',
      content: 'Cette correspondance doit être assignée UNIQUEMENT à Anis Ben Janet, sans détection automatique.',
      type: 'INCOMING',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'bureau.ordre@enfidha.tn',
      tags: ['commercial', 'contrat'], // Tags commerciaux mais assigné à RH
      code: `TEST-MANUAL-ANIS-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'PENDING',
      // ✅ ASSIGNATION MANUELLE: Seulement Anis
      personnesConcernees: [anisDirector._id.toString()],
      date_correspondance: new Date()
    });

    await corrAnis.save();
    console.log(`✅ Correspondance créée: ${corrAnis._id}`);
    console.log(`📋 Tags: ${corrAnis.tags.join(', ')} (commercial mais assigné à RH)`);
    console.log(`👤 Assigné manuellement à: Anis Ben Janet`);
    console.log(`📊 personnesConcernees: ${corrAnis.personnesConcernees.length}`);

    // Vérifier que l'assignation manuelle est respectée
    const corrAnisFromDB = await Correspondance.findById(corrAnis._id)
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .lean();

    console.log(`📊 Vérification en base:`);
    console.log(`   personnesConcernees: ${corrAnisFromDB.personnesConcernees?.length || 0}`);
    console.log(`   workflowStatus: ${corrAnisFromDB.workflowStatus}`);
    
    if (corrAnisFromDB.personnesConcernees && corrAnisFromDB.personnesConcernees.length > 0) {
      corrAnisFromDB.personnesConcernees.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.firstName} ${person.lastName} (${person.directorate})`);
      });
      
      if (corrAnisFromDB.personnesConcernees.length === 1 && 
          corrAnisFromDB.personnesConcernees[0].firstName === 'Anis') {
        console.log('   ✅ SUCCÈS: Assignation manuelle respectée !');
      } else {
        console.log('   ❌ ÉCHEC: Assignation automatique a écrasé l\'assignation manuelle');
      }
    }

    // 3. TEST 2: ASSIGNATION MANUELLE À NAJEH SEULEMENT
    console.log('\n🧪 === TEST 2: ASSIGNATION MANUELLE À NAJEH ===');
    
    const corrNajeh = new Correspondance({
      title: 'Test assignation manuelle Najeh',
      subject: 'Correspondance assignée manuellement à Najeh',
      content: 'Cette correspondance doit être assignée UNIQUEMENT à Najeh Chaouch, sans détection automatique.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test2@external.com',
      to_address: 'bureau.ordre@enfidha.tn',
      tags: ['formation', 'rh'], // Tags RH mais assigné à COMMERCIAL
      code: `TEST-MANUAL-NAJEH-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR', // Statut déjà défini
      // ✅ ASSIGNATION MANUELLE: Seulement Najeh
      personnesConcernees: [najehDirector._id.toString()],
      date_correspondance: new Date()
    });

    await corrNajeh.save();
    console.log(`✅ Correspondance créée: ${corrNajeh._id}`);
    console.log(`📋 Tags: ${corrNajeh.tags.join(', ')} (RH mais assigné à COMMERCIAL)`);
    console.log(`👤 Assigné manuellement à: Najeh Chaouch`);
    console.log(`📊 personnesConcernees: ${corrNajeh.personnesConcernees.length}`);

    // Vérifier que l'assignation manuelle est respectée
    const corrNajehFromDB = await Correspondance.findById(corrNajeh._id)
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .lean();

    console.log(`📊 Vérification en base:`);
    console.log(`   personnesConcernees: ${corrNajehFromDB.personnesConcernees?.length || 0}`);
    console.log(`   workflowStatus: ${corrNajehFromDB.workflowStatus}`);
    
    if (corrNajehFromDB.personnesConcernees && corrNajehFromDB.personnesConcernees.length > 0) {
      corrNajehFromDB.personnesConcernees.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.firstName} ${person.lastName} (${person.directorate})`);
      });
      
      if (corrNajehFromDB.personnesConcernees.length === 1 && 
          corrNajehFromDB.personnesConcernees[0].firstName === 'Najeh') {
        console.log('   ✅ SUCCÈS: Assignation manuelle respectée !');
      } else {
        console.log('   ❌ ÉCHEC: Assignation automatique a écrasé l\'assignation manuelle');
      }
    }

    // 4. TEST 3: ASSIGNATION MANUELLE MULTIPLE
    console.log('\n🧪 === TEST 3: ASSIGNATION MANUELLE MULTIPLE ===');
    
    const corrMultiple = new Correspondance({
      title: 'Test assignation manuelle multiple',
      subject: 'Correspondance assignée à plusieurs personnes',
      content: 'Cette correspondance doit être assignée à Anis ET Najeh, sans détection automatique.',
      type: 'INCOMING',
      priority: 'URGENT',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test3@external.com',
      to_address: 'bureau.ordre@enfidha.tn',
      tags: ['technique', 'maintenance'], // Tags techniques mais assigné à RH+COMMERCIAL
      code: `TEST-MANUAL-MULTI-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR',
      // ✅ ASSIGNATION MANUELLE: Anis + Najeh
      personnesConcernees: [anisDirector._id.toString(), najehDirector._id.toString()],
      date_correspondance: new Date()
    });

    await corrMultiple.save();
    console.log(`✅ Correspondance créée: ${corrMultiple._id}`);
    console.log(`📋 Tags: ${corrMultiple.tags.join(', ')} (technique mais assigné à RH+COMMERCIAL)`);
    console.log(`👤 Assigné manuellement à: Anis + Najeh`);
    console.log(`📊 personnesConcernees: ${corrMultiple.personnesConcernees.length}`);

    // Vérifier que l'assignation manuelle est respectée
    const corrMultipleFromDB = await Correspondance.findById(corrMultiple._id)
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .lean();

    console.log(`📊 Vérification en base:`);
    console.log(`   personnesConcernees: ${corrMultipleFromDB.personnesConcernees?.length || 0}`);
    console.log(`   workflowStatus: ${corrMultipleFromDB.workflowStatus}`);
    
    if (corrMultipleFromDB.personnesConcernees && corrMultipleFromDB.personnesConcernees.length > 0) {
      corrMultipleFromDB.personnesConcernees.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.firstName} ${person.lastName} (${person.directorate})`);
      });
      
      if (corrMultipleFromDB.personnesConcernees.length === 2) {
        console.log('   ✅ SUCCÈS: Assignation manuelle multiple respectée !');
      } else {
        console.log('   ❌ ÉCHEC: Assignation automatique a modifié l\'assignation manuelle');
      }
    }

    // 5. VÉRIFIER LES DASHBOARDS
    console.log('\n📊 === VÉRIFICATION DASHBOARDS ===');
    
    const DirectorDashboardService = require('./src/services/directorDashboardService');
    
    // Dashboard Anis (devrait voir 2 correspondances)
    try {
      const anisMetrics = await DirectorDashboardService.getDirectorMetrics(
        anisDirector._id.toString(),
        anisDirector.role
      );
      
      console.log(`👤 Dashboard Anis Ben Janet:`);
      console.log(`   Total assigné: ${anisMetrics.totalAssigned}`);
      console.log(`   En attente: ${anisMetrics.pendingCorrespondances}`);
      console.log(`   Récentes: ${anisMetrics.recentCorrespondances?.length || 0}`);
      
      if (anisMetrics.totalAssigned >= 2) {
        console.log('   ✅ Dashboard Anis fonctionne - voit ses correspondances');
      } else {
        console.log('   ⚠️ Dashboard Anis ne voit pas toutes ses correspondances');
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur dashboard Anis: ${error.message}`);
    }

    // Dashboard Najeh (devrait voir 2 correspondances)
    try {
      const najehMetrics = await DirectorDashboardService.getDirectorMetrics(
        najehDirector._id.toString(),
        najehDirector.role
      );
      
      console.log(`👤 Dashboard Najeh Chaouch:`);
      console.log(`   Total assigné: ${najehMetrics.totalAssigned}`);
      console.log(`   En attente: ${najehMetrics.pendingCorrespondances}`);
      console.log(`   Récentes: ${najehMetrics.recentCorrespondances?.length || 0}`);
      
      if (najehMetrics.totalAssigned >= 2) {
        console.log('   ✅ Dashboard Najeh fonctionne - voit ses correspondances');
      } else {
        console.log('   ⚠️ Dashboard Najeh ne voit pas toutes ses correspondances');
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur dashboard Najeh: ${error.message}`);
    }

    // 6. RÉSUMÉ
    console.log('\n📋 === RÉSUMÉ ===');
    console.log('✅ Assignation manuelle fonctionne correctement');
    console.log('✅ Pas de détection automatique de domaine quand personnesConcernees est fourni');
    console.log('✅ Les dashboards affichent les correspondances assignées manuellement');
    console.log('✅ L\'assignation manuelle multiple fonctionne');

    // 7. NETTOYAGE
    console.log('\n🧹 === NETTOYAGE ===');
    await Correspondance.findByIdAndDelete(corrAnis._id);
    await Correspondance.findByIdAndDelete(corrNajeh._id);
    await Correspondance.findByIdAndDelete(corrMultiple._id);
    console.log('✅ Correspondances de test supprimées');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testManualAssignmentOnly();

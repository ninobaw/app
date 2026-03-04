const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceAssignmentService = require('./src/services/correspondanceAssignmentService');

/**
 * Script pour corriger les assignations des directeurs
 */

async function fixDirectorAssignments() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 CORRECTION ASSIGNATIONS DIRECTEURS');
    console.log('🔧 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. CRÉER DES CORRESPONDANCES DE TEST POUR CHAQUE DIRECTEUR
    console.log('📝 === CRÉATION CORRESPONDANCES DE TEST ===');
    
    const directors = await User.find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).lean();

    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    
    console.log(`👥 Directeurs trouvés: ${directors.length}`);
    console.log(`📋 Agent bureau d'ordre: ${agent.firstName} ${agent.lastName}\n`);

    const testCorrespondances = [];

    // Créer une correspondance pour chaque domaine
    const correspondancesByDomain = [
      {
        domain: 'RH',
        title: 'Demande formation ressources humaines',
        subject: 'Formation RH pour le personnel',
        content: 'Nous avons besoin d\'organiser une formation RH pour améliorer les compétences du personnel.',
        tags: ['formation', 'rh', 'personnel'],
        expectedDirector: 'Anis Ben Janet'
      },
      {
        domain: 'COMMERCIAL',
        title: 'Négociation contrat commercial',
        subject: 'Nouveau contrat avec partenaire commercial',
        content: 'Négociation d\'un nouveau contrat commercial avec un partenaire stratégique.',
        tags: ['commercial', 'contrat', 'partenaire'],
        expectedDirector: 'Najeh Chaouch'
      },
      {
        domain: 'GENERAL',
        title: 'Réunion direction générale',
        subject: 'Planification réunion stratégique',
        content: 'Organisation d\'une réunion de direction pour définir la stratégie 2024.',
        tags: ['direction', 'strategie', 'reunion'],
        expectedDirector: 'Ben Khalifa Adnen'
      },
      {
        domain: 'TECHNIQUE',
        title: 'Maintenance équipements techniques',
        subject: 'Maintenance préventive des équipements',
        content: 'Planification de la maintenance préventive des équipements techniques de l\'aéroport.',
        tags: ['technique', 'maintenance', 'equipement'],
        expectedDirector: 'Assignation automatique'
      }
    ];

    for (const corrData of correspondancesByDomain) {
      console.log(`📝 Création correspondance ${corrData.domain}...`);
      
      const correspondance = new Correspondance({
        title: corrData.title,
        subject: corrData.subject,
        content: corrData.content,
        type: 'INCOMING',
        priority: 'MEDIUM',
        status: 'PENDING',
        airport: 'ENFIDHA',
        from_address: `${corrData.domain.toLowerCase()}@external.com`,
        to_address: 'bureau.ordre@enfidha.tn',
        tags: corrData.tags,
        code: `TEST-${corrData.domain}-${Date.now()}`,
        authorId: agent._id,
        workflowStatus: 'PENDING',
        date_correspondance: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await correspondance.save();
      testCorrespondances.push({
        correspondance,
        expectedDirector: corrData.expectedDirector,
        domain: corrData.domain
      });
      
      console.log(`✅ Correspondance ${corrData.domain} créée: ${correspondance._id}`);
    }

    // 2. TESTER L'ASSIGNATION AUTOMATIQUE
    console.log('\n🎯 === TEST ASSIGNATION AUTOMATIQUE ===');
    
    for (const testCorr of testCorrespondances) {
      console.log(`\n🧪 Test assignation pour: ${testCorr.correspondance.title}`);
      console.log(`📋 Tags: ${testCorr.correspondance.tags.join(', ')}`);
      console.log(`🎯 Directeur attendu: ${testCorr.expectedDirector}`);
      
      try {
        // Appliquer l'assignation automatique
        await CorrespondanceAssignmentService.assignCorrespondance(testCorr.correspondance);
        
        // Vérifier le résultat
        const updatedCorr = await Correspondance.findById(testCorr.correspondance._id)
          .populate('personnesConcernees', 'firstName lastName role directorate')
          .lean();
        
        console.log(`📊 Résultat assignation:`);
        console.log(`   Personnes concernées: ${updatedCorr.personnesConcernees?.length || 0}`);
        console.log(`   Status workflow: ${updatedCorr.workflowStatus}`);
        
        if (updatedCorr.personnesConcernees && updatedCorr.personnesConcernees.length > 0) {
          updatedCorr.personnesConcernees.forEach((person, index) => {
            console.log(`   ${index + 1}. ${person.firstName} ${person.lastName} (${person.role}) - ${person.directorate}`);
          });
          console.log(`   ✅ Assignation réussie`);
        } else {
          console.log(`   ❌ Aucune assignation effectuée`);
        }
        
      } catch (assignError) {
        console.log(`   ❌ Erreur assignation: ${assignError.message}`);
      }
    }

    // 3. VÉRIFIER LES DASHBOARDS APRÈS ASSIGNATION
    console.log('\n📊 === VÉRIFICATION DASHBOARDS APRÈS ASSIGNATION ===');
    
    const DirectorDashboardService = require('./src/services/directorDashboardService');
    
    for (const director of directors) {
      console.log(`\n👤 Dashboard ${director.firstName} ${director.lastName} (${director.role})`);
      
      try {
        const metrics = await DirectorDashboardService.getDirectorMetrics(
          director._id.toString(),
          director.role
        );
        
        console.log(`   Total assigné: ${metrics.totalAssigned}`);
        console.log(`   En attente: ${metrics.pendingCorrespondances}`);
        console.log(`   Récentes: ${metrics.recentCorrespondances?.length || 0}`);
        
        if (metrics.totalAssigned > 0) {
          console.log(`   ✅ Dashboard fonctionne - correspondances visibles`);
          
          // Afficher les correspondances récentes
          if (metrics.recentCorrespondances && metrics.recentCorrespondances.length > 0) {
            console.log(`   📋 Correspondances récentes:`);
            metrics.recentCorrespondances.forEach((corr, index) => {
              console.log(`      ${index + 1}. ${corr.title || corr.subject}`);
            });
          }
        } else {
          console.log(`   ⚠️ Dashboard vide - aucune correspondance`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur dashboard: ${error.message}`);
      }
    }

    // 4. ANALYSER LES PROBLÈMES D'ASSIGNATION
    console.log('\n🔍 === ANALYSE PROBLÈMES ASSIGNATION ===');
    
    // Vérifier le service d'assignation
    console.log('🔧 Vérification du service d\'assignation...');
    
    // Test avec une correspondance RH simple
    const testRHCorr = new Correspondance({
      title: 'Test assignation RH simple',
      subject: 'Test RH',
      content: 'Test pour vérifier l\'assignation RH',
      type: 'INCOMING',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@external.com',
      to_address: 'rh@enfidha.tn',
      tags: ['rh'],
      code: `TEST-RH-SIMPLE-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'PENDING',
      date_correspondance: new Date()
    });

    await testRHCorr.save();
    console.log(`📝 Correspondance test RH créée: ${testRHCorr._id}`);
    
    try {
      await CorrespondanceAssignmentService.assignCorrespondance(testRHCorr);
      
      const assignedCorr = await Correspondance.findById(testRHCorr._id)
        .populate('personnesConcernees', 'firstName lastName role directorate')
        .lean();
      
      console.log(`📊 Test assignation RH simple:`);
      console.log(`   Personnes assignées: ${assignedCorr.personnesConcernees?.length || 0}`);
      
      if (assignedCorr.personnesConcernees && assignedCorr.personnesConcernees.length > 0) {
        assignedCorr.personnesConcernees.forEach(person => {
          console.log(`   - ${person.firstName} ${person.lastName} (${person.directorate})`);
        });
      }
      
    } catch (testError) {
      console.log(`❌ Erreur test assignation RH: ${testError.message}`);
    }

    // 5. RECOMMANDATIONS
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    console.log('🔧 Actions à effectuer:');
    console.log('1. Vérifier que le service d\'assignation automatique fonctionne');
    console.log('2. S\'assurer que les directeurs ont les bons domaines/départements');
    console.log('3. Vérifier que les tags des correspondances correspondent aux domaines');
    console.log('4. Tester l\'assignation manuelle si l\'automatique échoue');
    
    console.log('\n🧹 === NETTOYAGE (OPTIONNEL) ===');
    console.log('⚠️ Nettoyage des correspondances de test désactivé pour inspection');
    console.log('💡 Pour nettoyer, décommentez la section suivante:');
    
    /*
    // DÉCOMMENTER POUR NETTOYER LES CORRESPONDANCES DE TEST
    console.log('🗑️ Suppression des correspondances de test...');
    
    for (const testCorr of testCorrespondances) {
      await Correspondance.findByIdAndDelete(testCorr.correspondance._id);
      console.log(`🗑️ Supprimé: ${testCorr.correspondance.title}`);
    }
    
    await Correspondance.findByIdAndDelete(testRHCorr._id);
    console.log('🗑️ Supprimé: Test RH simple');
    */

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la correction
fixDirectorAssignments();

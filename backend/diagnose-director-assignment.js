const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Diagnostic du problème d'affichage des correspondances pour les directeurs
 */

async function diagnoseDirectorAssignment() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DIAGNOSTIC ASSIGNATION DIRECTEURS');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. ANALYSER LES DIRECTEURS ET SOUS-DIRECTEURS
    console.log('👥 === ANALYSE DES DIRECTEURS ===');
    
    const directors = await User.find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] }
    }).lean();

    console.log(`📊 Total directeurs/sous-directeurs: ${directors.length}`);
    
    directors.forEach(director => {
      console.log(`👤 ${director.firstName} ${director.lastName}`);
      console.log(`   Role: ${director.role}`);
      console.log(`   ID: ${director._id}`);
      console.log(`   Directorate: ${director.directorate || 'Non défini'}`);
      console.log(`   Email: ${director.email}`);
      console.log('');
    });

    // 2. ANALYSER LES CORRESPONDANCES EXISTANTES
    console.log('📋 === ANALYSE DES CORRESPONDANCES ===');
    
    const correspondances = await Correspondance.find({}).lean();
    console.log(`📊 Total correspondances: ${correspondances.length}`);

    let correspondancesWithAssignments = 0;
    let correspondancesWithoutAssignments = 0;
    const assignmentStats = {};

    correspondances.forEach(corr => {
      if (corr.personnesConcernees && corr.personnesConcernees.length > 0) {
        correspondancesWithAssignments++;
        corr.personnesConcernees.forEach(personId => {
          assignmentStats[personId] = (assignmentStats[personId] || 0) + 1;
        });
      } else {
        correspondancesWithoutAssignments++;
      }
    });

    console.log(`📊 Correspondances avec assignations: ${correspondancesWithAssignments}`);
    console.log(`📊 Correspondances sans assignations: ${correspondancesWithoutAssignments}`);

    // 3. ANALYSER LES ASSIGNATIONS PAR DIRECTEUR
    console.log('\n👥 === ASSIGNATIONS PAR DIRECTEUR ===');
    
    for (const director of directors) {
      const directorId = director._id.toString();
      const assignedCount = assignmentStats[directorId] || 0;
      
      console.log(`👤 ${director.firstName} ${director.lastName} (${director.role})`);
      console.log(`   ID: ${directorId}`);
      console.log(`   Correspondances assignées: ${assignedCount}`);
      
      if (assignedCount > 0) {
        // Récupérer quelques exemples
        const examples = await Correspondance.find({
          personnesConcernees: directorId
        }).limit(3).lean();
        
        console.log(`   Exemples:`);
        examples.forEach((corr, index) => {
          console.log(`     ${index + 1}. ${corr.title || corr.subject}`);
          console.log(`        Status: ${corr.status}`);
          console.log(`        Workflow: ${corr.workflowStatus || 'Non défini'}`);
        });
      } else {
        console.log(`   ⚠️ AUCUNE correspondance assignée`);
      }
      console.log('');
    }

    // 4. VÉRIFIER LES WORKFLOWS
    console.log('🔄 === ANALYSE DES WORKFLOWS ===');
    
    const workflows = await CorrespondenceWorkflow.find({}).lean();
    console.log(`📊 Total workflows: ${workflows.length}`);

    const workflowAssignments = {};
    workflows.forEach(workflow => {
      if (workflow.assignedDirector) {
        workflowAssignments[workflow.assignedDirector] = (workflowAssignments[workflow.assignedDirector] || 0) + 1;
      }
    });

    console.log('\n👥 Assignations dans les workflows:');
    for (const director of directors) {
      const directorId = director._id.toString();
      const workflowCount = workflowAssignments[directorId] || 0;
      const correspondanceCount = assignmentStats[directorId] || 0;
      
      console.log(`👤 ${director.firstName} ${director.lastName}`);
      console.log(`   Workflows: ${workflowCount}`);
      console.log(`   Correspondances: ${correspondanceCount}`);
      console.log(`   Cohérence: ${workflowCount === correspondanceCount ? '✅' : '❌'}`);
    }

    // 5. IDENTIFIER LES PROBLÈMES
    console.log('\n🔍 === PROBLÈMES IDENTIFIÉS ===');
    
    const problems = [];

    // Problème 1: Correspondances sans assignation
    if (correspondancesWithoutAssignments > 0) {
      problems.push(`${correspondancesWithoutAssignments} correspondances sans assignation`);
    }

    // Problème 2: Directeurs sans correspondances
    const directorsWithoutCorrespondances = directors.filter(d => 
      (assignmentStats[d._id.toString()] || 0) === 0
    );
    
    if (directorsWithoutCorrespondances.length > 0) {
      problems.push(`${directorsWithoutCorrespondances.length} directeurs sans correspondances assignées`);
      directorsWithoutCorrespondances.forEach(d => {
        console.log(`   ⚠️ ${d.firstName} ${d.lastName} (${d.role}) - Aucune correspondance`);
      });
    }

    // Problème 3: Incohérences workflow/correspondance
    let incoherentAssignments = 0;
    for (const director of directors) {
      const directorId = director._id.toString();
      const workflowCount = workflowAssignments[directorId] || 0;
      const correspondanceCount = assignmentStats[directorId] || 0;
      
      if (workflowCount !== correspondanceCount) {
        incoherentAssignments++;
      }
    }
    
    if (incoherentAssignments > 0) {
      problems.push(`${incoherentAssignments} directeurs avec incohérences workflow/correspondance`);
    }

    // 6. TESTER LE SERVICE DASHBOARD DIRECTEUR
    console.log('\n🧪 === TEST SERVICE DASHBOARD DIRECTEUR ===');
    
    const DirectorDashboardService = require('./src/services/directorDashboardService');
    
    for (const director of directors.slice(0, 2)) { // Tester les 2 premiers
      try {
        console.log(`🧪 Test dashboard pour: ${director.firstName} ${director.lastName}`);
        
        const metrics = await DirectorDashboardService.getDirectorMetrics(
          director._id.toString(),
          director.role
        );
        
        console.log(`   Total assigné: ${metrics.totalAssigned}`);
        console.log(`   En attente: ${metrics.pendingCorrespondances}`);
        console.log(`   Répondues: ${metrics.repliedCorrespondances}`);
        console.log(`   Récentes: ${metrics.recentCorrespondances?.length || 0}`);
        
        if (metrics.totalAssigned === 0) {
          console.log(`   ⚠️ PROBLÈME: Aucune correspondance trouvée par le service`);
        } else {
          console.log(`   ✅ Service fonctionne correctement`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur service dashboard: ${error.message}`);
      }
      console.log('');
    }

    // 7. RECOMMANDATIONS
    console.log('💡 === RECOMMANDATIONS ===');
    
    if (problems.length === 0) {
      console.log('✅ Aucun problème majeur détecté');
    } else {
      console.log('🔧 Problèmes à corriger:');
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
      
      console.log('\n🔧 Actions recommandées:');
      
      if (correspondancesWithoutAssignments > 0) {
        console.log('   1. Réassigner les correspondances sans assignation');
      }
      
      if (directorsWithoutCorrespondances.length > 0) {
        console.log('   2. Vérifier le service d\'assignation automatique');
      }
      
      if (incoherentAssignments > 0) {
        console.log('   3. Synchroniser les workflows avec les correspondances');
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
diagnoseDirectorAssignment();

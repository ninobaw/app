const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

/**
 * Script d'analyse complète de l'intégrité du workflow de correspondances
 * Identifie tous les conflits et incohérences dans le processus
 */

async function analyzeWorkflowIntegrity() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 ANALYSE INTÉGRITÉ WORKFLOW CORRESPONDANCES');
    console.log('🔍 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. ANALYSE DES CORRESPONDANCES
    console.log('📊 === ANALYSE DES CORRESPONDANCES ===');
    const correspondances = await Correspondance.find({}).lean();
    console.log(`📋 Total correspondances: ${correspondances.length}`);

    // Analyser les statuts de workflow
    const workflowStatuses = {};
    const statusCounts = {};
    const assignmentIssues = [];
    const workflowIssues = [];

    correspondances.forEach(corr => {
      // Compter les statuts
      const status = corr.status || 'UNDEFINED';
      const workflowStatus = corr.workflowStatus || 'UNDEFINED';
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      workflowStatuses[workflowStatus] = (workflowStatuses[workflowStatus] || 0) + 1;

      // Identifier les problèmes d'assignation
      if (!corr.personnesConcernees || corr.personnesConcernees.length === 0) {
        assignmentIssues.push({
          id: corr._id,
          title: corr.title || corr.subject,
          issue: 'Aucune personne concernée assignée',
          status: corr.status,
          workflowStatus: corr.workflowStatus
        });
      }

      // Identifier les incohérences de workflow
      if (corr.workflowStatus === 'ASSIGNED_TO_DIRECTOR' && (!corr.personnesConcernees || corr.personnesConcernees.length === 0)) {
        workflowIssues.push({
          id: corr._id,
          title: corr.title || corr.subject,
          issue: 'WorkflowStatus ASSIGNED_TO_DIRECTOR mais aucune assignation',
          workflowStatus: corr.workflowStatus
        });
      }

      if (corr.responseDrafts && corr.responseDrafts.length > 0 && corr.workflowStatus === 'PENDING') {
        workflowIssues.push({
          id: corr._id,
          title: corr.title || corr.subject,
          issue: 'Des drafts existent mais workflowStatus est PENDING',
          workflowStatus: corr.workflowStatus,
          draftsCount: corr.responseDrafts.length
        });
      }
    });

    console.log('\n📊 Répartition des statuts:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n🔄 Répartition des statuts workflow:');
    Object.entries(workflowStatuses).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // 2. ANALYSE DES WORKFLOWS SÉPARÉS
    console.log('\n📊 === ANALYSE DES WORKFLOWS SÉPARÉS ===');
    const workflows = await CorrespondenceWorkflow.find({}).lean();
    console.log(`📋 Total workflows: ${workflows.length}`);

    const workflowCorrespondanceIds = workflows.map(w => w.correspondanceId.toString());
    const correspondanceIds = correspondances.map(c => c._id.toString());
    
    // Workflows orphelins
    const orphanWorkflows = workflows.filter(w => 
      !correspondanceIds.includes(w.correspondanceId.toString())
    );

    // Correspondances sans workflow
    const correspondancesWithoutWorkflow = correspondances.filter(c => 
      !workflowCorrespondanceIds.includes(c._id.toString()) && 
      (c.workflowStatus && c.workflowStatus !== 'PENDING')
    );

    console.log(`⚠️ Workflows orphelins: ${orphanWorkflows.length}`);
    console.log(`⚠️ Correspondances sans workflow: ${correspondancesWithoutWorkflow.length}`);

    // 3. ANALYSE DES UTILISATEURS ET RÔLES
    console.log('\n👥 === ANALYSE DES UTILISATEURS ===');
    const users = await User.find({}).lean();
    const usersByRole = {};
    
    users.forEach(user => {
      const role = user.role || 'UNDEFINED';
      if (!usersByRole[role]) usersByRole[role] = [];
      usersByRole[role].push({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        directorate: user.directorate,
        isActive: user.isActive
      });
    });

    console.log('👥 Utilisateurs par rôle:');
    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`   ${role}: ${users.length} utilisateurs`);
      if (role === 'DIRECTEUR' || role === 'SOUS_DIRECTEUR' || role === 'DIRECTEUR_GENERAL') {
        users.forEach(user => {
          console.log(`      - ${user.name} (${user.directorate || 'Pas de directorate'}) - ${user.isActive ? 'Actif' : 'Inactif'}`);
        });
      }
    });

    // 4. ANALYSE DES PROBLÈMES D'ASSIGNATION
    console.log('\n⚠️ === PROBLÈMES D\'ASSIGNATION ===');
    console.log(`🔴 Correspondances sans assignation: ${assignmentIssues.length}`);
    
    if (assignmentIssues.length > 0) {
      console.log('\nDétails des problèmes d\'assignation:');
      assignmentIssues.slice(0, 5).forEach(issue => {
        console.log(`   📋 ${issue.title}`);
        console.log(`      ID: ${issue.id}`);
        console.log(`      Problème: ${issue.issue}`);
        console.log(`      Status: ${issue.status} | Workflow: ${issue.workflowStatus}\n`);
      });
      if (assignmentIssues.length > 5) {
        console.log(`   ... et ${assignmentIssues.length - 5} autres\n`);
      }
    }

    // 5. ANALYSE DES PROBLÈMES DE WORKFLOW
    console.log('\n⚠️ === PROBLÈMES DE WORKFLOW ===');
    console.log(`🔴 Incohérences de workflow: ${workflowIssues.length}`);
    
    if (workflowIssues.length > 0) {
      console.log('\nDétails des incohérences:');
      workflowIssues.slice(0, 5).forEach(issue => {
        console.log(`   📋 ${issue.title}`);
        console.log(`      ID: ${issue.id}`);
        console.log(`      Problème: ${issue.issue}`);
        console.log(`      Workflow Status: ${issue.workflowStatus}`);
        if (issue.draftsCount) console.log(`      Drafts: ${issue.draftsCount}`);
        console.log('');
      });
      if (workflowIssues.length > 5) {
        console.log(`   ... et ${workflowIssues.length - 5} autres\n`);
      }
    }

    // 6. ANALYSE DES DRAFTS ET PROPOSITIONS
    console.log('\n📝 === ANALYSE DES DRAFTS ===');
    const correspondancesWithDrafts = correspondances.filter(c => c.responseDrafts && c.responseDrafts.length > 0);
    console.log(`📋 Correspondances avec drafts: ${correspondancesWithDrafts.length}`);

    let totalDrafts = 0;
    const draftStatuses = {};
    const dgFeedbackIssues = [];

    correspondancesWithDrafts.forEach(corr => {
      if (corr.responseDrafts) {
        totalDrafts += corr.responseDrafts.length;
        
        corr.responseDrafts.forEach((draft, index) => {
          const status = draft.status || 'UNDEFINED';
          draftStatuses[status] = (draftStatuses[status] || 0) + 1;

          // Vérifier les problèmes de feedback DG
          if (draft.status === 'PENDING_DG_REVIEW' && (!draft.dgFeedbacks || draft.dgFeedbacks.length === 0)) {
            dgFeedbackIssues.push({
              correspondanceId: corr._id,
              correspondanceTitle: corr.title || corr.subject,
              draftIndex: index,
              directorName: draft.directorName,
              issue: 'Draft en attente de review DG mais pas de feedback'
            });
          }
        });
      }
    });

    console.log(`📊 Total drafts: ${totalDrafts}`);
    console.log('📊 Statuts des drafts:');
    Object.entries(draftStatuses).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    if (dgFeedbackIssues.length > 0) {
      console.log(`\n⚠️ Drafts en attente de review DG: ${dgFeedbackIssues.length}`);
      dgFeedbackIssues.slice(0, 3).forEach(issue => {
        console.log(`   📋 ${issue.correspondanceTitle}`);
        console.log(`      Directeur: ${issue.directorName}`);
        console.log(`      Problème: ${issue.issue}\n`);
      });
    }

    // 7. RECOMMANDATIONS
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (assignmentIssues.length > 0) {
      console.log('🔧 1. Corriger les assignations manquantes:');
      console.log('   - Réassigner les correspondances sans personnes concernées');
      console.log('   - Vérifier la logique d\'assignation automatique');
    }

    if (workflowIssues.length > 0) {
      console.log('🔧 2. Corriger les incohérences de workflow:');
      console.log('   - Synchroniser workflowStatus avec l\'état réel');
      console.log('   - Mettre à jour les statuts orphelins');
    }

    if (orphanWorkflows.length > 0) {
      console.log('🔧 3. Nettoyer les workflows orphelins:');
      console.log('   - Supprimer les workflows sans correspondance');
    }

    if (correspondancesWithoutWorkflow.length > 0) {
      console.log('🔧 4. Créer les workflows manquants:');
      console.log('   - Créer des workflows pour les correspondances en cours');
    }

    if (dgFeedbackIssues.length > 0) {
      console.log('🔧 5. Résoudre les blocages DG:');
      console.log('   - Notifier le DG des drafts en attente');
      console.log('   - Vérifier la visibilité des drafts pour le DG');
    }

    // 8. RÉSUMÉ FINAL
    console.log('\n📊 === RÉSUMÉ FINAL ===');
    console.log(`📋 Total correspondances: ${correspondances.length}`);
    console.log(`🔄 Total workflows: ${workflows.length}`);
    console.log(`👥 Total utilisateurs: ${users.length}`);
    console.log(`📝 Total drafts: ${totalDrafts}`);
    console.log('');
    console.log('🔴 PROBLÈMES IDENTIFIÉS:');
    console.log(`   - Assignations manquantes: ${assignmentIssues.length}`);
    console.log(`   - Incohérences workflow: ${workflowIssues.length}`);
    console.log(`   - Workflows orphelins: ${orphanWorkflows.length}`);
    console.log(`   - Correspondances sans workflow: ${correspondancesWithoutWorkflow.length}`);
    console.log(`   - Drafts bloqués DG: ${dgFeedbackIssues.length}`);

    const totalIssues = assignmentIssues.length + workflowIssues.length + orphanWorkflows.length + correspondancesWithoutWorkflow.length + dgFeedbackIssues.length;
    
    if (totalIssues === 0) {
      console.log('\n✅ AUCUN PROBLÈME MAJEUR DÉTECTÉ - Workflow intègre');
    } else {
      console.log(`\n⚠️ TOTAL PROBLÈMES: ${totalIssues} - Action requise`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter l'analyse
analyzeWorkflowIntegrity();

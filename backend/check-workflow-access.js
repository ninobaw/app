const mongoose = require('mongoose');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

async function checkWorkflowAccess() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/sgdo');
    console.log('✅ Connexion MongoDB réussie');

    const correspondanceId = '68e80b66948741da98edd3b6';
    const userId = '571d5ac7-1bed-4a7e-8653-4682be01bafd';

    console.log('\n🔍 DIAGNOSTIC WORKFLOW ACCESS');
    console.log('=====================================');
    console.log(`Correspondance ID: ${correspondanceId}`);
    console.log(`User ID: ${userId}`);

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('\n👤 UTILISATEUR:');
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Nom: ${user.firstName} ${user.lastName}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rôle: ${user.role}`);

    // Récupérer le workflow
    const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId })
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (!workflow) {
      console.log('\n❌ Aucun workflow trouvé pour cette correspondance');
      return;
    }

    console.log('\n📋 WORKFLOW:');
    console.log(`   - ID: ${workflow._id}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - Correspondance ID: ${workflow.correspondanceId}`);

    console.log('\n👥 ASSIGNATIONS:');
    console.log(`   - Assigned Director: ${workflow.assignedDirector || 'Non assigné'}`);
    if (workflow.assignedDirector) {
      console.log(`     * ID: ${workflow.assignedDirector._id || workflow.assignedDirector}`);
      console.log(`     * Nom: ${workflow.assignedDirector.firstName} ${workflow.assignedDirector.lastName}`);
      console.log(`     * Rôle: ${workflow.assignedDirector.role}`);
    }

    console.log(`   - Directeur Général: ${workflow.directeurGeneral || 'Non assigné'}`);
    if (workflow.directeurGeneral) {
      console.log(`     * ID: ${workflow.directeurGeneral._id || workflow.directeurGeneral}`);
      console.log(`     * Nom: ${workflow.directeurGeneral.firstName} ${workflow.directeurGeneral.lastName}`);
      console.log(`     * Rôle: ${workflow.directeurGeneral.role}`);
    }

    // Vérifications d'accès
    console.log('\n🔐 VÉRIFICATIONS D\'ACCÈS:');
    
    const isAssignedDirector = 
      workflow.assignedDirector?.toString() === user._id.toString() ||
      workflow.assignedDirector?._id?.toString() === user._id.toString();
    
    const isDirecteurGeneral = 
      workflow.directeurGeneral?.toString() === user._id.toString() ||
      workflow.directeurGeneral?._id?.toString() === user._id.toString();
    
    const isSupervisor = user.role === 'SUPERVISEUR_BUREAU_ORDRE';
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isDirectorRole = user.role === 'DIRECTEUR';
    const isSousDirectorRole = user.role === 'SOUS_DIRECTEUR';

    console.log(`   - isAssignedDirector: ${isAssignedDirector}`);
    console.log(`   - isDirecteurGeneral: ${isDirecteurGeneral}`);
    console.log(`   - isSupervisor: ${isSupervisor}`);
    console.log(`   - isSuperAdmin: ${isSuperAdmin}`);
    console.log(`   - isDirectorRole: ${isDirectorRole}`);
    console.log(`   - isSousDirectorRole: ${isSousDirectorRole}`);

    // Logique actuelle
    const hasAccessCurrent = (
      isAssignedDirector ||
      isDirecteurGeneral ||
      isSupervisor ||
      isSuperAdmin ||
      isDirectorRole
    );

    // Logique proposée (avec SOUS_DIRECTEUR)
    const hasAccessProposed = (
      isAssignedDirector ||
      isDirecteurGeneral ||
      isSupervisor ||
      isSuperAdmin ||
      isDirectorRole ||
      isSousDirectorRole
    );

    console.log('\n📊 RÉSULTATS:');
    console.log(`   - Accès avec logique actuelle: ${hasAccessCurrent ? '✅ AUTORISÉ' : '❌ REFUSÉ'}`);
    console.log(`   - Accès avec logique proposée: ${hasAccessProposed ? '✅ AUTORISÉ' : '❌ REFUSÉ'}`);

    if (!hasAccessCurrent && hasAccessProposed) {
      console.log('\n💡 SOLUTION: Ajouter SOUS_DIRECTEUR aux rôles autorisés');
    }

    // Vérifier tous les workflows assignés à cet utilisateur
    console.log('\n🔍 WORKFLOWS ASSIGNÉS À CET UTILISATEUR:');
    const userWorkflows = await CorrespondenceWorkflow.find({
      $or: [
        { assignedDirector: user._id },
        { directeurGeneral: user._id }
      ]
    });

    console.log(`   - Nombre de workflows assignés: ${userWorkflows.length}`);
    userWorkflows.forEach((wf, index) => {
      console.log(`   ${index + 1}. Workflow ${wf._id} (Correspondance: ${wf.correspondanceId})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion MongoDB');
  }
}

checkWorkflowAccess();

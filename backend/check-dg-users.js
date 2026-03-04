const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/aerodoc')
  .then(async () => {
    console.log('🔍 Recherche des utilisateurs DG...');
    const dgs = await User.find({ role: 'DIRECTEUR_GENERAL' }).select('firstName lastName email role');
    console.log('👥 Utilisateurs DIRECTEUR_GENERAL trouvés:', dgs.length);
    dgs.forEach((dg, index) => {
      console.log(`   ${index + 1}. ${dg.firstName} ${dg.lastName} (${dg.email}) - ${dg.role}`);
    });
    
    if (dgs.length === 0) {
      console.log('⚠️ Aucun utilisateur avec le rôle DIRECTEUR_GENERAL trouvé');
      console.log('🔍 Recherche d\'autres rôles similaires...');
      const similarRoles = await User.find({ role: { $regex: /DIRECTEUR|DG|GENERAL/i } }).select('firstName lastName email role');
      console.log('👥 Rôles similaires:', similarRoles.length);
      similarRoles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.role}`);
      });
    }
    
    console.log('\n🔍 Vérification du workflow pour la correspondance 68e429b4c08f8b5a157b31e6...');
    const CorrespondenceWorkflow = require('./src/models/CorrespondenceWorkflow');
    const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId: '68e429b4c08f8b5a157b31e6' })
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');
    
    if (workflow) {
      console.log('📋 Workflow trouvé:');
      console.log('   - Directeur assigné:', workflow.assignedDirector ? `${workflow.assignedDirector.firstName} ${workflow.assignedDirector.lastName} (${workflow.assignedDirector.role})` : 'Aucun');
      console.log('   - DG assigné:', workflow.directeurGeneral ? `${workflow.directeurGeneral.firstName} ${workflow.directeurGeneral.lastName} (${workflow.directeurGeneral.role})` : 'Aucun');
    } else {
      console.log('❌ Aucun workflow trouvé pour cette correspondance');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });

const mongoose = require('mongoose');
const User = require('./src/models/User');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

async function fixUserAccess() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/sgdo');
    console.log('✅ Connexion MongoDB réussie');

    const problematicUserId = '571d5ac7-1bed-4a7e-8653-4682be01bafd';
    const correspondanceId = '68e80b66948741da98edd3b6';

    console.log('\n🔍 DIAGNOSTIC UTILISATEUR ET WORKFLOW');
    console.log('=====================================');
    console.log(`User ID problématique: ${problematicUserId}`);
    console.log(`Correspondance ID: ${correspondanceId}`);

    // 1. Vérifier si l'utilisateur existe
    console.log('\n👤 VÉRIFICATION UTILISATEUR:');
    const user = await User.findById(problematicUserId);
    if (user) {
      console.log(`✅ Utilisateur trouvé: ${user.firstName} ${user.lastName} (${user.role})`);
    } else {
      console.log(`❌ Utilisateur non trouvé avec ID: ${problematicUserId}`);
      
      // Chercher un utilisateur similaire
      const similarUsers = await User.find({
        $or: [
          { firstName: { $regex: /ben.*khalifa/i } },
          { lastName: { $regex: /ben.*khalifa/i } },
          { email: { $regex: /abdallah/i } }
        ]
      });
      
      console.log(`\n🔍 Utilisateurs similaires trouvés: ${similarUsers.length}`);
      similarUsers.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.email}) - ${u.role} - ID: ${u._id}`);
      });
    }

    // 2. Lister tous les utilisateurs avec rôle SOUS_DIRECTEUR
    console.log('\n👥 UTILISATEURS SOUS_DIRECTEUR:');
    const sousDirecteurs = await User.find({ role: 'SOUS_DIRECTEUR' });
    console.log(`Nombre de SOUS_DIRECTEUR: ${sousDirecteurs.length}`);
    sousDirecteurs.forEach(u => {
      console.log(`   - ${u.firstName} ${u.lastName} (${u.email}) - ID: ${u._id}`);
    });

    // 3. Vérifier le workflow
    console.log('\n📋 VÉRIFICATION WORKFLOW:');
    const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId })
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (workflow) {
      console.log(`✅ Workflow trouvé: ${workflow._id}`);
      console.log(`   Status: ${workflow.currentStatus}`);
      console.log(`   Assigned Director: ${workflow.assignedDirector?._id} (${workflow.assignedDirector?.firstName} ${workflow.assignedDirector?.lastName})`);
      console.log(`   Directeur Général: ${workflow.directeurGeneral?._id} (${workflow.directeurGeneral?.firstName} ${workflow.directeurGeneral?.lastName})`);
    } else {
      console.log(`❌ Aucun workflow trouvé pour correspondance: ${correspondanceId}`);
    }

    // 4. Proposer des solutions
    console.log('\n💡 SOLUTIONS PROPOSÉES:');
    
    if (!user && similarUsers.length > 0) {
      console.log('1. UTILISER UN UTILISATEUR EXISTANT:');
      const bestMatch = similarUsers[0];
      console.log(`   - Connectez-vous avec: ${bestMatch.email}`);
      console.log(`   - ID utilisateur: ${bestMatch._id}`);
      console.log(`   - Rôle: ${bestMatch.role}`);
    }

    console.log('\n2. CORRIGER LA LOGIQUE D\'AUTORISATION:');
    console.log('   - Ajouter SOUS_DIRECTEUR aux rôles autorisés dans workflowChatRoutes.js');
    console.log('   - Ligne 92: req.user.role === \'DIRECTEUR\' || req.user.role === \'SOUS_DIRECTEUR\'');

    if (workflow && sousDirecteurs.length > 0) {
      console.log('\n3. ASSIGNER LE WORKFLOW À UN SOUS_DIRECTEUR:');
      const sousDirecteur = sousDirecteurs[0];
      console.log(`   - Assigner le workflow à: ${sousDirecteur.firstName} ${sousDirecteur.lastName}`);
      console.log(`   - ID: ${sousDirecteur._id}`);
      
      // Optionnel: Assigner automatiquement
      console.log('\n🔧 ASSIGNATION AUTOMATIQUE:');
      const shouldAssign = process.argv.includes('--assign');
      if (shouldAssign) {
        workflow.assignedDirector = sousDirecteur._id;
        await workflow.save();
        console.log(`✅ Workflow assigné à ${sousDirecteur.firstName} ${sousDirecteur.lastName}`);
      } else {
        console.log('   Pour assigner automatiquement, relancez avec: node fix-user-access.js --assign');
      }
    }

    // 5. Lister tous les rôles disponibles
    console.log('\n📊 RÔLES DISPONIBLES DANS LA BASE:');
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    roleStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} utilisateur(s)`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnexion MongoDB');
  }
}

// Exécuter avec node fix-user-access.js --assign pour assigner automatiquement
fixUserAccess();

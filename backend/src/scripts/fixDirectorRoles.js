const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script simple pour corriger les rôles des directeurs
 */
async function fixDirectorRoles() {
  try {
    console.log('🔧 [FIX ROLES] Début de la correction des rôles...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgdo');
    console.log('📡 [DATABASE] Connecté à MongoDB');
    
    // Lister tous les utilisateurs avec des rôles de directeur
    const allUsers = await User.find({});
    console.log(`👥 [INFO] ${allUsers.length} utilisateurs trouvés au total`);
    
    const directorsFound = allUsers.filter(u => 
      u.role && (
        u.role.includes('DIRECTEUR') || 
        u.role === 'DIRECTEUR_GENERAL'
      )
    );
    
    console.log(`👑 [INFO] ${directorsFound.length} directeurs trouvés:`);
    directorsFound.forEach(d => {
      console.log(`   - ${d.firstName} ${d.lastName} (${d.email}) : ${d.role}`);
    });
    
    // Mapping des anciens rôles vers les nouveaux
    const roleMapping = {
      'DIRECTEUR_TECHNIQUE': { role: 'DIRECTEUR', directorate: 'TECHNIQUE' },
      'DIRECTEUR_COMMERCIAL': { role: 'DIRECTEUR', directorate: 'COMMERCIAL' },
      'DIRECTEUR_FINANCIER': { role: 'DIRECTEUR', directorate: 'FINANCIER' },
      'DIRECTEUR_OPERATIONS': { role: 'DIRECTEUR', directorate: 'OPERATIONS' },
      'DIRECTEUR_RH': { role: 'SOUS_DIRECTEUR', directorate: 'RH' }
    };
    
    let totalUpdated = 0;
    
    for (const [oldRole, newData] of Object.entries(roleMapping)) {
      const usersToUpdate = await User.find({ role: oldRole });
      
      if (usersToUpdate.length > 0) {
        console.log(`🔄 [UPDATE] Mise à jour de ${usersToUpdate.length} utilisateur(s) avec le rôle ${oldRole}`);
        
        for (const user of usersToUpdate) {
          console.log(`   - ${user.firstName} ${user.lastName}: ${oldRole} → ${newData.role} (${newData.directorate})`);
          
          user.role = newData.role;
          user.directorate = newData.directorate;
          user.updatedAt = new Date();
          
          await user.save();
          totalUpdated++;
        }
      }
    }
    
    // Vérifier le résultat
    const updatedDirectors = await User.find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    console.log('\n✅ [RESULT] Résultat final:');
    console.log(`   📊 ${totalUpdated} utilisateur(s) mis à jour`);
    console.log(`   👑 ${updatedDirectors.length} directeur(s) avec les nouveaux rôles:`);
    
    updatedDirectors.forEach(d => {
      console.log(`   - ${d.firstName} ${d.lastName} (${d.email})`);
      console.log(`     Rôle: ${d.role}`);
      console.log(`     Directorate: ${d.directorate || 'Non défini'}`);
      console.log(`     Départements gérés: ${d.managedDepartments || 'Non défini'}`);
      console.log('');
    });
    
    console.log('🎉 [SUCCESS] Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ [ERROR] Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 [DATABASE] Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter le script
if (require.main === module) {
  fixDirectorRoles();
}

module.exports = { fixDirectorRoles };

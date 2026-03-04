const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function cleanAllCorrespondances() {
  try {
    console.log('🧹 === NETTOYAGE COMPLET DU SYSTÈME ===\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    // 1. Supprimer toutes les correspondances
    console.log('📝 1. Suppression des correspondances...');
    const correspondancesResult = await db.collection('correspondances').deleteMany({});
    console.log(`   ✅ ${correspondancesResult.deletedCount} correspondances supprimées`);
    
    // 2. Supprimer tous les workflows
    console.log('\n🔄 2. Suppression des workflows...');
    const workflowsResult = await db.collection('correspondenceworkflows').deleteMany({});
    console.log(`   ✅ ${workflowsResult.deletedCount} workflows supprimés`);
    
    // 3. Supprimer tous les fichiers de chat
    console.log('\n💬 3. Suppression des messages de chat...');
    // Les messages sont dans les workflows, donc déjà supprimés
    console.log('   ✅ Messages de chat supprimés avec les workflows');
    
    // 4. Nettoyer les fichiers uploadés (optionnel - commenté pour sécurité)
    console.log('\n📎 4. Nettoyage des fichiers uploadés...');
    const fs = require('fs');
    const path = require('path');
    
    const uploadDirs = [
      path.join(__dirname, 'uploads/chat-attachments'),
      path.join(__dirname, 'uploads/correspondances'),
      path.join(__dirname, 'uploads/drafts'),
      path.join(__dirname, 'uploads/documents')
    ];
    
    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        console.log(`   📂 ${dir}: ${files.length} fichiers trouvés`);
        
        // Décommenter les lignes suivantes pour supprimer les fichiers
        // for (const file of files) {
        //   fs.unlinkSync(path.join(dir, file));
        // }
        // console.log(`   ✅ ${files.length} fichiers supprimés de ${dir}`);
      } else {
        console.log(`   ⚠️ Dossier non trouvé: ${dir}`);
      }
    }
    console.log('   ℹ️ Fichiers conservés (décommentez le code pour les supprimer)');
    
    // 5. Vérifier que tout est propre
    console.log('\n🔍 5. Vérification du nettoyage...');
    const remainingCorrespondances = await db.collection('correspondances').countDocuments();
    const remainingWorkflows = await db.collection('correspondenceworkflows').countDocuments();
    
    console.log(`   📝 Correspondances restantes: ${remainingCorrespondances}`);
    console.log(`   🔄 Workflows restants: ${remainingWorkflows}`);
    
    // 6. Vérifier les utilisateurs (ne pas supprimer)
    console.log('\n👥 6. Vérification des utilisateurs...');
    const users = await db.collection('users').find({}).toArray();
    console.log(`   👤 Utilisateurs conservés: ${users.length}`);
    users.forEach(user => {
      console.log(`      - ${user.firstName} ${user.lastName} (${user.role})`);
    });
    
    console.log('\n🎉 === NETTOYAGE TERMINÉ ===');
    console.log('\n📋 RÉSUMÉ:');
    console.log(`   ✅ ${correspondancesResult.deletedCount} correspondances supprimées`);
    console.log(`   ✅ ${workflowsResult.deletedCount} workflows supprimés`);
    console.log(`   ✅ ${users.length} utilisateurs conservés`);
    console.log('   ✅ Fichiers uploadés conservés (sécurité)');
    
    console.log('\n🎯 PRÊT POUR LES TESTS:');
    console.log('   1. Créez une nouvelle correspondance');
    console.log('   2. Testez l\'assignation automatique');
    console.log('   3. Testez le chat unifié');
    console.log('   4. Testez les attachements');
    console.log('   5. Identifiez les erreurs potentielles');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  }
}

cleanAllCorrespondances();

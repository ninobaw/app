const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function cleanAllCorrespondancesSafe() {
  try {
    console.log('🧹 === NETTOYAGE COMPLET DU SYSTÈME (VERSION SÉCURISÉE) ===\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    // 1. Supprimer toutes les correspondances
    console.log('📝 1. Suppression des correspondances...');
    try {
      const correspondancesResult = await db.collection('correspondances').deleteMany({});
      console.log(`   ✅ ${correspondancesResult.deletedCount} correspondances supprimées`);
    } catch (error) {
      console.log(`   ❌ Erreur suppression correspondances: ${error.message}`);
    }
    
    // 2. Supprimer tous les workflows
    console.log('\n🔄 2. Suppression des workflows...');
    try {
      const workflowsResult = await db.collection('correspondenceworkflows').deleteMany({});
      console.log(`   ✅ ${workflowsResult.deletedCount} workflows supprimés`);
    } catch (error) {
      console.log(`   ❌ Erreur suppression workflows: ${error.message}`);
    }
    
    // 3. Vérifier le nettoyage
    console.log('\n🔍 3. Vérification du nettoyage...');
    try {
      const remainingCorrespondances = await db.collection('correspondances').countDocuments();
      const remainingWorkflows = await db.collection('correspondenceworkflows').countDocuments();
      
      console.log(`   📝 Correspondances restantes: ${remainingCorrespondances}`);
      console.log(`   🔄 Workflows restants: ${remainingWorkflows}`);
    } catch (error) {
      console.log(`   ❌ Erreur vérification: ${error.message}`);
    }
    
    // 4. Vérifier les utilisateurs
    console.log('\n👥 4. Vérification des utilisateurs...');
    try {
      const users = await db.collection('users').find({}).toArray();
      console.log(`   👤 Utilisateurs conservés: ${users.length}`);
      users.forEach(user => {
        console.log(`      - ${user.firstName} ${user.lastName} (${user.role})`);
      });
    } catch (error) {
      console.log(`   ❌ Erreur récupération utilisateurs: ${error.message}`);
    }
    
    // 5. Lister les fichiers uploadés
    console.log('\n📎 5. État des fichiers uploadés...');
    const fs = require('fs');
    const path = require('path');
    
    const uploadDirs = [
      'uploads/chat-attachments',
      'uploads/correspondances', 
      'uploads/drafts',
      'uploads/documents'
    ];
    
    for (const dirName of uploadDirs) {
      try {
        const dir = path.join(__dirname, dirName);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          console.log(`   📂 ${dirName}: ${files.length} fichiers`);
        } else {
          console.log(`   📂 ${dirName}: dossier n'existe pas`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur lecture ${dirName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 === NETTOYAGE TERMINÉ ===');
    console.log('\n🎯 SYSTÈME PRÊT POUR LES TESTS:');
    console.log('   ✅ Base de données nettoyée');
    console.log('   ✅ Utilisateurs conservés');
    console.log('   ✅ Prêt pour créer de nouvelles correspondances');
    
    console.log('\n📋 ÉTAPES DE TEST RECOMMANDÉES:');
    console.log('   1. Créer une correspondance via l\'interface');
    console.log('   2. Vérifier l\'assignation automatique');
    console.log('   3. Tester le workflow DG-Directeur');
    console.log('   4. Tester le chat unifié');
    console.log('   5. Tester les attachements');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Connexion MongoDB fermée');
    } catch (closeError) {
      console.log('⚠️ Erreur fermeture connexion:', closeError.message);
    }
    process.exit(0);
  }
}

cleanAllCorrespondancesSafe();

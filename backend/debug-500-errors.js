const mongoose = require('mongoose');

async function debug500Errors() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔍 === DIAGNOSTIC ERREURS 500 ===\n');
    
    // 1. Tester les utilitaires de fichiers
    console.log('📁 === TEST UTILITAIRES FICHIERS ===');
    
    try {
      const { getFinalTargetDir, ensureDirectoryExists } = require('./src/utils/fileUtils.js');
      
      const testDir = getFinalTargetDir(
        '/uploads',
        'correspondances',
        'MONASTIR',
        'RH',
        'INCOMING'
      );
      
      console.log('✅ getFinalTargetDir fonctionne:', testDir);
      
      // Test création dossier
      ensureDirectoryExists('./test-temp-dir');
      console.log('✅ ensureDirectoryExists fonctionne');
      
      // Nettoyer
      const fs = require('fs');
      if (fs.existsSync('./test-temp-dir')) {
        fs.rmSync('./test-temp-dir', { recursive: true });
      }
      
    } catch (fileUtilsError) {
      console.error('❌ Erreur utilitaires fichiers:', fileUtilsError.message);
    }
    
    // 2. Tester le service finalizeResponse
    console.log('\n📝 === TEST SERVICE FINALIZE ===');
    
    try {
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      // Vérifier que la méthode existe
      if (typeof CorrespondanceWorkflowService.finalizeResponse === 'function') {
        console.log('✅ Méthode finalizeResponse existe');
      } else {
        console.log('❌ Méthode finalizeResponse manquante');
      }
      
    } catch (serviceError) {
      console.error('❌ Erreur service CorrespondanceWorkflowService:', serviceError.message);
    }
    
    // 3. Vérifier les middlewares
    console.log('\n🔐 === TEST MIDDLEWARES ===');
    
    try {
      const { auth, requireSupervisor } = require('./src/middleware/auth');
      
      if (typeof auth === 'function') {
        console.log('✅ Middleware auth existe');
      } else {
        console.log('❌ Middleware auth manquant');
      }
      
      if (typeof requireSupervisor === 'function') {
        console.log('✅ Middleware requireSupervisor existe');
      } else {
        console.log('❌ Middleware requireSupervisor manquant');
      }
      
    } catch (authError) {
      console.error('❌ Erreur middlewares auth:', authError.message);
    }
    
    // 4. Vérifier les dépendances upload
    console.log('\n📤 === TEST DÉPENDANCES UPLOAD ===');
    
    try {
      const multer = require('multer');
      console.log('✅ Multer disponible');
      
      const { v4: uuidv4 } = require('uuid');
      console.log('✅ UUID disponible');
      
      const path = require('path');
      const fs = require('fs');
      console.log('✅ Path et FS disponibles');
      
    } catch (depsError) {
      console.error('❌ Erreur dépendances:', depsError.message);
    }
    
    // 5. Vérifier la structure des dossiers
    console.log('\n📁 === VÉRIFICATION STRUCTURE DOSSIERS ===');
    
    const path = require('path');
    const fs = require('fs');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    const tempDir = path.join(uploadsDir, 'temp');
    
    console.log('Dossier uploads:', uploadsDir);
    console.log('Existe:', fs.existsSync(uploadsDir));
    
    console.log('Dossier temp:', tempDir);
    console.log('Existe:', fs.existsSync(tempDir));
    
    // Créer les dossiers si nécessaire
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Dossier uploads créé');
    }
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('✅ Dossier temp créé');
    }
    
    // 6. Vérifier les permissions
    console.log('\n🔒 === VÉRIFICATION PERMISSIONS ===');
    
    try {
      // Test écriture dans uploads
      const testFile = path.join(uploadsDir, 'test-write.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Permissions écriture uploads OK');
      
      // Test écriture dans temp
      const testFileTemp = path.join(tempDir, 'test-write.txt');
      fs.writeFileSync(testFileTemp, 'test');
      fs.unlinkSync(testFileTemp);
      console.log('✅ Permissions écriture temp OK');
      
    } catch (permError) {
      console.error('❌ Erreur permissions:', permError.message);
    }
    
    // 7. Tester la méthode finalizeResponse si elle existe
    console.log('\n🧪 === TEST MÉTHODE FINALIZE ===');
    
    try {
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      if (CorrespondanceWorkflowService.finalizeResponse) {
        console.log('✅ Méthode finalizeResponse disponible');
        
        // Chercher une correspondance approuvée pour tester
        const db = mongoose.connection.db;
        const approvedWorkflow = await db.collection('correspondenceworkflows').findOne({
          'responseDrafts.status': 'APPROVED'
        });
        
        if (approvedWorkflow) {
          console.log(`📋 Workflow approuvé trouvé: ${approvedWorkflow._id}`);
          console.log('⚠️ Test finalizeResponse nécessiterait un superviseur valide');
        } else {
          console.log('ℹ️ Aucun workflow approuvé pour tester');
        }
        
      } else {
        console.log('❌ Méthode finalizeResponse non trouvée');
        
        // Lister les méthodes disponibles
        console.log('📋 Méthodes disponibles dans CorrespondanceWorkflowService:');
        Object.getOwnPropertyNames(CorrespondanceWorkflowService).forEach(method => {
          if (typeof CorrespondanceWorkflowService[method] === 'function') {
            console.log(`   - ${method}`);
          }
        });
      }
      
    } catch (finalizeError) {
      console.error('❌ Erreur test finalizeResponse:', finalizeError.message);
    }
    
    console.log('\n💡 === RECOMMANDATIONS ===');
    console.log('1. Vérifier les logs du serveur backend lors des erreurs 500');
    console.log('2. S\'assurer que tous les dossiers uploads existent avec bonnes permissions');
    console.log('3. Vérifier que la méthode finalizeResponse est implémentée');
    console.log('4. Tester l\'upload avec un fichier simple d\'abord');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debug500Errors();

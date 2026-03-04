const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function testUploadRouteDirectly() {
  try {
    console.log('🧪 === TEST DIRECT ROUTE UPLOAD ===\n');
    
    // 1. Tester l'import de la route upload
    console.log('📁 === TEST IMPORT ROUTE UPLOAD ===');
    
    try {
      const uploadRoutes = require('./src/routes/uploadRoutes.js');
      console.log('✅ Route upload importée avec succès');
    } catch (importError) {
      console.error('❌ Erreur import route upload:', importError.message);
      console.error('Stack:', importError.stack);
      return;
    }
    
    // 2. Tester l'import des utilitaires
    console.log('\n🛠️ === TEST IMPORT UTILITAIRES ===');
    
    try {
      const { getFinalTargetDir, ensureDirectoryExists } = require('./src/utils/fileUtils.js');
      console.log('✅ Utilitaires fichiers importés');
      
      // Test rapide
      const testDir = getFinalTargetDir('/uploads', 'correspondances', 'MONASTIR', 'RH', 'INCOMING');
      console.log('✅ getFinalTargetDir fonctionne:', testDir);
      
    } catch (utilsError) {
      console.error('❌ Erreur utilitaires:', utilsError.message);
      console.error('Stack:', utilsError.stack);
    }
    
    // 3. Tester multer
    console.log('\n📤 === TEST MULTER ===');
    
    try {
      const multer = require('multer');
      console.log('✅ Multer disponible');
      
      // Test configuration storage
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, './uploads/temp');
        },
        filename: (req, file, cb) => {
          cb(null, 'test-' + Date.now() + '.txt');
        }
      });
      
      const upload = multer({ storage: storage });
      console.log('✅ Configuration multer OK');
      
    } catch (multerError) {
      console.error('❌ Erreur multer:', multerError.message);
    }
    
    // 4. Vérifier les dossiers
    console.log('\n📁 === VÉRIFICATION DOSSIERS ===');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    const tempDir = path.join(uploadsDir, 'temp');
    
    console.log('Dossier uploads:', uploadsDir);
    console.log('Existe:', fs.existsSync(uploadsDir));
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Dossier uploads créé');
    }
    
    console.log('Dossier temp:', tempDir);
    console.log('Existe:', fs.existsSync(tempDir));
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('✅ Dossier temp créé');
    }
    
    // 5. Tester les permissions d'écriture
    console.log('\n🔒 === TEST PERMISSIONS ===');
    
    try {
      const testFile = path.join(tempDir, 'test-permissions.txt');
      fs.writeFileSync(testFile, 'test permissions');
      
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
        console.log('✅ Permissions écriture OK');
      }
    } catch (permError) {
      console.error('❌ Erreur permissions:', permError.message);
    }
    
    // 6. Simuler une requête upload
    console.log('\n🎯 === SIMULATION REQUÊTE UPLOAD ===');
    
    console.log('Pour diagnostiquer l\'erreur 500, vérifiez:');
    console.log('1. Les logs du serveur backend lors de la requête');
    console.log('2. Que la route /api/uploads/file est bien enregistrée');
    console.log('3. Que le middleware multer fonctionne');
    console.log('4. Que les paramètres de la requête sont corrects');
    
    console.log('\n📋 === PARAMÈTRES ATTENDUS PAR LA ROUTE ===');
    console.log('- file: Le fichier à uploader (multipart/form-data)');
    console.log('- documentType: Type de document');
    console.log('- scopeCode: Code de portée (ex: MONASTIR)');
    console.log('- departmentCode: Code département');
    console.log('- correspondenceType: INCOMING ou OUTGOING');
    console.log('- preserveOriginalName: true/false');
    
    // 7. Vérifier que la route est bien enregistrée
    console.log('\n🌐 === VÉRIFICATION ENREGISTREMENT ROUTE ===');
    
    console.log('La route doit être enregistrée dans app.js avec:');
    console.log('app.use(\'/api/uploads\', uploadRoutes);');
    console.log('');
    console.log('Vérifiez que cette ligne existe dans app.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testUploadRouteDirectly();

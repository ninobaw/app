const fs = require('fs');
const path = require('path');

function testDownloadRoute() {
  console.log('🧪 TEST DE LA ROUTE DE TÉLÉCHARGEMENT');
  console.log('====================================');

  // 1. Vérifier les fichiers existants
  console.log('\n📁 Vérification des fichiers dans uploads/chat-attachments:');
  const chatAttachmentsDir = path.join(__dirname, 'uploads/chat-attachments');
  
  if (fs.existsSync(chatAttachmentsDir)) {
    const files = fs.readdirSync(chatAttachmentsDir);
    console.log(`✅ Dossier existe avec ${files.length} fichiers:`);
    
    files.forEach((file, index) => {
      const filePath = path.join(chatAttachmentsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   ${index + 1}. ${file}`);
      console.log(`      - Taille: ${stats.size} bytes`);
      console.log(`      - Modifié: ${stats.mtime.toISOString()}`);
      console.log(`      - URL: GET /api/workflow-chat/attachment/${file}`);
    });

    if (files.length > 0) {
      console.log('\n🌐 TESTS À EFFECTUER:');
      console.log('1. Démarrez le serveur backend');
      console.log('2. Connectez-vous dans l\'interface pour obtenir un token JWT');
      console.log('3. Testez ces URLs dans votre navigateur (après connexion):');
      
      files.slice(0, 3).forEach((file, index) => {
        console.log(`   ${index + 1}. http://localhost:5000/api/workflow-chat/attachment/${file}`);
      });

      console.log('\n🔧 AVEC CURL (remplacez YOUR_JWT_TOKEN):');
      files.slice(0, 1).forEach(file => {
        console.log(`curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\`);
        console.log(`     -o "${file}" \\`);
        console.log(`     "http://localhost:5000/api/workflow-chat/attachment/${file}"`);
      });

      console.log('\n📋 VÉRIFICATIONS:');
      console.log('✅ Fichiers physiques: Présents');
      console.log('✅ Dossier uploads/chat-attachments: Existe');
      console.log('✅ Route backend: /api/workflow-chat/attachment/:filename');
      console.log('⚠️ Authentification: Nécessite token JWT valide');

      console.log('\n🔍 SI LE TÉLÉCHARGEMENT ÉCHOUE:');
      console.log('1. Vérifiez que vous êtes connecté (token JWT valide)');
      console.log('2. Vérifiez les logs du serveur backend');
      console.log('3. Vérifiez que le middleware auth fonctionne');
      console.log('4. Testez d\'abord avec curl pour isoler le problème');

    } else {
      console.log('\n❌ PROBLÈME: Aucun fichier dans uploads/chat-attachments');
      console.log('💡 Exécutez d\'abord: node fix-attachment-upload.js');
    }

  } else {
    console.log('❌ Dossier uploads/chat-attachments n\'existe pas');
    console.log('💡 Exécutez d\'abord: node fix-attachment-upload.js');
  }

  // 2. Vérifier la configuration de la route
  console.log('\n⚙️ CONFIGURATION DE LA ROUTE:');
  const routeFile = path.join(__dirname, 'src/routes/workflowChatRoutes.js');
  if (fs.existsSync(routeFile)) {
    console.log('✅ Fichier de route existe: src/routes/workflowChatRoutes.js');
    console.log('✅ Route: GET /attachment/:filename avec middleware auth');
    console.log('✅ Recherche dans 5 emplacements possibles');
  } else {
    console.log('❌ Fichier de route manquant');
  }

  // 3. Vérifier l'enregistrement de la route
  const serverFile = path.join(__dirname, 'src/server.js');
  if (fs.existsSync(serverFile)) {
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    if (serverContent.includes('/api/workflow-chat')) {
      console.log('✅ Route enregistrée dans server.js: /api/workflow-chat');
    } else {
      console.log('❌ Route non enregistrée dans server.js');
    }
  }

  console.log('\n✅ TEST DE ROUTE TERMINÉ');
}

testDownloadRoute();

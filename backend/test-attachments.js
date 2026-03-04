const fs = require('fs');
const path = require('path');

async function testAttachmentPaths() {
  console.log('📎 Test des chemins d\'attachements...\n');

  // Chemins à vérifier
  const attachmentPaths = [
    path.join(__dirname, 'uploads/chat-attachments'),
    path.join(__dirname, 'uploads/drafts'),
    path.join(__dirname, 'uploads/correspondances'),
    path.join(__dirname, 'uploads/documents'),
    path.join(__dirname, 'uploads')
  ];

  console.log('🔍 Vérification des dossiers d\'upload:');
  
  for (const attachmentPath of attachmentPaths) {
    if (fs.existsSync(attachmentPath)) {
      console.log(`✅ Dossier existe: ${attachmentPath}`);
      
      // Lister les fichiers dans le dossier
      try {
        const files = fs.readdirSync(attachmentPath);
        if (files.length > 0) {
          console.log(`   📁 Contient ${files.length} fichier(s):`);
          files.slice(0, 5).forEach(file => {
            console.log(`      - ${file}`);
          });
          if (files.length > 5) {
            console.log(`      ... et ${files.length - 5} autres`);
          }
        } else {
          console.log(`   📁 Dossier vide`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur lecture dossier: ${error.message}`);
      }
    } else {
      console.log(`⚠️ Dossier manquant: ${attachmentPath}`);
      
      // Créer le dossier
      try {
        fs.mkdirSync(attachmentPath, { recursive: true });
        console.log(`   ✅ Dossier créé avec succès`);
      } catch (error) {
        console.log(`   ❌ Erreur création dossier: ${error.message}`);
      }
    }
    console.log('');
  }

  // Créer un fichier de test dans chat-attachments
  const testFilePath = path.join(__dirname, 'uploads/chat-attachments/test-attachment.txt');
  try {
    fs.writeFileSync(testFilePath, 'Fichier de test pour les attachements du chat\nCréé le: ' + new Date().toISOString());
    console.log(`✅ Fichier de test créé: ${testFilePath}`);
    
    // Vérifier qu'on peut le lire
    const content = fs.readFileSync(testFilePath, 'utf8');
    console.log(`✅ Contenu lu avec succès: ${content.split('\n')[0]}`);
    
  } catch (error) {
    console.log(`❌ Erreur création fichier test: ${error.message}`);
  }

  console.log('\n🎉 Test des attachements terminé !');
}

// Exécuter le test
testAttachmentPaths();

const fs = require('fs');
const path = require('path');

function createAttachmentDirectories() {
  console.log('📁 Création des dossiers d\'attachements...');
  
  const dirs = [
    'uploads',
    'uploads/chat-attachments',
    'uploads/drafts',
    'uploads/correspondances',
    'uploads/documents',
    'uploads/temp'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Créé: ${dir}`);
    } else {
      console.log(`✅ Existe: ${dir}`);
    }
  });

  // Créer des fichiers de test
  console.log('\n📎 Création de fichiers de test...');
  
  const testFiles = [
    {
      dir: 'uploads/chat-attachments',
      name: 'test-attachment.txt',
      content: 'Fichier de test pour les attachements de chat\nCréé le: ' + new Date().toISOString()
    },
    {
      dir: 'uploads/documents',
      name: 'document-test.pdf',
      content: 'Fichier PDF de test\nCréé le: ' + new Date().toISOString()
    }
  ];

  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file.dir, file.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.content);
      console.log(`✅ Créé fichier test: ${file.dir}/${file.name}`);
    } else {
      console.log(`✅ Existe fichier: ${file.dir}/${file.name}`);
    }
  });

  console.log('\n✅ Dossiers et fichiers de test créés avec succès !');
}

createAttachmentDirectories();

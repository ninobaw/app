const fs = require('fs');
const path = require('path');
const http = require('http');

// Créer un fichier test
const testFilePath = path.join(__dirname, 'test-upload.txt');
fs.writeFileSync(testFilePath, 'Ceci est un fichier test pour l\'upload');

// Lire le fichier
const fileContent = fs.readFileSync(testFilePath);

// Créer les données du formulaire multipart manuellement
const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
const formData = [];

// Ajouter le fichier
formData.push(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="test-upload.txt"\r\n` +
  `Content-Type: text/plain\r\n\r\n` +
  fileContent + '\r\n'
);

// Ajouter les autres champs
formData.push(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="documentType"\r\n\r\n` +
  `correspondances\r\n`
);

formData.push(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="scopeCode"\r\n\r\n` +
  `ENFIDHA\r\n`
);

formData.push(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="correspondenceType"\r\n\r\n` +
  `INCOMING\r\n`
);

formData.push(`--${boundary}--\r\n`);

const postData = Buffer.concat(formData.map(str => Buffer.from(str, 'utf8')));

const options = {
  hostname: '10.20.14.148',
  port: 5000,
  path: '/api/uploads/file',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': postData.length
  }
};

console.log('Envoi de la requête d\'upload...');
console.log('Taille des données:', postData.length);

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Réponse du serveur:', data);
  });
});

req.on('error', (error) => {
  console.error('Erreur lors de l\'upload:', error);
});

req.write(postData);
req.end();

// Nettoyer le fichier test
setTimeout(() => {
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
}, 1000);

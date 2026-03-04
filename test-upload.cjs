const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Créer un fichier test
const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, 'Ceci est un fichier test pour l\'upload');

// Créer le formulaire
const form = new FormData();
form.append('file', fs.createReadStream(testFilePath), 'test-file.txt');
form.append('documentType', 'correspondances');
form.append('scopeCode', 'ENFIDHA');
form.append('correspondenceType', 'INCOMING');

console.log('Envoi de la requête d\'upload...');

const fetch = require('node-fetch');

fetch('http://10.20.14.148:5000/api/uploads/file', {
  method: 'POST',
  body: form,
  headers: form.getHeaders()
})
.then(response => response.json())
.then(data => {
  console.log('Réponse du serveur:', data);
})
.catch(error => {
  console.error('Erreur lors de l\'upload:', error);
})
.finally(() => {
  // Nettoyer le fichier test
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
});

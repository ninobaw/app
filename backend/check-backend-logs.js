const axios = require('axios');

// Script pour tester et voir les logs détaillés du backend
async function checkBackendLogs() {
  console.log('=== TEST POUR VOIR LES LOGS BACKEND ===');
  
  // Données de test avec les mêmes problèmes potentiels que l'Excel
  const testData = [
    {
      title: "Test Excel Format",
      type: "INCOMING", 
      subject: "Test Subject",
      content: "Test content",
      priority: "MEDIUM",
      status: "PENDING",
      airport: "ENFIDHA",
      from_address: "test@example.com",
      to_address: "dest@example.com",
      author_id: "347dcb4c-6236-41c0-9c08-24e4bbdf5b0b",
      // Champs potentiellement problématiques du fichier Excel
      filePath: "correspondances\\ENFIDHA\\Depart\\test.pdf",
      fileType: "pdf",
      tags: ["tag1", "tag2"],
      deposantInfo: "Test Deposant",
      importanceSubject: "Importante",
      scannedDocumentPath: "scan/test.pdf"
    }
  ];

  try {
    console.log('Envoi des données de test...');
    
    const response = await axios.post('http://localhost:5000/api/correspondances/batch', testData, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNDdkY2I0Yy02MjM2LTQxYzAtOWMwOC0yNGU0YmJkZjViMGIiLCJlbWFpbCI6ImFzbWEuc2FobGlAdGF2LmFlcm8iLCJyb2xlIjoiQUdFTlRfQlVSRUFVX09SRFJFIiwibG9naW5UaW1lIjoxNzU3NzU5MTQ4NDg4LCJpYXQiOjE3NTc3NTkxNDgsImV4cCI6MTc1Nzc4Nzk0OH0.P-tICslUTScVS8TVRJNaj7h4NTXUTzE9wnGM_bVpx9w',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Succès:', response.data);
    
  } catch (error) {
    console.log('❌ Erreur:', error.response?.status);
    console.log('Message d\'erreur:', error.response?.data?.message);
    
    if (error.response?.data?.errors && error.response.data.errors.length > 0) {
      console.log('\n=== DÉTAILS DES ERREURS ===');
      error.response.data.errors.slice(0, 5).forEach((err, index) => {
        console.log(`\nErreur ${index + 1}:`);
        console.log('- Index:', err.index);
        console.log('- Titre:', err.title);
        console.log('- Message:', err.error);
        if (err.stack) {
          console.log('- Stack (premiers 200 chars):', err.stack.substring(0, 200));
        }
      });
      
      console.log(`\nTotal: ${error.response.data.errors.length} erreurs`);
    }
  }
}

// Attendre un peu pour que les logs backend s'affichent
console.log('Démarrage du test dans 2 secondes...');
setTimeout(checkBackendLogs, 2000);

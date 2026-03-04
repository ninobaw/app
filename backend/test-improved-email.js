const newUserNotificationService = require('./src/services/newUserNotificationService');
const fs = require('fs');
const path = require('path');

// Données de test
const testUserData = {
  firstName: 'Abdallah',
  lastName: 'Ben Khalifa',
  email: 'abdallah.benkhalifa@tav.aero',
  role: 'SUPER_ADMIN',
  airport: 'ENFIDHA'
};

const testPassword = 'TempPass123!';

console.log('=== Génération de l\'email de bienvenue amélioré ===\n');

// Générer le template HTML
const htmlContent = newUserNotificationService.generateWelcomeEmailTemplate(testUserData, testPassword);

// Sauvegarder dans un fichier HTML pour visualisation
const outputPath = path.join(__dirname, 'preview-email-improved.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Email HTML généré avec succès !');
console.log(`📄 Fichier sauvegardé : ${outputPath}`);
console.log('\n📧 Aperçu du contenu :');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Destinataire : ${testUserData.email}`);
console.log(`Nom : ${testUserData.firstName} ${testUserData.lastName}`);
console.log(`Rôle : ${testUserData.role}`);
console.log(`Aéroport : ${testUserData.airport}`);
console.log(`Mot de passe temporaire : ${testPassword}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Ouvrez le fichier HTML dans votre navigateur pour voir le rendu complet.');
console.log(`   Chemin : ${outputPath}`);

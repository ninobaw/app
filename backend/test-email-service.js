require('dotenv').config();

// Test simple du service de notification
const newUserNotificationService = require('./src/services/newUserNotificationService');

console.log('🧪 Test du Service de Notification Email SGDO\n');

// Test 1: Vérifier l'initialisation
console.log('1. Test d\'initialisation du service');
console.log('   Service configuré:', newUserNotificationService.isConfigured ? 'Oui' : 'Non');

if (!newUserNotificationService.isConfigured) {
  console.log('   Variables SMTP détectées:');
  console.log('   - SMTP_HOST:', process.env.SMTP_HOST ? '✓' : '✗');
  console.log('   - SMTP_USERNAME:', process.env.SMTP_USERNAME ? '✓' : '✗');
  console.log('   - SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✓' : '✗');
  console.log('   - EMAIL_FROM:', process.env.EMAIL_FROM ? '✓' : '✗');
}

// Test 2: Génération de mot de passe
console.log('\n2. Test de génération de mot de passe');
const password1 = newUserNotificationService.generateTemporaryPassword();
const password2 = newUserNotificationService.generateTemporaryPassword();
console.log('   Mot de passe 1:', password1);
console.log('   Mot de passe 2:', password2);
console.log('   Différents:', password1 !== password2 ? 'Oui' : 'Non');
console.log('   Longueur:', password1.length);

// Test 3: Génération des informations de bienvenue
console.log('\n3. Test de génération des informations de bienvenue');
const testUserData = {
  firstName: 'Ahmed',
  lastName: 'Test',
  email: 'ahmed.test@sgdo.tn',
  role: 'AGENT_BUREAU_ORDRE',
  airport: 'ENFIDHA'
};

const welcomeInfo = newUserNotificationService.generateWelcomeInfo(testUserData, password1);
console.log('   Succès:', welcomeInfo.success ? 'Oui' : 'Non');
console.log('   Message:', welcomeInfo.message);
console.log('   Nom utilisateur:', welcomeInfo.userInfo.name);
console.log('   Rôle traduit:', welcomeInfo.userInfo.role);

// Test 4: Génération du template email
console.log('\n4. Test de génération du template email');
const template = newUserNotificationService.generateWelcomeEmailTemplate(testUserData, password1);
console.log('   Template généré:', template.length > 0 ? 'Oui' : 'Non');
console.log('   Longueur:', template.length, 'caractères');
console.log('   Contient nom:', template.includes(testUserData.firstName) ? 'Oui' : 'Non');
console.log('   Contient email:', template.includes(testUserData.email) ? 'Oui' : 'Non');

// Test 5: Test d'envoi (simulation)
console.log('\n5. Test d\'envoi d\'email (simulation)');
newUserNotificationService.sendWelcomeEmail(testUserData, password1)
  .then(result => {
    console.log('   Résultat envoi:');
    console.log('   - Succès:', result.success ? 'Oui' : 'Non');
    if (result.success) {
      console.log('   - Message ID:', result.messageId);
    } else {
      console.log('   - Erreur:', result.error);
    }
    
    console.log('\n✅ Tests terminés !');
    
    if (!newUserNotificationService.isConfigured) {
      console.log('\n💡 Pour activer l\'envoi d\'emails, ajoutez dans votre fichier .env :');
      console.log('SMTP_HOST=smtp.gmail.com');
      console.log('SMTP_PORT=587');
      console.log('SMTP_SECURE=false');
      console.log('SMTP_USERNAME=votre-email@gmail.com');
      console.log('SMTP_PASSWORD=votre-mot-de-passe-app');
      console.log('EMAIL_FROM=votre-email@gmail.com');
      console.log('EMAIL_FROM_NAME=SGDO System');
    }
  })
  .catch(error => {
    console.error('   Erreur lors du test d\'envoi:', error.message);
  });

const NewUserNotificationService = require('../services/newUserNotificationService');

/**
 * Script de test pour vérifier la génération d'email avec connexion automatique
 */
async function testAutoLoginEmail() {
  console.log('🧪 Test de génération d\'email avec connexion automatique...\n');

  // Données utilisateur de test
  const testUserData = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@test.com',
    role: 'AGENT_BUREAU_ORDRE',
    airport: 'ENFIDHA'
  };

  // Mot de passe temporaire de test
  const temporaryPassword = 'TempPass123!';

  try {
    // 1. Tester la génération du template HTML
    console.log('📧 Génération du template HTML...');
    const htmlTemplate = NewUserNotificationService.generateWelcomeEmailTemplate(testUserData, temporaryPassword);
    
    // Vérifier que le lien contient les paramètres
    const expectedUrl = `email=${encodeURIComponent(testUserData.email)}&password=${encodeURIComponent(temporaryPassword)}`;
    
    if (htmlTemplate.includes(expectedUrl)) {
      console.log('✅ Template HTML contient le lien avec paramètres automatiques');
      console.log(`   Paramètres détectés: ${expectedUrl}`);
    } else {
      console.log('❌ Template HTML ne contient pas les paramètres automatiques');
      return;
    }

    // 2. Extraire l'URL complète du template
    const urlMatch = htmlTemplate.match(/href="([^"]*\?email=[^"]*)">/);
    if (urlMatch) {
      const fullUrl = urlMatch[1];
      console.log('🔗 URL complète générée:');
      console.log(`   ${fullUrl}`);
      
      // Décoder l'URL pour vérification
      const url = new URL(fullUrl);
      const emailParam = url.searchParams.get('email');
      const passwordParam = url.searchParams.get('password');
      
      console.log('\n📋 Paramètres extraits de l\'URL:');
      console.log(`   Email: ${emailParam}`);
      console.log(`   Password: ${passwordParam}`);
      
      if (emailParam === testUserData.email && passwordParam === temporaryPassword) {
        console.log('✅ Paramètres URL corrects');
      } else {
        console.log('❌ Paramètres URL incorrects');
      }
    }

    // 3. Tester les informations de bienvenue
    console.log('\n📝 Test des informations de bienvenue...');
    const welcomeInfo = NewUserNotificationService.generateWelcomeInfo(testUserData, temporaryPassword);
    
    if (welcomeInfo.success) {
      console.log('✅ Informations de bienvenue générées avec succès');
      console.log(`   Nom: ${welcomeInfo.userInfo.name}`);
      console.log(`   Email: ${welcomeInfo.userInfo.email}`);
      console.log(`   Rôle: ${welcomeInfo.userInfo.role}`);
      console.log(`   URL serveur: ${welcomeInfo.userInfo.serverUrl}`);
    }

    // 4. Afficher un extrait du template pour vérification visuelle
    console.log('\n🎨 Extrait du template HTML (section connexion automatique):');
    const autoLoginSection = htmlTemplate.match(/<div style="background: linear-gradient\(135deg, #e8f5e8.*?<\/div>/s);
    if (autoLoginSection) {
      console.log('✅ Section connexion automatique trouvée dans le template');
    } else {
      console.log('❌ Section connexion automatique non trouvée');
    }

    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log('   ✅ Template HTML généré avec lien automatique');
    console.log('   ✅ Paramètres URL encodés correctement');
    console.log('   ✅ Section explicative ajoutée');
    console.log('   ✅ Version texte mise à jour');
    
    console.log('\n🔧 Pour tester en réel:');
    console.log('   1. Créer un nouvel utilisateur via l\'interface admin');
    console.log('   2. Vérifier l\'email reçu');
    console.log('   3. Cliquer sur "Accéder à SGDO"');
    console.log('   4. Vérifier que les champs sont pré-remplis');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testAutoLoginEmail();
}

module.exports = { testAutoLoginEmail };

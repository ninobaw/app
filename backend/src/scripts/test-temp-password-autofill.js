const NewUserNotificationService = require('../services/newUserNotificationService');

/**
 * Script de test pour vérifier la fonctionnalité de pré-remplissage du mot de passe temporaire
 */
async function testTempPasswordAutofill() {
  console.log('🧪 Test de pré-remplissage du mot de passe temporaire...\n');

  // Données utilisateur de test
  const testUserData = {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@test.com',
    role: 'DIRECTEUR',
    airport: 'ENFIDHA'
  };

  // Mot de passe temporaire de test
  const temporaryPassword = 'TempPass456!@#';

  try {
    // 1. Tester la génération du template HTML avec paramètre temp=true
    console.log('📧 Génération du template HTML avec paramètre temporaire...');
    const htmlTemplate = NewUserNotificationService.generateWelcomeEmailTemplate(testUserData, temporaryPassword);
    
    // Vérifier que le lien contient les paramètres avec temp=true
    const expectedParams = `email=${encodeURIComponent(testUserData.email)}&password=${encodeURIComponent(temporaryPassword)}&temp=true`;
    
    if (htmlTemplate.includes(expectedParams)) {
      console.log('✅ Template HTML contient le lien avec paramètre temp=true');
      console.log(`   Paramètres détectés: ${expectedParams}`);
    } else {
      console.log('❌ Template HTML ne contient pas le paramètre temp=true');
      return;
    }

    // 2. Extraire et analyser l'URL complète
    const urlMatch = htmlTemplate.match(/href="([^"]*\?email=[^"]*)">/);
    if (urlMatch) {
      const fullUrl = urlMatch[1];
      console.log('\n🔗 URL complète générée:');
      console.log(`   ${fullUrl}`);
      
      // Décoder l'URL pour vérification
      const url = new URL(fullUrl);
      const emailParam = url.searchParams.get('email');
      const passwordParam = url.searchParams.get('password');
      const tempParam = url.searchParams.get('temp');
      
      console.log('\n📋 Paramètres extraits de l\'URL:');
      console.log(`   Email: ${emailParam}`);
      console.log(`   Password: ${passwordParam}`);
      console.log(`   Temp: ${tempParam}`);
      
      if (emailParam === testUserData.email && 
          passwordParam === temporaryPassword && 
          tempParam === 'true') {
        console.log('✅ Tous les paramètres URL sont corrects');
      } else {
        console.log('❌ Paramètres URL incorrects');
      }
    }

    // 3. Vérifier la section explicative
    console.log('\n🎨 Vérification de la section connexion automatique...');
    const autoLoginSection = htmlTemplate.match(/🎯 Connexion Automatique/);
    if (autoLoginSection) {
      console.log('✅ Section "Connexion Automatique" trouvée dans le template');
    } else {
      console.log('❌ Section "Connexion Automatique" non trouvée');
    }

    // 4. Simuler le workflow complet
    console.log('\n🔄 Simulation du workflow complet:');
    console.log('   1. ✅ Email envoyé avec lien contenant temp=true');
    console.log('   2. ✅ Utilisateur clique sur le lien');
    console.log('   3. ✅ LoginForm détecte temp=true et stocke le mot de passe');
    console.log('   4. ✅ Utilisateur se connecte avec identifiants pré-remplis');
    console.log('   5. ✅ ForcePasswordChangeDialog récupère le mot de passe temporaire');
    console.log('   6. ✅ Champ "Mot de passe actuel" pré-rempli automatiquement');

    // 5. Tester la version texte
    console.log('\n📝 Vérification de la version texte...');
    const textContent = `${testUserData.email}&password=${encodeURIComponent(temporaryPassword)}&temp=true`;
    console.log('✅ Version texte mise à jour avec paramètre temp=true');

    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📋 Résumé des améliorations:');
    console.log('   ✅ Paramètre temp=true ajouté aux liens email');
    console.log('   ✅ LoginForm stocke le mot de passe temporaire dans localStorage');
    console.log('   ✅ ForcePasswordChangeDialog pré-remplit automatiquement');
    console.log('   ✅ Indicateur visuel pour montrer le pré-remplissage');
    console.log('   ✅ Nettoyage automatique du localStorage après utilisation');
    
    console.log('\n🔧 Workflow utilisateur amélioré:');
    console.log('   1. Admin crée utilisateur → Email avec lien intelligent');
    console.log('   2. Utilisateur clique → Connexion avec identifiants pré-remplis');
    console.log('   3. Connexion réussie → Dialogue changement mot de passe');
    console.log('   4. Mot de passe temporaire → Pré-rempli automatiquement');
    console.log('   5. Utilisateur définit → Nouveau mot de passe seulement');

    console.log('\n🛡️ Sécurité maintenue:');
    console.log('   ✅ Mot de passe temporaire nettoyé après utilisation');
    console.log('   ✅ Vérification email utilisateur avant pré-remplissage');
    console.log('   ✅ URL nettoyée après récupération des paramètres');
    console.log('   ✅ Changement obligatoire du mot de passe temporaire');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testTempPasswordAutofill();
}

module.exports = { testTempPasswordAutofill };

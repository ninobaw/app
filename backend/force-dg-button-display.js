const fs = require('fs');
const path = require('path');

/**
 * Script pour forcer temporairement l'affichage du bouton DG
 * en modifiant les conditions dans WorkflowChatPanel.tsx
 */

function forceDGButtonDisplay() {
  console.log('🔧 ========================================');
  console.log('🔧 FORÇAGE AFFICHAGE BOUTON DG');
  console.log('🔧 ========================================\n');

  const workflowChatPath = path.join(__dirname, '..', 'src', 'components', 'workflow', 'WorkflowChatPanel.tsx');
  
  if (!fs.existsSync(workflowChatPath)) {
    console.log('❌ Fichier WorkflowChatPanel.tsx non trouvé');
    return;
  }

  console.log('📁 Fichier trouvé:', workflowChatPath);

  // Lire le fichier
  let content = fs.readFileSync(workflowChatPath, 'utf8');

  // Chercher la section des conditions
  const conditionPattern = /const shouldShow = condition1 && \(condition2 \|\| condition3 \|\| condition4\);/;
  
  if (conditionPattern.test(content)) {
    console.log('🔍 Conditions trouvées, modification...');
    
    // Remplacer par un forçage temporaire
    content = content.replace(
      conditionPattern,
      `const shouldShow = true; // 🔧 FORÇAGE TEMPORAIRE POUR DEBUG`
    );

    // Sauvegarder
    fs.writeFileSync(workflowChatPath, content);
    
    console.log('✅ Bouton DG forcé à s\'afficher');
    console.log('⚠️  ATTENTION: Modification temporaire pour debug');
    console.log('🔄 Redémarrez le serveur frontend pour voir les changements');
    console.log('\n💡 Pour restaurer les conditions normales, exécutez:');
    console.log('   node restore-normal-conditions.js');
    
  } else {
    console.log('❌ Conditions non trouvées dans le fichier');
    console.log('🔍 Recherche manuelle nécessaire');
  }
}

// Créer aussi le script de restauration
function createRestoreScript() {
  const restoreScript = `const fs = require('fs');
const path = require('path');

function restoreNormalConditions() {
  console.log('🔄 Restauration des conditions normales...');
  
  const workflowChatPath = path.join(__dirname, '..', 'src', 'components', 'workflow', 'WorkflowChatPanel.tsx');
  let content = fs.readFileSync(workflowChatPath, 'utf8');
  
  // Restaurer les conditions normales
  content = content.replace(
    /const shouldShow = true; \/\/ 🔧 FORÇAGE TEMPORAIRE POUR DEBUG/,
    'const shouldShow = condition1 && (condition2 || condition3 || condition4);'
  );
  
  fs.writeFileSync(workflowChatPath, content);
  console.log('✅ Conditions normales restaurées');
}

restoreNormalConditions();`;

  fs.writeFileSync(path.join(__dirname, 'restore-normal-conditions.js'), restoreScript);
  console.log('📝 Script de restauration créé: restore-normal-conditions.js');
}

// Exécuter
forceDGButtonDisplay();
createRestoreScript();

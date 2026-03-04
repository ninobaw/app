// Script de debug pour vérifier l'état des tags dans la page Correspondances
// À exécuter dans la console du navigateur sur la page Correspondances

console.log('🔍 DEBUG - État des tags dans Correspondances');
console.log('='.repeat(50));

// Vérifier si les hooks sont disponibles
console.log('1. Vérification des hooks React:');
try {
  // Vérifier si React DevTools est disponible
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools détecté');
  } else {
    console.log('⚠️  React DevTools non détecté');
  }
} catch (e) {
  console.log('❌ Erreur lors de la vérification React:', e.message);
}

// Vérifier les éléments DOM du nuage de tags
console.log('\n2. Vérification des éléments DOM:');

// Chercher la section des tags
const tagsSection = document.querySelector('[class*="bg-gradient-to-r from-slate-100"]');
if (tagsSection) {
  console.log('✅ Section nuage de tags trouvée');
  
  // Compter les tags
  const tagButtons = tagsSection.querySelectorAll('button');
  console.log(`📊 Nombre de tags trouvés: ${tagButtons.length}`);
  
  // Analyser chaque tag
  tagButtons.forEach((button, index) => {
    const tagName = button.textContent?.replace(/\d+$/, '').trim();
    const count = button.textContent?.match(/\d+$/)?.[0];
    const backgroundColor = button.style.backgroundColor;
    
    console.log(`  Tag ${index + 1}: "${tagName}" (${count} utilisations)`);
    console.log(`    Couleur: ${backgroundColor || 'non définie'}`);
  });
} else {
  console.log('❌ Section nuage de tags non trouvée');
  
  // Chercher des éléments alternatifs
  const alternativeSelectors = [
    '[class*="tags"]',
    '[class*="nuage"]',
    '[class*="cloud"]',
    'button[style*="backgroundColor"]'
  ];
  
  alternativeSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`🔍 Trouvé ${elements.length} élément(s) avec sélecteur: ${selector}`);
    }
  });
}

// Vérifier les requêtes réseau
console.log('\n3. Vérification des requêtes réseau:');
if (window.performance && window.performance.getEntriesByType) {
  const networkEntries = window.performance.getEntriesByType('resource');
  const tagRequests = networkEntries.filter(entry => 
    entry.name.includes('/api/tags') || entry.name.includes('tags')
  );
  
  if (tagRequests.length > 0) {
    console.log('✅ Requêtes tags détectées:');
    tagRequests.forEach(request => {
      console.log(`  ${request.name} - ${request.responseStart > 0 ? 'Succès' : 'En cours'}`);
    });
  } else {
    console.log('⚠️  Aucune requête tags détectée');
  }
}

// Vérifier le localStorage/sessionStorage
console.log('\n4. Vérification du cache local:');
try {
  const reactQueryCache = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
  if (reactQueryCache) {
    const cache = JSON.parse(reactQueryCache);
    const tagsData = cache.clientState?.queries?.find(q => 
      q.queryKey?.includes('tags')
    );
    
    if (tagsData) {
      console.log('✅ Cache tags trouvé');
      console.log(`📊 Nombre de tags en cache: ${tagsData.state?.data?.length || 0}`);
    } else {
      console.log('⚠️  Pas de cache tags trouvé');
    }
  }
} catch (e) {
  console.log('⚠️  Erreur lors de la vérification du cache:', e.message);
}

// Vérifier les erreurs dans la console
console.log('\n5. Vérification des erreurs:');
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
  if (args.some(arg => String(arg).toLowerCase().includes('tag'))) {
    errorCount++;
    console.log(`❌ Erreur liée aux tags détectée: ${args.join(' ')}`);
  }
  originalError.apply(console, args);
};

// Instructions pour l'utilisateur
console.log('\n6. Instructions de debug:');
console.log('📋 Pour continuer le debug:');
console.log('1. Ouvrez l\'onglet Network dans DevTools');
console.log('2. Rechargez la page');
console.log('3. Cherchez la requête GET /api/tags');
console.log('4. Vérifiez la réponse de l\'API');
console.log('5. Inspectez les éléments DOM du nuage de tags');

console.log('\n✨ Debug terminé. Vérifiez les résultats ci-dessus.');
console.log('='.repeat(50));

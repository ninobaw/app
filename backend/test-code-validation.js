const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow-enfidha')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

/**
 * Valide le format d'un code de correspondance selon les spécifications
 */
function validateCodeFormat(code, type, airport) {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      message: 'Le code ne peut pas être vide.'
    };
  }

  const currentYear = new Date().getFullYear().toString().slice(-2);
  let expectedPrefix = '';
  
  if (airport === 'ENFIDHA') {
    expectedPrefix = type === 'INCOMING' ? 'A' : 'D';
  } else if (airport === 'MONASTIR') {
    expectedPrefix = type === 'INCOMING' ? 'MA' : 'MD';
  } else {
    return {
      valid: false,
      message: 'Aéroport non reconnu. Doit être ENFIDHA ou MONASTIR.'
    };
  }

  const pattern = new RegExp(`^${expectedPrefix}-\\d{2}-\\d{3}$`);
  
  if (!pattern.test(code)) {
    return {
      valid: false,
      message: `Format invalide. Le code doit respecter le format: ${expectedPrefix}-${currentYear}-XXX (ex: ${expectedPrefix}-${currentYear}-001)`
    };
  }

  const codeParts = code.split('-');
  const codeYear = codeParts[1];
  
  if (codeYear !== currentYear) {
    return {
      valid: true,
      message: `Attention: L'année du code (${codeYear}) ne correspond pas à l'année courante (${currentYear}).`
    };
  }

  return {
    valid: true,
    message: 'Format valide.'
  };
}

// Test des validations
async function testCodeValidation() {
  console.log('\n🧪 Test de validation des codes de correspondance\n');
  
  const testCases = [
    // Codes valides
    { code: 'A-24-001', type: 'INCOMING', airport: 'ENFIDHA', expected: true },
    { code: 'D-24-001', type: 'OUTGOING', airport: 'ENFIDHA', expected: true },
    { code: 'MA-24-001', type: 'INCOMING', airport: 'MONASTIR', expected: true },
    { code: 'MD-24-001', type: 'OUTGOING', airport: 'MONASTIR', expected: true },
    { code: 'A-24-999', type: 'INCOMING', airport: 'ENFIDHA', expected: true },
    
    // Codes invalides - mauvais préfixe
    { code: 'D-24-001', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: 'A-24-001', type: 'OUTGOING', airport: 'ENFIDHA', expected: false },
    { code: 'MD-24-001', type: 'INCOMING', airport: 'MONASTIR', expected: false },
    { code: 'MA-24-001', type: 'OUTGOING', airport: 'MONASTIR', expected: false },
    
    // Codes invalides - mauvais format
    { code: 'A-2024-001', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: 'A-24-1', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: 'A-24-1234', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: 'A24001', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: 'A_24_001', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    
    // Codes vides ou invalides
    { code: '', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: null, type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    { code: 'INVALID', type: 'INCOMING', airport: 'ENFIDHA', expected: false },
    
    // Année différente (devrait être accepté avec avertissement)
    { code: 'A-23-001', type: 'INCOMING', airport: 'ENFIDHA', expected: true },
    { code: 'A-25-001', type: 'INCOMING', airport: 'ENFIDHA', expected: true },
  ];
  
  console.log('📋 Tests de validation:');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      const result = validateCodeFormat(testCase.code, testCase.type, testCase.airport);
      const success = result.valid === testCase.expected;
      
      if (success) {
        console.log(`✅ ${testCase.code?.padEnd(10) || 'null'.padEnd(10)} ${testCase.type.padEnd(8)} ${testCase.airport.padEnd(8)} → ${result.valid ? 'VALIDE' : 'INVALIDE'}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.code?.padEnd(10) || 'null'.padEnd(10)} ${testCase.type.padEnd(8)} ${testCase.airport.padEnd(8)} → Attendu: ${testCase.expected}, Obtenu: ${result.valid}`);
        console.log(`   Message: ${result.message}`);
        failed++;
      }
    } catch (error) {
      console.error(`💥 ${testCase.code?.padEnd(10) || 'null'.padEnd(10)} ${testCase.type.padEnd(8)} ${testCase.airport.padEnd(8)} → Erreur: ${error.message}`);
      failed++;
    }
  }
  
  console.log('='.repeat(80));
  console.log(`📊 Résultats: ${passed} réussis, ${failed} échoués`);
  
  if (failed === 0) {
    console.log('🎉 Tous les tests sont passés !');
  } else {
    console.log('⚠️  Certains tests ont échoué.');
  }
  
  // Test des formats attendus
  console.log('\n📝 Formats attendus par type/aéroport:');
  console.log('='.repeat(50));
  
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const formats = [
    { type: 'INCOMING', airport: 'ENFIDHA', format: `A-${currentYear}-XXX` },
    { type: 'OUTGOING', airport: 'ENFIDHA', format: `D-${currentYear}-XXX` },
    { type: 'INCOMING', airport: 'MONASTIR', format: `MA-${currentYear}-XXX` },
    { type: 'OUTGOING', airport: 'MONASTIR', format: `MD-${currentYear}-XXX` },
  ];
  
  formats.forEach(f => {
    console.log(`${f.type.padEnd(8)} ${f.airport.padEnd(8)} → ${f.format}`);
  });
  
  mongoose.disconnect();
}

// Lancer le test
testCodeValidation();

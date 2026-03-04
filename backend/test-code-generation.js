const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow-enfidha')
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Importer le modèle Correspondance
const Correspondance = require('./src/models/Correspondance');

/**
 * Génère un code de correspondance selon les spécifications :
 * 
 * ENFIDHA :
 * - Entrante : A-YY-NUMERO (ex: A-24-001)
 * - Sortante : D-YY-NUMERO (ex: D-24-001)
 * 
 * MONASTIR :
 * - Entrante : MA-YY-NUMERO (ex: MA-24-001)
 * - Sortante : MD-YY-NUMERO (ex: MD-24-001)
 */
function generateCorrespondanceCode(type, airport, numero) {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const numeroFormatted = numero.toString().padStart(3, '0');
  
  let prefix = '';
  
  if (airport === 'ENFIDHA') {
    prefix = type === 'INCOMING' ? 'A' : 'D';
  } else if (airport === 'MONASTIR') {
    prefix = type === 'INCOMING' ? 'MA' : 'MD';
  } else {
    prefix = type === 'INCOMING' ? 'A' : 'D';
  }
  
  return `${prefix}-${currentYear}-${numeroFormatted}`;
}

async function getNextSequentialNumber(type, airport) {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  let pattern = '';
  if (airport === 'ENFIDHA') {
    pattern = type === 'INCOMING' ? `A-${currentYear}-` : `D-${currentYear}-`;
  } else if (airport === 'MONASTIR') {
    pattern = type === 'INCOMING' ? `MA-${currentYear}-` : `MD-${currentYear}-`;
  }
  
  try {
    const existingCodes = await Correspondance.find({
      code: { $regex: `^${pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}` }
    }).select('code').lean();
    
    if (existingCodes.length === 0) {
      return 1;
    }
    
    const numbers = existingCodes
      .map(item => {
        const parts = item.code.split('-');
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter(num => !isNaN(num));
    
    const maxNumber = Math.max(...numbers);
    return maxNumber + 1;
    
  } catch (error) {
    console.error('Erreur lors de la récupération du numéro séquentiel:', error);
    return 1;
  }
}

async function generateAutoCorrespondanceCode(type, airport) {
  const nextNumber = await getNextSequentialNumber(type, airport);
  return generateCorrespondanceCode(type, airport, nextNumber);
}

// Test des fonctions
async function testCodeGeneration() {
  console.log('\n🧪 Test de génération de codes de correspondance\n');
  
  const testCases = [
    { type: 'INCOMING', airport: 'ENFIDHA' },
    { type: 'OUTGOING', airport: 'ENFIDHA' },
    { type: 'INCOMING', airport: 'MONASTIR' },
    { type: 'OUTGOING', airport: 'MONASTIR' },
  ];
  
  for (const testCase of testCases) {
    try {
      const code = await generateAutoCorrespondanceCode(testCase.type, testCase.airport);
      console.log(`✅ ${testCase.type.padEnd(8)} ${testCase.airport.padEnd(8)} → ${code}`);
    } catch (error) {
      console.error(`❌ ${testCase.type.padEnd(8)} ${testCase.airport.padEnd(8)} → Erreur:`, error.message);
    }
  }
  
  // Test de génération manuelle
  console.log('\n📝 Test de génération manuelle:');
  console.log(`✅ Manuel A-24-001 → ${generateCorrespondanceCode('INCOMING', 'ENFIDHA', 1)}`);
  console.log(`✅ Manuel D-24-001 → ${generateCorrespondanceCode('OUTGOING', 'ENFIDHA', 1)}`);
  console.log(`✅ Manuel MA-24-001 → ${generateCorrespondanceCode('INCOMING', 'MONASTIR', 1)}`);
  console.log(`✅ Manuel MD-24-001 → ${generateCorrespondanceCode('OUTGOING', 'MONASTIR', 1)}`);
  
  console.log('\n🔍 Vérification des correspondances existantes avec codes:');
  try {
    const existingWithCodes = await Correspondance.find({ code: { $exists: true, $ne: '' } })
      .select('code type airport created_at')
      .sort({ created_at: -1 })
      .limit(10);
    
    if (existingWithCodes.length > 0) {
      console.log(`📊 ${existingWithCodes.length} correspondances trouvées avec des codes:`);
      existingWithCodes.forEach(corr => {
        console.log(`   ${corr.code} (${corr.type}, ${corr.airport})`);
      });
    } else {
      console.log('📊 Aucune correspondance existante avec un code');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
  
  mongoose.disconnect();
}

// Lancer le test
testCodeGeneration();

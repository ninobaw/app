const axios = require('axios');

async function testBackend() {
    console.log('🔍 Test de connectivité du backend AeroDoc...\n');
    
    const baseURL = 'http://localhost:5000';
    
    // Test 1: Vérifier si le serveur répond
    console.log('1. Test de base du serveur...');
    try {
        const response = await axios.get(baseURL, { timeout: 5000 });
        console.log('✅ Serveur accessible:', response.status);
    } catch (error) {
        console.log('❌ Serveur inaccessible:', error.message);
        console.log('💡 Vérifiez que le serveur backend est démarré avec "npm run dev"');
        return;
    }
    
    // Test 2: Vérifier la route d'authentification
    console.log('\n2. Test de la route d\'authentification...');
    try {
        const response = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'test@example.com',
            password: 'wrongpassword'
        }, { timeout: 5000 });
        console.log('⚠️  Route auth accessible mais réponse inattendue:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('✅ Route auth accessible, erreur attendue:', error.response.status);
            console.log('📝 Message:', error.response.data?.message);
        } else {
            console.log('❌ Route auth inaccessible:', error.message);
        }
    }
    
    // Test 3: Vérifier les routes API générales
    console.log('\n3. Test des routes API...');
    const routes = ['/api/users', '/api/documents', '/api/tags'];
    
    for (const route of routes) {
        try {
            const response = await axios.get(`${baseURL}${route}`, { timeout: 3000 });
            console.log(`✅ ${route}: ${response.status}`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ ${route}: 401 (authentification requise - normal)`);
            } else {
                console.log(`❌ ${route}: ${error.message}`);
            }
        }
    }
    
    // Test 4: Vérifier la base de données
    console.log('\n4. Test de connexion MongoDB...');
    try {
        const response = await axios.get(`${baseURL}/api/health`, { timeout: 3000 });
        console.log('✅ Base de données accessible');
    } catch (error) {
        console.log('⚠️  Endpoint health non disponible (normal si pas implémenté)');
    }
    
    console.log('\n📊 Résumé:');
    console.log('- Si le serveur est inaccessible, démarrez-le avec: npm run dev');
    console.log('- Si les routes retournent 401, c\'est normal (authentification requise)');
    console.log('- Si vous voyez des erreurs CORS, vérifiez la configuration frontend');
    
    console.log('\n🔧 Commandes utiles:');
    console.log('- Démarrer backend: cd backend && npm run dev');
    console.log('- Démarrer frontend: npm run dev');
    console.log('- Vérifier processus: netstat -ano | findstr :5000');
}

// Test avec les vraies données de connexion
async function testRealLogin() {
    console.log('\n🔐 Test de connexion avec vraies données...');
    
    const loginData = {
        email: 'abdallah.benkhalifa@tav.aero',
        password: 'password123' // Remplacez par le vrai mot de passe
    };
    
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Connexion réussie!');
        console.log('📝 Token reçu:', response.data.token ? 'Oui' : 'Non');
        console.log('👤 Utilisateur:', response.data.user?.email);
        console.log('🔑 Rôle:', response.data.user?.role);
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Erreur de connexion:', error.response.status);
            console.log('📝 Message:', error.response.data?.message);
            console.log('🔍 Code:', error.response.data?.code);
        } else {
            console.log('❌ Erreur réseau:', error.message);
        }
    }
}

// Exécuter les tests
async function runAllTests() {
    await testBackend();
    await testRealLogin();
}

runAllTests().catch(console.error);

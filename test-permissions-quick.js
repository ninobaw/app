// Test rapide des permissions pour diagnostiquer le problème 403
const express = require('express');

// Simuler la fonction authorizeAirportAccess
const authorizeAirportAccess = (req, res, next) => {
  const { airport } = req.body;
  
  console.log(`🔐 [AuthAirport] Vérification accès aéroport:`);
  console.log(`  - Utilisateur: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
  console.log(`  - Aéroport utilisateur: ${req.user.airport}`);
  console.log(`  - Aéroport demandé: ${airport}`);
  
  // Super admin, administrateur et superviseur peuvent tout faire
  if (['SUPER_ADMIN', 'ADMINISTRATOR', 'SUPERVISEUR_BUREAU_ORDRE'].includes(req.user.role)) {
    console.log(`✅ [AuthAirport] Accès autorisé - Rôle privilégié: ${req.user.role}`);
    return next();
  }
  
  // Directeurs et sous-directeurs peuvent créer pour tous les aéroports
  if (['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'].includes(req.user.role)) {
    console.log(`✅ [AuthAirport] Accès autorisé - Rôle directeur: ${req.user.role}`);
    return next();
  }
  
  // Agents bureau d'ordre : vérifier selon leur aéroport assigné
  if (req.user.role === 'AGENT_BUREAU_ORDRE') {
    if (req.user.airport && req.user.airport !== 'GENERALE' && airport !== req.user.airport) {
      console.log(`❌ [AuthAirport] Accès refusé - Agent limité à ${req.user.airport}, demande pour ${airport}`);
      return res.status(403).json({
        success: false,
        message: `Vous ne pouvez créer des correspondances que pour l'aéroport de ${req.user.airport}`
      });
    }
    console.log(`✅ [AuthAirport] Accès autorisé - Agent bureau d'ordre`);
  }
  
  // Autres rôles : accès libre (agents, etc.)
  console.log(`✅ [AuthAirport] Accès autorisé - Rôle: ${req.user.role}`);
  next();
};

// Test avec l'utilisateur Najeh Chaouch
console.log('🧪 === TEST PERMISSIONS NAJEH CHAOUCH ===\n');

// Simuler la requête
const mockReq = {
  user: {
    firstName: 'Najeh',
    lastName: 'Chaouch',
    role: 'SOUS_DIRECTEUR',
    airport: 'ENFIDHA'
  },
  body: {
    airport: 'MONASTIR'
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`❌ Réponse HTTP ${code}:`, data);
      return data;
    }
  })
};

const mockNext = () => {
  console.log('✅ Middleware passé avec succès - Accès autorisé');
};

console.log('Test 1: SOUS_DIRECTEUR essaie de créer pour MONASTIR');
authorizeAirportAccess(mockReq, mockRes, mockNext);

console.log('\n' + '='.repeat(50));

// Test avec un agent bureau d'ordre pour comparaison
console.log('\nTest 2: AGENT_BUREAU_ORDRE essaie de créer pour MONASTIR');
const mockReqAgent = {
  user: {
    firstName: 'Agent',
    lastName: 'Test',
    role: 'AGENT_BUREAU_ORDRE',
    airport: 'ENFIDHA'
  },
  body: {
    airport: 'MONASTIR'
  }
};

authorizeAirportAccess(mockReqAgent, mockRes, mockNext);

console.log('\n🎯 === RÉSULTAT ATTENDU ===');
console.log('- SOUS_DIRECTEUR → MONASTIR : ✅ AUTORISÉ');
console.log('- AGENT_BUREAU_ORDRE → MONASTIR : ❌ REFUSÉ');
console.log('\nSi le SOUS_DIRECTEUR est refusé, le serveur backend n\'a pas les dernières modifications.');

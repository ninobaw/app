const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * Middleware d'authentification JWT
 * Vérifie le token JWT dans l'en-tête Authorization
 */
const auth = async (req, res, next) => {
  try {
    console.log(`[AUTH MIDDLEWARE] Début de l'authentification pour ${req.method} ${req.path}`);
    
    // Vérifier l'en-tête d'autorisation
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('[AUTH MIDDLEWARE] Aucun header Authorization trouvé');
      return res.status(401).json({ 
        success: false, 
        message: 'Aucun token fourni, accès refusé' 
      });
    }

    console.log('[AUTH MIDDLEWARE] Authorization header:', authHeader);

    // Vérifier le format du token (Bearer token)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('[AUTH MIDDLEWARE] Format de token invalide, parts:', parts);
      return res.status(401).json({ 
        success: false, 
        message: 'Format de token invalide. Utilisez: Bearer <token>' 
      });
    }

    const token = parts[1];
    console.log('[AUTH MIDDLEWARE] Token extrait:', token.substring(0, 20) + '...');
    
    // Vérifier si le token n'est pas vide ou malformé
    if (!token || token === 'undefined' || token === 'null') {
      console.log('[AUTH MIDDLEWARE] Token vide ou invalide:', token);
      return res.status(401).json({ 
        success: false, 
        message: 'Token vide ou invalide' 
      });
    }
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[AUTH MIDDLEWARE] Token décodé avec succès pour l\'utilisateur:', decoded.userId);
    
    // Vérifier si l'utilisateur existe toujours
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('[AUTH MIDDLEWARE] Utilisateur non trouvé pour l\'ID:', decoded.userId);
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur introuvable' 
      });
    }

    // Ajouter l'utilisateur à la requête pour les middlewares suivants
    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Erreur d\'authentification:', error.message);
    console.error('[AUTH MIDDLEWARE] Erreur complète:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      console.log('[AUTH MIDDLEWARE] Token JWT expiré pour l\'utilisateur, mais vérification de la validité de la session');
      return res.status(401).json({ 
        success: false, 
        message: 'Token expiré' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erreur d\'authentification' 
    });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {...String} roles - Rôles autorisés
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non authentifié' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Accès refusé. Rôle requis: ${roles.join(', ')}. Votre rôle: ${req.user.role}` 
      });
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est un agent de bureau d'ordre
 */
const authorizeBureauOrdre = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Non authentifié' 
    });
  }
  
  // Rôles autorisés : Bureau d'ordre + Directeurs pour les tests
  const authorizedRoles = [
    'AGENT_BUREAU_ORDRE', 
    'SUPERVISEUR_BUREAU_ORDRE',
    'DIRECTEUR',
    'SOUS_DIRECTEUR',
    'DIRECTEUR_GENERAL',
    'SUPER_ADMIN'
  ];
  
  if (!authorizedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès réservé aux agents de bureau d\'ordre et directeurs' 
    });
  }
  
  next();
};

const authorizeAirportAccess = (req, res, next) => {
  const { airport } = req.body;
  
  console.log(`🔐 [AuthAirport] === VÉRIFICATION ACCÈS AÉROPORT ===`);
  console.log(`👤 [AuthAirport] Utilisateur: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
  console.log(`🏛️ [AuthAirport] Aéroport utilisateur: ${req.user.airport}`);
  console.log(`🎯 [AuthAirport] Aéroport demandé: ${airport}`);
  console.log(`📅 [AuthAirport] Timestamp: ${new Date().toISOString()}`);
  
  // Super admin, administrateur et superviseur peuvent tout faire
  if (['SUPER_ADMIN', 'ADMINISTRATOR', 'SUPERVISEUR_BUREAU_ORDRE'].includes(req.user.role)) {
    console.log(`[AuthAirport] Accès autorisé - Rôle privilégié: ${req.user.role}`);
    return next();
  }
  
  // Directeurs et sous-directeurs peuvent créer pour tous les aéroports
  if (['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'].includes(req.user.role)) {
    console.log(`✅ [AuthAirport] ACCÈS AUTORISÉ - Rôle directeur: ${req.user.role}`);
    console.log(`🎉 [AuthAirport] ${req.user.firstName} ${req.user.lastName} peut créer pour ${airport}`);
    return next();
  }
  
  // Agents bureau d'ordre : vérifier selon leur aéroport assigné
  if (req.user.role === 'AGENT_BUREAU_ORDRE') {
    // Si l'agent a un aéroport spécifique, il ne peut créer que pour cet aéroport
    if (req.user.airport && req.user.airport !== 'GENERALE' && airport !== req.user.airport) {
      console.log(`[AuthAirport] Accès refusé - Agent limité à ${req.user.airport}, demande pour ${airport}`);
      return res.status(403).json({
        success: false,
        message: `Vous ne pouvez créer des correspondances que pour l'aéroport de ${req.user.airport}`
      });
    }
    console.log(`[AuthAirport] Accès autorisé - Agent bureau d'ordre`);
  }
  
  // Autres rôles : accès libre (agents, etc.)
  console.log(`[AuthAirport] Accès autorisé - Rôle: ${req.user.role}`);
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est un directeur
 */
const requireDirector = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const directorRoles = ['DIRECTEUR', 'SOUS_DIRECTEUR'];
    if (!directorRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux directeurs'
      });
    }

    req.director = req.user;
    next();
  } catch (error) {
    console.error('[RequireDirector] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions'
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est un superviseur bureau d'ordre
 */
const requireSupervisor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (req.user.role !== 'SUPERVISEUR_BUREAU_ORDRE') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé au superviseur bureau d\'ordre'
      });
    }

    req.supervisor = req.user;
    next();
  } catch (error) {
    console.error('[RequireSupervisor] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions'
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est le DG
 */
const requireDG = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (req.user.role !== 'DIRECTEUR_GENERAL') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé au Directeur Général'
      });
    }

    req.dg = req.user;
    next();
  } catch (error) {
    console.error('[RequireDG] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification des permissions'
    });
  }
};

module.exports = { 
  auth, 
  authorize, 
  authorizeBureauOrdre, 
  authorizeAirportAccess,
  requireDirector,
  requireSupervisor,
  requireDG
};

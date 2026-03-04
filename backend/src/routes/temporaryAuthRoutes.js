const express = require('express');
const router = express.Router();
const TemporaryPasswordService = require('../services/temporaryPasswordService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * POST /api/temp-auth/validate-token
 * Valide un token temporaire et retourne les informations pour la connexion automatique
 */
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token temporaire requis'
      });
    }

    console.log(`[TempAuth] Validation token temporaire...`);

    // Valider le token temporaire
    const tokenData = await TemporaryPasswordService.validateTemporaryToken(token);

    if (!tokenData.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Token temporaire invalide'
      });
    }

    console.log(`[TempAuth] Token validé pour ${tokenData.email}`);

    // Retourner les informations pour la connexion automatique
    res.json({
      success: true,
      data: {
        email: tokenData.email,
        tempPassword: tokenData.tempPassword,
        userId: tokenData.userId,
        message: 'Token temporaire validé avec succès'
      }
    });

  } catch (error) {
    console.error('[TempAuth] Erreur validation token:', error);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la validation du token temporaire'
    });
  }
});

/**
 * POST /api/temp-auth/login-with-temp
 * Connexion avec mot de passe temporaire
 */
router.post('/login-with-temp', async (req, res) => {
  try {
    const { email, tempPassword, token } = req.body;

    if (!email || !tempPassword || !token) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe temporaire et token requis'
      });
    }

    console.log(`[TempAuth] Tentative connexion temporaire pour ${email}`);

    // Valider le token temporaire
    const tokenData = await TemporaryPasswordService.validateTemporaryToken(token);

    if (!tokenData.isValid || tokenData.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Token temporaire invalide ou email incorrect'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findById(tokenData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Vérifier le mot de passe temporaire
    const isValidTempPassword = await bcrypt.compare(tempPassword, user.password);
    if (!isValidTempPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe temporaire incorrect'
      });
    }

    // Générer un JWT pour la session
    const jwt = require('jsonwebtoken');
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: `${user.sessionTimeout || 25}m` }
    );

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Nettoyer le token temporaire après utilisation réussie
    await TemporaryPasswordService.cleanupTemporaryToken(user._id);

    console.log(`[TempAuth] Connexion temporaire réussie pour ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          airport: user.airport,
          mustChangePassword: user.mustChangePassword,
          sessionTimeout: user.sessionTimeout,
          isActive: user.isActive,
          phone: user.phone,
          department: user.department,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token: jwtToken,
        message: 'Connexion temporaire réussie'
      }
    });

  } catch (error) {
    console.error('[TempAuth] Erreur connexion temporaire:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la connexion temporaire'
    });
  }
});

/**
 * POST /api/temp-auth/cleanup-expired
 * Nettoie tous les tokens temporaires expirés (route admin)
 */
router.post('/cleanup-expired', async (req, res) => {
  try {
    const cleanedCount = await TemporaryPasswordService.cleanupExpiredTokens();
    
    res.json({
      success: true,
      data: {
        cleanedCount,
        message: `${cleanedCount} tokens temporaires expirés nettoyés`
      }
    });

  } catch (error) {
    console.error('[TempAuth] Erreur nettoyage tokens expirés:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des tokens expirés'
    });
  }
});

module.exports = router;

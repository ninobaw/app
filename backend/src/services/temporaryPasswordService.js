const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

class TemporaryPasswordService {
  
  /**
   * Génère un lien temporaire avec mot de passe temporaire
   * @param {string} userId - ID de l'utilisateur
   * @param {string} tempPassword - Mot de passe temporaire
   * @param {number} expirationHours - Durée d'expiration en heures (défaut: 24h)
   * @returns {Object} Lien temporaire et token
   */
  static async generateTemporaryLink(userId, tempPassword, expirationHours = 24) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Créer un token temporaire avec expiration
      const tempToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          tempPassword: tempPassword,
          type: 'temporary_password',
          exp: Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60)
        },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      // Stocker le token temporaire dans la base de données
      user.temporaryPasswordToken = tempToken;
      user.temporaryPasswordExpires = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
      await user.save();

      // Générer l'URL avec le token
      const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:8080';
      const temporaryLink = `${frontendUrl}/login?token=${tempToken}&temp=true`;

      console.log(`[TemporaryPasswordService] Lien temporaire généré pour ${user.email}`);
      console.log(`[TemporaryPasswordService] Expiration: ${user.temporaryPasswordExpires}`);

      return {
        temporaryLink,
        tempToken,
        expiresAt: user.temporaryPasswordExpires
      };

    } catch (error) {
      console.error('[TemporaryPasswordService] Erreur génération lien temporaire:', error);
      throw error;
    }
  }

  /**
   * Valide un token temporaire et extrait les informations
   * @param {string} token - Token temporaire
   * @returns {Object} Informations utilisateur et mot de passe temporaire
   */
  static async validateTemporaryToken(token) {
    try {
      // Décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded.type !== 'temporary_password') {
        throw new Error('Type de token invalide');
      }

      // Vérifier l'utilisateur en base
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier que le token correspond à celui stocké
      if (user.temporaryPasswordToken !== token) {
        throw new Error('Token temporaire invalide ou déjà utilisé');
      }

      // Vérifier l'expiration
      if (user.temporaryPasswordExpires && user.temporaryPasswordExpires < new Date()) {
        throw new Error('Token temporaire expiré');
      }

      console.log(`[TemporaryPasswordService] Token temporaire validé pour ${user.email}`);

      return {
        userId: user._id,
        email: user.email,
        tempPassword: decoded.tempPassword,
        isValid: true
      };

    } catch (error) {
      console.error('[TemporaryPasswordService] Erreur validation token temporaire:', error);
      
      if (error.name === 'TokenExpiredError') {
        throw new Error('Le lien temporaire a expiré. Veuillez demander un nouveau lien.');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Lien temporaire invalide.');
      }
      
      throw error;
    }
  }

  /**
   * Nettoie le token temporaire après utilisation
   * @param {string} userId - ID de l'utilisateur
   */
  static async cleanupTemporaryToken(userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.temporaryPasswordToken = undefined;
        user.temporaryPasswordExpires = undefined;
        await user.save();
        
        console.log(`[TemporaryPasswordService] Token temporaire nettoyé pour ${user.email}`);
      }
    } catch (error) {
      console.error('[TemporaryPasswordService] Erreur nettoyage token temporaire:', error);
    }
  }

  /**
   * Génère un mot de passe temporaire sécurisé
   * @param {number} length - Longueur du mot de passe (défaut: 12)
   * @returns {string} Mot de passe temporaire
   */
  static generateSecureTemporaryPassword(length = 12) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Nettoie tous les tokens temporaires expirés
   */
  static async cleanupExpiredTokens() {
    try {
      const result = await User.updateMany(
        {
          temporaryPasswordExpires: { $lt: new Date() }
        },
        {
          $unset: {
            temporaryPasswordToken: 1,
            temporaryPasswordExpires: 1
          }
        }
      );

      console.log(`[TemporaryPasswordService] ${result.modifiedCount} tokens temporaires expirés nettoyés`);
      return result.modifiedCount;

    } catch (error) {
      console.error('[TemporaryPasswordService] Erreur nettoyage tokens expirés:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur a un token temporaire valide
   * @param {string} userId - ID de l'utilisateur
   * @returns {boolean} True si token valide existe
   */
  static async hasValidTemporaryToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.temporaryPasswordToken || !user.temporaryPasswordExpires) {
        return false;
      }

      return user.temporaryPasswordExpires > new Date();
    } catch (error) {
      console.error('[TemporaryPasswordService] Erreur vérification token temporaire:', error);
      return false;
    }
  }
}

module.exports = TemporaryPasswordService;

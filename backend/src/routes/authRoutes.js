const { Router } = require('express');
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../utils/emailSender.js');
const { auth, authorize } = require('../middleware/auth');

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('*** Tentative de connexion reçue ! ***');
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Email ou mot de passe manquant.');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Recherche insensible à la casse pour l'email
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      console.log(`Utilisateur non trouvé pour l'email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Vérifier si le compte utilisateur est actif
    if (!user.isActive) {
      console.log(`Tentative de connexion avec un compte désactivé: ${email}`);
      return res.status(403).json({ 
        message: 'Votre compte a été désactivé. Veuillez contacter l\'administrateur pour réactiver votre compte.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`Mot de passe incorrect pour l'email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Fetch single global AppSettings document for sessionTimeout
    const globalAppSettings = await AppSettings.findOne({});
    const sessionTimeout = globalAppSettings?.sessionTimeout || 8; // Default to 8 hours if not set

    // Generate a real JWT token with longer duration to avoid frequent expiration
    // We'll use 8 hours to prevent token expiration during normal usage
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        permissions: user.permissions || []
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: `${sessionTimeout}h` }
    );

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    console.log(`Connexion réussie pour l'utilisateur: ${email}`);

    // Prepare user response with all necessary fields
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      permissions: user.permissions || [],
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      profilePhoto: user.profilePhoto,
      lastLogin: user.lastLogin,
      sessionTimeout: sessionTimeout,
      pushNotifications: user.pushNotifications,
    };

    res.json({ user: { ...userResponse, lastLogin: user.lastLogin }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  console.log(`[DEBUG] Password reset requested for email: ${email}`);
  console.log(`[SECURITY] Password reset request from IP: ${req.ip}`);
  console.log(`[SECURITY] User-Agent: ${req.get('User-Agent')}`);
  
  if (!email) {
    console.log('[DEBUG] Email manquant dans la demande de réinitialisation');
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      console.log(`[DEBUG] User not found for email: ${email}`);
      return res.status(200).json({ 
        message: 'If a user with that email exists, a password reset link has been sent.',
        security: {
          requestLogged: true,
          timestamp: new Date().toISOString(),
          ip: req.ip
        }
      });
    }

    // Vérifier si le compte utilisateur est actif
    if (!user.isActive) {
      console.log(`[SECURITY] Password reset attempt for inactive account: ${email} from IP: ${req.ip}`);
      return res.status(403).json({ 
        message: 'Ce compte a été désactivé. Veuillez contacter l\'administrateur.',
      });
    }

    const now = Date.now();
    
    // Générer un token sécurisé avec UUID
    const resetTokenId = uuidv4(); // ID unique pour tracking
    const resetToken = crypto.randomBytes(32).toString('hex'); // Token plus long (64 chars)
    
    // Stocker les informations de réinitialisation
    user.resetPasswordTokenId = resetTokenId;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = now + 600000; // 10 minutes au lieu de 15
    user.resetPasswordUsed = false; // Flag d'utilisation
    user.lastPasswordResetRequest = now; // Timestamp de cette demande
    user.passwordResetAttempts = 0; // Réinitialiser les tentatives
    
    await user.save();

    console.log(`[DEBUG] Secure reset token generated: ${resetTokenId}:${resetToken}`);
    console.log(`[DEBUG] Reset token expires at: ${new Date(user.resetPasswordExpires)}`);
    console.log(`[SECURITY] Password reset token generated for valid user: ${email} from IP: ${req.ip}`);
    console.log(`[SECURITY] Token ID: ${resetTokenId}, Token length: ${resetToken.length}`);

    // Construire l'URL sécurisée (sans token dans l'URL)
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetTokenId}`;
    
    console.log(`[DEBUG] Secure reset URL: ${resetUrl}`);

    // Email HTML amélioré avec sécurité
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - SGDO</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .security-info { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 SGDO - Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour ${user.firstName || 'utilisateur'},</p>
            <p>Une demande de réinitialisation de mot de passe a été reçue pour votre compte.</p>
            <p><strong>Si vous n'avez pas fait cette demande, veuillez ignorer cet email et contacter immédiatement le support.</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="security-info">
              <p><strong>🛡️ Informations de sécurité :</strong></p>
              <ul>
                <li>Ce lien expire dans <strong>10 minutes</strong></li>
                <li>Le lien ne peut être utilisé qu'une seule fois</li>
                <li>Adresse IP de la demande : ${req.ip}</li>
                <li>Date de la demande : ${new Date().toLocaleString('fr-FR')}</li>
              </ul>
            </div>
            
            <p>Si le bouton ci-dessus ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet email.</p>
            <p>Support : support@tav.aero</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: '🔒 Réinitialisation de mot de passe - SGDO',
        html: emailHtml,
        text: `Réinitialisation de mot de passe SGDO\n\nBonjour ${user.firstName || 'utilisateur'},\n\nUne demande de réinitialisation a été reçue. Cliquez sur le lien suivant : ${resetUrl}\n\nCe lien expire dans 10 minutes.\n\nSi vous n'avez pas fait cette demande, veuillez ignorer cet email.\n\nSupport : support@tav.aero`
      });

      console.log(`[DEBUG] Password reset email sent successfully to: ${user.email}`);
      
      res.status(200).json({ 
        message: 'If a user with that email exists, a password reset link has been sent.',
        security: {
          tokenGenerated: true,
          expiresMinutes: 10,
          requestLogged: true,
          timestamp: new Date().toISOString()
        },
        // En développement, retourner des infos de debug
        ...(process.env.NODE_ENV === 'development' && { 
          resetTokenId,
          resetUrl,
          debug: {
            userFound: true,
            userId: user._id,
            tokenExpires: new Date(user.resetPasswordExpires),
            ip: req.ip
          }
        })
      });
    } catch (emailError) {
      console.error(`[DEBUG] Failed to send password reset email:`, emailError.message);
      console.error(`[DEBUG] Email error details:`, emailError);
      // Continue quand même - le token est toujours valide pour réinitialisation manuelle
      console.log(`[DEBUG] Reset token generated for ${email}: ${resetTokenId}:${resetToken} (expires in 10 minutes)`);
      
      res.status(200).json({ 
        message: 'If a user with that email exists, a password reset link has been sent.',
        security: {
          tokenGenerated: true,
          emailError: true,
          expiresMinutes: 10
        }
      });
    }
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ 
      message: 'Server error during password reset request.',
      security: {
        error: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/auth/verify-reset-token/:tokenId
router.get('/verify-reset-token/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  console.log(`[DEBUG] Verifying secure reset token ID: ${tokenId}`);
  console.log(`[SECURITY] Token verification request from IP: ${req.ip}`);
  
  if (!tokenId) {
    console.log(`[DEBUG] Token ID manquant dans la demande`);
    return res.status(400).json({ 
      valid: false,
      message: 'Token ID is required.',
      code: 'TOKEN_ID_MISSING'
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordTokenId: tokenId,
      resetPasswordExpires: { $gt: Date.now() }, // Token must not be expired
      resetPasswordUsed: false // Token must not have been used
    });

    if (!user) {
      console.log(`[DEBUG] Token verification failed: ${tokenId} - Token not found, expired, or already used`);
      console.log(`[SECURITY] Invalid token attempt from IP: ${req.ip}`);
      return res.status(400).json({ 
        valid: false,
        message: 'Le lien de réinitialisation est invalide, a expiré, ou a déjà été utilisé.',
        code: 'TOKEN_INVALID_OR_EXPIRED_OR_USED'
      });
    }

    // Vérifier les tentatives multiples
    if (user.passwordResetAttempts >= 3) {
      console.log(`[SECURITY] Too many reset attempts for token: ${tokenId} from IP: ${req.ip}`);
      return res.status(429).json({
        valid: false,
        message: 'Trop de tentatives de réinitialisation. Veuillez demander un nouveau lien.',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Incrémenter les tentatives
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    await user.save();

    const timeRemaining = Math.round((user.resetPasswordExpires - Date.now()) / 1000 / 60); // minutes restantes

    console.log(`[DEBUG] Token verification successful: ${tokenId} for user: ${user._id}`);
    console.log(`[DEBUG] Token expires at: ${new Date(user.resetPasswordExpires)}`);
    console.log(`[DEBUG] Current time: ${new Date()}`);
    console.log(`[DEBUG] Time remaining: ${timeRemaining} minutes`);
    console.log(`[DEBUG] Reset attempts: ${user.passwordResetAttempts}`);

    res.status(200).json({ 
      valid: true,
      message: 'Token valide',
      expiresAt: user.resetPasswordExpires,
      timeRemaining: timeRemaining,
      security: {
        verificationLogged: true,
        attempts: user.passwordResetAttempts,
        maxAttempts: 3
      }
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Erreur serveur lors de la vérification du token.',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/validate-reset-token
router.post('/validate-reset-token', async (req, res) => {
  const { tokenId, token } = req.body;
  
  console.log(`[DEBUG] Validating reset token via POST: ${tokenId}`);
  console.log(`[SECURITY] Token validation request from IP: ${req.ip}`);
  
  if (!tokenId || !token) {
    return res.status(400).json({ 
      valid: false,
      message: 'Token ID and token are required.',
      code: 'MISSING_PARAMETERS'
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordTokenId: tokenId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      resetPasswordUsed: false
    });

    if (!user) {
      console.log(`[DEBUG] POST token validation failed: ${tokenId}`);
      return res.status(400).json({ 
        valid: false,
        message: 'Token invalide ou expiré.',
        code: 'TOKEN_INVALID'
      });
    }

    res.status(200).json({ 
      valid: true,
      message: 'Token validé avec succès',
      security: {
        validationMethod: 'POST',
        ip: req.ip
      }
    });
  } catch (error) {
    console.error('Error validating reset token:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Erreur serveur lors de la validation du token.'
    });
  }
});

// POST /api/auth/reset-password/:tokenId
router.post('/reset-password/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  const { newPassword, token } = req.body; // Token requis dans le corps

  console.log(`[DEBUG] Resetting password with token ID: ${tokenId}`);
  console.log(`[SECURITY] Password reset request from IP: ${req.ip}`);

  if (!newPassword || !token || newPassword.length < 6) {
    return res.status(400).json({ 
      message: 'Token and valid password (min 6 chars) are required.',
      code: 'INVALID_INPUT'
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordTokenId: tokenId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token must not be expired
      resetPasswordUsed: false // Token must not have been used
    });

    if (!user) {
      console.log(`[DEBUG] Password reset failed: ${tokenId} - Invalid token or expired`);
      console.log(`[SECURITY] Invalid password reset attempt from IP: ${req.ip}`);
      return res.status(400).json({ 
        message: 'Password reset token is invalid, expired, or has been used.',
        code: 'TOKEN_INVALID_OR_EXPIRED'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12); // Augmenter à 12 rounds
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Invalider le token immédiatement
    user.resetPasswordTokenId = null;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.resetPasswordUsed = true; // Marquer comme utilisé
    user.passwordResetAt = Date.now(); // Timestamp de réinitialisation
    user.lastPasswordResetRequest = Date.now(); // Mettre à jour le timestamp
    
    await user.save();

    console.log(`[DEBUG] Password reset successful for user: ${user._id}`);
    console.log(`[DEBUG] Token ${tokenId} marked as used and invalidated`);
    console.log(`[SECURITY] Password reset completed for ${user.email} from IP: ${req.ip}`);

    res.status(200).json({ 
      message: 'Votre mot de passe a été réinitialisé avec succès.',
      security: {
        resetCompleted: true,
        timestamp: new Date().toISOString(),
        ip: req.ip
      }
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ 
      message: 'Server error during password reset.',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;

const { Router } = require('express');
const { auth } = require('../middleware/auth.js');
const microsoftCopilotService = require('../services/microsoftCopilotService');

const router = Router();

/**
 * GET /api/translation/languages
 * Récupère la liste des langues supportées
 */
router.get('/languages', auth, async (req, res) => {
  try {
    const languages = microsoftCopilotService.getSupportedLanguages();
    
    res.json({
      success: true,
      languages: languages,
      configured: microsoftCopilotService.isConfigured
    });
  } catch (error) {
    console.error('❌ Erreur récupération langues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des langues'
    });
  }
});

/**
 * GET /api/translation/auth-url
 * Génère l'URL d'authentification Office 365
 */
router.get('/auth-url', auth, async (req, res) => {
  try {
    if (!microsoftCopilotService.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Service Microsoft Copilot non configuré'
      });
    }

    const authUrl = microsoftCopilotService.getAuthUrl();
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('❌ Erreur génération URL auth:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/translation/auth-callback
 * Traite le callback d'authentification Office 365
 */
router.post('/auth-callback', auth, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code d\'autorisation manquant'
      });
    }

    const result = await microsoftCopilotService.exchangeCodeForToken(code);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Authentification réussie',
        expiresIn: result.expiresIn
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erreur callback auth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification'
    });
  }
});

/**
 * GET /api/translation/status
 * Vérifie le statut de la connexion Copilot
 */
router.get('/status', auth, async (req, res) => {
  try {
    const status = await microsoftCopilotService.getConnectionStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    res.json({
      success: true,
      connected: false,
      error: error.message
    });
  }
});

/**
 * POST /api/translation/translate
 * Traduit un texte via Microsoft Copilot
 */
router.post('/translate', auth, async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;
    
    // Validation des paramètres
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Texte et langue cible requis'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Texte trop long (maximum 5000 caractères)'
      });
    }

    const userId = req.user?.id || 'default';
    
    console.log('🔄 Demande de traduction:', {
      userId,
      textLength: text.length,
      sourceLanguage,
      targetLanguage
    });

    const result = await microsoftCopilotService.translateText(
      text, 
      targetLanguage, 
      sourceLanguage, 
      userId
    );
    
    if (result.success) {
      res.json({
        success: true,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        originalText: result.originalText,
        fallback: result.fallback || false,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erreur traduction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la traduction'
    });
  }
});

/**
 * POST /api/translation/detect-language
 * Détecte la langue d'un texte
 */
router.post('/detect-language', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    console.log(`🔍 [DETECT-LANG] Requête reçue de ${req.user.email}`);
    console.log(`📝 [DETECT-LANG] Texte à analyser: "${text?.substring(0, 50)}..."`);
    
    if (!text) {
      console.log(`❌ [DETECT-LANG] Texte manquant`);
      return res.status(400).json({
        success: false,
        message: 'Texte requis'
      });
    }

    const result = await microsoftCopilotService.detectLanguage(text);
    
    res.json({
      success: true,
      language: result.language,
      confidence: result.confidence
    });
  } catch (error) {
    console.error('❌ Erreur détection langue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la détection de langue'
    });
  }
});

/**
 * POST /api/translation/disconnect
 * Déconnecte l'utilisateur de Copilot
 */
router.post('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user?.id || 'default';
    const result = microsoftCopilotService.disconnect(userId);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

module.exports = router;

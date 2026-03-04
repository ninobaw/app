const axios = require('axios');

/**
 * Service de traduction utilisant Microsoft Copilot via Office 365
 */
class MicrosoftCopilotService {
  constructor() {
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
    this.copilotApiUrl = 'https://graph.microsoft.com/beta/me/copilot';
    
    // Configuration Office 365
    this.clientId = process.env.OFFICE365_CLIENT_ID;
    this.clientSecret = process.env.OFFICE365_CLIENT_SECRET;
    this.tenantId = process.env.OFFICE365_TENANT_ID;
    this.redirectUri = process.env.OFFICE365_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    
    // Vérifier si la configuration Office 365 est disponible
    this.isConfigured = !!(this.clientId && this.clientSecret && this.tenantId);
    
    if (!this.isConfigured) {
      console.warn('⚠️  Configuration Office 365 incomplète. Service Copilot désactivé.');
      console.warn('   Configurez OFFICE365_CLIENT_ID, OFFICE365_CLIENT_SECRET, OFFICE365_TENANT_ID dans .env');
    }

    // Cache pour les tokens d'accès
    this.accessTokenCache = new Map();
  }

  /**
   * Langues supportées pour la traduction
   */
  getSupportedLanguages() {
    return {
      'fr': 'Français',
      'en': 'English',
      'ar': 'العربية (Arabe)',
      'es': 'Español',
      'it': 'Italiano',
      'de': 'Deutsch',
      'pt': 'Português',
      'ru': 'Русский',
      'zh': '中文 (Chinois)',
      'ja': '日本語 (Japonais)',
      'ko': '한국어 (Coréen)',
      'tr': 'Türkçe',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'da': 'Dansk',
      'no': 'Norsk',
      'fi': 'Suomi'
    };
  }

  /**
   * Génère l'URL d'authentification Office 365
   */
  getAuthUrl() {
    if (!this.isConfigured) {
      throw new Error('Configuration Office 365 manquante');
    }

    const scopes = [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Copilot.ReadWrite'
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_mode=query&` +
      `state=translation_service`;

    return authUrl;
  }

  /**
   * Échange le code d'autorisation contre un token d'accès
   */
  async exchangeCodeForToken(authCode) {
    if (!this.isConfigured) {
      throw new Error('Configuration Office 365 manquante');
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await axios.post(tokenUrl, new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: authCode,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Copilot.ReadWrite'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      // Stocker le token avec expiration
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      this.accessTokenCache.set('default', {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt
      });

      return {
        success: true,
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  /**
   * Rafraîchit le token d'accès
   */
  async refreshAccessToken(refreshToken) {
    if (!this.isConfigured) {
      throw new Error('Configuration Office 365 manquante');
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await axios.post(tokenUrl, new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Copilot.ReadWrite'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenData = response.data;
      
      // Mettre à jour le cache
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      this.accessTokenCache.set('default', {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        expiresAt: expiresAt
      });

      return tokenData.access_token;
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtient un token d'accès valide
   */
  async getValidAccessToken() {
    const cached = this.accessTokenCache.get('default');
    
    if (!cached) {
      throw new Error('Aucun token d\'accès disponible. Authentification requise.');
    }

    // Vérifier si le token est encore valide (avec marge de 5 minutes)
    if (cached.expiresAt > Date.now() + 300000) {
      return cached.accessToken;
    }

    // Rafraîchir le token
    return await this.refreshAccessToken(cached.refreshToken);
  }

  /**
   * Traduit un texte en utilisant Microsoft Copilot
   */
  async translateText(text, targetLanguage, sourceLanguage = 'auto', userId = 'default') {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Service Microsoft Copilot non configuré'
      };
    }

    try {
      const accessToken = await this.getValidAccessToken();
      
      // Préparer le prompt pour Copilot
      const supportedLangs = this.getSupportedLanguages();
      const targetLangName = supportedLangs[targetLanguage] || targetLanguage;
      const sourceLangName = sourceLanguage === 'auto' ? 'langue détectée automatiquement' : (supportedLangs[sourceLanguage] || sourceLanguage);
      
      const prompt = `Traduis le texte suivant de ${sourceLangName} vers ${targetLangName}. 
      
Texte à traduire : "${text}"

Instructions :
- Fournis uniquement la traduction, sans explication
- Conserve le style et le ton du texte original
- Adapte le contexte professionnel/administratif si nécessaire
- Si c'est une correspondance officielle, utilise un langage approprié

Traduction :`;

      // Appel à l'API Microsoft Graph Copilot
      const response = await axios.post(
        `${this.copilotApiUrl}/chat`,
        {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const translatedText = response.data.choices?.[0]?.message?.content?.trim();
      
      if (!translatedText) {
        throw new Error('Réponse vide de Copilot');
      }

      console.log('✅ Traduction Copilot réussie:', {
        source: sourceLanguage,
        target: targetLanguage,
        originalLength: text.length,
        translatedLength: translatedText.length
      });

      return {
        success: true,
        translatedText: translatedText,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        originalText: text
      };

    } catch (error) {
      console.error('❌ Erreur lors de la traduction Copilot:', error.response?.data || error.message);
      
      // Fallback vers un service de traduction simple si Copilot échoue
      return this.fallbackTranslation(text, targetLanguage, sourceLanguage);
    }
  }

  /**
   * Service de traduction de secours (traduction basique)
   */
  async fallbackTranslation(text, targetLanguage, sourceLanguage) {
    console.log('🔄 Utilisation du service de traduction de secours');
    
    // Traductions basiques pour les termes courants
    const basicTranslations = {
      'fr': {
        'hello': 'bonjour',
        'thank you': 'merci',
        'please': 's\'il vous plaît',
        'correspondence': 'correspondance',
        'document': 'document',
        'urgent': 'urgent',
        'important': 'important'
      },
      'en': {
        'bonjour': 'hello',
        'merci': 'thank you',
        'correspondance': 'correspondence',
        'document': 'document',
        'urgent': 'urgent',
        'important': 'important'
      },
      'ar': {
        'correspondance': 'مراسلة',
        'document': 'وثيقة',
        'urgent': 'عاجل',
        'important': 'مهم'
      }
    };

    let translatedText = text;
    const translations = basicTranslations[targetLanguage];
    
    if (translations) {
      Object.keys(translations).forEach(key => {
        const regex = new RegExp(key, 'gi');
        translatedText = translatedText.replace(regex, translations[key]);
      });
    }

    return {
      success: true,
      translatedText: translatedText,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      originalText: text,
      fallback: true,
      message: 'Traduction basique utilisée (Copilot indisponible)'
    };
  }

  /**
   * Détecte la langue d'un texte
   */
  async detectLanguage(text) {
    if (!this.isConfigured) {
      return { language: 'fr', confidence: 0.5 }; // Défaut français
    }

    try {
      const accessToken = await this.getValidAccessToken();
      
      const prompt = `Détecte la langue du texte suivant et réponds uniquement par le code de langue (fr, en, ar, es, etc.) :

"${text.substring(0, 200)}"

Code de langue :`;

      const response = await axios.post(
        `${this.copilotApiUrl}/chat`,
        {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const detectedLang = response.data.choices?.[0]?.message?.content?.trim().toLowerCase();
      
      return {
        language: detectedLang || 'fr',
        confidence: detectedLang ? 0.9 : 0.5
      };

    } catch (error) {
      console.error('❌ Erreur détection de langue:', error.message);
      
      // Détection basique par mots-clés
      const text_lower = text.toLowerCase();
      if (text_lower.includes('the ') || text_lower.includes(' and ') || text_lower.includes(' is ')) {
        return { language: 'en', confidence: 0.7 };
      } else if (text_lower.includes('في ') || text_lower.includes('من ') || text_lower.includes('إلى ')) {
        return { language: 'ar', confidence: 0.7 };
      } else {
        return { language: 'fr', confidence: 0.6 }; // Défaut français
      }
    }
  }

  /**
   * Vérifie le statut de la connexion Copilot
   */
  async getConnectionStatus() {
    if (!this.isConfigured) {
      return {
        connected: false,
        error: 'Configuration Office 365 manquante'
      };
    }

    try {
      const accessToken = await this.getValidAccessToken();
      
      // Test de connexion avec un appel simple
      const response = await axios.get(
        `${this.graphApiUrl}/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        connected: true,
        user: {
          name: response.data.displayName,
          email: response.data.mail || response.data.userPrincipalName
        }
      };

    } catch (error) {
      return {
        connected: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Déconnecte l'utilisateur (supprime les tokens)
   */
  disconnect(userId = 'default') {
    this.accessTokenCache.delete(userId);
    return { success: true, message: 'Déconnecté de Microsoft Copilot' };
  }
}

module.exports = new MicrosoftCopilotService();

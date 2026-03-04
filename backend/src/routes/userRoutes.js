const { Router } = require('express');
const User = require('../models/User.js'); // Changed to require with .js extension
const AppSettings = require('../models/AppSettings.js'); // Import AppSettings model
const { v4: uuidv4 } = require('uuid'); // uuid is a CommonJS module, no change needed here
const bcrypt = require('bcryptjs'); // Changed to require
const { auth } = require('../middleware/auth.js'); // Import auth middleware
const { createDirectors } = require('../scripts/createDirectors');
const newUserNotificationService = require('../services/newUserNotificationService');

const router = Router();

// Helper to format user object for consistent frontend consumption
const formatUserResponse = async (userDoc) => { // Made async to fetch AppSettings
  const userObject = userDoc.toObject();
  delete userObject.password; // Ensure password is never sent
  userObject.id = userObject._id; // Explicitly map _id to id

  // Fetch the single global AppSettings document for sessionTimeout
  const globalAppSettings = await AppSettings.findOne({});
  userObject.sessionTimeout = globalAppSettings ? globalAppSettings.sessionTimeout : 60; // Default to 60 minutes

  // Include user-specific notification preferences
  userObject.emailNotifications = userDoc.emailNotifications;
  userObject.smsNotifications = userDoc.smsNotifications;
  userObject.pushNotifications = userDoc.pushNotifications;

  return userObject;
};

// GET /api/users/for-correspondance - Route optimisée pour les correspondances
router.get('/for-correspondance', async (req, res) => {
  try {
    console.log('🔄 Route /for-correspondance - Début de la requête');
    const startTime = Date.now();
    
    // Filtrer seulement les utilisateurs pertinents pour les correspondances
    const relevantRoles = [
      'SUPER_ADMIN',
      'ADMINISTRATOR', 
      'DIRECTEUR_GENERAL',
      'DIRECTEUR',
      'SOUS_DIRECTEUR',
      'AGENT_BUREAU_ORDRE',
      'SUPERVISEUR_BUREAU_ORDRE'
    ];
    
    // Requête optimisée avec sélection de champs limitée
    const users = await User.find({
      isActive: true,
      role: { $in: relevantRoles }
    }).select('_id email firstName lastName role airport isActive').lean();
    
    // Ajouter l'id pour compatibilité frontend
    const formattedUsers = users.map(user => ({
      ...user,
      id: user._id
    }));
    
    const endTime = Date.now();
    console.log(`✅ Route /for-correspondance - ${formattedUsers.length} utilisateurs récupérés en ${endTime - startTime}ms`);
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users for correspondance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/active-light - Route ultra-optimisée pour les utilisateurs actifs
router.get('/active-light', async (req, res) => {
  try {
    console.log('🔄 Route /active-light - Début de la requête');
    const startTime = Date.now();
    
    const users = await User.find({
      isActive: true
    }).select('_id email firstName lastName role').lean();
    
    const formattedUsers = users.map(user => ({
      ...user,
      id: user._id
    }));
    
    const endTime = Date.now();
    console.log(`✅ Route /active-light - ${formattedUsers.length} utilisateurs récupérés en ${endTime - startTime}ms`);
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching active users light:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    // Use Promise.all to await all formatUserResponse calls
    const formattedUsers = await Promise.all(users.map(user => formatUserResponse(user)));
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Use the async formatUserResponse helper
    res.json(await formatUserResponse(user));
  } catch (error) {
    console.error('Error fetching single user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users
router.post('/', auth, async (req, res) => {
  console.log('🔍 [DEBUG] POST /api/users - Début de la requête');
  console.log('🔍 [DEBUG] req.body:', JSON.stringify(req.body, null, 2));
  
  const { 
    email, 
    firstName, 
    lastName, 
    role, 
    airport, 
    phone, 
    department, 
    password, // Optionnel - si non fourni, un mot de passe temporaire sera généré
    emailNotifications, 
    smsNotifications, 
    pushNotifications,
    // Champs spécifiques aux directeurs
    directorate,
    managedDepartments,
    delegationLevel
  } = req.body;

  console.log('🔍 [DEBUG] Champs extraits:', {
    email, firstName, lastName, role, airport, phone, department,
    directorate, managedDepartments, delegationLevel
  });

  if (!email || !firstName || !lastName) {
    console.log('❌ [DEBUG] Champs requis manquants');
    return res.status(400).json({ message: 'Missing required fields: email, firstName, lastName' });
  }

  // Générer un mot de passe temporaire si non fourni
  const temporaryPassword = password || newUserNotificationService.generateTemporaryPassword();
  console.log('🔍 [DEBUG] Mot de passe temporaire généré:', temporaryPassword ? 'Oui' : 'Non');

  try {
    console.log('🔍 [DEBUG] Vérification utilisateur existant...');
    // Recherche insensible à la casse pour éviter les doublons d'emails
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingUser) {
      console.log('❌ [DEBUG] Utilisateur existe déjà:', email);
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    console.log('🔍 [DEBUG] Hachage du mot de passe temporaire...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);
    console.log('✅ [DEBUG] Mot de passe temporaire haché');

    console.log('🔍 [DEBUG] Création de l\'objet userData...');
    const userData = {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
      airport,
      phone,
      department,
      isActive: true,
      mustChangePassword: true, // New users must change password on first login
      emailNotifications: emailNotifications ?? true, // Initialize user-specific notification preferences
      smsNotifications: smsNotifications ?? false,
      pushNotifications: pushNotifications ?? true,
    };

    // Ajouter les champs spécifiques aux directeurs si fournis
    if (directorate && directorate.trim() !== '') {
      console.log('🔍 [DEBUG] Ajout directorate:', directorate);
      userData.directorate = directorate;
    } else {
      console.log('🔍 [DEBUG] Directorate vide ou undefined, ignoré');
    }
    
    if (managedDepartments && Array.isArray(managedDepartments) && managedDepartments.length > 0) {
      console.log('🔍 [DEBUG] Ajout managedDepartments:', managedDepartments);
      userData.managedDepartments = managedDepartments;
    } else {
      console.log('🔍 [DEBUG] ManagedDepartments vide ou undefined, ignoré');
    }
    
    if (delegationLevel !== undefined && delegationLevel !== null && delegationLevel !== '') {
      console.log('🔍 [DEBUG] Ajout delegationLevel:', delegationLevel);
      userData.delegationLevel = delegationLevel;
    } else {
      console.log('🔍 [DEBUG] DelegationLevel vide ou undefined, ignoré');
    }

    console.log('🔍 [DEBUG] userData final:', JSON.stringify(userData, null, 2));

    console.log('🔍 [DEBUG] Création de l\'instance User...');
    const newUser = new User(userData);
    
    console.log('🔍 [DEBUG] Validation du modèle...');
    const validationError = newUser.validateSync();
    if (validationError) {
      console.log('❌ [DEBUG] Erreur de validation:', validationError.message);
      console.log('❌ [DEBUG] Détails validation:', validationError.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: validationError.errors 
      });
    }
    
    console.log('🔍 [DEBUG] Sauvegarde en base de données...');
    await newUser.save();
    console.log('✅ [DEBUG] Utilisateur sauvegardé avec succès');
    
    // Préparer les données utilisateur pour les notifications
    const userDataForNotification = {
      firstName,
      lastName,
      email,
      role,
      airport
    };

    // Envoyer l'email de bienvenue avec les identifiants
    console.log('📧 [DEBUG] Envoi de l\'email de bienvenue...');
    const emailResult = await newUserNotificationService.sendWelcomeEmail(userDataForNotification, temporaryPassword);
    
    if (emailResult.success) {
      console.log('✅ [DEBUG] Email de bienvenue envoyé avec succès');
    } else {
      console.log('⚠️ [DEBUG] Échec de l\'envoi de l\'email:', emailResult.error);
    }

    // Générer les informations de bienvenue pour la réponse
    const welcomeInfo = newUserNotificationService.generateWelcomeInfo(userDataForNotification, temporaryPassword);

    console.log('🔍 [DEBUG] Formatage de la réponse...');
    const formattedUser = await formatUserResponse(newUser);
    console.log('✅ [DEBUG] Réponse formatée, envoi au client');
    
    // Réponse enrichie avec les informations de bienvenue
    res.status(201).json({
      user: formattedUser,
      welcome: welcomeInfo,
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erreur dans POST /api/users:');
    console.error('❌ [DEBUG] Message:', error.message);
    console.error('❌ [DEBUG] Stack:', error.stack);
    console.error('❌ [DEBUG] Code:', error.code);
    if (error.errors) {
      console.error('❌ [DEBUG] Erreurs de validation:', error.errors);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  console.log('🔧 [userRoutes] Début de la mise à jour utilisateur');
  console.log('🔧 [userRoutes] User ID:', id);
  console.log('🔧 [userRoutes] Updates reçus:', updates);

  try {
    // Only allow updating specific fields for a user, not global settings
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'department', 'position', 'role', 'airport', 'isActive',
      'emailNotifications', 'smsNotifications', 'pushNotifications', 'profilePhoto' // Allow updating user-specific notification preferences and profile photo
    ];
    
    console.log('🔧 [userRoutes] Updates autorisés:', allowedUpdates);
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    console.log('🔧 [userRoutes] Updates filtrés:', filteredUpdates);

    const user = await User.findByIdAndUpdate(id, filteredUpdates, { new: true });
    
    if (!user) {
      console.error('❌ [userRoutes] Utilisateur non trouvé:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ [userRoutes] Utilisateur mis à jour avec succès');
    console.log('✅ [userRoutes] User après mise à jour:', user);
    
    const formattedUser = await formatUserResponse(user);
    console.log('✅ [userRoutes] User formaté:', formattedUser);
    
    res.json(formattedUser);
  } catch (error) {
    console.error('❌ [userRoutes] Erreur mise à jour utilisateur:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id/change-password
router.put('/:id/change-password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  console.log(`[PASSWORD_CHANGE] Demande de changement pour utilisateur ID: ${id}`);
  console.log(`[PASSWORD_CHANGE] IP de la demande: ${req.ip}`);
  console.log(`[PASSWORD_CHANGE] User-Agent: ${req.get('User-Agent')}`);

  if (!currentPassword || !newPassword) {
    console.log(`[PASSWORD_CHANGE] Erreur: Paramètres manquants`);
    return res.status(400).json({ 
      message: 'Current password and new password are required.' 
    });
  }

  if (newPassword.length < 6) {
    console.log(`[PASSWORD_CHANGE] Erreur: Nouveau mot de passe trop court (${newPassword.length} chars)`);
    return res.status(400).json({ 
      message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' 
    });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      console.log(`[PASSWORD_CHANGE] Erreur: Utilisateur non trouvé (ID: ${id})`);
      return res.status(404).json({ 
        message: 'User not found.' 
      });
    }

    console.log(`[PASSWORD_CHANGE] Utilisateur trouvé: ${user.email}`);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log(`[PASSWORD_CHANGE] Erreur: Mot de passe actuel incorrect pour ${user.email}`);
      return res.status(401).json({ 
        message: 'Current password is incorrect.' 
      });
    }

    console.log(`[PASSWORD_CHANGE] Validation réussie pour ${user.email}`);

    const salt = await bcrypt.genSalt(12); // Augmenter la sécurité
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false; // Réinitialiser le flag après changement réussi
    user.updatedAt = new Date();
    // user.passwordChangedAt = new Date(); // Commenté car le champ n'existe pas dans le modèle
    
    await user.save();

    console.log(`[PASSWORD_CHANGE] Succès: Mot de passe changé pour ${user.email}`);
    console.log(`[PASSWORD_CHANGE] Flag mustChangePassword réinitialisé à false`);

    res.status(200).json({ 
      message: 'Password changed successfully.',
      mustChangePassword: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PASSWORD_CHANGE] Erreur serveur:', error);
    res.status(500).json({ 
      message: 'Server error during password change.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/users/:id/reset-password - Admin resets user password
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log(`[RESET PASSWORD] Début de la réinitialisation pour l'utilisateur ID: ${id}`);
    console.log(`[RESET PASSWORD] Admin connecté: ${req.user?.email} (${req.user?.role})`);
    console.log(`[RESET PASSWORD] Nouveau mot de passe fourni: ${newPassword ? 'Oui' : 'Non'}`);

    // Vérifier que req.user existe (middleware auth a fonctionné)
    if (!req.user) {
      console.log(`[RESET PASSWORD] Erreur - req.user est undefined, problème d'authentification`);
      return res.status(401).json({ message: 'Authentification requise. Veuillez vous reconnecter.' });
    }

    // Vérifier que l'utilisateur connecté est SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      console.log(`[RESET PASSWORD] Accès refusé - Rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès refusé. Seuls les super administrateurs peuvent réinitialiser les mots de passe.' });
    }

    // Validation du nouveau mot de passe
    if (!newPassword || newPassword.length < 6) {
      console.log(`[RESET PASSWORD] Validation échouée - Mot de passe invalide`);
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    console.log(`[RESET PASSWORD] Recherche de l'utilisateur avec ID: ${id}`);
    // Trouver l'utilisateur
    const user = await User.findById(id);
    if (!user) {
      console.log(`[RESET PASSWORD] Utilisateur non trouvé avec ID: ${id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    console.log(`[RESET PASSWORD] Utilisateur trouvé: ${user.email} (${user.role})`);

    // Empêcher la modification du mot de passe d'un autre SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && user._id !== req.user.id) {
      console.log(`[RESET PASSWORD] Tentative de modification d'un autre SUPER_ADMIN bloquée`);
      return res.status(403).json({ message: 'Impossible de modifier le mot de passe d\'un autre super administrateur.' });
    }

    console.log(`[RESET PASSWORD] Génération du hash du nouveau mot de passe...`);
    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log(`[RESET PASSWORD] Mise à jour de l'utilisateur...`);
    // Mettre à jour le mot de passe et forcer le changement
    user.password = hashedPassword;
    user.mustChangePassword = true; // Forcer l'utilisateur à changer son mot de passe
    user.updatedAt = new Date();
    
    await user.save();

    console.log(`[RESET PASSWORD] Succès - Admin ${req.user.email} a réinitialisé le mot de passe de l'utilisateur ${user.email}`);

    res.status(200).json({ 
      message: 'Mot de passe réinitialisé avec succès. L\'utilisateur devra changer son mot de passe lors de sa prochaine connexion.',
      mustChangePassword: true
    });

  } catch (error) {
    console.error('[RESET PASSWORD] Erreur complète:', error);
    console.error('[RESET PASSWORD] Stack trace:', error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation du mot de passe.' });
  }
});

// POST /api/users/admin/create-directors - Créer les comptes des directeurs
router.post('/admin/create-directors', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les SUPER_ADMIN peuvent créer des directeurs.'
      });
    }

    console.log('🚀 [ADMIN] Création des comptes directeurs par', req.user.firstName, req.user.lastName);
    
    const result = await createDirectors();
    
    res.json({
      success: true,
      message: 'Comptes des directeurs créés avec succès',
      data: result
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur création directeurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des directeurs',
      error: error.message
    });
  }
});

// DELETE /api/users/:id (now performs a hard delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id); // Changed to findByIdAndDelete
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
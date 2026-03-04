const { Router } = require('express');
const AppSettings = require('../models/AppSettings.js');
const User = require('../models/User.js'); // Import User model to check roles
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET /api/settings (fetch the single global settings document)
router.get('/', async (req, res) => {
  try {
    let settings = await AppSettings.findOne({});

    if (!settings) {
      // If no settings found, create a default one (this should ideally happen once during seeding)
      const defaultSettings = {
        _id: uuidv4(),
        companyName: 'SGDO - Gestion Documentaire',
        defaultAirport: 'ENFIDHA',
        language: 'fr',
        theme: 'light',
        sessionTimeout: 60,
        requireTwoFactor: false,
        passwordExpiry: 90,
        documentRetention: 365,
        autoArchive: true,
        maxFileSize: 10,
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        useSsl: true,
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioPhoneNumber: '',
      };
      settings = new AppSettings(defaultSettings);
      await settings.save();
    }

    res.json({
      ...settings.toObject(),
      id: settings._id,
      // Map backend schema names to frontend field names
      company_name: settings.companyName,
      default_airport: settings.defaultAirport,
      session_timeout: settings.sessionTimeout,
      require_two_factor: settings.requireTwoFactor,
      password_expiry: settings.passwordExpiry,
      document_retention: settings.documentRetention,
      auto_archive: settings.autoArchive,
      max_file_size: settings.maxFileSize,
      smtp_host: settings.smtpHost,
      smtp_port: settings.smtpPort,
      smtp_username: settings.smtpUsername,
      use_ssl: settings.useSsl,
      twilio_account_sid: settings.twilioAccountSid,
      twilio_auth_token: settings.twilioAuthToken,
      twilio_phone_number: settings.twilioPhoneNumber,
    });
  } catch (error) {
    console.error('Error fetching global app settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings/:id (update the single global settings document)
router.put('/:id', async (req, res) => {
  const { id } = req.params; // This 'id' should be the ID of the single global settings document
  const updates = req.body;

  console.log('Backend: Requête PUT /api/settings/:id reçue pour les paramètres globaux.');
  console.log('Backend: ID du document de paramètres:', id);
  console.log('Backend: Données reçues (req.body):', updates);

  // Map frontend field names to backend schema names
  const mappedUpdates = {};
  if (updates.company_name !== undefined) mappedUpdates.companyName = updates.company_name;
  if (updates.default_airport !== undefined) mappedUpdates.defaultAirport = updates.default_airport;
  if (updates.language !== undefined) mappedUpdates.language = updates.language;
  if (updates.theme !== undefined) mappedUpdates.theme = updates.theme;
  if (updates.session_timeout !== undefined) mappedUpdates.sessionTimeout = updates.session_timeout;
  if (updates.require_two_factor !== undefined) mappedUpdates.requireTwoFactor = updates.require_two_factor;
  if (updates.password_expiry !== undefined) mappedUpdates.passwordExpiry = updates.password_expiry;
  if (updates.document_retention !== undefined) mappedUpdates.documentRetention = updates.document_retention;
  if (updates.auto_archive !== undefined) mappedUpdates.autoArchive = updates.auto_archive;
  if (updates.max_file_size !== undefined) mappedUpdates.maxFileSize = updates.max_file_size;
  if (updates.smtp_host !== undefined) mappedUpdates.smtpHost = updates.smtp_host;
  if (updates.smtp_port !== undefined) mappedUpdates.smtpPort = updates.smtp_port;
  if (updates.smtp_username !== undefined) mappedUpdates.smtpUsername = updates.smtp_username;
  if (updates.use_ssl !== undefined) mappedUpdates.useSsl = updates.use_ssl;
  if (updates.twilio_account_sid !== undefined) mappedUpdates.twilioAccountSid = updates.twilio_account_sid;
  if (updates.twilio_auth_token !== undefined) mappedUpdates.twilioAuthToken = updates.twilio_auth_token;
  if (updates.twilio_phone_number !== undefined) mappedUpdates.twilioPhoneNumber = updates.twilio_phone_number;

  console.log('Backend: Données mappées pour la mise à jour:', mappedUpdates);

  try {
    // Find the single global settings document and update it
    const settings = await AppSettings.findOneAndUpdate(
      { _id: id }, // Use the ID passed in the URL (should be the global settings ID)
      { $set: mappedUpdates },
      { new: true }
    );

    if (!settings) {
      console.error('Backend: Erreur: Paramètres globaux non trouvés ou non mis à jour.');
      return res.status(404).json({ message: 'Global settings not found or could not be updated.' });
    }

    console.log('Backend: Paramètres globaux mis à jour avec succès:', settings);

    res.json({
      ...settings.toObject(),
      id: settings._id,
      company_name: settings.companyName,
      default_airport: settings.defaultAirport,
      session_timeout: settings.sessionTimeout,
      require_two_factor: settings.requireTwoFactor,
      password_expiry: settings.passwordExpiry,
      document_retention: settings.documentRetention,
      auto_archive: settings.autoArchive,
      max_file_size: settings.maxFileSize,
      smtp_host: settings.smtpHost,
      smtp_port: settings.smtpPort,
      smtp_username: settings.smtpUsername,
      use_ssl: settings.useSsl,
      twilio_account_sid: settings.twilioAccountSid,
      twilio_auth_token: settings.twilioAuthToken,
      twilio_phone_number: settings.twilioPhoneNumber,
    });
  } catch (error) {
    console.error('Backend: Erreur lors de la mise à jour des paramètres globaux de l\'application:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
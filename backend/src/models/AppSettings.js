const { Schema, model } = require('mongoose');

const AppSettingsSchema = new Schema({
  _id: { type: String, required: true },
  // Removed userId as this model will now store global application settings
  companyName: { type: String, default: 'SGDO - Gestion Documentaire' },
  defaultAirport: { 
    type: String, 
    enum: ['ENFIDHA', 'MONASTIR', 'GENERALE'], 
    default: 'ENFIDHA' 
  },
  language: { type: String, default: 'fr' },
  theme: { type: String, default: 'light' },
  // Removed emailNotifications, smsNotifications, pushNotifications as they are now on User model
  sessionTimeout: { type: Number, default: 60 },
  requireTwoFactor: { type: Boolean, default: false },
  passwordExpiry: { type: Number, default: 90 },
  documentRetention: { type: Number, default: 365 },
  autoArchive: { type: Boolean, default: true },
  maxFileSize: { type: Number, default: 10 },
  smtpHost: { type: String, default: '' },
  smtpPort: { type: Number, default: 587 },
  smtpUsername: { type: String, default: '' },
  useSsl: { type: Boolean, default: true },
  twilioAccountSid: { type: String, default: '' },
  twilioAuthToken: { type: String, default: '' },
  twilioPhoneNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const AppSettings = model('AppSettings', AppSettingsSchema);
module.exports = AppSettings;
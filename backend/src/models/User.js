const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'SUPER_ADMIN',
      'ADMINISTRATOR', 
      'AGENT',
      'AGENT_BUREAU_ORDRE',
      'SUPERVISEUR_BUREAU_ORDRE',       // Nouveau: Superviseur bureau d'ordre
      'DIRECTEUR_GENERAL',
      'DIRECTEUR',
      'SOUS_DIRECTEUR'
    ],
    default: 'AGENT'
  },
  profilePhoto: { type: String },
  airport: { 
    type: String, 
    enum: ['ENFIDHA', 'Enfidha', 'MONASTIR', 'Monastir', 'GENERALE', 'Generale'], 
    required: true 
  },
  
  // Champs spécifiques aux directeurs
  directorate: {
    type: String,
    enum: ['GENERAL', 'TECHNIQUE', 'COMMERCIAL', 'FINANCIER', 'OPERATIONS', 'RH'],
    required: function() {
      return this.role && (
        this.role === 'DIRECTEUR' ||
        this.role === 'DIRECTEUR_GENERAL' ||
        this.role === 'SOUS_DIRECTEUR'
      );
    }
  },
  managedDepartments: [{ type: String }], // Départements gérés par le directeur
  delegationLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 1 // Niveau de délégation (1=faible, 5=élevé)
  },
  
  // Préférences de notification spécialisées
  notificationPreferences: {
    correspondanceAssignment: { type: Boolean, default: true },
    deadlineWarnings: { type: Boolean, default: true },
    urgentCorrespondances: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
    delegationRequests: { type: Boolean, default: true }
  },
  
  // Métriques de performance
  performanceMetrics: {
    totalAssigned: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // en heures
    overdueCount: { type: Number, default: 0 },
    lastMetricsUpdate: { type: Date, default: Date.now }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  phone: { type: String },
  department: { type: String },
  position: { type: String },
  lastLogin: { type: Date },
  mustChangePassword: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastPasswordResetRequest: { type: Date },
  
  // Champs pour les mots de passe temporaires
  temporaryPasswordToken: { type: String },
  temporaryPasswordExpires: { type: Date },
  sessionTimeout: { type: Number, default: 25 }, // Timeout de session en minutes
  
  // Champs de notification existants (gardés pour compatibilité)
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true },
  
  // Microsoft Office 365 integration fields
  microsoftAccessToken: { type: String },
  microsoftRefreshToken: { type: String },
  microsoftTokenUpdatedAt: { type: Date },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// Méthodes utilitaires pour les directeurs
UserSchema.methods.isDirector = function() {
  const directorRoles = ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'];
  return this.role && directorRoles.includes(this.role);
};

// Méthodes utilitaires pour les agents de bureau d'ordre
UserSchema.methods.isBureauOrdreAgent = function() {
  const bureauOrdreRoles = ['AGENT_BUREAU_ORDRE', 'SUPERVISEUR_BUREAU_ORDRE'];
  return this.role && bureauOrdreRoles.includes(this.role);
};

UserSchema.methods.isSuperviseurBureauOrdre = function() {
  return this.role === 'SUPERVISEUR_BUREAU_ORDRE';
};

UserSchema.methods.canSuperviseAirport = function(airport) {
  // Le superviseur peut superviser tous les aéroports ou celui spécifié dans son profil
  if (this.role !== 'SUPERVISEUR_BUREAU_ORDRE') return false;
  return !airport || this.airport === 'GENERALE' || this.airport === airport;
};

UserSchema.methods.canManageDepartment = function(department) {
  return this.managedDepartments && this.managedDepartments.includes(department);
};

UserSchema.methods.getDirectorateType = function() {
  if (!this.isDirector()) return null;
  return this.role.replace('DIRECTEUR_', '');
};

UserSchema.methods.updatePerformanceMetrics = function(metrics) {
  this.performanceMetrics = {
    ...this.performanceMetrics,
    ...metrics,
    lastMetricsUpdate: new Date()
  };
  return this.save();
};

UserSchema.methods.getNotificationPreference = function(type) {
  return this.notificationPreferences && this.notificationPreferences[type];
};

// Méthodes statiques pour les requêtes directeurs
UserSchema.statics.findDirectors = function(directorate = null) {
  const query = { role: { $regex: '^DIRECTEUR_' } };
  if (directorate) {
    query.directorate = directorate.toUpperCase();
  }
  return this.find(query);
};

UserSchema.statics.findByDirectorate = function(directorate) {
  return this.find({ 
    directorate: directorate.toUpperCase(),
    isActive: true 
  });
};

UserSchema.statics.findDirectorForDepartment = function(department) {
  return this.findOne({
    managedDepartments: department,
    isActive: true
  });
};

const User = model('User', UserSchema);
module.exports = User;
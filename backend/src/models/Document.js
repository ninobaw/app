const { Schema, model } = require('mongoose');

// Schéma pour les permissions des utilisateurs
const PermissionSchema = new Schema({
  user: { type: String, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['viewer', 'editor', 'owner'],
    default: 'viewer'
  }
}, { _id: false });

// Schéma pour le versionnage
const VersionSchema = new Schema({
  number: { type: Number, required: true },
  content: { type: String, required: true },
  title: { type: String },
  status: { type: String },
  comment: { type: String },
  updatedBy: { type: String, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const DocumentSchema = new Schema({
  _id: { 
    type: String, 
    default: () => require('uuid').v4()
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: [
      'FORMULAIRE_DOC', 
      'QUALITE_DOC', 
      'NOUVEAU_DOC', 
      'GENERAL', 
      'TEMPLATE',
      'CORRESPONDANCE',
      'PROCES_VERBAL'
    ],
    required: true 
  },
  content: { 
    type: String,
    default: ''
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'],
    default: 'DRAFT' 
  },
  airport: { 
    type: String, 
    enum: ['ENFIDHA', 'MONASTIR', 'GENERALE'],
    required: true 
  },
  author: {
    type: String,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: String,
    ref: 'User',
    required: true
  },
  // Gestion des versions
  currentVersion: { type: Number, default: 1 },
  versions: [VersionSchema],
  
  // Métadonnées du document
  metadata: {
    reference: { type: String },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    dueDate: { type: Date },
    tags: [{ type: String }],
    companyCode: { type: String },
    scopeCode: { type: String },
    departmentCode: { type: String },
    subDepartmentCode: { type: String },
    documentTypeCode: { type: String },
    languageCode: { type: String },
    sequenceNumber: { type: Number },
    // Nouveaux champs pour le suivi des révisions
    lastRevisionDate: { type: Date },
    revisionNumber: { type: Number, default: 0 },
    revisionComment: { type: String }
  },
  
  // Gestion des fichiers
  filePath: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  
  // Gestion des accès
  isPublic: { type: Boolean, default: false },
  permissions: [PermissionSchema],
  
  // Suivi d'activité
  viewsCount: { type: Number, default: 0 },
  downloadsCount: { type: Number, default: 0 },
  
  // QR Code unique pour chaque document
  qrCode: { 
    type: String, 
    unique: true,
    default: function() {
      return require('uuid').v4(); // Générer un QR code unique
    }
  },
  
  // Intégrations
  microsoftDriveItemId: { type: String },
  microsoftWebUrl: { type: String },
  lastSyncedAt: { type: Date },
  
  // Validation
  approvedBy: { 
    type: String, 
    ref: 'User' 
  },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  
  // Métadonnées système
  isTemplate: { type: Boolean, default: false },
  template: {
    type: String,
    ref: 'Document'
  },
  relatedDocuments: [{
    type: String,
    ref: 'Document'
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche
DocumentSchema.index({ title: 'text', 'metadata.tags': 'text' });
DocumentSchema.index({ type: 1, status: 1 });
DocumentSchema.index({ author: 1 });
DocumentSchema.index({ 'permissions.user': 1 });

// Méthodes d'instance
DocumentSchema.methods.canView = function(userId) {
  if (this.isPublic) return true;
  if (this.author.equals(userId)) return true;
  return this.permissions.some(p => p.user.equals(userId));
};

DocumentSchema.methods.canEdit = function(userId) {
  if (this.author.equals(userId)) return true;
  return this.permissions.some(p => 
    p.user.equals(userId) && ['editor', 'owner'].includes(p.role)
  );
};

DocumentSchema.methods.canDelete = function(userId) {
  if (this.author.equals(userId)) return true;
  return this.permissions.some(p => 
    p.user.equals(userId) && p.role === 'owner'
  );
};

// Middleware pour la gestion des versions (désactivé car géré manuellement dans les routes)
// DocumentSchema.pre('save', async function(next) {
//   if (this.isModified('content')) {
//     if (!this.isNew) {
//       this.currentVersion += 1;
//       this.versions.push({
//         number: this.currentVersion - 1,
//         content: this.content,
//         updatedBy: this.updatedBy
//       });
//     }
//   }
//   next();
// });

// Méthodes d'instance pour le versioning
DocumentSchema.methods.createVersion = function(comment = 'Version automatique') {
  this.versions.push({
    number: this.currentVersion,
    content: this.content,
    title: this.title,
    status: this.status,
    comment: comment,
    updatedBy: this.updatedBy,
    updatedAt: this.updatedAt || new Date()
  });
  this.currentVersion += 1;
  return this.currentVersion;
};

DocumentSchema.methods.getVersionHistory = function() {
  return this.versions.sort((a, b) => b.number - a.number);
};

DocumentSchema.methods.revertToVersion = function(versionNumber) {
  const version = this.versions.find(v => v.number === versionNumber);
  if (!version) {
    throw new Error(`Version ${versionNumber} introuvable`);
  }
  
  // Sauvegarder la version actuelle avant de revenir en arrière
  this.createVersion(`Revert vers version ${versionNumber}`);
  
  // Restaurer les données de la version demandée
  this.content = version.content;
  this.title = version.title || this.title;
  this.status = version.status || this.status;
  
  return this;
};

const Document = model('Document', DocumentSchema);
module.exports = Document;
const mongoose = require('mongoose');

const responseDraftSchema = new mongoose.Schema({
  // Référence à la correspondance originale
  correspondanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Correspondance',
    required: true
  },

  // Contenu du draft
  content: {
    type: String,
    required: true,
    trim: true
  },

  // Priorité de la réponse
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },

  // Temps estimé pour la réponse (en jours)
  estimatedResponseTime: {
    type: Number,
    default: 3
  },

  // Notes internes pour le DG
  notes: {
    type: String,
    trim: true
  },

  // Statut du draft
  status: {
    type: String,
    enum: [
      'DRAFT_SAVED',        // Sauvegardé mais pas encore soumis
      'DRAFT_PENDING',      // Soumis et en attente d'approbation
      'DRAFT_APPROVED',     // Approuvé par le DG
      'DRAFT_REJECTED',     // Rejeté par le DG
      'DRAFT_NEEDS_REVISION', // Demande de modification
      'DRAFT_SENT'          // Réponse envoyée
    ],
    default: 'DRAFT_SAVED'
  },

  // Qui a créé le draft
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Qui doit approuver (généralement le DG)
  requiredApprovals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Historique des approbations/rejets
  approvalHistory: [{
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'NEEDS_REVISION']
    },
    comments: String,
    actionDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Consignes du DG (avant ou après soumission)
  dgInstructions: [{
    instruction: {
      type: String,
      required: true
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    givenAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['PROACTIVE', 'REACTIVE'], // Proactive = avant draft, Reactive = après draft
      default: 'REACTIVE'
    }
  }],

  // Versions du draft (pour historique des modifications)
  versions: [{
    content: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    changeReason: String
  }],

  // Fichiers attachés au draft
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Dates importantes
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  sentAt: Date,

  // Métadonnées
  metadata: {
    originalDeadline: Date,
    extendedDeadline: Date,
    urgencyLevel: {
      type: String,
    },
    departmentConcerned: String,
    externalEntities: [String] // Entités externes concernées
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
responseDraftSchema.index({ correspondanceId: 1 });
responseDraftSchema.index({ submittedBy: 1 });
responseDraftSchema.index({ status: 1 });
responseDraftSchema.index({ submittedAt: -1 });

// Virtuals
responseDraftSchema.virtual('isApproved').get(function() {
  return this.status === 'DRAFT_APPROVED';
});

responseDraftSchema.virtual('isPending').get(function() {
  return this.status === 'DRAFT_PENDING';
});

responseDraftSchema.virtual('needsRevision').get(function() {
  return this.status === 'DRAFT_NEEDS_REVISION';
});

responseDraftSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.submittedAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.submittedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Méthodes d'instance
responseDraftSchema.methods.approve = function(approvedBy, comments = '') {
  this.status = 'DRAFT_APPROVED';
  this.approvedAt = new Date();
  
  this.approvalHistory.push({
    approvedBy,
    action: 'APPROVED',
    comments,
    actionDate: new Date()
  });
  
  return this.save();
};

responseDraftSchema.methods.reject = function(rejectedBy, comments = '') {
  this.status = 'DRAFT_REJECTED';
  this.rejectedAt = new Date();
  
  this.approvalHistory.push({
    approvedBy: rejectedBy,
    action: 'REJECTED',
    comments,
    actionDate: new Date()
  });
  
  return this.save();
};

responseDraftSchema.methods.requestRevision = function(requestedBy, comments = '') {
  this.status = 'DRAFT_NEEDS_REVISION';
  
  this.approvalHistory.push({
    approvedBy: requestedBy,
    action: 'NEEDS_REVISION',
    comments,
    actionDate: new Date()
  });
  
  return this.save();
};

responseDraftSchema.methods.addInstruction = function(instruction, givenBy, type = 'REACTIVE') {
  this.dgInstructions.push({
    instruction,
    givenBy,
    givenAt: new Date(),
    type
  });
  
  return this.save();
};

responseDraftSchema.methods.createVersion = function(newContent, modifiedBy, changeReason = '') {
  // Sauvegarder la version actuelle
  this.versions.push({
    content: this.content,
    modifiedBy,
    modifiedAt: new Date(),
    changeReason
  });
  
  // Mettre à jour le contenu
  this.content = newContent;
  
  return this.save();
};

// Méthodes statiques
responseDraftSchema.statics.findByCorrespondance = function(correspondanceId) {
  return this.find({ correspondanceId })
    .populate('submittedBy', 'firstName lastName email role')
    .populate('requiredApprovals', 'firstName lastName email role')
    .populate('approvalHistory.approvedBy', 'firstName lastName email role')
    .populate('dgInstructions.givenBy', 'firstName lastName email role')
    .sort({ createdAt: -1 });
};

responseDraftSchema.statics.findPendingForApproval = function(approverId) {
  return this.find({ 
    status: 'DRAFT_PENDING',
    requiredApprovals: approverId 
  })
    .populate('correspondanceId', 'subject from_address priority response_deadline')
    .populate('submittedBy', 'firstName lastName email role directorate')
    .sort({ submittedAt: 1 }); // Plus anciens en premier
};

responseDraftSchema.statics.findByDirector = function(directorId) {
  return this.find({ submittedBy: directorId })
    .populate('correspondanceId', 'subject from_address priority response_deadline')
    .populate('requiredApprovals', 'firstName lastName email role')
    .sort({ createdAt: -1 });
};

// Middleware pre-save
responseDraftSchema.pre('save', function(next) {
  // Mettre à jour submittedAt quand le statut passe à DRAFT_PENDING
  if (this.isModified('status') && this.status === 'DRAFT_PENDING' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  next();
});

// Middleware post-save pour notifications
responseDraftSchema.post('save', async function(doc) {
  // Envoyer des notifications selon le statut
  try {
    const NotificationService = require('../services/notificationService');
    
    if (doc.status === 'DRAFT_PENDING') {
      // Notifier le DG qu'un nouveau draft est en attente
      await NotificationService.notifyDraftSubmission(doc);
    } else if (doc.status === 'DRAFT_APPROVED') {
      // Notifier le directeur que son draft est approuvé
      await NotificationService.notifyDraftApproval(doc);
    } else if (doc.status === 'DRAFT_REJECTED' || doc.status === 'DRAFT_NEEDS_REVISION') {
      // Notifier le directeur du rejet ou demande de révision
      await NotificationService.notifyDraftRejection(doc);
    }
  } catch (error) {
    console.error('Erreur notification draft:', error);
  }
});

module.exports = mongoose.model('ResponseDraft', responseDraftSchema);

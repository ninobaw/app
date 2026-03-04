const mongoose = require('mongoose');

// États du workflow de correspondance
const WorkflowStatus = {
  CREATED: 'CREATED',                    // Correspondance créée par bureau d'ordre
  ASSIGNED_TO_DIRECTOR: 'ASSIGNED_TO_DIRECTOR', // Assignée au directeur/sous-directeur
  DIRECTOR_DRAFT: 'DIRECTOR_DRAFT',     // Directeur rédige proposition
  DG_REVIEW: 'DG_REVIEW',              // DG examine la proposition
  DG_FEEDBACK: 'DG_FEEDBACK',          // DG donne feedback/modifications
  DIRECTOR_REVISION: 'DIRECTOR_REVISION', // Directeur révise selon feedback
  DG_APPROVED: 'DG_APPROVED',          // DG approuve la proposition finale
  SUPERVISOR_NOTIFIED: 'SUPERVISOR_NOTIFIED', // Superviseur bureau d'ordre notifié
  RESPONSE_PREPARED: 'RESPONSE_PREPARED', // Réponse préparée par superviseur
  RESPONSE_SENT: 'RESPONSE_SENT'       // Réponse envoyée
};

// Types d'actions dans le workflow
const ActionType = {
  CREATE: 'CREATE',                    // Création de correspondance par bureau d'ordre
  ASSIGN_TO_DIRECTOR: 'ASSIGN_TO_DIRECTOR', // Assignation au directeur par bureau d'ordre
  DIRECTOR_DRAFT: 'DIRECTOR_DRAFT',    // Soumission de proposition par directeur
  DG_COMMENT: 'DG_COMMENT',           // Commentaire/feedback DG
  DG_REQUEST_REVISION: 'DG_REQUEST_REVISION', // DG demande révision
  DIRECTOR_REVISION: 'DIRECTOR_REVISION', // Directeur révise la proposition
  DG_APPROVE: 'DG_APPROVE',           // Approbation finale DG
  NOTIFY_SUPERVISOR: 'NOTIFY_SUPERVISOR', // Notification au superviseur
  PREPARE_RESPONSE: 'PREPARE_RESPONSE', // Préparation réponse par superviseur
  SEND_RESPONSE: 'SEND_RESPONSE'      // Envoi de la réponse finale
};

// Schéma pour une action du workflow
const WorkflowActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: Object.values(ActionType),
    required: true
  },
  performedBy: {
    type: String,
    ref: 'User',
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  comment: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: String,
    ref: 'User'
  },
  draftResponse: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: String,
      ref: 'User'
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Schéma principal du workflow
const CorrespondenceWorkflowSchema = new mongoose.Schema({
  correspondanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Correspondance',
    required: true
  },
  currentStatus: {
    type: String,
    enum: Object.values(WorkflowStatus),
    default: WorkflowStatus.CREATED
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  // Acteurs du workflow
  bureauOrdreAgent: {
    type: String,
    ref: 'User',
    required: true // Agent qui crée la correspondance
  },
  superviseurBureauOrdre: {
    type: String,
    ref: 'User' // Superviseur du bureau d'ordre
  },
  assignedDirector: {
    type: String,
    ref: 'User' // Directeur/sous-directeur assigné
  },
  directeurGeneral: {
    type: String,
    ref: 'User',
    required: true
  },
  // Versions des propositions de réponse
  draftVersions: [{
    version: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String
    }],
    dgFeedback: String, // Feedback du DG sur cette version
    status: {
      type: String,
      enum: ['DRAFT', 'UNDER_REVIEW', 'NEEDS_REVISION', 'APPROVED'],
      default: 'DRAFT'
    }
  }],
  currentDraftVersion: {
    type: Number,
    default: 0
  },
  finalResponse: {
    content: String,
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String
    }],
    preparedBy: {
      type: String,
      ref: 'User'
    },
    preparedAt: Date,
    sentAt: Date
  },
  actions: [WorkflowActionSchema],
  deadlines: {
    dgReviewDeadline: Date,
    responseDeadline: Date,
    finalDeadline: Date
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  // Messages de chat entre DG et Directeur
  chatMessages: [{
    from: {
      type: String,
      ref: 'User',
      required: true
    },
    to: {
      type: String,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    draftVersion: String, // Version de la proposition associée
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  // ✅ NOUVEAU CHAMP : Propositions de réponse des directeurs
  responseDrafts: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    directorId: {
      type: String,
      ref: 'User',
      required: true
    },
    directorName: {
      type: String,
      required: true
    },
    directorate: {
      type: String
    },
    responseContent: {
      type: String,
      required: true
    },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String
    }],
    comments: {
      type: String
    },
    isUrgent: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['PENDING_DG_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED'],
      default: 'PENDING_DG_REVIEW'
    },
    dgFeedbacks: [{
      dgId: {
        type: String,
        ref: 'User'
      },
      action: {
        type: String,
        enum: ['APPROVE', 'REQUEST_REVISION', 'REJECT']
      },
      feedback: String,
      revisionRequests: [String],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    revisionHistory: [{
      revisionDate: {
        type: Date,
        default: Date.now
      },
      previousContent: String,
      revisionComments: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
// correspondanceId déjà indexé via unique: true
CorrespondenceWorkflowSchema.index({ currentStatus: 1 });
CorrespondenceWorkflowSchema.index({ assignedDirector: 1 });
CorrespondenceWorkflowSchema.index({ directeurGeneral: 1 });
CorrespondenceWorkflowSchema.index({ createdAt: -1 });

// Méthodes du modèle
CorrespondenceWorkflowSchema.methods.addAction = function(actionData) {
  this.actions.push(actionData);
  return this.save();
};

CorrespondenceWorkflowSchema.methods.updateStatus = function(newStatus) {
  this.currentStatus = newStatus;
  return this.save();
};

CorrespondenceWorkflowSchema.methods.getLastAction = function() {
  return this.actions[this.actions.length - 1];
};

CorrespondenceWorkflowSchema.methods.getActionsByType = function(actionType) {
  return this.actions.filter(action => action.actionType === actionType);
};

// Méthodes statiques
CorrespondenceWorkflowSchema.statics.getByStatus = function(status) {
  return this.find({ currentStatus: status, isActive: true })
    .populate('correspondanceId')
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedDirector', 'firstName lastName email')
    .populate('directeurGeneral', 'firstName lastName email')
    .populate('actions.performedBy', 'firstName lastName email');
};

CorrespondenceWorkflowSchema.statics.getByAssignee = function(userId) {
  return this.find({ assignedDirector: userId, isActive: true })
    .populate('correspondanceId')
    .populate('createdBy', 'firstName lastName email')
    .populate('directeurGeneral', 'firstName lastName email')
    .populate('actions.performedBy', 'firstName lastName email');
};

CorrespondenceWorkflowSchema.statics.getForDirecteurGeneral = function(dgId) {
  return this.find({ 
    directeurGeneral: dgId, 
    currentStatus: { $in: [WorkflowStatus.DG_REVIEW, WorkflowStatus.DG_FEEDBACK] },
    isActive: true 
  })
    .populate('correspondanceId')
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedDirector', 'firstName lastName email')
    .populate('actions.performedBy', 'firstName lastName email');
};

// Validation des transitions d'état
CorrespondenceWorkflowSchema.methods.canTransitionTo = function(newStatus) {
  const validTransitions = {
    [WorkflowStatus.CREATED]: [WorkflowStatus.ASSIGNED_TO_DIRECTOR],
    [WorkflowStatus.ASSIGNED_TO_DIRECTOR]: [WorkflowStatus.DIRECTOR_DRAFT],
    [WorkflowStatus.DIRECTOR_DRAFT]: [WorkflowStatus.DG_REVIEW],
    [WorkflowStatus.DG_REVIEW]: [WorkflowStatus.DG_FEEDBACK, WorkflowStatus.DG_APPROVED],
    [WorkflowStatus.DG_FEEDBACK]: [WorkflowStatus.DIRECTOR_REVISION],
    [WorkflowStatus.DIRECTOR_REVISION]: [WorkflowStatus.DG_REVIEW],
    [WorkflowStatus.DG_APPROVED]: [WorkflowStatus.SUPERVISOR_NOTIFIED],
    [WorkflowStatus.SUPERVISOR_NOTIFIED]: [WorkflowStatus.RESPONSE_PREPARED],
    [WorkflowStatus.RESPONSE_PREPARED]: [WorkflowStatus.RESPONSE_SENT],
    [WorkflowStatus.RESPONSE_SENT]: [] // État final
  };

  return validTransitions[this.currentStatus]?.includes(newStatus) || false;
};

// Méthodes pour le système de chat
CorrespondenceWorkflowSchema.methods.addChatMessage = async function(fromUserId, toUserId, message, draftVersion, attachments = []) {
  console.log(`💬 [Model] Ajout message chat:`);
  console.log(`   - De: ${fromUserId}`);
  console.log(`   - Vers: ${toUserId}`);
  console.log(`   - Message: ${message.substring(0, 50)}...`);
  console.log(`   - Version: ${draftVersion || 'N/A'}`);
  console.log(`   - Messages avant ajout: ${this.chatMessages.length}`);
  
  const newMessage = {
    from: fromUserId,
    to: toUserId,
    message,
    draftVersion,
    attachments,
    timestamp: new Date(),
    isRead: false
  };
  
  this.chatMessages.push(newMessage);
  console.log(`   - Messages après ajout: ${this.chatMessages.length}`);
  console.log(`   - Dernier message ajouté: ${newMessage.message.substring(0, 30)}...`);
  
  try {
    const savedWorkflow = await this.save();
    console.log(`✅ [Model] Message sauvegardé avec succès. Total messages: ${savedWorkflow.chatMessages.length}`);
    return savedWorkflow;
  } catch (error) {
    console.error(`❌ [Model] Erreur sauvegarde message:`, error);
    throw error;
  }
};

CorrespondenceWorkflowSchema.methods.markMessagesAsRead = function(userId) {
  this.chatMessages.forEach(msg => {
    if (msg.to.toString() === userId.toString() && !msg.isRead) {
      msg.isRead = true;
    }
  });
  return this.save();
};

CorrespondenceWorkflowSchema.methods.getUnreadMessagesCount = function(userId) {
  return this.chatMessages.filter(msg => 
    msg.to.toString() === userId.toString() && !msg.isRead
  ).length;
};

// Méthodes pour les versions de proposition
CorrespondenceWorkflowSchema.methods.addDraftVersion = function(content, createdBy, attachments = []) {
  const newVersion = this.currentDraftVersion + 1;
  this.draftVersions.push({
    version: newVersion,
    content,
    createdBy,
    attachments,
    status: 'DRAFT'
  });
  this.currentDraftVersion = newVersion;
  return this.save();
};

CorrespondenceWorkflowSchema.methods.getCurrentDraft = function() {
  return this.draftVersions.find(draft => draft.version === this.currentDraftVersion);
};

CorrespondenceWorkflowSchema.methods.updateDraftStatus = function(version, status, dgFeedback = null) {
  const draft = this.draftVersions.find(d => d.version === version);
  if (draft) {
    draft.status = status;
    if (dgFeedback) {
      draft.dgFeedback = dgFeedback;
    }
  }
  return this.save();
};

const CorrespondenceWorkflow = mongoose.model('CorrespondenceWorkflow', CorrespondenceWorkflowSchema);

module.exports = {
  CorrespondenceWorkflow,
  WorkflowStatus,
  ActionType
};

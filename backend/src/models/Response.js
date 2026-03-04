const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  correspondanceId: {
    type: String,
    required: true,
    ref: 'Correspondance',
    index: true
  },
  supervisorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    name: String,
    path: String,
    size: Number,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dischargeFiles: [{
    name: String,
    path: String,
    size: Number,
    type: String,
    category: {
      type: String,
      enum: ['DELIVERY_RECEIPT', 'READ_RECEIPT', 'ACKNOWLEDGMENT', 'POSTAL_RECEIPT', 'OTHER'],
      default: 'DELIVERY_RECEIPT'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  deliveryMethod: {
    type: String,
    enum: ['EMAIL', 'POSTAL', 'HAND_DELIVERY', 'FAX', 'COURIER'],
    default: 'EMAIL'
  },
  recipientEmail: String,
  recipientAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
    fullAddress: String
  },
  trackingNumber: String,
  deliveryNotes: String,
  sentAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'],
    default: 'SENT'
  },
  deliveryStatus: {
    type: String,
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'],
    default: 'PENDING'
  },
  readStatus: {
    type: String,
    enum: ['UNREAD', 'READ', 'ACKNOWLEDGED'],
    default: 'UNREAD'
  },
  deliveryConfirmation: {
    confirmedAt: Date,
    confirmedBy: String,
    confirmationMethod: {
      type: String,
      enum: ['EMAIL_RECEIPT', 'POSTAL_RECEIPT', 'PHONE_CONFIRMATION', 'MANUAL_CONFIRMATION']
    },
    confirmationDocument: String,
    notes: String
  },
  basedOnDraftId: String,
  metadata: {
    originalCorrespondanceId: String,
    workflowCompletedAt: Date,
    totalProcessingTime: Number, // en millisecondes
    participantsCount: Number,
    priority: String,
    urgencyLevel: Number
  },
  // Historique des modifications et statuts
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: String,
    reason: String,
    notes: String
  }],
  // Statistiques de suivi
  tracking: {
    emailOpened: {
      openedAt: Date,
      openCount: {
        type: Number,
        default: 0
      },
      lastOpenedAt: Date
    },
    linkClicks: [{
      url: String,
      clickedAt: Date,
      userAgent: String
    }],
    downloadHistory: [{
      attachmentName: String,
      downloadedAt: Date,
      userAgent: String,
      ipAddress: String
    }]
  }
}, {
  timestamps: true,
  collection: 'responses'
});

// Index pour les requêtes fréquentes
responseSchema.index({ correspondanceId: 1, sentAt: -1 });
responseSchema.index({ supervisorId: 1, sentAt: -1 });
responseSchema.index({ status: 1, deliveryStatus: 1 });
responseSchema.index({ 'metadata.originalCorrespondanceId': 1 });

// Méthodes du modèle
responseSchema.methods.updateDeliveryStatus = function(newStatus, confirmation = {}) {
  this.deliveryStatus = newStatus;
  
  if (confirmation.confirmedAt) {
    this.deliveryConfirmation = {
      ...this.deliveryConfirmation,
      ...confirmation
    };
  }
  
  this.statusHistory.push({
    status: `DELIVERY_${newStatus}`,
    changedAt: new Date(),
    changedBy: confirmation.confirmedBy,
    reason: `Delivery status updated to ${newStatus}`,
    notes: confirmation.notes
  });
  
  return this.save();
};

responseSchema.methods.markAsRead = function(readBy, method = 'EMAIL_RECEIPT') {
  this.readStatus = 'READ';
  this.tracking.emailOpened = {
    openedAt: new Date(),
    openCount: (this.tracking.emailOpened?.openCount || 0) + 1,
    lastOpenedAt: new Date()
  };
  
  this.statusHistory.push({
    status: 'READ',
    changedAt: new Date(),
    changedBy: readBy,
    reason: 'Response marked as read',
    notes: `Read via ${method}`
  });
  
  return this.save();
};

// Méthodes statiques
responseSchema.statics.findByCorrespondance = function(correspondanceId) {
  return this.findOne({ correspondanceId }).populate('supervisorId', 'firstName lastName email');
};

responseSchema.statics.getDeliveryStatistics = function(dateRange = {}) {
  const matchStage = {};
  
  if (dateRange.start && dateRange.end) {
    matchStage.sentAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$deliveryStatus',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$metadata.totalProcessingTime' }
      }
    }
  ]);
};

module.exports = mongoose.model('Response', responseSchema);

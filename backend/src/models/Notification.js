const { Schema, model } = require('mongoose');

const NotificationSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'], 
    default: 'info' 
  },
  isRead: { type: Boolean, default: false },
  entityId: { type: String }, // New field: ID of the entity (document, action, etc.)
  entityType: { // New field: Type of the entity (e.g., 'DOCUMENT', 'ACTION', 'CORRESPONDANCE', 'PROCES_VERBAL')
    type: String, 
    enum: ['USER', 'DOCUMENT', 'ACTION', 'TASK', 'CORRESPONDANCE', 'PROCES_VERBAL', 'REPORT', 'SETTINGS', 'CORRESPONDANCE_REPLY'],
  },
  // Champs spécifiques pour les notifications de correspondance
  correspondanceId: { type: String, ref: 'Correspondance' }, // ID de la correspondance concernée
  actionRequired: { type: Boolean, default: false }, // Si une action est requise
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const Notification = model('Notification', NotificationSchema);
module.exports = Notification;
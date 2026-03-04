const { Schema, model } = require('mongoose');

const ActionSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: [{ type: String, ref: 'User' }],
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  parentDocumentId: { type: String, ref: 'Document' },
  progress: { type: Number, default: 0 },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  authorId: { type: String, ref: 'User', required: true }, // Nouveau champ: ID de l'auteur de l'action
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const Action = model('Action', ActionSchema);
module.exports = Action;
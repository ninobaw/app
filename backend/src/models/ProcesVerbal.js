const { Schema, model } = require('mongoose');

// Embedded schema for ActionDecidee (re-used from Correspondance)
const ActionDecideeSchema = new Schema({
  titre: { type: String, required: true },
  description: { type: String },
  responsable: [{ type: String, required: true }], // Changed to array of Strings
  echeance: { type: String, required: true },
  priorite: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  statut: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'PENDING' 
  },
  collaborateurs: [{ type: String }],
});

const ProcesVerbalSchema = new Schema({
  _id: { type: String, required: true },
  // Removed documentId as ProcesVerbal will now be a standalone entity
  title: { type: String, required: true }, // Added title directly to ProcesVerbal
  authorId: { type: String, ref: 'User', required: true }, // Added authorId directly
  qrCode: { type: String, unique: true, required: true }, // Added qrCode directly
  filePath: { type: String }, // Added filePath directly
  fileType: { type: String }, // Added fileType directly
  version: { type: Number, default: 1 }, // Added version directly
  viewsCount: { type: Number, default: 0 }, // Added viewsCount directly
  downloadsCount: { type: Number, default: 0 }, // Added downloadsCount directly

  meetingDate: { type: Date, required: true },
  participants: [{ type: String }],
  agenda: { type: String, required: true },
  decisions: { type: String, required: true },
  location: { type: String, required: true },
  meetingType: { type: String, required: true },
  airport: { 
    type: String, 
    enum: ['ENFIDHA', 'MONASTIR', 'GENERALE'], 
    required: true 
  },
  nextMeetingDate: { type: Date },
  actionsDecidees: [ActionDecideeSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // Added updatedAt
  // New codification fields
  company_code: { type: String },
  scope_code: { type: String },
  department_code: { type: String },
  sub_department_code: { type: String },
  language_code: { type: String },
  sequence_number: { type: Number },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }); // Ensure timestamps are handled

const ProcesVerbal = model('ProcesVerbal', ProcesVerbalSchema);
module.exports = ProcesVerbal;
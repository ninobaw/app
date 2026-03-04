const { Schema, model } = require('mongoose');

const DocumentCodeComponentSchema = new Schema({
  code: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String },
}, { _id: false }); // Do not create _id for sub-documents

const DocumentCodeConfigSchema = new Schema({
  _id: { type: String, required: true },
  documentTypes: [DocumentCodeComponentSchema],
  departments: [DocumentCodeComponentSchema],
  subDepartments: [DocumentCodeComponentSchema],
  languages: [DocumentCodeComponentSchema],
  scopes: [DocumentCodeComponentSchema],
  sequenceCounters: { 
    type: Map, 
    of: Number, 
    default: {} 
  }, // Stores sequence numbers for different code combinations
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const DocumentCodeConfig = model('DocumentCodeConfig', DocumentCodeConfigSchema);
module.exports = DocumentCodeConfig;
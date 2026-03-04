const { DocumentCodeConfig } = require('../models/DocumentCodeConfig.js');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate a document/correspondence code and update sequence
const generateCodeAndSequence = async (
  entityType, // e.g., 'DOCUMENT', 'CORRESPONDANCE', 'PROCES_VERBAL'
  company_code,
  scope_code,
  department_code,
  sub_department_code,
  document_type_code, // For documents
  correspondence_or_pv_type_code, // For correspondences (IN/OUT) or PVs (PV)
  language_code
) => {
  const config = await DocumentCodeConfig.findOne({});
  if (!config) {
    throw new Error('Document code configuration not found.');
  }

  let typeCode = '';
  if (entityType === 'DOCUMENT') {
    typeCode = document_type_code;
  } else if (entityType === 'CORRESPONDANCE') {
    typeCode = correspondence_or_pv_type_code; // Use IN/OUT for correspondence type code
  } else if (entityType === 'PROCES_VERBAL') {
    typeCode = correspondence_or_pv_type_code; // Use PV for proces verbal type code
  } else {
    throw new Error('Invalid entityType for code generation.');
  }

  // Construct the key for the sequence counter
  const sequenceKey = `${company_code}-${scope_code}-${department_code}-${sub_department_code || 'NA'}-${typeCode}-${language_code}`;
  
  let currentSequence = config.sequenceCounters.get(sequenceKey) || 0;
  currentSequence++;
  
  // Update the sequence counter in the database
  config.sequenceCounters.set(sequenceKey, currentSequence);
  await config.save();

  const paddedSequence = String(currentSequence).padStart(3, '0'); // e.g., 001, 002

  // Construct the full code string
  const generatedCode = `${company_code}-${scope_code}-${department_code}${sub_department_code ? `-${sub_department_code}` : ''}-${typeCode}-${paddedSequence}-${language_code}`;
  
  return { generatedCode, sequence_number: currentSequence };
};

// Helper to generate a simple QR code value (UUID based)
const generateSimpleQRCode = (entityType, entityId) => {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:8080';
  return `${frontendBaseUrl}/public-view/${entityType.toLowerCase()}/${entityId}`;
};

module.exports = { generateCodeAndSequence, generateSimpleQRCode };
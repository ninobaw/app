const path = require('path');
const fs = require('fs');

const getFinalTargetDir = (baseUploadsDir, entityType, scopeCode, departmentCode, correspondenceType) => {
  let finalDir = baseUploadsDir;

  // For templates, they go directly into the 'templates' folder
  if (entityType.toLowerCase() === 'templates') {
    return path.join(baseUploadsDir, 'templates');
  }

  // For correspondences, use a specific structure: uploads/correspondances/<airportCode>/<typeFolder>
  if (entityType.toLowerCase() === 'correspondances' && scopeCode && correspondenceType) {
    const typeFolder = correspondenceType === 'INCOMING' ? 'Arrivee' : 'Depart';
    finalDir = path.join(baseUploadsDir, 'correspondances', scopeCode, typeFolder);
  } 
  // For other document types, use the requested structure: uploads/<scope>/<department>/<documentType>
  else if (scopeCode && departmentCode && entityType) {
    finalDir = path.join(baseUploadsDir, scopeCode, departmentCode, entityType);
  } else {
    // Fallback for general documents or if specific codes are missing
    finalDir = path.join(baseUploadsDir, 'general'); // Fallback to a 'general' folder
  }
  return finalDir;
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Dossier créé: ${dirPath}`);
  }
};

module.exports = { getFinalTargetDir, ensureDirectoryExists };
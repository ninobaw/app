const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Correspondance = require('../models/Correspondance');
const { generateQRCode } = require('./qrCodeGenerator');

/**
 * Importe les correspondances depuis un fichier CSV généré par Power Automate
 * Compatible avec le script Power Automate existant sans modifications
 */
class CorrespondanceImporter {
  
  /**
   * Mappe les colonnes du CSV Power Automate vers le modèle SGDO
   */
  static mapPowerAutomateToSGDO(row) {
    // Génération d'un ID unique
    const id = uuidv4();
    const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Mapping des priorités
    const priorityMap = {
      'High': 'HIGH',
      'Normal': 'MEDIUM', 
      'Low': 'LOW'
    };
    
    // Mapping des aéroports
    const airportMap = {
      'NBE': 'ENFIDHA',
      'MONASTIR': 'MONASTIR',
      'GENERALE': 'GENERALE'
    };
    
    // Détermination du statut basé sur le contenu
    let status = 'PENDING';
    if (row.subject && row.subject.toLowerCase().includes('fyi')) {
      status = 'INFORMATIF';
    } else if (row.subject && row.subject.toLowerCase().includes('re:')) {
      status = 'REPLIED';
    }
    
    // Détermination du type basé sur l'expéditeur
    let type = 'INCOMING';
    if (row.from_address && row.from_address.includes('tav.aero')) {
      type = 'OUTGOING';
    }
    
    // Traitement des tags
    const tags = row.tags ? row.tags.split(';').filter(tag => tag.trim()) : [];
    
    return {
      _id: id,
      title: row.title || row.subject || 'Correspondance sans titre',
      authorId: 'system-import', // ID utilisateur par défaut pour l'import
      qrCode: qrCode,
      filePath: row.file_name ? `/uploads/correspondances/${row.file_name}` : null,
      fileType: row.file_name ? row.file_name.split('.').pop() : null,
      version: 1,
      viewsCount: 0,
      downloadsCount: 0,
      type: type,
      code: '', // Sera généré automatiquement par l'application
      fromAddress: row.from_address || '',
      toAddress: row.to_address || '',
      subject: row.subject || '',
      content: row.content || '',
      priority: priorityMap[row.priority] || 'MEDIUM',
      status: status,
      airport: airportMap[row.airport] || 'GENERALE',
      attachments: row.file_name ? [row.file_name] : [],
      actionsDecidees: [],
      tags: tags,
      responseReference: '',
      responseDate: null,
      informationTransmittedTo: '',
      informationAcknowledged: false,
      informationActions: '',
      readBy: [],
      replies: [],
      lastResponseAt: null,
      responseDeadline: null,
      isUrgent: row.subject ? row.subject.toLowerCase().includes('urgent') : false,
      isConfidential: row.subject ? row.subject.toLowerCase().includes('confidentiel') : false,
      relatedDocuments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      company_code: 'TAV',
      scope_code: 'CORR',
      department_code: 'ADMIN',
      sub_department_code: airportMap[row.airport] || 'GEN',
      language_code: 'FR',
      sequence_number: null // Sera généré automatiquement
    };
  }
  
  /**
   * Importe un fichier CSV de correspondances
   */
  static async importFromCSV(filePath, userId = 'system-import') {
    const results = [];
    const errors = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          try {
            // Mapper les données Power Automate vers SGDO
            const correspondanceData = this.mapPowerAutomateToSGDO(row);
            
            // Ajouter l'utilisateur qui fait l'import
            correspondanceData.authorId = userId;
            
            // Créer la correspondance
            const correspondance = new Correspondance(correspondanceData);
            
            // Générer le QR code si nécessaire
            if (!correspondance.qrCode) {
              correspondance.qrCode = await generateQRCode(correspondance._id);
            }
            
            // Sauvegarder
            await correspondance.save();
            results.push(correspondance);
            
          } catch (error) {
            errors.push({
              row: row,
              error: error.message
            });
          }
        })
        .on('end', () => {
          resolve({
            imported: results.length,
            errors: errors.length,
            results: results,
            errorDetails: errors
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  /**
   * Valide les données avant import
   */
  static validateRow(row) {
    const errors = [];
    
    if (!row.title && !row.subject) {
      errors.push('Titre ou sujet requis');
    }
    
    if (!row.from_address) {
      errors.push('Adresse expéditeur requise');
    }
    
    if (!row.to_address) {
      errors.push('Adresse destinataire requise');
    }
    
    if (!row.content) {
      errors.push('Contenu requis');
    }
    
    return errors;
  }
  
  /**
   * Prévisualise l'import sans sauvegarder
   */
  static async previewImport(filePath) {
    const preview = [];
    const errors = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Valider la ligne
            const validationErrors = this.validateRow(row);
            
            if (validationErrors.length > 0) {
              errors.push({
                row: row,
                errors: validationErrors
              });
            } else {
              // Mapper pour prévisualisation
              const mapped = this.mapPowerAutomateToSGDO(row);
              preview.push({
                original: row,
                mapped: mapped
              });
            }
          } catch (error) {
            errors.push({
              row: row,
              error: error.message
            });
          }
        })
        .on('end', () => {
          resolve({
            preview: preview.slice(0, 10), // Limiter à 10 pour prévisualisation
            totalRows: preview.length,
            errors: errors
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

module.exports = CorrespondanceImporter;

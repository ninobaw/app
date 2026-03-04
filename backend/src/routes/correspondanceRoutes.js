const express = require('express');
const router = express.Router();
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const QRCode = require('qrcode'); // Module non installé - commenté temporairement
const axios = require('axios');
const Notification = require('../models/Notification');
const CorrespondanceResponseService = require('../services/correspondanceResponseService');
const DeadlineService = require('../services/deadlineService');
const NotificationService = require('../services/notificationService');
const EmailNotificationService = require('../services/emailNotificationService');
const CorrespondanceAssignmentService = require('../services/correspondanceAssignmentService');
const CorrespondanceWorkflowService = require('../services/correspondanceWorkflowService');
const { generateSimpleQRCode } = require('../utils/codeGenerator');
const { auth, authorizeBureauOrdre, authorizeAirportAccess } = require('../middleware/auth');

/**
 * Génère un code de correspondance selon les spécifications :
 * 
 * ENFIDHA :
 * - Entrante : A-YY-NUMERO (ex: A-24-001)
 * - Sortante : D-YY-NUMERO (ex: D-24-001)
 * 
 * MONASTIR :
 * - Entrante : MA-YY-NUMERO (ex: MA-24-001)
 * - Sortante : MD-YY-NUMERO (ex: MD-24-001)
 * 
 * @param {string} type - 'INCOMING' ou 'OUTGOING'
 * @param {string} airport - 'ENFIDHA' ou 'MONASTIR'
 * @param {number} numero - Numéro séquentiel
 * @returns {string} Code généré
 */
function generateCorrespondanceCode(type, airport, numero) {
  const currentYear = new Date().getFullYear().toString().slice(-2); // Deux derniers chiffres de l'année
  const numeroFormatted = numero.toString().padStart(3, '0'); // Numéro sur 3 chiffres avec zéros
  
  let prefix = '';
  
  if (airport === 'ENFIDHA') {
    prefix = type === 'INCOMING' ? 'A' : 'D';
  } else if (airport === 'MONASTIR') {
    prefix = type === 'INCOMING' ? 'MA' : 'MD';
  } else {
    // Fallback pour autres aéroports
    prefix = type === 'INCOMING' ? 'A' : 'D';
  }
  
  return `${prefix}-${currentYear}-${numeroFormatted}`;
}

/**
 * Obtient le prochain numéro séquentiel pour un type et aéroport donnés
 * @param {string} type - 'INCOMING' ou 'OUTGOING'
 * @param {string} airport - 'ENFIDHA' ou 'MONASTIR'
 * @returns {Promise<number>} Prochain numéro disponible
 */
async function getNextSequentialNumber(type, airport) {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  // Construire le pattern de recherche selon l'aéroport et le type
  let pattern = '';
  if (airport === 'ENFIDHA') {
    pattern = type === 'INCOMING' ? `A-${currentYear}-` : `D-${currentYear}-`;
  } else if (airport === 'MONASTIR') {
    pattern = type === 'INCOMING' ? `MA-${currentYear}-` : `MD-${currentYear}-`;
  }
  
  try {
    // Chercher toutes les correspondances avec ce pattern pour l'année courante
    const existingCodes = await Correspondance.find({
      code: { $regex: `^${pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}` }
    }).select('code').lean();
    
    if (existingCodes.length === 0) {
      return 1; // Premier numéro de l'année
    }
    
    // Extraire les numéros existants et trouver le maximum
    const numbers = existingCodes
      .map(item => {
        const parts = item.code.split('-');
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter(num => !isNaN(num));
    
    const maxNumber = Math.max(...numbers);
    return maxNumber + 1;
    
  } catch (error) {
    console.error('Erreur lors de la récupération du numéro séquentiel:', error);
    return 1; // Fallback au premier numéro
  }
}

/**
 * Valide le format d'un code de correspondance selon les spécifications
 * @param {string} code - Code à valider
 * @param {string} type - 'INCOMING' ou 'OUTGOING'
 * @param {string} airport - 'ENFIDHA' ou 'MONASTIR'
 * @returns {Object} Résultat de validation avec valid (boolean) et message (string)
 */
function validateCodeFormat(code, type, airport) {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      message: 'Le code ne peut pas être vide.'
    };
  }

  const currentYear = new Date().getFullYear().toString().slice(-2);
  let expectedPrefix = '';
  
  // Déterminer le préfixe attendu selon l'aéroport et le type
  if (airport === 'ENFIDHA') {
    expectedPrefix = type === 'INCOMING' ? 'A' : 'D';
  } else if (airport === 'MONASTIR') {
    expectedPrefix = type === 'INCOMING' ? 'MA' : 'MD';
  } else {
    return {
      valid: false,
      message: 'Aéroport non reconnu. Doit être ENFIDHA ou MONASTIR.'
    };
  }

  // Pattern de validation : PREFIX-YY-XXX
  const pattern = new RegExp(`^${expectedPrefix}-\\d{2}-\\d{3}$`);
  
  if (!pattern.test(code)) {
    return {
      valid: false,
      message: `Format invalide. Le code doit respecter le format: ${expectedPrefix}-${currentYear}-XXX (ex: ${expectedPrefix}-${currentYear}-001)`
    };
  }

  // Vérifier que l'année correspond à l'année courante (optionnel, peut être retiré si on veut accepter d'autres années)
  const codeParts = code.split('-');
  const codeYear = codeParts[1];
  
  if (codeYear !== currentYear) {
    return {
      valid: true, // On accepte mais on avertit
      message: `Attention: L'année du code (${codeYear}) ne correspond pas à l'année courante (${currentYear}).`
    };
  }

  return {
    valid: true,
    message: 'Format valide.'
  };
}

// Route pour valider un format de code de correspondance - SAISIE LIBRE TOTALE
router.post('/validate-code', auth, async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('🔍 [VALIDATE-CODE] Code reçu:', code);
    
    // Saisie libre totale - accepter n'importe quel code non vide
    if (!code || !code.trim()) {
      console.log('🔍 [VALIDATE-CODE] Code vide rejeté');
      return res.status(400).json({
        success: false,
        message: 'Le code ne peut pas être vide.'
      });
    }
    
    // Pour la saisie libre, on accepte tout - pas de vérification d'unicité en temps réel
    // L'unicité sera vérifiée seulement lors de la création finale
    console.log('🔍 [VALIDATE-CODE] Code accepté (saisie libre):', code.trim());
    
    res.json({
      success: true,
      message: 'Code accepté - Saisie libre activée',
      isValid: true
    });
    
  } catch (error) {
    console.error('❌ [VALIDATE-CODE] Erreur lors de la validation du code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du code de correspondance'
    });
  }
});

// Routes pour les correspondances

/**
 * @swagger
 * components:
 *   schemas:
 *     Correspondance:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la correspondance
 *         title:
 *           type: string
 *           description: Titre de la correspondance
 *         type:
 *           type: string
 *           enum: [INCOMING, OUTGOING]
 *           description: Type de correspondance (entrante/sortante)
 *         status:
 *           type: string
 *           enum: [PENDING, REPLIED, INFORMATIF, CLOTURER, DRAFT]
 *           description: Statut de la correspondance
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *           description: Niveau de priorité
 *         actionsDecidees:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ActionDecidee'
 *           description: Liste des actions décidées
 *     ActionDecidee:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           description: Description de l'action
 *         responsableId:
 *           type: string
 *           description: ID du responsable de l'action
 *         dateEcheance:
 *           type: string
 *           format: date
 *           description: Date d'échéance de l'action
 *         statut:
 *           type: string
 *           enum: [A_FAIRE, EN_COURS, TERMINE, ANNULE]
 *           description: Statut de l'action
 *         causesRacines:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des causes racines identifiées
 *         personnesConcernees:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des IDs des personnes concernées
 *     Reply:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: Contenu de la réponse
 *         reference:
 *           type: string
 *           description: Référence de la réponse
 *         fileUrl:
 *           type: string
 *           description: URL du fichier joint
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création de la réponse
 * 
 * @swagger
 * tags:
 *   - name: Correspondances
 *     description: Gestion des correspondances et du suivi des réponses
 *   - name: Actions
 *     description: Gestion des actions décidées pour les correspondances
 */
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Route de test SANS authentification (doit être AVANT les autres routes)
router.get('/test-simple-no-auth', async (req, res) => {
  console.log(' [TEST ULTRA SIMPLE] Route appelée sans auth !');
  
  res.json({
    success: true,
    message: 'Route de test fonctionne sans auth !',
    timestamp: new Date().toISOString()
  });
});

// Route de test EMAIL SANS authentification (GET avec paramètre)
router.get('/test-email-get/:email', async (req, res) => {
  try {
    console.log(' [TEST EMAIL GET] Début du test d\'envoi d\'email');
    
    const userEmail = req.params.email;
    console.log(' [TEST] Email reçu:', userEmail);
    
    // Trouver l'utilisateur par email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé avec cet email: ' + userEmail
      });
    }
    
    console.log(' [TEST] Utilisateur trouvé:', user.firstName, user.lastName);
    
    // Créer une correspondance de test
    const testCorrespondance = {
      _id: 'test-id-123',
      subject: 'Test de notification email',
      content: 'Ceci est un test d\'envoi de notification email pour les correspondances.',
      from_address: 'test@example.com',
      to_address: 'destinataire@example.com',
      priority: 'MEDIUM',
      airport: 'ENFIDHA',
      type: 'INCOMING',
      status: 'PENDING',
      toObject: () => ({
        _id: 'test-id-123',
        subject: 'Test de notification email',
        content: 'Ceci est un test d\'envoi de notification email pour les correspondances.',
        from_address: 'test@example.com',
        to_address: 'destinataire@example.com',
        priority: 'MEDIUM',
        airport: 'ENFIDHA',
        type: 'INCOMING',
        status: 'PENDING'
      })
    };

    console.log(' [TEST] Correspondance de test créée');

    // Envoyer l'email de test
    const result = await EmailNotificationService.sendCorrespondanceEmailNotification(
      testCorrespondance,
      [user._id],
      'NEW_CORRESPONDANCE'
    );

    console.log(' [TEST] Résultat du test:', result);

    res.json({
      success: true,
      message: 'Test d\'email effectué avec GET',
      result,
      userEmail,
      userId: user._id
    });

  } catch (error) {
    console.error(' [TEST] Erreur lors du test d\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test d\'email',
      error: error.message
    });
  }
});

// Route de test EMAIL SANS authentification 
router.post('/test-email-no-auth', async (req, res) => {
  try {
    console.log(' [TEST EMAIL NO AUTH] Début du test d\'envoi d\'email');
    
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un userEmail dans le body'
      });
    }
    
    // Trouver l'utilisateur par email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé avec cet email'
      });
    }
    
    console.log(' [TEST] Utilisateur trouvé:', user.firstName, user.lastName);
    
    // Créer une correspondance de test
    const testCorrespondance = {
      _id: 'test-id-123',
      subject: 'Test de notification email',
      content: 'Ceci est un test d\'envoi de notification email pour les correspondances.',
      from_address: 'test@example.com',
      to_address: 'destinataire@example.com',
      priority: 'MEDIUM',
      airport: 'ENFIDHA',
      type: 'INCOMING',
      status: 'PENDING',
      toObject: () => ({
        _id: 'test-id-123',
        subject: 'Test de notification email',
        content: 'Ceci est un test d\'envoi de notification email pour les correspondances.',
        from_address: 'test@example.com',
        to_address: 'destinataire@example.com',
        priority: 'MEDIUM',
        airport: 'ENFIDHA',
        type: 'INCOMING',
        status: 'PENDING'
      })
    };

    console.log(' [TEST] Correspondance de test créée');

    // Envoyer l'email de test
    const result = await EmailNotificationService.sendCorrespondanceEmailNotification(
      testCorrespondance,
      [user._id],
      'NEW_CORRESPONDANCE'
    );

    console.log(' [TEST] Résultat du test:', result);

    res.json({
      success: true,
      message: 'Test d\'email effectué sans auth',
      result,
      userEmail,
      userId: user._id
    });

  } catch (error) {
    console.error(' [TEST] Erreur lors du test d\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test d\'email',
      error: error.message
    });
  }
});

// POST /api/correspondances - Créer une nouvelle correspondance
router.post('/', auth, authorizeBureauOrdre, authorizeAirportAccess, async (req, res) => {
  try {
    console.log('🔍 [CREATE] DEBUG - req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [CREATE] DEBUG - req.user:', req.user);
    const {
      title,
      type,
      from_address,
      to_address,
      subject,
      content,
      priority,
      status,
      airport,
      tags,
      file_name,
      parentCorrespondanceId, // Nouveau: pour les réponses
      responseReference,
      responseDate,
      personnesConcernees, // Nouveau: personnes à notifier
      deposantInfo, // Nouveau: info sur le déposant
      importanceSubject, // Nouveau: importance du sujet
      scannedDocumentPath, // Nouveau: chemin du document scanné
      informationTransmittedTo,
      informationAcknowledged,
      informationActions,
      filePath,
      file_path, // Extraire les deux champs séparément
      fileType,
      attachments,
      actionsDecidees,
      isUrgent,
      isConfidential,
      relatedDocuments,
      responseDeadline,
      code // Code de correspondance (peut être fourni manuellement ou généré automatiquement)
    } = req.body;

    // Validation du code (obligatoire et manuel uniquement)
    let finalCode = code ? code.trim() : '';
    
    if (!finalCode) {
      return res.status(400).json({
        success: false,
        message: 'Le code de correspondance est obligatoire. Veuillez saisir un code (saisie libre).'
      });
    }
    
    // Vérifier l'unicité du code seulement (saisie libre activée)
    const existingCorrespondance = await Correspondance.findOne({ code: finalCode });
    if (existingCorrespondance) {
      return res.status(400).json({
        success: false,
        message: `Le code "${finalCode}" existe déjà. Veuillez choisir un autre code.`
      });
    }
    
    console.log(`🔢 [CREATE] Code fourni manuellement: ${finalCode}`);

    // ✅ VALIDATION: Le contenu est requis seulement si aucun fichier n'est attaché
    const finalFilePath = filePath || file_path; // Utiliser le champ qui existe
    if (!content && !finalFilePath) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu textuel ou un fichier est requis.',
        error: 'CONTENT_OR_FILE_REQUIRED'
      });
    }

    // ✅ CORRECTION: Les correspondances sortantes (notifications) sont informatives par défaut
    const isOutgoing = type === 'OUTGOING';
    const defaultStatus = isOutgoing ? 'INFORMATIF' : (status || 'PENDING');
    
    if (isOutgoing) {
      console.log('📤 [CREATE] Correspondance sortante détectée - Statut INFORMATIF appliqué automatiquement');
    }
    
    const newCorrespondance = new Correspondance({
      title,
      type,
      from_address,
      to_address,
      subject,
      content,
      priority: priority || 'MEDIUM',
      status: defaultStatus,
      airport,
      code: finalCode, // Ajouter le code généré ou fourni
      tags: tags || [],
      file_name,
      parentCorrespondanceId, // Lien vers correspondance parent si c'est une réponse
      responseReference,
      responseDate,
      personnesConcernees: personnesConcernees || [],
      deposantInfo,
      importanceSubject,
      scannedDocumentPath,
      informationTransmittedTo,
      informationAcknowledged: informationAcknowledged || false,
      informationActions,
      authorId: req.user.id,
      filePath: finalFilePath, // Utiliser le chemin final unifié
      fileType,
      attachments: attachments || [],
      actionsDecidees: actionsDecidees || [],
      isUrgent: isUrgent || false,
      isConfidential: isConfidential || false,
      relatedDocuments: relatedDocuments || [],
      responseDeadline,
      response_deadline: responseDeadline, // Mapping pour compatibilité avec le modèle
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // ✅ CORRECTION: Les correspondances sortantes (INFORMATIF) ne nécessitent pas d'assignation
    if (!isOutgoing) {
      // Assignation automatique SEULEMENT si aucune personne concernée n'est spécifiée manuellement
      if (!personnesConcernees || personnesConcernees.length === 0) {
        console.log('🎯 [CREATE] Aucune assignation manuelle - Assignation automatique de la correspondance...');
        const startAssignment = Date.now();
        await CorrespondanceAssignmentService.assignCorrespondance(newCorrespondance);
        console.log(`⏱️ [CREATE] Assignation automatique terminée en ${Date.now() - startAssignment}ms`);
      } else {
        console.log('✋ [CREATE] Assignation manuelle détectée - Pas d\'assignation automatique');
        console.log(`👥 [CREATE] Personnes assignées manuellement: ${personnesConcernees.length}`);
        
        // ✅ CORRECTION: Respecter strictement l'assignation manuelle
        // Ne garder QUE les personnes spécifiées manuellement
        newCorrespondance.personnesConcernees = personnesConcernees;
        
        // Mettre à jour le statut du workflow pour l'assignation manuelle
        newCorrespondance.workflowStatus = 'DIRECTOR_DRAFT';
      }
    } else {
      console.log('ℹ️ [CREATE] Correspondance sortante (INFORMATIF) - Pas d\'assignation nécessaire');
      
      // ✅ AJOUT AUTOMATIQUE D'UN DRAFT POUR AFFICHER LE BOUTON DG
      if (personnesConcernees.length > 0) {
        try {
          const directeur = await User.findById(personnesConcernees[0]);
          if (directeur) {
            console.log('📝 [CREATE] Création automatique d\'un draft pour le bouton DG...');
            
            const draftContent = `Objet: Réponse à votre correspondance - ${subject || title}

Madame, Monsieur,

Nous accusons réception de votre correspondance en date du ${new Date().toLocaleDateString('fr-FR')} concernant "${subject || title}".

Après examen de votre demande, nous vous proposons la réponse suivante :

[Cette proposition nécessite l'approbation du Directeur Général avant envoi]

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
${directeur.firstName} ${directeur.lastName}
${directeur.role === 'DIRECTEUR' ? 'Directeur' : 'Sous-Directeur'}`;

            newCorrespondance.responseDrafts = [{
              responseContent: draftContent,
              directorId: directeur._id,
              directorName: `${directeur.firstName} ${directeur.lastName}`,
              status: 'PENDING_DG_REVIEW',
              createdAt: new Date(),
              isUrgent: priority === 'HIGH' || priority === 'URGENT',
              comments: 'Proposition de réponse créée automatiquement lors de l\'assignation. Nécessite approbation DG.',
              attachments: []
            }];
            
            console.log('✅ [CREATE] Draft automatique créé pour affichage bouton DG');
          }
        } catch (draftError) {
          console.error('❌ [CREATE] Erreur création draft automatique:', draftError);
        }
      }
    }
    
    // Sauvegarder une seule fois avec toutes les données
    const qrCode = generateSimpleQRCode('correspondance', 'temp-' + Date.now());
    newCorrespondance.qrCode = qrCode;
    
    const startSave = Date.now();
    await newCorrespondance.save();
    console.log(`⏱️ [CREATE] Sauvegarde terminée en ${Date.now() - startSave}ms`);

    // Mettre à jour le QR code avec l'ID réel
    const finalQrCode = generateSimpleQRCode('correspondance', newCorrespondance._id.toString());
    newCorrespondance.qrCode = finalQrCode;
    await newCorrespondance.save();

    // ✅ CORRECTION: Ne pas créer de workflow pour les correspondances sortantes (INFORMATIF)
    if (!isOutgoing) {
      // Créer automatiquement le workflow pour cette correspondance
      console.log('🔄 [CREATE] Création du workflow automatique...');
      try {
        const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
          newCorrespondance._id.toString(),
          req.user.id
        );
        if (workflow) {
          console.log(`✅ [CREATE] Workflow créé: ${workflow._id}`);
        } else {
          console.log('⚠️ [CREATE] Workflow non créé (conditions non remplies)');
        }
      } catch (workflowError) {
        console.error('❌ [CREATE] Erreur création workflow:', workflowError);
        // Ne pas faire échouer la création de correspondance si le workflow échoue
      }
    } else {
      console.log('ℹ️ [CREATE] Correspondance sortante (INFORMATIF) - Pas de workflow nécessaire');
    }

    // Si c'est une réponse à une correspondance existante
    if (parentCorrespondanceId) {
      // Récupérer la correspondance parent pour validation
      const parentCorrespondance = await Correspondance.findById(parentCorrespondanceId);
      
      if (!parentCorrespondance) {
        return res.status(404).json({
          success: false,
          message: 'Correspondance parent non trouvée'
        });
      }
      
      // Mettre à jour le statut de la correspondance parent à 'REPLIED'
      await Correspondance.findByIdAndUpdate(
        parentCorrespondanceId,
        { 
          status: 'REPLIED',
          responseReference: newCorrespondance._id.toString(), // Utiliser l'ID MongoDB généré
          responseDate: new Date(),
          updatedAt: new Date()
        }
      );
      
      console.log(`Correspondance parent ${parentCorrespondanceId} mise à jour:`);
      console.log(`- Statut: REPLIED`);
      console.log(`- Référence de réponse: ${newCorrespondance._id.toString()}`);
      console.log(`- Date de réponse: ${new Date().toISOString()}`);
      
      // Ajouter les personnes concernées de la correspondance parent si pas déjà spécifiées
      const allPersonnesConcernees = new Set([
        ...(personnesConcernees || []),
        ...(parentCorrespondance.personnesConcernees || []),
        parentCorrespondance.authorId // Inclure l'auteur de la correspondance originale
      ]);
      
      // Envoyer notification pour la réponse à toutes les personnes concernées (asynchrone)
      if (allPersonnesConcernees.size > 0) {
        console.log('📧 [CREATE] Envoi des notifications en arrière-plan...');
        // Traitement asynchrone des notifications pour ne pas bloquer la réponse
        setImmediate(async () => {
          try {
            const startNotif = Date.now();
            await NotificationService.sendCorrespondanceNotification(
              newCorrespondance, 
              Array.from(allPersonnesConcernees), 
              'CORRESPONDANCE_REPLY'
            );
            await EmailNotificationService.sendCorrespondanceEmailNotification(
              newCorrespondance, 
              Array.from(allPersonnesConcernees), 
              'CORRESPONDANCE_REPLY'
            );
            console.log(`✅ [CREATE] Notifications envoyées en ${Date.now() - startNotif}ms`);
          } catch (error) {
            console.error('❌ [CREATE] Erreur notifications asynchrones:', error);
          }
        });
      }
    } else {
      // Pour une nouvelle correspondance, envoyer notifications aux personnes concernées
      // ✅ CORRECTION CRITIQUE: Utiliser la liste FINALE après assignation (automatique ou manuelle)
      const finalPersonnesConcernees = newCorrespondance.personnesConcernees || [];
      console.log(' [DEBUG] Vérification des personnes concernées (FINALE):', finalPersonnesConcernees);
      console.log(' [DEBUG] Nombre de personnes concernées (FINALE):', finalPersonnesConcernees.length);
      
      if (finalPersonnesConcernees.length > 0) {
        const notificationType = priority === 'URGENT' ? 'CORRESPONDANCE_URGENT' : 'NEW_CORRESPONDANCE';
        console.log(' [DEBUG] Envoi des notifications - Type:', notificationType);
        console.log(`📧 [CREATE] Envoi des notifications à ${finalPersonnesConcernees.length} personne(s)`);
        
        // Traitement asynchrone des notifications pour optimiser les performances
        setImmediate(async () => {
          try {
            const startNotif = Date.now();
            // Notifications push
            console.log(' [DEBUG] Envoi notifications push...');
            await NotificationService.sendCorrespondanceNotification(
              newCorrespondance, 
              finalPersonnesConcernees, 
              notificationType
            );
            console.log(' [DEBUG] Notifications push envoyées');
            
            // Notifications email
            console.log(' [DEBUG] Envoi notifications email...');
            const emailResult = await EmailNotificationService.sendCorrespondanceEmailNotification(
              newCorrespondance, 
              finalPersonnesConcernees, 
              notificationType
            );
            console.log(' [DEBUG] Résultat envoi emails:', emailResult);
            console.log(`✅ [CREATE] Notifications envoyées en ${Date.now() - startNotif}ms`);
          } catch (notificationError) {
            console.error('❌ [CREATE] Erreur notifications asynchrones:', notificationError);
          }
        });
      } else {
        console.log(' [DEBUG] Aucune personne concernée - pas de notification envoyée');
      }
    }

    res.status(201).json({
      success: true,
      data: newCorrespondance,
      message: 'Correspondance créée avec succès'
    });
  } catch (error) {
    console.error('🚨 [CREATE] ERREUR DÉTAILLÉE:', error);
    console.error('🚨 [CREATE] Stack trace:', error.stack);
    console.error('🚨 [CREATE] Message:', error.message);
    console.error('🚨 [CREATE] req.body au moment de l\'erreur:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la correspondance',
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/correspondances/:id/details - Récupérer les détails complets d'une correspondance avec réponse
router.get('/:id/details', auth, async (req, res) => {
  try {
    const correspondanceId = req.params.id;
    
    // Récupérer la correspondance avec toutes les relations
    const correspondance = await Correspondance.findById(correspondanceId)
      .populate('authorId', 'firstName lastName email')
      .populate('personnesConcernees', 'firstName lastName email role')
      .populate('responseDrafts.directorId', 'firstName lastName role');
    
    if (!correspondance) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }
    
    // Récupérer la réponse séparée si elle existe
    let responseDetails = null;
    if (correspondance.finalResponse?.id) {
      const Response = require('../models/Response');
      responseDetails = await Response.findById(correspondance.finalResponse.id)
        .populate('supervisorId', 'firstName lastName email');
    }
    
    // Construire la réponse complète
    const details = {
      id: correspondance._id,
      title: correspondance.title,
      subject: correspondance.subject,
      content: correspondance.content,
      priority: correspondance.priority,
      status: correspondance.status,
      workflowStatus: correspondance.workflowStatus,
      createdAt: correspondance.createdAt,
      responseDate: correspondance.responseDate,
      author: {
        firstName: correspondance.authorId?.firstName || 'N/A',
        lastName: correspondance.authorId?.lastName || 'N/A',
        email: correspondance.authorId?.email || 'N/A'
      },
      attachments: correspondance.attachments || [],
      finalResponse: correspondance.finalResponse ? {
        id: correspondance.finalResponse.id,
        content: correspondance.finalResponse.finalResponseContent,
        attachments: correspondance.finalResponse.attachments || [],
        dischargeFiles: correspondance.finalResponse.dischargeFiles || [],
        deliveryMethod: correspondance.finalResponse.deliveryMethod,
        deliveryStatus: correspondance.finalResponse.deliveryStatus,
        readStatus: correspondance.finalResponse.readStatus,
        sentAt: correspondance.finalResponse.sentAt,
        supervisorName: correspondance.finalResponse.supervisorName,
        trackingNumber: correspondance.finalResponse.trackingNumber,
        deliveryNotes: correspondance.finalResponse.deliveryNotes,
        recipientEmail: correspondance.finalResponse.recipientEmail,
        recipientAddress: correspondance.finalResponse.recipientAddress
      } : null,
      processingHistory: correspondance.processingHistory || [],
      // Informations supplémentaires du workflow
      responseDrafts: correspondance.responseDrafts?.map(draft => ({
        id: draft.id,
        directorName: draft.directorName,
        responseContent: draft.responseContent,
        status: draft.status,
        createdAt: draft.createdAt,
        dgFeedbacks: draft.dgFeedbacks || []
      })) || []
    };
    
    res.json({
      success: true,
      data: details
    });
    
  } catch (error) {
    console.error('Erreur récupération détails correspondance:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/correspondances/:id - Récupérer une correspondance par ID
router.get('/:id', auth, async (req, res) => {
  // Vérifier les permissions selon le rôle
  const allowedRoles = ['AGENT_BUREAU_ORDRE', 'SUPERVISEUR_BUREAU_ORDRE', 'DIRECTEUR_GENERAL', 'SUPER_ADMIN', 'ADMINISTRATOR'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé aux correspondances'
    });
  }
  try {
    const correspondance = await Correspondance.findById(req.params.id)
      .populate('authorId', 'firstName lastName email')
      .populate('personnesConcernees', 'firstName lastName email')
      .populate('parentCorrespondanceId', 'subject _id from_address');
    
    if (!correspondance) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }
    
    // Récupérer les réponses à cette correspondance
    const replies = await Correspondance.find({ parentCorrespondanceId: req.params.id })
      .populate('authorId', 'firstName lastName email')
      .sort({ createdAt: 1 });
    
    // Incrémenter le compteur de vues
    correspondance.viewsCount += 1;
    await correspondance.save();
    
    // Marquer les notifications comme lues pour cet utilisateur
    await NotificationService.markCorrespondanceNotificationsAsRead(req.user.id, req.params.id);
    
    res.json({
      success: true,
      data: {
        ...correspondance.toObject(),
        replies: replies
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la correspondance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la correspondance',
      error: error.message
    });
  }
});

// GET /api/correspondances - Récupérer toutes les correspondances
router.get('/', auth, async (req, res) => {
  // Vérifier les permissions selon le rôle
  const allowedRoles = ['AGENT_BUREAU_ORDRE', 'SUPERVISEUR_BUREAU_ORDRE', 'DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR', 'SUPER_ADMIN', 'ADMINISTRATOR'];
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`❌ Rôle ${req.user.role} non autorisé pour accéder aux correspondances`);
    return res.status(403).json({
      success: false,
      message: `Accès non autorisé aux correspondances. Rôle: ${req.user.role}`
    });
  }
  
  console.log(`✅ Rôle ${req.user.role} autorisé pour accéder aux correspondances`);
  try {
    const { page = 1, limit = 10, status, airport, priority, search, includeReplies = false } = req.query;
    
    console.log(`📥 [GET] Paramètres reçus:`, { page, limit, status, airport, priority, search, includeReplies });
    
    // Construction du filtre
    let filter = {};
    
    // Exclure les réponses par défaut (sauf si explicitement demandé)
    if (includeReplies !== 'true') {
      filter.parentCorrespondanceId = { $exists: false };
    }
    
    // ✅ CORRECTION: Ne pas appliquer les filtres status/airport/priority lors d'une recherche
    // Car cela peut bloquer les résultats de recherche
    if (!search) {
      if (status) {
        filter.status = status;
        console.log(`🔍 [FILTER] Status: ${status}`);
      }
      
      if (airport) {
        filter.airport = airport;
        console.log(`🔍 [FILTER] Airport: ${airport}`);
      }
      
      if (priority) {
        filter.priority = priority;
        console.log(`🔍 [FILTER] Priority: ${priority}`);
      }
    } else {
      console.log(`🔍 [SEARCH] Filtres status/airport/priority ignorés pendant la recherche`);
    }
    
    // Construire les conditions de recherche et de rôle
    let roleConditions = [];
    let searchConditions = [];
    
    // Filtrage par rôle utilisateur
    if (req.user.role === 'DIRECTEUR' || req.user.role === 'SOUS_DIRECTEUR') {
      // ✅ CORRECTION : Les directeurs voient les correspondances assignées via assignedTo OU personnesConcernees
      console.log(`🔍 [CorrespondanceRoutes] Filtrage pour directeur: ${req.user._id}`);
      
      roleConditions = [
        { assignedTo: req.user._id },                    // Assignation directe
        { assignedTo: req.user._id.toString() },         // Assignation directe (string)
        { personnesConcernees: req.user._id },           // ✅ AJOUTÉ : Dans personnesConcernees
        { personnesConcernees: req.user._id.toString() }, // ✅ AJOUTÉ : Dans personnesConcernees (string)
        { assignedTo: { $exists: false } },              // Correspondances non assignées
        { assignedTo: null },                            // Correspondances avec assignedTo null
        { status: 'INFORMATIF' }                         // ✅ AJOUTÉ : Toutes les correspondances informatives sont visibles
      ];
      
      console.log(`📋 [CorrespondanceRoutes] Conditions de rôle pour directeur:`, roleConditions.length);
    }
    
    // Conditions de recherche
    if (search) {
      searchConditions = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { from_address: { $regex: search, $options: 'i' } },
        { to_address: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } } // ✅ AJOUT: Recherche par code
      ];
      console.log(`🔍 [SEARCH] Recherche avec terme: "${search}" (incluant le code)`);
    }
    
    // Combiner les conditions
    if (roleConditions.length > 0 && searchConditions.length > 0) {
      // ✅ CORRECTION: Combiner rôle ET recherche de manière plus flexible
      // Pour les directeurs : (roleConditions) ET (searchConditions)
      // Mais on doit permettre la recherche dans TOUTES les correspondances visibles
      filter.$and = [
        { $or: roleConditions },
        { $or: searchConditions }
      ];
      console.log(`🔍 [SEARCH] Combinaison rôle + recherche pour ${req.user.role}`);
    } else if (roleConditions.length > 0) {
      // Seulement des conditions de rôle
      filter.$or = roleConditions;
      console.log(`🔍 [SEARCH] Filtrage par rôle uniquement pour ${req.user.role}`);
    } else if (searchConditions.length > 0) {
      // Seulement des conditions de recherche (pour admin/bureau ordre)
      filter.$or = searchConditions;
      console.log(`🔍 [SEARCH] Recherche sans restriction de rôle`);
    }
    
    const skip = (page - 1) * limit;
    
    console.log(`🔍 Filtre appliqué pour ${req.user.role}:`, JSON.stringify(filter, null, 2));
    
    const correspondances = await Correspondance.find(filter)
      .populate('authorId', 'firstName lastName email')
      .populate('personnesConcernees', 'firstName lastName email')
      .populate('parentCorrespondanceId', 'subject _id')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Correspondance.countDocuments(filter);
    
    res.json({
      success: true,
      data: correspondances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des correspondances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des correspondances',
      error: error.message
    });
  }
});

// GET /api/correspondances/with-replies - Récupérer correspondances avec leurs réponses
router.get('/with-replies/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, airport, priority, search } = req.query;
    
    // Construction du filtre pour les correspondances principales (pas les réponses)
    let filter = { parentCorrespondanceId: { $exists: false } };
    
    if (status) filter.status = status;
    if (airport) filter.airport = airport;
    if (priority) filter.priority = priority;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { from_address: { $regex: search, $options: 'i' } },
        { to_address: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    // Récupérer les correspondances principales
    const correspondances = await Correspondance.find(filter)
      .populate('authorId', 'firstName lastName email')
      .populate('personnesConcernees', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Pour chaque correspondance, récupérer ses réponses
    const correspondancesWithReplies = await Promise.all(
      correspondances.map(async (corr) => {
        const replies = await Correspondance.find({ parentCorrespondanceId: corr._id })
          .populate('authorId', 'firstName lastName email')
          .sort({ createdAt: 1 });
        
        return {
          ...corr.toObject(),
          replies: replies
        };
      })
    );
    
    const total = await Correspondance.countDocuments(filter);
    
    res.json({
      success: true,
      data: correspondancesWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des correspondances avec réponses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des correspondances avec réponses',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/correspondances/clear-all:
 *   delete:
 *     summary: Supprimer toutes les correspondances et leurs fichiers
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les correspondances et fichiers supprimés avec succès
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/clear-all', auth, async (req, res) => {
  try {
    console.log(' Début de la suppression de toutes les correspondances...');
    
    // 1. Récupérer toutes les correspondances avec leurs fichiers
    const correspondances = await Correspondance.find({});
    console.log(` ${correspondances.length} correspondances trouvées`);
    
    let filesDeleted = 0;
    let filesNotFound = 0;
    
    // 2. Supprimer tous les fichiers associés
    for (const correspondance of correspondances) {
      if (correspondance.filePath) {
        const fullPath = path.join(__dirname, '../../uploads', correspondance.filePath.replace('/uploads/', ''));
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            filesDeleted++;
            console.log(` Fichier supprimé: ${correspondance.filePath}`);
          } else {
            filesNotFound++;
            console.log(` Fichier non trouvé: ${correspondance.filePath}`);
          }
        } catch (error) {
          console.error(` Erreur suppression fichier ${correspondance.filePath}:`, error.message);
        }
      }
    }
    
    // 3. Supprimer toutes les correspondances de la base de données
    const deleteResult = await Correspondance.deleteMany({});
    console.log(` ${deleteResult.deletedCount} correspondances supprimées de la base`);
    
    // 4. Nettoyer les dossiers d'upload vides
    const uploadDirs = [
      path.join(__dirname, '../../uploads/correspondances'),
      path.join(__dirname, '../../uploads/templates'),
      path.join(__dirname, '../../uploads/documents')
    ];
    
    for (const dir of uploadDirs) {
      try {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
              filesDeleted++;
            }
          }
        }
      } catch (error) {
        console.error(` Erreur nettoyage dossier ${dir}:`, error.message);
      }
    }
    
    console.log(' Suppression terminée avec succès');
    
    res.json({
      success: true,
      message: 'Toutes les correspondances et fichiers ont été supprimés avec succès',
      stats: {
        correspondancesDeleted: deleteResult.deletedCount,
        filesDeleted,
        filesNotFound
      }
    });
    
  } catch (error) {
    console.error(' Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des correspondances',
      error: error.message
    });
  }
});

// PUT /api/correspondances/:id - Mettre à jour une correspondance
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si la correspondance existe
    const existingCorrespondance = await Correspondance.findById(id);
    if (!existingCorrespondance) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }

    // Mettre à jour la correspondance
    const updatedCorrespondance = await Correspondance.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('personnesConcernees', 'firstName lastName email');

    // Envoyer les notifications email si des personnes sont concernées
    if (updatedCorrespondance.personnesConcernees && updatedCorrespondance.personnesConcernees.length > 0) {
      try {
        await EmailNotificationService.notifyCorrespondanceUpdate(
          updatedCorrespondance,
          updatedCorrespondance.personnesConcernees.map(p => p._id)
        );
        console.log(` Notifications de mise à jour envoyées pour correspondance ${id}`);
      } catch (emailError) {
        console.error(` Erreur envoi notifications de mise à jour:`, emailError.message);
      }
    }

    res.json({
      success: true,
      data: updatedCorrespondance,
      message: 'Correspondance mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la correspondance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la correspondance',
      error: error.message
    });
  }
});

// POST /api/correspondances/test-email-simple - Test simple d'envoi d'email
router.post('/test-email-simple', auth, async (req, res) => {
  console.log(' [TEST] ROUTE APPELÉE - test-email-simple');
  console.log(' [TEST] User:', req.user);
  
  console.log(' [TEST] ROUTE APPELÉE - test-email-simple');
  console.log(' [TEST] User:', req.user);
  
  try {
    console.log(' [TEST] Début du test d\'envoi d\'email simple');
    
    // Utiliser l'utilisateur connecté comme destinataire de test
    const testUserId = req.user.id;
    console.log(' [TEST] Utilisateur de test:', testUserId);
    
    // Créer une correspondance de test
    const testCorrespondance = {
      _id: 'test-id-123',
      subject: 'Test de notification email',
      content: 'Ceci est un test d\'envoi de notification email pour les correspondances.',
      from_address: 'test@example.com',
      to_address: 'destinataire@example.com',
      priority: 'MEDIUM',
      airport: 'ENFIDHA',
      type: 'INCOMING',
      status: 'PENDING',
      toObject: () => ({
        _id: 'test-id-123',
        subject: 'Test de notification email',
        content: 'Ceci est un test d\'envoi de notification email pour les correspondances.',
        from_address: 'test@example.com',
        to_address: 'destinataire@example.com',
        priority: 'MEDIUM',
        airport: 'ENFIDHA',
        type: 'INCOMING',
        status: 'PENDING'
      })
    };

    console.log(' [TEST] Correspondance de test créée');

    // Envoyer l'email de test
    const result = await EmailNotificationService.sendCorrespondanceEmailNotification(
      testCorrespondance, 
      [testUserId],
      'NEW_CORRESPONDANCE'
    );

    console.log(' [TEST] Résultat du test:', result);

    res.json({
      success: true,
      message: 'Test d\'email effectué',
      result,
      testUserId,
      userEmail: req.user.email
    });

  } catch (error) {
    console.error(' [TEST] Erreur lors du test d\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test d\'email',
      error: error.message
    });
  }
});

// POST /api/correspondances/test-email - Route de test pour les emails (développement uniquement)
router.post('/test-email', auth, async (req, res) => {
  try {
    const { correspondanceId, userIds, type = 'NEW_CORRESPONDANCE' } = req.body;

    if (!correspondanceId || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'correspondanceId et userIds (array) sont requis'
      });
    }

    // Récupérer la correspondance
    const correspondance = await Correspondance.findById(correspondanceId);
    if (!correspondance) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }

    // Envoyer les emails de test
    const result = await EmailNotificationService.sendCorrespondanceEmailNotification(
      correspondance,
      userIds,
      type
    );

    res.json({
      success: true,
      message: 'Emails de test envoyés',
      result
    });

  } catch (error) {
    console.error('Erreur lors du test d\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test d\'email',
      error: error.message
    });
  }
});

// DELETE /api/correspondances/:id - Supprimer une correspondance
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la correspondance existe
    const correspondance = await Correspondance.findById(id);
    if (!correspondance) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }

    // Supprimer d'abord toutes les réponses liées à cette correspondance
    await Correspondance.deleteMany({ parentCorrespondanceId: id });
    
    // Supprimer la correspondance principale
    await Correspondance.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Correspondance supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la correspondance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la correspondance',
      error: error.message
    });
  }
});

// POST /api/correspondances/batch - Créer plusieurs correspondances en lot
router.post('/batch', auth, async (req, res) => {
  try {
    const { correspondances: correspondancesData, createdBy } = req.body;
    
    console.log('=== BATCH IMPORT DEBUG ===');
    console.log('Données reçues - Type:', typeof correspondancesData);
    console.log('Données reçues - Longueur:', Array.isArray(correspondancesData) ? correspondancesData.length : 'N/A');
    console.log('Créateur spécifié:', createdBy);
    console.log('Données reçues - Premier élément:', correspondancesData[0]);
    
    if (!Array.isArray(correspondancesData) || correspondancesData.length === 0) {
      console.log('ERREUR: Données invalides - pas un tableau ou tableau vide');
      return res.status(400).json({
        success: false,
        message: 'Les données doivent être un tableau non vide de correspondances'
      });
    }

    // Vérifier que le créateur spécifié existe
    let creatorUser = null;
    if (createdBy) {
      creatorUser = await User.findById(createdBy);
      if (!creatorUser) {
        return res.status(400).json({
          success: false,
          message: 'L\'utilisateur créateur spécifié n\'existe pas'
        });
      }
      console.log('Créateur trouvé:', creatorUser.name, '(', creatorUser.email, ')');
    }

    const createdCorrespondances = [];
    const errors = [];

    for (let i = 0; i < correspondancesData.length; i++) {
      const data = correspondancesData[i];
      
      console.log(`--- Traitement correspondance ${i + 1}/${correspondancesData.length} ---`);
      console.log('Données de la correspondance:', JSON.stringify(data, null, 2));
      
      try {
        // Ne pas spécifier _id, laisser MongoDB générer automatiquement
        const correspondanceData = {
          title: data.title,
          type: data.type || 'INCOMING',
          from_address: data.from_address || data.sender_email || 'non-specifie@example.com',
          to_address: data.to_address || data.recipient_email || 'non-specifie@example.com',
          subject: data.subject,
          content: data.content || 'Contenu par défaut',
          priority: data.priority || 'MEDIUM',
          status: data.status || 'PENDING',
          airport: data.airport,
          tags: data.tags || [],
          filePath: data.filePath || data.file_path,
          fileType: data.fileType || data.file_type,
          responseReference: data.responseReference || data.reference_number,
          responseDate: data.responseDate ? new Date(data.responseDate) : (data.date_received ? new Date(data.date_received) : undefined),
          isConfidential: data.isConfidential || data.is_confidential || false,
          authorId: createdBy || req.user.id, // Utiliser le créateur spécifié ou l'utilisateur connecté
          version: 1,
          viewsCount: 0,
          downloadsCount: 0,
          deposantInfo: data.deposantInfo,
          importanceSubject: data.importanceSubject,
          informationTransmittedTo: data.informationTransmittedTo,
          informationAcknowledged: data.informationAcknowledged,
          informationActions: data.informationActions
        };

        console.log('Données finales pour création:', JSON.stringify(correspondanceData, null, 2));

        const correspondance = new Correspondance(correspondanceData);
        const savedCorrespondance = await correspondance.save();
        
        console.log(` Correspondance ${i + 1} créée avec succès:`, savedCorrespondance._id);
        createdCorrespondances.push(savedCorrespondance);
      } catch (error) {
        console.error(` Erreur création correspondance ${i + 1}:`, error.message);
        errors.push(`Correspondance ${i + 1}: ${error.message}`);
      }
    }

    console.log(`=== RÉSULTAT BATCH IMPORT ===`);
    console.log(` Créées: ${createdCorrespondances.length}`);
    console.log(` Erreurs: ${errors.length}`);

    if (errors.length > 0) {
      console.log('Erreurs détaillées:', errors);
    }

    // Envoyer les notifications email pour toutes les correspondances créées
    if (createdCorrespondances.length > 0) {
      console.log(' Envoi des notifications email pour les correspondances créées...');
      
      for (const correspondance of createdCorrespondances) {
        try {
          // Récupérer les personnes concernées pour cette correspondance
          if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
            const notificationType = correspondance.priority === 'URGENT' ? 'CORRESPONDANCE_URGENT' : 'NEW_CORRESPONDANCE';
            
            await EmailNotificationService.sendCorrespondanceEmailNotification(
              correspondance,
              correspondance.personnesConcernees,
              notificationType
            );
            
            console.log(` Notifications envoyées pour correspondance ${correspondance._id}`);
          }
        } catch (emailError) {
          console.error(` Erreur envoi notifications pour ${correspondance._id}:`, emailError.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdCorrespondances.length} correspondances créées avec succès`,
      data: createdCorrespondances,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error(' Erreur générale batch import:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des correspondances en lot',
      error: error.message
    });
  }
});

// Route d'administration : activer les notifications email pour tous les utilisateurs
router.post('/admin/enable-notifications', auth, async (req, res) => {
  try {
    console.log(' [ADMIN] Activation des notifications email pour tous les utilisateurs');
    
    const AppSettings = require('../models/AppSettings');
    const User = require('../models/User');
    
    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(` [ADMIN] ${users.length} utilisateurs trouvés`);
    
    let updated = 0;
    let created = 0;
    
    for (const user of users) {
      try {
        // Chercher les paramètres existants
        let settings = await AppSettings.findOne({ userId: user._id });
        
        if (settings) {
          // Mettre à jour les paramètres existants
          if (!settings.emailNotifications) {
            settings.emailNotifications = true;
            settings.updatedAt = new Date();
            await settings.save();
            updated++;
            console.log(` [ADMIN] Notifications activées pour ${user.firstName} ${user.lastName}`);
          }
        } else {
          // Créer de nouveaux paramètres
          settings = new AppSettings({
            userId: user._id,
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await settings.save();
          created++;
          console.log(` [ADMIN] Paramètres créés pour ${user.firstName} ${user.lastName}`);
        }
      } catch (userError) {
        console.error(` [ADMIN] Erreur pour utilisateur ${user._id}:`, userError.message);
      }
    }
    
    console.log(` [ADMIN] Terminé: ${updated} mis à jour, ${created} créés`);
    
    res.json({
      success: true,
      message: 'Notifications email configurées pour tous les utilisateurs',
      stats: {
        totalUsers: users.length,
        updated,
        created,
        alreadyEnabled: users.length - updated - created
      }
    });
    
  } catch (error) {
    console.error(' [ADMIN] Erreur activation notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation des notifications',
      error: error.message
    });
  }
});

// GET /api/correspondances/deadlines/report - Rapport des échéances
router.get('/deadlines/report', auth, async (req, res) => {
  try {
    console.log(' [DEADLINES] Génération du rapport des échéances...');
    
    const report = await DeadlineService.getDeadlineReport();
    
    res.json({
      success: true,
      data: report,
      message: 'Rapport des échéances généré avec succès'
    });
    
  } catch (error) {
    console.error(' [DEADLINES] Erreur génération rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport des échéances',
      error: error.message
    });
  }
});

// POST /api/correspondances/deadlines/check - Vérification manuelle des échéances
router.post('/deadlines/check', auth, async (req, res) => {
  try {
    console.log(' [DEADLINES] Vérification manuelle des échéances...');
    
    const report = await DeadlineService.runDailyCheck();
    
    res.json({
      success: true,
      data: report,
      message: 'Vérification des échéances terminée'
    });
    
  } catch (error) {
    console.error(' [DEADLINES] Erreur vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des échéances',
      error: error.message
    });
  }
});

// POST /api/correspondances/deadlines/update-missing - Mise à jour des échéances manquantes
router.post('/deadlines/update-missing', auth, async (req, res) => {
  try {
    console.log(' [DEADLINES] Mise à jour des échéances manquantes...');
    
    const updated = await DeadlineService.updateMissingDeadlines();
    
    res.json({
      success: true,
      data: { updated },
      message: `${updated} échéances mises à jour avec succès`
    });
    
  } catch (error) {
    console.error(' [DEADLINES] Erreur mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des échéances',
      error: error.message
    });
  }
});

// Route pour activer les notifications email pour tous les utilisateurs
router.post('/enable-notifications', auth, async (req, res) => {
  try {
    console.log(' Activation des notifications email pour tous les utilisateurs');
    
    const AppSettings = require('../models/AppSettings');
    const User = require('../models/User');
    
    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(` ${users.length} utilisateurs trouvés`);
    
    let updated = 0;
    let created = 0;
    
    for (const user of users) {
      try {
        // Chercher les paramètres existants
        let settings = await AppSettings.findOne({ userId: user._id });
        
        if (settings) {
          // Mettre à jour les paramètres existants
          if (!settings.emailNotifications) {
            settings.emailNotifications = true;
            settings.updatedAt = new Date();
            await settings.save();
            updated++;
            console.log(` Notifications activées pour ${user.firstName} ${user.lastName}`);
          }
        } else {
          // Créer de nouveaux paramètres
          settings = new AppSettings({
            userId: user._id,
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await settings.save();
          created++;
          console.log(` Paramètres créés pour ${user.firstName} ${user.lastName}`);
        }
      } catch (userError) {
        console.error(` Erreur pour utilisateur ${user._id}:`, userError.message);
      }
    }
    
    console.log(` Terminé: ${updated} mis à jour, ${created} créés`);
    
    res.json({
      success: true,
      message: 'Notifications email configurées pour tous les utilisateurs',
      stats: {
        totalUsers: users.length,
        updated,
        created,
        alreadyEnabled: users.length - updated - created
      }
    });
    
  } catch (error) {
    console.error(' Erreur activation notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation des notifications',
      error: error.message
    });
  }
});

// POST /api/correspondances/admin/fix-dates - Corriger les dates manquantes
router.post('/admin/fix-dates', auth, async (req, res) => {
  try {
    console.log(' [ADMIN] Correction des dates de correspondance manquantes...');
    
    // Trouver toutes les correspondances sans date_correspondance
    const correspondancesWithoutDate = await Correspondance.find({
      $or: [
        { date_correspondance: { $exists: false } },
        { date_correspondance: null }
      ]
    });

    console.log(` [ADMIN] ${correspondancesWithoutDate.length} correspondances sans date trouvées`);

    let updated = 0;
    for (const correspondance of correspondancesWithoutDate) {
      try {
        // Utiliser createdAt comme date_correspondance par défaut
        correspondance.date_correspondance = correspondance.createdAt || new Date();
        
        // Calculer et assigner l'échéance si elle n'existe pas
        if (!correspondance.responseDeadline) {
          const deadline = correspondance.calculateDeadline();
          if (deadline) {
            correspondance.responseDeadline = deadline;
          }
        }
        
        await correspondance.save();
        updated++;
        
        console.log(` [ADMIN] Correspondance ${correspondance._id} mise à jour - Date: ${correspondance.date_correspondance.toLocaleDateString()}`);
      } catch (error) {
        console.error(` [ADMIN] Erreur pour correspondance ${correspondance._id}:`, error.message);
      }
    }

    console.log(` [ADMIN] ${updated} correspondances mises à jour`);

    res.json({
      success: true,
      message: `${updated} dates de correspondance mises à jour`,
      stats: {
        found: correspondancesWithoutDate.length,
        updated,
        failed: correspondancesWithoutDate.length - updated
      }
    });

  } catch (error) {
    console.error(' [ADMIN] Erreur correction dates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction des dates',
      error: error.message
    });
  }
});

// GET /api/correspondances/deadlines/report - Rapport des échéances
router.get('/deadlines/report', auth, async (req, res) => {
  try {
    console.log(' [DEADLINES] Génération du rapport des échéances...');
    
    const report = await DeadlineService.getDeadlineReport();
    
    res.json({
      success: true,
      data: report,
      message: 'Rapport des échéances généré avec succès'
    });
    
  } catch (error) {
    console.error(' [DEADLINES] Erreur génération rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport des échéances',
      error: error.message
    });
  }
});

// ===== ROUTES POUR LIAISONS CORRESPONDANCE-RÉPONSE =====

/**
 * @swagger
 * /api/correspondances/{id}/create-response:
 *   post:
 *     summary: Créer une réponse à une correspondance
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/create-response', auth, async (req, res) => {
  try {
    const { id: originalCorrespondanceId } = req.params;
    const responseData = req.body;
    const authorId = req.user.id;

    console.log(`[RESPONSE] Création réponse pour correspondance ${originalCorrespondanceId}`);

    // Vérifier que la correspondance peut recevoir une réponse
    const canRespond = await CorrespondanceResponseService.canReceiveResponse(originalCorrespondanceId);
    if (!canRespond.canRespond) {
      return res.status(400).json({
        success: false,
        message: canRespond.reason
      });
    }

    // Créer la réponse
    const response = await CorrespondanceResponseService.createResponse(
      originalCorrespondanceId,
      responseData,
      authorId
    );

    console.log(`[RESPONSE] Réponse créée avec ID: ${response._id}`);

    res.json({
      success: true,
      data: response,
      message: 'Réponse créée avec succès'
    });

  } catch (error) {
    console.error('[RESPONSE] Erreur création réponse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réponse',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/correspondances/{id}/with-responses:
 *   get:
 *     summary: Récupérer une correspondance avec ses réponses
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/with-responses', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CorrespondanceResponseService.getCorrespondanceWithResponses(id);

    res.json({
      success: true,
      data: result,
      message: 'Correspondance et réponses récupérées avec succès'
    });

  } catch (error) {
    console.error('[RESPONSE] Erreur récupération correspondance avec réponses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la correspondance avec réponses',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/correspondances/{id}/chain:
 *   get:
 *     summary: Récupérer toute la chaîne de correspondances (originale + réponses)
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/chain', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const chain = await CorrespondanceResponseService.getCorrespondanceChain(id);

    res.json({
      success: true,
      data: chain,
      message: 'Chaîne de correspondances récupérée avec succès'
    });

  } catch (error) {
    console.error('[RESPONSE] Erreur récupération chaîne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la chaîne de correspondances',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/correspondances/response/{id}/original:
 *   get:
 *     summary: Récupérer la correspondance originale d'une réponse
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 */
router.get('/response/:id/original', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CorrespondanceResponseService.getResponseWithOriginal(id);

    res.json({
      success: true,
      data: result,
      message: 'Correspondance originale récupérée avec succès'
    });

  } catch (error) {
    console.error('[RESPONSE] Erreur récupération originale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la correspondance originale',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/correspondances/{id}/mark-replied:
 *   patch:
 *     summary: Marquer une correspondance comme répondue
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/mark-replied', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { responseReference } = req.body;

    const correspondance = await CorrespondanceResponseService.markAsReplied(id, responseReference);

    res.json({
      success: true,
      data: correspondance,
      message: 'Correspondance marquée comme répondue'
    });

  } catch (error) {
    console.error('[RESPONSE] Erreur marquage répondue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la correspondance',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/correspondances/response-statistics:
 *   get:
 *     summary: Récupérer les statistiques des réponses
 *     tags: [Correspondances]
 *     security:
 *       - bearerAuth: []
 */
router.get('/response-statistics', auth, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

    const stats = await CorrespondanceResponseService.getResponseStatistics(timeframe);

    res.json({
      success: true,
      data: stats,
      message: 'Statistiques des réponses récupérées avec succès'
    });

  } catch (error) {
    console.error('[RESPONSE] Erreur statistiques réponses:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

module.exports = router;
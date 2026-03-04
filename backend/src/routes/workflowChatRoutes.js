const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { CorrespondenceWorkflow } = require('../models/CorrespondenceWorkflow');
const Correspondance = require('../models/Correspondance');

const router = express.Router();

/**
 * GET /api/workflow-chat/by-correspondance/:correspondanceId - Récupérer le workflow par ID de correspondance
 */
router.get('/by-correspondance/:correspondanceId', auth, async (req, res) => {
  try {
    const { correspondanceId } = req.params;
    
    console.log(`🔍 [WorkflowChat] Recherche workflow pour correspondance: ${correspondanceId}`);
    console.log(`👤 [WorkflowChat] Demandé par: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
    
    let workflow = await CorrespondenceWorkflow.findOne({ correspondanceId })
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (!workflow) {
      console.log(`⚠️ [WorkflowChat] Aucun workflow trouvé, création automatique...`);
      
      // ✅ CORRECTION : Créer automatiquement un workflow si nécessaire
      try {
        const CorrespondanceWorkflowService = require('../services/correspondanceWorkflowService');
        const createdWorkflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
          correspondanceId,
          req.user.id
        );
        
        if (createdWorkflow) {
          console.log(`✅ [WorkflowChat] Workflow créé automatiquement: ${createdWorkflow._id}`);
          
          // Récupérer le workflow créé avec les populations
          workflow = await CorrespondenceWorkflow.findById(createdWorkflow._id)
            .populate('assignedDirector', 'firstName lastName email role')
            .populate('directeurGeneral', 'firstName lastName email role');
        }
      } catch (createError) {
        console.error(`❌ [WorkflowChat] Erreur création workflow automatique:`, createError);
        return res.status(500).json({
          success: false,
          message: 'Impossible de créer le workflow pour cette correspondance'
        });
      }
    }

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Aucun workflow trouvé pour cette correspondance'
      });
    }

    // Vérifier que l'utilisateur a accès à ce workflow avec logs détaillés
    console.log(`🔐 [WorkflowChat] Vérification accès pour utilisateur:`, {
      userId: req.user.id,
      userRole: req.user.role,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      assignedDirector: workflow.assignedDirector?._id || workflow.assignedDirector,
      directeurGeneral: workflow.directeurGeneral?._id || workflow.directeurGeneral
    });
    
    // Vérifications détaillées pour debug avec comparaisons multiples
    console.log(`🔍 [WorkflowChat] Comparaisons ID détaillées:`);
    console.log(`   - workflow.assignedDirector: ${workflow.assignedDirector} (type: ${typeof workflow.assignedDirector})`);
    console.log(`   - req.user.id: ${req.user.id} (type: ${typeof req.user.id})`);
    console.log(`   - workflow.directeurGeneral: ${workflow.directeurGeneral} (type: ${typeof workflow.directeurGeneral})`);
    
    const isAssignedDirector = 
      workflow.assignedDirector?.toString() === req.user.id ||
      workflow.assignedDirector?.toString() === req.user.id.toString() ||
      workflow.assignedDirector === req.user.id ||
      workflow.assignedDirector === req.user.id.toString();
      
    const isDirecteurGeneral = 
      workflow.directeurGeneral?.toString() === req.user.id ||
      workflow.directeurGeneral?.toString() === req.user.id.toString() ||
      workflow.directeurGeneral === req.user.id ||
      workflow.directeurGeneral === req.user.id.toString();
      
    const isSupervisor = req.user.role === 'SUPERVISEUR_BUREAU_ORDRE';
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isDirectorRole = req.user.role === 'DIRECTEUR';
    const isDGRole = req.user.role === 'DIRECTEUR_GENERAL';
    
    console.log(`🔍 [WorkflowChat] Résultats comparaisons:`);
    console.log(`   - isAssignedDirector: ${isAssignedDirector}`);
    console.log(`   - isDirecteurGeneral: ${isDirecteurGeneral}`);
    
    console.log(`🔍 [WorkflowChat] Vérifications détaillées:`, {
      isAssignedDirector,
      isDirecteurGeneral,
      isSupervisor,
      isSuperAdmin,
      isDirectorRole,
      isDGRole
    });

    // Vérification d'accès unifiée et simplifiée - MÊME LOGIQUE QUE LES AUTRES ROUTES
    const isSupervisorWithApprovedWorkflow = 
      req.user.role === 'SUPERVISEUR_BUREAU_ORDRE' && 
      workflow.currentStatus === 'DG_APPROVED';
    
    const isDGWithAccess = 
      req.user.role === 'DIRECTEUR_GENERAL' && 
      (workflow.directeurGeneral?._id?.toString() === req.user.id || 
       workflow.directeurGeneral?.toString() === req.user.id);
    
    const hasAccess = (
      isAssignedDirector ||
      isDGWithAccess ||
      isSupervisorWithApprovedWorkflow ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'DIRECTEUR' ||
      req.user.role === 'SOUS_DIRECTEUR'
    );
    
    console.log(`🔐 [WorkflowChat] Vérifications d'accès BY-CORRESPONDANCE:`);
    console.log(`   - User connecté: ${req.user.firstName} ${req.user.lastName} (${req.user.email})`);
    console.log(`   - User role: ${req.user.role}`);
    console.log(`   - User ID: "${req.user.id}"`);
    console.log(`   - Workflow DG: "${workflow.directeurGeneral}"`);
    console.log(`   - Workflow Status: "${workflow.currentStatus}"`);
    console.log(`   - isAssignedDirector: ${isAssignedDirector}`);
    console.log(`   - isDGWithAccess: ${isDGWithAccess}`);
    console.log(`   - isSupervisorWithApprovedWorkflow: ${isSupervisorWithApprovedWorkflow}`);
    console.log(`   - Égalité DG (._id): ${workflow.directeurGeneral?._id?.toString() === req.user.id}`);
    console.log(`   - Égalité DG (direct): ${workflow.directeurGeneral?.toString() === req.user.id}`);

    console.log(`🔐 [WorkflowChat] Résultat vérification accès final: ${hasAccess ? 'AUTORISÉ' : 'REFUSÉ'}`);

    if (!hasAccess) {
      console.log(`❌ [WorkflowChat] Accès refusé pour ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce workflow',
        debug: {
          userId: req.user.id,
          userRole: req.user.role,
          assignedDirector: workflow.assignedDirector,
          directeurGeneral: workflow.directeurGeneral
        }
      });
    }

    console.log(`✅ [WorkflowChat] Workflow trouvé: ${workflow._id}`);
    console.log(`📋 [WorkflowChat] Structure du workflow:`, {
      _id: workflow._id,
      correspondanceId: workflow.correspondanceId,
      assignedDirector: workflow.assignedDirector ? {
        id: workflow.assignedDirector._id,
        name: `${workflow.assignedDirector.firstName} ${workflow.assignedDirector.lastName}`,
        role: workflow.assignedDirector.role
      } : null,
      directeurGeneral: workflow.directeurGeneral ? {
        id: workflow.directeurGeneral._id,
        name: `${workflow.directeurGeneral.firstName} ${workflow.directeurGeneral.lastName}`,
        role: workflow.directeurGeneral.role
      } : null,
      currentStatus: workflow.currentStatus
    });
    
    res.json({
      success: true,
      data: {
        _id: workflow._id,
        correspondanceId: workflow.correspondanceId,
        currentStatus: workflow.currentStatus,
        assignedDirector: workflow.assignedDirector,
        directeurGeneral: workflow.directeurGeneral
      }
    });

  } catch (error) {
    console.error('❌ [WorkflowChat] Erreur recherche workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche du workflow',
      error: error.message
    });
  }
});

// Configuration multer pour les attachements de chat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/chat-attachments');
    if (!fs.existsSync(uploadDir)) {
      console.log(`📁 [WorkflowChat] Création du dossier: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log(`📁 [WorkflowChat] Upload vers: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `chat-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Autoriser tous types de fichiers pour les attachements de chat
    cb(null, true);
  }
});

/**
 * GET /api/workflow-chat/:workflowId/messages
 * Récupérer tous les messages de chat d'un workflow
 */
router.get('/:workflowId/messages', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    console.log(`📨 [WorkflowChat] Récupération messages pour workflow: ${workflowId}`);
    console.log(`👤 [WorkflowChat] Demandé par: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
    
    // Récupérer le workflow sans populate des messages (from/to sont des UUID strings)
    const workflow = await CorrespondenceWorkflow.findById(workflowId)
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    // Vérifier que l'utilisateur a accès à ce workflow avec logs détaillés
    console.log(`🔐 [WorkflowChat] Vérification accès messages pour: ${req.user.firstName} ${req.user.lastName} (${req.user.role})`);
    console.log(`🔐 [WorkflowChat] Workflow assigné à:`, {
      assignedDirector: workflow.assignedDirector?._id || workflow.assignedDirector,
      directeurGeneral: workflow.directeurGeneral?._id || workflow.directeurGeneral
    });
    
    // Vérifications détaillées pour debug DG avec comparaisons multiples
    console.log(`🔍 [WorkflowChat] Comparaisons ID messages détaillées:`);
    console.log(`   - workflow.assignedDirector: ${workflow.assignedDirector} (type: ${typeof workflow.assignedDirector})`);
    console.log(`   - req.user.id: ${req.user.id} (type: ${typeof req.user.id})`);
    console.log(`   - workflow.directeurGeneral: ${workflow.directeurGeneral} (type: ${typeof workflow.directeurGeneral})`);
    
    const isAssignedDirector = 
      workflow.assignedDirector?.toString() === req.user.id ||
      workflow.assignedDirector?.toString() === req.user.id.toString() ||
      workflow.assignedDirector === req.user.id ||
      workflow.assignedDirector === req.user.id.toString();
      
    const isDirecteurGeneral = 
      workflow.directeurGeneral?.toString() === req.user.id ||
      workflow.directeurGeneral?.toString() === req.user.id.toString() ||
      workflow.directeurGeneral === req.user.id ||
      workflow.directeurGeneral === req.user.id.toString();
      
    const isSupervisor = req.user.role === 'SUPERVISEUR_BUREAU_ORDRE';
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isDirectorRole = req.user.role === 'DIRECTEUR';
    const isDGRole = req.user.role === 'DIRECTEUR_GENERAL';
    
    console.log(`🔍 [WorkflowChat] Résultats comparaisons messages:`);
    console.log(`   - isAssignedDirector: ${isAssignedDirector}`);
    console.log(`   - isDirecteurGeneral: ${isDirecteurGeneral}`);
    
    // Vérification spéciale pour superviseur avec workflow approuvé
    const isSupervisorWithApprovedWorkflow = 
      req.user.role === 'SUPERVISEUR_BUREAU_ORDRE' && 
      workflow.currentStatus === 'DG_APPROVED';
    
    console.log(`🔍 [WorkflowChat] Vérifications messages détaillées:`, {
      isAssignedDirector,
      isDirecteurGeneral,
      isSupervisor,
      isSuperAdmin,
      isDirectorRole,
      isDGRole,
      isSupervisorWithApprovedWorkflow,
      workflowStatus: workflow.currentStatus,
      userIdMatch: req.user.id
    });

    // Utiliser la même logique simplifiée que pour l'accès workflow
    const isDGWithAccess = 
      req.user.role === 'DIRECTEUR_GENERAL' && 
      (workflow.directeurGeneral?._id?.toString() === req.user.id || 
       workflow.directeurGeneral?.toString() === req.user.id);

    const hasAccess = (
      isAssignedDirector ||
      isDGWithAccess ||
      isSupervisorWithApprovedWorkflow ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'DIRECTEUR' ||
      req.user.role === 'SOUS_DIRECTEUR'
    );

    console.log(`🔐 [WorkflowChat] Accès messages: ${hasAccess ? 'AUTORISÉ' : 'REFUSÉ'}`);
    console.log(`🔐 [WorkflowChat] isDGWithAccess: ${isDGWithAccess}`);
    console.log(`🔐 [WorkflowChat] Superviseur avec workflow approuvé: ${isSupervisorWithApprovedWorkflow}`);

    if (!hasAccess) {
      console.log(`❌ [WorkflowChat] Accès refusé aux messages pour ${req.user.firstName} ${req.user.lastName}`);
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce workflow'
      });
    }

    console.log(`💬 [WorkflowChat] Messages trouvés: ${workflow.chatMessages.length}`);
    console.log(`📋 [WorkflowChat] Statut workflow: ${workflow.currentStatus}`);
    
    // Récupérer les informations des utilisateurs pour les messages
    const User = require('../models/User');
    const userIds = new Set();
    workflow.chatMessages.forEach(msg => {
      if (msg.from) userIds.add(msg.from);
      if (msg.to) userIds.add(msg.to);
    });
    
    console.log(`👥 [WorkflowChat] Récupération infos pour ${userIds.size} utilisateurs`);
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select('firstName lastName email role');
    
    // Créer un map des utilisateurs pour accès rapide
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      };
    });
    
    console.log(`✅ [WorkflowChat] Utilisateurs récupérés:`, Object.keys(userMap).length);

    // Marquer les messages comme lus pour cet utilisateur (temporairement désactivé pour debug)
    try {
      console.log(`📖 [WorkflowChat] Tentative marquage messages comme lus pour: ${req.user.id}`);
      // workflow.markMessagesAsRead(req.user.id);
      // await workflow.save();
      console.log(`✅ [WorkflowChat] Marquage désactivé temporairement`);
    } catch (markError) {
      console.error(`❌ [WorkflowChat] Erreur marquage messages:`, markError);
      // Continue même si le marquage échoue
    }

    // Inclure les informations de la correspondance originale dans la réponse
    // ✅ MODÈLE UNIFIÉ: Récupérer aussi les données de la correspondance
    console.log(`🔄 [WorkflowChat] Récupération correspondance pour enrichir les données...`);
    const Correspondance = require('../models/Correspondance');
    const correspondance = await Correspondance.findById(workflow.correspondanceId)
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .lean();

    console.log(`📋 [WorkflowChat] Correspondance trouvée: ${!!correspondance}`);
    console.log(`📝 [WorkflowChat] Drafts dans correspondance: ${correspondance?.responseDrafts?.length || 0}`);

    const response = {
      success: true,
      data: {
        workflowId: workflow._id,
        correspondance: correspondance ? {
          id: correspondance._id,
          subject: correspondance.subject || correspondance.title,
          content: correspondance.content,
          attachments: correspondance.attachments || [],
          priority: correspondance.priority || 'MEDIUM',
          createdAt: correspondance.createdAt,
          // ✅ AJOUT CRITIQUE: Données nécessaires pour le chat DG
          workflowStatus: correspondance.workflowStatus,
          responseDrafts: correspondance.responseDrafts || [],
          personnesConcernees: correspondance.personnesConcernees || []
        } : {
          id: workflow.correspondanceId || 'unknown',
          subject: 'Chat Workflow',
          content: 'Messages de discussion du workflow',
          attachments: [],
          priority: 'MEDIUM',
          createdAt: workflow.createdAt || new Date(),
          workflowStatus: workflow.currentStatus,
          responseDrafts: [],
          personnesConcernees: []
        },
        chatMessages: workflow.chatMessages.map(msg => ({
          id: msg._id,
          from: userMap[msg.from] || {
            id: msg.from,
            name: 'Utilisateur inconnu',
            email: '',
            role: ''
          },
          to: userMap[msg.to] || {
            id: msg.to,
            name: 'Destinataire inconnu',
            email: '',
            role: ''
          },
          message: msg.message,
          draftVersion: msg.draftVersion,
          attachments: msg.attachments || [],
          timestamp: msg.timestamp,
          isRead: msg.isRead
        })),
        currentStatus: workflow.currentStatus,
        assignedDirector: workflow.assignedDirector,
        directeurGeneral: workflow.directeurGeneral
      }
    };

    console.log(`✅ [WorkflowChat] ${workflow.chatMessages.length} messages récupérés`);
    res.json(response);

  } catch (error) {
    console.error('❌ [WorkflowChat] Erreur récupération messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
});

/**
 * POST /api/workflow-chat/:workflowId/send-message
 * Envoyer un message dans le chat du workflow
 */
router.post('/:workflowId/send-message', upload.array('attachments', 5), auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { message, toUserId, draftVersion } = req.body;

    console.log(`📤 [WorkflowChat] Envoi message dans workflow: ${workflowId}`);
    console.log(`📝 [WorkflowChat] Message: ${message?.substring(0, 100)}...`);
    console.log(`👤 [WorkflowChat] De: ${req.user.id} vers: ${toUserId}`);

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le message ne peut pas être vide'
      });
    }

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    // Vérifier que l'utilisateur a accès à ce workflow - logique unifiée
    const isAssignedDirector = workflow.assignedDirector?.toString() === req.user.id;
    const isDGWithAccess = 
      req.user.role === 'DIRECTEUR_GENERAL' && 
      (workflow.directeurGeneral?._id?.toString() === req.user.id || 
       workflow.directeurGeneral?.toString() === req.user.id);
    const isSupervisorWithApprovedWorkflow = 
      req.user.role === 'SUPERVISEUR_BUREAU_ORDRE' && 
      workflow.currentStatus === 'DG_APPROVED';

    const hasAccess = (
      isAssignedDirector ||
      isDGWithAccess ||
      isSupervisorWithApprovedWorkflow ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'DIRECTEUR' ||
      req.user.role === 'SOUS_DIRECTEUR'
    );

    console.log(`🔐 [WorkflowChat] Vérifications envoi message:`);
    console.log(`   - isAssignedDirector: ${isAssignedDirector}`);
    console.log(`   - isDGWithAccess: ${isDGWithAccess}`);
    console.log(`   - isSupervisorWithApprovedWorkflow: ${isSupervisorWithApprovedWorkflow}`);
    console.log(`   - hasAccess: ${hasAccess}`);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce workflow'
      });
    }

    // Traiter les attachements
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });
        console.log(`📎 [WorkflowChat] Attachement ajouté: ${file.originalname}`);
      }
    }

    // Déterminer le destinataire
    const isUserAssignedDirector = req.user.id === workflow.assignedDirector?.toString();
    const isUserDG = req.user.id === workflow.directeurGeneral?.toString();
    const isUserSousDirecteur = req.user.role === 'SOUS_DIRECTEUR';
    
    let recipientId = toUserId;
    if (!recipientId) {
      if (isUserAssignedDirector || isUserSousDirecteur) {
        // Si l'utilisateur est directeur ou sous-directeur, envoyer vers le DG
        recipientId = workflow.directeurGeneral;
      } else if (isUserDG) {
        // Si l'utilisateur est DG, envoyer vers le directeur assigné
        recipientId = workflow.assignedDirector;
      } else {
        // Par défaut, envoyer vers le DG
        recipientId = workflow.directeurGeneral;
      }
    }
    
    console.log(`💬 [WorkflowChat] Logique destinataire:`);
    console.log(`   - workflow.assignedDirector: ${workflow.assignedDirector}`);
    console.log(`   - workflow.directeurGeneral: ${workflow.directeurGeneral}`);
    console.log(`   - req.user.id: ${req.user.id}`);
    console.log(`   - req.user.role: ${req.user.role}`);
    console.log(`   - isUserAssignedDirector: ${isUserAssignedDirector}`);
    console.log(`   - isUserDG: ${isUserDG}`);
    console.log(`   - isUserSousDirecteur: ${isUserSousDirecteur}`);
    console.log(`   - toUserId fourni: ${toUserId || 'Non'}`);
    console.log(`💬 [WorkflowChat] Destinataire déterminé: ${recipientId}`);
    console.log(`💬 [WorkflowChat] Messages avant ajout: ${workflow.chatMessages.length}`);
    
    // Ajouter le message au chat
    const updatedWorkflow = await workflow.addChatMessage(
      req.user.id,
      recipientId,
      message.trim(),
      draftVersion,
      attachments
    );

    console.log(`✅ [WorkflowChat] Message envoyé avec succès`);
    console.log(`💬 [WorkflowChat] Messages après ajout: ${updatedWorkflow.chatMessages.length}`);
    
    // Vérification de persistance - recharger depuis la DB
    const reloadedWorkflow = await CorrespondenceWorkflow.findById(workflowId);
    console.log(`🔄 [WorkflowChat] Vérification DB - Messages persistés: ${reloadedWorkflow?.chatMessages.length || 0}`);
    
    if (!reloadedWorkflow || reloadedWorkflow.chatMessages.length !== updatedWorkflow.chatMessages.length) {
      console.error(`⚠️ [WorkflowChat] PROBLÈME DE PERSISTANCE DÉTECTÉ!`);
      console.error(`   - Messages en mémoire: ${updatedWorkflow.chatMessages.length}`);
      console.error(`   - Messages en DB: ${reloadedWorkflow?.chatMessages.length || 0}`);
    }
    res.json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('❌ [WorkflowChat] Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
});

/**
 * GET /api/workflow-chat/attachment/:filename
 * Télécharger un attachement de chat
 */
router.get('/attachment/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log(`📥 [WorkflowChat] Téléchargement attachement: ${filename}`);
    console.log(`👤 [WorkflowChat] Demandé par: ${req.user.firstName} ${req.user.lastName}`);
    
    // Essayer plusieurs emplacements possibles
    const possiblePaths = [
      path.join(__dirname, '../../uploads/chat-attachments', filename),
      path.join(__dirname, '../../uploads/drafts', filename),
      path.join(__dirname, '../../uploads/correspondances', filename),
      path.join(__dirname, '../../uploads/documents', filename),
      path.join(__dirname, '../../uploads', filename)
    ];
    
    console.log(`🔍 [WorkflowChat] Recherche dans les emplacements:`);
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    
    // Lister le contenu du dossier chat-attachments pour debug
    const chatDir = path.join(__dirname, '../../uploads/chat-attachments');
    console.log(`📂 [WorkflowChat] Contenu du dossier chat-attachments:`);
    try {
      const files = fs.readdirSync(chatDir);
      files.forEach(file => console.log(`   - ${file}`));
      console.log(`📊 [WorkflowChat] Total: ${files.length} fichiers`);
    } catch (err) {
      console.log(`❌ [WorkflowChat] Impossible de lire le dossier: ${err.message}`);
    }
    
    let filePath = null;
    for (const testPath of possiblePaths) {
      console.log(`🔍 [WorkflowChat] Test: ${testPath}`);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        console.log(`✅ [WorkflowChat] Fichier trouvé dans: ${testPath}`);
        break;
      } else {
        console.log(`❌ [WorkflowChat] Fichier non trouvé: ${testPath}`);
      }
    }
    
    if (!filePath) {
      console.log(`❌ [WorkflowChat] Fichier non trouvé dans aucun emplacement:`);
      possiblePaths.forEach(p => console.log(`   - ${p}`));
      
      // Lister les fichiers disponibles pour debug
      const chatDir = path.join(__dirname, '../../uploads/chat-attachments');
      if (fs.existsSync(chatDir)) {
        const files = fs.readdirSync(chatDir);
        console.log(`📁 [WorkflowChat] Fichiers disponibles dans chat-attachments: ${files.length}`);
        files.slice(0, 10).forEach(f => console.log(`   - ${f}`));
      }
      
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
        debug: {
          searchedPaths: possiblePaths,
          requestedFile: filename
        }
      });
    }

    // TODO: Ajouter une vérification de sécurité pour s'assurer que l'utilisateur
    // a accès au workflow contenant cet attachement

    console.log(`✅ [WorkflowChat] Envoi du fichier: ${filename} depuis ${filePath}`);
    res.sendFile(filePath);

  } catch (error) {
    console.error('❌ [WorkflowChat] Erreur téléchargement attachement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement',
      error: error.message
    });
  }
});

/**
 * GET /api/workflow-chat/:workflowId/full-context
 * Récupérer le contexte complet du workflow pour le superviseur bureau d'ordre
 */
router.get('/:workflowId/full-context', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    console.log(`📋 [WorkflowChat] Récupération contexte complet pour: ${workflowId}`);
    
    // Vérifier que l'utilisateur est superviseur bureau d'ordre
    if (req.user.role !== 'SUPERVISEUR_BUREAU_ORDRE' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé au superviseur bureau d\'ordre'
      });
    }

    const workflow = await CorrespondenceWorkflow.findById(workflowId)
      .populate('correspondanceId')
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('assignedDG', 'firstName lastName email role')
      .populate('chatMessages.from', 'firstName lastName email role')
      .populate('chatMessages.to', 'firstName lastName email role')
      .populate('actions.performedBy', 'firstName lastName email role');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    // Vérifier que le workflow est dans un état final ou approuvé
    const finalStates = ['DG_APPROVED', 'COMPLETED', 'FINAL_RESPONSE_READY'];
    if (!finalStates.includes(workflow.currentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Le workflow n\'est pas encore dans un état final'
      });
    }

    const response = {
      success: true,
      data: {
        workflow: {
          id: workflow._id,
          currentStatus: workflow.currentStatus,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        },
        correspondance: {
          id: workflow.correspondanceId._id,
          subject: workflow.correspondanceId.subject,
          content: workflow.correspondanceId.content,
          attachments: workflow.correspondanceId.attachments || [],
          priority: workflow.correspondanceId.priority,
          createdAt: workflow.correspondanceId.createdAt
        },
        participants: {
          director: workflow.assignedDirector ? {
            id: workflow.assignedDirector._id,
            name: `${workflow.assignedDirector.firstName} ${workflow.assignedDirector.lastName}`,
            email: workflow.assignedDirector.email,
            role: workflow.assignedDirector.role
          } : null,
          dg: workflow.assignedDG ? {
            id: workflow.assignedDG._id,
            name: `${workflow.assignedDG.firstName} ${workflow.assignedDG.lastName}`,
            email: workflow.assignedDG.email,
            role: workflow.assignedDG.role
          } : null
        },
        chatMessages: workflow.chatMessages.map(msg => ({
          id: msg._id,
          from: {
            id: msg.from._id,
            name: `${msg.from.firstName} ${msg.from.lastName}`,
            role: msg.from.role
          },
          to: {
            id: msg.to._id,
            name: `${msg.to.firstName} ${msg.to.lastName}`,
            role: msg.to.role
          },
          message: msg.message,
          draftVersion: msg.draftVersion,
          attachments: msg.attachments || [],
          timestamp: msg.timestamp
        })),
        actions: workflow.actions.map(action => ({
          id: action._id,
          actionType: action.actionType,
          performedBy: {
            id: action.performedBy._id,
            name: `${action.performedBy.firstName} ${action.performedBy.lastName}`,
            role: action.performedBy.role
          },
          comment: action.comment,
          timestamp: action.timestamp
        })),
        finalResponse: workflow.finalResponse || null,
        allDrafts: workflow.responseDrafts || []
      }
    };

    console.log(`✅ [WorkflowChat] Contexte complet récupéré`);
    res.json(response);

  } catch (error) {
    console.error('❌ [WorkflowChat] Erreur récupération contexte complet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contexte complet'
    });
  }
});

/**
 * GET /api/workflow-chat/download/:filename
 * Télécharger un fichier attaché au chat
 */
router.get('/download/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const path = require('path');
    const fs = require('fs');
    
    console.log(`📥 [WorkflowChat] Demande téléchargement: ${filename}`);
    console.log(`👤 [WorkflowChat] Demandé par: ${req.user.firstName} ${req.user.lastName}`);
    
    // Essayer plusieurs emplacements possibles
    const possiblePaths = [
      path.join(__dirname, '../../uploads/chat-attachments', filename),
      path.join(__dirname, '../../uploads/drafts', filename),
      path.join(__dirname, '../../uploads/correspondances', filename),
      path.join(__dirname, '../../uploads/documents', filename),
      path.join(__dirname, '../../uploads', filename)
    ];
    
    console.log(`🔍 [WorkflowChat] Recherche dans les emplacements:`);
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    
    // Lister le contenu du dossier chat-attachments pour debug
    const chatDir = path.join(__dirname, '../../uploads/chat-attachments');
    console.log(`📂 [WorkflowChat] Contenu du dossier chat-attachments:`);
    try {
      const files = fs.readdirSync(chatDir);
      files.forEach(file => console.log(`   - ${file}`));
      console.log(`📊 [WorkflowChat] Total: ${files.length} fichiers`);
    } catch (err) {
      console.log(`❌ [WorkflowChat] Impossible de lire le dossier: ${err.message}`);
    }
    
    let filePath = null;
    for (const testPath of possiblePaths) {
      console.log(`🔍 [WorkflowChat] Test: ${testPath}`);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        console.log(`✅ [WorkflowChat] Fichier trouvé dans: ${testPath}`);
        break;
      } else {
        console.log(`❌ [WorkflowChat] Fichier non trouvé: ${testPath}`);
      }
    }
    
    if (!filePath) {
      console.log(`❌ [WorkflowChat] Fichier non trouvé dans aucun emplacement:`);
      possiblePaths.forEach(p => console.log(`   - ${p}`));
      
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé',
        debug: {
          searchedPaths: possiblePaths,
          requestedFile: filename
        }
      });
    }
    
    // Envoyer le fichier
    console.log(`📤 [WorkflowChat] Envoi du fichier: ${filePath}`);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(`❌ [WorkflowChat] Erreur téléchargement:`, err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement'
          });
        }
      } else {
        console.log(`✅ [WorkflowChat] Téléchargement réussi: ${filename}`);
      }
    });
    
  } catch (error) {
    console.error('❌ [WorkflowChat] Erreur route téléchargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du téléchargement'
    });
  }
});

module.exports = router;

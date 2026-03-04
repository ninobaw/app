const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function fixObjectIdReferences() {
  console.log('\n🔧 === CORRECTION DES RÉFÉRENCES OBJECTID ===\n');

  try {
    // 1. Vérifier les correspondances avec des références ObjectId problématiques
    console.log('📋 1. Vérification des correspondances...');
    const allCorrespondances = await Correspondance.find({});
    console.log(`   Total correspondances: ${allCorrespondances.length}`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const correspondance of allCorrespondances) {
      let needsUpdate = false;
      let updateFields = {};

      try {
        // Vérifier assignedTo
        if (correspondance.assignedTo && typeof correspondance.assignedTo === 'object') {
          console.log(`   ⚠️ Correspondance ${correspondance._id} a assignedTo ObjectId: ${correspondance.assignedTo}`);
          // Si c'est un ObjectId, on le supprime car il ne correspond pas à un UUID
          updateFields.assignedTo = null;
          needsUpdate = true;
        }

        // Vérifier assignedBy
        if (correspondance.assignedBy && typeof correspondance.assignedBy === 'object') {
          console.log(`   ⚠️ Correspondance ${correspondance._id} a assignedBy ObjectId: ${correspondance.assignedBy}`);
          updateFields.assignedBy = null;
          needsUpdate = true;
        }

        // Vérifier personnesConcernees
        if (correspondance.personnesConcernees && Array.isArray(correspondance.personnesConcernees)) {
          const validPersonnesConcernees = [];
          let hasInvalidIds = false;

          for (const personId of correspondance.personnesConcernees) {
            if (typeof personId === 'string' && personId.length > 24) {
              // C'est probablement un UUID valide
              validPersonnesConcernees.push(personId);
            } else if (typeof personId === 'object') {
              // C'est un ObjectId, on l'ignore
              console.log(`   ⚠️ Suppression ObjectId invalide dans personnesConcernees: ${personId}`);
              hasInvalidIds = true;
            } else if (typeof personId === 'string' && personId.length === 24) {
              // C'est peut-être un ObjectId en string, vérifier s'il correspond à un utilisateur
              const userExists = await User.findById(personId);
              if (userExists) {
                validPersonnesConcernees.push(personId);
              } else {
                console.log(`   ⚠️ Suppression ID utilisateur inexistant: ${personId}`);
                hasInvalidIds = true;
              }
            }
          }

          if (hasInvalidIds) {
            updateFields.personnesConcernees = validPersonnesConcernees;
            needsUpdate = true;
          }
        }

        // Vérifier responseDrafts
        if (correspondance.responseDrafts && Array.isArray(correspondance.responseDrafts)) {
          let hasInvalidDrafts = false;
          const validDrafts = [];

          for (const draft of correspondance.responseDrafts) {
            let validDraft = { ...draft.toObject() };
            
            // Vérifier directorId
            if (draft.directorId && typeof draft.directorId === 'object') {
              console.log(`   ⚠️ Draft avec directorId ObjectId: ${draft.directorId}`);
              // Essayer de trouver un directeur correspondant
              const director = await User.findOne({ role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] } });
              if (director) {
                validDraft.directorId = director._id;
                hasInvalidDrafts = true;
              } else {
                // Ignorer ce draft s'il n'y a pas de directeur
                continue;
              }
            }

            // Vérifier dgFeedbacks
            if (draft.dgFeedbacks && Array.isArray(draft.dgFeedbacks)) {
              const validFeedbacks = [];
              for (const feedback of draft.dgFeedbacks) {
                let validFeedback = { ...feedback };
                
                if (feedback.dgId && typeof feedback.dgId === 'object') {
                  console.log(`   ⚠️ Feedback avec dgId ObjectId: ${feedback.dgId}`);
                  const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
                  if (dg) {
                    validFeedback.dgId = dg._id;
                    hasInvalidDrafts = true;
                  } else {
                    continue; // Ignorer ce feedback
                  }
                }
                
                validFeedbacks.push(validFeedback);
              }
              validDraft.dgFeedbacks = validFeedbacks;
            }

            validDrafts.push(validDraft);
          }

          if (hasInvalidDrafts) {
            updateFields.responseDrafts = validDrafts;
            needsUpdate = true;
          }
        }

        // Vérifier finalResponse
        if (correspondance.finalResponse && correspondance.finalResponse.supervisorId && 
            typeof correspondance.finalResponse.supervisorId === 'object') {
          console.log(`   ⚠️ FinalResponse avec supervisorId ObjectId: ${correspondance.finalResponse.supervisorId}`);
          const supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
          if (supervisor) {
            updateFields['finalResponse.supervisorId'] = supervisor._id;
            needsUpdate = true;
          } else {
            updateFields.finalResponse = null;
            needsUpdate = true;
          }
        }

        // Appliquer les corrections si nécessaire
        if (needsUpdate) {
          await Correspondance.updateOne({ _id: correspondance._id }, { $set: updateFields });
          console.log(`   ✅ Correspondance ${correspondance._id} corrigée`);
          fixedCount++;
        }

      } catch (error) {
        console.error(`   ❌ Erreur pour correspondance ${correspondance._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 === RÉSUMÉ ===`);
    console.log(`✅ Correspondances corrigées: ${fixedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📋 Total vérifié: ${allCorrespondances.length}`);

    // 2. Vérifier les utilisateurs disponibles pour assignation
    console.log(`\n👥 === UTILISATEURS DISPONIBLES ===`);
    const users = await User.find({}).select('_id firstName lastName role');
    console.log(`Total utilisateurs: ${users.length}`);
    
    users.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.role}) - ID: ${user._id}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function main() {
  await connectDB();
  await fixObjectIdReferences();
  
  console.log('\n✅ Correction terminée');
  process.exit(0);
}

main();

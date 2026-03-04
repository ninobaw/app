const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');

/**
 * Script pour diagnostiquer pourquoi les réponses créées n'apparaissent pas dans la liste
 */

async function debugResponseVisibility() {
  try {
    console.log('🔍 ========================================');
    console.log('🔍 DIAGNOSTIC VISIBILITÉ DES RÉPONSES');
    console.log('🔍 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. COMPTER TOUTES LES CORRESPONDANCES
    console.log('📊 === STATISTIQUES CORRESPONDANCES ===');
    
    const totalCorrespondances = await Correspondance.countDocuments({});
    const mainCorrespondances = await Correspondance.countDocuments({ 
      parentCorrespondanceId: { $exists: false } 
    });
    const responseCorrespondances = await Correspondance.countDocuments({ 
      parentCorrespondanceId: { $exists: true } 
    });

    console.log(`📋 Total correspondances: ${totalCorrespondances}`);
    console.log(`📥 Correspondances principales: ${mainCorrespondances}`);
    console.log(`📤 Correspondances de réponse: ${responseCorrespondances}\n`);

    // 2. LISTER LES RÉPONSES RÉCENTES
    console.log('📤 === RÉPONSES RÉCENTES ===');
    
    const recentResponses = await Correspondance.find({ 
      parentCorrespondanceId: { $exists: true } 
    })
    .populate('parentCorrespondanceId', 'title subject code')
    .populate('authorId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    if (recentResponses.length === 0) {
      console.log('❌ Aucune correspondance de réponse trouvée');
    } else {
      console.log(`📝 ${recentResponses.length} réponses trouvées:\n`);
      
      recentResponses.forEach((response, index) => {
        console.log(`📤 Réponse ${index + 1}:`);
        console.log(`   ID: ${response._id}`);
        console.log(`   Titre: ${response.title || response.subject}`);
        console.log(`   Type: ${response.type}`);
        console.log(`   Code: ${response.code || 'Aucun'}`);
        console.log(`   Auteur: ${response.authorId?.firstName} ${response.authorId?.lastName}`);
        console.log(`   Parent: ${response.parentCorrespondanceId?.title || response.parentCorrespondanceId?.subject} (${response.parentCorrespondanceId?._id})`);
        console.log(`   Créée le: ${new Date(response.createdAt).toLocaleString('fr-FR')}`);
        console.log(`   Status: ${response.status}`);
        console.log('');
      });
    }

    // 3. TESTER LA ROUTE API SIMULÉE
    console.log('🧪 === SIMULATION ROUTE API ===');
    
    // Simuler la requête sans includeReplies
    console.log('📋 Requête SANS includeReplies:');
    const withoutReplies = await Correspondance.find({ 
      parentCorrespondanceId: { $exists: false } 
    })
    .populate('authorId', 'firstName lastName email')
    .populate('personnesConcernees', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    console.log(`   Résultats: ${withoutReplies.length} correspondances`);
    
    // Simuler la requête avec includeReplies
    console.log('📋 Requête AVEC includeReplies:');
    const withReplies = await Correspondance.find({})
    .populate('authorId', 'firstName lastName email')
    .populate('personnesConcernees', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    console.log(`   Résultats: ${withReplies.length} correspondances`);
    
    // Comparer les résultats
    const onlyReplies = withReplies.filter(c => c.parentCorrespondanceId);
    console.log(`   Dont réponses: ${onlyReplies.length}`);

    if (onlyReplies.length > 0) {
      console.log('\n📤 Réponses qui devraient apparaître:');
      onlyReplies.forEach((reply, index) => {
        console.log(`   ${index + 1}. ${reply.title || reply.subject} (${reply.type})`);
      });
    }

    // 4. VÉRIFIER LES CORRESPONDANCES AVEC RÉPONSES
    console.log('\n🔗 === CORRESPONDANCES AVEC RÉPONSES ===');
    
    const correspondancesWithReplies = await Correspondance.aggregate([
      {
        $match: { parentCorrespondanceId: { $exists: false } }
      },
      {
        $lookup: {
          from: 'correspondances',
          localField: '_id',
          foreignField: 'parentCorrespondanceId',
          as: 'replies'
        }
      },
      {
        $match: { 'replies.0': { $exists: true } }
      },
      {
        $project: {
          title: 1,
          subject: 1,
          code: 1,
          type: 1,
          createdAt: 1,
          replyCount: { $size: '$replies' }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 5
      }
    ]);

    if (correspondancesWithReplies.length === 0) {
      console.log('❌ Aucune correspondance avec réponses trouvée');
    } else {
      console.log(`📝 ${correspondancesWithReplies.length} correspondances avec réponses:\n`);
      
      correspondancesWithReplies.forEach((corr, index) => {
        console.log(`🔗 Correspondance ${index + 1}:`);
        console.log(`   Titre: ${corr.title || corr.subject}`);
        console.log(`   Code: ${corr.code || 'Aucun'}`);
        console.log(`   Nombre de réponses: ${corr.replyCount}`);
        console.log('');
      });
    }

    // 5. RECOMMANDATIONS
    console.log('💡 === RECOMMANDATIONS ===');
    
    if (responseCorrespondances === 0) {
      console.log('🔧 1. Aucune réponse créée - Vérifiez le processus de création de réponses');
    } else {
      console.log('✅ 1. Des réponses existent dans la base de données');
    }
    
    console.log('🔧 2. Vérifiez que le frontend utilise includeReplies=true');
    console.log('🔧 3. Vérifiez les filtres côté frontend (type, status, etc.)');
    console.log('🔧 4. Vérifiez les permissions d\'accès aux réponses');
    
    if (onlyReplies.length > 0) {
      console.log('✅ 5. Les réponses devraient être visibles avec includeReplies=true');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

debugResponseVisibility();

const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * Script pour créer une correspondance de réponse de test
 */

async function createTestResponse() {
  try {
    console.log('📤 ========================================');
    console.log('📤 CRÉATION CORRESPONDANCE DE RÉPONSE TEST');
    console.log('📤 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. TROUVER UNE CORRESPONDANCE PRINCIPALE EXISTANTE
    console.log('🔍 === RECHERCHE CORRESPONDANCE PRINCIPALE ===');
    
    const parentCorrespondance = await Correspondance.findOne({ 
      parentCorrespondanceId: { $exists: false },
      type: 'INCOMING'
    }).lean();

    if (!parentCorrespondance) {
      console.log('❌ Aucune correspondance principale trouvée');
      return;
    }

    console.log(`✅ Correspondance parent trouvée:`);
    console.log(`   ID: ${parentCorrespondance._id}`);
    console.log(`   Titre: ${parentCorrespondance.title}`);
    console.log(`   Type: ${parentCorrespondance.type}`);
    console.log(`   Code: ${parentCorrespondance.code || 'Aucun'}\n`);

    // 2. TROUVER UN UTILISATEUR POUR CRÉER LA RÉPONSE
    console.log('👤 === RECHERCHE UTILISATEUR ===');
    
    const author = await User.findOne({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'AGENT_BUREAU_ORDRE'] },
      isActive: true
    });

    if (!author) {
      console.log('❌ Aucun utilisateur approprié trouvé');
      return;
    }

    console.log(`✅ Auteur trouvé:`);
    console.log(`   Nom: ${author.firstName} ${author.lastName}`);
    console.log(`   Email: ${author.email}`);
    console.log(`   Rôle: ${author.role}\n`);

    // 3. CRÉER LA CORRESPONDANCE DE RÉPONSE
    console.log('📝 === CRÉATION RÉPONSE ===');
    
    const responseData = {
      // Laisser MongoDB générer l'_id automatiquement
      title: `Réponse à: ${parentCorrespondance.title}`,
      subject: `RE: ${parentCorrespondance.subject}`,
      content: `Madame, Monsieur,

Suite à votre correspondance du ${new Date(parentCorrespondance.createdAt).toLocaleDateString('fr-FR')} concernant "${parentCorrespondance.subject}", nous avons l'honneur de vous informer de ce qui suit :

Après examen approfondi de votre demande, nous vous confirmons que :

1. Votre demande a été étudiée avec attention
2. Les services compétents ont été consultés
3. Une décision favorable a été prise

Nous vous prions de bien vouloir vous rapprocher de nos services pour finaliser les modalités pratiques.

Nous restons à votre entière disposition pour tout complément d'information.

Cordialement,

${author.firstName} ${author.lastName}
${author.role === 'DIRECTEUR' ? 'Directeur' : author.role === 'SOUS_DIRECTEUR' ? 'Sous-Directeur' : 'Agent Bureau d\'Ordre'}
Aéroport d'Enfidha`,
      
      // Champs obligatoires
      type: 'OUTGOING',
      from_address: 'direction@enfidha.tn',
      to_address: parentCorrespondance.from_address,
      priority: parentCorrespondance.priority || 'MEDIUM',
      status: 'REPLIED',
      airport: parentCorrespondance.airport || 'ENFIDHA',
      
      // Liaison avec la correspondance parent
      parentCorrespondanceId: parentCorrespondance._id,
      
      // Métadonnées
      authorId: author._id,
      code: `REP-${Date.now()}`,
      tags: ['réponse', 'test'],
      attachments: [],
      
      // Dates
      createdAt: new Date(),
      updatedAt: new Date(),
      date_correspondance: new Date(),
      responseDate: new Date()
    };

    const responseCorrespondance = new Correspondance(responseData);
    await responseCorrespondance.save();

    console.log('✅ Correspondance de réponse créée:');
    console.log(`   ID: ${responseCorrespondance._id}`);
    console.log(`   Titre: ${responseCorrespondance.title}`);
    console.log(`   Type: ${responseCorrespondance.type}`);
    console.log(`   Code: ${responseCorrespondance.code}`);
    console.log(`   Parent ID: ${responseCorrespondance.parentCorrespondanceId}\n`);

    // 4. METTRE À JOUR LA CORRESPONDANCE PARENT
    console.log('🔄 === MISE À JOUR CORRESPONDANCE PARENT ===');
    
    await Correspondance.findByIdAndUpdate(
      parentCorrespondance._id,
      {
        status: 'REPLIED',
        responseReference: responseCorrespondance._id.toString(),
        responseDate: new Date(),
        updatedAt: new Date()
      }
    );

    console.log('✅ Correspondance parent mise à jour (status: REPLIED)\n');

    // 5. VÉRIFICATION
    console.log('🧪 === VÉRIFICATION ===');
    
    const totalResponses = await Correspondance.countDocuments({ 
      parentCorrespondanceId: { $exists: true } 
    });
    
    const allCorrespondances = await Correspondance.countDocuments({});
    
    console.log(`📊 Total correspondances: ${allCorrespondances}`);
    console.log(`📤 Total réponses: ${totalResponses}`);
    
    // Test de récupération avec includeReplies
    const withReplies = await Correspondance.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const responseInList = withReplies.find(c => c._id.toString() === responseCorrespondance._id.toString());
    
    console.log(`🔍 Réponse visible dans la liste: ${responseInList ? '✅ Oui' : '❌ Non'}`);
    
    if (responseInList) {
      console.log(`   Titre: ${responseInList.title}`);
      console.log(`   Type: ${responseInList.type}`);
      console.log(`   Parent: ${responseInList.parentCorrespondanceId ? 'Oui' : 'Non'}`);
    }

    // 6. INSTRUCTIONS POUR LE FRONTEND
    console.log('\n💡 === INSTRUCTIONS FRONTEND ===');
    console.log('🔧 Pour voir les réponses dans l\'interface:');
    console.log('   1. Assurez-vous que includeReplies=true est utilisé');
    console.log('   2. Vérifiez les filtres de type (INCOMING/OUTGOING)');
    console.log('   3. Vérifiez les permissions d\'accès');
    console.log('   4. Rechargez la liste des correspondances');
    console.log(`   5. Recherchez la réponse: "${responseCorrespondance.title}"`);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

createTestResponse();

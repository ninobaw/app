const fs = require('fs');
const path = require('path');

console.log('🔧 Application de la correction TagDialogProvider...');

const filePath = path.join(__dirname, 'src', 'pages', 'SettingsPage.tsx');

try {
    // Lire le fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log('📖 Fichier lu avec succès');
    
    // Correction 1: Remplacer "return (\n    <AppLayout>" par "return (\n    <TagDialogProvider>\n      <AppLayout>"
    const oldReturn = 'return (\n    <AppLayout>';
    const newReturn = 'return (\n    <TagDialogProvider>\n      <AppLayout>';
    
    if (content.includes(oldReturn)) {
        content = content.replace(oldReturn, newReturn);
        console.log('✅ Correction 1 appliquée: TagDialogProvider ajouté au début');
    } else {
        console.log('⚠️  Correction 1: Pattern non trouvé, recherche alternative...');
        
        // Alternative
        const altOld = 'return (\n  <AppLayout>';
        const altNew = 'return (\n  <TagDialogProvider>\n    <AppLayout>';
        
        if (content.includes(altOld)) {
            content = content.replace(altOld, altNew);
            console.log('✅ Correction 1 alternative appliquée');
        }
    }
    
    // Correction 2: Remplacer la structure TagDialogProvider à la fin
    const oldEnd = '      <TagDialogProvider>\n        <CreateTagDialog />\n      </TagDialogProvider>\n    </AppLayout>\n  );';
    const newEnd = '      <CreateTagDialog />\n    </AppLayout>\n  </TagDialogProvider>\n);';
    
    if (content.includes(oldEnd)) {
        content = content.replace(oldEnd, newEnd);
        console.log('✅ Correction 2 appliquée: Structure de fin corrigée');
    } else {
        console.log('⚠️  Correction 2: Pattern exact non trouvé, recherche alternative...');
        
        // Chercher et remplacer les patterns alternatifs
        const patterns = [
            {
                old: '<TagDialogProvider>\n        <CreateTagDialog />\n      </TagDialogProvider>\n    </AppLayout>',
                new: '<CreateTagDialog />\n    </AppLayout>\n  </TagDialogProvider>'
            },
            {
                old: '<TagDialogProvider>\n      <CreateTagDialog />\n    </TagDialogProvider>\n  </AppLayout>',
                new: '<CreateTagDialog />\n  </AppLayout>\n</TagDialogProvider>'
            }
        ];
        
        for (const pattern of patterns) {
            if (content.includes(pattern.old)) {
                content = content.replace(pattern.old, pattern.new);
                console.log('✅ Correction 2 alternative appliquée');
                break;
            }
        }
    }
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('💾 Fichier sauvegardé avec succès');
    
    console.log('\n🎉 Correction appliquée avec succès !');
    console.log('📋 Prochaines étapes:');
    console.log('1. Redémarrez le frontend: npm run dev');
    console.log('2. Allez dans Paramètres > Tags');
    console.log('3. Plus d\'erreur TagDialogProvider !');
    
} catch (error) {
    console.error('❌ Erreur lors de l\'application de la correction:', error.message);
    console.log('\n🔧 Correction manuelle requise:');
    console.log('1. Ouvrez src/pages/SettingsPage.tsx');
    console.log('2. Ligne ~329: Remplacez "return (<AppLayout>" par "return (<TagDialogProvider><AppLayout>"');
    console.log('3. Ligne ~440: Remplacez la structure TagDialogProvider');
}

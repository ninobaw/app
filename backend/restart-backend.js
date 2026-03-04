const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Redémarrage du serveur backend...');

// Tuer tous les processus node existants
const killCommand = process.platform === 'win32' ? 'taskkill' : 'pkill';
const killArgs = process.platform === 'win32' ? ['/F', '/IM', 'node.exe'] : ['-f', 'node'];

const killProcess = spawn(killCommand, killArgs, { stdio: 'inherit' });

killProcess.on('close', (code) => {
  console.log('🛑 Processus node arrêtés');
  
  // Attendre 2 secondes puis redémarrer
  setTimeout(() => {
    console.log('🚀 Démarrage du nouveau serveur...');
    
    // Démarrer le serveur backend
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      shell: true
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage:', error);
    });
    
    console.log('✅ Serveur backend redémarré avec les nouveaux paramètres JWT');
    
  }, 2000);
});

killProcess.on('error', (error) => {
  console.log('⚠️ Aucun processus node à arrêter, démarrage direct...');
  
  setTimeout(() => {
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname),
      stdio: 'inherit',
      shell: true
    });
    
    console.log('✅ Serveur backend démarré avec les nouveaux paramètres JWT');
  }, 1000);
});

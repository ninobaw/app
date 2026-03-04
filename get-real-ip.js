const os = require('os');

// Obtenir la vraie IP réseau
const interfaces = os.networkInterfaces();
let realIP = null;

Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
            // Vérifier si c'est une IP de réseau local valide
            if (iface.address.startsWith('192.168.') || 
                iface.address.startsWith('10.') || 
                (iface.address.startsWith('172.') && 
                 parseInt(iface.address.split('.')[1]) >= 16 && 
                 parseInt(iface.address.split('.')[1]) <= 31)) {
                
                realIP = iface.address;
                console.log(`IP réseau trouvée: ${realIP}`);
            }
        }
    });
});

if (realIP) {
    console.log(`Configuration à utiliser:`);
    console.log(`VITE_API_BASE_URL=http://${realIP}:5000`);
    console.log(`FRONTEND_BASE_URL=http://${realIP}:8080`);
} else {
    console.log('Aucune IP réseau trouvée - utiliser localhost');
}

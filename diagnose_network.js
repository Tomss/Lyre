import net from 'node:net';
import dns from 'node:dns/promises';

async function diagnose() {
    const host = 'ssl0.ovh.net';
    const ports = [465, 587, 25, 2525];

    console.log(`--- Diagnostics Réseau pour ${host} ---`);
    
    try {
        const addresses = await dns.resolve4(host);
        console.log(`DNS ok : ${host} -> ${addresses.join(', ')}`);
    } catch (err) {
        console.error(`Erreur DNS :`, err.message);
    }

    for (const port of ports) {
        console.log(`Test de connexion vers le port ${port}...`);
        const start = Date.now();
        
        try {
            await new Promise((resolve, reject) => {
                const socket = net.createConnection(port, host, () => {
                    socket.end();
                    resolve(true);
                });
                socket.setTimeout(5000);
                socket.on('timeout', () => {
                    socket.destroy();
                    reject(new Error('Timeout after 5s'));
                });
                socket.on('error', (err) => {
                    reject(err);
                });
            });
            console.log(`✅ Port ${port} est OUVERT ! (réponse en ${Date.now() - start}ms)`);
        } catch (err) {
            console.error(`❌ Port ${port} est FERMÉ ou BLOQUÉ : ${err.message}`);
        }
    }
    
    console.log('---------------------------------------');
    process.exit(0);
}

diagnose();

// --- START OF FILE detector.js (CORRECCIÓN DEFINITIVA PARA "undefined") ---

const { WebcastPushConnection } = require('tiktok-live-connector');

function startTikTokDetector(mainWindow, username, forceGiftFetch = false, onGiftsFetched = () => {}) {
    let tiktokLiveConnection = new WebcastPushConnection(username, {
        processInitialData: true,
        fetchRoomInfoOnConnect: true,
        enableExtendedGiftInfo: true
    });

    console.log(`[DETECTOR] Intentando conectar a @${username}...`);
    mainWindow.webContents.send('connection-status', `Conectando a @${username}...`);

    tiktokLiveConnection.connect().then(state => {
        console.info(`[DETECTOR] ✅ Conectado a @${username}`);
        mainWindow.webContents.send('connection-status', `✅ Conectado a @${username}`);
        if (forceGiftFetch) {
            const giftList = tiktokLiveConnection.availableGifts;
            if (giftList && giftList.length > 0) onGiftsFetched(giftList);
        }
    }).catch(err => {
        console.error(`[DETECTOR] ❌ Error al conectar:`, err);
        mainWindow.webContents.send('connection-status', `❌ Error al conectar. ¿Está el usuario en LIVE?`);
    });

    // --- TU LÓGICA DE REGALOS ORIGINAL (INTACTA) ---
    tiktokLiveConnection.on('gift', (data) => {
        if (!data.giftName) { return; }
        mainWindow.webContents.send('new-gift', data);
        
        console.log(`\n--- 🎁 Evento de Regalo Recibido ---`);
        console.log(`De: @${data.uniqueId}`);
        console.log(`Regalo: ${data.giftName}`);
        console.log(`Cantidad en este evento (combo): ${data.repeatCount}`);
        console.log(`-----------------------------------`);
        for (let i = 0; i < data.repeatCount; i++) {
            console.log(`  -> Procesando regalo individual #${i + 1}: Un(a) "${data.giftName}" de @${data.uniqueId}`);
        }
        console.log(`--- ✅ ${data.repeatCount} regalos procesados individualmente ---\n`);
    });

    // --- TUS OTROS EVENTOS ORIGINALES (INTACTOS) ---
    tiktokLiveConnection.on('chat', (data) => {
        console.log(`💬 [CHAT] @${data.uniqueId}: ${data.comment}`);
        mainWindow.webContents.send('new-chat', data);
    });

    tiktokLiveConnection.on('like', (data) => {
        console.log(`❤️  @${data.uniqueId} ha dado like! (Total de likes: ${data.totalLikeCount})`);
        mainWindow.webContents.send('new-like', { ...data, nickname: data.uniqueId });
    });

    tiktokLiveConnection.on('follow', (data) => {
        console.log(`➕ @${data.uniqueId} ha comenzado a seguir!`);
        mainWindow.webContents.send('new-follow', { ...data, nickname: data.uniqueId });
    });
    
    // --- LÓGICA ADICIONAL PARA COMPLETAR FUNCIONALIDAD ---
    tiktokLiveConnection.on('share', (data) => mainWindow.webContents.send('new-share', { ...data, nickname: data.uniqueId }));
    
    // === ¡AQUÍ ESTÁ LA CORRECCIÓN DEFINITIVA! ===
    // El evento 'roomUser' de API Server envía una lista de usuarios en 'topViewers'.
    // Necesitamos recorrer esa lista.
    tiktokLiveConnection.on('roomUser', (data) => {
        if (data.topViewers && Array.isArray(data.topViewers)) {
            data.topViewers.forEach(viewer => {
                if (viewer.user) {
                    // Usamos el nombre visible (nickname) o el @usuario (uniqueId) si el primero no está.
                    const displayName = viewer.user.nickname || viewer.user.uniqueId;
                    if (displayName) {
                        mainWindow.webContents.send('new-join', { nickname: displayName });
                    }
                }
            });
        }
    });
    // === FIN DE LA CORRECCIÓN ===

    tiktokLiveConnection.on('disconnect', () => {
        console.warn('🔌 Desconectado del LIVE.');
        mainWindow.webContents.send('connection-status', '🔌 Desconectado del LIVE.');
    });

    tiktokLiveConnection.on('error', (err) => {
        console.error('💥 Ocurrió un error en la conexión:', err);
    });

    // Devolvemos un objeto para que main.js pueda detener la conexión
    return {
        stop: () => {
            tiktokLiveConnection.disconnect();
        },
        getGifts: () => tiktokLiveConnection.availableGifts || []
    };
}

module.exports = {
    startTikTokDetector
};
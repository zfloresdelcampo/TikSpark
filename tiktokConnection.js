// --- START OF FILE detector.js (ESTRATEGIA DOBLE IDENTIDAD: PC + GOOGLEBOT) ---

const { WebcastPushConnection } = require('tiktok-live-connector');
const { net } = require('electron');

// --- FUNCIÓN SCRAPER MEJORADA: Si falla como PC, intenta como Google ---
function fetchProfileViaHTML(username) {
    // Definimos los dos disfraces
    const userAgents = {
        pc: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    };

    // Función auxiliar para hacer la petición
    const tryRequest = (agentType) => {
        return new Promise((resolve) => {
            const request = net.request({
                method: 'GET',
                url: `https://www.tiktok.com/@${username}?lang=en`, // Forzamos inglés para estandarizar
                useSessionCookies: false
            });

            request.setHeader('User-Agent', userAgents[agentType]);
            
            request.on('response', (response) => {
                let htmlData = '';
                response.on('data', (chunk) => { htmlData += chunk; });
                
                response.on('end', () => {
                    try {
                        let avatarUrl = null;
                        let nickname = username;

                        // 1. BUSCAR FOTO
                        let metaMatch = htmlData.match(/<meta property="og:image" content="([^"]+)"/);
                        if (metaMatch) {
                            avatarUrl = metaMatch[1];
                        } else {
                            // Búsqueda profunda en JSON
                            let jsonMatch = htmlData.match(/"avatarLarger":"([^"]+)"/) || 
                                            htmlData.match(/"avatarMedium":"([^"]+)"/) || 
                                            htmlData.match(/"avatarThumb":"([^"]+)"/);
                            if (jsonMatch) avatarUrl = jsonMatch[1].replace(/\\u002F/g, "/").replace(/\\/g, "");
                        }

                        // 2. BUSCAR NICKNAME
                        let nickJsonMatch = htmlData.match(/"nickname":"([^"]+)"/);
                        if (nickJsonMatch) {
                            try { nickname = JSON.parse(`"${nickJsonMatch[1]}"`); } catch (e) { nickname = nickJsonMatch[1]; }
                        } else {
                            let titleMatch = htmlData.match(/<title>([^<]+)<\/title>/);
                            if (titleMatch) {
                                let parts = titleMatch[1].split(' (@');
                                if (parts.length > 1) nickname = parts[0].trim();
                            }
                        }

                        if (avatarUrl) {
                            resolve({ success: true, nickname, avatar: avatarUrl });
                        } else {
                            resolve({ success: false });
                        }
                    } catch (e) {
                        resolve({ success: false });
                    }
                });
            });

            request.on('error', () => resolve({ success: false }));
            request.end();
        });
    };

    // LÓGICA PRINCIPAL: Intento 1 (PC) -> Si falla -> Intento 2 (Googlebot)
    return new Promise(async (resolve) => {
        console.log(`[SCRAPER] Analizando perfil de @${username} (Modo PC)...`);
        let result = await tryRequest('pc');

        if (result.success) {
            console.log(`[SCRAPER] ✅ Éxito (@${username}): Foto encontrada.`);
            resolve(result);
        } else {
            console.log(`[SCRAPER] ⚠️ Falló modo PC para @${username}. Reintentando como Googlebot...`);
            let resultGoogle = await tryRequest('google');
            
            if (resultGoogle.success) {
                console.log(`[SCRAPER] ✅ Éxito (@${username}): Foto encontrada (Modo Google).`);
                resolve(resultGoogle);
            } else {
                console.log(`[SCRAPER] ❌ Imposible obtener foto para @${username}.`);
                resolve(null);
            }
        }
    });
}

function startTikTokDetector(mainWindow, username, forceGiftFetch = false, onGiftsFetched = () => {}) {
    
    // Configuración de la conexión
    let tiktokLiveConnection = new WebcastPushConnection(username, {
        processInitialData: false, // false para que cargue más rápido al inicio
        enableExtendedGiftInfo: true,
        requestPollingIntervalMs: 1000, // Déjalo en 1000 (1 seg) para que sea estable con la Key
        
        // === AQUÍ RECUPERAMOS TU LLAVE EULER ===
        requestOptions: {
            apiKey: "euler_NGRjMDcyZDA1MDVlZTJjODU0YjRlNjI4YWEzYTg1Nzc1ZTY1ZTdmOTJkMmZjYzhlODBmNTQ0"
        },
        // =======================================

        clientParams: {
            appLanguage: 'es',
            devicePlatform: 'web'
        }
    });

    // Variable para guardar info básica de la sala (para el login externo)
    let currentRoomInfo = null; // <--- NUEVO: AQUÍ GUARDAMOS LA DATA

    console.log(`[DETECTOR] Iniciando servicio para @${username}`);
    mainWindow.webContents.send('connection-status', `Conectando a @${username}...`);

    // 1. EJECUTAR SCRAPER (Con reintento automático)
    fetchProfileViaHTML(username).then(data => {
        if (data && data.avatar) {
            mainWindow.webContents.send('update-user-profile', {
                nickname: data.nickname,
                avatar: data.avatar
            });
        }
    });

    // 2. CONEXIÓN AL CHAT
    tiktokLiveConnection.connect().then(state => {
        console.info(`[DETECTOR] ✅ Conectado al Live de @${username}`);
        mainWindow.webContents.send('connection-status', `✅ Conectado a @${username}`);

        currentRoomInfo = state.roomInfo; // <--- NUEVO: CAPTURAMOS LA DATA

        // === NUEVO: ENVIAR DATOS INICIALES DE LA SALA (LIKES, ETC) ===
        if (state.roomInfo) {
            mainWindow.webContents.send('room-info', state.roomInfo);
        }
        // =============================================================

        // INTENTO DE RESPALDO OFICIAL
        if (state.roomInfo && state.roomInfo.owner) {
            const owner = state.roomInfo.owner;
            const officialAvatar = (owner.avatarLarge && owner.avatarLarge.url_list[0]) || 
                                   (owner.avatarMedium && owner.avatarMedium.url_list[0]);
            
            if (officialAvatar) {
                mainWindow.webContents.send('update-user-profile', {
                    nickname: owner.nickname || username,
                    avatar: officialAvatar
                });
            }
        }

        if (forceGiftFetch) {
            const giftList = tiktokLiveConnection.availableGifts;
            if (giftList && giftList.length > 0) onGiftsFetched(giftList);
        }

    }).catch(err => {
        console.error(`[DETECTOR] Error Socket:`, err);
        // Mensaje más amigable para el error 500
        if (err.toString().includes('500') || err.toString().includes('Sign Error')) {
            mainWindow.webContents.send('connection-status', `⚠️ Error Servidor TikTok (Reintentando...)`);
            // Truco: Reintentar conexión automáticamente en 3 segundos si es error de firma
            setTimeout(() => {
                if (mainWindow) startTikTokDetector(mainWindow, username, forceGiftFetch, onGiftsFetched);
            }, 3000);
        } else {
            mainWindow.webContents.send('connection-status', `⚠️ Conexión Limitada`);
        }
    });

    tiktokLiveConnection.on('gift', (data) => {
        if (!data.giftName) return;
        mainWindow.webContents.send('new-gift', data);
    });

    tiktokLiveConnection.on('chat', (data) => {
        // Verificamos si hay emotes en el mensaje
        const isEmote = data.emotes && data.emotes.length > 0;
        
        let emoteData = null;
        
        if (isEmote) {
            const emoteObj = data.emotes[0];
            
            // --- CORRECCIÓN AQUÍ ---
            // TikTok envía las imágenes en 'url_list', no en 'url'.
            // Usamos ?. (optional chaining) para que no crashee si falta algún dato.
            const imageUrl = emoteObj.image?.url_list?.[0] || emoteObj.image?.url || '';
            
            emoteData = {
                // Aseguramos que el ID sea string para comparar
                id: String(emoteObj.emoteId || emoteObj.id), 
                image: imageUrl
            };
            
            console.log(`[DETECTOR] Emote recibido: ${emoteData.id}`);
        }

        mainWindow.webContents.send('new-chat', {
            ...data,
            isEmote: isEmote,
            emoteData: emoteData
        });
    });

    tiktokLiveConnection.on('like', (data) => {
        // Enviamos TODO el objeto data, que incluye likeCount y totalLikeCount
        mainWindow.webContents.send('new-like', { 
            ...data, 
            nickname: data.nickname || data.uniqueId 
        });
    });
    tiktokLiveConnection.on('follow', (data) => mainWindow.webContents.send('new-follow', { ...data, nickname: data.nickname || data.uniqueId }));
    tiktokLiveConnection.on('share', (data) => mainWindow.webContents.send('new-share', { ...data, nickname: data.nickname || data.uniqueId }));
    
    tiktokLiveConnection.on('roomUser', (data) => {
        if (data.topViewers && Array.isArray(data.topViewers)) {
            data.topViewers.forEach(viewer => {
                if (viewer.user) {
                    const displayName = viewer.user.nickname || viewer.user.uniqueId;
                    if (displayName) mainWindow.webContents.send('new-join', { nickname: displayName });
                }
            });
        }
    });

    tiktokLiveConnection.on('disconnect', () => {
        mainWindow.webContents.send('connection-status', '🔌 Desconectado.');
    });

    tiktokLiveConnection.on('error', (err) => {});

    return {
        stop: () => tiktokLiveConnection.disconnect(),
        getGifts: () => tiktokLiveConnection.availableGifts || [],
        // Exponemos la info para que main.js la use en el login
        getRoomData: () => currentRoomInfo // <--- NUEVO: EXPORTAMOS LA DATA
    };
}

module.exports = { 
    startTikTokDetector,
    fetchProfileViaHTML // <--- AGREGAMOS ESTO PARA PODER USARLO EN MAIN.JS
};
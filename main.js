// --- START OF FILE main.js ---

const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron'); // <-- Añade 'shell'
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const WinReg = require('winreg');
const WebSocket = require('ws');
const axios = require('axios');
const cheerio = require('cheerio');
const { startTikTokDetector , fetchProfileViaHTML } = require('./tiktokConnection.js');
const { autoUpdater } = require('electron-updater');

// --- MANEJO DE DATOS DE WIDGETS (PERSISTENCIA) ---
const widgetsPath = path.join(app.getPath('userData'), 'widgets.json');

// Valores por defecto por si el archivo no existe
const defaultWidgetsDB = {
    mediaOverlay: {},
    metaWin1: { conteo: 0, meta: 5 },
    metaWin2: { conteo: 0, meta: 5 },
    subasta: { isRunning: false },
    socialRotator: { accounts: [] },
    // AQUÍ ESTÁ EL CAMBIO:
    topGift: { 
        username: 'Username', 
        coins: 0, 
        giftName: 'Default', 
        giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8173e9b07875cca37caa5219e4903a40.png~tplv-obj.webp' 
    },

    topStreak: {
        username: 'Username',
        streakCount: 0,
        giftName: 'Default',
        giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp'
    }
};

function loadWidgetsData() {
    try {
        if (fs.existsSync(widgetsPath)) {
            const savedData = JSON.parse(fs.readFileSync(widgetsPath));
            // Mezclamos con los defaults para asegurar que no falten claves nuevas
            return { ...defaultWidgetsDB, ...savedData };
        }
    } catch (error) {
        console.error('Error al cargar widgets.json:', error);
    }
    return JSON.parse(JSON.stringify(defaultWidgetsDB)); // Copia limpia de defaults
}

function saveWidgetsData(data) {
    try {
        fs.writeFileSync(widgetsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al guardar widgets.json:', error);
    }
}

// --- INICIO: SERVIDOR LOCAL + SOCKET.IO ---
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const expressApp = express();
const httpServer = http.createServer(expressApp);
const io = new Server(httpServer); // Creamos el servidor de WebSockets

const SERVER_PORT = 5500;

// Servir archivos estáticos (Tus overlays)
expressApp.use(express.static(path.join(__dirname)));

// BASE DE DATOS LOCAL
// Ahora cargamos desde el archivo al iniciar
let localWidgetsDB = loadWidgetsData();

io.on('connection', (socket) => {
    // Cuando un overlay se conecta, le enviamos todo lo que hay guardado
    socket.emit('init-data', localWidgetsDB);
});

serverInstance = httpServer.listen(SERVER_PORT, () => {
    console.log(`✅ Servidor Local (Socket.io) listo en: http://localhost:${SERVER_PORT}`);
});
// --- FIN: SERVIDOR LOCAL ---

const soundsPath = path.join(app.getPath('userData'), 'sounds');
if (!fs.existsSync(soundsPath)) {
    fs.mkdirSync(soundsPath);
}

// --- DECLARACIÓN DE VARIABLES GLOBALES ---
let mainWindow = null;
let currentDetector = null;
let tikfinitySocket = null;
let currentUsername = '';

// --- MANEJO DE CONFIGURACIÓN DE USUARIO ---
const configPath = path.join(app.getPath('userData'), 'config.json');
function loadConfig() { try { if (fs.existsSync(configPath)) { return JSON.parse(fs.readFileSync(configPath, 'utf8')); } } catch (error) { console.error('Error al cargar la configuración:', error); } return {}; }
function saveConfig(config) { try { fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (error) { console.error('Error al guardar la configuración:', error); } }

// --- LÓGICA PARA CACHÉ DE REGALOS ---
const giftsPath = path.join(app.getPath('userData'), 'gifts.json');
function loadGifts() { try { if (fs.existsSync(giftsPath)) { return JSON.parse(fs.readFileSync(giftsPath)); } } catch (error) { console.error('Error al cargar los regalos guardados:', error); } return []; }
function saveGifts(gifts) { try { fs.writeFileSync(giftsPath, JSON.stringify(gifts, null, 2)); console.log("Lista de regalos actualizada y guardada."); } catch (error) { console.error('Error al guardar la lista de regalos:', error); } }

// --- LÓGICA PARA CACHÉ DE EMOTES (NUEVO) ---
const emotesPath = path.join(app.getPath('userData'), 'emotes.json');

ipcMain.handle('save-emotes', (event, emotes) => {
    try {
        fs.writeFileSync(emotesPath, JSON.stringify(emotes, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando emotes:', error);
        return false;
    }
});

ipcMain.handle('get-saved-emotes', () => {
    try {
        if (fs.existsSync(emotesPath)) {
            return JSON.parse(fs.readFileSync(emotesPath));
        }
    } catch (error) {
        console.error('Error cargando emotes:', error);
    }
    return [];
});

// --- FUNCIÓN PARA ENCONTRAR AUTOIT ---
async function findAutoItExecutable() { const registryKeys = [new WinReg({ hive: WinReg.HKLM, key: '\\SOFTWARE\\WOW6432Node\\AutoIt v3\\AutoIt' }), new WinReg({ hive: WinReg.HKLM, key: '\\SOFTWARE\\AutoIt v3\\AutoIt' })]; for (const regKey of registryKeys) { try { const item = await new Promise((resolve) => { regKey.get('InstallDir', (err, result) => resolve(err ? null : result)); }); if (item && item.value) { const exePath = path.join(item.value, 'AutoIt3.exe'); if (fs.existsSync(exePath)) { return exePath; } } } catch (error) { /* Ignorar errores */ } } return null; }

// --- FUNCIÓN PARA INICIAR EL DETECTOR DIRECTO ---
function startDetector(forceGiftFetch = false) { if (currentDetector) { currentDetector.stop(); currentDetector = null; } if (currentUsername && currentUsername.trim() !== '') { currentDetector = startTikTokDetector(mainWindow, currentUsername, forceGiftFetch, (gifts) => { saveGifts(gifts); mainWindow.webContents.send('show-toast', '✅ Lista de regalos actualizada y guardada.'); }); } else { mainWindow.webContents.send('connection-status', 'Desconectado.'); } }

// --- FUNCIÓN PRINCIPAL PARA CREAR LA VENTANA ---
function createWindow() {
    currentUsername = loadConfig().username || '';
    mainWindow = new BrowserWindow({ width: 1200, height: 800, show: false, webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, backgroundThrottling: false } });
    
    // === BARRA SUPERIOR MOLESTA ===
    mainWindow.setMenu(null);
    // === FIN DE LA LÍNEA AÑADIDA ===

    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', () => {
        // 1. Enviar versión
        mainWindow.webContents.send('set-version', app.getVersion());

        // 2. (NUEVO) Si ya hay un detector corriendo, enviar estado y datos de sala INMEDIATAMENTE
        if (currentDetector) {
            mainWindow.webContents.send('connection-status', `✅ Conectado a @${currentUsername}`);
            
            // Recuperamos la info guardada en el detector
            const roomInfo = currentDetector.getRoomData();
            if (roomInfo) {
                console.log("Enviando Room Info recuperada al recargar ventana...");
                mainWindow.webContents.send('room-info', roomInfo);
            }
        } else {
            mainWindow.webContents.send('connection-status', 'Desconectado. Introduce un usuario.');
        }
    });
    
    // En cuanto la app esté lista, busca una actualización.
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });

    // Evento: Se encontró una actualización disponible.
    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('show-toast', '¡Nueva actualización disponible! Descargando...');
    });

    // Evento: La actualización se ha descargado.
    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Actualización Lista',
            message: 'Nueva versión descargada. ¿Reiniciar e instalar ahora?',
            buttons: ['Sí, reiniciar', 'Más tarde']
        }).then(result => {
            if (result.response === 0) { // Si el usuario hace clic en "Sí, reiniciar"
                autoUpdater.quitAndInstall();
            }
        });
    });

    // --- NUEVO: LÓGICA DE DETECCIÓN DE JUEGOS ---
    function getSteamLibraryFolders() {
        const potentialSteamPaths = [
            'C:\\Program Files (x86)\\Steam',
            'C:\\Program Files\\Steam',
            'D:\\Steam',
            'E:\\Steam' 
        ];

        let steamPath = potentialSteamPaths.find(p => fs.existsSync(p));
        if (!steamPath) return [];

        const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
        const libraries = [path.join(steamPath, 'steamapps')]; 

        if (fs.existsSync(vdfPath)) {
            try {
                const content = fs.readFileSync(vdfPath, 'utf8');
                // Busca patrones tipo "path" "C:\\juegos"
                const regex = /"path"\s+"(.+?)"/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    // Limpia las barras dobles
                    let libPath = match[1].replace(/\\\\/g, '\\');
                    libraries.push(path.join(libPath, 'steamapps'));
                }
            } catch (e) {
                console.error("Error leyendo librerías de Steam:", e);
            }
        }
        return libraries;
    }

    // --- MANEJADORES DE IPC ---
    ipcMain.handle('get-username', () => currentUsername);
    
    ipcMain.handle('save-username', (event, newUsername) => { if (tikfinitySocket) { tikfinitySocket.close(); tikfinitySocket = null; } currentUsername = newUsername || ''; saveConfig({ username: currentUsername }); startDetector(); return true; });
    
    ipcMain.handle('disconnect-tiktok', () => {
        if (currentDetector) {
            currentDetector.stop();
            currentDetector = null;
        }
        currentUsername = '';
        saveConfig({ username: '' });
        mainWindow.webContents.send('connection-status', 'Desconectado.');
        return true;
    });


    ipcMain.handle('select-audio-file', async () => {
        const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar archivo de audio',
            properties: ['openFile'],
            filters: [{ name: 'Audios', extensions: ['mp3', 'wav', 'ogg'] }]
        });

        if (canceled || !filePaths || filePaths.length === 0) {
            return { success: false, canceled: true };
        }

        const sourcePath = filePaths[0];
        const fileName = path.basename(sourcePath);
        const destPath = path.join(soundsPath, fileName);

        try {
            fs.copyFileSync(sourcePath, destPath);
            
            // Notificamos a la ventana que la lista ha cambiado.
            const updatedList = fs.readdirSync(soundsPath);
            mainWindow.webContents.send('audio-list-updated', updatedList);
            
            // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
            // Devolvemos el nombre del archivo para que la interfaz lo pueda usar.
            return { success: true, fileName: fileName }; 

        } catch (error) {
            console.error('Error al copiar el archivo de audio:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-local-audios', () => {
        try {
            return fs.readdirSync(soundsPath);
        } catch (error) {
            console.error('Error al leer la carpeta de sonidos:', error);
            return [];
        }
    });

    ipcMain.handle('open-sounds-folder', () => {
        // 'soundsPath' es la variable que ya definimos al principio de este archivo
        shell.openPath(soundsPath).catch(err => {
            console.error("No se pudo abrir la carpeta de sonidos:", err);
        });
    });

    ipcMain.handle('play-local-audio', (event, fileName) => {
        const audioPath = path.join(soundsPath, fileName);
        // Usamos shell.openPath para que el sistema operativo lo reproduzca con el programa por defecto.
        shell.openPath(audioPath).catch(err => {
            console.error("No se pudo reproducir el audio:", err);
        });
    });

    ipcMain.handle('delete-local-audio', (event, fileName) => {
        const audioPath = path.join(soundsPath, fileName);
        try {
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
                // Notificamos a la UI que la lista ha cambiado.
                const updatedList = fs.readdirSync(soundsPath);
                mainWindow.webContents.send('audio-list-updated', updatedList);
                return { success: true };
            }
            return { success: false, message: 'El archivo no existe.' };
        } catch (error) {
            console.error("Error al borrar el audio:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-audio-file-path', (event, fileName) => {
        const audioPath = path.join(soundsPath, fileName);
        return `file://${audioPath.replace(/\\/g, '/')}`; // Asegura formato URL correcto
    });

    ipcMain.handle('download-myinstants-audio', async (event, url) => {
        if (!url || !url.includes('myinstants.com')) {
            return { success: false, message: 'URL de MyInstants no válida.' };
        }

        try {
            const pageResponse = await axios.get(url);
            const $ = cheerio.load(pageResponse.data);

            // --- INICIO DE LA CORRECCIÓN ---
            // Método robusto para encontrar la URL del MP3

            let mp3Path;
            
            // Intento 1: Buscar el botón de play original
            const onclickAttr = $('#instant-page-button').attr('onclick');
            if (onclickAttr && onclickAttr.includes('play')) {
                mp3Path = onclickAttr.split("'")[1];
            }

            // Intento 2: Si el primero falla, buscar un link de descarga directo
            if (!mp3Path) {
                $('a').each((i, elem) => {
                    const href = $(elem).attr('href');
                    if (href && href.endsWith('.mp3')) {
                        mp3Path = href;
                        return false; // Detiene el bucle en cuanto encuentra el primer mp3
                    }
                });
            }
            // --- FIN DE LA CORRECCIÓN ---
            
            if (!mp3Path) {
                throw new Error('No se pudo encontrar el link del MP3 en la página.');
            }
            
            // Asegurarse de que la URL sea completa
            const mp3Url = mp3Path.startsWith('http') ? mp3Path : `https://www.myinstants.com${mp3Path}`;
            
            const fileName = path.basename(mp3Url).split('?')[0]; // Limpia parámetros de la URL
            const destPath = path.join(soundsPath, fileName);

            const audioResponse = await axios({
                method: 'get',
                url: mp3Url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(destPath);
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const updatedList = fs.readdirSync(soundsPath);
            mainWindow.webContents.send('audio-list-updated', updatedList);

            return { success: true, message: `✅ Sonido "${fileName}" descargado.` };

        } catch (error) {
            console.error('Error al descargar desde MyInstants:', error);
            return { success: false, message: `❌ Error al descargar el sonido.` };
        }
    });

    ipcMain.handle('export-profile', async (event, profileData) => { const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, { title: 'Exportar Perfil', defaultPath: `${profileData.name}.json`, filters: [{ name: 'Archivos JSON', extensions: ['json'] }] }); if (!canceled && filePath) { try { const fileContent = JSON.stringify(profileData.data, null, 2); fs.writeFileSync(filePath, fileContent, 'utf-8'); return { success: true, path: filePath }; } catch (error) { return { success: false, error: error.message }; } } return { success: false, canceled: true }; });
    ipcMain.handle('import-profile', async () => { const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, { title: 'Importar Perfil', properties: ['openFile'], filters: [{ name: 'Archivos JSON', extensions: ['json'] }] }); if (!canceled && filePaths.length > 0) { const filePath = filePaths[0]; try { const fileContent = fs.readFileSync(filePath, 'utf-8'); const profileData = JSON.parse(fileContent); return { success: true, data: profileData }; } catch (error) { return { success: false, error: 'El archivo está dañado o no tiene el formato correcto.' }; } } return { success: false, canceled: true }; });

    // -- Conexión a TikFinity (MEJORADA CON FOTO) --
    ipcMain.handle('connect-tikfinity', async () => { // <--- Ahora es async
        if (tikfinitySocket) return;
        
        // Si había un detector nativo corriendo, lo paramos
        if (currentDetector) { 
            currentDetector.stop(); 
            currentDetector = null; 
        }

        mainWindow.webContents.send('connection-status', 'Conectando a TikFinity...');
        
        // 1. NUEVO: Intentar obtener la foto de perfil inmediatamente
        if (currentUsername) {
            console.log(`[TIKFINITY] Buscando foto de perfil para: ${currentUsername}`);
            // Usamos la función que importamos de detector.js
            fetchProfileViaHTML(currentUsername).then(data => {
                if (data && data.avatar) {
                    // Enviamos la foto al Frontend (script.js)
                    mainWindow.webContents.send('update-user-profile', { 
                        nickname: data.nickname || currentUsername,
                        avatar: data.avatar
                    });
                }
            });
        }

        // 2. Conexión WebSocket normal (tu código original intacto)
        tikfinitySocket = new WebSocket('ws://localhost:21213/');

        tikfinitySocket.on('open', () => {
            mainWindow.webContents.send('connection-status', '✅ Conectado vía TikFinity');
        });

        tikfinitySocket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                // console.log('[TIKFINITY RAW]', JSON.stringify(message, null, 2)); // Descomentar para debug
                
                if (message.event === 'gift' && message.data) {
                    mainWindow.webContents.send('new-gift', message.data);
                    return;
                }

                if (message.event === 'chat' || message.event === 'like') {
                    if (message.data.nickname) {
                        mainWindow.webContents.send(message.event === 'chat' ? 'new-chat' : 'new-like', message.data);
                    }
                    return;
                }

                if (message.event === 'follow' || message.event === 'share') {
                    if (message.data.uniqueId) {
                        const translatedData = { ...message.data, nickname: message.data.nickname || message.data.uniqueId };
                        mainWindow.webContents.send(message.event === 'follow' ? 'new-follow' : 'new-share', translatedData);
                    }
                    return;
                }

                // SOLO Suscripción real o Super Fan
                if (message.event === 'subscribe' || message.event === 'superfan') {
                    console.log("¡Nuevo Super Fan detectado!");
                    mainWindow.webContents.send('new-member', message.data);
                    return;
                }

                if (message.event === 'roomUser' && message.data.topViewers) {
                    message.data.topViewers.forEach(viewer => {
                        if (viewer.user && viewer.user.nickname) {
                            mainWindow.webContents.send('new-join', { nickname: viewer.user.nickname });
                        }
                    });
                    return;
                }
            } catch (error) {
                console.error('Error procesando mensaje de TikFinity:', error);
            }
        });

        tikfinitySocket.on('close', () => {
            mainWindow.webContents.send('connection-status', '❌ Desconectado de TikFinity');
            tikfinitySocket = null;
        });

        tikfinitySocket.on('error', (err) => {
            console.error('[TIKFINITY ERROR]', err.message);
            mainWindow.webContents.send('connection-status', '❌ Error TikFinity (¿Está abierta la app?)');
            if (tikfinitySocket) {
                tikfinitySocket.close();
                tikfinitySocket = null;
            }
        });
    });

    ipcMain.handle('disconnect-tikfinity', () => { if (tikfinitySocket) { tikfinitySocket.close(); } });

    ipcMain.handle('simulate-keystrokes', async (event, actionData) => {
        const autoItExecutable = await findAutoItExecutable();
        if (!autoItExecutable) {
            mainWindow.webContents.send('show-toast', '❌ Error: No se encontró la instalación de AutoIt.');
            return { success: false };
        }

        const { sequence, repeat = 1, interval = 100 } = actionData;
        if (!sequence || sequence.length === 0) {
            return { success: false };
        }
        
        // --- INICIO DE LA CORRECCIÓN ---
        const isPackaged = app.isPackaged;
        const scriptPath = isPackaged
            ? path.join(path.dirname(app.getPath('exe')), 'resources', 'app.asar.unpacked', 'keystroke.au3')
            : path.join(__dirname, 'keystroke.au3');
        // --- FIN DE LA CORRECCIÓN ---

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        const executeKey = (keyData) => new Promise((resolve, reject) => {
            const args = [
                scriptPath, 
                keyData.key, 
                keyData.modifier || 'none', 
                keyData.type || 'tap', 
                String(keyData.duration || 100)
            ];
            execFile(autoItExecutable, args, (error) => {
                if (error) {
                    // Añadimos un log más detallado para futuros errores
                    console.error('Error al ejecutar AutoIt:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        try {
            for (let i = 0; i < repeat; i++) {
                for (const key of sequence) {
                    if (key.delay > 0) await sleep(key.delay);
                    await executeKey(key);
                }
                if (i < repeat - 1) await sleep(interval);
            }
            mainWindow.webContents.send('show-toast', '✅ Tecla simulada con éxito.');
        } catch (error) {
            mainWindow.webContents.send('show-toast', '❌ Error al simular la tecla.');
        }

        return { success: true };
    });
    ipcMain.handle('get-available-gifts', async () => { const savedGifts = loadGifts(); if (savedGifts && savedGifts.length > 0) return savedGifts; if (currentDetector && currentDetector.getGifts) { const liveGifts = currentDetector.getGifts(); if (liveGifts && liveGifts.length > 0) { saveGifts(liveGifts); return liveGifts; } } return []; });
    
    // --- LOGIN Y OBTENCIÓN DE EMOTES (MODO MAESTRO: SIN LIVE + LOGIN FANTASMA) ---
    ipcMain.handle('login-and-fetch-emotes', async () => {
        
        // 1. Validar que hay un usuario escrito en la configuración
        const targetUsername = currentUsername;
        if (!targetUsername) {
            return { success: false, message: '⚠️ Configura un nombre de usuario primero en Inicio.' };
        }

        // Variables para guardar los IDs necesarios
        let secUid = '';
        let roomId = '';

        // ESTRATEGIA 1: Si ya estamos conectados al Live, usamos esos datos (es lo más rápido)
        if (currentDetector && currentDetector.getRoomData) {
            const roomInfo = currentDetector.getRoomData();
            if (roomInfo && roomInfo.owner) {
                secUid = roomInfo.owner.sec_uid;
                roomId = roomInfo.id;
                console.log("[EMOTES] IDs obtenidos del Detector activo.");
            }
        }

        // Configuración de la ventana de Login
        const loginWindow = new BrowserWindow({
            width: 500,
            height: 700,
            parent: mainWindow,
            modal: true,
            title: 'Inicia sesión en TikTok',
            autoHideMenuBar: true,
            show: false, // <--- TRUCO: Nace oculta para no molestar si ya estás logueado
            webPreferences: { 
                partition: 'persist:tiktok_session', // Usa la sesión guardada
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Cargar URL base
        loginWindow.loadURL('https://www.tiktok.com/login');

        // Función Helper de Búsqueda Recursiva (La misma que ya te funcionaba)
        function findAllEmotes(obj, found = []) {
            if (!obj || typeof obj !== 'object') return found;
            if ((obj.emote_id || obj.id) && (obj.image || obj.icon || obj.sticker_url || obj.static_url)) {
                let imageUrl = '';
                if (obj.image && Array.isArray(obj.image.url_list) && obj.image.url_list.length > 0) imageUrl = obj.image.url_list[0];
                else if (obj.sticker_url && typeof obj.sticker_url === 'string') imageUrl = obj.sticker_url;
                else if (obj.static_url && typeof obj.static_url === 'string') imageUrl = obj.static_url;
                else if (obj.icon && Array.isArray(obj.icon.url_list) && obj.icon.url_list.length > 0) imageUrl = obj.icon.url_list[0];

                if (imageUrl) {
                    found.push({
                        id: String(obj.emote_id || obj.id),
                        name: obj.text || obj.name || 'Emote',
                        image_url: imageUrl,
                        type: 'detected_emote'
                    });
                }
            }
            if (Array.isArray(obj)) for (let item of obj) findAllEmotes(item, found);
            else for (let key in obj) if (obj.hasOwnProperty(key)) findAllEmotes(obj[key], found);
            return found;
        }

        return new Promise((resolve) => {
            let isResolved = false;
            let scraperInterval = null;

            const finish = (result) => {
                if (isResolved) return;
                isResolved = true;
                clearInterval(checkInterval);
                if(scraperInterval) clearInterval(scraperInterval);
                if (!loginWindow.isDestroyed()) loginWindow.close();
                resolve(result);
            };

            // --- BUCLE PRINCIPAL: ESPERAR COOKIES ---
            let checkInterval = setInterval(async () => {
                if (loginWindow.isDestroyed()) {
                    finish({ success: false, message: '⚠️ Ventana cerrada.' });
                    return;
                }

                try {
                    const cookies = await loginWindow.webContents.session.cookies.get({ name: 'sessionid' });
                    
                    if (cookies.length > 0) {
                        // ¡HAY COOKIE! El usuario está logueado.
                        const sessionCookie = cookies[0].value;
                        
                        // Si la ventana se abrió, la ocultamos porque ya tenemos la cookie
                        if (loginWindow.isVisible()) loginWindow.hide();

                        // --- FASE DE OBTENCIÓN DE IDs (Si no tenemos el secUid del Live) ---
                        if (!secUid || !roomId) {
                            console.log(`[EMOTES] Faltan IDs. Navegando al perfil de @${targetUsername} en segundo plano...`);
                            
                            // Navegamos al perfil del usuario para leer el código fuente
                            loginWindow.loadURL(`https://www.tiktok.com/@${targetUsername}`);
                            
                            // Esperamos a que cargue y ejecutamos un script para leer los datos internos de TikTok
                            let attempts = 0;
                            scraperInterval = setInterval(async () => {
                                attempts++;
                                if(attempts > 20) { // 10 segundos de intento máximo
                                    clearInterval(scraperInterval);
                                    // Si falla el scrapeo, mostramos error pero no cerramos todo
                                    finish({ success: false, message: '❌ No se pudieron obtener los IDs del canal (Perfil no carga).' });
                                    return;
                                }

                                try {
                                    // Inyectamos JS en la ventana oculta para buscar la variable SIGI_STATE o Universal Data
                                    const result = await loginWindow.webContents.executeJavaScript(`
                                        (() => {
                                            // Método 1: SIGI_STATE (Clásico)
                                            const state = window.SIGI_STATE;
                                            if (state && state.UserModule && state.UserModule.users) {
                                                const users = Object.values(state.UserModule.users);
                                                if(users.length > 0) {
                                                    return { secUid: users[0].secUid, roomId: users[0].roomId };
                                                }
                                            }
                                            // Método 2: Universal Data (Nuevo TikTok)
                                            const universalScript = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                                            if(universalScript) {
                                                try {
                                                    const json = JSON.parse(universalScript.textContent);
                                                    const user = json?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user;
                                                    if(user) return { secUid: user.secUid, roomId: user.roomId };
                                                } catch(e) {}
                                            }
                                            return null;
                                        })()
                                    `);

                                    if (result && result.secUid) {
                                        clearInterval(scraperInterval);
                                        secUid = result.secUid;
                                        roomId = result.roomId || '0'; // Si no hay live, roomId puede ser 0, pero secUid sirve para emotes
                                        console.log(`[EMOTES] IDs obtenidos: ${secUid} / ${roomId}`);
                                        
                                        // ¡TENEMOS TODO! Lanzamos la petición a la API
                                        fetchEmotesFromApi(sessionCookie, secUid, roomId);
                                    }
                                } catch (jsErr) { console.log("Esperando carga de perfil..."); }
                            }, 500);
                            
                            // Detenemos el checkInterval principal para que no interfiera con el scraper
                            clearInterval(checkInterval);
                            return; 

                        } else {
                            // Si ya teníamos los IDs (porque estábamos conectados al Live), vamos directo
                            fetchEmotesFromApi(sessionCookie, secUid, roomId);
                            clearInterval(checkInterval);
                        }

                    } else {
                        // NO HAY COOKIE: El usuario no ha iniciado sesión.
                        // Mostramos la ventana para que el usuario pueda escribir su contraseña.
                        if (!loginWindow.isVisible()) {
                            loginWindow.show();
                        }
                    }
                } catch (err) { }
            }, 1000);

            // --- FUNCIÓN FINAL: PETICIÓN A LA API DE TIKTOK ---
            async function fetchEmotesFromApi(sessionCookie, secUid, roomId) {
                const headers = {
                    'Cookie': `sessionid=${sessionCookie}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.tiktok.com/',
                };

                try {
                    // URL 1: Catálogo de Emotes (La que usan los bots)
                    const urlCompetencia = `https://webcast.tiktok.com/webcast/sub/privilege/get_sub_emote_detail/?aid=1988&sec_anchor_id=${secUid}&room_id=${roomId}`;
                    // URL 2: Respaldo (Privilegios generales)
                    const urlRespaldo = `https://webcast.tiktok.com/webcast/sub/privilege/get_sub_privilege_detail/?aid=1988&sec_anchor_id=${secUid}&room_id=${roomId}`;

                    console.log("[EMOTES] Solicitando datos a TikTok API (Ataque Doble)...");

                    // Hacemos las dos peticiones a la vez
                    const [resCompetencia, resRespaldo] = await Promise.allSettled([
                        axios.get(urlCompetencia, { headers }),
                        axios.get(urlRespaldo, { headers })
                    ]);

                    let combinedData = [];
                    if (resCompetencia.status === 'fulfilled') combinedData.push(resCompetencia.value.data);
                    if (resRespaldo.status === 'fulfilled') combinedData.push(resRespaldo.value.data);

                    // Usamos tu buscador recursivo sobre toda la data
                    const allEmotesFound = findAllEmotes(combinedData);
                    
                    // Limpiamos duplicados
                    const uniqueEmotes = [];
                    const seenIds = new Set();

                    allEmotesFound.forEach(emote => {
                        if (!seenIds.has(emote.id)) {
                            seenIds.add(emote.id);
                            uniqueEmotes.push(emote);
                        }
                    });

                    if (uniqueEmotes.length > 0) {
                        finish({ success: true, emotes: uniqueEmotes, message: `✅ ${uniqueEmotes.length} emotes obtenidos (Subs + Fan Club).` });
                    } else {
                        finish({ success: true, emotes: [], message: 'ℹ️ No se encontraron emotes públicos (Lista vacía).' });
                    }

                } catch (apiError) {
                    console.error(apiError);
                    finish({ success: false, message: '❌ Error de conexión con la API de TikTok.' });
                }
            }

            loginWindow.on('closed', () => {
                finish({ success: false, message: '⚠️ Cancelado.' });
            });
        });
    });
    
    ipcMain.handle('force-fetch-gifts', async () => { if (!currentUsername) { mainWindow.webContents.send('show-toast', '⚠️ Introduce un usuario para poder actualizar la lista.'); return false; } startDetector(true); return true; });

    ipcMain.handle('select-folder', async (event, startPath) => { 
        const result = await dialog.showOpenDialog(mainWindow, { 
            properties: ['openDirectory'],
            title: 'Selecciona la carpeta de instalación del juego',
            defaultPath: startPath || undefined // <--- CAMBIO AQUÍ: Si hay ruta, abre ahí
        }); 
        return result.canceled ? null : result.filePaths[0]; 
    });

    ipcMain.handle('detect-game-path', async (event, folderName) => {
        // 1. Obtener bibliotecas de Steam
        const libraries = getSteamLibraryFolders();
        
        // 2. Buscar la carpeta específica del juego
        for (const lib of libraries) {
            const fullPath = path.join(lib, 'common', folderName);
            if (fs.existsSync(fullPath)) {
                return { success: true, path: fullPath };
            }
        }
        return { success: false, path: null };
    });

    // --- FUNCIÓN HELPER PARA COPIAR CARPETAS RECURSIVAMENTE ---
    async function copyRecursive(src, dest) {
        const stats = await fs.promises.stat(src);
        if (stats.isDirectory()) {
            await fs.promises.mkdir(dest, { recursive: true });
            const entries = await fs.promises.readdir(src);
            for (const entry of entries) {
                await copyRecursive(path.join(src, entry), path.join(dest, entry));
            }
        } else {
            await fs.promises.copyFile(src, dest);
        }
    }

    // --- MANEJADOR PARA INSTALAR MOD ---
    ipcMain.handle('install-mod', async (event, { gamePath, modName }) => {
        try {
            const sourcePath = path.join(__dirname, 'mods', modName); // Busca en la carpeta 'mods/PEAK'
            
            if (!fs.existsSync(sourcePath)) {
                return { success: false, message: `❌ No se encontraron los archivos del mod en: ${sourcePath}` };
            }

            // Copiar todo el contenido de mods/PEAK a la carpeta del juego
            await copyRecursive(sourcePath, gamePath);
            
            return { success: true, message: '✅ Mod instalado correctamente.' };
        } catch (error) {
            console.error(error);
            return { success: false, message: `❌ Error al instalar: ${error.message}` };
        }
    });

    // --- MANEJADOR PARA BORRAR MOD (AUTOMÁTICO) ---
    ipcMain.handle('delete-mod', async (event, { gamePath, modName }) => {
        try {
            const sourcePath = path.join(__dirname, 'mods', modName);
            
            // 1. Verificamos que exista la carpeta del mod original para saber qué borrar
            if (!fs.existsSync(sourcePath)) {
                return { success: false, message: `❌ No encuentro el mod original en: ${sourcePath}` };
            }

            // 2. Leemos qué archivos/carpetas tiene el mod
            const filesInMod = await fs.promises.readdir(sourcePath);

            // 3. Borramos ESOS archivos de la carpeta del juego
            for (const file of filesInMod) {
                const targetPath = path.join(gamePath, file);
                
                if (fs.existsSync(targetPath)) {
                    const stats = await fs.promises.stat(targetPath);
                    if (stats.isDirectory()) {
                        await fs.promises.rm(targetPath, { recursive: true, force: true });
                    } else {
                        await fs.promises.unlink(targetPath);
                    }
                }
            }
            return { success: true, message: `🗑️ Mod ${modName} eliminado correctamente.` };
        } catch (error) {
            console.error(error);
            return { success: false, message: `❌ Error al borrar: ${error.message}` };
        }
    });

    // --- LÓGICA DE PROBAR CONEXIÓN SERVERTAP (MODIFICADA PARA UI PERSONALIZADA) ---
    ipcMain.handle('test-servertap-connection', async (event, { ip, port, key }) => {
        
        // CASO 1: ERROR DE VALIDACIÓN
        if (!ip || !port || !key) {
            return { 
                status: 'warning', 
                title: 'Faltan Datos', 
                message: 'Por favor, rellena la IP, el Puerto y la Key antes de probar.' 
            };
        }

        try {
            const url = `http://${ip}:${port}/v1/server`;
            const response = await axios.get(url, {
                headers: { 'key': key },
                timeout: 3000
            });

            // CASO 3: ÉXITO
            const serverData = response.data;
            const serverName = serverData.name || 'Desconocido';
            const serverVersion = serverData.version || 'Desconocida';
            const bucketVersion = serverData.bukkitVersion || '';

            return { 
                status: 'success', 
                title: '¡Conexión Exitosa!', 
                message: 'Se ha establecido conexión con el servidor de Minecraft correctamente.',
                details: `Servidor: ${serverName}\nVersión: ${serverVersion}`
            };

        } catch (error) {
            // CASO 2: ERROR DE CONEXIÓN
            console.error("Error ServerTap:", error.message);
            return { 
                status: 'error', 
                title: 'Error de Conexión', 
                message: 'No se pudo conectar. Verifica que el servidor esté encendido, que el plugin ServerTap esté instalado y que la IP/Puerto/Key sean correctos.' 
            };
        }
    });

    // --- EJECUTAR COMANDO MINECRAFT (SERVERTAP) ---
    ipcMain.handle('execute-servertap-command', async (event, { ip, port, key, command }) => {
        try {
            const url = `http://${ip}:${port}/v1/server/exec`;
            
            // ServerTap espera el comando en el cuerpo del POST como x-www-form-urlencoded
            const params = new URLSearchParams();
            params.append('command', command);

            await axios.post(url, params, {
                headers: { 
                    'key': key,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 2000
            });
            return { success: true };
        } catch (error) {
            console.error("Error enviando comando a Minecraft:", error.message);
            return { success: false, error: error.message };
        }
    });

    // 1. Guardar configuración de Minecraft (Todo en uno)
    ipcMain.handle('save-mc-config', (event, data) => {
        const config = loadConfig();
        // Guardamos o actualizamos el objeto 'minecraft' dentro de config
        config.minecraft = { ...config.minecraft, ...data }; 
        saveConfig(config);
        return true;
    });

    // 2. Obtener configuración de Minecraft
    ipcMain.handle('get-mc-config', () => {
        const config = loadConfig();
        // Devuelve el objeto guardado o uno vacío si no existe
        return config.minecraft || {}; 
    });
    
    // --- MANEJADOR GENÉRICO PARA ACTUALIZAR WIDGETS ---
    ipcMain.handle('update-widget', (event, { widgetId, data }) => {
        // 1. Guardar en memoria
        if (!localWidgetsDB[widgetId]) localWidgetsDB[widgetId] = {};
        // Mezclar datos nuevos con los viejos
        localWidgetsDB[widgetId] = { ...localWidgetsDB[widgetId], ...data };
        
        // --- GUARDAR EN DISCO DURO ---
        saveWidgetsData(localWidgetsDB); 
        
        // 2. Avisar a los overlays (OBS/Chrome) via Socket.io
        io.emit('widget-update', { widgetId, data: localWidgetsDB[widgetId] });

        // --- NUEVA LÍNEA: Avisar a la ventana del Dashboard (inputs) ---
        // Esto hace que si una acción cambia el valor, el input lo refleje.
        if (mainWindow) {
            mainWindow.webContents.send('widget-updated-from-back', { widgetId, data: localWidgetsDB[widgetId] });
        }
        
        return true;
    });

    ipcMain.handle('get-widget-data', (event, widgetId) => {
        return localWidgetsDB[widgetId] || null;
    });

    // 2. CAMBIO AQUÍ: Añade esto justo antes de cerrar la función createWindow
    // Esperamos 500ms (medio segundo) y mostramos la ventana
    setTimeout(() => {
        mainWindow.show();
    }, 1000);
    
    mainWindow.webContents.on('did-finish-load', () => { mainWindow.webContents.send('connection-status', 'Desconectado. Introduce un usuario.'); });
}

// --- GESTIÓN DE HOTKEYS GLOBALES (VERSIÓN SILENCIOSA) ---
ipcMain.handle('register-global-hotkeys', (event, { config, enabled }) => {
    // 1. Limpiar anteriores
    globalShortcut.unregisterAll();

    if (!enabled || !config) return;

    // 2. Registrar cada tecla
    for (const [accelerator, actionId] of Object.entries(config)) {
        try {
            // Traducción de teclas Web -> Electron
            const electronKey = accelerator
                .replace('ArrowUp', 'Up')
                .replace('ArrowDown', 'Down')
                .replace('ArrowLeft', 'Left')
                .replace('ArrowRight', 'Right')
                .replace('Control', 'Ctrl');

            globalShortcut.register(electronKey, () => {
                // Solo enviamos la señal, sin imprimir nada en consola
                if (mainWindow) {
                    mainWindow.webContents.send('global-hotkey-triggered', actionId);
                }
            });

        } catch (err) {
            // Este log lo dejamos solo por si hay un error grave de programación
            console.error(`Error registrando ${accelerator}:`, err);
        }
    }
});

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
// --- ESTE ES EL CÓDIGO NUEVO (COLOCADO CORRECTAMENTE FUERA) ---
app.on('will-quit', () => {
    globalShortcut.unregisterAll(); // Limpia teclas
    if (typeof serverInstance !== 'undefined' && serverInstance) {
        serverInstance.close(); // Limpia servidor
        console.log('🛑 Servidor interno detenido.');
    }
});
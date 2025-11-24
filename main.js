// --- START OF FILE main.js ---

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const WinReg = require('winreg');
const WebSocket = require('ws');
const { startTikTokDetector } = require('./detector.js');
const { autoUpdater } = require('electron-updater');

// --- DECLARACIÓN DE VARIABLES GLOBALES ---
let mainWindow = null;
let currentDetector = null;
let tikfinitySocket = null;
let currentUsername = '';

// --- MANEJO DE CONFIGURACIÓN DE USUARIO ---
const configPath = path.join(app.getPath('userData'), 'config.json');
function loadConfig() { try { if (fs.existsSync(configPath)) { return JSON.parse(fs.readFileSync(configPath, 'utf8')); } } catch (error) { console.error('Error al cargar la configuración:', error); } return {}; }
function saveConfig(config) { try { fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (error) { console.error('Error al guardar la configuración:', error); } }

// --- MANEJO DE DATOS ---
const dataPath = path.join(app.getPath('userData'), 'data.json');
function loadData() { try { if (fs.existsSync(dataPath)) { return JSON.parse(fs.readFileSync(dataPath)); } } catch (error) { console.error('Error al cargar datos:', error); } return { profiles: {}, activeProfileName: '' }; }
function saveData(data) { try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); } catch (error) { console.error('Error al guardar datos:', error); } }

// --- LÓGICA PARA CACHÉ DE REGALOS ---
const giftsPath = path.join(app.getPath('userData'), 'gifts.json');
function loadGifts() { try { if (fs.existsSync(giftsPath)) { return JSON.parse(fs.readFileSync(giftsPath)); } } catch (error) { console.error('Error al cargar los regalos guardados:', error); } return []; }
function saveGifts(gifts) { try { fs.writeFileSync(giftsPath, JSON.stringify(gifts, null, 2)); console.log("Lista de regalos actualizada y guardada."); } catch (error) { console.error('Error al guardar la lista de regalos:', error); } }

// --- FUNCIÓN PARA ENCONTRAR AUTOIT ---
async function findAutoItExecutable() { const registryKeys = [new WinReg({ hive: WinReg.HKLM, key: '\\SOFTWARE\\WOW6432Node\\AutoIt v3\\AutoIt' }), new WinReg({ hive: WinReg.HKLM, key: '\\SOFTWARE\\AutoIt v3\\AutoIt' })]; for (const regKey of registryKeys) { try { const item = await new Promise((resolve) => { regKey.get('InstallDir', (err, result) => resolve(err ? null : result)); }); if (item && item.value) { const exePath = path.join(item.value, 'AutoIt3.exe'); if (fs.existsSync(exePath)) { return exePath; } } } catch (error) { /* Ignorar errores */ } } return null; }

// --- FUNCIÓN PARA INICIAR EL DETECTOR DIRECTO ---
function startDetector(forceGiftFetch = false) { if (currentDetector) { currentDetector.stop(); currentDetector = null; } if (currentUsername && currentUsername.trim() !== '') { currentDetector = startTikTokDetector(mainWindow, currentUsername, forceGiftFetch, (gifts) => { saveGifts(gifts); mainWindow.webContents.send('show-toast', '✅ Lista de regalos actualizada y guardada.'); }); } else { mainWindow.webContents.send('connection-status', 'Desconectado.'); } }

// --- FUNCIÓN PRINCIPAL PARA CREAR LA VENTANA ---
function createWindow() {
    currentUsername = loadConfig().username || '';
    mainWindow = new BrowserWindow({ width: 1200, height: 800, webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true } });
    
    // === ¡AQUÍ ESTÁ LA LÍNEA AÑADIDA! ===
    // mainWindow.setMenu(null);
    // === FIN DE LA LÍNEA AÑADIDA ===

    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', () => {
        // Envía la versión de la app (leída desde package.json) a la ventana.
        mainWindow.webContents.send('set-version', app.getVersion());
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

    // --- MANEJADORES DE IPC ---
    ipcMain.handle('get-username', () => currentUsername);
    ipcMain.handle('load-data', async () => loadData());
    ipcMain.handle('save-data', async (event, data) => saveData(data));
    
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

    ipcMain.handle('export-profile', async (event, profileData) => { const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, { title: 'Exportar Perfil', defaultPath: `${profileData.name}.json`, filters: [{ name: 'Archivos JSON', extensions: ['json'] }] }); if (!canceled && filePath) { try { const fileContent = JSON.stringify(profileData.data, null, 2); fs.writeFileSync(filePath, fileContent, 'utf-8'); return { success: true, path: filePath }; } catch (error) { return { success: false, error: error.message }; } } return { success: false, canceled: true }; });
    ipcMain.handle('import-profile', async () => { const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, { title: 'Importar Perfil', properties: ['openFile'], filters: [{ name: 'Archivos JSON', extensions: ['json'] }] }); if (!canceled && filePaths.length > 0) { const filePath = filePaths[0]; try { const fileContent = fs.readFileSync(filePath, 'utf-8'); const profileData = JSON.parse(fileContent); return { success: true, data: profileData }; } catch (error) { return { success: false, error: 'El archivo está dañado o no tiene el formato correcto.' }; } } return { success: false, canceled: true }; });

    // -- Conexión a TikFinity --
    ipcMain.handle('connect-tikfinity', () => {
        if (tikfinitySocket) return;
        if (currentDetector) { currentDetector.stop(); currentDetector = null; }

        mainWindow.webContents.send('connection-status', 'Conectando a TikFinity...');
        tikfinitySocket = new WebSocket('ws://localhost:21213/');

        tikfinitySocket.on('open', () => {
            mainWindow.webContents.send('connection-status', '✅ Conectado vía TikFinity');
        });

        tikfinitySocket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('[TIKFINITY RAW EVENT]', JSON.stringify(message, null, 2));
                
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
                        const translatedData = { ...message.data, nickname: message.data.uniqueId };
                        mainWindow.webContents.send(message.event === 'follow' ? 'new-follow' : 'new-share', translatedData);
                    }
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
            console.error('[TIKFINITY WEBSOCKET ERROR]', err.message);
            mainWindow.webContents.send('show-toast', '❌ Error: No se pudo conectar a TikFinity. ¿Está abierto y conectado?');
            mainWindow.webContents.send('connection-status', '❌ Error de conexión con TikFinity');
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
    ipcMain.handle('force-fetch-gifts', async () => { if (!currentUsername) { mainWindow.webContents.send('show-toast', '⚠️ Introduce un usuario para poder actualizar la lista.'); return false; } startDetector(true); return true; });

    ipcMain.handle('select-folder', async () => { 
        const result = await dialog.showOpenDialog(mainWindow, { 
            properties: ['openDirectory'],
            title: 'Selecciona la carpeta de instalación del juego'
        }); 
        return result.canceled ? null : result.filePaths[0]; 
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

    mainWindow.webContents.on('did-finish-load', () => { mainWindow.webContents.send('connection-status', 'Desconectado. Introduce un usuario.'); });
}

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
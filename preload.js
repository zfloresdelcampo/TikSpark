const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    // 1. Enviar configuración al Main
    registerGlobalHotkeys: (data) => ipcRenderer.invoke('register-global-hotkeys', data),

    // 2. Recibir el aviso del Main cuando se presiona la tecla
    onGlobalHotkeyTriggered: (callback) => ipcRenderer.on('global-hotkey-triggered', (_event, actionId) => callback(actionId)),

    // 3. Funciones de Login TikTok
    openTikTokWebLogin: () => ipcRenderer.invoke('open-tiktok-web-login'),
    tiktokWebLogout: () => ipcRenderer.invoke('tiktok-web-logout'),
    checkTikTokWebSession: () => ipcRenderer.invoke('check-tiktok-web-session'),
    getTikTokWebProfile: () => ipcRenderer.invoke('get-tiktok-web-profile'),

    // --- AGREGAR ESTA LÍNEA ---
    selectFolder: (startPath) => ipcRenderer.invoke('select-folder', startPath),
    detectGamePath: (folderName) => ipcRenderer.invoke('detect-game-path', folderName),
    installMod: (data) => ipcRenderer.invoke('install-mod', data),
    deleteMod: (data) => ipcRenderer.invoke('delete-mod', data),

    // === LINEAS PARA SERVERTAP MINECRAFT//
    testServerTapConnection: (config) => ipcRenderer.invoke('test-servertap-connection', config),

    // === LINEAS PARA EJECUTAR COMANDOS EN MINECRAFT//
    executeMinecraftCommand: (data) => ipcRenderer.invoke('execute-servertap-command', data),

    // === GUARDAR CONFIGURACIÓN DE MINECRAFT //
    saveMcConfig: (data) => ipcRenderer.invoke('save-mc-config', data),
    getMcConfig: () => ipcRenderer.invoke('get-mc-config'),

    // === AÑADE LIKES INICIALES ===
    onRoomInfo: (callback) => ipcRenderer.on('room-info', (_event, data) => callback(data)),


    updateWidget: (widgetId, data) => ipcRenderer.invoke('update-widget', { widgetId, data }),
    getWidgetData: (widgetId) => ipcRenderer.invoke('get-widget-data', widgetId),

    // --- NUEVAS LÍNEAS PARA MANEJAR AUDIO ---
    selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
    getLocalAudios: () => ipcRenderer.invoke('get-local-audios'),
    onAudioListUpdated: (callback) => ipcRenderer.on('audio-list-updated', (_event, audioList) => callback(audioList)),
    // --- NUEVA LÍNEA PARA ABRIR CARPETA DE SONIDOS ---
    openSoundsFolder: () => ipcRenderer.invoke('open-sounds-folder'),
    playLocalAudio: (fileName) => ipcRenderer.invoke('play-local-audio', fileName),
    deleteLocalAudio: (fileName) => ipcRenderer.invoke('delete-local-audio', fileName),
    getAudioFilePath: (fileName) => ipcRenderer.invoke('get-audio-file-path', fileName),
    downloadMyInstantsAudio: (url) => ipcRenderer.invoke('download-myinstants-audio', url),

    // --- LÍNEAS A AÑADIR PARA TIKFINITY ---
    connectTikFinity: () => ipcRenderer.invoke('connect-tikfinity'),
    disconnectTikFinity: () => ipcRenderer.invoke('disconnect-tikfinity'),
    // --- Peticiones del Frontend al Backend ---
    getUsername: () => ipcRenderer.invoke('get-username'),
    saveUsername: (newUsername) => ipcRenderer.invoke('save-username', newUsername),
    // === ¡NUEVA LÍNEA PARA DESCONECTAR! ===
    disconnect: () => ipcRenderer.invoke('disconnect-tiktok'),
    
    // Acepta usuario para cargar
    loadData: (username) => ipcRenderer.invoke('load-data', username),
    // Acepta objeto con usuario y datos para guardar
    saveData: (payload) => ipcRenderer.invoke('save-data', payload),
    checkUserExists: (username) => ipcRenderer.invoke('check-user-exists', username),

    // --- GUARDAR EMOTES ---
    saveEmotes: (emotes) => ipcRenderer.invoke('save-emotes', emotes),
    getSavedEmotes: () => ipcRenderer.invoke('get-saved-emotes'),

    // --- NUEVA LÍNEA PARA EXPORTAR ---
    exportProfile: (profileData) => ipcRenderer.invoke('export-profile', profileData),
    // --- NUEVA LÍNEA PARA IMPORTAR ---
    importProfile: () => ipcRenderer.invoke('import-profile'),

    // --- Funciones para la gestión de regalos ---
    getAvailableGifts: () => ipcRenderer.invoke('get-available-gifts'),

    // --- POR ESTO ---
    loginAndFetchEmotes: () => ipcRenderer.invoke('login-and-fetch-emotes'),

    forceFetchGifts: () => ipcRenderer.invoke('force-fetch-gifts'),

    // --- Escuchas del Frontend a eventos del Backend ---
    onStatus: (callback) => ipcRenderer.on('connection-status', (_event, value) => callback(value)),
    onChat: (callback) => ipcRenderer.on('new-chat', (_event, data) => callback(data)),
    onGift: (callback) => ipcRenderer.on('new-gift', (_event, data) => callback(data)),
    onFollow: (callback) => ipcRenderer.on('new-follow', (_event, data) => callback(data)),
    onShare: (callback) => ipcRenderer.on('new-share', (_event, data) => callback(data)),
    onLike: (callback) => ipcRenderer.on('new-like', (_event, data) => callback(data)),
    // --- AÑADE ESTA LÍNEA NUEVA ---
    onJoin: (callback) => ipcRenderer.on('new-join', (_event, data) => callback(data)),
    // === AÑADE ESTA LÍNEA ===
    onUserProfile: (callback) => ipcRenderer.on('update-user-profile', (_event, data) => callback(data)),

    // === ACTUALIZAR WIDGET ===
    onWidgetUpdate: (callback) => ipcRenderer.on('widget-updated-from-back', (_event, data) => callback(data)),

    // ========================
    onShowToast: (callback) => ipcRenderer.on('show-toast', (_event, message) => callback(message)),
    onSetVersion: (callback) => ipcRenderer.on('set-version', (_event, version) => callback(version)),
    
    //AUTO-UPDATER
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, data) => callback(data)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_event, percent) => callback(percent)),

    // --- NUEVA LÍNEA PARA KEYSTROKES ---
    simulateKeystroke: (data) => ipcRenderer.invoke('simulate-keystroke', data),
    simulateKeystrokes: (actionData) => ipcRenderer.invoke('simulate-keystrokes', actionData) // <--- AÑADE ESTA LÍNEA
});
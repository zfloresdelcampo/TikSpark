const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- AGREGAR ESTA LÍNEA ---
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    installMod: (data) => ipcRenderer.invoke('install-mod', data),
    deleteMod: (data) => ipcRenderer.invoke('delete-mod', data),
    // --- LÍNEAS A AÑADIR PARA TIKFINITY ---
    connectTikFinity: () => ipcRenderer.invoke('connect-tikfinity'),
    disconnectTikFinity: () => ipcRenderer.invoke('disconnect-tikfinity'),
    // --- Peticiones del Frontend al Backend ---
    getUsername: () => ipcRenderer.invoke('get-username'),
    saveUsername: (newUsername) => ipcRenderer.invoke('save-username', newUsername),
    // === ¡NUEVA LÍNEA PARA DESCONECTAR! ===
    disconnect: () => ipcRenderer.invoke('disconnect-tiktok'),
    
    loadData: () => ipcRenderer.invoke('load-data'),
    saveData: (data) => ipcRenderer.invoke('save-data', data),

    // --- NUEVA LÍNEA PARA EXPORTAR ---
    exportProfile: (profileData) => ipcRenderer.invoke('export-profile', profileData),
    // --- NUEVA LÍNEA PARA IMPORTAR ---
    importProfile: () => ipcRenderer.invoke('import-profile'),

    // --- Funciones para la gestión de regalos ---
    getAvailableGifts: () => ipcRenderer.invoke('get-available-gifts'),
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
    // ========================
    onShowToast: (callback) => ipcRenderer.on('show-toast', (_event, message) => callback(message)),
    onSetVersion: (callback) => ipcRenderer.on('set-version', (_event, version) => callback(version)),
    // --- NUEVA LÍNEA PARA KEYSTROKES ---
    simulateKeystroke: (data) => ipcRenderer.invoke('simulate-keystroke', data),
    simulateKeystrokes: (actionData) => ipcRenderer.invoke('simulate-keystrokes', actionData) // <--- AÑADE ESTA LÍNEA
});
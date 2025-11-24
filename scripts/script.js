// --- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', async function() {

    // ==========================================================
    // LÓGICA UNIVERSAL PARA MINI-JUEGOS
    // ==========================================================
    
    // Función para configurar cualquier juego
    // gameId: El nombre que usas en los IDs del HTML (ej: 'peak', 'gta5')
    // modFolderName: El nombre exacto de la carpeta dentro de 'mods' (ej: 'PEAK', 'GTA5_MOD')
    function setupGameController(gameId, modFolderName) {
        
        const btnSelect = document.getElementById(`btn-select-${gameId}-path`);
        const textPath = document.getElementById(`${gameId}-game-path`);
        const btnInstall = document.getElementById(`btn-install-${gameId}`);
        const btnDelete = document.getElementById(`btn-delete-${gameId}`);
        
        let gamePath = ""; // Variable local para este juego

        // 1. Selección de Carpeta
        if (btnSelect) {
            btnSelect.addEventListener('click', async () => {
                if (!window.electronAPI) return;
                const selectedPath = await window.electronAPI.selectFolder();
                if (selectedPath) {
                    gamePath = selectedPath;
                    textPath.textContent = selectedPath;
                    textPath.style.color = "#ffffff";
                    showToastNotification(`📂 Ruta de ${modFolderName} seleccionada`);
                }
            });
        }

        // 2. Instalar
        if (btnInstall) {
            btnInstall.addEventListener('click', async () => {
                if (!gamePath) return showToastNotification("⚠️ Primero selecciona la carpeta del juego.");
                showToastNotification(`⏳ Instalando ${modFolderName}...`);
                
                const result = await window.electronAPI.installMod({ 
                    gamePath: gamePath, 
                    modName: modFolderName 
                });
                showToastNotification(result.message);
            });
        }

        // 3. Borrar
        if (btnDelete) {
            btnDelete.addEventListener('click', async () => {
                if (!gamePath) return showToastNotification("⚠️ Primero selecciona la carpeta del juego.");
                
                if(confirm(`¿Borrar mod de ${modFolderName}?`)) {
                    showToastNotification(`⏳ Eliminando ${modFolderName}...`);
                    const result = await window.electronAPI.deleteMod({ 
                        gamePath: gamePath, 
                        modName: modFolderName 
                    });
                    showToastNotification(result.message);
                }
            });
        }
    }

    // --- AQUI ACTIVAS TUS JUEGOS ---
    setupGameController('peak', 'PEAK'); 
    setupGameController('supermarket-simulator', 'Supermarket Simulator');
    setupGameController('the-forest', 'The Forest');
    // setupGameController('gta5', 'GTA5_MOD');  <-- Cuando agregues GTA, solo descomentas esto

// ==========================================================
// SECCIÓN 0: NAVEGACIÓN Y CONFIGURACIÓN INICIAL
// ==========================================================
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const toggleButtons = document.querySelectorAll('.toggle-btn');
const connectionPanels = document.querySelectorAll('.connection-panel');

// --- NUEVAS VARIABLES PARA EL SIDEBAR ---
const sidebarHeaderServer = document.getElementById('header-server');
const sidebarHeaderTikfinity = document.getElementById('header-tikfinity');
const sidebarConnectBtn = document.getElementById('sidebar-connect-btn');
const sidebarUsernameDisplay = document.getElementById('sidebar-username-display');
const sidebarTikfinityStatusText = document.getElementById('sidebar-tikfinity-status-text');
const sidebarDefaultIcon = document.getElementById('sidebar-default-icon');
const sidebarProfileImg = document.getElementById('sidebar-profile-img');

let currentConnectionMode = 'api-server'; // 'api-server' o 'api-tikfinity'

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        contentSections.forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId)?.classList.add('active');
    });
});

toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentConnectionMode = button.dataset.target.includes('server') ? 'api-server' : 'api-tikfinity';

        // === PEGAR ESTO AQUÍ ===
        if (currentConnectionMode === 'api-server') {
            sidebarHeaderServer.classList.remove('hidden');
            sidebarHeaderTikfinity.classList.add('hidden');
        } else {
            sidebarHeaderServer.classList.add('hidden');
            sidebarHeaderTikfinity.classList.remove('hidden');
        }
        // ========================
        
        connectionPanels.forEach(panel => {
            if (panel.id === button.dataset.target) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    });
});

if (window.electronAPI) {
    window.electronAPI.onSetVersion((version) => {
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = `v${version}`;
        }
    });
}

// ==========================================================
// SECCIÓN 1: LÓGICA DE CONEXIÓN CON ELECTRON (SI EXISTE)
// ==========================================================
if (window.electronAPI) {
    // --- Elementos comunes ---
    const statusDiv = document.getElementById('status');
    const logContainer = document.getElementById('log-container');

    // --- Elementos del panel API Server ---
    const connectButton = document.getElementById('connect-button');
    const disconnectButton = document.getElementById('disconnect-button');
    const emotesButton = document.getElementById('emotes-button');
    const updateGiftsButton = document.getElementById('update-gifts-button');
    const usernameInput = document.getElementById('username-input');

    // --- Elementos del panel API TikFinity ---
    const connectTikFinityBtn = document.getElementById('connect-tikfinity-button');
    const disconnectTikFinityBtn = document.getElementById('disconnect-tikfinity-button');
    const tikfinityStatusSpan = document.getElementById('tikfinity-status');

    // --- Lógica API Server ---

    // 1. Hacer que el botón del sidebar active el botón principal
    sidebarConnectBtn.addEventListener('click', () => {
        // Simplemente hacemos clic virtual en el botón principal correspondiente
        if (connectButton.disabled) {
             disconnectButton.click();
        } else {
             connectButton.click();
        }
    });

    // 2. Sincronizar el nombre de usuario al escribir
    usernameInput.addEventListener('input', () => {
        sidebarUsernameDisplay.textContent = usernameInput.value || 'Tu Usuario';
    });

    // 3. Actualizar nombre al cargar (Busca tu línea existente window.electronAPI.getUsername()...)
    // Y modifícala así:
    window.electronAPI.getUsername().then(username => { 
        if (username) { 
            usernameInput.value = username; 
            sidebarUsernameDisplay.textContent = username; // <-- AÑADE ESTO
        } 
    });

    // 4. Actualizar estado visual (Busca tu window.electronAPI.onStatus...)
    // Y añade esto dentro:
    window.electronAPI.onStatus(statusMessage => {
        // ... tu código existente ...
        const isConnected = statusMessage.includes('✅');
        
        // Actualizar texto del botón del sidebar
        if (currentConnectionMode === 'api-server') {
            sidebarConnectBtn.textContent = isConnected ? 'Desconectar' : 'Conectar';
            sidebarConnectBtn.style.color = isConnected ? '#ff4d4d' : '#ccc'; // Rojo si está conectado (para desconectar)
        } else {
            // Lógica para Tikfinity Sidebar
            sidebarTikfinityStatusText.textContent = isConnected ? 'Connected' : 'Disconnected';
            sidebarTikfinityStatusText.style.color = isConnected ? '#10c35b' : '#888';
        }
    });

    window.electronAPI.getUsername().then(username => { if (username) usernameInput.value = username; });
    connectButton.addEventListener('click', () => { 
        const username = usernameInput.value.trim(); 
        if (username) { window.electronAPI.saveUsername(username); } 
        else { showToastNotification('⚠️ Introduce un nombre de usuario.'); } 
    });
    disconnectButton.addEventListener('click', () => { 
        window.electronAPI.disconnect(); 
        usernameInput.value = ''; 
    });
    emotesButton.addEventListener('click', () => { 
        if (window.electronAPI.sendEmoteRequest) { 
            const username = usernameInput.value.trim(); 
            if (username) window.electronAPI.sendEmoteRequest(username); 
        } 
    });
    updateGiftsButton.addEventListener('click', async () => {
        showToastNotification('🔄 Actualizando lista de regalos...');
        await window.electronAPI.forceFetchGifts();
    });

    // --- Lógica API TikFinity ---
    connectTikFinityBtn.addEventListener('click', () => {
        window.electronAPI.connectTikFinity();
    });
    disconnectTikFinityBtn.addEventListener('click', () => {
        window.electronAPI.disconnectTikFinity();
    });

    // --- Lógica de Estado (Compartida) ---
    window.electronAPI.onStatus(statusMessage => {
        statusDiv.textContent = statusMessage;
        const isConnected = statusMessage.includes('✅');
        const isConnecting = statusMessage.includes('Conectando...');
        
        // Actualizar UI del modo activo
        if (currentConnectionMode === 'api-server') {
            connectButton.disabled = isConnected || isConnecting;
            disconnectButton.disabled = !isConnected;
            emotesButton.disabled = !isConnected;
            updateGiftsButton.disabled = !isConnected; // <-- AÑADE ESTA LÍNEA
            statusDiv.style.borderLeftColor = isConnected ? '#108038' : (statusMessage.includes('❌') ? '#a4262c' : '#0078d4');
        } else { // api-tikfinity
            connectTikFinityBtn.disabled = isConnected || isConnecting;
            disconnectTikFinityBtn.disabled = !isConnected;
            
            tikfinityStatusSpan.textContent = isConnected ? 'Connected' : (isConnecting ? 'Connecting' : 'Disconnected');
            tikfinityStatusSpan.className = 'status-indicator'; // Reset classes
            if (isConnected) tikfinityStatusSpan.classList.add('connected');
            else if (isConnecting) tikfinityStatusSpan.classList.add('connecting');
            else tikfinityStatusSpan.classList.add('disconnected');
        }
    });

    // --- Lógica de Eventos (Compartida) ---
    function addLogEntry(message, type) {
        // Si usas prepend, necesitas que el scroll suba, no baje.
        // Para un log de chat/eventos, es más natural usar append.
        // Vamos a cambiar prepend por append.
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = message;
        logContainer?.appendChild(entry); // Cambiado a appendChild

        // Hacer scroll automático al nuevo mensaje
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    // Listener de Chat (ya lo tenías)
    window.electronAPI.onChat(data => {
        // Escapamos HTML para seguridad
        const sanitizedComment = data.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        addLogEntry(`<i class="fas fa-comment"></i> <b>${data.nickname}:</b> ${sanitizedComment}`, 'chat');
        processTikTokEvent('chat-comment', data);
    });

    // Listener de Regalos (ligeramente mejorado)
    window.electronAPI.onGift(data => {
        // ¡ESTA ES LA LÍNEA CLAVE!
        // Si este evento es la señal de "fin de combo", lo ignoramos por completo.
        if (data.repeatEnd) {
            console.log('Ignorando evento de fin de combo para:', data.giftName);
            return; // Detiene la ejecución aquí
        }

        console.log('GIFT EVENT DATA RECEIVED (PROCESANDO):', data);
        const totalCoins = data.repeatCount * data.diamondCount;
        const message = `
            <img src="${data.giftPictureUrl}" class="gift-icon" alt="${data.giftName}">
            <b>${data.nickname}</b> envió <b>${data.repeatCount}x ${data.giftName}</b>
            (<i class="fas fa-coins" style="color: #ffeb3b;"></i> ${totalCoins})
        `;
        addLogEntry(message, data.isHighValue ? 'win' : 'gift');

        // Ahora solo llamamos a estas funciones con el evento bueno, el inicial.
        processTikTokEvent('gift-specific', data);
        updateAuction(data);
    });

    // Listener de "Se ha unido" (CORREGIDO)
    window.electronAPI.onJoin(data => {
        addLogEntry(`<i class="fas fa-walking"></i> <b>${data.nickname}</b> se ha unido.`, 'join');
        processTikTokEvent('join', data);
        // sendNicknameToGame(data.nickname);
    });

    // Listener de "Seguir" (NUEVO)
    window.electronAPI.onFollow(data => {
        addLogEntry(`<i class="fas fa-user-plus" style="color: #ff4d4d;"></i> <b>${data.nickname}</b> te ha seguido.`, 'follow');
        processTikTokEvent('follow', data);
    });

    // Listener de "Compartir" (NUEVO)
    window.electronAPI.onShare(data => {
        addLogEntry(`<i class="fas fa-share-square" style="color: #38c172;"></i> <b>${data.nickname}</b> ha compartido el directo.`, 'share');
        processTikTokEvent('share', data);
    });

    // Listener de "Likes" (NUEVO)
    window.electronAPI.onLike(data => {
        addLogEntry(`<i class="fas fa-heart" style="color: #ff005c;"></i> <b>${data.nickname}</b> ha dado ${data.likeCount} Me gusta.`, 'like');
        processTikTokEvent('likes', data);
    });

    // === AÑADE ESTO AQUÍ ===
    // === CÓDIGO FINAL Y LIMPIO PARA SCRIPT.JS ===
    window.electronAPI.onUserProfile(data => {
        console.log("Datos de perfil recibidos:", data);

        const defaultIcon = document.getElementById('sidebar-default-icon');
        const profileImg = document.getElementById('sidebar-profile-img');
        const nameDisplay = document.getElementById('sidebar-username-display');

        // 1. Poner el nombre
        if (data.nickname && nameDisplay) {
            nameDisplay.textContent = data.nickname;
        }

        // 2. Poner la foto
        if (data.avatar && profileImg && defaultIcon) {
            profileImg.src = data.avatar;
            profileImg.style.display = 'block'; 
            defaultIcon.style.display = 'none';
            
            // Log opcional para confirmar visualmente
            if(typeof addLogEntry === 'function') {
                addLogEntry(`🖼️ Perfil actualizado: ${data.nickname}`, 'info');
            }
        }
    });

    // Listener de Notificaciones Toast (ya lo tenías)
    window.electronAPI.onShowToast((message) => showToastNotification(message));}

    // ==========================================================
    // SECCIÓN 2: ESTRUCTURA DE DATOS Y GESTIÓN DE PERFILES
    // ==========================================================
    let profiles = {};
    let activeProfileName = '';
    let availableGiftsCache = [];
    const ITEMS_PER_PAGE = 20;
    let currentPageActions = 1;
    let currentPageEvents = 1;

    async function saveAllData() {
        if (window.electronAPI) {
            await window.electronAPI.saveData({ profiles, activeProfileName });
            console.log("Datos de perfiles guardados.");
        } else {
            console.warn("Modo Navegador: saveAllData no hace nada. Los datos son temporales.");
        }
    }

    async function loadAllData() {
        if (window.electronAPI) {
            const loadedData = await window.electronAPI.loadData();
            if (loadedData && loadedData.profiles) {
                profiles = loadedData.profiles;
                activeProfileName = loadedData.activeProfileName;
            } else if (loadedData && loadedData.actions) {
                console.log("Detectados datos de versión anterior. Migrando a perfiles...");
                profiles['Perfil Principal'] = {
                    actions: loadedData.actions || [],
                    events: loadedData.events || [],
                    nextActionId: loadedData.nextActionId || 1,
                    nextEventId: loadedData.nextEventId || 1,
                };
                activeProfileName = 'Perfil Principal';
            }
            await loadGiftsCache();
        }
    }

    // --- NUEVA FUNCIÓN PARA PRE-CARGAR LOS REGALOS ---
    async function loadGiftsCache() {
        if (window.electronAPI && availableGiftsCache.length === 0) {
            try {
                const gifts = await window.electronAPI.getAvailableGifts();
                availableGiftsCache = gifts || [];
                console.log(`Cache de ${availableGiftsCache.length} regalos cargado al inicio.`);
            } catch (error) {
                console.error("No se pudo pre-cargar la lista de regalos al inicio:", error);
            }
        }
    }

    function updateSidebarProfile(nickname, imageUrl) {
        // Actualizar Nombre
        if (nickname) {
            sidebarUsernameDisplay.textContent = nickname;
        }
        
        // Actualizar Foto
        if (imageUrl) {
            sidebarProfileImg.src = imageUrl;
            sidebarProfileImg.style.display = 'block'; // Mostrar imagen
            sidebarDefaultIcon.style.display = 'none'; // Ocultar icono
        } else {
            // Si no hay imagen, volver al estado por defecto
            sidebarProfileImg.style.display = 'none';
            sidebarDefaultIcon.style.display = 'block';
        }
    }

    function initializeProfiles() {
        if (!window.electronAPI && Object.keys(profiles).length === 0) {
            console.warn("MODO NAVEGADOR: Creando perfil de prueba 'Test Profile'.");
            profiles['Test Profile'] = {
                actions: [{ id: 1, name: "Acción de prueba", description: "Local", duration: 3, queue: "Screen 1", extraAction: null, webhookChecked: false }],
                events: [],
                nextActionId: 2,
                nextEventId: 1
            };
            activeProfileName = 'Test Profile';
        }

        if (Object.keys(profiles).length === 0) {
            profiles['Subasta'] = { actions: [], events: [], nextActionId: 1, nextEventId: 1 };
            activeProfileName = 'Subasta';
        }

        if (!profiles[activeProfileName]) {
            activeProfileName = Object.keys(profiles)[0];
        }
        updateProfileSelector();
        renderActiveProfileData();
    }

    function updateProfileSelector() {
        const profileSelector = document.getElementById('profile-selector');
        profileSelector.innerHTML = '';
        Object.keys(profiles).forEach(profileName => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            profileSelector.appendChild(option);
        });
        profileSelector.value = activeProfileName;
    }

    function renderActiveProfileData() {
        currentPageActions = 1;
        currentPageEvents = 1;
        renderActions();
        renderEvents();
    }

    // ==========================================================
    // SECCIÓN 1.5: LÓGICA PARA LA SECCIÓN DE PERFILES
    // ==========================================================
    const profileSelector = document.getElementById('profile-selector');
    const createProfileBtn = document.getElementById('create-profile-btn');
    const deleteProfileBtn = document.getElementById('delete-profile-btn');
    const createProfileFormContainer = document.getElementById('create-profile-form-container');
    const newProfileNameInput = document.getElementById('new-profile-name-input');
    const applyNewProfileBtn = document.getElementById('apply-new-profile-btn');
    const discardNewProfileBtn = document.getElementById('discard-new-profile-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileFormContainer = document.getElementById('edit-profile-form-container');
    const editProfileNameInput = document.getElementById('edit-profile-name-input');
    const applyEditProfileBtn = document.getElementById('apply-edit-profile-btn');
    const discardEditProfileBtn = document.getElementById('discard-edit-profile-btn');
    const duplicateProfileBtn = document.getElementById('duplicate-profile-btn');
    const newProfileModalTitle = createProfileFormContainer.querySelector('h3');
    const deleteProfileModal = document.getElementById('delete-profile-modal');
    const deleteProfileMessage = document.getElementById('delete-profile-message');
    const confirmDeleteProfileBtn = document.getElementById('confirm-delete-profile-btn');
    const cancelDeleteProfileBtn = document.getElementById('cancel-delete-profile-btn');
    // --- LÍNEAS NUEVAS A AÑADIR ---
    const exportProfileBtn = document.getElementById('export-profile-btn');

    exportProfileBtn.addEventListener('click', async () => {
        if (!activeProfileName || !profiles[activeProfileName]) {
            return showToastNotification('⚠️ No hay un perfil seleccionado para exportar.');
        }

        const profileToExport = {
            name: activeProfileName,
            data: profiles[activeProfileName]
        };

        if (window.electronAPI && window.electronAPI.exportProfile) {
            const result = await window.electronAPI.exportProfile(profileToExport);

            if (result.success) {
                showToastNotification(`✅ Perfil exportado a: ${result.path}`);
            } else if (!result.canceled) {
                showToastNotification(`❌ Error al exportar el perfil: ${result.error}`);
            }
        } else {
            showToastNotification('⚠️ La función de exportar no está disponible.');
        }
    });
    // --- FIN DE LAS LÍNEAS NUEVAS ---

    const importProfileBtn = document.getElementById('import-profile-btn');

    importProfileBtn.addEventListener('click', async () => {
        if (!window.electronAPI || !window.electronAPI.importProfile) {
            return showToastNotification('⚠️ La función de importar no está disponible.');
        }

        const result = await window.electronAPI.importProfile();

        if (result.success && result.data) {
            const importedProfileData = result.data;
            
            // Verificamos que el perfil activo exista
            const currentProfile = profiles[activeProfileName];
            if (!currentProfile) {
                return showToastNotification('❌ No hay un perfil activo para importar los datos.');
            }

            // --- INICIO DE LA LÓGICA DE FUSIÓN ---

            // 1. Fusionar las ACCIONES
            if (importedProfileData.actions && importedProfileData.actions.length > 0) {
                importedProfileData.actions.forEach(importedAction => {
                    // Asignamos un nuevo ID único para evitar colisiones
                    const newAction = { ...importedAction, id: currentProfile.nextActionId++ };
                    currentProfile.actions.push(newAction);
                });
            }

            // 2. Fusionar los EVENTOS
            if (importedProfileData.events && importedProfileData.events.length > 0) {
                 importedProfileData.events.forEach(importedEvent => {
                    // Asignamos un nuevo ID único para evitar colisiones
                    const newEvent = { ...importedEvent, id: currentProfile.nextEventId++ };
                    currentProfile.events.push(newEvent);
                });
            }
            
            // --- FIN DE LA LÓGICA DE FUSIÓN ---

            // Actualizar toda la interfaz para reflejar los nuevos datos
            renderActiveProfileData();
            await saveAllData();

            showToastNotification(`✅ Datos importados y añadidos al perfil "${activeProfileName}".`);

        } else if (!result.canceled) {
            showToastNotification(`❌ Error al importar: ${result.error}`);
        }
    });

    profileSelector.addEventListener('change', async () => {
        activeProfileName = profileSelector.value;
        renderActiveProfileData();
        await saveAllData();
    });

    createProfileBtn.addEventListener('click', () => {
        if (newProfileModalTitle) newProfileModalTitle.textContent = 'Crear Nuevo Perfil';
        createProfileFormContainer.classList.add('visible');
        newProfileNameInput.value = '';
        newProfileNameInput.focus();
    });

    discardNewProfileBtn.addEventListener('click', () => createProfileFormContainer.classList.remove('visible'));
    createProfileFormContainer.addEventListener('click', (e) => { if (e.target === createProfileFormContainer) createProfileFormContainer.classList.remove('visible'); });

    applyNewProfileBtn.addEventListener('click', async () => {
        const newName = newProfileNameInput.value.trim();
        if (!newName) return showToastNotification('⚠️ El nombre del perfil no puede estar vacío.');
        if (profiles[newName]) return showToastNotification('⚠️ Ya existe un perfil con ese nombre.');

        profiles[newName] = { actions: [], events: [], nextActionId: 1, nextEventId: 1 };
        activeProfileName = newName;

        updateProfileSelector();
        renderActiveProfileData();
        createProfileFormContainer.classList.remove('visible');
        await saveAllData();
        showToastNotification(`✅ Nuevo perfil "${newName}" creado.`);
    });

    editProfileBtn.addEventListener('click', () => {
        if (!activeProfileName) return showToastNotification('⚠️ No hay un perfil seleccionado para editar.');
        editProfileNameInput.value = activeProfileName;
        editProfileFormContainer.classList.add('visible');
        editProfileNameInput.focus();
        editProfileNameInput.select();
    });

    discardEditProfileBtn.addEventListener('click', () => editProfileFormContainer.classList.remove('visible'));
    editProfileFormContainer.addEventListener('click', (e) => { if (e.target === editProfileFormContainer) editProfileFormContainer.classList.remove('visible'); });

    applyEditProfileBtn.addEventListener('click', async () => {
        const originalName = activeProfileName;
        const newName = editProfileNameInput.value.trim();
        if (!newName) return showToastNotification('⚠️ El nombre del perfil no puede estar vacío.');
        if (newName === originalName) return editProfileFormContainer.classList.remove('visible');
        if (profiles[newName]) return showToastNotification('⚠️ Ya existe un perfil con ese nombre.');

        profiles[newName] = profiles[originalName];
        delete profiles[originalName];
        activeProfileName = newName;

        updateProfileSelector();
        editProfileFormContainer.classList.remove('visible');
        await saveAllData();
        showToastNotification('✅ Perfil editado con éxito.');
    });

    deleteProfileBtn.addEventListener('click', () => {
        if (Object.keys(profiles).length <= 1) return showToastNotification('⚠️ No puedes eliminar el último perfil.');
        deleteProfileMessage.textContent = `¿Seguro que quieres eliminar el perfil "${activeProfileName}"?`;
        deleteProfileModal.classList.add('visible');
    });

    cancelDeleteProfileBtn.addEventListener('click', () => deleteProfileModal.classList.remove('visible'));
    deleteProfileModal.addEventListener('click', (e) => { if (e.target === deleteProfileModal) deleteProfileModal.classList.remove('visible'); });

    confirmDeleteProfileBtn.addEventListener('click', async () => {
        const deletedProfileName = activeProfileName;
        delete profiles[deletedProfileName];
        activeProfileName = Object.keys(profiles)[0];

        updateProfileSelector();
        renderActiveProfileData();
        await saveAllData();
        deleteProfileModal.classList.remove('visible');
        showToastNotification(`🗑 Perfil "${deletedProfileName}" eliminado.`);
    });

    duplicateProfileBtn.addEventListener('click', () => {
        if (!activeProfileName) return showToastNotification('⚠️ No hay un perfil para duplicar.');
        const baseName = activeProfileName;
        let newName = `${baseName} (Copia)`;
        let counter = 2;
        while (profiles[newName]) {
            newName = `${baseName} (Copia ${counter++})`;
        }
        
        profiles[newName] = JSON.parse(JSON.stringify(profiles[baseName]));
        activeProfileName = newName;
        
        updateProfileSelector();
        renderActiveProfileData();
        saveAllData();
        showToastNotification(`✅ Perfil "${newName}" duplicado.`);
    });

    // ====================================================
    // SECCIÓN 3: LÓGICA DE ACCIONES Y MODALES
    // ====================================================
    const createActionButton = document.getElementById('create-action-button');
    const actionModalOverlay = document.getElementById('create-action-modal');
    const actionModalContent = actionModalOverlay.querySelector('.modal-content');
    const closeActionButton = document.getElementById('close-action-modal-button');
    const discardActionButton = document.getElementById('discard-action-button');
    const applyActionButton = document.getElementById('apply-action-button');
    const actionsListContainer = document.getElementById('actions-list-container');

    function renderActions() {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) {
            if(actionsListContainer) actionsListContainer.innerHTML = '<div class="no-items-message">Selecciona un perfil</div>';
            return;
        }

        const actions = currentProfile.actions;
        const container = actionsListContainer.parentElement;
        actionsListContainer.innerHTML = '';

        if (!actions || actions.length === 0) {
            actionsListContainer.innerHTML = '<div class="no-items-message">Sin acciones</div>';
            container.classList.add('empty');
            renderPaginationControls(container, 0, 0, handleActionPageChange);
            return;
        }
        container.classList.remove('empty');

        const paginatedActions = actions.slice((currentPageActions - 1) * ITEMS_PER_PAGE, currentPageActions * ITEMS_PER_PAGE);

        paginatedActions.forEach(action => {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'list-view-row action-row';
            
            let descriptionText = action.description;
            let descriptionColor = '#10c35b'; // default
            if (action.extraAction) {
                descriptionColor = '#ffc107';
            } else if (action.webhookChecked) {
                descriptionColor = '#4a90e2';
            } else if (action.keystrokeAction) {
                 descriptionColor = '#9B59B6';
            }

            // --- ESTE ES EL INNERHTML CORRECTO PARA LAS ACCIONES ---
            actionDiv.innerHTML = `
                <div><input type="checkbox"></div>
                <div class="row-icons">
                    <span class="action-icon-bg play" onclick="playAction(${action.id}, { nickname: 'Test' })">
                        <i class="fas fa-play"></i>
                    </span>
                    <span class="action-icon-bg edit" onclick="editAction(${action.id})">
                        <i class="fas fa-pencil-alt"></i>
                    </span>
                    <span class="action-icon-bg duplicate" onclick="duplicateAction(${action.id})">
                        <i class="fas fa-copy"></i>
                    </span>
                    <span class="action-icon-bg delete" onclick="deleteAction(${action.id})">
                        <i class="fas fa-trash-alt"></i>
                    </span>
                </div>
                <div>${action.name}</div>
                <div>${action.queue}</div>
                <div>${action.duration}</div>
                <div style="font-weight: bold; color: ${descriptionColor};">${descriptionText}</div>
            `;
            // --- FIN DEL BLOQUE CORRECTO ---

            actionsListContainer.appendChild(actionDiv);
        });
        renderPaginationControls(container, currentPageActions, actions.length, handleActionPageChange);
    }

    function resetActionModal() {
        document.getElementById('modal-title').textContent = 'Nueva Accion';
        document.getElementById('editing-action-id').value = '';
        document.getElementById('action-name').value = '';
        document.querySelectorAll('#general-actions-content input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.getElementById('webhook-config').classList.remove('open');
        document.getElementById('extra-actions-config').classList.remove('open');
        document.getElementById('keystroke-config').classList.remove('open'); // ADDED
        document.getElementById('webhook-url').value = '';
        document.getElementById('webhook-quantity').value = '1';
        document.getElementById('webhook-interval').value = '100';
        document.getElementById('display-duration').value = '5';
        document.getElementById('action-queue').value = 'Screen 1';
        document.getElementById('action-image').value = '';
        document.getElementById('repeat-with-gift-combo').checked = false;
        
        // KEYSTROKE RESET ADDED
        if (typeof currentKeystrokeSequence !== 'undefined') currentKeystrokeSequence.length = 0;
        if (typeof updateKeystrokeSummary === 'function') updateKeystrokeSummary();
        if (typeof renderSequence === 'function') renderSequence();
    }

    const closeActionModal = () => { actionModalOverlay.classList.remove('open'); resetActionModal(); };
    createActionButton.addEventListener('click', () => { resetActionModal(); actionModalOverlay.classList.add('open'); });
    closeActionButton.addEventListener('click', closeActionModal);
    discardActionButton.addEventListener('click', closeActionModal);
    actionModalOverlay.addEventListener('click', (e) => { if (e.target === actionModalOverlay) closeActionModal(); });

    applyActionButton.addEventListener('click', async () => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return showToastNotification('⚠️ Error: No hay un perfil activo.');

        const id = document.getElementById('editing-action-id').value ? parseInt(document.getElementById('editing-action-id').value) : null;
        const name = document.getElementById('action-name').value;
        if (name.trim() === '') return showToastNotification('⚠️ Debes darle un nombre a la acción.');

        const webhookChecked = document.getElementById('action-webhook').checked;
        const isExtraAction = document.getElementById('action-extra').checked;
        const simulateKeystrokes = document.getElementById('action-simulate-keystrokes').checked; // ADDED

        const newActionData = {
            id: id || currentProfile.nextActionId,
            name: name,
            description: 'Acción Local',
            duration: document.getElementById('display-duration').value,
            queue: document.getElementById('action-queue').value,
            image: document.getElementById('action-image').value,
            repeatCombo: document.getElementById('repeat-with-gift-combo').checked,
            webhookChecked: false,
            extraAction: null,
            keystrokeAction: null // ADDED
        };

        if (webhookChecked) {
            const webhookUrl = document.getElementById('webhook-url').value;
            if (webhookUrl.trim() === '') return showToastNotification('⚠️ La URL del WebHook no puede estar vacía.');
            newActionData.webhookChecked = true;
            newActionData.webhookUrl = webhookUrl;
            newActionData.webhookQuantity = document.getElementById('webhook-quantity').value;
            newActionData.webhookInterval = document.getElementById('webhook-interval').value;
            newActionData.description = 'WebHook';

        } else if (isExtraAction) {
            const widgetId = document.getElementById('extra-action-widget-selector').value;
            const operation = document.getElementById('extra-action-operation-selector').value;
            const quantity = parseInt(document.getElementById('extra-action-quantity').value, 10);

            newActionData.extraAction = { type: 'widgetControl', widgetId, operation, quantity };

            let desc = `Extra: ${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
            if (operation !== 'reset') desc += ` ${quantity}`;
            desc += ` a ${widgetId}`;
            newActionData.description = desc;

        } else if (simulateKeystrokes) { // ADDED KEYSTROKE LOGIC
             if (currentKeystrokeSequence.length === 0) return showToastNotification('⚠️ La secuencia de Keystrokes no puede estar vacía.');

             const repeat = document.getElementById('keystroke-repeat').value;
             const interval = document.getElementById('keystroke-interval').value;
             const addToQueue = document.getElementById('keystroke-add-to-queue').checked;
             const gameCompatibility = document.getElementById('game-compat-check').checked; 

             newActionData.keystrokeAction = {
                 sequence: [...currentKeystrokeSequence],
                 repeat: parseInt(repeat),
                 interval: parseInt(interval),
                 addToQueue: addToQueue,
                 gameCompatibility: gameCompatibility 
             };
             newActionData.description = 'Keystrokes';
        }


        if (id) {
            const index = currentProfile.actions.findIndex(a => a.id === id);
            if (index !== -1) currentProfile.actions[index] = newActionData;
        } else {
            currentProfile.actions.push(newActionData);
            currentPageActions = Math.ceil(currentProfile.actions.length / ITEMS_PER_PAGE);
            currentProfile.nextActionId++;
        }
        renderActions();
        closeActionModal();
        await saveAllData();
        showToastNotification(`✅ Acción "${name}" guardada.`);
    });


    document.getElementById('action-webhook').addEventListener('change', (e) => {
        document.getElementById('webhook-config').classList.toggle('open', e.target.checked);
        if (e.target.checked) {
            document.getElementById('action-extra').checked = false;
            document.getElementById('extra-actions-config').classList.remove('open');
            document.getElementById('action-simulate-keystrokes').checked = false; // ADDED
            document.getElementById('keystroke-config').classList.remove('open'); // ADDED
        }
    });

    const actionExtraCheckbox = document.getElementById('action-extra');
    const extraActionsConfig = document.getElementById('extra-actions-config');
    const operationSelector = document.getElementById('extra-action-operation-selector');
    const operationIcon = document.getElementById('extra-action-op-icon');
    const quantityInputExtra = document.getElementById('extra-action-quantity');

    actionExtraCheckbox.addEventListener('change', (e) => {
        extraActionsConfig.classList.toggle('open', e.target.checked);
        if (e.target.checked) {
            document.getElementById('action-webhook').checked = false;
            document.getElementById('webhook-config').classList.remove('open');
            document.getElementById('action-simulate-keystrokes').checked = false; // ADDED
            document.getElementById('keystroke-config').classList.remove('open'); // ADDED
        }
    });

    operationSelector.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        operationIcon.src = selectedOption.getAttribute('data-icon') || 'images/trophy.png';
        const quantityGroup = quantityInputExtra.closest('.extra-action-group');
        if (quantityGroup) quantityGroup.style.display = e.target.value === 'reset' ? 'none' : 'flex';
    });
    
    // Keystroke checkbox listener is now in SECCIÓN 5

    window.playAction = (id, eventData = {}) => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;
        const action = currentProfile.actions.find(a => a.id === id);

        if (action) {
            // Manejo especial para testear Keystrokes manualmente
            if (action.keystrokeAction) {
                showToastNotification(`La acción se ejecutará en 3 segundos...`);
                setTimeout(() => {
                    actionQueue.push({ action, eventData });
                    processQueue(); // Esto mostrará la segunda notificación "Ejecutando..."
                }, 3000);
            } else {
                // Comportamiento original para el resto de acciones
                actionQueue.push({ action, eventData });
                processQueue();
            }
        }
    };

    window.editAction = (id) => {
        const action = profiles[activeProfileName]?.actions.find(a => a.id === id);
        if (action) {
            resetActionModal();
            document.getElementById('modal-title').textContent = 'Editar Accion';
            document.getElementById('editing-action-id').value = id;
            document.getElementById('action-name').value = action.name;
            document.getElementById('display-duration').value = action.duration;
            document.getElementById('action-queue').value = action.queue;
            document.getElementById('action-image').value = action.image;
            document.getElementById('repeat-with-gift-combo').checked = action.repeatCombo;

            document.getElementById('action-webhook').checked = action.webhookChecked;
            if (action.webhookChecked) {
                document.getElementById('webhook-config').classList.add('open');
                document.getElementById('webhook-url').value = action.webhookUrl;
                document.getElementById('webhook-quantity').value = action.webhookQuantity;
                document.getElementById('webhook-interval').value = action.webhookInterval;
            }

            if (action.extraAction && action.extraAction.type === 'widgetControl') {
                const actionExtraCheckbox = document.getElementById('action-extra');
                actionExtraCheckbox.checked = true;
                actionExtraCheckbox.dispatchEvent(new Event('change'));

                document.getElementById('extra-action-widget-selector').value = action.extraAction.widgetId;
                const operationSelector = document.getElementById('extra-action-operation-selector');
                operationSelector.value = action.extraAction.operation;
                operationSelector.dispatchEvent(new Event('change'));
                document.getElementById('extra-action-quantity').value = action.extraAction.quantity;
            } else if (action.keystrokeAction) { // ADDED KEYSTROKE EDITING
                const keystrokeCheckbox = document.getElementById('action-simulate-keystrokes');
                keystrokeCheckbox.checked = true;
                keystrokeCheckbox.dispatchEvent(new Event('change'));

                currentKeystrokeSequence.splice(0, currentKeystrokeSequence.length, ...action.keystrokeAction.sequence);
                updateKeystrokeSummary();
                renderSequence();

                document.getElementById('keystroke-repeat').value = action.keystrokeAction.repeat;
                document.getElementById('keystroke-interval').value = action.keystrokeAction.interval;
                document.getElementById('keystroke-add-to-queue').checked = action.keystrokeAction.addToQueue;
                document.getElementById('game-compat-check').checked = action.keystrokeAction.gameCompatibility; 
            }
            
            actionModalOverlay.classList.add('open');
        }
    };

    window.deleteAction = async (id) => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;
        const action = currentProfile.actions.find(a => a.id === id);
        if (action && confirm(`¿Seguro que quieres borrar la acción "${action.name}"?`)) {
            currentProfile.actions = currentProfile.actions.filter(a => a.id !== id);
            const totalPages = Math.ceil(currentProfile.actions.length / ITEMS_PER_PAGE) || 1;
            if (currentPageActions > totalPages) currentPageActions = totalPages;
            renderActions();
            await saveAllData();
            showToastNotification(`🗑 Acción "${action.name}" eliminada.`);
        }
    };

    // --- NUEVA FUNCIÓN PARA DUPLICAR ACCIONES ---
    window.duplicateAction = async (id) => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;

        // 1. Encontrar la acción original
        const originalAction = currentProfile.actions.find(a => a.id === id);
        if (!originalAction) {
            return showToastNotification('⚠️ No se encontró la acción para duplicar.');
        }

        // 2. Crear una copia profunda del objeto de la acción
        const duplicatedAction = JSON.parse(JSON.stringify(originalAction));

        // 3. Asignar un nuevo ID único
        duplicatedAction.id = currentProfile.nextActionId++;
        
        // 4. Generar un nuevo nombre para evitar confusiones
        duplicatedAction.name = `${originalAction.name} (Copia)`;
        
        // Opcional: Lógica para nombres de copia incrementales
        let counter = 2;
        while (currentProfile.actions.some(a => a.name === duplicatedAction.name)) {
            duplicatedAction.name = `${originalAction.name} (Copia ${counter++})`;
        }

        // 5. Añadir la nueva acción a la lista
        currentProfile.actions.push(duplicatedAction);
        
        // 6. Actualizar la interfaz y guardar los datos
        renderActions();
        await saveAllData();
        showToastNotification(`✅ Acción "${originalAction.name}" duplicada.`);
    };

    // ==========================================================
    // SECCIÓN 3.5: LÓGICA COMPLETA DE EVENTOS
    // ==========================================================
    let selectedActionsAll = []; 
    let selectedActionsRandom = [];
    const createEventButton = document.getElementById('create-event-button');
    const eventModalOverlay = document.getElementById('create-event-modal');
    const eventModalScrollContent = eventModalOverlay.querySelector('.event-modal-scroll-content');
    const closeEventButton = document.getElementById('close-event-modal-button');
    const discardEventButton = document.getElementById('discard-event-button');
    const applyEventButton = document.getElementById('apply-event-button');
    const multiSelectAll = document.getElementById('multi-select-all');
    const multiSelectRandom = document.getElementById('multi-select-random');
    const eventsListContainer = document.getElementById('events-list-container');
    const whoLabels = { 'all': 'Todos', 'followers': 'Seguidores', 'subs': 'Suscriptores', 'mods': 'Moderadores', 'top': 'Top Gifters', 'specific': 'Específico' };
    const whyLabels = { 'join': 'Join', 'share': 'Share', 'follow': 'Follow', 'superfan': 'Super Fan', 'likes': 'Likes (taps)', 'chat-global': 'Chat (global)', 'chat-comment': 'Chat (comentario)', 'emote': 'Emote', 'gift-specific': 'Gift (específico)', 'gift-min': 'Gift (mínimo)', 'gift-id': 'Gift (ID)' };
    
    const eventIcons = {
        'join': '<i class="fas fa-sign-in-alt"></i>',
        'share': '<i class="fas fa-share-square"></i>',
        'follow': '<i class="fas fa-user-plus"></i>',
        'likes': '<i class="fas fa-thumbs-up"></i>',
        'chat-comment': '<i class="fas fa-comment"></i>'
    };
    
    function getFullGiftDetails(giftId) {
        const gift = availableGiftsCache.find(g => g.id == giftId);
        if (gift && gift.image && gift.image.url_list[0]) {
            return {
                image: gift.image.url_list[0],
                name: gift.name,
                coins: gift.diamond_count 
            };
        }
        return null;
    }

    const giftSpecificSelector = document.getElementById('gift-specific-selector');
    const giftSelector = document.getElementById('custom-gift-selector');
    const giftSelectorDisplay = document.getElementById('gift-selector-display');
    const giftOptionsList = document.getElementById('gift-options-list');
    const giftSearchInput = document.getElementById('gift-search-input');
    const selectedGiftIdInput = document.getElementById('selected-gift-id');

    function selectGift(gift) {
        giftSelectorDisplay.innerHTML = `<img src="${gift.image.url_list[0]}" alt="${gift.name}"><span>${gift.name}</span>`;
        selectedGiftIdInput.value = gift.id;
        giftSelector.classList.remove('open');
    }
    
    function resetGiftSelector() {
        giftSelectorDisplay.innerHTML = `<span class="placeholder">Selecciona...</span>`;
        selectedGiftIdInput.value = '';
        giftSearchInput.value = '';
        filterGifts('');
    }

    async function populateGiftSelector() {
        if (!window.electronAPI) {
            giftOptionsList.innerHTML = '<div class="no-gifts-message">No disponible en modo navegador.</div>';
            return;
        }
        if (availableGiftsCache.length > 0) { renderGiftOptions(availableGiftsCache); return; }
        giftOptionsList.innerHTML = '<div class="no-gifts-message">Cargando...</div>';
        try {
            const gifts = await window.electronAPI.getAvailableGifts();
            if (gifts.length === 0) {
                giftOptionsList.innerHTML = '<div class="no-gifts-message">No hay regalos guardados.</div>';
                return;
            }
            availableGiftsCache = gifts;
            renderGiftOptions(gifts);
        } catch (error) {
            console.error("Error al cargar los regalos:", error);
            giftOptionsList.innerHTML = '<div class="no-gifts-message">Error al cargar regalos.</div>';
        }
    }

    function renderGiftOptions(gifts) {
        if (!gifts || gifts.length === 0) { giftOptionsList.innerHTML = '<div class="no-gifts-message">No hay regalos guardados.</div>'; return; }
        gifts.sort((a, b) => a.diamond_count - b.diamond_count);
        giftOptionsList.innerHTML = '';
        gifts.forEach(gift => {
            if (!gift.image || !gift.image.url_list[0]) return;
            const optionItem = document.createElement('div');
            optionItem.className = 'gift-option-item';
            optionItem.innerHTML = `<img src="${gift.image.url_list[0]}" alt="${gift.name}"><div class="gift-details"><span class="gift-name">${gift.name}</span><span class="gift-cost">${gift.diamond_count} Coins - ID:${gift.id}</span></div>`;
            optionItem.addEventListener('click', (e) => { e.stopPropagation(); selectGift(gift); });
            giftOptionsList.appendChild(optionItem);
        });
    }

    function filterGifts(searchTerm) {
        const term = searchTerm.toLowerCase();
        const allOptions = giftOptionsList.querySelectorAll('.gift-option-item');
        allOptions.forEach(option => {
            const name = option.querySelector('.gift-name').textContent.toLowerCase();
            const idText = option.querySelector('.gift-cost').textContent.toLowerCase();
            option.style.display = (name.includes(term) || idText.includes(term)) ? 'flex' : 'none';
        });
    }

    giftSelectorDisplay.addEventListener('click', () => giftSelector.classList.toggle('open'));
    giftSearchInput.addEventListener('input', () => filterGifts(giftSearchInput.value));
    document.addEventListener('click', (e) => { if (giftSelector && !giftSelector.contains(e.target)) { giftSelector.classList.remove('open'); } });

    function setupMultiSelect(container, selectedActionsArray) { 
        const display = container.querySelector('.multiselect-display'); 
        const optionsContainer = container.querySelector('.multiselect-options'); 
        display.addEventListener('click', (e) => { e.stopPropagation(); document.querySelectorAll('.multiselect-options').forEach(opt => { if(opt !== optionsContainer) opt.style.display = 'none'; }); document.querySelectorAll('.multiselect-display').forEach(d => { if(d !== display) d.classList.remove('open'); }); optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block'; display.classList.toggle('open'); }); 
        optionsContainer.addEventListener('click', (e) => { 
            if (e.target.classList.contains('multiselect-option')) { 
                const actionId = parseInt(e.target.dataset.id); 
                const actionName = e.target.textContent; 
                if (selectedActionsArray.some(a => a.id === actionId)) { 
                    const index = selectedActionsArray.findIndex(a => a.id === actionId); 
                    selectedActionsArray.splice(index, 1); 
                } else { 
                    selectedActionsArray.push({ id: actionId, name: actionName }); 
                } 
                renderSelectedTags(container, selectedActionsArray); 
                renderOptions(container, selectedActionsArray); 
            } 
        }); 
    }
    
    function renderSelectedTags(container, selectedActionsArray) { 
        const display = container.querySelector('.multiselect-display'); 
        display.innerHTML = ''; 
        if (selectedActionsArray.length === 0) { 
            display.innerHTML = '<span class="placeholder">Selecciona...</span>'; 
        } else { 
            selectedActionsArray.forEach(action => { 
                const tag = document.createElement('div'); 
                tag.className = 'multiselect-tag'; 
                tag.innerHTML = `${action.name} <span class="remove-tag" data-id="${action.id}">&times;</span>`; 
                display.appendChild(tag); 
                tag.querySelector('.remove-tag').addEventListener('click', (e) => { 
                    e.stopPropagation(); 
                    const idToRemove = parseInt(e.target.dataset.id); 
                    const index = selectedActionsArray.findIndex(a => a.id === idToRemove); 
                    selectedActionsArray.splice(index, 1); 
                    renderSelectedTags(container, selectedActionsArray); 
                    renderOptions(container, selectedActionsArray); 
                }); 
            }); 
        } 
    }
    
    function renderOptions(container, selectedActionsArray) { 
        const currentProfile = profiles[activeProfileName];
        const actions = currentProfile?.actions || [];
        const optionsContainer = container.querySelector('.multiselect-options'); 
        optionsContainer.innerHTML = ''; 
        if (actions.length === 0) { 
            optionsContainer.innerHTML = '<div style="padding: 10px; color: #999;">No hay acciones creadas.</div>'; 
            return; 
        } 
        actions.forEach(action => { 
            const optionEl = document.createElement('div'); 
            optionEl.className = 'multiselect-option'; 
            optionEl.dataset.id = action.id; 
            optionEl.textContent = action.name; 
            if (selectedActionsArray.some(a => a.id === action.id)) { 
                optionEl.classList.add('selected'); 
            } 
            optionsContainer.appendChild(optionEl); 
        }); 
    }

    setupMultiSelect(multiSelectAll, selectedActionsAll);
    setupMultiSelect(multiSelectRandom, selectedActionsRandom);

    function resetEventModal() { 
        document.getElementById('event-modal-title').textContent = 'Nuevo Evento'; 
        document.getElementById('editing-event-id').value = ''; 
        document.querySelector('input[name="event_who"][value="all"]').checked = true; 
        document.querySelector('input[name="event_why"][value="join"]').checked = true; 
        document.getElementById('event-cooldown').value = '0'; 
        document.getElementById('event-image').value = ''; 
        selectedActionsAll.length = 0; 
        selectedActionsRandom.length = 0; 
        renderSelectedTags(multiSelectAll, selectedActionsAll); 
        renderSelectedTags(multiSelectRandom, selectedActionsRandom); 
        giftSpecificSelector.style.display = 'none'; 
        resetGiftSelector(); 
        [multiSelectAll, multiSelectRandom].forEach(select => { 
            const optionsContainer = select.querySelector('.multiselect-options'); 
            const display = select.querySelector('.multiselect-display'); 
            optionsContainer.style.display = 'none'; 
            display.classList.remove('open'); 
            optionsContainer.scrollTop = 0; 
        }); 
    }
    
    const closeEventModal = () => { eventModalOverlay.classList.remove('open'); resetEventModal(); };
    
    async function openEventModal() { 
        renderOptions(multiSelectAll, selectedActionsAll); 
        renderOptions(multiSelectRandom, selectedActionsRandom); 
        await populateGiftSelector();
        eventModalOverlay.classList.add('open'); 
    }

    function renderEvents() { 
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) {
            if(eventsListContainer) eventsListContainer.innerHTML = '<div class="no-items-message">Selecciona un perfil</div>';
            return;
        }

        const events = currentProfile.events;
        const container = eventsListContainer.parentElement; 
        eventsListContainer.innerHTML = ''; 
        if (!events || events.length === 0) { 
            eventsListContainer.innerHTML = '<div class="no-items-message">Sin eventos</div>'; 
            container.classList.add('empty'); 
            renderPaginationControls(container, 0, 0, handleEventPageChange); 
            return; 
        } 
        container.classList.remove('empty');

        const paginatedEvents = events.slice((currentPageEvents - 1) * ITEMS_PER_PAGE, currentPageEvents * ITEMS_PER_PAGE);

        paginatedEvents.forEach(event => { 
            let triggerContent = '';
            if (event.why === 'gift-specific' && event.giftId) {
                const giftDetails = getFullGiftDetails(event.giftId);
                if (giftDetails) {
                    triggerContent = `<div class="trigger-content"><img src="${giftDetails.image}" alt="${giftDetails.name}"> <span>${giftDetails.name}</span><span style="color: #ffeb3b;">- ${giftDetails.coins} coins</span></div>`;
                } else {
                    triggerContent = `<div class="trigger-content"><i class="fas fa-gift"></i> Gift ID: ${event.giftId}</div>`;
                }
            } else {
                triggerContent = `<div class="trigger-content">${eventIcons[event.why] || ''} ${whyLabels[event.why] || event.why}</div>`;
            }

            const actionsSummary = [...(event.actionsAll || []), ...(event.actionsRandom || [])].map(a => a.name).join(', ') || 'Ninguna';

            const eventDiv = document.createElement('div'); 
            eventDiv.className = 'list-view-row event-row'; 
            eventDiv.innerHTML = `
                <div><input type="checkbox"></div>
                <div class="row-icons">
                    <!-- ICONOS ACTUALIZADOS PARA EVENTOS -->
                    <span class="action-icon-bg edit" onclick="editEvent(${event.id})">
                        <i class="fas fa-pencil-alt"></i>
                    </span>
                    <span class="action-icon-bg delete" onclick="deleteEvent(${event.id})">
                        <i class="fas fa-trash-alt"></i>
                    </span>
                </div>

                <!-- ESTAS SON LAS LÍNEAS QUE FALTABAN -->
                <div class="icon-center">
                    <input type="checkbox" onchange="toggleEventStatus(${event.id})" ${event.enabled ? 'checked' : ''}>
                </div>
                <div class="icon-center">
                    <i class="fab fa-tiktok"></i>
                </div>
                <div>${whoLabels[event.who] || event.who}</div>
                <div>${triggerContent}</div> 
                <div>${actionsSummary}</div>`; // <-- Y no te olvides del punto y coma aquí
            eventsListContainer.appendChild(eventDiv); 
        }); 

        renderPaginationControls(container, currentPageEvents, events.length, handleEventPageChange);
    }
    
    createEventButton.addEventListener('click', () => { resetEventModal(); openEventModal(); });
    closeEventButton.addEventListener('click', closeEventModal);
    discardEventButton.addEventListener('click', closeEventModal);
    eventModalOverlay.addEventListener('click', (e) => { if (e.target === eventModalOverlay) closeEventModal(); });

    document.querySelectorAll('input[name="event_why"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            
            // Ocultamos todos los campos dinámicos primero
            document.getElementById('gift-specific-selector').style.display = 'none';
            document.getElementById('likes-amount-selector').style.display = 'none';

            // Mostramos el que corresponda
            if (selectedValue === 'gift-specific') {
                document.getElementById('gift-specific-selector').style.display = 'grid';
            } else if (selectedValue === 'likes') {
                document.getElementById('likes-amount-selector').style.display = 'grid';
            }
        });
    });

    applyEventButton.addEventListener('click', async () => { 
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return showToastNotification('⚠️ Error: No hay perfil activo.');
        if(selectedActionsAll.length === 0 && selectedActionsRandom.length === 0) return showToastNotification('⚠️ Debes seleccionar al menos una acción.');
        
        const whyValue = document.querySelector('input[name="event_why"]:checked').value;
        const id = document.getElementById('editing-event-id').value ? parseInt(document.getElementById('editing-event-id').value) : null;
        
        const eventData = { 
            id: id || currentProfile.nextEventId, 
            enabled: true,
            who: document.querySelector('input[name="event_who"]:checked').value, 
            why: whyValue, 
            actionsAll: [...selectedActionsAll], 
            actionsRandom: [...selectedActionsRandom], 
            cooldown: document.getElementById('event-cooldown').value, 
            image: document.getElementById('event-image').value 
        }; 
        
        if (whyValue === 'gift-specific') {
            const giftId = selectedGiftIdInput.value;
            if (!giftId) return showToastNotification('⚠️ Debes seleccionar un regalo específico.');
            const selectedGift = availableGiftsCache.find(g => g.id == giftId);
            eventData.giftId = parseInt(giftId);
            if (selectedGift) {
                eventData.giftName = selectedGift.name;
                eventData.giftImage = selectedGift.image?.url_list[0];
            }
        }

        // --- AÑADE ESTE BLOQUE ---
        if (whyValue === 'likes') {
            const likesAmount = parseInt(document.getElementById('likes-amount').value, 10);
            if (!likesAmount || likesAmount < 1) return showToastNotification('⚠️ La cantidad de likes debe ser al menos 1.');
            eventData.likesAmount = likesAmount;
        }
        // --- FIN DEL BLOQUE A AÑADIR ---

        if (id) { 
            const index = currentProfile.events.findIndex(e => e.id === id); 
            if (index !== -1) currentProfile.events[index] = eventData; 
        } else { 
            currentProfile.events.push(eventData);
            currentPageEvents = Math.ceil(currentProfile.events.length / ITEMS_PER_PAGE);
            currentProfile.nextEventId++; 
        } 
        renderEvents(); 
        closeEventModal(); 
        await saveAllData(); 
        showToastNotification(`✅ Evento guardado.`); 
    });
    
    window.editEvent = async (id) => { 
        const event = profiles[activeProfileName]?.events.find(e => e.id === id); 
        if (event) { 
            resetEventModal(); 
            document.getElementById('event-modal-title').textContent = 'Editar Evento'; 
            document.getElementById('editing-event-id').value = event.id; 
            document.querySelector(`input[name="event_who"][value="${event.who}"]`).checked = true; 
            const whyRadio = document.querySelector(`input[name="event_why"][value="${event.why}"]`);
            whyRadio.checked = true;
            whyRadio.dispatchEvent(new Event('change'));
            document.getElementById('event-cooldown').value = event.cooldown; 
            document.getElementById('event-image').value = event.image; 
            selectedActionsAll.splice(0, selectedActionsAll.length, ...event.actionsAll); 
            selectedActionsRandom.splice(0, selectedActionsRandom.length, ...event.actionsRandom); 
            renderSelectedTags(multiSelectAll, selectedActionsAll); 
            renderSelectedTags(multiSelectRandom, selectedActionsRandom); 
            await openEventModal();
            if (event.why === 'gift-specific' && event.giftId) {
                const selectedGift = availableGiftsCache.find(g => g.id === event.giftId);
                if (selectedGift) selectGift(selectedGift);
            }
        } 
    };

    window.deleteEvent = async (id) => { 
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;
        if (confirm(`¿Seguro que quieres borrar este evento?`)) { 
            currentProfile.events = currentProfile.events.filter(e => e.id !== id);
            const totalPages = Math.ceil(currentProfile.events.length / ITEMS_PER_PAGE) || 1;
            if (currentPageEvents > totalPages) currentPageEvents = totalPages;
            renderEvents(); 
            await saveAllData(); 
            showToastNotification(`🗑 Evento eliminado.`); 
        } 
    };

    function showToastNotification(message) { 
        const toast = document.getElementById('toast-notification'); 
        toast.textContent = message; 
        toast.classList.add('show'); 
        setTimeout(() => { toast.classList.remove('show'); }, 3000); 
    }

    function renderPaginationControls(container, currentPage, totalItems, pageChangeHandler) {
        const paginationContainer = container.querySelector('.list-view-pagination');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&lt;';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => pageChangeHandler(currentPage - 1));
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('span');
            pageButton.className = 'page-number';
            if (i === currentPage) pageButton.classList.add('active');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => pageChangeHandler(i));
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&gt;';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => pageChangeHandler(currentPage + 1));
        paginationContainer.appendChild(nextButton);
    }

    function handleActionPageChange(page) { currentPageActions = page; renderActions(); }
    function handleEventPageChange(page) { currentPageEvents = page; renderEvents(); }
    
    // ==========================================================
    // SECCIÓN 4: MOTOR DE EVENTOS Y SISTEMA DE COLA
    // ==========================================================´
    let isAuctionRunning = false;
    let userLikeCounters = {}; // <-- NUEVO OBJETO PARA CONTEOS INDIVIDUALES
    
    async function executeExtraAction(extraAction) {
        if (!extraAction || extraAction.type !== 'widgetControl') return;

        const { widgetId, operation, quantity } = extraAction;
        const databaseRef = firebase.database().ref('widgets/' + widgetId);

        console.log(`[Motor Extra] Aplicando: ${operation} ${quantity} a ${widgetId}`);
        return databaseRef.transaction(currentData => {
            if (currentData === null) {
                console.warn(`[Motor Extra] No se encontraron datos para ${widgetId}. Creando valores iniciales.`);
                currentData = { conteo: 0, meta: 5 };
            }

            switch (operation) {
                case 'sumar': currentData.conteo += quantity; break;
                case 'quitar': currentData.conteo -= quantity; break;
                case 'reset': currentData.conteo = 0; break;
            }
            console.log(`[Motor Extra] Widget ${widgetId} actualizado:`, currentData);
            return currentData;
        });
    }

    let actionQueue = []; 
    let isProcessingQueue = false;

    function executeAction(action, eventData) {
        return new Promise(resolve => {
            // La lógica de repetición ahora está en `processTikTokEvent`,
            // por lo que esta función solo necesita ejecutar la acción UNA VEZ.

            if (action.extraAction) {
                executeExtraAction(action.extraAction).then(resolve);
                return;
            }
            if (action.keystrokeAction && window.electronAPI) {
                window.electronAPI.simulateKeystrokes(action.keystrokeAction);
                resolve(); // Asumimos que es rápido
                return;
            }
            // Dentro de la función executeAction en script.js

            if (action.webhookChecked) {
                let url = action.webhookUrl.trim();
                if (!url) return resolve();

                // Creamos el cuerpo del JSON que enviaremos
                const eventType = url.substring(url.lastIndexOf('/') + 1); // Extrae 'customer', 'shoplifter', etc.
                const payload = {
                    type: eventType,
                    name: eventData.nickname || "Usuario" // Usamos el nombre del donador
                };

                const quantity = parseInt(action.webhookQuantity) || 1;
                const interval = parseInt(action.webhookInterval) || 100;
                
                let count = 0;
                const intervalId = setInterval(() => {
                    if (count < quantity) {
                        // ¡AQUÍ ESTÁ EL CAMBIO! Enviamos una petición POST con el JSON
                        fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }).catch(error => console.error('Error de WebHook:', error));
                        count++;
                    } else {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, interval);
                return;
            }
            
            // Si es una acción simple sin nada especial
            setTimeout(resolve, (action.duration || 1) * 1000);
        });
    }

    async function processQueue() { 
        if (isProcessingQueue || actionQueue.length === 0) return;
        isProcessingQueue = true; 
        const task = actionQueue.shift(); 
        showToastNotification(`▶️ Ejecutando: ${task.action.name}`); 
        await executeAction(task.action, task.eventData); 
        isProcessingQueue = false; 
        processQueue(); 
    }
    
    function processTikTokEvent(triggerType, eventData) { 
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile || !currentProfile.events) return;

        currentProfile.events.forEach(eventRule => {

            if (!eventRule.enabled) return; // Si el evento está desactivado, lo saltamos.
            
            let match = false;

            // Condición para likes (AHORA CON LÓGICA POR USUARIO)
            if (eventRule.why === 'likes' && triggerType === 'likes') {
                const userId = eventData.userId; // Necesitamos el ID del usuario que dio like
                
                // Si el usuario no está en nuestro contador, lo inicializamos.
                if (!userLikeCounters[userId]) {
                    userLikeCounters[userId] = 0;
                }
                
                // Sumamos los likes de este usuario específico.
                userLikeCounters[userId] += eventData.likeCount || 1;
                
                // Comprobamos si ESTE usuario ha alcanzado el umbral.
                if (userLikeCounters[userId] >= eventRule.likesAmount) {
                    match = true;
                    // Reseteamos el contador para ESE usuario restando el umbral.
                    userLikeCounters[userId] -= eventRule.likesAmount; 
                    console.log(`[MOTOR] Umbral de ${eventRule.likesAmount} likes alcanzado por ${eventData.nickname}. Sobrante: ${userLikeCounters[userId]}`);
                }
            }
            // Condición para otros eventos (lógica que ya tenías)
            else if (eventRule.why === triggerType) {
                if (triggerType === 'gift-specific') {
                    if (eventRule.giftId === eventData.giftId) match = true;
                } else {
                    match = true;
                }
            }

            // Si hay coincidencia, ejecuta las acciones (esta parte no cambia)
            if (match) {
                console.log(`[MOTOR] Coincidencia para evento "${eventRule.why}"`);
                eventRule.actionsAll?.forEach(actionInfo => { 
                    const fullAction = currentProfile.actions.find(a => a.id === actionInfo.id); 
                    if(fullAction) actionQueue.push({ action: fullAction, eventData }); 
                });
                
                if (eventRule.actionsRandom?.length > 0) {
                    const randomIndex = Math.floor(Math.random() * eventRule.actionsRandom.length);
                    const randomActionInfo = eventRule.actionsRandom[randomIndex];
                    const fullAction = currentProfile.actions.find(a => a.id === randomActionInfo.id);
                    if (fullAction) actionQueue.push({ action: fullAction, eventData });
                }
                
                if ((eventRule.actionsAll?.length > 0) || (eventRule.actionsRandom?.length > 0)) {
                    processQueue();
                }
            }
        });
    }

    // --- INICIO DEL CAMBIO ---
    // FUNCIÓN MODIFICADA PARA USAR UNA TRANSACCIÓN ATÓMICA
    function updateAuction(giftData) {
        // 1. Validaciones iniciales (igual que antes)
        if (typeof firebase === 'undefined' || !isAuctionRunning) return;

        const newCoins = (giftData.diamondCount || 0);
        const userId = giftData.userId;

        if (newCoins <= 0 || !userId) return;

        // 2. Referencia al participante (igual que antes)
        const participantRef = firebase.database().ref(`widgets/subasta/participants/${userId}`);

        // 3. Ejecutar la transacción
        participantRef.transaction((currentData) => {
            if (currentData === null) {
                // Si el participante NO existe, lo creamos desde cero con todos sus datos.
                return {
                    userId: userId,
                    nickname: giftData.nickname,
                    uniqueId: giftData.uniqueId,
                    profilePictureUrl: giftData.profilePictureUrl,
                    coins: newCoins
                };
            } else {
                // Si el participante YA existe, actualizamos sus datos y sumamos las monedas.
                currentData.nickname = giftData.nickname; // Actualizamos siempre por si cambia de nombre
                currentData.uniqueId = giftData.uniqueId;
                currentData.profilePictureUrl = giftData.profilePictureUrl;
                currentData.coins = (currentData.coins || 0) + newCoins; // Suma segura
                return currentData; // Devolvemos el objeto modificado para que Firebase lo guarde
            }
        }, (error, committed, snapshot) => {
            // 4. (Opcional pero recomendado) Manejar el resultado de la transacción
            if (error) {
                console.error('Error en la transacción de la subasta:', error);
            } else if (committed) {
                // La transacción fue exitosa
                console.log(`[Subasta] Participante ${snapshot.val().nickname} actualizado. Monedas totales: ${snapshot.val().coins}`);
            } else {
                // La transacción fue abortada (no es un error, pero no se guardaron datos)
                console.log('[Subasta] La transacción de monedas fue abortada.');
            }
        });
    }
    // --- FIN DEL CAMBIO ---

    if (typeof firebase !== 'undefined') {
        const auctionStatusRef = firebase.database().ref('widgets/subasta/isRunning');
        auctionStatusRef.on('value', (snapshot) => {
            isAuctionRunning = snapshot.val() === true;
            console.log(`[Subasta] El estado ahora es: ${isAuctionRunning ? 'ACTIVA' : 'INACTIVA'}`);
        });
    }

// ==========================================================
// SECCIÓN 5: LÓGICA PARA SIMULAR KEYSTROKES (NUEVO)
// ==========================================================
    const keystrokeCheckbox = document.getElementById('action-simulate-keystrokes');
    const keystrokeConfig = document.getElementById('keystroke-config');
    const openKeystrokeEditorLink = document.getElementById('open-keystroke-editor-link');
    const keystrokeEditorModal = document.getElementById('keystroke-editor-modal');
    const closeKeystrokeEditorBtn = keystrokeEditorModal.querySelector('.modal-close-button');
    const discardKeystrokeBtn = document.getElementById('discard-keystroke-btn');
    const applyKeystrokeBtn = document.getElementById('apply-keystroke-btn');
    const testKeystrokeBtn = document.getElementById('test-keystroke-btn');
    const virtualKeyboard = document.getElementById('virtual-keyboard');
    const sequenceList = document.getElementById('keystroke-sequence-list');
    let currentKeystrokeSequence = []; // Almacena la secuencia actual [ {key, modifier, type, delay, duration}, ... ]

    // --- Lógica de la Interfaz ---
    keystrokeCheckbox.addEventListener('change', (e) => {
        keystrokeConfig.classList.toggle('open', e.target.checked);
        // Lógica para desmarcar otras acciones exclusivas
        if (e.target.checked) {
            document.getElementById('action-webhook').checked = false;
            document.getElementById('webhook-config').classList.remove('open');
            document.getElementById('action-extra').checked = false;
            document.getElementById('extra-actions-config').classList.remove('open');
        }
    });

    const closeKeystrokeEditor = () => keystrokeEditorModal.classList.remove('open');
    openKeystrokeEditorLink.addEventListener('click', (e) => { 
        e.preventDefault(); 
        keystrokeEditorModal.classList.add('open'); 
        // Asegurar que el teclado virtual se haya renderizado si es necesario (aunque ya se hace al final)
        if (virtualKeyboard.children.length === 0) {
            renderVirtualKeyboard();
        }
    });
    closeKeystrokeEditorBtn.addEventListener('click', closeKeystrokeEditor);
    discardKeystrokeBtn.addEventListener('click', closeKeystrokeEditor);

    applyKeystrokeBtn.addEventListener('click', () => {
        // Aquí actualizamos el resumen en el modal principal
        updateKeystrokeSummary();
        closeKeystrokeEditor();
    });
    
    // --- Lógica de Pruebas ---
    testKeystrokeBtn.addEventListener('click', () => {
        if (window.electronAPI) {
            const repeat = document.getElementById('keystroke-repeat').value;
            const interval = document.getElementById('keystroke-interval').value;
            const gameCompatibility = document.getElementById('game-compat-check').checked; 
            
            const testAction = {
                sequence: currentKeystrokeSequence,
                repeat: parseInt(repeat),
                interval: parseInt(interval),
                addToQueue: false,
                gameCompatibility: gameCompatibility
            };
            window.electronAPI.simulateKeystrokes(testAction);
            showToastNotification('Testing Keystroke sequence...');
        } else {
            showToastNotification('⚠️ La función de testeo solo está disponible en la aplicación Electron.');
        }
    });

    // --- Generar Teclado Virtual ---
    // REEMPLAZA LA FUNCIÓN ANTERIOR POR ESTA
    function renderVirtualKeyboard() {
        // Definimos el layout completo del teclado, usando objetos para teclas especiales
        const keyLayout = [
            ['esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'],
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', { key: 'backspace', text: 'Backspace' }],
            [{ key: 'tab', text: 'Tab' }, 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            [{ key: 'capslock', text: 'Mayus' }, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", { key: 'enter', text: 'Enter' }],
            [{ key: 'shift', text: 'Shift' }, 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', { key: 'shift', text: 'Shift' }],
            [{ key: 'control', text: 'Ctrl' }, { key: 'command', text: '⊞' }, { key: 'alt', text: 'Alt' }, { key: 'space', text: 'SPACE' }, { key: 'alt', text: 'Alt' }, { key: 'control', text: 'Ctrl' }]
        ];

        const sideKeysLayout = [
            ['insert', 'home', 'pageup'],
            ['delete', 'end', 'pagedown'],
            ['up'],
            ['left', 'down', 'right']
        ];

        const numpadLayout = [
            ['num_7', 'num_8', 'num_9'],
            ['num_4', 'num_5', 'num_6'],
            ['num_1', 'num_2', 'num_3'],
            [{ key: 'num_0', span: 2 }, 'num_decimal']
        ];

        // Contenedor principal para el layout flexible
        virtualKeyboard.innerHTML = '<div class="keyboard-main"></div><div class="keyboard-side"></div>';
        const mainKeyboardContainer = virtualKeyboard.querySelector('.keyboard-main');
        const sideKeyboardContainer = virtualKeyboard.querySelector('.keyboard-side');

        // Renderizar teclado principal
        keyLayout.forEach(row => {
            row.forEach(keyConfig => {
                const keyElement = document.createElement('button');
                let key, text, className;

                if (typeof keyConfig === 'object') {
                    key = keyConfig.key;
                    text = keyConfig.text || key.toUpperCase();
                    className = `key-${key}`;
                } else {
                    key = keyConfig;
                    text = key.toUpperCase();
                }

                keyElement.textContent = text;
                keyElement.dataset.key = key;
                if (className) keyElement.classList.add(className);
                keyElement.addEventListener('click', () => addKeyToSequence(key));
                mainKeyboardContainer.appendChild(keyElement);
            });
        });
        
        // Renderizar teclado lateral (flechas, etc.)
        const sideGrid = document.createElement('div');
        sideGrid.className = 'side-grid';
        sideKeyboardContainer.appendChild(sideGrid);

        sideKeysLayout.forEach(row => {
            row.forEach(key => {
                const keyElement = document.createElement('button');
                const iconMap = { 'up': '↑', 'down': '↓', 'left': '←', 'right': '→' };
                keyElement.textContent = iconMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                keyElement.dataset.key = key;
                if (iconMap[key]) keyElement.classList.add(`key-arrow-${key}`);
                keyElement.addEventListener('click', () => addKeyToSequence(key));
                sideGrid.appendChild(keyElement);
            });
        });

        // Renderizar Numpad
        const numpadGrid = document.createElement('div');
        numpadGrid.className = 'numpad-grid';
        sideKeyboardContainer.appendChild(numpadGrid);

        numpadLayout.forEach(row => {
            row.forEach(keyConfig => {
                const keyElement = document.createElement('button');
                let key, text;

                if (typeof keyConfig === 'object') {
                    key = keyConfig.key;
                    text = key.replace('num_', '');
                    if (keyConfig.span) keyElement.style.gridColumn = `span ${keyConfig.span}`;
                } else {
                    key = keyConfig;
                    text = key.replace('num_', '');
                }
                if (text === 'decimal') text = '.';

                keyElement.textContent = text;
                keyElement.dataset.key = key;
                keyElement.addEventListener('click', () => addKeyToSequence(key));
                numpadGrid.appendChild(keyElement);
            });
        });
    }

    function addKeyToSequence(key, type = 'tap') {
        if (key === 'text_input') {
            const text = prompt("Introduce el texto a escribir:");
            if (text) {
                 currentKeystrokeSequence.push({ key: text, modifier: 'none', type: 'text', delay: 0, duration: 0 });
                 renderSequence();
            }
            return;
        }

        let duration = 100;
        if (type === 'mouse' || type === 'text' || type === 'modifier') duration = 0;

        currentKeystrokeSequence.push({ 
            key: key, 
            modifier: 'none', 
            type: type === 'modifier' ? 'tap' : type, // Los modificadores se tratan como un 'tap'
            delay: 0, 
            duration: duration 
        });
        renderSequence();
    }
    
    function renderSequence() {
        sequenceList.innerHTML = '';
        currentKeystrokeSequence.forEach((item, index) => {
            const seqItem = document.createElement('div');
            seqItem.className = 'keystroke-sequence-item';
            
            // Determinar si mostrar el tipo y duración
            const isText = item.type === 'text';
            const isMouse = item.type === 'mouse';
            const isTap = item.type === 'tap';

            let typeOptions = `
                <select class="type-select" ${!isTap ? 'disabled' : ''}>
                    <option value="tap" ${item.type === 'tap' ? 'selected' : ''}>Tap</option>
                    <option value="hold" ${item.type === 'hold' ? 'selected' : ''}>Hold</option>
                </select>
            `;
            if (isText) typeOptions = `<span>Texto</span>`;
            else if (isMouse) typeOptions = `<span>${item.key.replace('_', ' ')}</span>`;
            
            seqItem.innerHTML = `
                <span>${index + 1}</span>
                <input type="text" class="key-input" value="${item.key}" ${isMouse || isText ? 'disabled' : ''}>
                <select class="modifier-select" ${!isTap ? 'disabled' : ''}>
                    <option value="none" ${item.modifier === 'none' ? 'selected' : ''}>None</option>
                    <option value="shift" ${item.modifier === 'shift' ? 'selected' : ''}>Shift</option>
                    <option value="ctrl" ${item.modifier === 'ctrl' ? 'selected' : ''}>Ctrl</option>
                    <option value="alt" ${item.modifier === 'alt' ? 'selected' : ''}>Alt</option>
                </select>
                ${typeOptions}
                <input type="number" class="delay-input" value="${item.delay}" min="0">
                <input type="number" class="duration-input" value="${item.duration}" min="0" ${!isTap && item.type !== 'hold' ? 'disabled' : ''}>
                <div class="seq-buttons">
                    <button class="play-seq-item">▶️</button>
                    <button class="delete-seq-item">❌</button>
                </div>
            `;
            sequenceList.appendChild(seqItem);

            // Añadir listeners para actualizar el array 'currentKeystrokeSequence'
            seqItem.querySelector('.key-input')?.addEventListener('change', (e) => currentKeystrokeSequence[index].key = e.target.value);
            seqItem.querySelector('.modifier-select')?.addEventListener('change', (e) => currentKeystrokeSequence[index].modifier = e.target.value);
            
            // Solo añadir listeners si no es acción de texto o ratón.
            seqItem.querySelector('.type-select')?.addEventListener('change', (e) => {
                const newType = e.target.value;
                currentKeystrokeSequence[index].type = newType;
                // Si cambia a hold, forzar duración a 0 y deshabilitar
                if (newType === 'hold') {
                    const durationInput = seqItem.querySelector('.duration-input');
                    durationInput.value = 0;
                    durationInput.disabled = true;
                    currentKeystrokeSequence[index].duration = 0;
                } else {
                    seqItem.querySelector('.duration-input').disabled = false;
                }
            });
            
            seqItem.querySelector('.delay-input').addEventListener('change', (e) => currentKeystrokeSequence[index].delay = parseInt(e.target.value));
            seqItem.querySelector('.duration-input').addEventListener('change', (e) => currentKeystrokeSequence[index].duration = parseInt(e.target.value));
            seqItem.querySelector('.delete-seq-item').addEventListener('click', () => {
                currentKeystrokeSequence.splice(index, 1);
                renderSequence();
            });
            seqItem.querySelector('.play-seq-item').addEventListener('click', () => {
                if (window.electronAPI) window.electronAPI.simulateKeystroke(currentKeystrokeSequence[index]);
            });
        });
    }

    function updateKeystrokeSummary() {
        const summaryBox = document.getElementById('keystroke-summary');
        summaryBox.textContent = currentKeystrokeSequence.map(item => {
            if (item.type === 'text') return `TEXT: "${item.key.substring(0, 10)}..."`;
            
            let text = item.key;
            if (item.modifier !== 'none') text = `${item.modifier}+${text}`;
            if (item.type === 'hold') text += '(HOLD)';
            return text;
        }).join(', ');
    }
    
    // Ejecutar una vez para inicializar el teclado
    renderVirtualKeyboard();


    // ==========================================================
    // INICIALIZACIÓN FINAL
    // ==========================================================
    await loadAllData();
    initializeProfiles();
});
// REEMPLAZA TU FUNCIÓN openSection ACTUAL CON ESTA
window.openSection = function(sectionId) {
    console.log(`--- PASO 2: La función openSection se ha ejecutado con el ID: "${sectionId}" ---`);

    // 1. Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });

    // 2. Mostrar la que queremos
    const targetSection = document.getElementById(sectionId);
    
    // Log para ver si encontró el elemento
    console.log('--- PASO 3: Buscando el elemento en el HTML...', targetSection);

    if (targetSection) {
        targetSection.classList.add('active');
        console.log('--- PASO 4: ¡ÉXITO! La sección se ha activado.');
    } else {
        console.error('--- ¡ERROR CRÍTICO! No se encontró ninguna sección con el ID:', sectionId);
    }
};
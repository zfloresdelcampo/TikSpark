// --- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', async function() {

    // --- NUEVO: CARGA INSTANTÁNEA DE FOTO (CACHÉ LOCAL) ---
    const cachedPic = localStorage.getItem('cachedProfilePic');
    const cachedName = localStorage.getItem('cachedUsername');
    
    if (cachedPic) {
        const img = document.getElementById('sidebar-profile-img');
        const icon = document.getElementById('sidebar-default-icon');
        if (img && icon) {
            img.src = cachedPic;
            img.style.display = 'block';
            icon.style.display = 'none';
        }
    }
    if (cachedName) {
        const nameDisplay = document.getElementById('sidebar-username-display');
        if (nameDisplay) nameDisplay.textContent = cachedName;
    }
    // -----------------------------------------------------

    // --- SISTEMA DE DIÁLOGOS PERSONALIZADOS ---
    const customDialog = document.getElementById('custom-dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const btnDialogOk = document.getElementById('btn-dialog-ok');
    const btnDialogCancel = document.getElementById('btn-dialog-cancel');

    // Reemplazo bonito para alert()
    window.showCustomAlert = (message, title = 'TikSpark') => {
        return new Promise((resolve) => {
            dialogTitle.textContent = title;
            dialogMessage.textContent = message;
            btnDialogCancel.style.display = 'none'; // Ocultar cancelar
            btnDialogOk.onclick = () => {
                customDialog.classList.remove('open');
                resolve(true);
            };
            customDialog.classList.add('open');
        });
    };

    // Reemplazo bonito para confirm()
    window.showCustomConfirm = (message, title = 'Confirmar') => {
        return new Promise((resolve) => {
            dialogTitle.textContent = title;
            dialogMessage.textContent = message;
            btnDialogCancel.style.display = 'inline-flex'; // Mostrar cancelar
            
            btnDialogOk.onclick = () => {
                customDialog.classList.remove('open');
                resolve(true); // El usuario dijo SÍ
            };
            
            btnDialogCancel.onclick = () => {
                customDialog.classList.remove('open');
                resolve(false); // El usuario dijo NO
            };
            
            customDialog.classList.add('open');
        });
    };

    // === NUEVO: Constantes para Alertas ===
    const createAlertButton = document.getElementById('create-alert-button');
    const alertModalOverlay = document.getElementById('create-alert-modal');
    const closeAlertButton = document.getElementById('close-alert-modal-button');
    const discardAlertButton = document.getElementById('discard-alert-button');
    const applyAlertButton = document.getElementById('apply-alert-button');
    const alertsListContainer = document.getElementById('alerts-list-container');

    // Al principio de script.js
    const openAudioListBtn = document.querySelector('#audio-config .file-upload-group .audio-btn:nth-of-type(1)'); // Abrir Lista
    const uploadAudioBtn = document.querySelector('#audio-config .file-upload-group .audio-btn:nth-of-type(2)');   // Subir Archivo
    const openSoundsFolderBtn = document.querySelector('#audio-list-modal .local-audios-header .audio-btn'); // Abrir Carpeta
    const audioListModal = document.getElementById('audio-list-modal');
    const closeAudioListBtn = document.getElementById('close-audio-list-modal');
    const localAudiosGrid = document.getElementById('local-audios-grid');
    let selectedAudioFile = null; // Guardará el nombre del archivo de audio elegido
    const audioPlayer = document.getElementById('audio-player');
    const myInstantsUrlInput = document.getElementById('myinstants-url-input');
    const addMyInstantsBtn = document.getElementById('add-myinstants-btn');

    // Listener para mostrar/ocultar el menú de Minecraft
    document.getElementById('action-minecraft').addEventListener('change', (e) => {
        document.getElementById('minecraft-config').classList.toggle('open', e.target.checked);
    });
    
    // --- LOGICA PARA GESTOR DE MEDIA (IMG/VIDEO) - MODIFICADA PARA ALERTAS ---

    // 1. Referencias (Actualizadas para Alertas)
    const checkAlertShowMedia = document.getElementById('alert-action-show-media'); // Checkbox de Alerta
    const divAlertMediaConfig = document.getElementById('alert-media-config');      // Div contenedor
    const btnAlertOpenMediaList = document.getElementById('alert-open-media-list-btn'); // Botón abrir lista
    const inputAlertTargetMedia = document.getElementById('alert-selected-media-url');  // Input donde va la URL

    // Referencias del Modal Grande (Estas son globales)
    const modalMedia = document.getElementById('media-list-modal');
    const btnCloseMedia = document.getElementById('close-media-list-modal');
    
    const inputMediaUrl = document.getElementById('new-media-url');
    const inputMediaName = document.getElementById('new-media-name');
    const btnAddMedia = document.getElementById('add-new-media-btn');
    const gridMedia = document.getElementById('media-grid');

    // --- PERMITIR TECLA ENTER PARA ENTRAR ---
    const loginInputs = [document.getElementById('login-username'), document.getElementById('login-password')];
    
    loginInputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Evita saltos de línea raros
                    btnAction.click(); // Simula el clic en el botón
                }
            });
        }
    });

    // SISTEMA DE LOGUEO //
    let currentAppUser = null; // Guardará el usuario logueado en la App

   // === SISTEMA DE LOGIN Y REGISTRO ===
    const loginScreen = document.getElementById('login-screen');
    const btnAction = document.getElementById('btn-login-action');
    const inputUser = document.getElementById('login-username');
    const btnLogout = document.getElementById('btn-logout');
    
    // Elementos del toggle Login/Registro
    const linkToRegister = document.getElementById('btn-go-to-register');
    const linkToLogin = document.getElementById('btn-go-to-login');
    const msgLoginMode = document.getElementById('msg-login-mode');
    const msgRegisterMode = document.getElementById('msg-register-mode');
    const loginTitle = document.querySelector('.login-card h2');

    let isRegisterMode = false; // false = Login, true = Registro
    
    // --- ESCUCHA AUTOMÁTICA DE SESIÓN (MODIFICADO) ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("✅ Sesión encontrada:", user.email);
            currentAppUser = user;

            const sidebarName = document.getElementById('sidebar-username-display');
            if (sidebarName && user.email) sidebarName.textContent = user.email.split('@')[0];

            await loadAllDataFromCloud();

            if (loginScreen) loginScreen.classList.remove('active');
        } else {
            console.log("ℹ️ No hay sesión, mostrando formulario.");
            // AQUÍ ESTÁ EL TRUCO: Solo mostramos la caja si CONFIRMAMOS que no hay usuario
            if (loginScreen) {
                loginScreen.classList.add('active');
                document.querySelector('.login-card').style.display = 'block'; // <--- ESTO MUESTRA EL FORMULARIO
            }
        }
    });

    // Función para cambiar entre Login y Registro visualmente
    function toggleLoginMode(toRegister) {
        isRegisterMode = toRegister;
        if (isRegisterMode) {
            loginTitle.textContent = "Crear Cuenta";
            btnAction.innerHTML = '<i class="fas fa-user-plus"></i> Registrarse';
            msgLoginMode.style.display = 'none';
            msgRegisterMode.style.display = 'block';
        } else {
            loginTitle.textContent = "Iniciar Sesión";
            btnAction.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            msgLoginMode.style.display = 'block';
            msgRegisterMode.style.display = 'none';
        }
    }

    if (linkToRegister) linkToRegister.addEventListener('click', () => toggleLoginMode(true));
    if (linkToLogin) linkToLogin.addEventListener('click', () => toggleLoginMode(false));

    // ACCIÓN DEL BOTÓN PRINCIPAL (LOGIN / REGISTRO CON FIREBASE)
    if (btnAction) {
        btnAction.addEventListener('click', async () => {
            // CORRECCIÓN 1: Usar la variable correcta 'inputUser'
            const email = inputUser.value.trim(); 
            const password = document.getElementById('login-password').value;

            if (!email || !password) return alert("Por favor, completa correo y contraseña.");

            try {
                // Mostramos un texto de carga
                btnAction.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
                
                if (isRegisterMode) {
                    // --- CREAR CUENTA EN NUBE ---
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    currentAppUser = userCredential.user;
                    
                    // Crear estructura inicial en base de datos (CORRECCIÓN 3: Estructura completa)
                    await db.ref('users/' + currentAppUser.uid).set({
                        email: email,
                        createdAt: Date.now(),
                        data: { 
                            profiles: {
                                'Perfil Principal': { actions: [], events: [], nextActionId: 1, nextEventId: 1 }
                            },
                            activeProfileName: 'Perfil Principal' 
                        }
                    });
                    await window.showCustomAlert("✅ Cuenta creada. ¡Bienvenido!", "¡Éxito!");
                } else {
                    // --- INICIAR SESIÓN EN NUBE ---
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    currentAppUser = userCredential.user;
                }

                // Cargar datos desde la nube
                // CORRECCIÓN 2: Usar el nombre correcto de la función
                await loadAllDataFromCloud();
                
                // Actualizar nombre en barra lateral
                const sidebarName = document.getElementById('sidebar-username-display');
                if(sidebarName) sidebarName.textContent = email.split('@')[0];
                
                loginScreen.classList.remove('active');

            } catch (error) {
                console.error(error);
                let cleanMsg = "Ocurrió un error desconocido.";

                // 1. Detectar error JSON feo (INVALID_LOGIN_CREDENTIALS)
                if (error.message && error.message.includes("INVALID_LOGIN_CREDENTIALS")) {
                    cleanMsg = "Correo o contraseña incorrectos.";
                } 
                // 2. Detectar errores estándar de Firebase
                else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    cleanMsg = "Correo o contraseña incorrectos.";
                } 
                else if (error.code === 'auth/email-already-in-use') {
                    cleanMsg = "El correo ya está registrado.";
                } 
                else if (error.code === 'auth/invalid-email') {
                    cleanMsg = "El correo no es válido.";
                }
                else if (error.code === 'auth/weak-password') {
                    cleanMsg = "La contraseña es muy débil (mínimo 6 caracteres).";
                }
                else {
                    // Si es otro error, intentamos mostrarlo limpio
                    cleanMsg = error.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "");
                }

                await window.showCustomAlert("❌ " + cleanMsg, "Error");
            }
        });
    }

    // Botón Cerrar Sesión (Igual que antes)
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await saveAllData(); // Guardar último estado
            await auth.signOut(); // Cerrar sesión en Firebase
            currentAppUser = null;
            profiles = {};
            activeProfileName = '';
            inputUser.value = '';
            document.getElementById('login-password').value = '';
            
            // Al salir, volvemos al modo Login por defecto
            toggleLoginMode(false); 
            loginScreen.classList.add('active');
        });
    }

    // === Lógica del Ojito (Ver/Ocultar Contraseña) ===
    const togglePassword = document.querySelector('.password-toggle');
    const passwordInput = document.getElementById('login-password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Cambiar tipo de input: password <-> text
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Cambiar icono: ojo abierto <-> ojo tachado
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Busca esta línea y cámbiala por esta:
    let topGiftState = { 
        username: 'Username', 
        coins: 0, 
        giftName: 'Default', 
        // Puedes cambiar esta URL por la de un regalo caro que te guste
        giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8173e9b07875cca37caa5219e4903a40.png~tplv-obj.webp' 
    };

    //MEJOR RACHA
    let topStreakState = { 
        username: 'Username', 
        streakCount: 0, 
        giftName: 'Default', 
        giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp' 
    };

    // Simulación de Base de Datos de Medios
    let mediaLibrary = [];

    // 2. Mostrar/Ocultar config al dar check (Alertas)
    if(checkAlertShowMedia) {
        checkAlertShowMedia.addEventListener('change', (e) => {
            if(divAlertMediaConfig) {
                divAlertMediaConfig.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }

    // 3. Abrir Modal desde Alerta
    if(btnAlertOpenMediaList) {
        btnAlertOpenMediaList.addEventListener('click', () => {
            modalMedia.style.display = 'flex';
            renderMediaGrid();
        });
    }

    // Cerrar Modal
    if(btnCloseMedia) {
        btnCloseMedia.addEventListener('click', () => modalMedia.style.display = 'none');
    }

    // 4. Agregar Nuevo Archivo a la Biblioteca
    if(btnAddMedia) {
        btnAddMedia.addEventListener('click', () => {
            const url = inputMediaUrl.value.trim();
            const name = inputMediaName.value.trim() || 'Sin nombre';

            if(!url) return alert('Ingresa una URL válida');

            // Detectar tipo simple por extensión
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
            
            mediaLibrary.push({
                name: name,
                url: url,
                type: isVideo ? 'video' : 'image'
            });

            inputMediaUrl.value = '';
            inputMediaName.value = '';
            renderMediaGrid();

            saveAllData(); // <--- ¡AGREGA ESTA LÍNEA AQUÍ
        });
    }

    // 5. Renderizar la Cuadrícula de Medios
    function renderMediaGrid() {
        if(!gridMedia) return;
        gridMedia.innerHTML = ''; // Limpiar

        mediaLibrary.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'media-card';

            // Crear Preview (Video o Imagen)
            let previewHTML = '';
            if(item.type === 'video') {
                previewHTML = `<video src="${item.url}" muted></video>`; 
            } else {
                previewHTML = `<img src="${item.url}">`;
            }

            card.innerHTML = `
                <button class="btn-delete-media" onclick="deleteMedia(${index})"><i class="fas fa-times"></i></button>
                <div class="media-preview-container">
                    ${previewHTML}
                    <div class="media-title-overlay">${item.name}</div>
                </div>
                <div class="media-controls-row">
                    <button class="btn-media-action play" onclick="previewMedia('${item.url}')"><i class="fas fa-play"></i></button>
                    <button class="btn-media-action select" onclick="selectMedia('${item.url}')"><i class="fas fa-check"></i></button>
                </div>
            `;
            gridMedia.appendChild(card);
        });
    }

    // 6. Funciones Globales (para que el onclick del HTML las encuentre)
    window.deleteMedia = (index) => {
        if(confirm('¿Borrar este archivo?')) {
            mediaLibrary.splice(index, 1);
            renderMediaGrid();

            saveAllData(); // <--- ¡AGREGA ESTA LÍNEA AQUÍ!
        }
    };

    window.previewMedia = (url) => {
        window.open(url, '_blank');
    };

    // CAMBIO CLAVE: Seleccionar para Alerta
    window.selectMedia = (url) => {
        // Pone la URL en el input DE ALERTA
        if(inputAlertTargetMedia) inputAlertTargetMedia.value = url;
        modalMedia.style.display = 'none';
    };

    // === AGREGA ESTA LÍNEA AQUÍ ===
    let audioSelectionContext = 'action'; // Valores: 'action' o 'alert'

    // === FUNCIÓN RENDER ALERTS (CORREGIDA: ESPACIADO EN PRECIOS) ===
    function renderAlerts() {
        const alerts = globalAlerts || [];
        const container = alertsListContainer.parentElement;
        const alertHeader = container.querySelector('.list-view-header.alert-header');
        
        alertsListContainer.innerHTML = '';

        // 1. Mensaje de vacío (Con tu estilo centrado)
        if (alerts.length === 0) {
            alertsListContainer.innerHTML = '<div class="no-items-message" style="text-align: center; width: 100%; padding: 20px; color: #999;">Sin alertas</div>';
            container.classList.add('empty');
            if (alertHeader) alertHeader.style.display = 'none';
            renderPaginationControls(container, 0, 0, handleAlertPageChange);
            return;
        }
        
        if (alertHeader) alertHeader.style.display = 'grid';
        container.classList.remove('empty');

        // 2. LÓGICA DE PAGINACIÓN (Corte de array)
        const startIndex = (currentPageAlerts - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedAlerts = alerts.slice(startIndex, endIndex);

        // 3. Renderizado de filas
        paginatedAlerts.forEach(alert => {
            // -- Lógica de texto QUIÉN --
            let whoText = whoLabels[alert.who] || alert.who;
            if (alert.who === 'specific' && alert.specificUsers) whoText = alert.specificUsers.join(', ');

            // -- Lógica de texto POR QUÉ (Iconos y Regalos) --
            let whyHTML = '';
            
            if (alert.why === 'gift-specific' && alert.giftId) {
                let imgUrl = alert.giftImage; 
                let giftPrice = '';
                
                if (typeof availableGiftsCache !== 'undefined') {
                    const found = availableGiftsCache.find(g => g.id == alert.giftId);
                    if(found) {
                        if(!imgUrl && found.image) imgUrl = found.image.url_list[0];
                        giftPrice = `<span style="color: #ffeb3b; font-size: 0.9em; margin-left: 5px;">- ${found.diamond_count} coins</span>`;
                    }
                }
                
                const imgTag = imgUrl ? `<img src="${imgUrl}" style="width:24px; height:24px; vertical-align:middle; margin-right:6px;">` : '<i class="fas fa-gift fa-lg"></i> ';
                whyHTML = `${imgTag}${alert.giftName || `ID: ${alert.giftId}`}${giftPrice}`;
            } 
            else if (alert.why === 'gift-min') {
                whyHTML = `<i class="fas fa-gift fa-lg" style="color: #ff4d4d; margin-right: 6px;"></i> Gift (${alert.minCoins || 1}+)`;
            }
            else if (alert.why === 'emote') {
                const imgTag = alert.emoteImage ? `<img src="${alert.emoteImage}" style="width:24px; height:24px; vertical-align:middle; margin-right:6px;">` : '<i class="fas fa-smile fa-lg"></i> ';
                whyHTML = `${imgTag} Fan Club Emote`;
            }
            else {
                const icon = eventIcons[alert.why] || ''; 
                whyHTML = `<span style="font-size: 1.2em; margin-right: 5px; color: #8a2be2;">${icon}</span> ${whyLabels[alert.why] || alert.why}`;
            }

            // -- Descripción (Audio/Video) --
            let descriptionParts = [];
            if (alert.audioAction) descriptionParts.push(`🔊 Audio: ${alert.audioAction.file}`);
            if (alert.mediaAction) descriptionParts.push(`🎬 Video: ${alert.mediaAction.name || 'Archivo'}`);
            let description = descriptionParts.join(' + ');

            // -- Crear Elemento HTML --
            const alertDiv = document.createElement('div');
            alertDiv.className = 'list-view-row alert-row';
            alertDiv.style.gridTemplateColumns = "110px 60px 1.5fr 1.5fr 130px 2fr"; 
            alertDiv.style.fontSize = "14px";
            alertDiv.style.alignItems = "center";

            alertDiv.innerHTML = `
                <div class="row-icons" style="justify-content: center;">
                    <span class="action-icon-bg play" onclick="playAlert(${alert.id})"><i class="fas fa-play"></i></span>
                    <span class="action-icon-bg edit" onclick="editAlert(${alert.id})"><i class="fas fa-pencil-alt"></i></span>
                    <span class="action-icon-bg delete" onclick="deleteAlert(${alert.id})"><i class="fas fa-trash-alt"></i></span>
                </div>
                <div class="icon-center">
                    <input type="checkbox" ${alert.enabled ? 'checked' : ''} onchange="toggleAlertStatus(${alert.id})">
                </div>
                <div style="color: #e0e0e0;">
                    ${alert.name}
                </div>
                <div style="color: #e0e0e0; display: flex; align-items: center; gap: 5px; overflow: hidden;">
                    <span style="white-space: nowrap;">${whoText}</span> 
                    <span style="color: #e0e0e0;">-</span> 
                    <span style="white-space: nowrap; display: flex; align-items: center;">${whyHTML}</span>
                </div>
                <div style="text-align: center;">${alert.duration}</div>
                <div style="color: #e0e0e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${description}
                </div>
            `;
            alertsListContainer.appendChild(alertDiv);
        });

        // 4. Renderizar controles de página al final
        renderPaginationControls(container, currentPageAlerts, alerts.length, handleAlertPageChange);
    }

    async function renderLocalAudios() {
        if (!window.electronAPI) return;
        
        const audioFiles = await window.electronAPI.getLocalAudios();
        localAudiosGrid.innerHTML = '';

        if (audioFiles.length === 0) {
            localAudiosGrid.innerHTML = '<p style="color: #888;">No hay audios locales. Sube tu primer archivo.</p>';
            return;
        }

        audioFiles.forEach(fileName => {
            const card = document.createElement('div');
            card.className = 'audio-item-card';
            card.innerHTML = `
                <span class="audio-item-name" title="${fileName}">${fileName}</span>
                <span class="audio-item-duration">...</span>
                <div class="audio-item-controls">
                    <button class="audio-control-btn play" data-filename="${fileName}"><i class="fas fa-play"></i></button>
                    <button class="audio-control-btn select" data-filename="${fileName}"><i class="fas fa-check"></i></button>
                    <button class="audio-control-btn delete" data-filename="${fileName}"><i class="fas fa-times"></i></button>
                </div>
            `;
            localAudiosGrid.appendChild(card);
        });
    }

    function selectAudio(fileName) {
        selectedAudioFile = fileName; // Guardamos el nombre globalmente
        
        // Creamos el elemento visual
        const audioFileNameDisplay = document.createElement('div');
        audioFileNameDisplay.className = 'selected-audio-file';
        audioFileNameDisplay.innerHTML = `
            <span>${fileName}</span>
            <button class="remove-selected-audio">&times;</button>
        `;

        // === CAMBIO CLAVE: Decidimos dónde mostrarlo ===
        let targetContainer;
        if (audioSelectionContext === 'alert') {
            targetContainer = document.getElementById('alert-audio-config');
        } else {
            targetContainer = document.getElementById('audio-config'); // Por defecto Acciones
        }

        // Si el contenedor existe, limpiamos el anterior y ponemos el nuevo
        if (targetContainer) {
            const existingDisplay = targetContainer.querySelector('.selected-audio-file');
            if (existingDisplay) existingDisplay.remove();
            targetContainer.appendChild(audioFileNameDisplay);
            
            // Listener para borrar selección
            audioFileNameDisplay.querySelector('.remove-selected-audio').addEventListener('click', () => {
                selectedAudioFile = null;
                audioFileNameDisplay.remove();
            });
        }
    }

    // === NUEVO: Lógica de Audio para ALERTAS ===
    const alertPlayAudioCb = document.getElementById('alert-action-play-audio');
    const alertAudioConfig = document.getElementById('alert-audio-config');
    const alertOpenListBtn = document.getElementById('alert-open-audio-list-btn');
    const alertUploadBtn = document.getElementById('alert-upload-audio-btn');
    const alertVolumeSlider = document.getElementById('alert-audio-volume');
    const alertVolumeLabel = document.getElementById('alert-volume-label');

    // 1. Mostrar menú al marcar checkbox (Alertas)
    if (alertPlayAudioCb) {
        alertPlayAudioCb.addEventListener('change', (e) => {
            alertAudioConfig.classList.toggle('open', e.target.checked);
        });
    }

    // 2. Abrir Lista (Contexto Alertas)
    if (alertOpenListBtn) {
        alertOpenListBtn.addEventListener('click', () => {
            audioSelectionContext = 'alert'; // <--- ¡Importante!
            renderLocalAudios();
            audioListModal.classList.add('open');
        });
    }

    // 3. Subir Archivo (Contexto Alertas)
    if (alertUploadBtn) {
        alertUploadBtn.addEventListener('click', async () => {
            if (window.electronAPI) {
                audioSelectionContext = 'alert'; // <--- ¡Importante!
                const result = await window.electronAPI.selectAudioFile();
                if (result.success && result.fileName) {
                    selectAudio(result.fileName);
                }
            }
        });
    }

    // 4. Slider Volumen (Alertas)
    if (alertVolumeSlider) {
        alertVolumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            if(alertVolumeLabel) alertVolumeLabel.textContent = `Volumen: ${value}`;
            e.target.style.background = `linear-gradient(to right, #5c1d80 ${value}%, #555 ${value}%)`;
        });
    }

    // === ACTUALIZACIÓN: Botones originales de ACCIONES ===
    // (Aseguramos que devuelvan el contexto a 'action' si los tocas)
    if (openAudioListBtn) {
        openAudioListBtn.addEventListener('click', () => {
            audioSelectionContext = 'action'; // Resetear a acción
            renderLocalAudios(); // Tu función existente
            audioListModal.classList.add('open');
        });
    }
    
    if (uploadAudioBtn) {
        uploadAudioBtn.addEventListener('click', async () => {
            if (window.electronAPI) {
                audioSelectionContext = 'action'; // Resetear a acción
                // ... tu lógica existente de subida o llamada a API ...
                 const result = await window.electronAPI.selectAudioFile();
                if (result.success && result.fileName) {
                    selectAudio(result.fileName);
                }
            }
        });
    }

    // --- LÓGICA VISUAL: MOSTRAR/OCULTAR CAMPOS EN ALERTAS (CORREGIDO) ---
    
    // 1. Detectar cambio en "QUIÉN"
    document.querySelectorAll('input[name="alert_who"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const container = document.getElementById('alert-specific-user-input-container');
            if (container) container.style.display = (e.target.value === 'specific') ? 'grid' : 'none';
        });
    });

    // 2. Detectar cambio en "POR QUÉ" (VERSIÓN EXACTA)
    document.querySelectorAll('input[name="alert_why"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            // Referencia al modal padre
            const modal = document.querySelector('#create-alert-modal'); 
            
            // 1. CERRAR MENÚS A LA FUERZA (Usando búsqueda local)
            // Esto mata cualquier menú abierto dentro de ESTA ventana
            const menus = modal.querySelectorAll('.custom-gift-selector'); 
            menus.forEach(m => m.classList.remove('open'));

            // 2. Ocultar todos los paneles
            const idsToHide = [
                '#alert-gift-specific-selector', 
                '#alert-likes-amount-selector', 
                '#alert-emote-selector-container',
                '#alert-min-coins-input-container'
            ];
            idsToHide.forEach(sel => {
                const el = modal.querySelector(sel);
                if(el) el.style.display = 'none';
            });

            // 3. Mostrar el seleccionado
            const showMap = {
                'gift-specific': '#alert-gift-specific-selector',
                'likes': '#alert-likes-amount-selector',
                'emote': '#alert-emote-selector-container',
                'gift-min': '#alert-min-coins-input-container'
            };
            if (showMap[val]) {
                const target = modal.querySelector(showMap[val]);
                if (target) target.style.display = 'grid';
            }
        });
    });

    // === Lógica para el Buscador de Regalos dentro de ALERTAS ===
    const alertGiftSelectorDisplay = document.getElementById('alert-gift-selector-display');
    const alertGiftSelector = document.getElementById('alert-custom-gift-selector');
    const alertGiftSearchInput = document.getElementById('alert-gift-search-input');
    const alertGiftOptionsList = document.getElementById('alert-gift-options-list');
    
    // ==========================================================
    // LÓGICA PARA EL SELECTOR DE EMOTES (CORREGIDA)
    // ==========================================================
    const alertEmoteSelectorDisplay = document.getElementById('alert-emote-selector-display');
    const alertEmoteOptionsList = document.getElementById('alert-emote-options-list');
    
    // 1. Renderizar lista de Emotes (VERSIÓN EXACTA)
    function renderAlertEmoteOptions(emotes) {
        if (!alertEmoteOptionsList) return;
        alertEmoteOptionsList.innerHTML = '';

        if (!emotes || emotes.length === 0) {
            alertEmoteOptionsList.innerHTML = '<div class="no-items-message" style="padding:10px; color:#ccc;">Lista vacía.<br>Usa el botón "Obtener Emotes" en Inicio.</div>';
            return;
        }
        
        emotes.forEach(emote => {
            if (!emote.image_url) return;
            
            const optionItem = document.createElement('div');
            optionItem.className = 'gift-option-item'; 
            optionItem.innerHTML = `<img src="${emote.image_url}" alt="Emote" style="width: 40px; height: 40px; object-fit: contain;">
                                    <div class="gift-details"><span class="gift-name" style="font-size: 12px; font-weight: bold;">${emote.name || 'Emote'}</span></div>`;
            
            // CLICK HANDLER
            optionItem.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                e.preventDefault();

                // 1. Buscar elementos usando el modal padre para evitar duplicados
                const modal = document.querySelector('#create-alert-modal');
                const display = modal.querySelector('#alert-emote-selector-display');
                const input = modal.querySelector('#alert-selected-emote-id');
                
                // 2. Encontrar el menú padre exacto de este item y cerrarlo
                const menuExacto = e.currentTarget.closest('.custom-gift-selector');

                // Poner datos
                if(display) display.innerHTML = `<img src="${emote.image_url}" alt="Emote"><span>${emote.name || 'Emote'}</span>`;
                if(input) {
                    input.value = emote.id; 
                    input.dataset.imageUrl = emote.image_url;
                }

                // CERRAR EL MENÚ EXACTO QUE SE CLICKEÓ
                if(menuExacto) {
                    console.log("Cerrando menú específico...");
                    menuExacto.classList.remove('open');
                }
            });
            
            alertEmoteOptionsList.appendChild(optionItem);
        });
    }

    // 2. ABRIR / CERRAR menú al pulsar el botón
    if (alertEmoteSelectorDisplay) {
        alertEmoteSelectorDisplay.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita conflictos
            const selector = document.getElementById('alert-custom-emote-selector');
            if(selector) {
                selector.classList.toggle('open'); 
                
                if (selector.classList.contains('open')) {
                    // Cargamos la lista al abrir
                    renderAlertEmoteOptions(availableEmotesCache || []);
                }
            }
        });
    }

    // 3. CERRAR AL HACER CLICK FUERA (Global)
    document.addEventListener('click', (e) => { 
        // Emotes
        const emoteSel = document.getElementById('alert-custom-emote-selector');
        const emoteDisp = document.getElementById('alert-emote-selector-display');
        
        if (emoteSel && emoteSel.classList.contains('open')) {
             // Si el click NO fue en el menú Y NO fue en el botón de abrir
             if (!emoteSel.contains(e.target) && (!emoteDisp || !emoteDisp.contains(e.target))) {
                 emoteSel.classList.remove('open'); 
             }
        }

        // Regalos (Mantenemos la lógica existente)
        const giftSel = document.getElementById('alert-custom-gift-selector');
        const giftDisp = document.getElementById('alert-gift-selector-display');
        if (giftSel && giftSel.classList.contains('open')) { 
             if (!giftSel.contains(e.target) && (!giftDisp || !giftDisp.contains(e.target))) {
                 giftSel.classList.remove('open'); 
             }
        }
    });

    // Función auxiliar para seleccionar regalo en Alertas
    function selectGiftForAlert(gift) {
        alertGiftSelectorDisplay.innerHTML = `<img src="${gift.image.url_list[0]}" alt="${gift.name}"><span>${gift.name}</span>`;
        alertSelectedGiftIdInput.value = gift.id;
        alertGiftSelector.classList.remove('open');
    }

    // Renderizar opciones en el modal de Alertas (VERSIÓN QUE CIERRA AL CLICK)
    function renderAlertGiftOptions(gifts) {
        if (!alertGiftOptionsList) return;
        alertGiftOptionsList.innerHTML = '';
        
        // Ordenar por precio
        gifts.sort((a, b) => a.diamond_count - b.diamond_count);
        
        if (gifts.length === 0) {
            alertGiftOptionsList.innerHTML = '<div class="no-items-message" style="padding:10px;">Lista vacía.</div>';
            return;
        }
        
        gifts.forEach(gift => {
            if (!gift.image || !gift.image.url_list[0]) return;
            
            const optionItem = document.createElement('div');
            optionItem.className = 'gift-option-item';
            optionItem.innerHTML = `<img src="${gift.image.url_list[0]}" alt="${gift.name}"><div class="gift-details"><span class="gift-name">${gift.name}</span><span class="gift-cost">${gift.diamond_count} Coins - ID:${gift.id}</span></div>`;
            
            // --- CLICK HANDLER ROBUSTO (Igual que Emotes) ---
            optionItem.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                
                // 1. Buscamos referencias dentro del modal para evitar errores
                const modal = document.querySelector('#create-alert-modal');
                // Si por alguna razón no encuentra el modal (raro), salimos
                if (!modal) return; 

                const display = modal.querySelector('#alert-gift-selector-display');
                const input = modal.querySelector('#alert-selected-gift-id');

                // 2. Poner los datos visuales (Foto y ID)
                if (display) {
                    display.innerHTML = `<img src="${gift.image.url_list[0]}" alt="${gift.name}"><span>${gift.name}</span>`;
                }
                if (input) {
                    input.value = gift.id;
                }

                // 3. CERRAR EL MENÚ EXACTO DESDE DONDE SE HIZO CLICK
                // Buscamos el contenedor padre (.custom-gift-selector) y le quitamos la clase 'open'
                const menu = e.currentTarget.closest('.custom-gift-selector');
                if (menu) {
                    menu.classList.remove('open');
                }
            });
            
            alertGiftOptionsList.appendChild(optionItem);
        });
    }

    // Abrir/Cerrar menú
    if (alertGiftSelectorDisplay) {
        alertGiftSelectorDisplay.addEventListener('click', async () => {
            alertGiftSelector.classList.toggle('open');
            // Cargar regalos si no están cargados
            if (availableGiftsCache.length === 0 && window.electronAPI) {
                 try {
                    const gifts = await window.electronAPI.getAvailableGifts();
                    availableGiftsCache = gifts || [];
                 } catch(e) { console.error(e); }
            }
            renderAlertGiftOptions(availableGiftsCache);
        });
    }

    // Buscador
    if (alertGiftSearchInput) {
        alertGiftSearchInput.addEventListener('input', () => {
            const term = alertGiftSearchInput.value.toLowerCase();
            const allOptions = alertGiftOptionsList.querySelectorAll('.gift-option-item');
            allOptions.forEach(option => {
                const name = option.querySelector('.gift-name').textContent.toLowerCase();
                const idText = option.querySelector('.gift-cost').textContent.toLowerCase();
                option.style.display = (name.includes(term) || idText.includes(term)) ? 'flex' : 'none';
            });
        });
    }
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => { 
        if (alertGiftSelector && !alertGiftSelector.contains(e.target)) { 
            alertGiftSelector.classList.remove('open'); 
        } 
    });

    // Manejador de clics para los botones de las tarjetas de audio
    if (localAudiosGrid) {
        localAudiosGrid.addEventListener('click', async (e) => {
            const button = e.target.closest('.audio-control-btn');
            if (!button || !window.electronAPI) return;

            const fileName = button.dataset.filename;

            if (button.classList.contains('play')) {
                // --- INICIO DE LA NUEVA LÓGICA DE REPRODUCCIÓN ---
                (async () => {
                    const filePath = await window.electronAPI.getAudioFilePath(fileName);
                    audioPlayer.src = filePath;
                    audioPlayer.play().catch(e => console.error("Error al reproducir audio:", e));
                })();
                // --- FIN DE LA NUEVA LÓGICA ---
            } else if (button.classList.contains('delete')) {
                // Acción de Borrar
                if (await window.showCustomConfirm(`¿Seguro que quieres eliminar el sonido "${fileName}"?`)) {
                    await window.electronAPI.deleteLocalAudio(fileName);
                }
            } else if (button.classList.contains('select')) {
                // Acción de Seleccionar
                selectAudio(fileName); // <--- Usa la nueva función
                audioListModal.classList.remove('open'); // Cerramos el modal
                
                // Mostramos el nombre del archivo seleccionado en el modal de acción
                const audioFileNameDisplay = document.createElement('div');
                audioFileNameDisplay.className = 'selected-audio-file';
                audioFileNameDisplay.innerHTML = `
                    <span>${fileName}</span>
                    <button class="remove-selected-audio">&times;</button>
                `;

                // Limpiamos cualquier selección anterior y añadimos la nueva
                const existingDisplay = audioConfigMenu.querySelector('.selected-audio-file');
                if (existingDisplay) existingDisplay.remove();
                
                audioConfigMenu.appendChild(audioFileNameDisplay);
                
                // Añadimos el listener para el botón de quitar selección
                audioFileNameDisplay.querySelector('.remove-selected-audio').addEventListener('click', () => {
                    selectedAudioFile = null;
                    audioFileNameDisplay.remove();
                });
            }
        });
    }

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
    setupGameController('cubo-tnt', 'Cubo TNT');
    setupGameController('peak', 'PEAK'); 
    setupGameController('supermarket-simulator', 'Supermarket Simulator');
    setupGameController('the-forest', 'The Forest');
    setupGameController('lucky-wheel', 'Lucky Wheel');
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
        // 1. Limpieza visual estándar
        navItems.forEach(i => i.classList.remove('active'));
        contentSections.forEach(s => s.classList.remove('active'));
        
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        
        if(targetSection) {
            targetSection.classList.add('active');
            document.getElementById('main-content').scrollTop = 0;
        }

        // 2. LÓGICA NUEVA: Cerrar sub-menús si vamos a una sección simple
        // Si el botón presionado NO es el de Acciones NI el de Galería...
        if (item.id !== 'btn-actions-main' && 
            item.id !== 'btn-gallery-main' && 
            item.id !== 'btn-goals-main') { // <--- IMPORTANTE: AGREGAR ESTE ID
            
            // Entonces cerramos TODOS los menús a la fuerza
            const smActions = document.getElementById('submenu-actions');
            if (smActions) smActions.classList.remove('open');
            
            const smGallery = document.getElementById('submenu-gallery');
            if (smGallery) smGallery.classList.remove('open');

            const smGoals = document.getElementById('submenu-goals');
            if (smGoals) smGoals.classList.remove('open');

            // Quitar rotación de flechas si las usas
            const allBtns = [document.getElementById('btn-actions-main'), document.getElementById('btn-gallery-main'), document.getElementById('btn-alerts-main'), document.getElementById('btn-goals-main')];
            allBtns.forEach(btn => { if(btn) btn.classList.remove('menu-open'); });
        }
    });
});

toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 1. Gestión de clases visuales (Botones)
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 2. Determinar modo
        currentConnectionMode = button.dataset.target.includes('server') ? 'api-server' : 'api-tikfinity';

        // 3. Gestión de Cabeceras (Headers) y Herencia de Foto
        if (currentConnectionMode === 'api-server') {
            sidebarHeaderServer.classList.remove('hidden');
            sidebarHeaderTikfinity.classList.add('hidden');
        } else {
            // Modo TikFinity
            sidebarHeaderServer.classList.add('hidden');
            sidebarHeaderTikfinity.classList.remove('hidden');

            // --- LÓGICA DE HERENCIA DE FOTO ---
            const serverImg = document.getElementById('sidebar-profile-img');
            const tikfinityImg = document.getElementById('tikfinity-profile-img');
            const tikfinityIcon = document.getElementById('tikfinity-default-icon');

            // Si el usuario ya tiene foto cargada en el modo Server, la copiamos
            if (serverImg && tikfinityImg && serverImg.style.display !== 'none' && serverImg.src) {
                tikfinityImg.src = serverImg.src;
                tikfinityImg.style.display = 'block';
                if(tikfinityIcon) tikfinityIcon.style.display = 'none';
            }
            // ----------------------------------
        }
        
        // 4. Gestión de Paneles
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
        // Este es el del menú lateral (ya lo tenías)
        const versionElement = document.getElementById('app-version');
        if (versionElement) versionElement.textContent = `v${version}`;

        // AGREGA ESTO: Actualiza también la pantalla de Login
        const loginVersion = document.getElementById('login-version-tag');
        if (loginVersion) loginVersion.textContent = `v${version}`;
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
        
        // Actualizar texto y color del botón del sidebar
        if (currentConnectionMode === 'api-server') {
            if (isConnected) {
                // ESTADO CONECTADO (ROJO)
                sidebarConnectBtn.innerHTML = '<i class="fas fa-unlink"></i> Desconectar';
                sidebarConnectBtn.classList.add('connected'); // Activa el rojo
            } else {
                // ESTADO DESCONECTADO (MORADO)
                sidebarConnectBtn.innerHTML = '<i class="fas fa-link"></i> Conectar';
                sidebarConnectBtn.classList.remove('connected'); // Vuelve al morado
            }
            // Eliminamos la linea vieja de .style.color porque el CSS ya lo maneja
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
    // --- Lógica Botón Obtener Emotes (MEJORADA) ---
    emotesButton.addEventListener('click', async () => {
        // 1. Guardar el usuario escrito en el input antes de nada
        const username = usernameInput.value.trim();
        if (!username) {
            showToastNotification('⚠️ Escribe un usuario primero.');
            return;
        }
        await window.electronAPI.saveUsername(username);

        // 2. Proceder con la lógica original
        emotesButton.disabled = true;
        showToastNotification('🔑 Abriendo ventana de login... Por favor espera.');
        
        try {
            const result = await window.electronAPI.loginAndFetchEmotes();
            // ... resto de tu código igual ...
            if (result.success) {
                showToastNotification(result.message);
                availableEmotesCache = result.emotes || [];

                // --- AÑADE ESTA LÍNEA AQUÍ PARA GUARDAR EN DISCO ---
                if(window.electronAPI) window.electronAPI.saveEmotes(availableEmotesCache);
                // ---------------------------------------------------

                if(typeof renderAlertEmoteOptions === 'function') {
                    renderAlertEmoteOptions(availableEmotesCache);
                }
            } else {
                showToastNotification(result.message);
            }
        } catch (error) {
            console.error(error);
            showToastNotification('❌ Error al obtener emotes.');
        } finally {
            emotesButton.disabled = false;
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
    // --- Lógica de Estado (Compartida) ---
    window.electronAPI.onStatus(statusMessage => {
        statusDiv.textContent = statusMessage;
        const isConnected = statusMessage.includes('✅');
        const isConnecting = statusMessage.includes('Conectando...');
        
        // Actualizar UI del modo activo
        if (currentConnectionMode === 'api-server') {
            connectButton.disabled = isConnected || isConnecting;
            disconnectButton.disabled = !isConnected;
            
            // LÍNEA BORRADA: emotesButton.disabled = !isConnected; 
            // Ahora el botón siempre está activo para que puedas pulsarlo cuando quieras
            emotesButton.disabled = false; 
            
            updateGiftsButton.disabled = !isConnected; 
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

    // Listener de Chat (MODIFICADO)
    window.electronAPI.onChat(data => {
        // 1. Log visual (igual que antes)
        const sanitizedComment = data.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        addLogEntry(`<i class="fas fa-comment"></i> <b>${data.nickname}:</b> ${sanitizedComment}`, 'chat');
        
        // 2. Procesar como comentario normal (para leer en voz alta, etc.)
        processTikTokEvent('chat-comment', data);

        // 3. (NUEVO) Verificar si el mensaje contiene EMOTES
        // TikTok envía un array 'emotes' si el mensaje tiene alguno.
        if (data.emotes && data.emotes.length > 0) {
            console.log("Emotes detectados en el mensaje:", data.emotes);
            // Disparamos el evento específico de tipo 'emote'
            processTikTokEvent('emote', data);
        }
    });

    // Listener de Regalos (CORREGIDO FINAL)
    window.electronAPI.onGift(data => {
        
        // =================================================================
        // 1. LÓGICA DE RÉCORDS (Se ejecuta SIEMPRE, incluso al final)
        // =================================================================

        // A) MEJOR REGALO (Por precio unitario)
        if (data.diamondCount > topGiftState.coins) {
            let finalGiftImage = data.giftPictureUrl; 
            const cachedGift = availableGiftsCache.find(g => g.id == data.giftId);
            if (cachedGift && cachedGift.image && cachedGift.image.url_list) {
                finalGiftImage = cachedGift.image.url_list[0];
            }

            topGiftState = {
                username: data.nickname,
                coins: data.diamondCount, // Valor unitario
                giftName: data.giftName,
                giftImage: finalGiftImage
            };
            
            if(window.electronAPI) {
                window.electronAPI.updateWidget('topGift', topGiftState);
                saveAllData();
            }
        }

        // B) MEJOR RACHA (Por cantidad de combo)
        if (data.repeatCount > topStreakState.streakCount) {
            let finalGiftImage = data.giftPictureUrl; 
            const cachedGift = availableGiftsCache.find(g => g.id == data.giftId);
            if (cachedGift && cachedGift.image && cachedGift.image.url_list) {
                finalGiftImage = cachedGift.image.url_list[0];
            }

            topStreakState = {
                username: data.nickname,
                streakCount: data.repeatCount, // Cantidad acumulada
                giftName: data.giftName,
                giftImage: finalGiftImage
            };

            if(window.electronAPI) {
                window.electronAPI.updateWidget('topStreak', topStreakState);
                saveAllData();
            }
        }

        // =================================================================
        // 2. FILTRO DE REPETICIÓN (Para Subasta y Logs)
        // =================================================================
        // Aquí sí detenemos si es el final, para no sumar monedas doble vez
        if (data.repeatEnd) return; 

        // Log visual
        const totalCoins = data.repeatCount * data.diamondCount;
        const message = `
            <img src="${data.giftPictureUrl}" class="gift-icon" alt="${data.giftName}">
            <b>${data.nickname}</b> envió <b>${data.repeatCount}x ${data.giftName}</b>
            (<i class="fas fa-coins" style="color: #ffeb3b;"></i> ${totalCoins})
        `;
        addLogEntry(message, 'gift');

        // Ejecutar acción AHORA (durante el combo)
        processTikTokEvent('gift-specific', data);
        
        // Sumar a la subasta AHORA (durante el combo)
        updateAuction(data);
    });

    // Listener de "Se ha unido" (CORREGIDO)
    window.electronAPI.onJoin(data => {
        addLogEntry(`<i class="fas fa-walking"></i> <b>${data.nickname}</b> se ha unido.`, 'join');
        processTikTokEvent('join', data);
        // sendNicknameToGame(data.nickname);
    });

    // Listener de "Compartir" (NUEVO)
    window.electronAPI.onShare(data => {
        addLogEntry(`<i class="fas fa-share-square" style="color: #38c172;"></i> <b>${data.nickname}</b> ha compartido el directo.`, 'share');
        processTikTokEvent('share', data);
    });

    // === PEGA ESTO JUSTO AQUÍ DEBAJO ===
    
    // Listener para Datos Iniciales (Carga el total al conectar)
    if (window.electronAPI.onRoomInfo) {
        window.electronAPI.onRoomInfo((roomInfo) => {
            console.log("Datos iniciales de la sala recibidos:", roomInfo);
            
            // TikTok a veces usa 'likes_count' o 'like_count' en la info de la sala
            const totalLikes = roomInfo.likes_count || roomInfo.like_count || 0;

            if (totalLikes > 0) {
                // Forzamos la actualización de la barra con el total real
                addLikesToGoal(0, totalLikes);
                showToastNotification(`Likes sincronizados: ${totalLikes}`);
            }
        });
    }

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
            localStorage.setItem('cachedUsername', data.nickname); // <--- NUEVO: Guardar nombre local
        }

        // 2. Poner la foto y GUARDARLA
        if (data.avatar && profileImg && defaultIcon) {
            profileImg.src = data.avatar;
            profileImg.style.display = 'block'; 
            defaultIcon.style.display = 'none';
            
            // Guardar en variable global y nube
            lastProfilePicture = data.avatar;
            saveAllData(); 
            
            // --- NUEVO: Guardar en Caché Local (Instantáneo) ---
            localStorage.setItem('cachedProfilePic', data.avatar);
            // ---------------------------------------------------
            
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
    let globalAlerts = []; // <--- AGREGA ESTO (Alertas independientes)
    let availableGiftsCache = [];
    let lastProfilePicture = ''; // <--- AGREGA ESTA LÍNEA AQUÍ
    const ITEMS_PER_PAGE = 20;
    let currentPageActions = 1;
    let currentPageEvents = 1;
    let currentPageAlerts = 1; // <--- AGREGA ESTA LÍNEA

    async function saveAllData() {
        if (currentAppUser && activeProfileName && profiles[activeProfileName]) {
            
            // 1. GUARDAMOS LAS METAS DENTRO DEL PERFIL ACTUAL ANTES DE SUBIR
            profiles[activeProfileName].goals = {
                likes: likeGoalState,
                follows: followGoalState,
            };

            try {
                await db.ref('users/' + currentAppUser.uid + '/data').set({
                    profiles, 
                    activeProfileName, 
                    globalAlerts, 
                    mediaLibrary: mediaLibrary || [],
                    topGift: topGiftState,
                    topStreak: topStreakState,
                    lastProfilePicture: lastProfilePicture || '' // <--- ESTO GUARDA LA FOTO
                });
                console.log("☁️ Datos guardados en la nube.");
            } catch (e) {
                console.error(e);
                showToastNotification("❌ Error al guardar en la nube");
            }
        }
    }

    async function loadAllDataFromCloud() {
        if (currentAppUser) {
            const userId = currentAppUser.uid;
            showToastNotification("☁️ Descargando datos...");
            
            const snapshot = await db.ref('users/' + userId + '/data').once('value');
            const data = snapshot.val();

            if (data) {
                profiles = data.profiles || {};
                activeProfileName = data.activeProfileName || '';
                globalAlerts = data.globalAlerts || [];
                mediaLibrary = data.mediaLibrary || [];
                topGift = data.topGift || { username: 'Username', coins: 0, giftName: 'Default', giftImage: '' };
                topStreak = data.topStreak || { username: 'Username', streakCount: 0, giftName: 'Default', giftImage: '' };
                
                // Cargar Foto guardada
                lastProfilePicture = data.lastProfilePicture || '';
                if (lastProfilePicture) {
                    const img = document.getElementById('sidebar-profile-img');
                    const icon = document.getElementById('sidebar-default-icon');
                    if (img && icon) {
                        img.src = lastProfilePicture;
                        img.style.display = 'block';
                        icon.style.display = 'none';
                    }
                }

                // Cargar Metas
                const currentGoals = profiles[activeProfileName]?.goals || {};
                
                // Likes
                likeGoalState = currentGoals.likes || { current: 0, meta: 1000, initialMeta: 1000, title: "Like Goal" };
                likeGoalState.current = 0; // Reset barra a 0
                if (likeGoalState.initialMeta) likeGoalState.meta = likeGoalState.initialMeta; // Reset meta a base

                // Follows
                followGoalState = currentGoals.follows || { current: 0, meta: 100, initialMeta: 100, title: "Follow Goal" };
                followGoalState.current = 0; // Reset barra a 0
                if (followGoalState.initialMeta) followGoalState.meta = followGoalState.initialMeta; // Reset meta a base
                
                // Rellenar Inputs de texto
                if(document.getElementById('gl-title-input')) {
                    document.getElementById('gl-title-input').value = likeGoalState.title;
                    document.getElementById('gl-meta-input').value = likeGoalState.meta;
                }
                if(document.getElementById('gf-title-input')) {
                    document.getElementById('gf-title-input').value = followGoalState.title;
                    document.getElementById('gf-meta-input').value = followGoalState.meta;
                }

                // Sincronizar widgets
                if (window.electronAPI) {
                    window.electronAPI.updateWidget('topGift', topGiftState);
                    window.electronAPI.updateWidget('topStreak', topStreakState);
                    syncGoalOverlay(); 
                    syncFollowGoalOverlay(); 
                }

            } else {
                profiles = {};
                globalAlerts = []; 
                activeProfileName = '';
            }

            if(window.electronAPI) await loadGiftsCache(); 

            if(window.electronAPI) {
                const savedEmotes = await window.electronAPI.getSavedEmotes();
                if(savedEmotes && savedEmotes.length > 0) availableEmotesCache = savedEmotes;
            }

            updateProfileSelector();
            renderActiveProfileData();

            // --- ESTO ES LO NUEVO: RECUPERAR LA ACCIÓN GUARDADA ---
            // 1. Forzamos el llenado de la lista de acciones ahora mismo
            if(typeof updateGoalActions === 'function') updateGoalActions();
            if(typeof updateGoalFollowActions === 'function') updateGoalFollowActions();

            // 2. Seleccionamos la opción guardada
            if(document.getElementById('gl-action-select')) {
                document.getElementById('gl-action-select').value = likeGoalState.actionId || "";
            }
            if(document.getElementById('gf-action-select')) {
                document.getElementById('gf-action-select').value = followGoalState.actionId || "";
            }
            // ------------------------------------------------------

            showToastNotification("✅ Datos cargados correctamente.");
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
        renderAlerts(); // <-- AÑADE ESTA LÍNEA
    }

    // === NUEVO: Lógica del Modal de Alertas ===
    if (createAlertButton) {
        createAlertButton.addEventListener('click', () => {
            // Lógica para abrir el modal de alertas (la crearemos ahora)
            openAlertModal();
        });
    }

    // === FUNCIÓN RESET (VERSIÓN BÚSQUEDA EXACTA) ===
    function resetAlertModal() {
        console.log("🧹 Limpiando modal de alertas (Modo Local)...");
        
        // 1. Referencia al contenedor PADRE (El modal que tienes abierto)
        const modal = document.querySelector('#create-alert-modal');
        if(!modal) return;

        // 2. BUSCAMOS LOS ELEMENTOS DENTRO DE ESTE MODAL EXCLUSIVAMENTE
        // (Esto evita que pille IDs duplicados de otras partes)
        
        const emoteMenu = modal.querySelector('#alert-custom-emote-selector');
        const emoteDisplay = modal.querySelector('#alert-emote-selector-display');
        const emoteInput = modal.querySelector('#alert-selected-emote-id');
        const emoteContainer = modal.querySelector('#alert-emote-selector-container');

        // 3. LIMPIEZA DE EMOTES
        if (emoteMenu) {
            emoteMenu.classList.remove('open'); // Cierra el menú exacto
        }
        if (emoteDisplay) {
            emoteDisplay.innerHTML = '<span class="placeholder">Selecciona un emote...</span>'; // Borra la foto
        }
        if (emoteInput) {
            emoteInput.value = ''; 
            delete emoteInput.dataset.imageUrl; 
        }
        if (emoteContainer) {
            emoteContainer.style.display = 'none';
        }

        // 4. LIMPIEZA DE REGALOS
        const giftMenu = modal.querySelector('#alert-custom-gift-selector');
        const giftDisplay = modal.querySelector('#alert-gift-selector-display');
        const giftInput = modal.querySelector('#alert-selected-gift-id');
        const giftSpecificContainer = modal.querySelector('#alert-gift-specific-selector');
        
        if (giftMenu) giftMenu.classList.remove('open');
        if (giftDisplay) giftDisplay.innerHTML = '<span class="placeholder">Selecciona...</span>';
        if (giftInput) giftInput.value = '';
        if (giftSpecificContainer) giftSpecificContainer.style.display = 'none';

        // 5. RESTO DE CAMPOS
        modal.querySelector('#alert-modal-title').textContent = 'Nueva Alerta';
        modal.querySelector('#editing-alert-id').value = '';
        modal.querySelector('#alert-name').value = '';
        modal.querySelector('#alert-duration').value = '5';
        modal.querySelector('#alert-specific-users-list').value = '';
        modal.querySelector('#alert-min-coins-amount').value = '1';

        // Ocultar contenedores extra
        const hiddenContainers = [
            '#alert-specific-user-input-container',
            '#alert-min-coins-input-container',
            '#alert-likes-amount-selector',
            '#alert-media-config'
        ];
        hiddenContainers.forEach(sel => {
            const el = modal.querySelector(sel);
            if(el) el.style.display = 'none';
        });

        // 6. AUDIO Y MEDIA
        const checkMedia = modal.querySelector('#alert-action-show-media');
        if(checkMedia) checkMedia.checked = false;
        modal.querySelector('#alert-selected-media-url').value = '';
        
        const checkAudio = modal.querySelector('#alert-action-play-audio');
        if(checkAudio) checkAudio.checked = false;
        const audioConfig = modal.querySelector('#alert-audio-config');
        if(audioConfig) audioConfig.classList.remove('open');

        // 7. RADIOS
        const defaultWho = modal.querySelector('input[name="alert_who"][value="all"]');
        if(defaultWho) defaultWho.checked = true;
        const defaultWhy = modal.querySelector('input[name="alert_why"][value="join"]');
        if(defaultWhy) defaultWhy.checked = true;
    }

    function openAlertModal(alertData = null) {
        // 1. Limpieza inicial
        resetAlertModal(); 
        
        // 2. FORCE RESET VISUAL (Seguridad extra para el menú)
        const emoteMenu = document.getElementById('alert-custom-emote-selector');
        const emoteDisplay = document.getElementById('alert-emote-selector-display');
        const emoteInput = document.getElementById('alert-selected-emote-id');
        
        if (emoteMenu) emoteMenu.classList.remove('open');
        if (emoteDisplay) emoteDisplay.innerHTML = '<span class="placeholder">Selecciona un emote...</span>';
        if (emoteInput) emoteInput.value = '';

        // 3. RELLENAR DATOS (Si estamos editando)
        if (alertData) {
            try {
                document.getElementById('alert-modal-title').textContent = 'Editar Alerta';
                document.getElementById('editing-alert-id').value = alertData.id;
                document.getElementById('alert-name').value = alertData.name || '';
                
                // Duración (con seguridad)
                const durationInput = document.getElementById('alert-duration');
                if(durationInput) durationInput.value = alertData.duration || 5;

                // --- RESTAURAR RADIOS (Trigger y Quién) ---
                try {
                    const whyRadio = document.querySelector(`input[name="alert_why"][value="${alertData.why}"]`);
                    if (whyRadio) {
                        whyRadio.checked = true;
                        whyRadio.dispatchEvent(new Event('change')); // Muestra los inputs necesarios
                    }
                    
                    const whoRadio = document.querySelector(`input[name="alert_who"][value="${alertData.who}"]`);
                    if (whoRadio) whoRadio.checked = true;
                } catch(e) { console.error("Error restaurando radios:", e); }

                // --- RESTAURAR CAMPOS ESPECÍFICOS ---
                
                // Usuarios Específicos
                if (alertData.who === 'specific' && alertData.specificUsers) {
                    const userInput = document.getElementById('alert-specific-users-list');
                    if(userInput) userInput.value = alertData.specificUsers.join(', ');
                    
                    const userContainer = document.getElementById('alert-specific-user-input-container');
                    if(userContainer) userContainer.style.display = 'grid';
                }

                // Min Coins
                if (alertData.why === 'gift-min' && alertData.minCoins) {
                    const coinsInput = document.getElementById('alert-min-coins-amount');
                    if(coinsInput) coinsInput.value = alertData.minCoins;
                }

                // Regalo Específico
                if (alertData.why === 'gift-specific' && alertData.giftId) {
                    const alertInput = document.getElementById('alert-selected-gift-id');
                    const alertDisplay = document.getElementById('alert-gift-selector-display');

                    if (alertInput) alertInput.value = alertData.giftId;
                    
                    if (alertDisplay) {
                        // Intentar buscar imagen en caché
                        let imgHtml = `<span>${alertData.giftName || 'Regalo ID: ' + alertData.giftId}</span>`;
                        if(typeof availableGiftsCache !== 'undefined') {
                            const cachedGift = availableGiftsCache.find(g => g.id == alertData.giftId);
                            if (cachedGift && cachedGift.image) {
                                imgHtml = `<img src="${cachedGift.image.url_list[0]}" alt="${cachedGift.name}"><span>${cachedGift.name}</span>`;
                            }
                        }
                        alertDisplay.innerHTML = imgHtml;
                    }
                }

                // Emotes
                if (alertData.why === 'emote' && alertData.emoteId) {
                    if (emoteInput) emoteInput.value = alertData.emoteId;
                    if (emoteDisplay) {
                        if (alertData.emoteImage) {
                            emoteDisplay.innerHTML = `<img src="${alertData.emoteImage}" alt="Emote"><span>Emote</span>`;
                            // Restaurar data-set para que al guardar no se pierda
                            emoteInput.dataset.imageUrl = alertData.emoteImage;
                        } else {
                            emoteDisplay.innerHTML = `<span>Emote ID: ${alertData.emoteId}</span>`;
                        }
                    }
                }

                // Audio
                if (alertData.audioAction) {
                    const cbAudio = document.getElementById('alert-action-play-audio');
                    const menuAudio = document.getElementById('alert-audio-config');
                    
                    if(cbAudio) cbAudio.checked = true;
                    if(menuAudio) menuAudio.classList.add('open');

                    // Importante: Definir contexto
                    audioSelectionContext = 'alert'; 
                    selectAudio(alertData.audioAction.file);

                    const volSlider = document.getElementById('alert-audio-volume');
                    if (volSlider) {
                        volSlider.value = alertData.audioAction.volume || 50;
                        volSlider.dispatchEvent(new Event('input'));
                    }

                    if (alertData.audioAction.oneShot) document.getElementById('alert-audio-oneshot').checked = true;
                    if (alertData.audioAction.skip) document.getElementById('alert-audio-skip').checked = true;
                    if (alertData.audioAction.queue) document.getElementById('alert-audio-add-queue').checked = true;
                }

                // Media (Imagen/Video)
                if (alertData.mediaAction) {
                    const mediaCheck = document.getElementById('alert-action-show-media');
                    const mediaDiv = document.getElementById('alert-media-config');
                    const mediaInput = document.getElementById('alert-selected-media-url');

                    if (mediaCheck) mediaCheck.checked = true;
                    if (mediaDiv) mediaDiv.style.display = 'block';
                    if (mediaInput) mediaInput.value = alertData.mediaAction.url;
                }

            } catch(err) {
                console.error("⚠️ Error restaurando datos de alerta:", err);
                // Si falla algo al rellenar, no pasa nada, continuamos para abrir la ventana
            }
        }
        
        // 4. ABRIR EL MODAL (Finalmente)
        document.getElementById('create-alert-modal').classList.add('open');
    }
    
    const closeAlertModal = () => { 
        resetAlertModal(); // <--- IMPORTANTE: Limpiar antes de cerrar
        alertModalOverlay.classList.remove('open'); 
    };

    // === LÓGICA PARA GUARDAR ALERTAS (PEGAR ESTO) ===
    applyAlertButton.addEventListener('click', async () => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return showToastNotification('⚠️ Error: No hay perfil activo.');
        
        // Aseguramos que existe el array de alertas
        if (!currentProfile.alerts) currentProfile.alerts = [];

        const id = document.getElementById('editing-alert-id').value ? parseInt(document.getElementById('editing-alert-id').value) : null;
        const name = document.getElementById('alert-name').value.trim();
        
        if (!name) return showToastNotification('⚠️ La alerta necesita un nombre.');

        // Obtenemos los valores de los radios (quién y por qué)
        const whoElement = document.querySelector('input[name="alert_who"]:checked');
        const whyElement = document.querySelector('input[name="alert_why"]:checked');
        const who = whoElement ? whoElement.value : 'all';
        const why = whyElement ? whyElement.value : 'join';

        const newAlertData = {
            id: id || Date.now(), // Generamos ID único basado en tiempo si es nuevo
            name: name,
            enabled: true,
            who: who,
            why: why,
            duration: document.getElementById('alert-duration').value || 5
        };

        if (id) {
            // Buscar en globalAlerts
            const index = globalAlerts.findIndex(a => a.id === id);
            if (index !== -1) globalAlerts[index] = newAlertData;
        } else {
            globalAlerts.push(newAlertData);
        }

        // === CAMBIAR ESTO: Lógica de Audio para ALERTAS ===
        const playAudioCheck = document.getElementById('alert-action-play-audio'); // ID Nuevo
        if (playAudioCheck && playAudioCheck.checked) {
            if (selectedAudioFile) {
                newAlertData.audioAction = {
                    file: selectedAudioFile,
                    // Usamos los IDs nuevos del modal de alertas
                    volume: document.getElementById('alert-audio-volume').value, 
                    oneShot: document.getElementById('alert-audio-oneshot').checked,
                    skip: document.getElementById('alert-audio-skip').checked,
                    queue: document.getElementById('alert-audio-add-queue').checked
                };
            } else {
                 return showToastNotification('⚠️ Selecciona un archivo de audio.');
            }
        }
        // =================================================

        // Lógica de Media para ALERTAS
        const showMediaCheck = document.getElementById('alert-action-show-media');
        if (showMediaCheck && showMediaCheck.checked) {
            const mediaUrl = document.getElementById('alert-selected-media-url').value;
            if (mediaUrl) {
                // INTENTAMOS BUSCAR EL NOMBRE EN TU BIBLIOTECA
                let niceName = "Archivo";
                // mediaLibrary es tu variable global donde guardas las fotos/videos
                const foundMedia = mediaLibrary.find(m => m.url === mediaUrl);
                
                if (foundMedia) {
                    niceName = foundMedia.name; // Usamos el nombre que le pusiste
                } else {
                    // Si no está (es un link pegado), limpiamos la URL para dejar solo el archivo
                    try { niceName = mediaUrl.split('/').pop().split('?')[0]; } catch(e){}
                }

                newAlertData.mediaAction = {
                    url: mediaUrl,
                    volume: 100,
                    name: niceName // <--- AQUÍ GUARDAMOS EL NOMBRE
                };
            } else {
                 return showToastNotification('⚠️ Selecciona una imagen o video.');
            }
        }

        // LÓGICA USUARIOS ESPECÍFICOS
        if (who === 'specific') {
            const rawUsers = document.getElementById('alert-specific-users-list').value;
            if (!rawUsers.trim()) return showToastNotification('⚠️ Escribe al menos un usuario.');
            // Guardamos como array limpio: ["pepito", "juan"]
            newAlertData.specificUsers = rawUsers.split(',').map(u => u.trim().toLowerCase());
        }

        // LÓGICA MIN COINS
        if (why === 'gift-min') {
            const minCoins = parseInt(document.getElementById('alert-min-coins-amount').value);
            if (!minCoins || minCoins < 1) return showToastNotification('⚠️ El mínimo debe ser 1 moneda.');
            newAlertData.minCoins = minCoins;
        }

        // Lógica para Regalos Específicos
        if (why === 'gift-specific') {
            const giftIdInput = document.getElementById('alert-selected-gift-id');
            if (giftIdInput && giftIdInput.value) {
                newAlertData.giftId = parseInt(giftIdInput.value);
                // Intentamos guardar el nombre también para mostrarlo bonito en la lista
                const gift = availableGiftsCache.find(g => g.id == newAlertData.giftId);
                if (gift) newAlertData.giftName = gift.name;
            } else {
                return showToastNotification('⚠️ Selecciona un regalo específico.');
            }
        }

        // Lógica para Emotes (CORREGIDO)
        if (why === 'emote') {
            // Usamos el ID correcto del input de EMOTES, no de regalos
            const emoteInput = document.getElementById('alert-selected-emote-id'); 
            
            if (emoteInput && emoteInput.value) {
                newAlertData.emoteId = emoteInput.value;
                newAlertData.emoteImage = emoteInput.dataset.imageUrl; // Guardamos la URL para mostrarla luego
            } else {
                return showToastNotification('⚠️ Selecciona un emote de la lista.');
            }
        }

        // Guardar en el perfil
        if (id) {
            // Editar existente
            const index = currentProfile.alerts.findIndex(a => a.id === id);
            if (index !== -1) currentProfile.alerts[index] = newAlertData;
        } else {
            // Crear nueva
            currentProfile.alerts.push(newAlertData);
        }

        await saveAllData();
        renderAlerts();
        closeAlertModal();
        showToastNotification('✅ Alerta guardada correctamente.');
    });
    
    if(closeAlertButton) closeAlertButton.addEventListener('click', closeAlertModal);
    if(discardAlertButton) discardAlertButton.addEventListener('click', closeAlertModal);

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
        // 1. ANTES DE CAMBIAR: Guardamos TODO lo actual en la memoria del perfil VIEJO
        // Usamos activeProfileName (que aún tiene el nombre viejo)
        if (profiles[activeProfileName]) {
            profiles[activeProfileName].goals = {
                likes: likeGoalState,
                follows: followGoalState
            };
        }

        // 2. AHORA SÍ: Cambiamos al nuevo nombre
        activeProfileName = profileSelector.value;
        
        // 3. CARGAMOS LOS DATOS DEL NUEVO PERFIL
        const newProfileGoals = profiles[activeProfileName]?.goals || {};
        
        // --- LIKES (Cargar y mostrar) ---
        likeGoalState = newProfileGoals.likes || { current: 0, meta: 1000, initialMeta: 1000, title: "Like Goal" };
        if(document.getElementById('gl-title-input')) {
            document.getElementById('gl-title-input').value = likeGoalState.title;
            document.getElementById('gl-meta-input').value = likeGoalState.meta;
        }

        // --- FOLLOWS (Cargar y mostrar) ---
        followGoalState = newProfileGoals.follows || { current: 0, meta: 100, initialMeta: 100, title: "Follow Goal" };
        if(document.getElementById('gf-title-input')) {
            document.getElementById('gf-title-input').value = followGoalState.title;
            document.getElementById('gf-meta-input').value = followGoalState.meta;
        }

        // 4. ACTUALIZAR LISTAS DE ACCIONES (El paso clave)
        renderActiveProfileData(); // Pinta la lista de abajo
        
        // Rellenamos los desplegables con las acciones de ESTE nuevo perfil
        if(typeof updateGoalActions === 'function') updateGoalActions();
        if(typeof updateGoalFollowActions === 'function') updateGoalFollowActions();

        // 5. RECUPERAR LA SELECCIÓN EN EL DESPLEGABLE
        // (El código espera 50ms para asegurar que el HTML se actualizó)
        setTimeout(() => {
            if(document.getElementById('gl-action-select')) {
                document.getElementById('gl-action-select').value = likeGoalState.actionId || "";
            }
            if(document.getElementById('gf-action-select')) {
                document.getElementById('gf-action-select').value = followGoalState.actionId || "";
            }
        }, 50);

        // 6. GUARDAR TODO EN LA NUBE (Para que recuerde que este es el perfil activo)
        await saveAllData(); 

        syncGoalOverlay();
        syncFollowGoalOverlay();
        
        showToastNotification(`Perfil cambiado a: ${activeProfileName}`);
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

    // --- LÓGICA DE DUPLICAR PERFIL CON MODAL ---
    const duplicateProfileFormContainer = document.getElementById('duplicate-profile-form-container');
    const duplicateProfileNameInput = document.getElementById('duplicate-profile-name-input');
    const applyDuplicateBtn = document.getElementById('apply-duplicate-profile-btn');
    const discardDuplicateBtn = document.getElementById('discard-duplicate-profile-btn');

    // 1. Abrir el modal al dar clic en Duplicar
    duplicateProfileBtn.addEventListener('click', () => {
        if (!activeProfileName) return showToastNotification('⚠️ No hay un perfil para duplicar.');
        
        // Pre-llenar el nombre con "(Copia)"
        duplicateProfileNameInput.value = `${activeProfileName} (Copia)`;
        
        duplicateProfileFormContainer.classList.add('visible');
        duplicateProfileNameInput.focus();
        duplicateProfileNameInput.select();
    });

    // 2. Botón Cancelar
    discardDuplicateBtn.addEventListener('click', () => duplicateProfileFormContainer.classList.remove('visible'));
    
    // 3. Botón Confirmar Duplicación
    applyDuplicateBtn.addEventListener('click', async () => {
        const baseName = activeProfileName;
        const newName = duplicateProfileNameInput.value.trim();

        if (!newName) return showToastNotification('⚠️ El nombre no puede estar vacío.');
        if (profiles[newName]) return showToastNotification('⚠️ Ya existe un perfil con ese nombre.');

        // Realizar la copia
        profiles[newName] = JSON.parse(JSON.stringify(profiles[baseName]));
        
        // Cambiar al nuevo perfil (opcional, si prefieres quedarte en el viejo, quita esta línea)
        activeProfileName = newName;
        
        updateProfileSelector();
        renderActiveProfileData();
        await saveAllData();
        
        duplicateProfileFormContainer.classList.remove('visible');
        showToastNotification(`✅ Perfil duplicado como "${newName}".`);
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
        // --- AGREGA ESTAS 2 LÍNEAS AQUÍ: ---
        if (typeof updateGoalActions === 'function') updateGoalActions();
        if (typeof updateGoalFollowActions === 'function') updateGoalFollowActions();
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
        document.getElementById('audio-config').classList.remove('open');

        // LIMPIEZA DE MINECRAFT
        document.getElementById('minecraft-config').classList.remove('open'); // Cierra el menú desplegable
        document.getElementById('minecraft-command').value = ''; // Borra el texto del comando
        document.getElementById('minecraft-quantity').value = '1'; // Resetea cantidad
        document.getElementById('minecraft-interval').value = '100'; // Resetea intervalo

        // --- AÑADE ESTAS DOS LÍNEAS AQUÍ ---
        selectedAudioFile = null;
        const existingDisplay = document.querySelector('.selected-audio-file');
        if (existingDisplay) existingDisplay.remove();
        
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

    // --- Lógica para mostrar/ocultar el sub-menú de audio ---
    const playAudioCheckbox = document.getElementById('action-play-audio');
    const audioConfigMenu = document.getElementById('audio-config');
    const volumeSlider = document.getElementById('audio-volume');
    const volumeLabel = document.getElementById('volume-label');

    if (playAudioCheckbox) {
        playAudioCheckbox.addEventListener('change', (e) => {
            audioConfigMenu.classList.toggle('open', e.target.checked);
            // Desmarcar otras opciones si se marca Play Audio
            if (e.target.checked) {
                document.getElementById('action-webhook').checked = false;
                document.getElementById('webhook-config').classList.remove('open');
                document.getElementById('action-extra').checked = false;
                document.getElementById('extra-actions-config').classList.remove('open');
                document.getElementById('action-simulate-keystrokes').checked = false;
                document.getElementById('keystroke-config').classList.remove('open');
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            volumeLabel.textContent = `Volumen: ${value}`;
            // --- ¡AÑADE ESTA LÍNEA! ---
            e.target.style.background = `linear-gradient(to right, #5c1d80 ${value}%, #555 ${value}%)`;
        });
    }

    // Listeners para el modal de la lista de audios
    if (openAudioListBtn) {
        openAudioListBtn.addEventListener('click', () => {
            renderLocalAudios();
            audioListModal.classList.add('open');
        });
    }

    if (closeAudioListBtn) {
        closeAudioListBtn.addEventListener('click', () => {
            audioListModal.classList.remove('open');
        });
    }

    if (uploadAudioBtn) {
        uploadAudioBtn.addEventListener('click', async () => {
            if (window.electronAPI) {
                // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
                // Ahora capturamos el resultado de la función.
                const result = await window.electronAPI.selectAudioFile();

                // Si se subió un archivo con éxito...
                if (result.success && result.fileName) {
                    //... lo seleccionamos automáticamente.
                    selectAudio(result.fileName);
                }
            }
        });
    }

    // Escucha para cuando la lista de audios se actualiza desde el backend
    if (window.electronAPI) {
        window.electronAPI.onAudioListUpdated((audioList) => {
            console.log('Lista de audios actualizada:', audioList);
            renderLocalAudios(); // Re-renderiza la lista con los nuevos archivos
        });
    }
    
    if (openSoundsFolderBtn) {
        openSoundsFolderBtn.addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.openSoundsFolder();
            }
        });
    }

    if (addMyInstantsBtn) {
        addMyInstantsBtn.addEventListener('click', async () => {
            const url = myInstantsUrlInput.value.trim();
            if (!url) {
                showToastNotification('⚠️ Pega una URL de MyInstants.');
                return;
            }

            if (window.electronAPI) {
                showToastNotification('📥 Descargando...');
                const result = await window.electronAPI.downloadMyInstantsAudio(url);
                showToastNotification(result.message);
                if (result.success) {
                    myInstantsUrlInput.value = ''; // Limpiar el input si fue exitoso
                }
            }
        });
    }

    // Ahora, cada checkbox solo se preocupa de mostrar/ocultar su propio menú.
    document.getElementById('action-webhook').addEventListener('change', (e) => {
        document.getElementById('webhook-config').classList.toggle('open', e.target.checked);
    });

    document.getElementById('action-extra').addEventListener('change', (e) => {
        document.getElementById('extra-actions-config').classList.toggle('open', e.target.checked);
    });

    // Tu listener de 'action-play-audio' ya es independiente, así que lo dejamos como está.
    // El de keystrokes también necesita ser independiente.
    document.getElementById('action-simulate-keystrokes').addEventListener('change', (e) => {
        document.getElementById('keystroke-config').classList.toggle('open', e.target.checked);
    });

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
            duration: document.getElementById('display-duration').value,
            queue: document.getElementById('action-queue').value,
            image: document.getElementById('action-image').value,
            repeatCombo: document.getElementById('repeat-with-gift-combo').checked,
        };

        const descriptions = [];

        // Ahora revisamos cada checkbox de forma independiente
        if (document.getElementById('action-play-audio').checked) {
            if (!selectedAudioFile) return showToastNotification('⚠️ Debes seleccionar un archivo de audio.');
            newActionData.audioAction = {
                file: selectedAudioFile,
                volume: document.getElementById('audio-volume').value
            };
            descriptions.push('Play Audio');
        }

        if (document.getElementById('action-minecraft').checked) {
            newActionData.minecraftAction = {
                command: document.getElementById('minecraft-command').value,
                quantity: document.getElementById('minecraft-quantity').value,
                interval: document.getElementById('minecraft-interval').value
            };
            descriptions.push('Minecraft');
        }

        // --- AGREGA ESTO ---
        if (document.getElementById('action-show-media').checked) {
            const mediaUrl = document.getElementById('selected-media-url').value;
            if (!mediaUrl) return showToastNotification('⚠️ Debes seleccionar una imagen o video.');
            
            newActionData.mediaAction = {
                url: mediaUrl,
                volume: 100 // Podrías agregar un slider de volumen para video si quieres
            };
            descriptions.push('Media');
        }
        // -------------------

        if (document.getElementById('action-webhook').checked) {
            const webhookUrl = document.getElementById('webhook-url').value;
            if (webhookUrl.trim() === '') return showToastNotification('⚠️ La URL del WebHook no puede estar vacía.');
            newActionData.webhookAction = { // CAMBIO DE NOMBRE: de webhookChecked a webhookAction
                url: webhookUrl,
                quantity: document.getElementById('webhook-quantity').value,
                interval: document.getElementById('webhook-interval').value
            };
            descriptions.push('WebHook');
        }

        if (document.getElementById('action-extra').checked) {
            newActionData.extraAction = {
                type: 'widgetControl',
                widgetId: document.getElementById('extra-action-widget-selector').value,
                operation: document.getElementById('extra-action-operation-selector').value,
                quantity: parseInt(document.getElementById('extra-action-quantity').value, 10)
            };
            descriptions.push('Extra Action');
        }

        if (document.getElementById('action-simulate-keystrokes').checked) {
            if (currentKeystrokeSequence.length === 0) return showToastNotification('⚠️ La secuencia de Keystrokes no puede estar vacía.');
            newActionData.keystrokeAction = {
                sequence: [...currentKeystrokeSequence],
                repeat: parseInt(document.getElementById('keystroke-repeat').value),
                interval: parseInt(document.getElementById('keystroke-interval').value),
                addToQueue: document.getElementById('keystroke-add-to-queue').checked,
                gameCompatibility: document.getElementById('game-compat-check').checked 
            };
            descriptions.push('Keystrokes');
        }

        newActionData.description = descriptions.join(' + ') || 'Acción Local';

        // --- AGREGAR ESTA LÍNEA DE SEGURIDAD AQUÍ ---
        if (!currentProfile.actions) currentProfile.actions = []; 
        // --------------------------------------------

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
            document.getElementById('audio-config').classList.remove('open');

            if (action.audioAction) {
                const cb = document.getElementById('action-play-audio');
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
                selectAudio(action.audioAction.file);
                const vs = document.getElementById('audio-volume');
                vs.value = action.audioAction.volume;
                vs.dispatchEvent(new Event('input'));
            }
            
            if (action.webhookAction) { // CAMBIO DE NOMBRE
                const cb = document.getElementById('action-webhook');
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
                document.getElementById('webhook-url').value = action.webhookAction.url;
                document.getElementById('webhook-quantity').value = action.webhookAction.quantity;
                document.getElementById('webhook-interval').value = action.webhookAction.interval;
            }

            if (action.extraAction) {
                const cb = document.getElementById('action-extra');
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
                document.getElementById('extra-action-widget-selector').value = action.extraAction.widgetId;
                const opSelector = document.getElementById('extra-action-operation-selector');
                opSelector.value = action.extraAction.operation;
                opSelector.dispatchEvent(new Event('change'));
                document.getElementById('extra-action-quantity').value = action.extraAction.quantity;
            }

            if (action.keystrokeAction) {
                const cb = document.getElementById('action-simulate-keystrokes');
                cb.checked = true;
                cb.dispatchEvent(new Event('change'));
                currentKeystrokeSequence.splice(0, currentKeystrokeSequence.length, ...action.keystrokeAction.sequence);
                updateKeystrokeSummary();
                renderSequence();
                document.getElementById('keystroke-repeat').value = action.keystrokeAction.repeat;
                document.getElementById('keystroke-interval').value = action.keystrokeAction.interval;
                document.getElementById('keystroke-add-to-queue').checked = action.keystrokeAction.addToQueue;
                document.getElementById('game-compat-check').checked = action.keystrokeAction.gameCompatibility; 
            }
            
            // AGREGAR ESTO PARA PODER EDITAR MINECRAFT
            if (action.minecraftAction) {
                const cb = document.getElementById('action-minecraft');
                cb.checked = true;
                // Forzamos el evento change para que se abra el menú
                cb.dispatchEvent(new Event('change'));
                
                document.getElementById('minecraft-command').value = action.minecraftAction.command;
                document.getElementById('minecraft-quantity').value = action.minecraftAction.quantity;
                document.getElementById('minecraft-interval').value = action.minecraftAction.interval;
            }

            actionModalOverlay.classList.add('open');
        }
    };

    window.deleteAction = async (id) => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;
        const action = currentProfile.actions.find(a => a.id === id);
        if (action && await window.showCustomConfirm(`¿Seguro que quieres borrar la acción "${action.name}"?`)) {
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
        const listContainer = document.getElementById('gift-options-list');
        if (!window.electronAPI) {
            listContainer.innerHTML = '<div class="no-gifts-message">No disponible en modo navegador.</div>';
            return;
        }

        // 1. Intentamos usar la caché actual
        if (availableGiftsCache && availableGiftsCache.length > 0) { 
            renderGiftOptions(availableGiftsCache); 
            return; 
        }

        // 2. Si está vacía, pedimos al backend
        listContainer.innerHTML = '<div class="no-gifts-message">Cargando regalos...</div>';
        try {
            const gifts = await window.electronAPI.getAvailableGifts();
            if (gifts && gifts.length > 0) {
                availableGiftsCache = gifts;
                renderGiftOptions(gifts);
            } else {
                listContainer.innerHTML = '<div class="no-gifts-message" style="padding:10px; text-align:center;">Lista vacía.<br>Conéctate a un Live y pulsa "Actualizar Regalos".</div>';
            }
        } catch (error) {
            console.error("Error al cargar los regalos:", error);
            listContainer.innerHTML = '<div class="no-gifts-message">Error al cargar regalos.</div>';
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
            
            // 1. Lógica para Regalos
            if (event.why === 'gift-specific' && event.giftId) {
                const giftDetails = getFullGiftDetails(event.giftId);
                if (giftDetails) {
                    triggerContent = `<div class="trigger-content"><img src="${giftDetails.image}" alt="${giftDetails.name}"> <span>${giftDetails.name}</span><span style="color: #ffeb3b;">- ${giftDetails.coins} coins</span></div>`;
                } else {
                    triggerContent = `<div class="trigger-content"><i class="fas fa-gift"></i> Gift ID: ${event.giftId}</div>`;
                }
            } 
            // 2. NUEVA LÓGICA PARA LIKES
            else if (event.why === 'likes') {
                const amount = event.likesAmount || 0;
                triggerContent = `<div class="trigger-content">${eventIcons['likes'] || ''} Likes ${amount}+</div>`;
            }
            // 3. Resto de eventos
            else {
                triggerContent = `<div class="trigger-content">${eventIcons[event.why] || ''} ${whyLabels[event.why] || event.why}</div>`;
            }

            // --- INICIO CAMBIO VISUAL ---
            let summaryParts = [];
            
            // 1. Agregar nombres de acciones FIJAS ("Activar todas estas acciones")
            if (event.actionsAll && event.actionsAll.length > 0) {
                summaryParts.push(event.actionsAll.map(a => a.name).join(', '));
            }

            // 2. Agregar nombres de acciones ALEATORIAS con formato especial
            if (event.actionsRandom && event.actionsRandom.length > 0) {
                const randomNames = event.actionsRandom.map(a => a.name).join(', ');
                // Añadimos el prefijo RANDOM y color amarillo (#ffc107)
                summaryParts.push(`<span style="color: #e0e0e0;">RANDOM(${randomNames})</span>`);
            }

            // Unir todo (ej: "Accion1 + RANDOM(Accion2, Accion3)")
            const actionsSummary = summaryParts.join(' + ') || 'Ninguna';
            // --- FIN CAMBIO VISUAL ---

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

        // --- AGREGAR ESTA LÍNEA DE SEGURIDAD AQUÍ ---
        if (!currentProfile.events) currentProfile.events = [];
        // --------------------------------------------

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
        const currentProfile = profiles[activeProfileName]; 
        // SEGURIDAD: Si no hay perfil o no hay eventos, no hacemos nada
        if (!currentProfile || !currentProfile.events) return;

        // SEGURIDAD: Usamos '==' en vez de '===' para que funcione si el ID es texto o número
        const event = currentProfile.events.find(e => e.id == id); 
        
        if (event) { 
            resetEventModal(); 
            document.getElementById('event-modal-title').textContent = 'Editar Evento'; 
            document.getElementById('editing-event-id').value = event.id; 
            
            // Restaurar Radios (Quién y Por Qué)
            const whoRadio = document.querySelector(`input[name="event_who"][value="${event.who}"]`);
            if (whoRadio) whoRadio.checked = true;

            const whyRadio = document.querySelector(`input[name="event_why"][value="${event.why}"]`);
            if (whyRadio) {
                whyRadio.checked = true;
                whyRadio.dispatchEvent(new Event('change')); // Activar lógica visual
            }

            document.getElementById('event-cooldown').value = event.cooldown; 
            document.getElementById('event-image').value = event.image; 
            
            // Restaurar acciones seleccionadas
            selectedActionsAll.splice(0, selectedActionsAll.length, ...(event.actionsAll || [])); 
            selectedActionsRandom.splice(0, selectedActionsRandom.length, ...(event.actionsRandom || [])); 
            renderSelectedTags(multiSelectAll, selectedActionsAll); 
            renderSelectedTags(multiSelectRandom, selectedActionsRandom); 
            
            await openEventModal();
            
            // Restaurar Regalo Específico
            if (event.why === 'gift-specific' && event.giftId) {
                // Intentamos buscarlo en la caché
                const selectedGift = availableGiftsCache.find(g => g.id == event.giftId);
                if (selectedGift) {
                    selectGift(selectedGift);
                } else {
                    // Si no está en caché, ponemos la data guardada manualmente
                    const display = document.getElementById('gift-selector-display');
                    const input = document.getElementById('selected-gift-id');
                    input.value = event.giftId;
                    if(event.giftImage) {
                        display.innerHTML = `<img src="${event.giftImage}" alt="${event.giftName}"><span>${event.giftName}</span>`;
                    } else {
                        display.innerHTML = `<span>${event.giftName || 'Regalo ID: ' + event.giftId}</span>`;
                    }
                }
            }

            // Restaurar Likes Específicos
            if (event.why === 'likes' && event.likesAmount) {
                document.getElementById('likes-amount').value = event.likesAmount;
            }
        } 
    };

    window.deleteEvent = async (id) => { 
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile || !currentProfile.events) return; // Seguridad extra

        if (await window.showCustomConfirm(`¿Seguro que quieres borrar este evento?`)) { 
            // Filtramos usando '!=' para seguridad de tipos (texto vs numero)
            currentProfile.events = currentProfile.events.filter(e => e.id != id);
            
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
    // AGREGA ESTA LÍNEA:
    function handleAlertPageChange(page) { currentPageAlerts = page; renderAlerts(); }
    
    // === FUNCIONES FALTANTES PARA ALERTAS ===
    window.toggleAlertStatus = async (id) => {
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;
        const alert = currentProfile.alerts.find(a => a.id === id);
        if (alert) {
            alert.enabled = !alert.enabled;
            await saveAllData();
            // No necesitamos re-renderizar todo, el checkbox ya cambió visualmente, 
            // pero si quieres asegurar consistencia:
            // renderAlerts(); 
        }
    };

    window.playAlert = (id) => {
        // Intentamos buscar la alerta en el perfil o en las globales
        const currentProfile = profiles[activeProfileName];
        let alert = currentProfile?.alerts?.find(a => a.id === id);
        
        // Si no está en el perfil, buscar en las globales
        if (!alert && typeof globalAlerts !== 'undefined') {
            alert = globalAlerts.find(a => a.id === id);
        }

        if (alert) {
            // Simulamos una acción para probarla
            const testAction = {
                name: alert.name,
                duration: alert.duration,
                audioAction: alert.audioAction,
                mediaAction: alert.mediaAction,
                image: alert.image
            };
            
            // --- CORRECCIÓN: ENVIAR A LA COLA DE ALERTAS, NO A LA DE ACCIONES ---
            alertQueue.push({ action: testAction, eventData: { nickname: 'TEST ALERTA' } });
            processAlertQueue(); // Usar el procesador de alertas
        }
    };

    window.deleteAlert = async (id) => {
        if (await window.showCustomConfirm('¿Borrar esta alerta?')) {
            // Filtrar globalAlerts
            globalAlerts = globalAlerts.filter(a => a.id !== id);
            
            // --- LÓGICA DE PAGINACIÓN AL BORRAR ---
            const totalPages = Math.ceil(globalAlerts.length / ITEMS_PER_PAGE) || 1;
            if (currentPageAlerts > totalPages) currentPageAlerts = totalPages;
            // --------------------------------------

            renderAlerts();
            await saveAllData();
        }
    };

    window.editAlert = (id) => {
        console.log("Intentando editar alerta ID:", id);
        
        // 1. Buscar en el perfil activo
        let alert = profiles[activeProfileName]?.alerts?.find(a => a.id === id);
        
        // 2. Si no está ahí, buscar en la lista global (por si acaso)
        if (!alert && globalAlerts) {
            alert = globalAlerts.find(a => a.id === id);
        }

        if (alert) {
            console.log("Alerta encontrada:", alert);
            openAlertModal(alert); 
        } else {
            console.error("❌ Error: No se encontró la alerta con ID", id);
            showToastNotification("Error: No se pudo cargar la alerta.");
        }
    };

    // ==========================================================
    // SECCIÓN 4: MOTOR DE EVENTOS Y SISTEMA DE COLA (DOBLE MOTOR)
    // ==========================================================
    let isAuctionRunning = false;
    let userLikeCounters = {}; 

    // --- CARRIL 1: ACCIONES (PERFILES) ---
    let actionQueue = []; 
    let isProcessingQueue = false;

    // --- CARRIL 2: ALERTAS (GLOBALES) ---
    let alertQueue = []; 
    let isProcessingAlertQueue = false;

    // --- FUNCIÓN: CREAR REPRODUCTORES DE AUDIO INDEPENDIENTES ---
    // Esto crea un reproductor para alertas y otro para acciones para que no se corten.
    function getAudioPlayer(type) {
        const id = `audio-player-${type}`; // ID único: audio-player-action o audio-player-alert
        let player = document.getElementById(id);
        
        if (!player) {
            player = document.createElement('audio');
            player.id = id;
            player.style.display = 'none'; 
            document.body.appendChild(player); 
        }
        return player;
    }

    // --- FUNCIÓN: EJECUTAR ACCIONES EXTRA (WIDGETS) ---
    async function executeExtraAction(extraAction) {
        if (!extraAction || extraAction.type !== 'widgetControl') return;
        const { widgetId, operation, quantity } = extraAction;
        if (!window.electronAPI) return;

        let currentData = await window.electronAPI.getWidgetData(widgetId);
        if (!currentData) currentData = { conteo: 0, meta: 5 };
        if (typeof currentData.conteo !== 'number') currentData.conteo = 0;

        const qty = parseInt(quantity) || 1;
        switch (operation) {
            case 'sumar': currentData.conteo += qty; break;
            case 'quitar': currentData.conteo -= qty; break;
            case 'reset': currentData.conteo = 0; break;
        }
        await window.electronAPI.updateWidget(widgetId, currentData);
    }

    // --- EL MOTOR DE EJECUCIÓN PRINCIPAL ---
    // Recibe 'queueType' para saber qué carril usar ('action' o 'alert')
    function executeAction(action, eventData, queueType) {
        return new Promise(async (resolve) => {
            const tasks = [];
            const nickname = (eventData && eventData.nickname) ? eventData.nickname : 'Usuario';

            // 1. MINECRAFT (Se ejecuta en paralelo, NO espera)
            if (action.minecraftAction && window.electronAPI) {
                (async () => {
                    const ip = document.getElementById('mc-ip').value.trim();
                    const port = document.getElementById('mc-port').value.trim();
                    const key = document.getElementById('mc-key').value.trim();
                    const playername = document.getElementById('mc-player-name').value.trim() || '@a';

                    if (ip && port && key) {
                        const rawCommands = action.minecraftAction.command.split('\n');
                        const quantity = parseInt(action.minecraftAction.quantity) || 1;
                        let interval = parseInt(action.minecraftAction.interval);
                        if (isNaN(interval)) interval = 100;

                        for (let i = 0; i < quantity; i++) {
                            for (let line of rawCommands) {
                                line = line.trim();
                                if (!line) continue;
                                let finalCommand = line.replace(/{nickname}/g, nickname).replace(/{playername}/g, playername);
                                await window.electronAPI.executeMinecraftCommand({ ip, port, key, command: finalCommand });
                            }
                            if (i < quantity - 1) await new Promise(r => setTimeout(r, interval));
                        }
                    }
                })();
            }

            // 2. AUDIO (Usa el reproductor independiente del carril)
            if (action.audioAction && window.electronAPI) {
                tasks.push(new Promise(async (res) => {
                    const audioPlayer = getAudioPlayer(queueType); // <--- Obtiene el reproductor correcto
                    const filePath = await window.electronAPI.getAudioFilePath(action.audioAction.file);
                    
                    if (filePath) {
                        audioPlayer.pause();
                        audioPlayer.currentTime = 0;
                        audioPlayer.volume = parseInt(action.audioAction.volume, 10) / 100;
                        audioPlayer.src = filePath;
                        
                        const onFinish = () => {
                            audioPlayer.onended = null;
                            audioPlayer.onerror = null;
                            res(); // Libera la tarea cuando termina el audio
                        };

                        audioPlayer.onended = onFinish;
                        audioPlayer.onerror = (e) => { console.error("Error audio:", e); onFinish(); };
                        
                        try { await audioPlayer.play(); } catch (err) { onFinish(); }
                    } else {
                        res();
                    }
                }));
            }

            // 3. VIDEO / IMAGEN (Espera la duración configurada)
            if (action.mediaAction) {
                tasks.push(new Promise(async (res) => {
                    const visualDuration = (action.duration || 5) * 1000;
                    
                    const mediaData = {
                        url: action.mediaAction.url,
                        volume: action.mediaAction.volume || 100,
                        duration: action.duration || 5,
                        timestamp: Date.now(),
                        name: action.mediaAction.name
                    };

                    if (window.electronAPI) {
                        await window.electronAPI.updateWidget('mediaOverlay', mediaData);
                    }

                    // Espera X segundos antes de liberar este carril
                    setTimeout(res, visualDuration);
                }));
            }

            // 4. OTROS (Webhooks, etc - No bloqueantes)
            if (action.webhookAction) { 
                let url = action.webhookAction.url.trim().replace(/{nickname}/g, nickname);
                if (url) fetch(url).catch(e => console.error(e));
            }

            if (action.keystrokeAction && window.electronAPI) {
                const kData = JSON.parse(JSON.stringify(action.keystrokeAction));
                if (kData.sequence) {
                    kData.sequence.forEach(i => { if(i.type==='text' && i.key) i.key = i.key.replace(/{nickname}/g, nickname); });
                }
                window.electronAPI.simulateKeystrokes(kData);
            }

            if (action.extraAction) {
                executeExtraAction(action.extraAction);
            }

            // --- SEGURIDAD ---
            // Si la acción no tiene ni audio ni video, esperamos 1s para no saturar el carril
            if (!action.mediaAction && !action.audioAction) {
                tasks.push(new Promise(res => setTimeout(res, 1000)));
            }

            // Esperamos a que terminen SOLO las tareas de ESTA acción en ESTE carril
            await Promise.all(tasks);
            resolve();
        });
    }

    // --- PROCESADOR DE CARRIL 1: ACCIONES ---
    async function processQueue() { 
        if (isProcessingQueue || actionQueue.length === 0) return;
        isProcessingQueue = true; 
        const task = actionQueue.shift(); 
        
        showToastNotification(`▶️ Acción: ${task.action.name}`); 
        // Ejecuta en modo 'action'
        await executeAction(task.action, task.eventData, 'action'); 
        
        isProcessingQueue = false; 
        processQueue(); 
    }

    // --- PROCESADOR DE CARRIL 2: ALERTAS ---
    async function processAlertQueue() { 
        if (isProcessingAlertQueue || alertQueue.length === 0) return;
        isProcessingAlertQueue = true; 
        const task = alertQueue.shift(); 
        
        showToastNotification(`🔔 Alerta: ${task.action.name}`); 
        // Ejecuta en modo 'alert' (paralelo al otro)
        await executeAction(task.action, task.eventData, 'alert'); 
        
        isProcessingAlertQueue = false; 
        processAlertQueue(); 
    }
    
    // --- EL ENRUTADOR: DECIDE A QUÉ COLA VA CADA COSA ---
    function processTikTokEvent(triggerType, eventData) { 
        const currentProfile = profiles[activeProfileName];
        if (!currentProfile) return;

        // 1. REVISAR ACCIONES DE PERFIL -> Enviar a 'actionQueue'
        if (currentProfile.events) {
            currentProfile.events.forEach(eventRule => {
                if (!eventRule.enabled) return;
                
                let match = false;
                if (eventRule.why === 'likes' && triggerType === 'likes') {
                     const userId = eventData.userId;
                     if (!userLikeCounters[userId]) userLikeCounters[userId] = 0;
                     userLikeCounters[userId] += eventData.likeCount || 1;
                     if (userLikeCounters[userId] >= eventRule.likesAmount) {
                         match = true;
                         userLikeCounters[userId] -= eventRule.likesAmount; 
                     }
                } else if (eventRule.why === triggerType) {
                    if (triggerType === 'gift-specific') {
                        if (String(eventRule.giftId) === String(eventData.giftId)) match = true;
                    } else {
                        match = true;
                    }
                }

                if (match) {
                    eventRule.actionsAll?.forEach(actionInfo => { 
                        const fullAction = currentProfile.actions.find(a => a.id === actionInfo.id); 
                        if(fullAction) actionQueue.push({ action: fullAction, eventData }); 
                    });
                    if (eventRule.actionsRandom?.length > 0) {
                        const randomIndex = Math.floor(Math.random() * eventRule.actionsRandom.length);
                        const fullAction = currentProfile.actions.find(a => a.id === eventRule.actionsRandom[randomIndex].id);
                        if (fullAction) actionQueue.push({ action: fullAction, eventData });
                    }
                    processQueue(); // Arranca el Carril 1
                }
            });
        }

        // 2. REVISAR ALERTAS GLOBALES -> Enviar a 'alertQueue'
        const alerts = globalAlerts || []; 
        alerts.forEach(alertRule => {
            if (!alertRule.enabled) return;
            
            let userMatch = (alertRule.who === 'all');
            if (alertRule.who === 'specific' && alertRule.specificUsers && eventData.uniqueId) {
                 if (alertRule.specificUsers.includes(eventData.uniqueId.toLowerCase())) userMatch = true;
            }
            if (!userMatch) return;

            let triggerMatch = false;
            if (alertRule.why === 'gift-specific' && triggerType === 'gift-specific') {
                if (String(alertRule.giftId) === String(eventData.giftId)) triggerMatch = true;
            } else if (alertRule.why === 'gift-min' && triggerType === 'gift-specific') {
                const totalValue = (eventData.diamondCount || 0) * (eventData.repeatCount || 1);
                if (totalValue >= (alertRule.minCoins || 1)) triggerMatch = true;
            } else if (alertRule.why === 'emote' && triggerType === 'emote') {
                if (eventData.emotes?.some(e => String(e.id) === String(alertRule.emoteId))) triggerMatch = true;
            } else if (alertRule.why === triggerType) {
                triggerMatch = true;
            }

            if (triggerMatch) {
                const actionToExecute = {
                    name: alertRule.name,
                    duration: alertRule.duration || 5,
                    audioAction: alertRule.audioAction,
                    mediaAction: alertRule.mediaAction,
                    image: alertRule.image
                };
                
                // ¡ESTA ES LA CLAVE! Enviar a la segunda cola
                alertQueue.push({ action: actionToExecute, eventData });
                processAlertQueue(); // Arranca el Carril 2
            }
        });
    }

    // --- INICIO DEL CAMBIO ---
    // --- FUNCIÓN SUBASTA (CORREGIDA PARA SUMA UNITARIA) ---
    async function updateAuction(giftData) {
        let subastaState = await window.electronAPI.getWidgetData('subasta');
        if (!subastaState || !subastaState.isRunning) return;

        // IMPORTANTE: Sumamos solo el valor de ESTE regalo individual.
        // Como la función se ejecuta varias veces en el combo, sumará 1+1+1...
        const coinsToAdd = (giftData.diamondCount || 0); 
        const userId = giftData.userId;

        if (coinsToAdd <= 0 || !userId) return;

        if (!subastaState.participants) subastaState.participants = {};

        let participant = subastaState.participants[userId];
        if (!participant) {
            participant = {
                userId: userId,
                nickname: giftData.nickname,
                uniqueId: giftData.uniqueId,
                profilePictureUrl: giftData.profilePictureUrl,
                coins: 0
            };
        }
        
        participant.coins += coinsToAdd;
        
        // Actualizar datos visuales
        participant.nickname = giftData.nickname;
        participant.profilePictureUrl = giftData.profilePictureUrl;

        subastaState.participants[userId] = participant;

        await window.electronAPI.updateWidget('subasta', subastaState);
        console.log(`[Subasta] ${giftData.nickname} +${coinsToAdd} (Total: ${participant.coins})`);
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
    // LÓGICA DEL SUB-MENÚ Y DESPLAZAMIENTO (ACTUALIZADO)
    // ==========================================================
    
    const btnActionsMain = document.getElementById('btn-actions-main');
    const submenuActions = document.getElementById('submenu-actions');
    const btnGalleryMain = document.getElementById('btn-gallery-main');
    const submenuGallery = document.getElementById('submenu-gallery');
    
    // NUEVAS VARIABLES PARA METAS
    const btnGoalsMain = document.getElementById('btn-goals-main');
    const submenuGoals = document.getElementById('submenu-goals');

    // 1. Toggle del Menú Acciones
    if(btnActionsMain) {
        btnActionsMain.addEventListener('click', () => {
            submenuActions.classList.toggle('open');
            btnActionsMain.classList.toggle('menu-open');
            // Cerrar los otros
            if(submenuGallery) submenuGallery.classList.remove('open');
            if(submenuGoals) submenuGoals.classList.remove('open');
        });
    }

    // 2. Toggle del Menú Galería
    if(btnGalleryMain) {
        btnGalleryMain.addEventListener('click', () => {
            submenuGallery.classList.toggle('open');
            // Cerrar los otros
            if(submenuActions) {
                submenuActions.classList.remove('open');
                btnActionsMain.classList.remove('menu-open');
            }
            if(submenuGoals) submenuGoals.classList.remove('open');
        });
    }

    // 3. Toggle del Menú Metas (NUEVO)
    if(btnGoalsMain) {
        btnGoalsMain.addEventListener('click', () => {
            submenuGoals.classList.toggle('open');
            // Cerrar los otros
            if(submenuActions) {
                submenuActions.classList.remove('open');
                btnActionsMain.classList.remove('menu-open');
            }
            if(submenuGallery) submenuGallery.classList.remove('open');
        });
    }

    // 4. Función Global de Scroll y Temblor
    window.scrollToSection = (targetId, tabId) => {
        // A. Cambiar a la pestaña correcta
        const mainTab = document.getElementById(tabId);
        if(mainTab && !mainTab.classList.contains('active')) {
            mainTab.click();
        }
        
        // B. Asegurar que el submenú correspondiente esté abierto
        if (tabId === 'btn-actions-main' && submenuActions) submenuActions.classList.add('open');
        if (tabId === 'btn-gallery-main' && submenuGallery) submenuGallery.classList.add('open');
        if (tabId === 'btn-goals-main' && submenuGoals) submenuGoals.classList.add('open'); // NUEVO

        // C. Scroll y Animación
        setTimeout(() => {
            let targetElement = document.getElementById(targetId);
            
            if(targetId.includes('list-container')) {
                targetElement = targetElement.closest('.list-view-container');
            }

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                targetElement.classList.remove('shake-active');
                void targetElement.offsetWidth; 
                targetElement.classList.add('shake-active');

                setTimeout(() => {
                    targetElement.classList.remove('shake-active');
                }, 1000);
            }
        }, 50);
    };

    // ==========================================================
    // Lógica para Copiar la URL (Acciones y Alertas)
    // ==========================================================
    function setupLinkCopy(elementId) {
        const linkElement = document.getElementById(elementId);
        if (linkElement) {
            linkElement.addEventListener('click', function(e) {
                e.preventDefault();
                const urlToCopy = this.getAttribute('data-url');
                
                if (navigator.clipboard && window.isSecureContext) { 
                    navigator.clipboard.writeText(urlToCopy).then(() => {
                        showToastNotification('✅ URL copiada en el portapapeles.'); 
                    }).catch(err => {
                        console.error('Error:', err);
                        showToastNotification('❌ Error al copiar.');
                    });
                } else {
                    alert('Tu navegador no soporta la copia automática.');
                }
            });
        }
    }

    // Activamos el link del modal de ACCIONES
    setupLinkCopy('copy-media-overlay-link');

    // Activamos el link del modal de ALERTAS (Nuevo)
    setupLinkCopy('copy-media-overlay-link-alerts');
    // ==========================================================
    
    // ==========================================================
    // LÓGICA DE META DE LIKES
    // ==========================================================
    const glMetaInput = document.getElementById('gl-meta-input');
    const glTitleInput = document.getElementById('gl-title-input');
    const glBehaviorSelect = document.getElementById('gl-behavior-select');
    const glActionSelect = document.getElementById('gl-action-select');
    const glActiveCheck = document.getElementById('gl-active-check');
    const glTestBtn = document.getElementById('gl-test-btn');
    const glResetBtn = document.getElementById('gl-reset-btn');
    const glCopyBtn = document.getElementById('gl-copy-btn');
    const glPreviewText = document.getElementById('gl-preview-text');

    // Estado interno
    let likeGoalState = {
        current: 0,
        meta: 1000,
        initialMeta: 1000, 
        title: "Like Goal"
    };

    // 1. Actualizar dropdown de acciones cuando cambia el perfil
    function updateGoalActions() {
        if (!glActionSelect) return;
        glActionSelect.innerHTML = '<option value="">Selecciona...</option>';
        const profile = profiles[activeProfileName];
        if (profile && profile.actions) {
            profile.actions.forEach(act => {
                const opt = document.createElement('option');
                opt.value = act.id;
                opt.textContent = act.name;
                glActionSelect.appendChild(opt);
            });
        }
    }
    // Vincular al cambio de perfil
    profileSelector.addEventListener('change', updateGoalActions);
    // Ejecutar al inicio (esperamos un poco a que carguen los datos)
    setTimeout(updateGoalActions, 500);

    // 2. Función para enviar datos al Overlay
    async function syncGoalOverlay() {
        // ELIMINADO: Ya no actualizamos glPreviewText manualmente
        /*
        if(glPreviewText) {
            glPreviewText.textContent = ...
        }
        */
        
        // Enviar a Electron -> Socket.io (Esto actualizará tanto el OBS como el Iframe de la app)
        if(window.electronAPI) {
            await window.electronAPI.updateWidget('goalLikes', likeGoalState);
        }
    }

    // Variable global al inicio del archivo o cerca de likeGoalState
    let lastGoalActionTime = 0; 
    
    // 4. Lógica de Meta Alcanzada (DEFINICIÓN COMPLETA)
    function goalReached() {
        const now = Date.now();
        // Si hace menos de 5 segundos que se ejecutó, ignorar
        if (now - lastGoalActionTime < 5000) return; 
        
        lastGoalActionTime = now;
        
        console.log("¡META ALCANZADA! Ejecutando acción...");
        
        // 1. Obtener el ID de la acción seleccionada en el dropdown
        const actionId = parseInt(glActionSelect.value);

        // 2. Si hay una acción válida seleccionada
        if (actionId) {
            const currentProfile = profiles[activeProfileName];
            
            // 3. Buscar la acción en el perfil actual
            const action = currentProfile.actions.find(a => a.id === actionId);
            
            if (action) {
                // 4. Ejecutar la acción (simulamos que la activó "SISTEMA")
                playAction(action.id, { nickname: 'META LIKES' });
                showToastNotification(`🎉 Meta alcanzada: Ejecutando "${action.name}"`);
            } else {
                console.warn("Acción no encontrada en el perfil.");
            }
        } else {
            console.log("No hay acción configurada para el final de la meta.");
        }
    }

    // 3. Procesar Likes (Lógica Híbrida Robusta)
    function addLikesToGoal(amount, totalLikesFromTikTok = null) {
        if (!glActiveCheck.checked) return;

        // Convertir a números seguros
        const incomingAmount = parseInt(amount) || 0;
        const incomingTotal = parseInt(totalLikesFromTikTok) || 0;

        console.log(`[GOAL] Input: +${incomingAmount} | Total TikTok: ${incomingTotal} | Local: ${likeGoalState.current}`);

        // Lógica de actualización
        if (incomingTotal > likeGoalState.current) {
            // CASO A: TikTok nos da un total mayor al que tenemos -> Usamos el de TikTok (Es el más preciso)
            likeGoalState.current = incomingTotal;
        } else {
            // CASO B: No hay total o es menor (bug de TikTok) -> Sumamos manualmente el paquetito
            likeGoalState.current += incomingAmount;
        }

        // Lógica de Aumento de Meta (Matemática corregida)
        if (glBehaviorSelect.value === 'increase') {
            // Si superamos la meta
            if (likeGoalState.current >= likeGoalState.meta) {
                // ESTO ES LO QUE EJECUTA LA ACCIÓN
                goalReached(); 

                // Calcular siguiente escalón.
                // Ejemplo: MetaBase 1000. Likes actuales 45300.
                // (45300 / 1000) = 45.3 -> Techo es 46.
                // Nueva meta = 46 * 1000 = 46000.
                const nextStep = Math.ceil((likeGoalState.current + 1) / likeGoalState.initialMeta);
                // Aseguramos que al menos sea 1 paso más que el actual
                const multiplier = Math.max(nextStep, (likeGoalState.meta / likeGoalState.initialMeta) + 1);
                
                likeGoalState.meta = multiplier * likeGoalState.initialMeta;
            }
        } else if (glBehaviorSelect.value === 'stop' && likeGoalState.current >= likeGoalState.meta) {
            goalReached();
            glActiveCheck.checked = false;
        }

        syncGoalOverlay();
    }

    // Listener de "Likes" (ACTUALIZADO)
    if (window.electronAPI.onLike) {
        window.electronAPI.onLike(data => {
            addLogEntry(`<i class="fas fa-heart" style="color: #ff005c;"></i> <b>${data.nickname}</b> ha dado ${data.likeCount} Me gusta.`, 'like');
            processTikTokEvent('likes', data);
            
            // Aquí enviamos AMBOS datos. El script decidirá cuál usar.
            addLikesToGoal(data.likeCount, data.totalLikeCount); 
        });
    }

    // 4. Listeners
    // Lógica del botón Testear
    if(glTestBtn) {
        glTestBtn.addEventListener('click', () => {
            // 1. Guardamos el valor actual para no perderlo
            const previousCurrent = likeGoalState.current;

            // 2. Llenamos la barra visualmente al 100%
            likeGoalState.current = likeGoalState.meta;
            syncGoalOverlay(); 
            showToastNotification("🧪 Testeando animación...");

            // 3. Después de 2.5 segundos, volvemos a 0 (Reset visual)
            setTimeout(() => {
                likeGoalState.current = 0; // O puedes poner 'previousCurrent' si prefieres que vuelva a donde estaba
                syncGoalOverlay();
            }, 2500);
        });
    }
    
    if(glResetBtn) glResetBtn.addEventListener('click', () => {
        // Cortar Meta: Resetea a valores iniciales
        likeGoalState.current = 0;
        likeGoalState.meta = parseInt(glMetaInput.value) || 1000;
        likeGoalState.initialMeta = likeGoalState.meta;
        syncGoalOverlay();
        showToastNotification("Meta reseteada");
    });

    if(glCopyBtn) {
        glCopyBtn.addEventListener('click', () => {
            const urlInput = document.getElementById('gl-url-input');
            navigator.clipboard.writeText(urlInput.value);
            showToastNotification("URL copiada");
        });
    }

    // Actualizar textos al escribir
    glTitleInput.addEventListener('input', (e) => {
        likeGoalState.title = e.target.value;
        syncGoalOverlay();
        saveAllData(); // <--- Guardar cambios
    });
    
    glMetaInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value) || 1000;
        likeGoalState.meta = val;
        likeGoalState.initialMeta = val;
        syncGoalOverlay();
        saveAllData(); // <--- Guardar cambios
    });

    // --- AGREGAR ESTO: Guardar la acción de Likes ---
    if (glActionSelect) {
        glActionSelect.addEventListener('change', (e) => {
            likeGoalState.actionId = e.target.value; 
            saveAllData(); 
        });
    }
    // FIN DE LÓGICA DE LIKES //
    
    // ==========================================================
    // LÓGICA DE META DE FOLLOWS (NUEVO)
    // ==========================================================
    const gfMetaInput = document.getElementById('gf-meta-input');
    const gfTitleInput = document.getElementById('gf-title-input');
    const gfBehaviorSelect = document.getElementById('gf-behavior-select');
    const gfActionSelect = document.getElementById('gf-action-select');
    const gfActiveCheck = document.getElementById('gf-active-check');
    const gfTestBtn = document.getElementById('gf-test-btn');
    const gfResetBtn = document.getElementById('gf-reset-btn');
    const gfCopyBtn = document.getElementById('gf-copy-btn');

    // Estado interno para Follows
    let followGoalState = {
        current: 0,
        meta: 100,       // Meta inicial típica para follows
        initialMeta: 100,
        title: "Follow Goal"
    };

    // 1. Actualizar dropdown de acciones (Follows)
    function updateGoalFollowActions() {
        if (!gfActionSelect) return;
        gfActionSelect.innerHTML = '<option value="">Selecciona...</option>';
        const profile = profiles[activeProfileName];
        if (profile && profile.actions) {
            profile.actions.forEach(act => {
                const opt = document.createElement('option');
                opt.value = act.id;
                opt.textContent = act.name;
                gfActionSelect.appendChild(opt);
            });
        }
    }
    profileSelector.addEventListener('change', updateGoalFollowActions);
    setTimeout(updateGoalFollowActions, 500);

    // 2. Enviar datos al Overlay Follows
    async function syncFollowGoalOverlay() {
        if(window.electronAPI) {
            await window.electronAPI.updateWidget('goalFollows', followGoalState);
        }
    }

    let lastFollowGoalActionTime = 0;

    // 3. Lógica de Meta Alcanzada (Follows)
    function followGoalReached() {
        const now = Date.now();
        if (now - lastFollowGoalActionTime < 5000) return;
        lastFollowGoalActionTime = now;
        
        console.log("¡META FOLLOWS ALCANZADA!");
        const actionId = parseInt(gfActionSelect.value);

        if (actionId) {
            const currentProfile = profiles[activeProfileName];
            const action = currentProfile.actions.find(a => a.id === actionId);
            if (action) {
                playAction(action.id, { nickname: 'META FOLLOWS' });
                showToastNotification(`🎉 Meta Follows: Ejecutando "${action.name}"`);
            }
        }
    }

    // 4. Procesar Follows
    function addFollowsToGoal(amount) {
        if (!gfActiveCheck.checked) return;
        
        followGoalState.current += amount;

        // Comportamiento al llegar a la meta
        if (gfBehaviorSelect.value === 'increase') {
            if (followGoalState.current >= followGoalState.meta) {
                followGoalReached();
                // Calcular siguiente meta (escalonada)
                const nextStep = Math.ceil((followGoalState.current + 1) / followGoalState.initialMeta);
                const multiplier = Math.max(nextStep, (followGoalState.meta / followGoalState.initialMeta) + 1);
                followGoalState.meta = multiplier * followGoalState.initialMeta;
            }
        } else if (gfBehaviorSelect.value === 'stop' && followGoalState.current >= followGoalState.meta) {
            followGoalReached();
            gfActiveCheck.checked = false;
        }

        syncFollowGoalOverlay();
        saveAllData(); 
    }

    // 5. Listener de API (Follow)
    window.electronAPI.onFollow(data => {
        // Log y evento estándar
        addLogEntry(`<i class="fas fa-user-plus" style="color: #ff4d4d;"></i> <b>${data.nickname}</b> te ha seguido.`, 'follow');
        processTikTokEvent('follow', data);
        
        // Sumar a la meta (1 follow = 1 punto)
        addFollowsToGoal(1);
    });

    // 6. Listeners de la Interfaz (Follows)
    if(gfTestBtn) {
        gfTestBtn.addEventListener('click', () => {
            const previousCurrent = followGoalState.current;
            followGoalState.current = followGoalState.meta; // Llenar al 100%
            syncFollowGoalOverlay(); 
            showToastNotification("🧪 Testeando Follow Goal...");
            setTimeout(() => {
                followGoalState.current = previousCurrent; // Restaurar
                syncFollowGoalOverlay();
            }, 2500);
        });
    }
    
    if(gfResetBtn) gfResetBtn.addEventListener('click', () => {
        followGoalState.current = 0;
        followGoalState.meta = parseInt(gfMetaInput.value) || 100;
        followGoalState.initialMeta = followGoalState.meta;
        syncFollowGoalOverlay();
        saveAllData();
        showToastNotification("Meta Follows reseteada");
    });

    if(gfCopyBtn) {
        gfCopyBtn.addEventListener('click', () => {
            const urlInput = document.getElementById('gf-url-input');
            navigator.clipboard.writeText(urlInput.value);
            showToastNotification("URL Follows copiada");
        });
    }

    // Inputs
    gfTitleInput.addEventListener('input', (e) => {
        followGoalState.title = e.target.value;
        syncFollowGoalOverlay();
        saveAllData();
    });
    
    gfMetaInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value) || 100;
        followGoalState.meta = val;
        followGoalState.initialMeta = val;
        syncFollowGoalOverlay();
        saveAllData();
    });

    // --- AGREGAR ESTO: Guardar la acción de Follows ---
    if (gfActionSelect) {
        gfActionSelect.addEventListener('change', (e) => {
            followGoalState.actionId = e.target.value; 
            saveAllData(); 
        });
    }

    // ==========================================
    // LÓGICA RESET TOP GIFT
    // ==========================================
    const btnResetTopGift = document.getElementById('btn-reset-top-gift');

    if (btnResetTopGift) {
        btnResetTopGift.addEventListener('click', async () => {
            if(await window.showCustomConfirm('¿Reiniciar el Mejor Regalo a 0?')) {
                // 1. Reiniciar variable local
                topGiftState = { 
                    username: 'Username', 
                    coins: 0, 
                    giftName: 'Default', 
                    giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8173e9b07875cca37caa5219e4903a40.png~tplv-obj.webp' 
                };

                // 2. Enviar a Electron (Main) para guardar en disco y actualizar overlay
                if (window.electronAPI) {
                    await window.electronAPI.updateWidget('topGift', topGiftState);
                    saveAllData(); // Guardar también en data.json por si acaso
                }

                showToastNotification("🏆 Mejor Regalo reiniciado.");
            }
        });
    }

    // LÓGICA RESET TOP STREAK
    const btnResetTopStreak = document.getElementById('btn-reset-top-streak');
    if (btnResetTopStreak) {
        btnResetTopStreak.addEventListener('click', async () => {
            if(await window.showCustomConfirm('¿Reiniciar la Mejor Racha a 0?')) {
                topStreakState = { 
                    username: 'Username', 
                    streakCount: 0, 
                    giftName: 'Default', 
                    giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp' 
                };
                if (window.electronAPI) {
                    await window.electronAPI.updateWidget('topStreak', topStreakState);
                    saveAllData();
                }
                showToastNotification("🔥 Mejor Racha reiniciada.");
            }
        });
    }
    
    // --- LÓGICA BOTÓN PROBAR CONEXIÓN MINECRAFT (CON MODAL PROPIO) ---
    const testMcBtn = document.getElementById('test-mc-connection-btn');
    
    // Referencias al modal de sistema
    const sysModal = document.getElementById('system-message-modal');
    const sysTitle = document.getElementById('sys-modal-title');
    const sysMessage = document.getElementById('sys-modal-message');
    const sysIcon = document.getElementById('sys-modal-icon');
    const sysDetails = document.getElementById('sys-modal-details');
    const sysCloseBtn = document.getElementById('sys-modal-close-btn');

    // Función para mostrar el modal
    function showSystemModal(type, title, message, details = null) {
        sysTitle.textContent = title;
        sysMessage.textContent = message;
        
        // Resetear clases e iconos
        sysIcon.className = '';
        sysDetails.style.display = 'none';

        if (type === 'success') {
            sysIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            sysIcon.classList.add('sys-icon-success');
            if (details) {
                sysDetails.style.display = 'block';
                sysDetails.innerHTML = details.replace(/\n/g, '<br>');
            }
        } else if (type === 'error') {
            sysIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            sysIcon.classList.add('sys-icon-error');
        } else {
            sysIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            sysIcon.classList.add('sys-icon-warning');
        }

        sysModal.classList.add('open');
    }

    // Cerrar modal
    if (sysCloseBtn) {
        sysCloseBtn.addEventListener('click', () => {
            sysModal.classList.remove('open');
        });
    }

    if (testMcBtn) {
        testMcBtn.addEventListener('click', async () => {
            const ip = document.getElementById('mc-ip').value.trim();
            const port = document.getElementById('mc-port').value.trim();
            const key = document.getElementById('mc-key').value.trim();

            const originalText = testMcBtn.innerHTML;
            testMcBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
            testMcBtn.disabled = true;

            if (window.electronAPI) {
                // Llamamos al backend
                const result = await window.electronAPI.testServerTapConnection({ ip, port, key });
                
                // Mostramos NUESTRO modal bonito dependiendo del resultado
                showSystemModal(result.status, result.title, result.message, result.details);
            } else {
                alert("Función solo disponible en escritorio.");
            }

            testMcBtn.innerHTML = originalText;
            testMcBtn.disabled = false;
        });
    }

    // 1. Referencias a los 4 inputs
    const mcInputs = {
        player: document.getElementById('mc-player-name'),
        ip: document.getElementById('mc-ip'),
        port: document.getElementById('mc-port'),
        key: document.getElementById('mc-key')
    };

    // Función para guardar todo
    const saveMcSettings = () => {
        if (window.electronAPI) {
            window.electronAPI.saveMcConfig({
                player: mcInputs.player.value.trim(),
                ip: mcInputs.ip.value.trim(),
                port: mcInputs.port.value.trim(),
                key: mcInputs.key.value.trim()
            });
        }
    };

    // 2. CARGAR DATOS AL INICIAR
    if (window.electronAPI) {
        window.electronAPI.getMcConfig().then(config => {
            // Si hay datos guardados, los ponemos. Si no, dejamos los del HTML.
            if (config.player) mcInputs.player.value = config.player;
            if (config.ip) mcInputs.ip.value = config.ip;
            if (config.port) mcInputs.port.value = config.port;
            if (config.key) mcInputs.key.value = config.key;
        });
    }

    // 3. GUARDAR DATOS AL ESCRIBIR (En cualquiera de los 4 inputs)
    // Usamos Object.values para recorrer los inputs y añadirles el listener
    Object.values(mcInputs).forEach(input => {
        if (input) {
            input.addEventListener('input', saveMcSettings);
        }
    });

    // ==========================================================
    // INICIALIZACIÓN FINAL
    // ==========================================================
    // await loadAllData();
    // initializeProfiles();
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
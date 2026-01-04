// scripts/subasta.js

document.addEventListener('DOMContentLoaded', () => {
    const subastaControlPanel = document.querySelector('.subasta-controls-panel');
    if (!subastaControlPanel) return;

    // Referencias
    const startBtn = document.querySelector('.subasta-actions-group button[title="Iniciar Subasta"]');
    const pauseBtn = document.querySelector('.subasta-actions-group button[title="Pausar Subasta"]');
    const resetTimerBtn = document.querySelector('.subasta-actions-group button[title="Reiniciar"]');
    const resetAllBtn = document.querySelector('.subasta-actions-group button[title="Resetear Total"]');
    
    const durationInput = document.getElementById('subasta-duration');
    const snipeInput = document.getElementById('subasta-snipe');
    const baseInput = document.getElementById('subasta-base');
    const participantsList = document.querySelector('.participants-list');
    const timerDisplay = document.getElementById('subasta-timer-display');
    const filasInput = document.getElementById('filas-overlay');
    
    // Estado local
    let timerInterval = null;
    let isRunning = false;
    let localState = { 
        timeLeft: 300, 
        inSnipeMode: false, 
        participants: {},
        isFinished: false 
    };

    function updateHelpLabels() {
        const snipeVal = document.getElementById('subasta-snipe').value;
        const baseVal = document.getElementById('subasta-base').value;
        document.getElementById('label-snipe-text').textContent = snipeVal;
        document.getElementById('label-base-text').textContent = baseVal;
    }

    // --- CARGA INICIAL ---
    async function initSubasta() {
        if (!window.electronAPI) return;

        const data = await window.electronAPI.getWidgetData('subasta');
        
        if (data) {
            if (data.config) {
                durationInput.value = data.config.duration || 300;
                snipeInput.value = data.config.snipe || 20;
                baseInput.value = data.config.base || 1;
                filasInput.value = data.config.rows || 3;
                document.getElementById('activate-widget-subasta').checked = data.config.active !== undefined ? data.config.active : true;
                document.getElementById('snipe-extra-subasta').checked = data.config.snipeExtra !== undefined ? data.config.snipeExtra : true;
                document.getElementById('sound-subasta').checked = data.config.sound !== undefined ? data.config.sound : true;
            }

            // Si viene del backend como 0 y no corre, es que terminó
            if (data.timeLeft === 0 && !data.isRunning) {
                 localState.isFinished = true;
                 localState.timeLeft = 0;
            } else {
                 localState.timeLeft = (data.timeLeft !== undefined) ? data.timeLeft : parseInt(durationInput.value);
                 localState.isFinished = false;
            }
            
            localState.inSnipeMode = data.inSnipeMode || false;
            localState.participants = data.participants || {};
            isRunning = data.isRunning || false;

            if (isRunning) { 
                isRunning = false; 
                window.electronAPI.updateWidget('subasta', { isRunning: false });
            }

            updateDashboardUI();
            renderParticipantsList(localState.participants);
            updateHelpLabels();
        } else {
            saveConfig();
            updateDashboardUI();
        }
    }

    async function saveConfig() {
        if (!window.electronAPI) return;
        const config = {
            duration: parseInt(durationInput.value) || 300,
            snipe: parseInt(snipeInput.value) || 20,
            base: parseInt(baseInput.value) || 1,
            rows: parseInt(filasInput.value) || 3,
            active: document.getElementById('activate-widget-subasta').checked,
            snipeExtra: document.getElementById('snipe-extra-subasta').checked,
            sound: document.getElementById('sound-subasta').checked
        };
        await window.electronAPI.updateWidget('subasta', { config: config });
    }

    // --- LISTENERS INPUTS ---
    durationInput.addEventListener('input', () => {
        saveConfig();
        // Si editamos el tiempo, salimos del modo "Finalizado" para mostrar el nuevo tiempo
        if (!isRunning) {
            localState.isFinished = false;
            localState.inSnipeMode = false;
            localState.timeLeft = parseInt(durationInput.value) || 0;
            updateDashboardUI();
            window.electronAPI.updateWidget('subasta', { timeLeft: localState.timeLeft });
        }
    });

    snipeInput.addEventListener('input', () => {
        saveConfig();
        updateHelpLabels(); // <-- Añadir aquí
    });
    baseInput.addEventListener('input', () => {
        saveConfig();
        updateHelpLabels(); // <-- Añadir aquí
    });
    filasInput.addEventListener('input', saveConfig);
    document.getElementById('activate-widget-subasta').addEventListener('change', saveConfig);
    document.getElementById('snipe-extra-subasta').addEventListener('change', saveConfig);
    document.getElementById('sound-subasta').addEventListener('change', saveConfig);

    // --- LÓGICA VISUAL ---
    function updateDashboardUI() {
        if (timerDisplay) {
            if (localState.isFinished) {
                timerDisplay.textContent = "FINALIZADO";
                timerDisplay.classList.remove('snipe-mode');
                timerDisplay.style.fontSize = "22px"; 
                return;
            }

            timerDisplay.style.fontSize = ""; 
            
            if (localState.inSnipeMode) {
                timerDisplay.textContent = localState.timeLeft;
                timerDisplay.classList.add('snipe-mode');
            } else {
                const val = localState.timeLeft < 0 ? 0 : localState.timeLeft;
                const m = Math.floor(val / 60);
                const s = val % 60;
                timerDisplay.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                timerDisplay.classList.remove('snipe-mode');
            }
        }
    }

    async function syncState() {
        if(window.electronAPI) {
            await window.electronAPI.updateWidget('subasta', {
                isRunning: isRunning,
                timeLeft: localState.timeLeft,
                inSnipeMode: localState.inSnipeMode,
            });
        }
        updateDashboardUI();
    }

    // --- TIMER ---
    function startTimer() {
        if (timerInterval) return;
        isRunning = true;
        
        timerInterval = setInterval(() => {
            const isSnipeExtra = document.getElementById('snipe-extra-subasta').checked;
            const snipeValue = parseInt(snipeInput.value, 10);

            if (localState.timeLeft > 0) {
                localState.timeLeft--;
                
                // MODO INDICADOR: Si Snipe Extra está apagado, activamos el color rojo 
                // cuando el tiempo principal llega al valor de snipe (ej. faltan 20 seg)
                if (!isSnipeExtra && localState.timeLeft <= snipeValue) {
                    localState.inSnipeMode = true;
                }
            } else {
                // LÓGICA DE FINALIZACIÓN O PRÓRROGA
                if (isSnipeExtra && !localState.inSnipeMode) {
                    // MODO TIEMPO EXTRA: Agregamos los segundos de snipe al llegar a 0
                    localState.inSnipeMode = true;
                    localState.timeLeft = snipeValue;
                } else {
                    // FIN DE LA SUBASTA
                    stopTimer();
                    calculateWinnerAndReset();
                }
            }
            syncState();
        }, 1000);
        syncState();
    }

    function stopTimer() {
        isRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        syncState();
    }

    // --- GANADOR Y ESTADO FINAL ---
    async function calculateWinnerAndReset() {
        const currentData = await window.electronAPI.getWidgetData('subasta');
        const parts = currentData?.participants || {};
        const minBase = parseInt(baseInput.value, 10) || 1;

        // Filtrar solo los que alcanzaron el mínimo de la BASE
        const qualified = Object.values(parts).filter(p => p.coins >= minBase);
        const sorted = qualified.sort((a, b) => b.coins - a.coins);

        if (sorted.length > 0) {
            const maxCoins = sorted[0].coins;
            const winners = sorted.filter(p => p.coins === maxCoins).slice(0, 3);

            await window.electronAPI.updateWidget('subasta', {
                isRunning: false,
                timeLeft: 0, 
                winners: winners 
            });
        } else {
            // Si nadie llegó a la base, no hay ganadores
            await window.electronAPI.updateWidget('subasta', {
                isRunning: false,
                timeLeft: 0,
                winners: null
            });
        }

        setTimeout(async () => {
            localState.isFinished = true;
            localState.timeLeft = 0;
            await window.electronAPI.updateWidget('subasta', {
                winners: null,
                isRunning: false,
                timeLeft: 0 
            });
            updateDashboardUI();
        }, 5000);
    }

    // --- BOTONES ---
    startBtn.addEventListener('click', () => {
        // Al iniciar, quitamos finalizado y ponemos el tiempo correcto si estaba en 0
        localState.isFinished = false;
        if (localState.timeLeft <= 0 && !localState.inSnipeMode) {
             localState.timeLeft = parseInt(durationInput.value, 10);
        }
        // Forzar actualización inmediata
        window.electronAPI.updateWidget('subasta', { timeLeft: localState.timeLeft });
        updateDashboardUI();
        startTimer();
    });

    pauseBtn.addEventListener('click', stopTimer);

    resetTimerBtn.addEventListener('click', () => {
        stopTimer();
        localState.isFinished = false;
        localState.timeLeft = parseInt(durationInput.value, 10);
        localState.inSnipeMode = false;
        window.electronAPI.updateWidget('subasta', { 
            winnerInfo: null, 
            timeLeft: localState.timeLeft 
        });
        syncState();
    });

    resetAllBtn.addEventListener('click', async () => {
        if (await window.showCustomConfirm('¿Resetear totalmente?')) {
            stopTimer();
            localState.isFinished = false;
            localState.timeLeft = parseInt(durationInput.value, 10);
            localState.inSnipeMode = false;
            localState.participants = {};
            
            await window.electronAPI.updateWidget('subasta', { 
                participants: null, 
                winnerInfo: null,
                winners: null, // Limpiar también el empate
                isRunning: false,
                timeLeft: localState.timeLeft,
                inSnipeMode: false
            });
            renderParticipantsList({});
            updateDashboardUI();
        }
    });

    // POLLING
    setInterval(async () => {
        if (!window.electronAPI) return;
        const data = await window.electronAPI.getWidgetData('subasta');
        if (data && data.participants) {
            renderParticipantsList(data.participants);
        }
    }, 1000);

    // RENDER (Input seguro)
    function renderParticipantsList(participantsObj) {
        if (!participantsObj || Object.keys(participantsObj).length === 0) {
            participantsList.innerHTML = '<p class="no-participants" style="color: #888; text-align: center; padding: 10px;">Aún no hay participantes.</p>';
            return;
        }

        const noPartMsg = participantsList.querySelector('.no-participants');
        if (noPartMsg) noPartMsg.remove();

        const activeEl = document.activeElement;
        const activeId = activeEl ? activeEl.id : null;

        const sorted = Object.values(participantsObj).sort((a, b) => b.coins - a.coins);
        const activeUserIds = new Set();

        sorted.forEach((p, index) => {
            activeUserIds.add(p.userId);
            let row = document.getElementById(`row-${p.userId}`);

            if (!row) {
                row = document.createElement('div');
                row.id = `row-${p.userId}`;
                row.className = 'participant-row-panel';
                row.style.display = 'grid';
                row.style.gridTemplateColumns = '30px 2fr 1fr auto'; 
                row.style.alignItems = 'center';
                row.style.gap = '10px';
                row.style.padding = '8px 0';
                row.style.borderBottom = '1px solid #333';

                row.innerHTML = `
                    <div class="rank-num" style="color: #888; font-size: 14px;"></div> 
                    <div class="player-info-container" style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                        <div class="participant-pfp" style="width: 30px; height: 30px; border-radius: 50%; background-size: cover; background-position: center; flex-shrink: 0;"></div>
                        <div class="player-info" style="display: flex; flex-direction: column; min-width: 0;">
                            <span class="nickname" style="font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px;"></span>
                            <span class="username" style="font-size: 11px; color: #aaa;"></span>
                        </div>
                    </div>
                    <div class="coins-display" style="font-weight: bold; color: #ffeb3b; text-align: center; font-size: 16px;">0</div>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        <input type="number" id="add-input-${p.userId}" placeholder="0" 
                               style="width: 50px; background: #333; border: 1px solid #555; color: white; border-radius: 4px; padding: 4px; text-align: center; outline: none;">
                        <button onclick="addCoinsToUser('${p.userId}')" title="Sumar" style="background: #10c35b; color: white; border: none; border-radius: 4px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-plus"></i></button>
                        <button onclick="kickUser('${p.userId}')" title="Expulsar" style="background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-left: 5px;"><i class="fas fa-times"></i></button>
                    </div>
                `;
                const nextNode = participantsList.children[index];
                if (nextNode) participantsList.insertBefore(row, nextNode);
                else participantsList.appendChild(row);
            } else {
                const currentIndexNode = participantsList.children[index];
                if (currentIndexNode !== row) {
                    if (currentIndexNode) participantsList.insertBefore(row, currentIndexNode);
                    else participantsList.appendChild(row);
                }
            }

            row.querySelector('.rank-num').textContent = index + 1;
            const pfpEl = row.querySelector('.participant-pfp');
            if (p.profilePictureUrl) {
                pfpEl.style.backgroundImage = `url('${p.profilePictureUrl}')`;
                pfpEl.classList.remove('default-avatar-icon');
            } else {
                // Si no hay foto, borramos el style y ponemos la clase de la silueta
                pfpEl.style.backgroundImage = ''; 
                pfpEl.classList.add('default-avatar-icon');
            }
            row.querySelector('.nickname').textContent = p.nickname;
            row.querySelector('.username').textContent = `@${p.uniqueId || 'unknown'}`;
            row.querySelector('.coins-display').textContent = p.coins;
        });

        const allRows = participantsList.querySelectorAll('.participant-row-panel');
        allRows.forEach(row => {
            const id = row.id.replace('row-', '');
            if (!activeUserIds.has(id)) row.remove();
        });

        if (activeId) {
            const el = document.getElementById(activeId);
            if (el) el.focus();
        }
    }

    window.addCoinsToUser = async (userId) => {
        const input = document.getElementById(`add-input-${userId}`);
        const amount = parseInt(input.value);
        if (!amount || isNaN(amount)) return; 
        const data = await window.electronAPI.getWidgetData('subasta');
        if (data && data.participants && data.participants[userId]) {
            data.participants[userId].coins += amount;
            await window.electronAPI.updateWidget('subasta', { participants: data.participants });
            input.value = ''; 
        }
    };

    window.kickUser = async (userId) => {
        // Cambiado de confirm() nativo a tu showCustomConfirm()
        if(await window.showCustomConfirm("¿Seguro que quieres expulsar a este participante?")) {
            const data = await window.electronAPI.getWidgetData('subasta');
            if(data && data.participants && data.participants[userId]) {
                delete data.participants[userId];
                await window.electronAPI.updateWidget('subasta', { participants: data.participants });
            }
        }
    };

    // --- LÓGICA DE INGRESO MANUAL DE PARTICIPANTES ---
    const btnSumarManual = document.querySelector('.sum-coins-btn');
    const inputNombreManual = document.getElementById('name-subasta');
    const inputMonedasManual = document.getElementById('coins-subasta');

    if (btnSumarManual) {
        btnSumarManual.addEventListener('click', async () => {
            const nombre = inputNombreManual.value.trim();
            const monedas = parseInt(inputMonedasManual.value, 10) || 0;

            // Validaciones básicas (Cambiado a tus alertas personalizadas)
            if (!nombre) {
                window.showCustomAlert("⚠️ Por favor, ingresa un nombre.");
                return;
            }
            if (isNaN(monedas) || monedas <= 0) {
                window.showCustomAlert("⚠️ Ingresa una cantidad válida de monedas.");
                return;
            }

            // Obtener datos actuales de la subasta
            const data = await window.electronAPI.getWidgetData('subasta');
            const participants = data?.participants || {};

            // 1. Buscar si ya existe alguien con ese nombre (ignora mayúsculas/minúsculas)
            let userIdEncontrado = Object.keys(participants).find(id => 
                participants[id].nickname.toLowerCase() === nombre.toLowerCase()
            );

            if (userIdEncontrado) {
                // Caso A: Ya existe, le sumamos las monedas
                participants[userIdEncontrado].coins += monedas;
                console.log(`[Manual] Sumando ${monedas} a ${nombre} existente.`);
            } else {
                // Caso B: No existe, creamos un nuevo "ID Manual" único
                const manualId = `manual_${Date.now()}`;
                participants[manualId] = {
                    userId: manualId,
                    nickname: nombre,
                    uniqueId: nombre.toLowerCase(),
                    profilePictureUrl: '', // Quedará con la silueta gris por defecto
                    coins: monedas
                };
                console.log(`[Manual] Agregando nuevo participante: ${nombre}.`);
            }

            // 2. Guardar en el backend
            await window.electronAPI.updateWidget('subasta', { participants: participants });

            // 3. Limpiar inputs
            inputNombreManual.value = '';
            inputMonedasManual.value = '';
        });
    }

    initSubasta();
});
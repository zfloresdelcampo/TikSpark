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
    
    // Estado local
    let timerInterval = null;
    let isRunning = false;
    let localState = { 
        timeLeft: 300, 
        inSnipeMode: false, 
        participants: {},
        isFinished: false 
    };

    // --- CARGA INICIAL ---
    async function initSubasta() {
        if (!window.electronAPI) return;

        const data = await window.electronAPI.getWidgetData('subasta');
        
        if (data) {
            if (data.config) {
                durationInput.value = data.config.duration || 300;
                snipeInput.value = data.config.snipe || 20;
                baseInput.value = data.config.base || 1;
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
            base: parseInt(baseInput.value) || 1
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

    snipeInput.addEventListener('input', saveConfig);
    baseInput.addEventListener('input', saveConfig);

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
            if (localState.timeLeft > 0) {
                localState.timeLeft--;
            } else {
                if (!localState.inSnipeMode) {
                    localState.inSnipeMode = true;
                    localState.timeLeft = parseInt(snipeInput.value, 10);
                } else {
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
        const sorted = Object.values(parts).sort((a, b) => b.coins - a.coins);
        const winner = sorted[0];

        if (winner) {
            await window.electronAPI.updateWidget('subasta', {
                isRunning: false,
                timeLeft: 0, 
                winnerInfo: {
                    nickname: winner.nickname,
                    profilePictureUrl: winner.profilePictureUrl,
                    coins: winner.coins
                }
            });
        }

        // Esperar 5 Segundos y cambiar a estado FINALIZADO (sin reiniciar tiempo aun)
        setTimeout(async () => {
            localState.inSnipeMode = false;
            localState.isFinished = true; // Aquí activamos el texto
            localState.timeLeft = 0;      // Tiempo a 0

            await window.electronAPI.updateWidget('subasta', {
                winnerInfo: null, // Quitar popup
                isRunning: false,
                inSnipeMode: false,
                timeLeft: 0 // Enviar 0 al overlay para que ponga FINALIZADO
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
        if (confirm('¿Resetear TOTALMENTE?')) {
            stopTimer();
            localState.isFinished = false;
            localState.timeLeft = parseInt(durationInput.value, 10);
            localState.inSnipeMode = false;
            localState.participants = {};
            
            await window.electronAPI.updateWidget('subasta', { 
                participants: null, 
                winnerInfo: null,
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
            row.querySelector('.participant-pfp').style.backgroundImage = `url('${p.profilePictureUrl || ''}')`;
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
        if(confirm("¿Expulsar?")) {
            const data = await window.electronAPI.getWidgetData('subasta');
            if(data && data.participants && data.participants[userId]) {
                delete data.participants[userId];
                await window.electronAPI.updateWidget('subasta', { participants: data.participants });
            }
        }
    };

    initSubasta();
});
// scripts/subasta.js

document.addEventListener('DOMContentLoaded', () => {
    const subastaControlPanel = document.querySelector('.subasta-controls-panel');
    if (!subastaControlPanel) return;

    const startBtn = document.querySelector('.subasta-actions-group button[title="Iniciar Subasta"]');
    const pauseBtn = document.querySelector('.subasta-actions-group button[title="Pausar Subasta"]');
    const resetTimerBtn = document.querySelector('.subasta-actions-group button[title="Reiniciar"]');
    const resetAllBtn = document.querySelector('.subasta-actions-group button[title="Resetear Total"]');
    
    const durationInput = document.getElementById('subasta-duration');
    const snipeInput = document.getElementById('subasta-snipe');
    const participantsList = document.querySelector('.participants-list');
    const timerDisplay = document.getElementById('subasta-timer-display');
    
    let timerInterval = null;
    let isRunning = false;
    let localState = { timeLeft: 300, inSnipeMode: false, participants: {} };

    // --- LÓGICA DE ACTUALIZACIÓN LOCAL ---
    
    async function syncState() {
        if(window.electronAPI) {
            // Enviamos el estado completo al backend para que el overlay lo vea
            await window.electronAPI.updateWidget('subasta', {
                isRunning: isRunning,
                timeLeft: localState.timeLeft,
                inSnipeMode: localState.inSnipeMode,
                // Nota: participants se actualiza en script.js cuando entran regalos,
                // pero aquí lo leemos para mostrarlo en la lista.
            });
        }
        updateDashboardUI();
    }

    function updateDashboardUI() {
        if (timerDisplay) {
            if (localState.inSnipeMode) {
                timerDisplay.textContent = localState.timeLeft;
                timerDisplay.classList.add('snipe-mode');
            } else {
                const m = Math.floor(localState.timeLeft / 60);
                const s = localState.timeLeft % 60;
                timerDisplay.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                timerDisplay.classList.remove('snipe-mode');
            }
        }
    }

    // Timer Principal (Corre en el Dashboard)
    function startTimer() {
        if (timerInterval) return;
        isRunning = true;
        
        timerInterval = setInterval(() => {
            if (localState.timeLeft > 0) {
                localState.timeLeft--;
            } else {
                // Fin del tiempo
                if (!localState.inSnipeMode) {
                    // Entrar en Snipe
                    localState.inSnipeMode = true;
                    localState.timeLeft = parseInt(snipeInput.value, 10);
                } else {
                    // Fin total (Ganador)
                    stopTimer();
                    calculateWinner();
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

    async function calculateWinner() {
        // Pedimos los participantes más recientes al backend
        const currentData = await window.electronAPI.getWidgetData('subasta');
        const parts = currentData?.participants || {};
        const sorted = Object.values(parts).sort((a, b) => b.coins - a.coins);
        const winner = sorted[0];

        if (winner) {
            // Enviamos la info del ganador al overlay
            await window.electronAPI.updateWidget('subasta', {
                isRunning: false,
                winnerInfo: {
                    nickname: winner.nickname,
                    profilePictureUrl: winner.profilePictureUrl,
                    coins: winner.coins
                }
            });
        }
    }

    // Listeners de Botones
    startBtn.addEventListener('click', () => {
        // Si estaba en 0 o detenido, reiniciamos si es necesario
        if (localState.timeLeft <= 0 && !localState.inSnipeMode) {
             localState.timeLeft = parseInt(durationInput.value, 10);
        }
        startTimer();
    });

    pauseBtn.addEventListener('click', stopTimer);

    resetTimerBtn.addEventListener('click', () => {
        stopTimer();
        localState.timeLeft = parseInt(durationInput.value, 10);
        localState.inSnipeMode = false;
        // Limpiar ganador
        window.electronAPI.updateWidget('subasta', { winnerInfo: null });
        syncState();
    });

    resetAllBtn.addEventListener('click', async () => {
        if (confirm('¿Resetear TOTALMENTE la subasta (borrar participantes)?')) {
            stopTimer();
            localState = { timeLeft: parseInt(durationInput.value, 10), inSnipeMode: false, participants: {} };
            // Borramos todo en el backend
            await window.electronAPI.updateWidget('subasta', { // Sobrescribimos con null para borrar
                participants: null, 
                winnerInfo: null,
                isRunning: false,
                timeLeft: localState.timeLeft,
                inSnipeMode: false
            });
            renderParticipantsList({}); // Limpiar lista visual
            syncState();
        }
    });

    // --- POLLING: Actualizar lista de participantes ---
    // Como script.js mete los regalos, necesitamos leerlos aquí periódicamente
    setInterval(async () => {
        if (!window.electronAPI) return;
        const data = await window.electronAPI.getWidgetData('subasta');
        if (data && data.participants) {
            renderParticipantsList(data.participants);
        }
    }, 1000); // Actualizar lista cada segundo

    function renderParticipantsList(participantsObj) {
        participantsList.innerHTML = '';
        if (!participantsObj || Object.keys(participantsObj).length === 0) {
            participantsList.innerHTML = '<p class="no-participants">Aún no hay participantes.</p>';
            return;
        }

        const sorted = Object.values(participantsObj).sort((a, b) => b.coins - a.coins);

        sorted.forEach((p, index) => {
            const row = document.createElement('div');
            row.className = 'participant-row-panel';
            row.innerHTML = `
                <div>${index + 1}</div> 
                <div class="player-info-container">
                    <div class="participant-pfp" style="background-image: url('${p.profilePictureUrl || ''}')"></div>
                    <div class="player-info">
                        <span class="nickname">${p.nickname}</span>
                        <span class="username">@${p.uniqueId || 'unknown'}</span>
                    </div>
                </div>
                <div class="coins">${p.coins}</div>
                <div><button class="kick-btn" onclick="kickUser('${p.userId}')">X</button></div>
            `;
            participantsList.appendChild(row);
        });
    }

    // Función global para el botón de expulsar
    window.kickUser = async (userId) => {
        if(confirm("¿Expulsar participante?")) {
            const data = await window.electronAPI.getWidgetData('subasta');
            if(data && data.participants && data.participants[userId]) {
                delete data.participants[userId];
                await window.electronAPI.updateWidget('subasta', { participants: data.participants });
            }
        }
    };
});
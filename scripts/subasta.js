// scripts/subasta.js

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') return;

    const dbRef = firebase.database().ref('widgets/subasta');
    const startBtn = document.querySelector('.subasta-actions-group button[title="Iniciar Subasta"]');
    const pauseBtn = document.querySelector('.subasta-actions-group button[title="Pausar Subasta"]');
    const resetTimerBtn = document.querySelector('.subasta-actions-group button[title="Reiniciar"]');
    const resetAllBtn = document.querySelector('.subasta-actions-group button[title="Resetear Total"]');
    
    const durationInput = document.getElementById('subasta-duration');
    const snipeInput = document.getElementById('subasta-snipe');
    const participantsList = document.querySelector('.participants-list');
    const winnerOverlay = document.getElementById('winner-overlay');
    const winnerPfp = document.getElementById('winner-pfp');
    const winnerName = document.getElementById('winner-name');
    const winnerCoinAmount = document.getElementById('winner-coin-amount');
    const timerDisplay = document.getElementById('subasta-timer-display');
    
    // Creamos el elemento del mensaje aquí para tenerlo listo
    const noParticipantsMessage = document.createElement('p');
    noParticipantsMessage.className = 'no-participants';
    noParticipantsMessage.textContent = 'Aún no hay participantes.';
    
    let timerInterval = null;

    function formatTime(seconds) {
        if (typeof seconds !== 'number' || seconds < 0) { seconds = 0; }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function startLocalTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            dbRef.transaction(currentData => {
                if (!currentData || !currentData.isRunning) return;
                if (currentData.timeLeft > 0) {
                    currentData.timeLeft--;
                } else { // El temporizador ha llegado a cero
                    if (!currentData.inSnipeMode) {
                        // Entra en modo snipe
                        currentData.inSnipeMode = true;
                        currentData.timeLeft = parseInt(snipeInput.value, 10);
                    } else {
                        // ¡FIN DE LA SUBASTA!
                        currentData.isRunning = false;

                        // Encontramos al ganador
                        const participants = currentData.participants || {};
                        const sortedParticipants = Object.values(participants).sort((a, b) => b.coins - a.coins);
                        const winner = sortedParticipants[0];

                        if (winner) {
                            // Guardamos la información del ganador en Firebase
                            currentData.winnerInfo = {
                                nickname: winner.nickname,
                                profilePictureUrl: winner.profilePictureUrl,
                                coins: winner.coins
                            };
                        }
                    }
                }
                return currentData;
            });
        }, 900);
    }

    function stopLocalTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // --- LÓGICA DE BOTONES (Sin cambios) ---
    startBtn.addEventListener('click', () => {
        dbRef.child('isRunning').set(true);
        dbRef.get().then(snapshot => {
            const data = snapshot.val();
            if (!data || data.timeLeft <= 0) {
                dbRef.update({
                    timeLeft: parseInt(durationInput.value, 10),
                    inSnipeMode: false
                });
            }
        });
    });
    pauseBtn.addEventListener('click', () => dbRef.child('isRunning').set(false));
    resetTimerBtn.addEventListener('click', () => {
        dbRef.update({
            isRunning: false,
            timeLeft: parseInt(durationInput.value, 10),
            inSnipeMode: false
        });
    });
    resetAllBtn.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres resetear la subasta por completo?')) {
            dbRef.set({
                isRunning: false,
                timeLeft: parseInt(durationInput.value, 10),
                inSnipeMode: false,
                participants: {},
                winnerInfo: null // ¡AÑADE ESTA LÍNEA!
            });
        }
    });
    
    // --- SINCRONIZACIÓN CON FIREBASE ---
    dbRef.child('isRunning').on('value', snapshot => {
        if (snapshot.val()) {
            startLocalTimer();
        } else {
            stopLocalTimer();
        }
    });

    dbRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data || !timerDisplay) return;
        if (data.inSnipeMode) {
            timerDisplay.textContent = data.timeLeft;
            timerDisplay.classList.add('snipe-mode');
        } else {
            timerDisplay.textContent = formatTime(data.timeLeft);
            timerDisplay.classList.remove('snipe-mode');
        }

        if (data.winnerInfo && !data.isRunning) {
            // Hay un ganador y la subasta ha terminado, ¡mostramos la pantalla!
            
            // Llenamos los datos
            winnerPfp.style.backgroundImage = `url('${data.winnerInfo.profilePictureUrl || ''}')`;
            winnerName.textContent = data.winnerInfo.nickname;
            winnerCoinAmount.textContent = data.winnerInfo.coins;

            // Mostramos el overlay
            winnerOverlay.style.display = 'flex';

            // ¡Lanzamos el confeti!
            confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            });

        } else {
            // Si no hay ganador o la subasta está activa, nos aseguramos de que esté oculto
            winnerOverlay.style.display = 'none';
        }
    });

    // --- GESTIÓN EFICIENTE DE LA LISTA DE PARTICIPANTES ---
    const participantsRef = dbRef.child('participants');
    
    // --- FUNCIÓN MEJORADA ---
    const checkEmptyList = () => {
        // Buscamos si hay alguna fila de participante real
        const hasParticipants = participantsList.querySelector('.participant-row-panel');
        // Buscamos si el mensaje de "no hay participantes" ya está en la lista
        const messageExists = participantsList.querySelector('.no-participants');

        if (hasParticipants && messageExists) {
            // Si HAY participantes Y el mensaje existe, lo quitamos.
            participantsList.removeChild(messageExists);
        } else if (!hasParticipants && !messageExists) {
            // Si NO hay participantes Y el mensaje NO existe, lo añadimos.
            participantsList.appendChild(noParticipantsMessage);
        }
    };

    participantsRef.on('child_added', (snapshot) => {
        const p = snapshot.val();
        const userId = snapshot.key;
        const row = document.createElement('div');
        row.className = 'participant-row-panel';
        row.dataset.userid = userId;
        row.innerHTML = `
            <div>-</div> 
            <div class="player-info-container">
                <div class="participant-pfp" style="background-image: url('${p.profilePictureUrl || ''}')"></div>
                <div class="player-info">
                    <span class="nickname">${p.nickname}</span>
                    <span class="username">@${p.uniqueId || 'unknown'}</span>
                </div>
            </div>
            <div class="coins">${p.coins || 0}</div>
            <div><button class="kick-btn">Expulsar</button></div>
        `;
        participantsList.appendChild(row);
        checkEmptyList(); // Comprueba el estado de la lista
        sortParticipantList();
    });

    participantsRef.on('child_changed', (snapshot) => {
        const p = snapshot.val();
        const userId = snapshot.key;
        const rowToUpdate = participantsList.querySelector(`[data-userid="${userId}"]`);
        if (rowToUpdate) {
            rowToUpdate.querySelector('.participant-pfp').style.backgroundImage = `url('${p.profilePictureUrl || ''}')`;
            rowToUpdate.querySelector('.nickname').textContent = p.nickname;
            rowToUpdate.querySelector('.username').textContent = `@${p.uniqueId || 'unknown'}`;
            rowToUpdate.querySelector('.coins').textContent = p.coins || 0;
        }
        sortParticipantList();
    });

    participantsRef.on('child_removed', (snapshot) => {
        const userId = snapshot.key;
        const rowToRemove = participantsList.querySelector(`[data-userid="${userId}"]`);
        if (rowToRemove) {
            participantsList.removeChild(rowToRemove);
        }
        checkEmptyList(); // Vuelve a comprobar tras eliminar
        sortParticipantList();
    });

    function sortParticipantList() {
        const rows = Array.from(participantsList.querySelectorAll('.participant-row-panel'));
        rows.sort((a, b) => {
            const coinsA = parseInt(a.querySelector('.coins').textContent, 10);
            const coinsB = parseInt(b.querySelector('.coins').textContent, 10);
            return coinsB - coinsA;
        });
        rows.forEach((row, index) => {
            row.firstElementChild.textContent = index + 1;
            participantsList.appendChild(row);
        });
    }

    participantsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('kick-btn')) {
            const userRow = e.target.closest('.participant-row-panel');
            const userId = userRow.dataset.userid;
            if (userId && confirm(`¿Seguro que quieres expulsar a este participante de la subasta?`)) {
                participantsRef.child(userId).remove();
            }
        }
    });
    
    // Hacemos una comprobación inicial al cargar la página
    checkEmptyList();
});

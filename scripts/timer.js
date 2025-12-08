document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnRestart = document.getElementById('btn-timer-restart');
    const btnAdd = document.getElementById('btn-timer-add');
    const btnSub = document.getElementById('btn-timer-sub');
    const inputManual = document.getElementById('timer-manual-input');
    const inputStartVal = document.getElementById('timer-cfg-start');
    const inputCapVal = document.getElementById('timer-cfg-cap-value');
    const checkCap = document.getElementById('timer-cfg-cap-enable');

    // Inputs de Interacción
    const inputCoins = document.getElementById('timer-add-coins');
    const inputSub = document.getElementById('timer-add-sub');
    const inputFollow = document.getElementById('timer-add-follow');
    const inputShare = document.getElementById('timer-add-share');
    const inputLike = document.getElementById('timer-add-like');
    const inputChat = document.getElementById('timer-add-chat');

    async function sendTimerCommand(command, value = null) {
        if (window.electronAPI) {
            await window.electronAPI.updateWidget('timer', { command, value });
        }
    }

    // --- NUEVO: CARGAR CONFIGURACIÓN GUARDADA AL ABRIR ---
    function loadSavedConfig() {
        const raw = localStorage.getItem('tikspark_timer_config');
        if (raw) {
            const config = JSON.parse(raw);
            if(inputCoins) inputCoins.value = config.valCoins || 0;
            if(inputSub) inputSub.value = config.valSub || 0;
            if(inputFollow) inputFollow.value = config.valFollow || 0;
            if(inputShare) inputShare.value = config.valShare || 0;
            if(inputLike) inputLike.value = config.valLike || 0;
            if(inputChat) inputChat.value = config.valChat || 0;
            
            if(inputCapVal) inputCapVal.value = (config.maxTime / 60) || 180;
            if(checkCap) checkCap.checked = (config.maxTime > 0);
        }
    }

    // --- GUARDAR CONFIGURACIÓN ---
    function saveConfig() {
        const configData = {
            maxTime: checkCap.checked ? (parseInt(inputCapVal.value) * 60) : 0,
            valCoins: parseInt(inputCoins.value) || 0,
            valSub: parseInt(inputSub.value) || 0,
            valFollow: parseInt(inputFollow.value) || 0,
            valShare: parseInt(inputShare.value) || 0,
            valLike: parseFloat(inputLike.value) || 0,
            valChat: parseInt(inputChat.value) || 0
        };
        localStorage.setItem('tikspark_timer_config', JSON.stringify(configData));
        sendTimerCommand('config', { maxTime: configData.maxTime });
    }

    // 1. CARGAR DATOS PRIMERO
    loadSavedConfig();

    // 2. LISTENERS DE BOTONES
    if (btnStart) btnStart.addEventListener('click', () => sendTimerCommand('start'));
    if (btnPause) btnPause.addEventListener('click', () => sendTimerCommand('pause'));
    if (btnRestart) btnRestart.addEventListener('click', () => {
        const startVal = parseInt(inputStartVal.value) || 300;
        sendTimerCommand('restart', startVal);
    });
    if (btnAdd) btnAdd.addEventListener('click', () => sendTimerCommand('add', parseInt(inputManual.value)||60));
    if (btnSub) btnSub.addEventListener('click', () => sendTimerCommand('sub', parseInt(inputManual.value)||60));

    // 3. LISTENERS DE CONFIG (Guardar al escribir)
    const allInputs = [checkCap, inputCapVal, inputCoins, inputSub, inputFollow, inputShare, inputLike, inputChat];
    allInputs.forEach(el => {
        if(el) {
            el.addEventListener('change', saveConfig);
            el.addEventListener('input', saveConfig);
        }
    });
});
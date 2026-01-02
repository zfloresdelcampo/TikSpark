window.topGiftersData = {
    participants: {},
    rows: 6,
    active: true
};

window.processTopGifter = function(data) {
    if (!window.topGiftersData.active) return;
    const { userId, nickname, profilePictureUrl, diamondCount, repeatEnd } = data;
    if (repeatEnd) return; 

    if (!window.topGiftersData.participants[userId]) {
        window.topGiftersData.participants[userId] = { nickname: nickname, avatar: profilePictureUrl, coins: 0 };
    }
    window.topGiftersData.participants[userId].coins += diamondCount;
    syncTopGifters();
};

async function syncTopGifters() {
    if (window.electronAPI) {
        await window.electronAPI.updateWidget('topGifters', window.topGiftersData);
        if (typeof window.saveAllData === 'function') window.saveAllData();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    
    // === NUEVO: CARGAR DATOS PERSISTENTES AL ABRIR EL PROGRAMA ===
    if (window.electronAPI) {
        const saved = await window.electronAPI.getWidgetData('topGifters');
        if (saved && saved.participants) {
            window.topGiftersData.participants = saved.participants;
            window.topGiftersData.rows = saved.rows || 6;
            window.topGiftersData.active = saved.active !== undefined ? saved.active : true;
            console.log("✅ Top Gifters recuperados del disco.");
        }
    }
    // ===========================================================

    const rowsInput = document.getElementById('rows-count-topgifters');
    const activeCheck = document.getElementById('activate-widget-topgifters');
    
    // CORRECCIÓN DEL SELECTOR DEL BOTÓN RESET
    // Buscamos el botón que está dentro de la tarjeta de Top Gifters y contiene el texto "Reset"
    const btnReset = Array.from(document.querySelectorAll('#card-top-gifters .action-btn'))
                          .find(btn => btn.textContent.includes('Reset'));

    if (rowsInput) {
        rowsInput.value = window.topGiftersData.rows;
        rowsInput.addEventListener('change', () => {
            window.topGiftersData.rows = parseInt(rowsInput.value) || 6;
            syncTopGifters();
        });
    }

    if (activeCheck) {
        activeCheck.checked = window.topGiftersData.active;
        activeCheck.addEventListener('change', () => {
            window.topGiftersData.active = activeCheck.checked;
            syncTopGifters();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (await window.showCustomConfirm('¿Reiniciar la tabla de mejores donadores?')) {
                window.topGiftersData.participants = {};
                syncTopGifters();
            }
        });
    }
});
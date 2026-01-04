window.topLikesData = {
    participants: {},
    rows: 6,
    active: true
};

window.processTopLike = function(data) {
    if (!window.topLikesData.active) return;
    const { userId, nickname, profilePictureUrl, likeCount } = data;

    if (!window.topLikesData.participants[userId]) {
        window.topLikesData.participants[userId] = { nickname: nickname, avatar: profilePictureUrl, coins: 0 };
    }
    // Sumamos la cantidad de likes recibida
    window.topLikesData.participants[userId].coins += likeCount;
    syncTopLikes();
};

async function syncTopLikes() {
    if (window.electronAPI) {
        await window.electronAPI.updateWidget('topLikes', window.topLikesData);
        if (typeof window.saveAllData === 'function') window.saveAllData();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (window.electronAPI) {
        const saved = await window.electronAPI.getWidgetData('topLikes');
        if (saved) {
            window.topLikesData.participants = saved.participants || {};
            window.topLikesData.rows = saved.rows || 6;
            window.topLikesData.active = saved.active !== undefined ? saved.active : true;
        } else {
            // SI NO HAY DATOS: Forzamos la creación inicial de la tabla vacía
            syncTopLikes();
        }
    }
    // ===========================================================

    const rowsInput = document.getElementById('rows-count-toplikes');
    const activeCheck = document.getElementById('activate-widget-toplikes');
    
    // CORRECCIÓN DEL SELECTOR DEL BOTÓN RESET
    // Buscamos el botón que está dentro de la tarjeta de Top Likes y contiene el texto "Reset"
    const btnReset = Array.from(document.querySelectorAll('#card-top-likes .action-btn'))
                          .find(btn => btn.textContent.includes('Reset'));

    if (rowsInput) {
        rowsInput.value = window.topLikesData.rows;
        rowsInput.addEventListener('change', () => {
            window.topLikesData.rows = parseInt(rowsInput.value) || 6;
            syncTopLikes();
        });
    }

    if (activeCheck) {
        activeCheck.checked = window.topLikesData.active;
        activeCheck.addEventListener('change', () => {
            window.topLikesData.active = activeCheck.checked;
            syncTopLikes();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (await window.showCustomConfirm('¿Reiniciar la tabla de mejores likes?')) {
                window.topLikesData.participants = {};
                syncTopLikes();
            }
        });
    }
});
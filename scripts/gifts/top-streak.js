window.topStreakState = { 
    username: 'Username', 
    streakCount: 0, 
    giftName: 'Default', 
    giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp' 
};

window.processTopStreakRecord = function(data) {
    // Si la sección está bloqueada, no recolectar nada
    if (document.getElementById('card-gifts-combined')?.classList.contains('locked-section')) return;

    const checkTopStreakRecord = document.getElementById('chk-enable-top-streak');
    if (!checkTopStreakRecord || !checkTopStreakRecord.checked) return;

    if (data.repeatCount > window.topStreakState.streakCount) {
        let finalGiftImage = data.giftPictureUrl; 
        
        // Buscamos en el cache global de script.js
        if (window.availableGiftsCache) {
            const cachedGift = window.availableGiftsCache.find(g => g.id == data.giftId);
            if (cachedGift && cachedGift.image && cachedGift.image.url_list) {
                finalGiftImage = cachedGift.image.url_list[0];
            }
        }

        window.topStreakState = {
            username: data.nickname,
            streakCount: data.repeatCount,
            giftName: data.giftName,
            giftImage: finalGiftImage
        };

        if(window.electronAPI) {
            window.electronAPI.updateWidget('topStreak', window.topStreakState);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnReset = document.getElementById('btn-reset-top-streak');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if(await window.showCustomConfirm('¿Reiniciar la Mejor Racha a 0?')) {
                window.topStreakState = { 
                    username: 'Username', streakCount: 0, giftName: 'Default', 
                    giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp' 
                };
                if (window.electronAPI) {
                    await window.electronAPI.updateWidget('topStreak', window.topStreakState);
                    if(typeof window.saveAllData === 'function') window.saveAllData();
                }
            }
        });
    }
});
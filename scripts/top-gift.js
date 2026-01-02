window.topGiftState = { 
    username: 'Username', 
    coins: 0, 
    giftName: 'Default', 
    giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8173e9b07875cca37caa5219e4903a40.png~tplv-obj.webp' 
};

window.processTopGiftRecord = function(data) {
    const checkTopGiftRecord = document.getElementById('chk-enable-top-gift');
    if (!checkTopGiftRecord || !checkTopGiftRecord.checked) return;

    if (data.diamondCount > window.topGiftState.coins) {
        let finalGiftImage = data.giftPictureUrl; 
        
        // Buscamos en el cache global de script.js
        if (window.availableGiftsCache) {
            const cachedGift = window.availableGiftsCache.find(g => g.id == data.giftId);
            if (cachedGift && cachedGift.image && cachedGift.image.url_list) {
                finalGiftImage = cachedGift.image.url_list[0];
            }
        }

        window.topGiftState = {
            username: data.nickname,
            coins: data.diamondCount, 
            giftName: data.giftName,
            giftImage: finalGiftImage
        };
        
        if(window.electronAPI) {
            window.electronAPI.updateWidget('topGift', window.topGiftState);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnReset = document.getElementById('btn-reset-top-gift');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if(await window.showCustomConfirm('¿Reiniciar el Mejor Regalo a 0?')) {
                window.topGiftState = { 
                    username: 'Username', coins: 0, giftName: 'Default', 
                    giftImage: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8173e9b07875cca37caa5219e4903a40.png~tplv-obj.webp' 
                };
                if (window.electronAPI) {
                    await window.electronAPI.updateWidget('topGift', window.topGiftState);
                    if(typeof window.saveAllData === 'function') window.saveAllData();
                }
            }
        });
    }
});
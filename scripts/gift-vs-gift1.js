document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================
    // 1. REFERENCIAS AL DOM
    // ==========================================================
    const btnLeft = document.getElementById('btn-select-gift-left');
    const btnRight = document.getElementById('btn-select-gift-right');
    const btnVs = document.getElementById('btn-select-vs'); 

    // Botones de control
    const btnReset = document.getElementById('btn-reset-gvg');
    
    // Controles Izquierda
    const inputLeft = document.getElementById('gvg-score-left');
    const btnAddLeft = document.getElementById('btn-add-left');
    const btnSubLeft = document.getElementById('btn-sub-left');

    // Controles Derecha
    const inputRight = document.getElementById('gvg-score-right');
    const btnAddRight = document.getElementById('btn-add-right');
    const btnSubRight = document.getElementById('btn-sub-right');

    // ==========================================================
    // 2. ESTADO, PERSISTENCIA Y VARIABLES
    // ==========================================================
    
    let gvgState = {
        left: { id: 5655, name: 'Rose', coins: 1, img: 'https://p19-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.png' },
        right: { id: 6064, name: 'GG', coins: 1, img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.webp' },
        scoreLeft: 0,
        scoreRight: 0
    };

    // Memoria de combos (No se guarda en localStorage para evitar errores con combos viejos)
    let comboTracker = {}; 

    // --- CARGAR DATOS (Persistencia) ---
    function loadSavedState() {
        const saved = localStorage.getItem('tikspark_gvg1_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Fusionar lo guardado con el estado actual
                gvgState = { ...gvgState, ...parsed };
                
                // Actualizar inputs visuales
                if(inputLeft) inputLeft.value = gvgState.scoreLeft;
                if(inputRight) inputRight.value = gvgState.scoreRight;

                // Actualizar botones de regalos
                updateButtonVisual('left', gvgState.left);
                updateButtonVisual('right', gvgState.right);
                
                console.log("[GvG] Datos restaurados.");
            } catch (e) { console.error(e); }
        }
    }

    // --- GUARDAR DATOS ---
    function saveState() {
        localStorage.setItem('tikspark_gvg1_data', JSON.stringify(gvgState));
    }

    // --- NOTIFICACIONES (Toast) ---
    function showLocalToast(message) {
        const toast = document.getElementById('toast-notification');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    // --- UI HELPER ---
    function updateButtonVisual(side, gift) {
        const btn = side === 'left' ? btnLeft : btnRight;
        if(!btn) return;

        const imgEl = btn.querySelector('img');
        const nameEl = btn.querySelector('span:nth-child(1)');
        const descEl = btn.querySelector('span:nth-child(2)');

        if(imgEl) imgEl.src = gift.img;
        if(nameEl) nameEl.textContent = gift.name;
        if(descEl) descEl.textContent = `${gift.coins} Coins - ID:${gift.id}`;
    }

    // --- SINCRONIZAR CON OBS ---
    async function syncWidget() {
        if(window.electronAPI) {
            const dataToSend = {
                imgLeft: gvgState.left.img,
                imgRight: gvgState.right.img,
                scoreLeft: gvgState.scoreLeft,
                scoreRight: gvgState.scoreRight
            };
            await window.electronAPI.updateWidget('giftVsGift1', dataToSend);
        }
    }

    // ==========================================================
    // 3. CONTROLES MANUALES Y RESET
    // ==========================================================

    function validateInput(input) {
        if (input.value < 0) input.value = 0;
    }
    if(inputLeft) inputLeft.addEventListener('input', () => validateInput(inputLeft));
    if(inputRight) inputRight.addEventListener('input', () => validateInput(inputRight));

    // BOTÓN RESET (Silencioso y completo)
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            gvgState.scoreLeft = 0;
            gvgState.scoreRight = 0;
            comboTracker = {}; // Borrar memoria de combos para evitar errores matemáticos
            
            if(inputLeft) inputLeft.value = 0;
            if(inputRight) inputRight.value = 0;

            saveState(); // Guardar el reset
            syncWidget();
            // showLocalToast("Reset"); // Comentado para que sea silencioso
        });
    }

    // IZQUIERDA
    if (btnAddLeft && inputLeft) {
        btnAddLeft.addEventListener('click', () => {
            const val = parseInt(inputLeft.value) || 0;
            if (val <= 0) return;
            gvgState.scoreLeft += val;
            saveState();
            syncWidget();
        });
    }
    if (btnSubLeft && inputLeft) {
        btnSubLeft.addEventListener('click', () => {
            const val = parseInt(inputLeft.value) || 0;
            if (val <= 0) return;
            if (gvgState.scoreLeft - val < 0) return; 
            gvgState.scoreLeft -= val;
            saveState();
            syncWidget();
        });
    }

    // DERECHA
    if (btnAddRight && inputRight) {
        btnAddRight.addEventListener('click', () => {
            const val = parseInt(inputRight.value) || 0;
            if (val <= 0) return;
            gvgState.scoreRight += val;
            saveState();
            syncWidget();
        });
    }
    if (btnSubRight && inputRight) {
        btnSubRight.addEventListener('click', () => {
            const val = parseInt(inputRight.value) || 0;
            if (val <= 0) return;
            if (gvgState.scoreRight - val < 0) return;
            gvgState.scoreRight -= val;
            saveState();
            syncWidget();
        });
    }

    // ==========================================================
    // 4. LÓGICA DE PUNTUACIÓN REFINADA (EL CORAZÓN)
    // ==========================================================
    window.updateGvGScore = function(giftData) {
        // MEJORA 1: Usar groupId si existe para diferenciar combos.
        // Si mandas 1 rosa, y luego un pack de 5, tienen groupId distinto, 
        // así que se tratan como nuevos y no se restan.
        let uniqueComboId = 'no_group';
        if (giftData.groupId) uniqueComboId = giftData.groupId;
        
        const comboKey = `${giftData.userId}_${giftData.giftId}_${uniqueComboId}`;
        
        const currentCount = parseInt(giftData.repeatCount) || 1;
        let previousCount = comboTracker[comboKey] || 0;

        // MEJORA 2: Condición <= para capturar spam de clicks individuales (1, 1, 1...)
        // Si el conteo actual es menor o IGUAL al anterior, asumimos que es un evento nuevo
        // o un reinicio de combo, por lo que reseteamos la base a 0.
        if (currentCount <= previousCount) {
            previousCount = 0; 
        }

        const diff = currentCount - previousCount;

        // Si por alguna razón de lag llega duplicado exacto, salimos.
        if (diff <= 0) return;

        // Guardamos en memoria
        comboTracker[comboKey] = currentCount;

        // Calculamos valor
        const unitPrice = parseInt(giftData.diamondCount) || 0;
        const totalValueToAdd = diff * unitPrice;

        let updated = false;
        const incomingId = String(giftData.giftId);
        const leftId = String(gvgState.left.id);
        const rightId = String(gvgState.right.id);

        if (incomingId === leftId) {
            gvgState.scoreLeft += totalValueToAdd;
            updated = true;
            console.log(`[GvG] Izq +${totalValueToAdd} (Diff:${diff} Count:${currentCount})`);
        } 
        else if (incomingId === rightId) {
            gvgState.scoreRight += totalValueToAdd;
            updated = true;
            console.log(`[GvG] Der +${totalValueToAdd} (Diff:${diff} Count:${currentCount})`);
        }

        if (updated) {
            saveState(); // Guardamos el cambio
            syncWidget();
        }
    };

    // ==========================================================
    // 5. SELECTOR DE REGALOS
    // ==========================================================
    async function openGiftSelector(side) {
        let gifts = window.availableGiftsCache || [];

        if (gifts.length === 0 && window.electronAPI) {
            try {
                gifts = await window.electronAPI.getAvailableGifts();
                window.availableGiftsCache = gifts; 
            } catch (e) { console.error(e); }
        }

        if (!gifts || gifts.length === 0) {
            showLocalToast("⚠️ No hay regalos cargados.");
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'gvg-floating-menu';
        
        Object.assign(menu.style, {
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '100%',
            maxHeight: '250px',
            overflowY: 'auto',
            background: '#181818',
            border: '1px solid #444',
            borderRadius: '0 0 6px 6px',
            zIndex: '9999',
            boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
        });

        gifts.sort((a,b) => a.diamond_count - b.diamond_count).forEach(gift => {
            if(!gift.image || !gift.image.url_list[0]) return;

            const item = document.createElement('div');
            item.style.cssText = "display: flex; align-items: center; padding: 10px; cursor: pointer; border-bottom: 1px solid #2a2a2a; gap: 10px; transition: background 0.2s;";
            
            item.onmouseenter = () => item.style.background = '#252526';
            item.onmouseleave = () => item.style.background = 'transparent';

            const imgUrl = gift.image.url_list[0];
            
            item.innerHTML = `
                <img src="${imgUrl}" style="width: 28px; height: 28px; object-fit: contain;">
                <div style="display:flex; flex-direction:column;">
                    <span style="color: #e0e0e0; font-size: 13px; font-weight: 600;">${gift.name}</span>
                    <span style="color: #888; font-size: 11px;">${gift.diamond_count} Coins - ID:${gift.id}</span>
                </div>
            `;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const selectedGift = {
                    id: gift.id,
                    name: gift.name,
                    coins: gift.diamond_count,
                    img: imgUrl
                };

                if(side === 'left') gvgState.left = selectedGift;
                else gvgState.right = selectedGift;

                updateButtonVisual(side, selectedGift);
                saveState(); // Guardamos el cambio de regalo
                syncWidget(); 

                menu.remove();
            });

            menu.appendChild(item);
        });

        document.querySelectorAll('.gvg-floating-menu').forEach(m => m.remove());
        const parentBtn = side === 'left' ? btnLeft : btnRight;
        parentBtn.appendChild(menu);
    }

    // Listeners
    if(btnLeft) btnLeft.addEventListener('click', () => openGiftSelector('left'));
    if(btnRight) btnRight.addEventListener('click', () => openGiftSelector('right'));

    document.addEventListener('click', (e) => {
        if(!btnLeft.contains(e.target) && !btnRight.contains(e.target)) {
            document.querySelectorAll('.gvg-floating-menu').forEach(m => m.remove());
        }
    });

    // --- INICIO ---
    loadSavedState();
    
    setTimeout(async () => {
        if(window.electronAPI) {
            syncWidget();
        }
    }, 1500);
});
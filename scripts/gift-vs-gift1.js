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

    // --- CARGAR DATOS (Persistencia LocalStorage) ---
    function loadSavedState() {
        const saved = localStorage.getItem('tikspark_gvg1_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Fusionar lo guardado con el estado actual
                gvgState = { ...gvgState, ...parsed };
                
                // CORRECCIÓN 1: Al iniciar la app, forzamos los inputs a 0 siempre.
                if(inputLeft) inputLeft.value = 0;
                if(inputRight) inputRight.value = 0;

                // Actualizar botones de regalos
                updateButtonVisual('left', gvgState.left);
                updateButtonVisual('right', gvgState.right);
                
                console.log("[GvG] Datos restaurados.");
            } catch (e) { console.error(e); }
        }
    }

    // --- CORRECCIÓN 3: CARGAR DATOS REALES (Corrige el error de Thumbs Up vs GG) ---
    async function loadFromBackend() {
        if (window.electronAPI) {
            try {
                const backendData = await window.electronAPI.getWidgetData('giftVsGift1');
                if (backendData) {
                    // Si la base de datos tiene info distinta, la usamos (ej: GG en vez de Thumbs Up)
                    gvgState = { ...gvgState, ...backendData };
                    
                    // Actualizamos visualmente los botones de nuevo con la data real
                    updateButtonVisual('left', gvgState.left);
                    updateButtonVisual('right', gvgState.right);
                    
                    // Guardamos la corrección en local
                    saveState();
                    syncWidget();
                }
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
            // Enviamos el estado completo + las imágenes planas para el HTML
            const dataToSend = {
                ...gvgState, 
                imgLeft: gvgState.left.img,
                imgRight: gvgState.right.img,
                scoreLeft: gvgState.scoreLeft,
                scoreRight: gvgState.scoreRight
            };
            await window.electronAPI.updateWidget('giftVsGift1', dataToSend);
        }
    }

    // ==========================================================
    // 3. CONTROLES MANUALES Y RESET (CORREGIDO PARA SINCRONIZACIÓN)
    // ==========================================================

    function validateInput(input) {
        if (input.value < 0) input.value = 0;
    }
    if(inputLeft) inputLeft.addEventListener('input', () => validateInput(inputLeft));
    if(inputRight) inputRight.addEventListener('input', () => validateInput(inputRight));

    // Función auxiliar para refrescar datos antes de operar
    async function refreshStateBeforeAction() {
        if (window.electronAPI) {
            const freshData = await window.electronAPI.getWidgetData('giftVsGift1');
            if (freshData) {
                gvgState.scoreLeft = parseInt(freshData.scoreLeft) || 0;
                gvgState.scoreRight = parseInt(freshData.scoreRight) || 0;
            }
        }
    }

    // BOTÓN RESET
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            // Aquí no hace falta leer, forzamos el 0
            gvgState.scoreLeft = 0;
            gvgState.scoreRight = 0;
            comboTracker = {}; 
            saveState(); 
            syncWidget();
        });
    }

    // IZQUIERDA - SUMAR
    if (btnAddLeft && inputLeft) {
        btnAddLeft.addEventListener('click', async () => {
            await refreshStateBeforeAction(); // <--- ESTO ARREGLA EL BUG
            const val = parseInt(inputLeft.value) || 0;
            if (val <= 0) return;
            gvgState.scoreLeft += val;
            saveState();
            syncWidget();
        });
    }
    // IZQUIERDA - RESTAR
    if (btnSubLeft && inputLeft) {
        btnSubLeft.addEventListener('click', async () => {
            await refreshStateBeforeAction(); // <--- ESTO ARREGLA EL BUG
            const val = parseInt(inputLeft.value) || 0;
            if (val <= 0) return;
            // Permitimos restar aunque baje de 0 si quieres, o lo limitamos:
            // if (gvgState.scoreLeft - val < 0) return; 
            gvgState.scoreLeft -= val;
            saveState();
            syncWidget();
        });
    }

    // DERECHA - SUMAR
    if (btnAddRight && inputRight) {
        btnAddRight.addEventListener('click', async () => {
            await refreshStateBeforeAction(); // <--- ESTO ARREGLA EL BUG
            const val = parseInt(inputRight.value) || 0;
            if (val <= 0) return;
            gvgState.scoreRight += val;
            saveState();
            syncWidget();
        });
    }
    // DERECHA - RESTAR
    if (btnSubRight && inputRight) {
        btnSubRight.addEventListener('click', async () => {
            await refreshStateBeforeAction(); // <--- ESTO ARREGLA EL BUG
            const val = parseInt(inputRight.value) || 0;
            if (val <= 0) return;
            gvgState.scoreRight -= val;
            saveState();
            syncWidget();
        });
    }

    // ==========================================================
    // 4. LÓGICA DE PUNTUACIÓN (CON COLA DE PROCESAMIENTO ANTI-PÉRDIDA)
    // ==========================================================
    
    // Variable global para formar la fila (cola)
    let gvgQueue = Promise.resolve();

    window.updateGvGScore = function(giftData) {
        // Añadimos este regalo al final de la fila
        gvgQueue = gvgQueue.then(async () => {
            
            // --- 1. LÓGICA DE COMBO (Calcular cuánto sumar) ---
            let uniqueComboId = 'no_group';
            if (giftData.groupId) uniqueComboId = giftData.groupId;
            
            const comboKey = `${giftData.userId}_${giftData.giftId}_${uniqueComboId}`;
            const currentCount = parseInt(giftData.repeatCount) || 1;
            let previousCount = comboTracker[comboKey] || 0;

            // Si el combo se reinició
            if (currentCount <= previousCount) {
                previousCount = 0; 
            }

            const diff = currentCount - previousCount;

            // Si no hay nada nuevo que sumar, terminamos aquí
            if (diff <= 0) return;

            // Actualizamos el tracker inmediatamente
            comboTracker[comboKey] = currentCount;

            // Calculamos el valor a sumar
            const unitPrice = parseInt(giftData.diamondCount) || 0;
            const totalValueToAdd = diff * unitPrice;

            // --- 2. LECTURA Y ESCRITURA SEGURA EN BASE DE DATOS ---
            if (window.electronAPI) {
                try {
                    // A) LEER EL VALOR MÁS RECIENTE (Ahora nadie más está escribiendo a la vez)
                    const freshData = await window.electronAPI.getWidgetData('giftVsGift1');
                    if (freshData) {
                        gvgState.scoreLeft = parseInt(freshData.scoreLeft) || 0;
                        gvgState.scoreRight = parseInt(freshData.scoreRight) || 0;
                        
                        // Sincronizar info de regalos por si cambiaron
                        if (freshData.left) gvgState.left = freshData.left;
                        if (freshData.right) gvgState.right = freshData.right;
                    }
                } catch (e) {
                    console.error("[GvG] Error leyendo datos:", e);
                }
            }

            // B) APLICAR LA SUMA
            let updated = false;
            const incomingId = String(giftData.giftId);
            const leftId = String(gvgState.left.id);
            const rightId = String(gvgState.right.id);

            if (incomingId === leftId) {
                gvgState.scoreLeft += totalValueToAdd;
                updated = true;
                console.log(`[GvG] Izq +${totalValueToAdd} => Total: ${gvgState.scoreLeft}`);
            } 
            else if (incomingId === rightId) {
                gvgState.scoreRight += totalValueToAdd;
                updated = true;
                console.log(`[GvG] Der +${totalValueToAdd} => Total: ${gvgState.scoreRight}`);
            }

            // C) GUARDAR (Ahora es seguro porque estamos dentro de la cola)
            if (updated) {
                saveState(); // Guardar local
                await syncWidget(); // Guardar en DB/Electron (Esperamos a que termine)
            }

        }).catch(err => {
            console.error("Error en la cola de GvG:", err);
        });
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
    
    // Forzar lectura de la base de datos un momento después para corregir posibles errores de caché (Thumbs Up)
    setTimeout(() => {
        loadFromBackend();
    }, 500);
});
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================
    // 1. REFERENCIAS AL DOM
    // ==========================================================
    // Ahora tenemos 3 botones por lado para el Overlay 2
    const btnLeft1 = document.getElementById('btn-gvg2-left-1');
    const btnLeft2 = document.getElementById('btn-gvg2-left-2');
    const btnLeft3 = document.getElementById('btn-gvg2-left-3');
    const btnRight1 = document.getElementById('btn-gvg2-right-1');
    const btnRight2 = document.getElementById('btn-gvg2-right-2');
    const btnRight3 = document.getElementById('btn-gvg2-right-3');
    const btnVs = document.getElementById('btn-gvg2-select-vs'); 

    // Botones de control
    const btnReset = document.getElementById('btn-reset-gvg2');
    
    // Controles Izquierda
    const inputLeft = document.getElementById('gvg2-score-left-input');
    const btnAddLeft = document.getElementById('btn-add-left2');
    const btnSubLeft = document.getElementById('btn-sub-left2');

    // Controles Derecha
    const inputRight = document.getElementById('gvg2-score-right-input');
    const btnAddRight = document.getElementById('btn-add-right2');
    const btnSubRight = document.getElementById('btn-sub-right2');

    // --- REFERENCIAS MODAL PERSONALIZAR ---
    const btnPersonalizar = document.getElementById('btn-config-gvg2'); // <--- CAMBIA ESTA LÍNEA
    const modalGvG = document.getElementById('config-gvg-modal-2');
    const btnCloseGvG = document.getElementById('close-config-gvg-2');
    const btnSaveGvG = document.getElementById('btn-save-gvg-config-2');
    const btnResetGvG = document.getElementById('btn-reset-gvg-config-2');

    // ==========================================================
    // 2. ESTADO, PERSISTENCIA Y VARIABLES
    // ==========================================================
    
    let gvgState2 = {
        // Estructura de 3 regalos por bando
        leftGifts: [
            { id: 5655, name: 'Rose', coins: 1, img: 'https://p19-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.png' },
            { id: 0, name: 'Vacío', coins: 0, img: '' },
            { id: 0, name: 'Vacío', coins: 0, img: '' }
        ],
        rightGifts: [
            { id: 6064, name: 'GG', coins: 1, img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.webp' },
            { id: 0, name: 'Vacío', coins: 0, img: '' },
            { id: 0, name: 'Vacío', coins: 0, img: '' }
        ],
        scoreLeft: 0,
        scoreRight: 0,
        styles: {} // <--- AGREGA ESTA LÍNEA
    };

    // Memoria de combos (No se guarda en localStorage para evitar errores con combos viejos)
    let comboTracker2 = {}; 

    // --- CARGAR DATOS (Persistencia LocalStorage) ---
    function loadSavedState2() {
        const saved = localStorage.getItem('tikspark_gvg2_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                delete parsed.command; // <--- AÑADE ESTO: Borra el comando viejo al cargar
                // Fusionar lo guardado con el estado actual
                gvgState2 = { ...gvgState2, ...parsed };
                
                // CORRECCIÓN 1: Al iniciar la app, forzamos los inputs a 0 siempre.
                if(inputLeft) inputLeft.value = 0;
                if(inputRight) inputRight.value = 0;

                // Actualizar visualmente los 6 botones
                for(let i=0; i<3; i++) {
                    updateButtonVisual2('left', gvgState2.leftGifts[i], i+1);
                    updateButtonVisual2('right', gvgState2.rightGifts[i], i+1);
                }
                
                console.log("[GvG 2] Datos restaurados.");
            } catch (e) { console.error(e); }
        }
    }

    // --- CORRECCIÓN 3: CARGAR DATOS REALES ---
    async function loadFromBackend2() {
        if (window.electronAPI) {
            try {
                const backendData = await window.electronAPI.getWidgetData('giftVsGift2');
                if (backendData) {
                    gvgState2 = { ...gvgState2, ...backendData };
                    for(let i=0; i<3; i++) {
                        updateButtonVisual2('left', gvgState2.leftGifts[i], i+1);
                        updateButtonVisual2('right', gvgState2.rightGifts[i], i+1);
                    }
                    saveState2();
                    syncWidget2();
                }
            } catch (e) { console.error(e); }
        }
    }

    // --- GUARDAR DATOS ---
    function saveState2() {
        localStorage.setItem('tikspark_gvg2_data', JSON.stringify(gvgState2));
    }

    // --- NOTIFICACIONES (Toast) ---
    function showLocalToast2(message) {
        const toast = document.getElementById('toast-notification');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    // --- UI HELPER (COPIA EXACTA DE LA LÓGICA DEL OVERLAY 1) ---
    function updateButtonVisual2(side, gift, index) {
        const btnId = `btn-gvg2-${side}-${index}`;
        const btn = document.getElementById(btnId);
        if(!btn) return;

        const imgEl = btn.querySelector('img');
        // El Overlay 1 usa nth-child(1) para el nombre y nth-child(2) para los coins
        const nameEl = btn.querySelector('span:nth-child(1)');
        const descEl = btn.querySelector('span:nth-child(2)');

        if(!gift || gift.id === 0 || !gift.id) {
            // Estado cuando no hay nada seleccionado
            if(imgEl) imgEl.style.display = 'none';
            if(nameEl) {
                nameEl.textContent = `Seleccionar regalo ${index}...`;
                nameEl.style.color = "#555";
            }
            if(descEl) descEl.textContent = "";
        } else {
            // Estado con regalo seleccionado
            if(imgEl) {
                imgEl.src = gift.img;
                imgEl.style.display = 'block';
            }
            if(nameEl) {
                nameEl.textContent = gift.name;
                nameEl.style.color = "#e0e0e0";
            }
            if(descEl) {
                descEl.textContent = `${gift.coins} Coins - ID:${gift.id}`;
            }
        }
    }

    // --- VARIABLE DE CONTROL ---
    let isBattleRunning2 = false; 

    // --- SINCRONIZAR CON OBS ---
    async function syncWidget2() {
        if(window.electronAPI) {
            const dataToSend = JSON.parse(JSON.stringify(gvgState2));
            delete dataToSend.command; 
            delete dataToSend.timestamp; 
            await window.electronAPI.updateWidget('giftVsGift2', dataToSend);
        }
    }

    // ==========================================================
    // 3. CONTROLES MANUALES Y RESET
    // ==========================================================

    function validateInput2(input) {
        if (input.value < 0) input.value = 0;
    }
    if(inputLeft) inputLeft.addEventListener('input', () => validateInput2(inputLeft));
    if(inputRight) inputRight.addEventListener('input', () => validateInput2(inputRight));

    async function refreshStateBeforeAction2() {
        if (window.electronAPI) {
            const freshData = await window.electronAPI.getWidgetData('giftVsGift2');
            if (freshData) {
                gvgState2.scoreLeft = parseInt(freshData.scoreLeft) || 0;
                gvgState2.scoreRight = parseInt(freshData.scoreRight) || 0;
            }
        }
    }

    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            gvgState2.scoreLeft = 0;
            gvgState2.scoreRight = 0;
            await window.electronAPI.updateWidget('giftVsGift2', { 
                ...gvgState2, 
                command: 'reset' 
            });
            saveState2();
        });
    }

    if (btnAddLeft && inputLeft) {
        btnAddLeft.addEventListener('click', async () => {
            await refreshStateBeforeAction2(); 
            const val = parseInt(inputLeft.value) || 0;
            if (val <= 0) return;
            gvgState2.scoreLeft += val;
            saveState2();
            syncWidget2();
        });
    }
    if (btnSubLeft && inputLeft) {
        btnSubLeft.addEventListener('click', async () => {
            const val = parseInt(inputLeft.value) || 0;
            gvgState2.scoreLeft = Math.max(0, (gvgState2.scoreLeft || 0) - val);
            saveState2();
            syncWidget2();
        });
    }

    if (btnAddRight && inputRight) {
        btnAddRight.addEventListener('click', async () => {
            await refreshStateBeforeAction2(); 
            const val = parseInt(inputRight.value) || 0;
            if (val <= 0) return;
            gvgState2.scoreRight += val;
            saveState2();
            syncWidget2();
        });
    }
    if (btnSubRight && inputRight) {
        btnSubRight.addEventListener('click', async () => {
            const val = parseInt(inputRight.value) || 0;
            gvgState2.scoreRight = Math.max(0, (gvgState2.scoreRight || 0) - val);
            saveState2();
            syncWidget2();
        });
    }

    // ==========================================================
    // 4. LÓGICA DE PUNTUACIÓN (3 VS 3)
    // ==========================================================
    
    let gvgQueue2 = Promise.resolve();

    window.updateGvGScore2 = function(giftData) {
        gvgQueue2 = gvgQueue2.then(async () => {
            
            let uniqueComboId = 'no_group';
            if (giftData.groupId) uniqueComboId = giftData.groupId;
            
            const comboKey = `${giftData.userId}_${giftData.giftId}_${uniqueComboId}`;
            const currentCount = parseInt(giftData.repeatCount) || 1;
            let previousCount = comboTracker2[comboKey] || 0;

            if (currentCount <= previousCount) previousCount = 0; 
            const diff = currentCount - previousCount;
            if (diff <= 0) return;

            comboTracker2[comboKey] = currentCount;
            const unitPrice = parseInt(giftData.diamondCount) || 0;
            const totalValueToAdd = diff * unitPrice;

            if (window.electronAPI) {
                try {
                    const freshData = await window.electronAPI.getWidgetData('giftVsGift2');
                    if (freshData) {
                        gvgState2.scoreLeft = parseInt(freshData.scoreLeft) || 0;
                        gvgState2.scoreRight = parseInt(freshData.scoreRight) || 0;
                        if (freshData.leftGifts) gvgState2.leftGifts = freshData.leftGifts;
                        if (freshData.rightGifts) gvgState2.rightGifts = freshData.rightGifts;
                    }
                } catch (e) { console.error(e); }
            }

            let updated = false;
            const incomingId = String(giftData.giftId);
            
            // Verificamos si el ID está en cualquiera de los 3 slots de la izquierda
            const isLeft = gvgState2.leftGifts.some(g => String(g.id) === incomingId);
            // Verificamos si el ID está en cualquiera de los 3 slots de la derecha
            const isRight = gvgState2.rightGifts.some(g => String(g.id) === incomingId);

            if (isLeft) {
                gvgState2.scoreLeft += totalValueToAdd;
                updated = true;
                console.log(`[GvG 2] Izq (3vs3) +${totalValueToAdd}`);
            } 
            else if (isRight) {
                gvgState2.scoreRight += totalValueToAdd;
                updated = true;
                console.log(`[GvG 2] Der (3vs3) +${totalValueToAdd}`);
            }

            if (updated) {
                saveState2(); 
                await syncWidget2(); 
            }

        }).catch(err => {
            console.error("Error en la cola de GvG 2:", err);
        });
    };

    // ==========================================================
    // 5. SELECTOR DE REGALOS (ADAPTADO PARA 6 POSICIONES)
    // ==========================================================
    async function openGiftSelector2(side, index) {
        let gifts = window.availableGiftsCache || [];

        if (gifts.length === 0 && window.electronAPI) {
            try {
                gifts = await window.electronAPI.getAvailableGifts();
                window.availableGiftsCache = gifts; 
            } catch (e) { console.error(e); }
        }

        if (!gifts || gifts.length === 0) {
            showLocalToast2("⚠️ No hay regalos cargados.");
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'gvg-floating-menu-2';
        
        Object.assign(menu.style, {
            position: 'absolute', top: '100%', left: '0', width: '100%', maxHeight: '250px',
            overflowY: 'auto', background: '#181818', border: '1px solid #444',
            borderRadius: '0 0 6px 6px', zIndex: '9999', boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
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
                const selectedGift = { id: gift.id, name: gift.name, coins: gift.diamond_count, img: imgUrl };
                
                if(side === 'left') gvgState2.leftGifts[index-1] = selectedGift;
                else gvgState2.rightGifts[index-1] = selectedGift;

                updateButtonVisual2(side, selectedGift, index);
                saveState2(); 
                syncWidget2(); 
                menu.remove();
            });
            menu.appendChild(item);
        });

        document.querySelectorAll('.gvg-floating-menu-2').forEach(m => m.remove());
        const parentBtn = document.getElementById(`btn-gvg2-${side}-${index}`);
        parentBtn.appendChild(menu);
    }

    // Listeners para los 6 botones
    if(btnLeft1) btnLeft1.addEventListener('click', () => openGiftSelector2('left', 1));
    if(btnLeft2) btnLeft2.addEventListener('click', () => openGiftSelector2('left', 2));
    if(btnLeft3) btnLeft3.addEventListener('click', () => openGiftSelector2('left', 3));
    if(btnRight1) btnRight1.addEventListener('click', () => openGiftSelector2('right', 1));
    if(btnRight2) btnRight2.addEventListener('click', () => openGiftSelector2('right', 2));
    if(btnRight3) btnRight3.addEventListener('click', () => openGiftSelector2('right', 3));

    document.addEventListener('click', (e) => {
        if(!e.target.closest('[id^="btn-gvg2-"]')) {
            document.querySelectorAll('.gvg-floating-menu-2').forEach(m => m.remove());
        }
    });

    loadSavedState2();

    // ==========================================================
    // SECCIÓN NUEVA: LÓGICA DE PERSONALIZACIÓN
    // ==========================================================
    // Nota: He mantenido los IDs tal cual los tienes en el index.html para la sección 2
    const gvgColorIds2 = ['gvg-bg-main-2', 'gvg-color-num-2', 'gvg-color-border-2', 'gvg-bg-gift1-2', 'gvg-bg-gift2-2'];
    const gvgPickers2 = {};

    gvgColorIds2.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        gvgPickers2[id] = Pickr.create({
            el: `#${id}`, theme: 'nano', default: '#ffffff',
            components: { preview: true, opacity: true, hue: true, interaction: { hex: true, rgba: true, input: true, save: true } }
        });
        gvgPickers2[id].on('change', (color) => {
            const hex = color.toHEXA().toString();
            const span = document.getElementById(`hex-${id}`);
            if(span) span.textContent = hex;
        });
    });

    function updateModalInputs2() {
        const s = gvgState2.styles || {};
        if (s.font) document.getElementById('gvg-font-2').value = s.font;
        if (s.fontSize) document.getElementById('gvg-font-size-2').value = s.fontSize;
        if (s.fontSpacing !== undefined) document.getElementById('gvg-font-spacing-2').value = s.fontSpacing;
        document.getElementById('gvg-border-check-2').checked = s.borderCheck !== false;
        
        document.getElementById('gvg-txt-left-2').value = s.textLeft || "en contra :c";
        document.getElementById('gvg-txt-right-2').value = s.textRight || "a favor c:";
        document.getElementById('gvg-txt-start-2').value = s.textStart || "Iniciar Batalla";
        document.getElementById('gvg-txt-win-2').value = s.textWin || "GANA";

        if(s.bgMain) gvgPickers2['gvg-bg-main-2'].setColor(s.bgMain);
        if(s.colorNum) gvgPickers2['gvg-color-num-2'].setColor(s.colorNum);
        if(s.colorBorder) gvgPickers2['gvg-color-border-2'].setColor(s.colorBorder);
        if(s.bgGift1) gvgPickers2['gvg-bg-gift1-2'].setColor(s.bgGift1);
        if(s.bgGift2) gvgPickers2['gvg-bg-gift2-2'].setColor(s.bgGift2);
    }

    if(btnPersonalizar) {
        btnPersonalizar.addEventListener('click', () => {
            updateModalInputs2(); // Llenar antes de abrir
            modalGvG.classList.add('open');
        });
    }

    if(btnSaveGvG) {
        btnSaveGvG.addEventListener('click', async () => {
            const getCol = (id) => gvgPickers2[id].getColor().toRGBA().toString(0);
            
            gvgState2.styles = {
                font: document.getElementById('gvg-font-2').value,
                fontSize: parseInt(document.getElementById('gvg-font-size-2').value),
                fontSpacing: parseInt(document.getElementById('gvg-font-spacing-2').value),
                bgMain: getCol('gvg-bg-main-2'),
                colorNum: getCol('gvg-color-num-2'),
                colorBorder: getCol('gvg-color-border-2'),
                bgGift1: getCol('gvg-bg-gift1-2'),
                bgGift2: getCol('gvg-bg-gift2-2'),
                borderCheck: document.getElementById('gvg-border-check-2').checked,
                textLeft: document.getElementById('gvg-txt-left-2').value,
                textRight: document.getElementById('gvg-txt-right-2').value,
                textStart: document.getElementById('gvg-txt-start-2').value,
                textWin: document.getElementById('gvg-txt-win-2').value
            };

            saveState2();
            await syncWidget2();
            modalGvG.classList.remove('open');
            showLocalToast2("🎨 Estilo del Overlay 2 actualizado");
        });
    }

    // --- LÓGICA BOTÓN RESTABLECER (MODAL 2) ---
    if(btnResetGvG) {
        btnResetGvG.addEventListener('click', async () => {
            // 1. Valores por defecto
            document.getElementById('gvg-font-2').value = "'Luckiest Guy', cursive";
            document.getElementById('gvg-font-size-2').value = 50;
            document.getElementById('gvg-font-spacing-2').value = 0;
            document.getElementById('gvg-border-check-2').checked = true;
            document.getElementById('gvg-txt-left-2').value = "en contra :c";
            document.getElementById('gvg-txt-right-2').value = "a favor c:";
            document.getElementById('gvg-txt-start-2').value = "Iniciar Batalla";
            document.getElementById('gvg-txt-win-2').value = "GANA";

            // 2. Resetear Pickers
            gvgPickers2['gvg-bg-main-2'].setColor('#000000');
            gvgPickers2['gvg-color-num-2'].setColor('#ffffff');
            gvgPickers2['gvg-color-border-2'].setColor('#000000');
            gvgPickers2['gvg-bg-gift1-2'].setColor('#00000000');
            gvgPickers2['gvg-bg-gift2-2'].setColor('#00000000');

            // 3. Limpiar estado y sincronizar
            gvgState2.styles = {};
            saveState2();
            await syncWidget2();
            showLocalToast2("🔄 Valores restablecidos");
        });
    }

    if(btnCloseGvG) btnCloseGvG.addEventListener('click', () => modalGvG.classList.remove('open'));

    // Botones de acción Start/Stop
    const btnPlayGVG2 = document.getElementById('btn-play-gvg2');
    const btnStopGVG2 = document.getElementById('btn-stop-gvg2');

    if (btnPlayGVG2) {
        btnPlayGVG2.addEventListener('click', async () => {
            isBattleRunning2 = true;
            await window.electronAPI.updateWidget('giftVsGift2', { 
                ...gvgState2, command: 'start', timestamp: Date.now() 
            });
        });
    }
    if (btnStopGVG2) {
        btnStopGVG2.addEventListener('click', async () => {
            if (!isBattleRunning2) return; 
            await window.electronAPI.updateWidget('giftVsGift2', { 
                ...gvgState2, command: 'stop', timestamp: Date.now() 
            });
            isBattleRunning2 = false; 
        });
    }
    
    setTimeout(() => { loadFromBackend2(); }, 500);
});
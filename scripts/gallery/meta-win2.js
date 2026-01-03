document.addEventListener('DOMContentLoaded', async () => {
    const metaWinWidget = document.getElementById('meta-win-widget-2');
    const btnPersonalizar = document.querySelector('#card-meta-win-2 .personalize-btn');
    const modal = document.getElementById('config-meta-win-modal-2');
    const btnClose = document.getElementById('close-config-meta-win-2');
    const btnSave = document.getElementById('btn-save-meta-win-config-2');
    const btnReset = document.getElementById('btn-reset-meta-win-config-2');

    if (!metaWinWidget) return;

    // Inputs numéricos del dashboard
    const metaInput = metaWinWidget.querySelector('#meta-win-meta-input');
    const conteoInput = metaWinWidget.querySelector('#meta-win-conteo-input');
    const plusButtons = metaWinWidget.querySelectorAll('.btn-win.plus');
    const minusButtons = metaWinWidget.querySelectorAll('.btn-win.minus');

    // --- 1. CONFIGURACIÓN PICKR (Colores) ---
    // Creamos una instancia de Pickr para cada ID de color
    const colorIds = [
        'mw2-bg-main', 'mw2-bg-counter', 'mw2-bg-meta', 
        'mw2-color-text', 'mw2-color-num', 'mw2-color-neg', 'mw2-color-border'
    ];
    
    const pickers = {}; // Almacenará las instancias

    colorIds.forEach(id => {
        // Creamos el picker en el elemento div
        pickers[id] = Pickr.create({
            el: `#${id}`,
            theme: 'nano', // Tema minimalista
            default: '#ffffff', // Color inicial temporal
            swatches: [
                '#1d1d1d', '#000000', '#ffffff', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'
            ],
            components: {
                preview: true,
                opacity: true, // ¡TRANSPARENCIA ACTIVADA!
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    save: true
                }
            }
        });
        pickers[id].on('change', (color, source, instance) => {
            const hexColor = color.toHEXA().toString();
            const textSpan = document.getElementById(`hex-${id}`);
            if (textSpan) {
                textSpan.textContent = hexColor;
            }
            saveData(); 
        });
    });

    // --- 2. CONFIGURACIÓN CUSTOM SELECT (Imágenes) ---
    const iconContainer = document.getElementById('mw2-icon-container');
    const selectedDisplay = document.getElementById('mw2-selected-display');
    const optionsList = iconContainer.querySelector('.options-list');
    const hiddenInput = document.getElementById('mw2-icon');
    const optionItems = iconContainer.querySelectorAll('.option-item');

    // Abrir/Cerrar menú
    selectedDisplay.addEventListener('click', () => {
        optionsList.classList.toggle('hidden');
    });

    // Seleccionar opción
    optionItems.forEach(item => {
        item.addEventListener('click', () => {
            const val = item.getAttribute('data-value');
            const imgSrc = item.querySelector('img').src;
            const text = item.querySelector('span').textContent;

            // Actualizar visual
            selectedDisplay.querySelector('img').src = imgSrc;
            selectedDisplay.querySelector('span').textContent = text;
            
            // Actualizar valor oculto
            hiddenInput.value = val;
            
            optionsList.classList.add('hidden');
        });
    });

    // Cerrar si clic fuera
    document.addEventListener('click', (e) => {
        if (!iconContainer.contains(e.target)) optionsList.classList.add('hidden');
    });


    // --- 3. LÓGICA DE DATOS ---
    
    // Referencias a inputs normales
    const inputs = {
        font: document.getElementById('mw2-font'),
        fontSize: document.getElementById('mw2-font-size'),
        text: document.getElementById('mw2-text'),
        // icon: se maneja con hiddenInput
        borderCheck: document.getElementById('mw2-border-check'),
    };

    let currentData = { conteo: 0, meta: 5, styles: {} };

    // Cargar datos
    if (window.electronAPI) {
        try {
            const loadedData = await window.electronAPI.getWidgetData('metaWin2');
            if (loadedData) {
                currentData = { ...currentData, ...loadedData };
                updateDashboardInputs();
                updateModalInputs();
            }
            if (window.electronAPI.onWidgetUpdate) {
                window.electronAPI.onWidgetUpdate((evt) => {
                    if (evt.widgetId === 'metaWin2') {
                        currentData = { ...currentData, ...evt.data };
                        updateDashboardInputs();
                    }
                });
            }
        } catch (e) { console.error(e); }
    }

    function updateDashboardInputs() {
        if (conteoInput.value != currentData.conteo) conteoInput.value = currentData.conteo;
        if (metaInput.value != currentData.meta) metaInput.value = currentData.meta;
    }

    function updateModalInputs() {
        const s = currentData.styles || {};
        
        if (s.font) inputs.font.value = s.font;
        if (s.fontSize) inputs.fontSize.value = s.fontSize;
        if (s.text) inputs.text.value = s.text;
        inputs.borderCheck.checked = (s.borderCheck !== false);

        // Actualizar Pickers
        if (s.bgMain) {
            pickers['mw2-bg-main'].setColor(s.bgMain);
            document.getElementById('hex-mw2-bg-main').textContent = s.bgMain; // <--- NUEVO
        }
        else pickers['mw2-bg-main'].setColor('#000000');

        if (s.bgCounter) pickers['mw2-bg-counter'].setColor(s.bgCounter);
        if (s.bgMeta) pickers['mw2-bg-meta'].setColor(s.bgMeta);
        
        if (s.colorText) pickers['mw2-color-text'].setColor(s.colorText);
        else pickers['mw2-color-text'].setColor('#ffffff');

        if (s.colorNum) pickers['mw2-color-num'].setColor(s.colorNum);
        if (s.colorNeg) pickers['mw2-color-neg'].setColor(s.colorNeg);
        if (s.colorBorder) pickers['mw2-color-border'].setColor(s.colorBorder);

        // Actualizar Custom Select
        if (s.icon) {
            hiddenInput.value = s.icon;
            selectedDisplay.querySelector('img').src = s.icon;
            // Buscar texto correspondiente (opcional)
            optionItems.forEach(opt => {
                if(opt.getAttribute('data-value') === s.icon) {
                    selectedDisplay.querySelector('span').textContent = opt.querySelector('span').textContent;
                }
            });
        }
    }

    async function saveData() {
        currentData.conteo = parseInt(conteoInput.value, 10) || 0;
        currentData.meta = parseInt(metaInput.value, 10) || 0;
        
        // Obtener colores de Pickr (RGBA con transparencia)
        const getCol = (id) => pickers[id].getColor().toRGBA().toString(0); 

        currentData.styles = {
            font: inputs.font.value,
            fontSize: inputs.fontSize.value,
            text: inputs.text.value,
            icon: hiddenInput.value, // Valor del custom select
            borderCheck: inputs.borderCheck.checked,
            
            // Guardar colores de los pickers
            bgMain: getCol('mw2-bg-main'),
            bgCounter: getCol('mw2-bg-counter'),
            bgMeta: getCol('mw2-bg-meta'),
            colorText: getCol('mw2-color-text'),
            colorNum: getCol('mw2-color-num'),
            colorNeg: getCol('mw2-color-neg'),
            colorBorder: getCol('mw2-color-border')
        };

        if (window.electronAPI) {
            await window.electronAPI.updateWidget('metaWin2', currentData);
        }
    }

    // --- EVENTOS DE BOTONES ---
    if (btnPersonalizar) {
        btnPersonalizar.addEventListener('click', () => {
            updateModalInputs(); // Importante: Cargar colores guardados en los pickers
            modal.classList.add('open');
        });
    }
    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('open'));
    
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            saveData();
            modal.classList.remove('open');
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            // Resetear valores visuales
            inputs.font.value = "'Luckiest Guy', cursive";
            inputs.fontSize.value = "50";
            inputs.text.value = "WIN";
            inputs.borderCheck.checked = true;

            // Resetear Pickers
            pickers['mw2-bg-main'].setColor('#000000');
            pickers['mw2-bg-counter'].setColor('#1d1d1d');
            pickers['mw2-bg-meta'].setColor('#1d1d1d');
            pickers['mw2-color-text'].setColor('#ffffff');
            pickers['mw2-color-num'].setColor('#ffffff');
            pickers['mw2-color-neg'].setColor('#ff0000');
            pickers['mw2-color-border'].setColor('#000000');

            // Resetear Icono
            hiddenInput.value = "images/trophy.png";
            selectedDisplay.querySelector('img').src = "images/trophy.png";
            selectedDisplay.querySelector('span').textContent = "Win Cup";

            saveData();
        });
    }

    // Botones dashboard
    plusButtons.forEach(btn => btn.addEventListener('click', () => {
        const input = metaWinWidget.querySelector('#' + btn.dataset.target);
        input.value = (parseInt(input.value)||0) + 1;
        saveData();
    }));
    minusButtons.forEach(btn => btn.addEventListener('click', () => {
        const input = metaWinWidget.querySelector('#' + btn.dataset.target);
        input.value = (parseInt(input.value)||0) - 1;
        saveData();
    }));

    metaInput.addEventListener('change', saveData);
    conteoInput.addEventListener('change', saveData);
});
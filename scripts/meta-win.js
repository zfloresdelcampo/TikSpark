document.addEventListener('DOMContentLoaded', async () => {
    const metaWinWidget = document.getElementById('meta-win-widget-1');
    if (!metaWinWidget) return;

    // Referencias a los INPUTS
    const metaInput = metaWinWidget.querySelector('#meta-win-meta-input');
    const conteoInput = metaWinWidget.querySelector('#meta-win-conteo-input');
    
    // Botones
    const plusButtons = metaWinWidget.querySelectorAll('.btn-win.plus');
    const minusButtons = metaWinWidget.querySelectorAll('.btn-win.minus');

    // 1. Cargar datos iniciales al abrir la app
    if (window.electronAPI) {
        try {
            const initialData = await window.electronAPI.getWidgetData('metaWin1');
            if (initialData) updateInputs(initialData);

            // --- NUEVO: ESCUCHAR CAMBIOS EXTERNOS (Acciones) ---
            if (window.electronAPI.onWidgetUpdate) {
                window.electronAPI.onWidgetUpdate((evt) => {
                    // Si el widget que cambió es el mio (metaWin1), actualizo mis inputs
                    if (evt.widgetId === 'metaWin1') {
                        updateInputs(evt.data);
                    }
                });
            }
            // ----------------------------------------------------

        } catch (e) {
            console.error("Error cargando MetaWin:", e);
        }
    }

    // Actualiza los inputs de texto visualmente
    function updateInputs(data) {
        if (!data) return;
        // Solo actualizamos si el valor es diferente para no molestar si estás escribiendo
        if (data.conteo !== undefined && conteoInput.value != data.conteo) {
            conteoInput.value = data.conteo;
        }
        if (data.meta !== undefined && metaInput.value != data.meta) {
            metaInput.value = data.meta;
        }
    }

    // Función para guardar y enviar cambios (cuando TÚ tocas los botones)
    async function saveData() {
        const data = {
            conteo: parseInt(conteoInput.value, 10) || 0,
            meta: parseInt(metaInput.value, 10) || 0
        };

        if (window.electronAPI) {
            await window.electronAPI.updateWidget('metaWin1', data);
        }
    }

    // Listeners para botones (+ y -)
    plusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = metaWinWidget.querySelector('#' + button.dataset.target);
            let val = parseInt(targetInput.value, 10) || 0;
            targetInput.value = val + 1;
            saveData();
        });
    });

    minusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = metaWinWidget.querySelector('#' + button.dataset.target);
            let val = parseInt(targetInput.value, 10) || 0;
            targetInput.value = val - 1;
            saveData();
        });
    });
    
    // Listeners para escritura directa
    metaInput.addEventListener('change', saveData); // Cambiado a 'change' para evitar bucles raros al escribir rápido
    conteoInput.addEventListener('change', saveData);
});
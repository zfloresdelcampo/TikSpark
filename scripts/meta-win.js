// scripts/meta-win.js

document.addEventListener('DOMContentLoaded', async () => {
    const metaWinWidget = document.getElementById('meta-win-widget-1');
    if (!metaWinWidget) return;

    // Referencias a los INPUTS (Ya no necesitamos las referencias a la "preview")
    const metaInput = metaWinWidget.querySelector('#meta-win-meta-input');
    const conteoInput = metaWinWidget.querySelector('#meta-win-conteo-input');
    
    // Botones
    const plusButtons = metaWinWidget.querySelectorAll('.btn-win.plus');
    const minusButtons = metaWinWidget.querySelectorAll('.btn-win.minus');

    // 1. Cargar datos iniciales desde el Backend Local al abrir la app
    if (window.electronAPI) {
        try {
            const initialData = await window.electronAPI.getWidgetData('metaWin1');
            if (initialData) updateInputs(initialData);
        } catch (e) {
            console.error("Error cargando MetaWin:", e);
        }
    }

    // Actualiza SOLO los inputs de texto (la previsualización se actualiza sola por el Iframe)
    function updateInputs(data) {
        if (!data) return;
        if (data.conteo !== undefined) conteoInput.value = data.conteo;
        if (data.meta !== undefined) metaInput.value = data.meta;
    }

    // Función para guardar y enviar cambios
    async function saveData() {
        const data = {
            conteo: parseInt(conteoInput.value, 10) || 0,
            meta: parseInt(metaInput.value, 10) || 0
        };

        // Enviar al Backend -> Socket.io
        // (El Socket avisará al Overlay en OBS Y al Iframe de la app al mismo tiempo)
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
    
    // Listeners para escritura directa (input manual)
    metaInput.addEventListener('input', saveData);
    conteoInput.addEventListener('input', saveData);
});
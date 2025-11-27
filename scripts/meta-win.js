// scripts/meta-win.js

document.addEventListener('DOMContentLoaded', async () => {
    const metaWinWidget = document.getElementById('meta-win-widget-1');
    if (!metaWinWidget) return;

    // Referencias a elementos del DOM
    const metaInput = metaWinWidget.querySelector('#meta-win-meta-input');
    const conteoInput = metaWinWidget.querySelector('#meta-win-conteo-input');
    const previewMeta = metaWinWidget.querySelector('#preview-win-meta');
    const previewConteo = metaWinWidget.querySelector('#preview-win-conteo');
    const plusButtons = metaWinWidget.querySelectorAll('.btn-win.plus');
    const minusButtons = metaWinWidget.querySelectorAll('.btn-win.minus');

    // 1. Cargar datos iniciales desde el Backend Local
    if (window.electronAPI) {
        try {
            const initialData = await window.electronAPI.getWidgetData('metaWin1');
            if (initialData) updateUI(initialData);
        } catch (e) {
            console.error("Error cargando MetaWin:", e);
        }
    }

    // Función para actualizar la interfaz de la app
    function updateUI(data) {
        if (!data) return;
        conteoInput.value = data.conteo || 0;
        metaInput.value = data.meta || 5;
        previewConteo.textContent = data.conteo || 0;
        previewMeta.textContent = data.meta || 5;
    }

    // Función para guardar y enviar cambios al overlay
    async function saveData() {
        const data = {
            conteo: parseInt(conteoInput.value, 10) || 0,
            meta: parseInt(metaInput.value, 10) || 0
        };

        // Actualizar UI local inmediatamente
        previewConteo.textContent = data.conteo;
        previewMeta.textContent = data.meta;

        // Enviar al Backend (Main.js) -> Socket.io -> Overlay
        if (window.electronAPI) {
            await window.electronAPI.updateWidget('metaWin1', data);
        }
    }

    // Listeners para botones
    plusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = metaWinWidget.querySelector('#' + button.dataset.target);
            targetInput.value = (parseInt(targetInput.value, 10) || 0) + 1;
            saveData();
        });
    });

    minusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = metaWinWidget.querySelector('#' + button.dataset.target);
            targetInput.value = (parseInt(targetInput.value, 10) || 0) - 1;
            saveData();
        });
    });
    
    // Listeners para escritura directa
    metaInput.addEventListener('input', saveData);
    conteoInput.addEventListener('input', saveData);
});
// scripts/meta-win.js

document.addEventListener('DOMContentLoaded', () => {
    // ESTA ES LA LÍNEA MÁS IMPORTANTE:
    // Solo ejecutamos el código si encontramos el widget en la página actual.
    const metaWinWidget = document.getElementById('meta-win-widget-1');
    if (!metaWinWidget) {
        return; // Si no lo encontramos, detenemos la ejecución de este script.
    }

    // El resto de tu código ahora está seguro.
    if (typeof firebase === 'undefined') {
        console.error("Firebase no está cargado.");
        return;
    }

    const databaseRef = firebase.database().ref('widgets/metaWin1');

    const metaInput = metaWinWidget.querySelector('#meta-win-meta-input');
    const conteoInput = metaWinWidget.querySelector('#meta-win-conteo-input');
    const previewMeta = metaWinWidget.querySelector('#preview-win-meta');
    const previewConteo = metaWinWidget.querySelector('#preview-win-conteo');
    const plusButtons = metaWinWidget.querySelectorAll('.btn-win.plus');
    const minusButtons = metaWinWidget.querySelectorAll('.btn-win.minus');

    databaseRef.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('[Meta-Win Panel] Datos recibidos de Firebase:', data);
        
        let conteo = 0;
        let meta = 5;

        if (data) {
            conteo = data.conteo;
            meta = data.meta;
        }

        conteoInput.value = conteo;
        metaInput.value = meta;
        previewConteo.textContent = conteo;
        previewMeta.textContent = meta;
    });

    function saveData() {
        const data = {
            conteo: parseInt(conteoInput.value, 10) || 0,
            meta: parseInt(metaInput.value, 10) || 0
        };
        databaseRef.set(data);
    }

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
    
    metaInput.addEventListener('input', saveData);
    conteoInput.addEventListener('input', saveData);
});
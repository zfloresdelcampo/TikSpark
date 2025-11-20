/* ======================================================= */
/* --- CÓDIGO FINAL CON ESCUCHA EN TIEMPO REAL --- */
/* ======================================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Asegurarnos de que Firebase está listo antes de usarlo
    if (typeof firebase === 'undefined') {
        console.error("Firebase no está cargado. Asegúrate de que los scripts de Firebase estén en index.html.");
        return;
    }

    const metaWinWidget = document.getElementById('meta-win-widget-1');
    if (!metaWinWidget) return;

    const databaseRef = firebase.database().ref('widgets/metaWin1');

    const metaInput = metaWinWidget.querySelector('#meta-win-meta-input');
    const conteoInput = metaWinWidget.querySelector('#meta-win-conteo-input');
    const previewMeta = metaWinWidget.querySelector('#preview-win-meta');
    const previewConteo = metaWinWidget.querySelector('#preview-win-conteo');
    const plusButtons = metaWinWidget.querySelectorAll('.btn-win.plus');
    const minusButtons = metaWinWidget.querySelectorAll('.btn-win.minus');

    // --- LA MAGIA ESTÁ AQUÍ ---
    // Esta función ahora se ejecutará CADA VEZ que los datos cambien en Firebase
    databaseRef.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('[Meta-Win Panel] Datos recibidos de Firebase:', data);
        
        let conteo = 0;
        let meta = 5;

        if (data) {
            conteo = data.conteo;
            meta = data.meta;
        }

        // Actualizamos tanto los inputs como la vista previa del panel
        conteoInput.value = conteo;
        metaInput.value = meta;
        previewConteo.textContent = conteo;
        previewMeta.textContent = meta;
    });

    // Esta función ahora solo se usa para ESCRIBIR en Firebase
    function saveData() {
        const data = {
            conteo: parseInt(conteoInput.value, 10) || 0,
            meta: parseInt(metaInput.value, 10) || 0
        };
        databaseRef.set(data);
    }

    // Los botones ahora solo llaman a saveData
    plusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = metaWinWidget.querySelector('#' + button.dataset.target);
            targetInput.value = (parseInt(targetInput.value, 10) || 0) + 1;
            saveData(); // Guardamos el nuevo valor
        });
    });

    minusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetInput = metaWinWidget.querySelector('#' + button.dataset.target);
            targetInput.value = (parseInt(targetInput.value, 10) || 0) - 1;
            saveData(); // Guardamos el nuevo valor
        });
    });
    
    // Los inputs también llaman a saveData
    metaInput.addEventListener('input', saveData);
    conteoInput.addEventListener('input', saveData);
});
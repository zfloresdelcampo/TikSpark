// --- START OF FILE scripts/media.js ---

document.addEventListener('DOMContentLoaded', () => {
    
    const container = document.getElementById('media-container');
    
    // 2. Conectar al servidor local (Sin definir puerto, usa el actual)
    const socket = io();

    console.log("✅ Conectado al sistema local (Media.js)");

    // 3. Escuchar cuando la app mande un video
    socket.on('widget-update', (msg) => {
        // Verificamos si el mensaje es para este overlay ('mediaOverlay')
        if (msg.widgetId === 'mediaOverlay' && msg.data.url) {
            
            // Validamos que no sea un mensaje viejo (10 segundos de margen)
            const timeDiff = Date.now() - (msg.data.timestamp || 0);
            if (timeDiff < 10000) { 
                showMedia(msg.data);
            }
        }
    });

    function showMedia(data) {
        console.log("▶️ Reproduciendo:", data.url);
        container.innerHTML = ''; 
        
        // Reiniciar animación
        container.className = '';
        void container.offsetWidth; 

        let element;
        const isVideo = data.url.includes('.mp4') || data.url.includes('.webm');

        if (isVideo) {
            element = document.createElement('video');
            element.src = data.url;
            element.autoplay = true;
            element.volume = (data.volume || 100) / 100;
            
            // Intentar reproducir con sonido
            element.play().catch(e => {
                console.warn("Autoplay bloqueado, intentando muteado");
                element.muted = true;
                element.play();
            });

            element.onended = () => hideMedia(); 
        } else {
            element = document.createElement('img');
            element.src = data.url;
        }

        container.appendChild(element);
        container.style.display = 'block';
        
        setTimeout(() => container.classList.add('show'), 50);

        // Si es imagen, quitarla tras el tiempo configurado
        if (!isVideo) {
            const duration = (data.duration || 5) * 1000;
            setTimeout(hideMedia, duration);
        }
    }

    function hideMedia() {
        container.classList.remove('show');
        setTimeout(() => {
            container.style.display = 'none';
            container.innerHTML = '';
        }, 500);
    }
});
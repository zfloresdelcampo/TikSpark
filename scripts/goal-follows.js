document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const container = document.getElementById('container');
    const fill = document.getElementById('fill');
    const text = document.getElementById('text');

    // Escuchar datos iniciales y actualizaciones para 'goalFollows'
    socket.on('init-data', (db) => { if(db && db.goalFollows) update(db.goalFollows); });
    socket.on('widget-update', (msg) => { if(msg.widgetId === 'goalFollows') update(msg.data); });

    function update(data) {
        container.classList.add('show');
        const cur = data.current || 0;
        const max = data.meta || 100; // Meta por defecto para follows suele ser menor
        const pct = Math.min((cur / max) * 100, 100);
        
        fill.style.width = `${pct}%`;
        // Texto actualizado para FOLLOWS
        text.innerHTML = `${data.title}&nbsp;-&nbsp;<span style="color:#e0e0e0">${cur}</span>&nbsp;/&nbsp;${max} FOLLOWS`;
    }
});
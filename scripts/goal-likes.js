document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const container = document.getElementById('container');
    const fill = document.getElementById('fill');
    const text = document.getElementById('text');

    socket.on('init-data', (db) => { if(db && db.goalLikes) update(db.goalLikes); });
    socket.on('widget-update', (msg) => { if(msg.widgetId === 'goalLikes') update(msg.data); });

    function update(data) {
        container.classList.add('show');
        const cur = data.current || 0;
        const max = data.meta || 1000;
        const pct = Math.min((cur / max) * 100, 100);
        
        fill.style.width = `${pct}%`;
        text.innerHTML = `${data.title}&nbsp;-&nbsp;<span style="color:white">${cur}</span>&nbsp;/&nbsp;${max} LIKES`;
    }
});
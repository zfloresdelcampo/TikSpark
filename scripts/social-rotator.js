document.addEventListener('DOMContentLoaded', async () => {
    
    const btnOpen = document.getElementById('btn-config-social-rotator');
    const modal = document.getElementById('social-rotator-modal');
    const btnClose = document.getElementById('close-social-rotator-modal');
    const btnSave = document.getElementById('save-social-rotator-btn');
    const btnAdd = document.getElementById('add-social-field-btn');
    const listContainer = document.getElementById('social-list-container');
    
    const inputDuration = document.getElementById('social-duration');
    const inputPause = document.getElementById('social-pause');
    const inputAnimation = document.getElementById('social-animation');

    // --- CAMBIO: CARGAR DATOS LOCALES ---
    async function loadData() {
        if (!window.electronAPI) return;

        // Pedimos los datos al Main.js
        const data = await window.electronAPI.getWidgetData('socialRotator') || {};
        
        inputDuration.value = data.duration || 5;
        inputPause.value = data.pause || 2;
        inputAnimation.value = data.animation || 'fade';
        
        listContainer.innerHTML = '';
        if(data.accounts && data.accounts.length > 0) {
            data.accounts.forEach(acc => createRow(acc.platform, acc.username, acc.count));
        } else {
            createRow('instagram', '', '');
        }
    }

    if(btnOpen) {
        btnOpen.addEventListener('click', () => {
            modal.style.display = 'flex';
            loadData();
        });
    }

    if(btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
    if(btnAdd) btnAdd.addEventListener('click', () => createRow());

    // --- CAMBIO: GUARDAR DATOS LOCALES ---
    if(btnSave) {
        btnSave.addEventListener('click', async () => {
            const rows = listContainer.children;
            const accounts = [];

            for(let row of rows) {
                const select = row.querySelector('select');
                const inputs = row.querySelectorAll('input');
                const userIn = inputs[0];
                const countIn = inputs[1];

                if(userIn.value.trim() !== "") {
                    accounts.push({
                        platform: select.value,
                        username: userIn.value.trim(),
                        count: countIn.value.trim()
                    });
                }
            }

            const data = {
                duration: parseInt(inputDuration.value),
                pause: parseInt(inputPause.value),
                animation: inputAnimation.value,
                accounts: accounts
            };

            // Enviamos al Main.js -> Socket.io
            if(window.electronAPI) {
                await window.electronAPI.updateWidget('socialRotator', data);
                alert('Configuración guardada (Local).');
                modal.style.display = 'none';
            }
        });
    }

    function createRow(platformVal = 'instagram', userVal = '', countVal = '') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '5px';
        row.style.marginBottom = '10px';
        row.style.alignItems = 'center';
        
        const select = document.createElement('select');
        select.style.padding = '8px';
        select.style.background = '#333';
        select.style.color = 'white';
        select.style.border = '1px solid #555';
        select.style.borderRadius = '5px';
        select.style.width = '100px'; 
        
        const platforms = ['instagram', 'tiktok', 'twitter', 'kick', 'youtube', 'twitch', 'discord', 'facebook', 'spotify'];
        platforms.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
            if(p === platformVal) opt.selected = true;
            select.appendChild(opt);
        });

        const inputUser = document.createElement('input');
        inputUser.type = 'text';
        inputUser.value = userVal;
        inputUser.placeholder = '@usuario';
        inputUser.style.padding = '8px';
        inputUser.style.flex = '1'; 
        inputUser.style.background = '#333';
        inputUser.style.color = 'white';
        inputUser.style.border = '1px solid #555';
        inputUser.style.borderRadius = '5px';

        const inputCount = document.createElement('input');
        inputCount.type = 'text';
        inputCount.value = countVal;
        inputCount.placeholder = '10k Subs';
        inputCount.style.padding = '8px';
        inputCount.style.width = '80px';
        inputCount.style.background = '#333';
        inputCount.style.color = '#aaa';
        inputCount.style.border = '1px solid #555';
        inputCount.style.borderRadius = '5px';

        const btnDelete = document.createElement('button');
        btnDelete.innerHTML = '<i class="fas fa-trash"></i>';
        btnDelete.style.background = '#ff4444';
        btnDelete.style.color = 'white';
        btnDelete.style.border = 'none';
        btnDelete.style.padding = '8px 12px';
        btnDelete.style.borderRadius = '5px';
        btnDelete.style.cursor = 'pointer';
        
        btnDelete.addEventListener('click', () => row.remove());

        row.appendChild(select);
        row.appendChild(inputUser);
        row.appendChild(inputCount);
        row.appendChild(btnDelete);
        listContainer.appendChild(row);
    }
});
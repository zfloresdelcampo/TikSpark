document.addEventListener('DOMContentLoaded', () => {
    
    const btnOpen = document.getElementById('btn-config-social-rotator');
    const modal = document.getElementById('social-rotator-modal');
    const btnClose = document.getElementById('close-social-rotator-modal');
    const btnSave = document.getElementById('save-social-rotator-btn');
    const btnAdd = document.getElementById('add-social-field-btn');
    const listContainer = document.getElementById('social-list-container');
    
    const inputDuration = document.getElementById('social-duration');
    const inputPause = document.getElementById('social-pause');
    const inputAnimation = document.getElementById('social-animation');

    if (typeof firebase === 'undefined') return;
    const dbRef = firebase.database().ref('widgets/socialRotator');

    if(btnOpen) {
        btnOpen.addEventListener('click', () => {
            modal.style.display = 'flex';
            loadData();
        });
    }

    if(btnClose) {
        btnClose.addEventListener('click', () => modal.style.display = 'none');
    }

    function loadData() {
        dbRef.once('value').then(snapshot => {
            const data = snapshot.val() || {};
            inputDuration.value = data.duration || 5;
            inputPause.value = data.pause || 2;
            inputAnimation.value = data.animation || 'fade';
            
            listContainer.innerHTML = '';
            if(data.accounts && data.accounts.length > 0) {
                // Pasamos también el campo 'count'
                data.accounts.forEach(acc => createRow(acc.platform, acc.username, acc.count));
            } else {
                createRow('instagram', '', '');
            }
        });
    }

    // Modificamos esta función para aceptar un tercer parámetro: countVal
    function createRow(platformVal = 'instagram', userVal = '', countVal = '') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '5px';
        row.style.marginBottom = '10px';
        row.style.alignItems = 'center';
        
        // 1. Selector Plataforma
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

        // 2. Input Usuario
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

        // 3. NUEVO: Input Contador
        const inputCount = document.createElement('input');
        inputCount.type = 'text';
        inputCount.value = countVal;
        inputCount.placeholder = '10.5K Subs'; // Texto de ejemplo
        inputCount.style.padding = '8px';
        inputCount.style.width = '80px'; // Más pequeño
        inputCount.style.background = '#333';
        inputCount.style.color = '#aaa'; // Color un poco diferente
        inputCount.style.border = '1px solid #555';
        inputCount.style.borderRadius = '5px';

        // 4. Botón Eliminar
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
        row.appendChild(inputCount); // Agregamos el nuevo input
        row.appendChild(btnDelete);
        listContainer.appendChild(row);
    }

    if(btnAdd) {
        btnAdd.addEventListener('click', () => createRow());
    }

    if(btnSave) {
        btnSave.addEventListener('click', () => {
            const rows = listContainer.children;
            const accounts = [];

            for(let row of rows) {
                const select = row.querySelector('select');
                const inputs = row.querySelectorAll('input'); // Obtenemos todos los inputs
                const userIn = inputs[0];
                const countIn = inputs[1]; // El segundo input es el contador

                if(userIn.value.trim() !== "") {
                    accounts.push({
                        platform: select.value,
                        username: userIn.value.trim(),
                        count: countIn.value.trim() // Guardamos el contador
                    });
                }
            }

            const data = {
                duration: parseInt(inputDuration.value),
                pause: parseInt(inputPause.value),
                animation: inputAnimation.value,
                accounts: accounts
            };

            dbRef.set(data).then(() => {
                alert('Configuración guardada!');
                modal.style.display = 'none';
            }).catch(e => console.error(e));
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const elementos = {
        toggleButton: document.getElementById('toggleButton'),
        statusText: document.getElementById('statusText'),
        totalTapTaps: document.getElementById('totalTapTaps'),
        sessionLikes: document.getElementById('sessionLikes'),
        resetStats: document.getElementById('resetStats'),
        openTikTok: document.getElementById('openTikTok')
    };
    
    // Estado
    let updateInterval = null;
    
    // Funciones
    const updateUI = (activo, contador = 0) => {
        if (activo) {
            elementos.statusText.textContent = 'Activo';
            elementos.statusText.className = 'status-text active';
            elementos.toggleButton.textContent = 'Detener';
            elementos.toggleButton.className = 'toggle-button stop';
        } else {
            elementos.statusText.textContent = 'Inactivo';
            elementos.statusText.className = 'status-text inactive';
            elementos.toggleButton.textContent = 'Iniciar';
            elementos.toggleButton.className = 'toggle-button start';
        }
        elementos.sessionLikes.textContent = contador;
    };
    
    const updatePopupStatus = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('tiktok.com')) {
                elementos.statusText.textContent = 'Abre TikTok primero';
                elementos.toggleButton.disabled = true;
                elementos.openTikTok.style.display = 'block';
                return;
            }
            
            elementos.openTikTok.style.display = 'none';
            
            chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, response => {
                if (chrome.runtime.lastError) {
                    elementos.statusText.textContent = 'Recarga la página de TikTok';
                    elementos.toggleButton.disabled = true;
                    elementos.sessionLikes.textContent = '0';
                } else if (response) {
                    updateUI(response.activo, response.contador);
                    elementos.toggleButton.disabled = false;
                }
            });
        } catch (error) {
            console.error('Error updating popup:', error);
        }
        
        // Actualizar total de Tap-Taps
        chrome.storage.local.get(['totalTapTaps'], result => {
            elementos.totalTapTaps.textContent = result.totalTapTaps || 0;
        });
    };
    
    // Event Listeners
    elementos.toggleButton.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
        setTimeout(updatePopupStatus, 100);
    });
    
    elementos.resetStats.addEventListener('click', () => {
        if (confirm('¿Estás seguro de resetear las estadísticas?')) {
            chrome.storage.local.set({ totalTapTaps: 0 }, () => {
                elementos.totalTapTaps.textContent = '0';
            });
        }
    });
    
    elementos.openTikTok.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.tiktok.com' });
        window.close();
    });
    
    // Inicializar
    updatePopupStatus();
    updateInterval = setInterval(updatePopupStatus, 1000);
    
    // Cleanup
    window.addEventListener('unload', () => {
        if (updateInterval) clearInterval(updateInterval);
    });
});
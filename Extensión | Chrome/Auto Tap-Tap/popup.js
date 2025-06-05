document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const elementos = {
        toggleButton: document.getElementById('toggleButton'),
        statusText: document.getElementById('statusText'),
        totalTapTaps: document.getElementById('totalTapTaps'),
        sessionLikes: document.getElementById('sessionLikes'),
        resetStats: document.getElementById('resetStats'),
        openTikTok: document.getElementById('openTikTok'),
        chatReactivationTime: document.getElementById('chatReactivationTime')
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
    
    // Manejar cambios en el tiempo de reactivación
    elementos.chatReactivationTime.addEventListener('input', () => {
        let tiempo = parseInt(elementos.chatReactivationTime.value);
        
        // Validar rango
        if (tiempo < 10) tiempo = 10;
        if (tiempo > 60) tiempo = 60;
        if (isNaN(tiempo)) tiempo = 10;
        
        // Actualizar valor en input
        elementos.chatReactivationTime.value = tiempo;
        
        // Guardar y sincronizar
        chrome.storage.local.set({ tiempoReactivacion: tiempo });
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab && tab.url.includes('tiktok.com')) {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'updateReactivationTime', 
                    tiempo: tiempo 
                });
            }
        });
    });
        
        // Escuchar cambios desde content.js
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'tiempoReactivacionChanged') {
                elementos.chatReactivationTime.value = request.tiempo;
            }
        });

    // Cargar tiempo de reactivación guardado
    chrome.storage.local.get(['tiempoReactivacion'], result => {
        if (result.tiempoReactivacion) {
            elementos.chatReactivationTime.value = result.tiempoReactivacion;
        }
    });

    // Inicializar
    updatePopupStatus();
    updateInterval = setInterval(updatePopupStatus, 1000);
    
    // Cleanup
    window.addEventListener('unload', () => {
        if (updateInterval) clearInterval(updateInterval);
    });
});
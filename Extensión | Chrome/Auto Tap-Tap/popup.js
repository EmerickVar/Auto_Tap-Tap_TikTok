document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const elementos = {
        toggleButton: document.getElementById('toggleButton'),
        statusText: document.getElementById('statusText'),
        totalTapTaps: document.getElementById('totalTapTaps'),
        sessionTapTaps: document.getElementById('sessionTapTaps'),
        resetStats: document.getElementById('resetStats'),
        openTikTok: document.getElementById('openTikTok'),
        chatReactivationTime: document.getElementById('chatReactivationTime')
    };
    
    let updateInterval = null;

    // Función de limpieza
    const cleanup = () => {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    };
    
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
        elementos.sessionTapTaps.textContent = contador;
    };
    
    const updatePopupStatus = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url || !tab.url.includes('tiktok.com')) {
                elementos.statusText.textContent = '⚠️ Abre TikTok primero';
                elementos.toggleButton.disabled = true;
                elementos.openTikTok.style.display = 'block';
                return;
            }
            
            elementos.openTikTok.style.display = 'none';
            
            // Intentar obtener el estado actual
            chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, response => {
                if (chrome.runtime.lastError) {
                    elementos.statusText.textContent = '🔄 Recarga la página de TikTok';
                    elementos.toggleButton.disabled = true;
                    elementos.sessionTapTaps.textContent = '0';
                    
                    // Recargar la página automáticamente después de 3 segundos
                    setTimeout(() => {
                        chrome.tabs.reload(tab.id);
                    }, 3000);
                } else if (response) {
                    updateUI(response.activo, response.contador);
                    elementos.toggleButton.disabled = false;
                    
                    // Actualizar tiempo de reactivación si existe
                    if (response.tiempoReactivacion) {
                        elementos.chatReactivationTime.value = response.tiempoReactivacion;
                    }
                }
            });
            
            // Actualizar total de Tap-Taps
            chrome.storage.local.get(['totalTapTaps'], result => {
                elementos.totalTapTaps.textContent = result.totalTapTaps || 0;
            });
        } catch (error) {
            console.error('Error updating popup:', error);
        }
    };
    
    // Event Listeners
    elementos.toggleButton.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, response => {
            if (!chrome.runtime.lastError && response?.success) {
                updatePopupStatus();
            }
        });
    });
    
    elementos.resetStats.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.storage.local.set({ totalTapTaps: 0 });
        chrome.tabs.sendMessage(tab.id, { action: 'updateTapTaps', count: 0 }, response => {
            if (!chrome.runtime.lastError && response?.success) {
                elementos.totalTapTaps.textContent = '0';
                elementos.sessionTapTaps.textContent = '0';
            }
        });
    });
    
    elementos.openTikTok.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.tiktok.com' });
    });
    
    elementos.chatReactivationTime.addEventListener('change', () => {
        let tiempo = parseInt(elementos.chatReactivationTime.value);
        if (isNaN(tiempo) || tiempo < 10) tiempo = 10;
        if (tiempo > 60) tiempo = 60;
        
        elementos.chatReactivationTime.value = tiempo;
        
        chrome.storage.local.set({ tiempoReactivacion: tiempo }, () => {
            const [tab] = chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab && tab.url.includes('tiktok.com')) {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'updateReactivationTime', 
                        tiempo: tiempo 
                    });
                }
            });
        });
    });
    
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
    
    // Inicializar y actualizar periódicamente
    updatePopupStatus();
    updateInterval = setInterval(updatePopupStatus, 1000);
    
    // Registrar limpieza cuando la extensión se suspende
    chrome.runtime.onSuspend.addListener(cleanup);
});
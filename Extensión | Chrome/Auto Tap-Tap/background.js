// background.js - Servicio trabajador con insignia mejorada
let taptapsCount = 0;
let badgeInterval = null;
let extensionState = {
    active: false,
    contador: 0
};

// Función para actualizar la insignia
function updateBadge(count) {
    const text = count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text });
}

// Función para animar la insignia
function animateBadge() {
    if (badgeInterval) {
        clearInterval(badgeInterval);
    }
    
    let isAlternate = false;
    badgeInterval = setInterval(() => {
        if (extensionState.active) {
            chrome.action.setBadgeBackgroundColor({ 
                color: isAlternate ? '#00cc66' : '#00ff88' 
            });
            isAlternate = !isAlternate;
        } else {
            clearInterval(badgeInterval);
            chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
        }
    }, 1000);
}

// Función para sincronizar estado
async function syncState() {
    try {
        const tabs = await chrome.tabs.query({ active: true });
        const tiktokTabs = tabs.filter(tab => tab.url?.includes('tiktok.com'));
        
        for (const tab of tiktokTabs) {
            chrome.tabs.sendMessage(tab.id, { 
                action: 'getStatus' 
            }, response => {
                if (!chrome.runtime.lastError && response) {
                    extensionState = {
                        active: response.activo,
                        contador: response.contador
                    };
                    updateBadge(response.contador);
                    if (response.activo) {
                        animateBadge();
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error syncing state:', error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    // Inicializar almacenamiento
    chrome.storage.local.get(['totalTapTaps', 'tiempoReactivacion'], result => {
        if (!result.totalTapTaps) {
            chrome.storage.local.set({ totalTapTaps: 0 });
        }
        if (!result.tiempoReactivacion) {
            chrome.storage.local.set({ tiempoReactivacion: 10 });
        }
    });
    
    // Configurar insignia inicial
    chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
});

// Escuchar mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.action) {
        case 'started':
            extensionState.active = true;
            if (request.contador !== undefined) {
                extensionState.contador = request.contador;
                updateBadge(request.contador);
            }
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff88' });
            animateBadge();
            break;
            
        case 'stopped':
            extensionState.active = false;
            chrome.action.setBadgeText({ text: 'OFF' });
            chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
            if (badgeInterval) {
                clearInterval(badgeInterval);
            }
            break;
            
        case 'updateCounter':
            extensionState.contador = request.count;
            updateBadge(request.count);
            break;
            
        case 'ping':
            sendResponse({ success: true });
            break;
    }
    
    return true;
});

// Sincronizar estado periódicamente
setInterval(syncState, 5000);
// background.js - Servicio trabajador con insignia mejorada
let taptapsCount = 0;
let badgeInterval = null;

chrome.runtime.onInstalled.addListener(() => {
    // Inicializar almacenamiento
    chrome.storage.local.get(['totalTapTaps'], result => {
        if (!result.totalTapTaps) {
            chrome.storage.local.set({ totalTapTaps: 0 });
        }
    });
    
    // Configurar insignia inicial
    chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
});

// Función para actualizar la insignia
function updateBadge(count) {
    if (count > 0) {
        // Formatear número para la insignia
        let badgeText = count.toString();
        if (count > 999) {
            badgeText = Math.floor(count / 1000) + 'k';
        }
        if (count > 999999) {
            badgeText = Math.floor(count / 1000000) + 'M';
        }
        
        chrome.action.setBadgeText({ text: badgeText });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Función para animar la insignia
function animateBadge() {
    const colors = ['#ff0050', '#ff3366', '#ff0050'];
    let colorIndex = 0;
    
    badgeInterval = setInterval(() => {
        chrome.action.setBadgeBackgroundColor({ 
            color: colors[colorIndex % colors.length] 
        });
        colorIndex++;
    }, 500);
}

// Escuchar mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.action) {
        case 'started':
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff88' });
            animateBadge();
            break;
            
        case 'stopped':
            if (badgeInterval) {
                clearInterval(badgeInterval);
                badgeInterval = null;
            }
            chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
            updateBadge(taptapsCount);
            break;
            
        case 'updateTapTaps':
            taptapsCount = request.count;
            if (!badgeInterval) { // Solo actualizar si no está animando
                updateBadge(taptapsCount);
            }
            break;
            
        case 'resetBadge':
            taptapsCount = 0;
            chrome.action.setBadgeText({ text: '' });
            break;
    }
});

// Actualizar la insignia al cambiar entre pestañas
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    if (tab.url && tab.url.includes('tiktok.com')) {
        // Mostrar el contador en la insignia si estamos en TikTok
        chrome.storage.local.get(['totalTapTaps'], result => {
            updateBadge(result.totalTapTaps || 0);
        });
    } else {
        // Ocultar la insignia si no estamos en una pestaña de TikTok
        chrome.action.setBadgeText({ text: '' });
    }
});
(function() {
    'use strict';
    
    // Evitar múltiples inyecciones
    if (document.getElementById('tiktok-auto-taptap')) return;
    
    // Estado de la aplicación
    const state = {
        intervalo: null,
        activo: false,
        contador: 0,
        isDragging: false,
        currentX: 0,
        currentY: 0,
        initialX: 0,
        initialY: 0,
        xOffset: 0,
        yOffset: 0,
        chatTimeout: null,
        tiempoReactivacion: 10,
        pausadoPorChat: false,
        apagadoManualmente: false
    };
    
    // Configuración
    const config = {
        intervalos: [
            { valor: 200, texto: '200 milisegundos | [Muy rápido]' },
            { valor: 250, texto: '250 milisegundos | [Rápido]' },
            { valor: 500, texto: '500 milisegundos | [Normal]' },
            { valor: 1000, texto: '1  segundo      | [Lento]' }
        ],
        defaultInterval: 200 // Valor por defecto en milisegundos
    };
    
    // Elementos DOM
    const elementos = {};
    
    // Funciones principales
    function presionarL() {
        const evento = new KeyboardEvent('keydown', {
            key: 'l',
            code: 'KeyL',
            keyCode: 76,
            which: 76,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(evento);
        state.contador++;
        actualizarContador();
        guardarEstadisticas();
    }

    // En content.js, modifica la función presionarL para actualizar el badge:
    function presionarL() {
        const evento = new KeyboardEvent('keydown', {
            key: 'l',
            code: 'KeyL',
            keyCode: 76,
            which: 76,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(evento);
        state.contador++;
        actualizarContador();
        guardarEstadisticas();
        
        // Actualizar badge
        chrome.runtime.sendMessage({ 
            action: 'updateLikes', 
            count: state.contador 
        });
    }
    
    function actualizarContador() {
        if (elementos.contador) {
            elementos.contador.textContent = state.contador;
        }
    }
    
    function guardarEstadisticas() {
        chrome.storage.local.get(['totalTapTaps'], result => {
            chrome.storage.local.set({ 
                totalTapTaps: (result.totalTapTaps || 0) + 1 
            });
        });
    }
    
    function toggleAutoTapTap(fromChat = false) {
        if (!fromChat) {
            state.apagadoManualmente = !state.activo;
        }
        
        state.activo = !state.activo;
        
        if (state.activo) {
            const intervalo = parseInt(elementos.selector.value);
            elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
            elementos.boton.style.background = '#00ff88';
            elementos.selector.disabled = true;
            elementos.selector.style.opacity = '0.5';
            
            presionarL();
            state.intervalo = setInterval(presionarL, intervalo);
            chrome.runtime.sendMessage({ action: 'started' });
        } else {
            elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
            elementos.boton.style.background = '#ff0050';
            elementos.selector.disabled = false;
            elementos.selector.style.opacity = '1';
            
            clearInterval(state.intervalo);
            chrome.runtime.sendMessage({ action: 'stopped' });
        }
    }
    
    // Funciones de arrastre
    function dragStart(e) {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        state.initialX = clientX - state.xOffset;
        state.initialY = clientY - state.yOffset;
        
        if (e.target === elementos.contenedor || e.target === elementos.barraArrastre) {
            state.isDragging = true;
        }
    }
    
    function dragEnd() {
        state.initialX = state.currentX;
        state.initialY = state.currentY;
        state.isDragging = false;
        
        chrome.storage.local.set({ 
            position: { x: state.xOffset, y: state.yOffset } 
        });
    }
    
    function drag(e) {
        if (!state.isDragging) return;
        
        e.preventDefault();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        state.currentX = clientX - state.initialX;
        state.currentY = clientY - state.initialY;
        state.xOffset = state.currentX;
        state.yOffset = state.currentY;
        
        elementos.contenedor.style.transform = `translate3d(${state.xOffset}px, ${state.yOffset}px, 0)`;
    }
    
    // Crear interfaz
    function crearInterfaz() {
        // Contenedor principal
        elementos.contenedor = document.createElement('div');
        elementos.contenedor.id = 'tiktok-auto-taptap';
        elementos.contenedor.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            background: rgba(0, 0, 0, 0.8);
            width: 250px;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            font-family: Arial, sans-serif;
            cursor: move;
            user-select: none;
            box-sizing: border-box;
        `;
        
        // Barra de arrastre
        elementos.barraArrastre = document.createElement('div');
        elementos.barraArrastre.style.cssText = `
            width: 100%;
            height: 25px;
            background: rgba(255, 255, 255, 0.1);
            margin: -15px -15px 10px -15px;
            border-radius: 10px 10px 0 0;
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const indicador = document.createElement('div');
        indicador.style.cssText = `
            width: 40px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
        `;
        elementos.barraArrastre.appendChild(indicador);
        
        // Botón minimizar
        elementos.botonMinimizar = document.createElement('button');
        elementos.botonMinimizar.textContent = '−';
        elementos.botonMinimizar.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: transparent;
            color: white;
            border: 1px solid white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            line-height: 0;
            padding: 0;
        `;
        
        // Botón principal
        elementos.boton = document.createElement('button');
        elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
        elementos.boton.style.cssText = `
            background: #ff0050;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
            width: 100%;
            margin-bottom: 10px;
        `;
        
        // Selector de intervalo
        elementos.selector = document.createElement('select');
        elementos.selector.style.cssText = `
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            border-radius: 5px;
            border: 1px solid #ccc;
            background: white;
            cursor: pointer;
        `;
        
        config.intervalos.forEach(({ valor, texto }) => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = texto;
            elementos.selector.appendChild(option);
        });
        
        // Contador
        elementos.contadorDiv = document.createElement('div');
        elementos.contadorDiv.style.cssText = `
            color: white;
            text-align: center;
            margin-top: 10px;
            font-size: 14px;
        `;
        elementos.contadorDiv.innerHTML = '❤️ Tap-taps dados: <span id="contador-taptaps">0</span>';
        elementos.contador = elementos.contadorDiv.querySelector('#contador-taptaps');
        
        // Botón reset
        elementos.botonReset = document.createElement('button');
        elementos.botonReset.textContent = '🔄 Reset';
        elementos.botonReset.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 5px;
            width: 100%;
        `;

        // Configuración de chat
        elementos.configDiv = document.createElement('div');
        elementos.configDiv.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const configLabel = document.createElement('div');
        configLabel.style.cssText = `
            color: white;
            font-size: 12px;
            margin-bottom: 5px;
        `;
        configLabel.textContent = '⚡ Tiempo de espera para reactivación:';

        elementos.tiempoInput = document.createElement('div');
        elementos.tiempoInput.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
        `;

        elementos.reactivacionInput = document.createElement('input');
        elementos.reactivacionInput.type = 'number';
        elementos.reactivacionInput.min = '10';
        elementos.reactivacionInput.max = '60';
        elementos.reactivacionInput.required = true;
        elementos.reactivacionInput.value = state.tiempoReactivacion;
        elementos.reactivacionInput.style.cssText = `
            width: 60px;
            padding: 5px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 12px;
            text-align: center;
        `;

        const unidadSpan = document.createElement('span');
        unidadSpan.style.cssText = `
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
        `;
        unidadSpan.textContent = 'segundos';

        elementos.tiempoInput.appendChild(elementos.reactivacionInput);
        elementos.tiempoInput.appendChild(unidadSpan);
        elementos.configDiv.appendChild(configLabel);
        elementos.configDiv.appendChild(elementos.tiempoInput);
        
        // Sección de copyright
        elementos.copyrightDiv = document.createElement('div');
        elementos.copyrightDiv.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            font-size: 10px;
        `;

        const copyrightLinks = document.createElement('div');
        copyrightLinks.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: center;
        `;

        const orgLink = document.createElement('a');
        orgLink.href = 'https://newagecoding.org/';
        orgLink.target = '_blank';
        orgLink.style.cssText = `
            color: #ff0050;
            text-decoration: none;
            transition: color 0.2s ease;
        `;
        orgLink.textContent = 'New Age Coding Organization';
        orgLink.addEventListener('mouseenter', () => orgLink.style.color = '#ff3366');
        orgLink.addEventListener('mouseleave', () => orgLink.style.color = '#ff0050');

        const devLink = document.createElement('a');
        devLink.href = 'https://github.com/EmerickVar';
        devLink.target = '_blank';
        devLink.style.cssText = `
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            transition: color 0.2s ease;
        `;
        devLink.textContent = '@EmerickVar';
        devLink.addEventListener('mouseenter', () => devLink.style.color = 'rgba(255, 255, 255, 0.8)');
        devLink.addEventListener('mouseleave', () => devLink.style.color = 'rgba(255, 255, 255, 0.6)');

        copyrightLinks.appendChild(orgLink);
        copyrightLinks.appendChild(devLink);
        elementos.copyrightDiv.appendChild(copyrightLinks);

        // Ensamblar interfaz
        elementos.contenedor.appendChild(elementos.barraArrastre);
        elementos.contenedor.appendChild(elementos.botonMinimizar);
        elementos.contenedor.appendChild(elementos.boton);
        elementos.contenedor.appendChild(elementos.selector);
        elementos.contenedor.appendChild(elementos.contadorDiv);
        elementos.contenedor.appendChild(elementos.botonReset);
        elementos.contenedor.appendChild(elementos.configDiv);
        elementos.contenedor.appendChild(elementos.copyrightDiv);
        
        document.body.appendChild(elementos.contenedor);
    }
    
    // Funciones del chat
    function manejarInteraccionChat() {
        // Observador para detectar cuando el chat se añade al DOM
        const observer = new MutationObserver((mutations) => {
            const chatInput = document.querySelector('.tiktok-ikuba6.e2lzvyu1');
            if (chatInput) {
                observer.disconnect();
                configurarEventosChat(chatInput);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Intentar encontrar el chat inmediatamente también
        const chatInput = document.querySelector('.tiktok-ikuba6.e2lzvyu1');
        if (chatInput) {
            configurarEventosChat(chatInput);
        }
    }

    function configurarEventosChat(chatInput) {
        const chatContainer = chatInput.closest('.tiktok-1u9a62k.e2lzvyu4');
        if (!chatContainer) return;

        // Cuando el usuario interactúa con el chat
        chatInput.addEventListener('focus', () => {
            if (state.activo && !state.apagadoManualmente) {
                state.pausadoPorChat = true;
                toggleAutoTapTap(true);
            }
        });

        // Cuando el usuario escribe en el chat
        chatInput.addEventListener('input', () => {
            if (state.chatTimeout) {
                clearTimeout(state.chatTimeout);
            }
            
            if (state.pausadoPorChat) {
                state.chatTimeout = setTimeout(() => {
                    if (!state.apagadoManualmente) {
                        state.pausadoPorChat = false;
                        toggleAutoTapTap(true);
                    }
                }, state.tiempoReactivacion * 1000);
            }
        });

        // Cuando el usuario hace click fuera del chat
        document.addEventListener('click', (e) => {
            if (!chatContainer.contains(e.target) && state.pausadoPorChat && !state.apagadoManualmente) {
                if (state.chatTimeout) {
                    clearTimeout(state.chatTimeout);
                }
                state.pausadoPorChat = false;
                toggleAutoTapTap(true);
            }
        });
    }

    // Configurar eventos
    function configurarEventos() {
        // Toggle
        elementos.boton.addEventListener('click', () => {
            state.apagadoManualmente = !state.activo;
            toggleAutoTapTap(false);
        });
        
        // Reset
        elementos.botonReset.addEventListener('click', () => {
            state.contador = 0;
            actualizarContador();
        });
        
        // Hover effects
        elementos.boton.addEventListener('mouseenter', () => {
            elementos.boton.style.background = state.activo ? '#00ffaa' : '#ff3366';
        });
        
        elementos.boton.addEventListener('mouseleave', () => {
            elementos.boton.style.background = state.activo ? '#00ff88' : '#ff0050';
        });
        
        // Minimizar
        let minimizado = false;
        const elementosOcultables = [elementos.selector, elementos.contadorDiv, elementos.botonReset, elementos.configDiv, elementos.copyrightDiv];
        
        elementos.botonMinimizar.addEventListener('click', () => {
            minimizado = !minimizado;
            elementos.botonMinimizar.textContent = minimizado ? '+' : '−';
            elementosOcultables.forEach(el => el.style.display = minimizado ? 'none' : 'block');
            elementos.contenedor.style.height = minimizado ? 'auto' : 'auto';
            elementos.barraArrastre.style.margin = '-15px -15px 10px -15px';
        });
        
        // Guardar intervalo seleccionado
        elementos.selector.addEventListener('change', () => {
            chrome.storage.local.set({ intervalo: elementos.selector.value });
        });

        // Guardar tiempo de reactivación
        elementos.reactivacionInput.addEventListener('input', () => {
            let tiempo = parseInt(elementos.reactivacionInput.value);
            
            // Validar rango
            if (tiempo < 10) tiempo = 10;
            if (tiempo > 60) tiempo = 60;
            if (isNaN(tiempo)) tiempo = 10;
            
            // Actualizar valor en input
            elementos.reactivacionInput.value = tiempo;
            
            // Actualizar estado y storage
            state.tiempoReactivacion = tiempo;
            chrome.storage.local.set({ tiempoReactivacion: tiempo }, () => {
                // Notificar al popup
                chrome.runtime.sendMessage({ 
                    action: 'tiempoReactivacionChanged', 
                    tiempo: tiempo 
                });
            });
        });
        
        // Drag events
        elementos.contenedor.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);
        elementos.contenedor.addEventListener('touchstart', dragStart);
        elementos.contenedor.addEventListener('touchend', dragEnd);
        elementos.contenedor.addEventListener('touchmove', drag);
        
        // Prevenir drag en elementos interactivos
        [elementos.boton, elementos.selector, elementos.botonReset, elementos.botonMinimizar].forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
        });
        
        // Atajo de teclado
        document.addEventListener('keydown', e => {
            if (e.altKey && e.key === 'l') {
                toggleAutoTapTap();
                e.preventDefault();
            }
        });
        
        // Mensajes del popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggle') {
                toggleAutoTapTap();
            } else if (request.action === 'getStatus') {
                sendResponse({ 
                    activo: state.activo, 
                    contador: state.contador 
                });
            } else if (request.action === 'updateReactivationTime') {
                state.tiempoReactivacion = request.tiempo;
            }
        });
        
        // Limpiar al salir
        window.addEventListener('beforeunload', () => {
            if (state.intervalo) clearInterval(state.intervalo);
        });
    }
    
    // Cargar configuración guardada
    function cargarConfiguracion() {
        chrome.storage.local.get(['position', 'intervalo'], result => {
            if (result.position) {
                state.xOffset = result.position.x;
                state.yOffset = result.position.y;
                elementos.contenedor.style.transform = `translate3d(${state.xOffset}px, ${state.yOffset}px, 0)`;
            }
            
            elementos.selector.value = result.intervalo || config.defaultInterval;
        });
    }
    
    // Cargar configuración guardada
    function cargarConfiguracion() {
        chrome.storage.local.get(['position', 'intervalo', 'tiempoReactivacion'], result => {
            if (result.position) {
                state.xOffset = result.position.x;
                state.yOffset = result.position.y;
                elementos.contenedor.style.transform = `translate3d(${state.xOffset}px, ${state.yOffset}px, 0)`;
            }
            
            elementos.selector.value = result.intervalo || config.defaultInterval;
            state.tiempoReactivacion = result.tiempoReactivacion || 5;
        });
    }

    // Inicializar
    crearInterfaz();
    configurarEventos();
    cargarConfiguracion();
    manejarInteraccionChat();
})();
(function() {
    'use strict';
    
    // Evitar múltiples inyecciones
    if (document.getElementById('tiktok-auto-taptap')) return;
    
    // Estado de la aplicación
    const state = {
        intervalo: null, // Intervalo para los tap-taps
        activo: false,  // Estado actual del auto tap-tap
        contador: 0,    // Contador de tap-taps en la sesión actual
        isDragging: false,         // Estado de arrastre de la ventana
        currentX: 0,             // Posición X actual
        currentY: 0,             // Posición Y actual
        initialX: 0,             // Posición X inicial del arrastre
        initialY: 0,             // Posición Y inicial del arrastre
        xOffset: 0,              // Desplazamiento X guardado
        yOffset: 0,              // Desplazamiento Y guardado
        chatTimeout: null,       // Temporizador para reactivación del chat
        tiempoReactivacion: 10,  // Tiempo en segundos para reactivar después del chat
        pausadoPorChat: false,   // Indica si está pausado por uso del chat
        apagadoManualmente: false // Indica si fue apagado manualmente por el usuario
    };
    
    // Configuración de intervalos
    const config = {
        intervalos: [
            { valor: 200, texto: '200 milisegundos | [Muy rápido]' },
            { valor: 250, texto: '250 milisegundos | [Rápido]' },
            { valor: 500, texto: '500 milisegundos | [Normal]' },
            { valor: 1000, texto: '1  segundo      | [Lento]' }
        ],
        defaultInterval: 200 // Intervalo predeterminado en milisegundos
    };
    
    // Elementos DOM
    const elementos = {};
    
    // Funciones principales para el manejo de almacenamiento y extensión
    function safeStorageOperation(operation) {
        try {
            return operation();
        } catch (error) {
            console.warn('Error en operación de almacenamiento:', error);
            if (error.message.includes('Extension context invalidated')) {
                reloadExtension();
            }
            return Promise.reject(error);
        }
    }

    function reloadExtension() {
        console.log('🔄 Reconectando extensión...');
        // Limpiar timers y estado anterior
        if (state.intervalo) clearInterval(state.intervalo);
        if (state.chatTimeout) clearTimeout(state.chatTimeout);
        
        // Intentar reconectar sin recargar la página
        try {
            // Restaurar el estado anterior si estaba activo
            if (state.activo) {
                const intervalo = parseInt(elementos.selector.value);
                state.intervalo = setInterval(presionarL, intervalo);
            }
            
            // Reconfigurar los listeners
            setupMessageListener();
        } catch (error) {
            console.warn('❌ Error al reconectar:', error);
        }
    }

    function safeRuntimeMessage(message) {
        try {
            chrome.runtime.sendMessage(message, response => {
                if (chrome.runtime.lastError) {
                    console.warn('Error de comunicación:', chrome.runtime.lastError.message);
                    if (chrome.runtime.lastError.message.includes('Extension context invalidated') ||
                        chrome.runtime.lastError.message.includes('message port closed')) {
                        reloadExtension();
                    }
                }
            });
        } catch (error) {
            console.warn('Error al enviar mensaje:', error);
            if (error.message.includes('Extension context invalidated')) {
                reloadExtension();
            }
        }
    }

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
        
        // Actualizar badge usando la función segura
        safeRuntimeMessage({ 
            action: 'updateTapTaps', 
            count: state.contador 
        });
    }
    
    function actualizarContador() {
        if (elementos.contador) {
            elementos.contador.textContent = state.contador;
        }
    }
    
    function guardarEstadisticas() {
        safeStorageOperation(() => {
            chrome.storage.local.get(['totalTapTaps'], result => {
                chrome.storage.local.set({ 
                    totalTapTaps: (result.totalTapTaps || 0) + 1 
                });
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
            safeRuntimeMessage({ action: 'started' });
        } else {
            elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
            elementos.boton.style.background = '#ff0050';
            elementos.selector.disabled = false;
            elementos.selector.style.opacity = '1';
            
            clearInterval(state.intervalo);
            safeRuntimeMessage({ action: 'stopped' });
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
        
        safeStorageOperation(() => {
            chrome.storage.local.set({ 
                position: { x: state.xOffset, y: state.yOffset } 
            });
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
            width: 350px;
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
            font-size: 14px;
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
        // Función auxiliar para encontrar la caja de chat
        const buscarChatInput = () => {
            // Primero intentar encontrar el div editable del chat
            const chatInput = document.querySelector([
                // Buscar el div editable específico de TikTok Live
                'div[contenteditable="plaintext-only"][placeholder="Di algo bonito"]',
                'div[contenteditable="plaintext-only"][maxlength="150"]',
                'div[contenteditable][placeholder="Di algo bonito"]',
                // Buscar cualquier div editable que tenga el límite de caracteres
                'div[contenteditable][maxlength="150"]',
                'div[contenteditable][role="textbox"]',
                // Selectores alternativos por si fallan los anteriores
                'div[role="textbox"]',
                'input[placeholder="Di algo bonito"]'
            ].join(','));

            return chatInput;
        };

        // Observador para detectar cuando el chat se añade al DOM
        const observer = new MutationObserver((mutations) => {
            const chatInput = buscarChatInput();
            if (chatInput) {
                observer.disconnect();
                configurarEventosChat(chatInput);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Intentar encontrar el chat inmediatamente
        const chatInput = buscarChatInput();
        if (chatInput) {
            configurarEventosChat(chatInput);
        }
    }

    function configurarEventosChat(chatInput) {
        // Buscar el contenedor del chat de forma más robusta
        const chatContainer = chatInput.closest([
            'div[contenteditable="plaintext-only"]',
            'div[contenteditable][maxlength="150"]',
            'div[contenteditable][role="textbox"]',
            chatInput.parentElement
        ].find(selector => chatInput.closest(selector))) || chatInput.parentElement;

        if (!chatContainer) return;

        let typingTimer;
        let countdownInterval;

        // Función para reactivar el Auto Tap-Tap después de usar el chat
        const reactivarAutoTapTap = () => {
            if (!state.apagadoManualmente) {
                state.pausadoPorChat = false;
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
                // Para divs editables de TikTok Live, quitar el foco
                if (chatInput.getAttribute('contenteditable')) {
                    chatInput.blur();
                    chatInput.setAttribute('focused', 'false');
                } else {
                    chatInput.blur();
                }
                toggleAutoTapTap(true);
                mostrarNotificacionChat('¡Auto Tap-Tap reactivado! 🎉', 'success');
            }
        };

        // Función para crear o actualizar el div de cuenta regresiva
        const crearContadorRegresivo = () => {
            if (!elementos.contadorRegresivo) {
                elementos.contadorRegresivo = document.createElement('div');
                elementos.contadorRegresivo.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(5px);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: bold;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.3s ease, transform 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                `;
                elementos.contenedor.appendChild(elementos.contadorRegresivo);
            }
            return elementos.contadorRegresivo;
        };

        // Función para iniciar la cuenta regresiva
        const iniciarContadorRegresivo = (segundos) => {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }

            const contadorRegresivo = crearContadorRegresivo();
            let tiempoRestante = segundos;

            contadorRegresivo.style.opacity = '1';
            contadorRegresivo.style.transform = 'scale(1)';

            const actualizarContador = () => {
                if (tiempoRestante >= 0) {
                    contadorRegresivo.textContent = tiempoRestante;
                    contadorRegresivo.style.transform = 'scale(1.2)';
                    // Animar de grande a pequeño
                    setTimeout(() => {
                        contadorRegresivo.style.transform = 'scale(1)';
                    }, 100);
                    tiempoRestante--;
                } else {
                    clearInterval(countdownInterval);
                    contadorRegresivo.style.opacity = '0';
                    setTimeout(() => {
                        contadorRegresivo.style.display = 'none';
                    }, 300);
                }
            };

            actualizarContador();
            countdownInterval = setInterval(actualizarContador, 1000);
        };

        // Cuando el usuario interactúa con el chat
        const onFocus = () => {
            if (state.activo && !state.apagadoManualmente) {
                state.pausadoPorChat = true;
                toggleAutoTapTap(true);
                mostrarNotificacionChat('✍️ Auto Tap-Tap pausado mientras escribes...', 'warning');
            }
        };

        // Eventos para detectar cuando el usuario quiere escribir en el chat
        chatInput.addEventListener('focus', onFocus);
        chatInput.addEventListener('click', onFocus);

        // Eventos adicionales para divs editables de TikTok Live
        if (chatInput.getAttribute('contenteditable')) {
            chatInput.addEventListener('keydown', () => {
                if (!state.pausadoPorChat) {
                    onFocus();
                }
            });
        }

        // Cuando el usuario escribe en el chat
        const handleInput = () => {
            if (state.chatTimeout) {
                clearTimeout(state.chatTimeout);
            }
            if (typingTimer) {
                clearTimeout(typingTimer);
            }
            if (countdownInterval) {
                clearInterval(countdownInterval);
                if (elementos.contadorRegresivo) {
                    elementos.contadorRegresivo.style.opacity = '0';
                }
            }
            
            if (state.pausadoPorChat) {
                // Reiniciar el temporizador cada vez que el usuario escribe
                typingTimer = setTimeout(() => {
                    if (!state.apagadoManualmente && state.pausadoPorChat) {
                        state.chatTimeout = setTimeout(reactivarAutoTapTap, state.tiempoReactivacion * 1000);
                        iniciarContadorRegresivo(state.tiempoReactivacion);
                        mostrarNotificacionChat(`Reactivando en ${state.tiempoReactivacion} segundos...`, 'info');
                    }
                }, 1000);
            }
        };

        chatInput.addEventListener('input', handleInput);
        // Para divs editables
        if (chatInput.getAttribute('contenteditable')) {
            chatInput.addEventListener('keyup', handleInput);
            chatInput.addEventListener('paste', handleInput);
        }

        // Cuando el usuario hace click fuera del chat
        document.addEventListener('click', (e) => {
            if (!chatContainer.contains(e.target) && state.pausadoPorChat && !state.apagadoManualmente) {
                if (state.chatTimeout) {
                    clearTimeout(state.chatTimeout);
                }
                if (typingTimer) {
                    clearTimeout(typingTimer);
                }
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }
                
                state.chatTimeout = setTimeout(reactivarAutoTapTap, state.tiempoReactivacion * 1000);
                iniciarContadorRegresivo(state.tiempoReactivacion);
                mostrarNotificacionChat(`⏳ Reactivando en ${state.tiempoReactivacion} segundos...`, 'info');
            }
        });
    }

    // Función para mostrar notificaciones del chat
    function mostrarNotificacionChat(mensaje, tipo = 'info') {
        // Solo crear el contenedor si no existe
        if (!elementos.notificacionChat) {
            elementos.notificacionChat = document.createElement('div');
            elementos.notificacionChat.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 999999;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(elementos.notificacionChat);
        }

        // Establecer estilos según el tipo de notificación
        const estilos = {
            success: {
                background: 'rgba(25, 148, 3, 0.95)',
                color: '#fff',
                border: '1px solid #42e004',
                boxShadow: '0 2px 8px rgba(66, 224, 4, 0.2)'
            },
            warning: {
                background: 'rgba(255, 0, 80, 0.95)',
                color: '#fff',
                border: '1px solid #ff0050',
                boxShadow: '0 2px 8px rgba(255, 0, 80, 0.2)'
            },
            info: {
                background: 'rgba(0, 0, 0, 0.95)',
                color: '#fff',
                border: '1px solid #666',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }
        };

        // Aplicar estilos
        Object.assign(elementos.notificacionChat.style, estilos[tipo]);
        elementos.notificacionChat.textContent = mensaje;
        elementos.notificacionChat.style.opacity = '1';

        // Ocultar después de 3 segundos
        setTimeout(() => {
            elementos.notificacionChat.style.opacity = '0';
        }, 3000);
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
            safeStorageOperation(() => {
                chrome.storage.local.set({ intervalo: elementos.selector.value });
            });
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
            safeStorageOperation(() => {
                chrome.storage.local.set({ tiempoReactivacion: tiempo }, () => {
                    // Notificar al popup usando la función segura
                    safeRuntimeMessage({ 
                        action: 'tiempoReactivacionChanged', 
                        tiempo: tiempo 
                    });
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
        
        // Register message listener on initial setup
        setupMessageListener();
    }

    // Configuración global del receptor de mensajes
    let messageListener = null;
    function setupMessageListener() {
        try {
            // Eliminar el receptor anterior si existe
            if (messageListener) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }

            messageListener = (request, sender, sendResponse) => {
                try {
                    if (request.action === 'toggle') {
                        toggleAutoTapTap();
                    } else if (request.action === 'updateInterval') {
                        const nuevoIntervalo = request.intervalo;
                        if (state.activo && nuevoIntervalo !== parseInt(elementos.selector.value)) {
                            clearInterval(state.intervalo);
                            state.intervalo = setInterval(presionarL, nuevoIntervalo);
                        }
                    } else if (request.action === 'resetCounter') {
                        state.contador = 0;
                        actualizarContador();
                    } else if (request.action === 'setPosition') {
                        const { x, y } = request.position;
                        state.xOffset = x;
                        state.yOffset = y;
                        elementos.contenedor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                    } else if (request.action === 'updateTapTaps') {
                        state.contador = request.count;
                        actualizarContador();
                    } else if (request.action === 'started') {
                        state.activo = true;
                        elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
                        elementos.boton.style.background = '#00ff88';
                    } else if (request.action === 'stopped') {
                        state.activo = false;
                        elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
                        elementos.boton.style.background = '#ff0050';
                    } else if (request.action === 'tiempoReactivacionChanged') {
                        state.tiempoReactivacion = request.tiempo;
                        elementos.reactivacionInput.value = request.tiempo;
                    }
                } catch (error) {
                    console.error('Error en listener de mensaje:', error);
                }
            };

            chrome.runtime.onMessage.addListener(messageListener);
        } catch (error) {
            console.error('Error al configurar listener de mensajes:', error);
        }
    }

    // Inicializar
    function init() {
        // Crear interfaz
        crearInterfaz();
        
        // Cargar estado desde storage
        safeStorageOperation(() => {
            chrome.storage.local.get([
                'intervalo', 
                'totalTapTaps', 
                'position',
                'tiempoReactivacion'
            ], result => {
                if (result.intervalo) {
                    elementos.selector.value = result.intervalo;
                    const intervalo = parseInt(result.intervalo);
                    state.intervalo = setInterval(presionarL, intervalo);
                }
                
                if (result.totalTapTaps) {
                    state.contador = result.totalTapTaps;
                    actualizarContador();
                }
                
                if (result.position) {
                    const { x, y } = result.position;
                    state.xOffset = x;
                    state.yOffset = y;
                    elementos.contenedor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                }
                
                if (result.tiempoReactivacion) {
                    state.tiempoReactivacion = result.tiempoReactivacion;
                    elementos.reactivacionInput.value = result.tiempoReactivacion;
                }
            });
        });
        
        // Configurar eventos
        configurarEventos();
        
        // Manejar interacciones de chat
        manejarInteraccionChat();
    }

    // Iniciar aplicación
    init();
})();

(function() {
    'use strict';
    
    // Evitar múltiples inyecciones
    if (document.getElementById('tiktok-auto-taptap')) return;
    
    // Validar que estamos en un Live de TikTok
    if (!window.location.pathname.includes('/live')) {
        console.log('❌ No estamos en un Live de TikTok. La extensión solo funciona en Lives.');
        return;
    }

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
        
        let intentosReconexion = 0;
        const maxIntentos = 3;
        
        const intentarReconexion = () => {
            if (intentosReconexion >= maxIntentos) {
                console.warn('❌ Máximo de intentos de reconexión alcanzado, recargando página...');
                window.location.reload();
                return;
            }
            
            intentosReconexion++;
            console.log(`🔄 Intento de reconexión ${intentosReconexion}/${maxIntentos}...`);
            
            try {
                // Verificar si el contexto de la extensión está válido
                chrome.runtime.getURL('');
                
                // Restaurar el estado anterior si estaba activo
                if (state.activo) {
                    const intervalo = parseInt(elementos.selector.value);
                    state.intervalo = setInterval(presionarL, intervalo);
                    
                    // Notificar al background sobre el estado actual
                    safeRuntimeMessage({ 
                        action: 'started',
                        contador: state.contador
                    });
                } else {
                    safeRuntimeMessage({ action: 'stopped' });
                }
                
                // Reconfigurar los listeners
                setupMessageListener();
                
                // Sincronizar estado con storage
                chrome.storage.local.get(['tiempoReactivacion'], result => {
                    if (result.tiempoReactivacion) {
                        state.tiempoReactivacion = result.tiempoReactivacion;
                        if (elementos.reactivacionInput) {
                            elementos.reactivacionInput.value = result.tiempoReactivacion;
                        }
                    }
                });
                
                console.log('✅ Reconexión exitosa');
                
            } catch (error) {
                console.warn(`❌ Error en intento ${intentosReconexion}:`, error);
                // Esperar un poco más en cada intento
                setTimeout(intentarReconexion, 1000 * intentosReconexion);
            }
        };
        
        // Iniciar el proceso de reconexión
        intentarReconexion();
    }

    function safeRuntimeMessage(message) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout al enviar mensaje'));
            }, 1000); // 1 segundo de timeout

            try {
                // Envolver en un try-catch específico para manejar errores CORS
                const sendMessage = () => {
                    try {
                        chrome.runtime.sendMessage(message, response => {
                            clearTimeout(timeout);

                            if (chrome.runtime.lastError) {
                                const error = chrome.runtime.lastError;
                                // Ignorar errores específicos de CORS
                                if (error.message.includes('Extension context invalidated') ||
                                    error.message.includes('message channel closed')) {
                                    reloadExtension();
                                }
                                // Para otros errores, solo rechazar si no son relacionados con CORS
                                if (!error.message.includes('CORS')) {
                                    reject(error);
                                } else {
                                    // Para errores CORS, resolver con un objeto vacío
                                    resolve({});
                                }
                                return;
                            }

                            if (!response) {
                                resolve({}); // Resolver con objeto vacío si no hay respuesta
                                return;
                            }

                            if (response.error) {
                                reject(new Error(response.error));
                                return;
                            }

                            resolve(response);
                        });
                    } catch (error) {
                        // Ignorar errores específicos de CORS
                        if (!error.message.includes('CORS')) {
                            throw error;
                        }
                        resolve({}); // Resolver con objeto vacío para errores CORS
                    }
                };

                // Intentar enviar el mensaje
                sendMessage();
            } catch (error) {
                clearTimeout(timeout);
                console.warn('Error al enviar mensaje:', error);
                if (error.message.includes('Extension context invalidated')) {
                    reloadExtension();
                }
                // Solo rechazar si no es un error CORS
                if (!error.message.includes('CORS')) {
                    reject(error);
                } else {
                    resolve({}); // Resolver con objeto vacío para errores CORS
                }
            }
        });
    }

    // Función para manejar intervalos de forma segura
    const safeInterval = {
        intervals: new Map(),
        create(callback, delay) {
            const id = setInterval(callback, delay);
            this.intervals.set(id, { callback, delay });
            return id;
        },
        clear(id) {
            clearInterval(id);
            this.intervals.delete(id);
        },
        clearAll() {
            this.intervals.forEach((_, id) => this.clear(id));
        }
    };

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
        
        // Usar una función separada para actualizar el badge para evitar bloquear la funcionalidad principal
        setTimeout(() => {
            guardarEstadisticas();
            
            // Actualizar badge usando la función segura
            safeRuntimeMessage({ 
                action: 'updateTapTaps', 
                count: state.contador 
            }).catch(error => {
                // Solo registrar errores que no sean de CORS o contexto invalidado
                if (!error.message.includes('Extension context invalidated') && 
                    !error.message.includes('message channel closed') &&
                    !error.message.includes('CORS')) {
                    console.warn('Error al actualizar contador:', error);
                }
            });
        }, 0);
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
        
        const nuevoEstado = !state.activo;
        
        // Limpiar intervalos existentes
        if (state.intervalo) {
            safeInterval.clear(state.intervalo);
            state.intervalo = null;
        }
        
        // Actualizar estado
        state.activo = nuevoEstado;
        
        if (nuevoEstado) {
            const intervalo = parseInt(elementos.selector.value);
            elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
            elementos.boton.style.background = '#00ff88';
            elementos.selector.disabled = true;
            elementos.selector.style.opacity = '0.5';
            
            // Solo iniciar el intervalo si está activo manualmente
            if (!fromChat && !state.pausadoPorChat) {
                presionarL(); // Ejecutar inmediatamente
                state.intervalo = safeInterval.create(presionarL, intervalo);
                
                // Notificar al background
                safeRuntimeMessage({ action: 'started' })
                    .catch(error => console.warn('Error al notificar estado:', error));
            }
        } else {
            elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
            elementos.boton.style.background = '#ff0050';
            elementos.selector.disabled = false;
            elementos.selector.style.opacity = '1';
            
            // Notificar al background
            safeRuntimeMessage({ action: 'stopped' })
                .catch(error => console.warn('Error al notificar estado:', error));
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
        
        // Solo llamar preventDefault para eventos touch cuando sea necesario
        if (e.type === 'touchmove') {
            // Prevenir el scroll solo si estamos arrastrando
            e.preventDefault();
        }
        
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
        elementos.selector.id = 'selector-intervalo';
        elementos.selector.name = 'selector-intervalo';
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
        elementos.reactivacionInput.id = 'tiempo-reactivacion';
        elementos.reactivacionInput.name = 'tiempo-reactivacion';
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
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        `;

        const copyrightText = document.createElement('p');
        copyrightText.textContent = '© 2025 ';
        
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

        const devInfo = document.createElement('p');
        devInfo.textContent = 'Desarrollado por ';
        devInfo.style.cssText = `
            margin-top: 4px;
            color: rgba(255, 255, 255, 0.6);
        `;

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

        copyrightText.appendChild(orgLink);
        devInfo.appendChild(devLink);
        elementos.copyrightDiv.appendChild(copyrightText);
        elementos.copyrightDiv.appendChild(devInfo);

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
        console.log('🔍 Iniciando búsqueda del chat...');
        
        let chatInput = null;
        const chatObserver = {
            observer: null,
            active: false,
            cleanup() {
                if (this.observer) {
                    this.observer.disconnect();
                    this.active = false;
                }
            }
        };

        // Función auxiliar para encontrar la caja de chat
        const buscarChatInput = () => {
            // Lista priorizada de selectores
            const selectores = [
                'div[contenteditable="plaintext-only"][maxlength="150"]',
                'div[contenteditable="plaintext-only"][placeholder="Di algo bonito"]',
                'div[contenteditable="plaintext-only"]',
                'input[placeholder="Di algo bonito"]'
            ];

            for (const selector of selectores) {
                const elemento = document.querySelector(selector);
                if (elemento) {
                    console.log('✅ Chat encontrado con selector:', selector);
                    return elemento;
                }
            }

            // Búsqueda alternativa
            const posiblesChatInputs = Array.from(document.querySelectorAll('div[contenteditable]'));
            return posiblesChatInputs.find(el => el.getAttribute('contenteditable') === 'plaintext-only');
        };

        // Inicializar observer
        const iniciarObservador = () => {
            if (chatObserver.active) return;

            chatObserver.cleanup();
            chatObserver.observer = new MutationObserver((mutations) => {
                if (chatInput) return; // Ya encontramos el chat

                chatInput = buscarChatInput();
                if (chatInput) {
                    console.log('🎉 Chat encontrado por el observador!');
                    chatObserver.cleanup();
                    configurarEventosChat(chatInput);
                }
            });

            chatObserver.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            chatObserver.active = true;
        };

        // Primera búsqueda
        chatInput = buscarChatInput();
        if (chatInput) {
            console.log('✨ Chat encontrado inmediatamente!');
            configurarEventosChat(chatInput);
        } else {
            console.log('⏳ Chat no encontrado inicialmente, iniciando observador...');
            iniciarObservador();
        }
        
        // Guardar la referencia del observador para limpieza posterior
        state.chatObserver = chatObserver;
        
        return chatObserver;
    }

    function configurarEventosChat(chatInput) {
        const timers = {
            typing: null,
            chat: null,
            countdown: null,
            cleanupAll() {
                Object.entries(this).forEach(([key, timer]) => {
                    if (typeof timer === 'number') {
                        clearTimeout(timer);
                        this[key] = null;
                    }
                });
            }
        };

        // Reactivar el Auto Tap-Tap
        const reactivarAutoTapTap = () => {
            if (!state.apagadoManualmente) {
                state.pausadoPorChat = false;
                timers.cleanupAll();

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

        // Manejador para cuando el usuario está escribiendo
        const handleInput = () => {
            timers.cleanupAll();
            
            if (state.pausadoPorChat) {
                timers.typing = setTimeout(() => {
                    if (!state.apagadoManualmente && state.pausadoPorChat) {
                        timers.chat = setTimeout(reactivarAutoTapTap, state.tiempoReactivacion * 1000);
                        iniciarContadorRegresivo(state.tiempoReactivacion);
                        mostrarNotificacionChat(`Reactivando en ${state.tiempoReactivacion} segundos...`, 'info');
                    }
                }, 1000);
            }
        };

        // Pausar cuando el usuario interactúa con el chat
        const onFocus = () => {
            if (state.activo && !state.apagadoManualmente) {
                state.pausadoPorChat = true;
                toggleAutoTapTap(true);
                mostrarNotificacionChat('✍️ Auto Tap-Tap pausado mientras escribes...', 'warning');
            }
        };

        // Configurar eventos del chat
        chatInput.addEventListener('focus', onFocus);
        chatInput.addEventListener('click', onFocus);
        chatInput.addEventListener('input', handleInput);

        if (chatInput.getAttribute('contenteditable')) {
            chatInput.addEventListener('keydown', () => {
                if (!state.pausadoPorChat) onFocus();
            });
            chatInput.addEventListener('keyup', handleInput);
            chatInput.addEventListener('paste', handleInput);
        }

        // Click fuera del chat
        const handleClickOutside = (e) => {
            const chatContainer = chatInput.closest([
                'div[contenteditable="plaintext-only"]',
                'div[contenteditable][maxlength="150"]',
                'div[contenteditable][role="textbox"]',
                chatInput.parentElement
            ].find(selector => chatInput.closest(selector))) || chatInput.parentElement;

            if (!chatContainer.contains(e.target) && state.pausadoPorChat && !state.apagadoManualmente) {
                timers.cleanupAll();
                timers.chat = setTimeout(reactivarAutoTapTap, state.tiempoReactivacion * 1000);
                iniciarContadorRegresivo(state.tiempoReactivacion);
                mostrarNotificacionChat(`⏳ Reactivando en ${state.tiempoReactivacion} segundos...`, 'info');
            }
        };

        document.addEventListener('click', handleClickOutside);

        // Función de limpieza
        const cleanup = () => {
            timers.cleanupAll();
            document.removeEventListener('click', handleClickOutside);
        };
        
        // Guardar la función de limpieza
        state.chatCleanup = cleanup;
        
        return cleanup;
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
                background: 'rgba(14, 79, 2, 0.95)',
                color: '#fff',
                border: '1px solidrgb(24, 80, 2)',
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
        const events = [];
        
        // Helper para agregar eventos y facilitar limpieza
        const addEvent = (element, type, handler, options = false) => {
            element.addEventListener(type, handler, options);
            events.push({ element, type, handler, options });
        };

        // Toggle principal
        addEvent(elementos.boton, 'click', () => {
            state.apagadoManualmente = !state.activo;
            toggleAutoTapTap(false);
        });

        // Reset contador
        addEvent(elementos.botonReset, 'click', () => {
            state.contador = 0;
            actualizarContador();
        });

        // Efectos hover
        addEvent(elementos.boton, 'mouseenter', () => 
            elementos.boton.style.background = state.activo ? '#00ffaa' : '#ff3366');
        
        addEvent(elementos.boton, 'mouseleave', () => 
            elementos.boton.style.background = state.activo ? '#00ff88' : '#ff0050');

        // Minimizar/Maximizar
        let minimizado = false;
        const elementosOcultables = [
            elementos.selector, 
            elementos.contadorDiv, 
            elementos.botonReset, 
            elementos.configDiv, 
            elementos.copyrightDiv
        ];

        addEvent(elementos.botonMinimizar, 'click', () => {
            minimizado = !minimizado;
            elementos.botonMinimizar.textContent = minimizado ? '+' : '−';
            elementosOcultables.forEach(el => el.style.display = minimizado ? 'none' : 'block');
            elementos.contenedor.style.height = minimizado ? 'auto' : 'auto';
            elementos.barraArrastre.style.margin = '-15px -15px 10px -15px';
        });

        // Guardar configuraciones
        addEvent(elementos.selector, 'change', () => {
            safeStorageOperation(() => {
                chrome.storage.local.set({ intervalo: elementos.selector.value });
            });
        });

        addEvent(elementos.reactivacionInput, 'input', () => {
            let tiempo = parseInt(elementos.reactivacionInput.value);
            tiempo = Math.max(10, Math.min(60, tiempo || 10));
            elementos.reactivacionInput.value = tiempo;
            state.tiempoReactivacion = tiempo;
            
            safeStorageOperation(() => {
                chrome.storage.local.set({ tiempoReactivacion: tiempo });
            });
        });

        // Eventos de arrastre
        const dragEvents = [
            { el: elementos.contenedor, type: 'mousedown', fn: dragStart },
            { el: document, type: 'mouseup', fn: dragEnd },
            { el: document, type: 'mousemove', fn: drag },
            { el: elementos.contenedor, type: 'touchstart', fn: dragStart, opt: { passive: true } },
            { el: elementos.contenedor, type: 'touchend', fn: dragEnd, opt: { passive: true } },
            { el: elementos.contenedor, type: 'touchmove', fn: drag, opt: { passive: false } }
        ];

        dragEvents.forEach(({ el, type, fn, opt = false }) => addEvent(el, type, fn, opt));

        // Prevenir drag en elementos interactivos
        [elementos.boton, elementos.selector, elementos.botonReset, elementos.botonMinimizar]
            .forEach(el => addEvent(el, 'mousedown', e => e.stopPropagation()));

        // Atajo de teclado
        addEvent(document, 'keydown', e => {
            if (e.altKey && e.key === 'l') {
                toggleAutoTapTap();
                e.preventDefault();
            }
        });

        // Configurar receptor de mensajes
        setupMessageListener();

        // Verificación periódica del estado
        let checkInterval = setInterval(checkExtensionStatus, 5000);

        // Función de limpieza
        const cleanup = () => {
            // Limpiar todos los eventos registrados
            events.forEach(({ element, type, handler, options }) => {
                element.removeEventListener(type, handler, options);
            });

            // Limpiar intervalos
            if (checkInterval) clearInterval(checkInterval);
            if (state.intervalo) {
                safeInterval.clear(state.intervalo);
                state.intervalo = null;
            }

            // Limpiar timers del chat
            if (state.chatTimeout) {
                clearTimeout(state.chatTimeout);
                state.chatTimeout = null;
            }
        };
        
        // Almacenar la función de limpieza en el estado global
        state.cleanup = cleanup;
        
        return cleanup;
    }

    // Función para verificar el estado de la extensión
    function checkExtensionStatus() {
        try {
            // Verificar si el contexto de la extensión está válido
            chrome.runtime.getURL('');
        } catch (error) {
            if (error.message.includes('Extension context invalidated')) {
                console.log('🔄 Reconectando extensión debido a contexto invalidado...');
                reloadExtension();
            }
            return false;
        }
        return true;
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
                // Usamos una promesa para manejar respuestas asíncronas
                const handleRequest = async () => {
                    try {
                        if (request.action === 'getStatus') {
                            return {
                                activo: state.activo,
                                contador: state.contador,
                                tiempoReactivacion: state.tiempoReactivacion,
                                pausadoPorChat: state.pausadoPorChat
                            };
                        }

                        if (request.action === 'toggle') {
                            toggleAutoTapTap();
                            return { success: true };
                        } 
                        
                        if (request.action === 'updateInterval') {
                            const nuevoIntervalo = request.intervalo;
                            if (state.activo && nuevoIntervalo !== parseInt(elementos.selector.value)) {
                                clearInterval(state.intervalo);
                                state.intervalo = setInterval(presionarL, nuevoIntervalo);
                            }
                            elementos.selector.value = nuevoIntervalo;
                            return { success: true };
                        } 
                        
                        if (request.action === 'updateTapTaps') {
                            state.contador = request.count;
                            actualizarContador();
                            return { success: true };
                        } 
                        
                        if (request.action === 'updateReactivationTime') {
                            state.tiempoReactivacion = request.tiempo;
                            if (elementos.reactivacionInput) {
                                elementos.reactivacionInput.value = request.tiempo;
                            }
                            return { success: true };
                        }

                        return { error: 'Acción no reconocida' };
                    } catch (error) {
                        console.error('Error en listener de mensaje:', error);
                        return { error: error.message };
                    }
                };

                // Ejecutar el manejador y enviar la respuesta
                handleRequest().then(response => {
                    try {
                        sendResponse(response);
                    } catch (error) {
                        console.warn('Error al enviar respuesta:', error);
                    }
                });

                // Indicar que la respuesta será asíncrona
                return true;
            };

            chrome.runtime.onMessage.addListener(messageListener);
            
            // Verificar conexión periódicamente con manejo mejorado de errores
            const pingInterval = setInterval(() => {
                chrome.runtime.sendMessage({ action: 'ping' }, response => {
                    if (chrome.runtime.lastError) {
                        console.warn('Error en ping:', chrome.runtime.lastError);
                        reloadExtension();
                        clearInterval(pingInterval);
                    }
                });
            }, 5000);
            
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

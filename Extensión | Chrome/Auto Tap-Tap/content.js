/**
 * =============================================================================
 * AUTO TAP-TAP TIKTOK - CONTENT SCRIPT PRINCIPAL
 * =============================================================================
 * 
 * Este script de contenido se inyecta en las páginas de TikTok Live para 
 * automatizar los tap-taps (corazones) durante las transmisiones en vivo.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Automatización de tap-taps con intervalos configurables
 * - Interfaz de usuario flotante y arrastrable
 * - Sistema de pausa automática cuando se usa el chat
 * - Reactivación automática después de inactividad en el chat
 * - Notificaciones en tiempo real del estado
 * - Contador de tap-taps realizados
 * - Configuración persistente de ajustes
 * 
 * COMPONENTES ARQUITECTÓNICOS:
 * - Gestión de estado centralizada
 * - Sistema de almacenamiento seguro con Chrome API
 * - Detección automática de interacción con chat
 * - Interfaz de usuario dinámica con CSS inyectado
 * - Comunicación bidireccional con background script
 * 
 * @author Emerick Echeverría Vargas
 * @version 1.0
 * @description Content script para automatización de tap-taps en TikTok Live
 * =============================================================================
 */

// filepath: /Users/emerickvar/Documents/GitHub/Auto_Tap-Tap_TikTok/Extensión | Chrome/Auto Tap-Tap/content.js

/**
 * FUNCIÓN PRINCIPAL AUTO-EJECUTABLE (IIFE - Immediately Invoked Function Expression)
 * 
 * Encapsula todo el código de la extensión para evitar contaminación del scope global
 * y conflictos con otros scripts que puedan estar ejecutándose en la página.
 */
(function() {
    'use strict'; // Habilita el modo estricto para mejor detección de errores
    
    /**
     * PROTECCIÓN CONTRA MÚLTIPLES INYECCIONES
     * 
     * Verifica si la extensión ya ha sido inyectada anteriormente en esta página.
     * Esto previene la creación de múltiples instancias que podrían causar conflictos.
     */
    if (document.getElementById('tiktok-auto-taptap')) return;
    
    /**
     * VALIDACIÓN DE CONTEXTO - VERIFICAR QUE ESTEMOS EN UN LIVE DE TIKTOK
     * 
     * La extensión solo debe funcionar en páginas de transmisiones en vivo de TikTok.
     * Si no estamos en una URL que contenga '/live', terminamos la ejecución.
     */
    if (!window.location.pathname.includes('/live')) {
        console.log('❌ No estamos en un Live de TikTok. La extensión solo funciona en Lives.');
        return;
    }

    /**
     * =============================================================================
     * ESTADO CENTRAL DE LA APLICACIÓN
     * =============================================================================
     * 
     * Objeto principal que mantiene todo el estado de la extensión.
     * Centralizar el estado facilita el debugging y el mantenimiento del código.
     */
    const state = {
        // CONTROL DE AUTOMATIZACIÓN
        intervalo: null,        // Referencia al setInterval que ejecuta los tap-taps automáticos
        activo: false,          // Bandera que indica si el auto tap-tap está actualmente funcionando
        contador: 0,            // Número total de tap-taps enviados en la sesión actual
        
        // CONTROL DE INTERFAZ ARRASTRABLE
        isDragging: false,      // Bandera que indica si el usuario está arrastrando la ventana flotante
        currentX: 0,           // Posición X actual del mouse durante el arrastre
        currentY: 0,           // Posición Y actual del mouse durante el arrastre  
        initialX: 0,           // Posición X inicial cuando comenzó el arrastre
        initialY: 0,           // Posición Y inicial cuando comenzó el arrastre
        xOffset: 0,            // Desplazamiento X acumulado de la ventana flotante
        yOffset: 0,            // Desplazamiento Y acumulado de la ventana flotante
        
        // SISTEMA DE REACTIVACIÓN AUTOMÁTICA POR CHAT
        chatTimeout: null,      // Referencia al setTimeout para reactivar después de usar el chat
        tiempoReactivacion: 10, // Tiempo en segundos que espera antes de reactivar automáticamente
        pausadoPorChat: false,  // Indica si el sistema se pausó automáticamente por detectar uso del chat
        apagadoManualmente: false // Indica si el usuario apagó manualmente (no reactivar automáticamente)
    };
    
    /**
     * =============================================================================
     * CONFIGURACIÓN DE INTERVALOS Y VELOCIDADES
     * =============================================================================
     * 
     * Define las opciones de velocidad disponibles para el usuario.
     * Cada intervalo representa la pausa entre tap-taps consecutivos.
     */
    const config = {
        // Array de opciones de velocidad con sus respectivos valores y descripciones
        intervalos: [
            { valor: 200, texto: '200 milisegundos | [Muy rápido]' },  // 5 tap-taps por segundo
            { valor: 250, texto: '250 milisegundos | [Rápido]' },      // 4 tap-taps por segundo
            { valor: 500, texto: '500 milisegundos | [Normal]' },      // 2 tap-taps por segundo
            { valor: 1000, texto: '1  segundo      | [Lento]' }        // 1 tap-tap por segundo
        ],
        defaultInterval: 200 // Intervalo predeterminado en milisegundos (velocidad más rápida)
    };
    
    /**
     * =============================================================================
     * CONTENEDOR PARA REFERENCIAS A ELEMENTOS DOM
     * =============================================================================
     * 
     * Objeto que almacenará todas las referencias a elementos DOM creados dinámicamente.
     * Esto facilita el acceso y manipulación de la interfaz de usuario.
     */
    const elementos = {};
    
    /**
     * =============================================================================
     * FUNCIONES DE GESTIÓN SEGURA DE ALMACENAMIENTO Y EXTENSIÓN
     * =============================================================================
     */
    
    /**
     * WRAPPER PARA OPERACIONES SEGURAS DE ALMACENAMIENTO
     * 
     * Envuelve operaciones que podrían fallar si el contexto de la extensión
     * se invalida (por ejemplo, cuando la extensión se recarga o actualiza).
     * 
     * @param {Function} operation - Función que realiza la operación de almacenamiento
     * @returns {Promise|any} - Resultado de la operación o error controlado
     */
    function safeStorageOperation(operation) {
        try {
            return operation();
        } catch (error) {
            console.warn('Error en operación de almacenamiento:', error);
            // Si el contexto de la extensión se invalidó, intentar reconectar
            if (error.message.includes('Extension context invalidated')) {
                reloadExtension();
            }
            return Promise.reject(error);
        }
    }

    /**
     * SISTEMA DE RECONEXIÓN AUTOMÁTICA DE LA EXTENSIÓN
     * 
     * Cuando el contexto de la extensión se invalida (por recarga, actualización, etc.),
     * esta función intenta restaurar automáticamente el funcionamiento de la extensión
     * sin que el usuario pierda su sesión o configuración actual.
     * 
     * PROCESO DE RECONEXIÓN:
     * 1. Limpia todos los timers y estados anteriores
     * 2. Realiza múltiples intentos de reconexión con delays progresivos
     * 3. Verifica la validez del contexto de Chrome extension APIs
     * 4. Restaura el estado anterior si estaba activo
     * 5. Reconfigura todos los event listeners
     * 6. Sincroniza la configuración desde el almacenamiento
     * 7. Si todos los intentos fallan, recarga la página como último recurso
     */
    function reloadExtension() {
        console.log('🔄 Reconectando extensión...');
        
        // PASO 1: Limpiar estado anterior para evitar conflictos
        if (state.intervalo) clearInterval(state.intervalo);    // Detener tap-taps automáticos
        if (state.chatTimeout) clearTimeout(state.chatTimeout); // Cancelar reactivación pendiente
        
        // PASO 2: Configurar sistema de reintentos con backoff progresivo
        let intentosReconexion = 0;
        const maxIntentos = 3;
        
        /**
         * FUNCIÓN INTERNA DE REINTENTO
         * 
         * Implementa el algoritmo de reconexión con múltiples intentos
         * y delays progresivos para evitar sobrecargar el sistema.
         */
        const intentarReconexion = () => {
            // Si alcanzamos el máximo de intentos, recargar página como último recurso
            if (intentosReconexion >= maxIntentos) {
                console.warn('❌ Máximo de intentos de reconexión alcanzado, recargando página...');
                window.location.reload();
                return;
            }
            
            intentosReconexion++;
            console.log(`🔄 Intento de reconexión ${intentosReconexion}/${maxIntentos}...`);
            
            try {
                // PASO 3: Verificar que el contexto de la extensión esté válido
                chrome.runtime.getURL(''); // Operación simple para verificar contexto
                
                // PASO 4: Restaurar estado anterior si estaba funcionando
                if (state.activo) {
                    const intervalo = parseInt(elementos.selector.value);
                    state.intervalo = setInterval(presionarL, intervalo);
                    
                    // Notificar al background script sobre el estado actual
                    safeRuntimeMessage({ 
                        action: 'started',
                        contador: state.contador
                    });
                } else {
                    safeRuntimeMessage({ action: 'stopped' });
                }
                
                // PASO 5: Reconfigurar los event listeners
                setupMessageListener();
                
                // PASO 6: Sincronizar configuración desde almacenamiento
                chrome.storage.local.get(['tiempoReactivacion'], result => {
                    if (result.tiempoReactivacion) {
                        state.tiempoReactivacion = result.tiempoReactivacion;
                        // Actualizar la interfaz si existe
                        if (elementos.reactivacionInput) {
                            elementos.reactivacionInput.value = result.tiempoReactivacion;
                        }
                    }
                });
                
                console.log('✅ Reconexión exitosa');
                
            } catch (error) {
                console.warn(`❌ Error en intento ${intentosReconexion}:`, error);
                // PASO 7: Esperar progresivamente más tiempo en cada intento fallido
                // Intento 1: 1 segundo, Intento 2: 2 segundos, Intento 3: 3 segundos
                setTimeout(intentarReconexion, 1000 * intentosReconexion);
            }
        };
        
        // INICIAR EL PROCESO DE RECONEXIÓN
        intentarReconexion();
    }

    /**
     * SISTEMA DE COMUNICACIÓN SEGURA CON BACKGROUND SCRIPT
     * 
     * Envía mensajes al background script de forma segura, manejando todos los posibles
     * errores que pueden ocurrir durante la comunicación entre content script y background.
     * 
     * PROBLEMAS MANEJADOS:
     * - Timeouts de comunicación (máximo 1 segundo de espera)
     * - Contexto de extensión invalidado (por recarga/actualización)
     * - Canales de mensaje cerrados inesperadamente
     * - Errores CORS que pueden ocurrir en ciertos contextos
     * - Respuestas vacías o malformadas
     * 
     * @param {Object} message - Mensaje a enviar al background script
     * @returns {Promise} - Promesa que resuelve con la respuesta o se rechaza con error
     */
    function safeRuntimeMessage(message) {
        return new Promise((resolve, reject) => {
            // TIMEOUT DE SEGURIDAD: Si el mensaje no se envía en 1 segundo, cancelar
            const timeout = setTimeout(() => {
                reject(new Error('Timeout al enviar mensaje'));
            }, 1000);

            try {
                /**
                 * FUNCIÓN INTERNA PARA ENVÍO SEGURO DE MENSAJES
                 * 
                 * Maneja el envío real del mensaje con múltiples capas de protección
                 * contra errores que pueden ocurrir durante la comunicación.
                 */
                const sendMessage = () => {
                    try {
                        chrome.runtime.sendMessage(message, response => {
                            clearTimeout(timeout); // Cancelar timeout si llegó respuesta

                            // MANEJO DE ERRORES DE RUNTIME DE CHROME
                            if (chrome.runtime.lastError) {
                                const error = chrome.runtime.lastError;
                                
                                // Errores críticos que requieren reconexión automática
                                if (error.message.includes('Extension context invalidated') ||
                                    error.message.includes('message channel closed')) {
                                    reloadExtension();
                                }
                                
                                // Para otros errores, solo rechazar si no son errores CORS
                                // Los errores CORS son comunes y no críticos en este contexto
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

    /**
     * =============================================================================
     * GESTIÓN SEGURA DE INTERVALOS
     * =============================================================================
     * 
     * Objeto que proporciona métodos para crear y gestionar intervalos de forma segura,
     * manteniendo un registro de todos los intervalos activos para poder limpiarlos
     * correctamente y evitar memory leaks.
     */
    const safeInterval = {
        // Map que almacena referencias a todos los intervalos activos
        intervals: new Map(),
        
        /**
         * CREAR INTERVALO SEGURO
         * 
         * Crea un nuevo intervalo y lo registra en el Map para seguimiento.
         * 
         * @param {Function} callback - Función a ejecutar en cada intervalo
         * @param {number} delay - Tiempo en milisegundos entre ejecuciones
         * @returns {number} - ID del intervalo creado
         */
        create(callback, delay) {
            const id = setInterval(callback, delay);
            this.intervals.set(id, { callback, delay });
            return id;
        },
        
        /**
         * LIMPIAR INTERVALO ESPECÍFICO
         * 
         * Limpia un intervalo específico y lo elimina del registro.
         * 
         * @param {number} id - ID del intervalo a limpiar
         */
        clear(id) {
            clearInterval(id);
            this.intervals.delete(id);
        },
        
        /**
         * LIMPIAR TODOS LOS INTERVALOS
         * 
         * Función de emergencia para limpiar todos los intervalos registrados.
         * Útil para evitar memory leaks durante reconexiones o errores.
         */
        clearAll() {
            this.intervals.forEach((_, id) => this.clear(id));
        }
    };

    /**
     * =============================================================================
     * FUNCIÓN PRINCIPAL DE AUTOMATIZACIÓN - SIMULACIÓN DE TAP-TAP
     * =============================================================================
     * 
     * Esta es la función core que simula el gesto de tap-tap (presionar la tecla 'L')
     * que TikTok Live usa para mostrar corazones en pantalla durante las transmisiones.
     * 
     * FUNCIONAMIENTO:
     * 1. Crea un evento de teclado sintético que simula presionar la tecla 'L'
     * 2. Incrementa el contador de tap-taps realizados en la sesión
     * 3. Actualiza la interfaz de usuario con el nuevo contador
     * 4. Guarda las estadísticas en el almacenamiento local
     * 5. Notifica al background script para actualizar el badge
     * 
     * NOTA TÉCNICA:
     * TikTok Live está configurado para detectar la tecla 'L' como trigger para
     * mostrar corazones/tap-taps durante las transmisiones en vivo.
     */
    function presionarL() {
        // PASO 1: Crear evento sintético de teclado para simular presión de tecla 'L'
        const evento = new KeyboardEvent('keydown', {
            key: 'l',           // Letra que se está "presionando"
            code: 'KeyL',       // Código físico de la tecla
            keyCode: 76,        // Código numérico legacy (para compatibilidad)
            which: 76,          // Código alternativo legacy (para compatibilidad)
            bubbles: true,      // El evento debe burbujear por el DOM
            cancelable: true    // El evento puede ser cancelado
        });
        
        // PASO 2: Disparar el evento en el documento para que TikTok lo detecte
        document.dispatchEvent(evento);
        
        // PASO 3: Incrementar contador de tap-taps realizados
        state.contador++;
        
        // PASO 4: Actualizar la interfaz de usuario inmediatamente
        actualizarContador();
        
        // PASO 5: Realizar operaciones de persistencia de forma asíncrona 
        // para no bloquear la ejecución del siguiente tap-tap
        setTimeout(() => {
            // Guardar estadísticas en almacenamiento local
            guardarEstadisticas();
            
            // Actualizar badge del icono de extensión usando comunicación segura
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
        }, 0); // setTimeout con 0ms para ejecutar en el siguiente ciclo del event loop
    }
    
    /**
     * ACTUALIZAR CONTADOR EN LA INTERFAZ
     * 
     * Función simple que actualiza el display visual del contador de tap-taps
     * en la interfaz de usuario flotante.
     */
    function actualizarContador() {
        if (elementos.contador) {
            elementos.contador.textContent = state.contador;
        }
    }
    
    /**
     * GUARDAR ESTADÍSTICAS EN ALMACENAMIENTO PERSISTENTE
     * 
     * Función que guarda el progreso del usuario en el almacenamiento local
     * de Chrome para mantener las estadísticas entre sesiones.
     */
    function guardarEstadisticas() {
        safeStorageOperation(() => {
            chrome.storage.local.get(['totalTapTaps'], result => {
                chrome.storage.local.set({ 
                    totalTapTaps: (result.totalTapTaps || 0) + 1 
                });
            });
        });
    }
    
    /**
     * =============================================================================
     * FUNCIÓN PRINCIPAL DE CONTROL - ALTERNAR AUTO TAP-TAP
     * =============================================================================
     * 
     * Esta es la función central que controla el encendido/apagado del sistema
     * de automatización. Maneja tanto interacciones manuales del usuario como
     * activaciones/desactivaciones automáticas del sistema de chat.
     * 
     * PARÁMETROS:
     * @param {boolean} fromChat - Indica si el toggle viene del sistema de chat
     *                            o de una interacción manual del usuario
     * 
     * LÓGICA DE FUNCIONAMIENTO:
     * - Interacciones manuales (fromChat=false): El usuario controla directamente
     * - Interacciones de chat (fromChat=true): Sistema automático por uso del chat
     * - Gestiona el estado de "apagado manual" vs "pausa automática por chat"
     * - Actualiza la interfaz visual y los intervalos de automatización
     */
    function toggleAutoTapTap(fromChat = false) {
        console.log('🔄 Toggle Auto Tap-Tap:', {
            fromChat,
            estadoActual: state.activo,
            pausadoPorChat: state.pausadoPorChat,
            apagadoManualmente: state.apagadoManualmente
        });

        // PASO 1: Gestión del estado "apagado manualmente"
        // Solo actualizar cuando es una interacción directa del usuario con el botón
        if (!fromChat) {
            // Marcar como apagado manual solo cuando el usuario APAGA el sistema
            // Si está activo y va a desactivarse = apagado manual
            // Si está inactivo y va a activarse = NO es apagado manual
            state.apagadoManualmente = state.activo; // true solo cuando se apaga manualmente
        }
        
        // PASO 2: Determinar el nuevo estado (invertir estado actual)
        const nuevoEstado = !state.activo;
        
        // PASO 3: Limpiar intervalos existentes para evitar duplicados
        if (state.intervalo) {
            console.log('🧹 Limpiando intervalo existente');
            safeInterval.clear(state.intervalo);
            state.intervalo = null;
        }
        
        // PASO 4: Actualizar estado central
        state.activo = nuevoEstado;
        
        // PASO 5A: LÓGICA DE ACTIVACIÓN
        if (nuevoEstado && !fromChat) {
            // Solo activar si no viene del sistema de chat
            console.log('✨ Activando Auto Tap-Tap');
            const intervalo = parseInt(elementos.selector.value);
            elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
            elementos.boton.style.background = '#00ff88';
            elementos.selector.disabled = true;
            elementos.selector.style.opacity = '0.5';
            
            // Al activar manualmente, resetear el estado de apagado manual
            state.apagadoManualmente = false;
            
            // Solo iniciar el intervalo si no está pausado por chat
            if (!state.pausadoPorChat) {
                console.log('🚀 Iniciando intervalo de tap-taps');
                presionarL(); // Ejecutar el primer tap-tap inmediatamente
                state.intervalo = safeInterval.create(presionarL, intervalo);
                
                // Notificar al background script sobre el estado activo
                safeRuntimeMessage({ action: 'started' })
                    .catch(error => console.warn('Error al notificar estado:', error));
            } else {
                console.log('⏸️ No se inicia intervalo - pausado por chat');
            }
        } else {
            // PASO 5B: LÓGICA DE DESACTIVACIÓN
            console.log('🛑 Desactivando Auto Tap-Tap');
            elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
            elementos.boton.style.background = '#ff0050';
            elementos.selector.disabled = false;
            elementos.selector.style.opacity = '1';
            
            // Notificar al background script sobre el estado inactivo
            safeRuntimeMessage({ action: 'stopped' })
                .catch(error => console.warn('Error al notificar estado:', error));
        }

        // PASO 6: Log del estado final para debugging
        console.log('Estado final:', {
            activo: state.activo,
            pausadoPorChat: state.pausadoPorChat,
            apagadoManualmente: state.apagadoManualmente,
            tieneIntervalo: !!state.intervalo
        });
    }
    
    /**
     * =============================================================================
     * FUNCIONES DE ARRASTRE PARA INTERFAZ MÓVIL
     * =============================================================================
     * 
     * Sistema que permite al usuario arrastrar la ventana flotante por la pantalla
     * tanto con mouse como con touch (dispositivos móviles).
     */
    
    /**
     * INICIAR ARRASTRE
     * 
     * Función que se ejecuta cuando el usuario inicia el gesto de arrastre.
     * Compatible con mouse y touch events.
     * 
     * @param {Event} e - Evento de mouse o touch
     */
    function dragStart(e) {
        // Obtener coordenadas del evento (mouse o touch)
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        // Calcular la posición inicial del arrastre
        state.initialX = clientX - state.xOffset;
        state.initialY = clientY - state.yOffset;
        
        // Solo permitir arrastre si se toca el contenedor o la barra de arrastre
        if (e.target === elementos.contenedor || e.target === elementos.barraArrastre) {
            state.isDragging = true;
        }
    }
    
    /**
     * FINALIZAR ARRASTRE
     * 
     * Función que se ejecuta cuando el usuario termina el gesto de arrastre.
     * Guarda la posición final en el almacenamiento para recordarla entre sesiones.
     */
    function dragEnd() {
        // Actualizar las coordenadas finales
        state.initialX = state.currentX;
        state.initialY = state.currentY;
        state.isDragging = false;
        
        // Guardar la posición actual en el almacenamiento persistente
        safeStorageOperation(() => {
            chrome.storage.local.set({ 
                position: { x: state.xOffset, y: state.yOffset } 
            });
        });
    }
    
    /**
     * PROCESAR MOVIMIENTO DE ARRASTRE
     * 
     * Función que se ejecuta continuamente mientras el usuario arrastra la ventana.
     * Actualiza la posición de la ventana flotante en tiempo real.
     * 
     * @param {Event} e - Evento de movimiento (mouse o touch)
     */
    function drag(e) {
        // Solo procesar si estamos en modo arrastre
        if (!state.isDragging) return;
        
        // Solo llamar preventDefault para eventos touch cuando sea necesario
        // para evitar interferir con el scroll normal de la página
        if (e.type === 'touchmove') {
            e.preventDefault(); // Prevenir el scroll durante el arrastre
        }
        
        // Obtener coordenadas actuales del evento (mouse o touch)
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        // Calcular nueva posición basada en el movimiento del mouse/dedo
        state.currentX = clientX - state.initialX;
        state.currentY = clientY - state.initialY;
        state.xOffset = state.currentX;
        state.yOffset = state.currentY;
        
        // Aplicar la transformación CSS para mover la ventana
        elementos.contenedor.style.transform = `translate3d(${state.xOffset}px, ${state.yOffset}px, 0)`;
    }

    /**
     * =============================================================================
     * CREACIÓN DINÁMICA DE LA INTERFAZ DE USUARIO
     * =============================================================================
     * 
     * Esta función construye toda la interfaz flotante de la extensión,
     * incluyendo controles, estilos CSS y estructura del DOM.
     */
    function crearInterfaz() {
        /**
         * CONTENEDOR PRINCIPAL
         * 
         * Div principal que contiene toda la interfaz flotante.
         * Configurado con posicionamiento fijo y z-index alto para estar siempre visible.
         */
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
        
        /**
         * BARRA DE ARRASTRE
         * 
         * Elemento visual en la parte superior que indica dónde el usuario
         * puede hacer clic para arrastrar la ventana.
         */
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
        
        // Indicador visual de que es una barra de arrastre
        const indicador = document.createElement('div');
        indicador.style.cssText = `
            width: 40px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
        `;
        elementos.barraArrastre.appendChild(indicador);
        
        /**
         * BOTÓN MINIMIZAR/MAXIMIZAR
         * 
         * Botón pequeño en la esquina superior derecha para ocultar/mostrar
         * los controles y hacer la interfaz más compacta.
         */
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
        
        /**
         * BOTÓN PRINCIPAL DE CONTROL
         * 
         * Botón grande que permite activar/desactivar el auto tap-tap.
         * Cambia de color y texto según el estado actual.
         */
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
        
        /**
         * SELECTOR DE VELOCIDAD
         * 
         * Dropdown que permite al usuario elegir la velocidad de los tap-taps
         * (intervalo entre cada corazón enviado).
         */
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
        
        // Poblar el selector con las opciones de velocidad predefinidas
        config.intervalos.forEach(({ valor, texto }) => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = texto;
            elementos.selector.appendChild(option);
        });
        
        /**
         * DISPLAY DEL CONTADOR
         * 
         * Área que muestra cuántos tap-taps se han enviado en la sesión actual.
         */
        elementos.contadorDiv = document.createElement('div');
        elementos.contadorDiv.style.cssText = `
            color: white;
            text-align: center;
            margin-top: 10px;
            font-size: 14px;
        `;
        elementos.contadorDiv.innerHTML = '❤️ Tap-taps dados: <span id="contador-taptaps">0</span>';
        elementos.contador = elementos.contadorDiv.querySelector('#contador-taptaps');
        
        /**
         * BOTÓN DE RESET
         * 
         * Botón pequeño para resetear el contador de tap-taps a cero.
         */
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

        /**
         * SECCIÓN DE CONFIGURACIÓN DE CHAT
         * 
         * Área que permite configurar el tiempo de espera para reactivación
         * automática después de usar el chat.
         */
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
        
        /**
         * SECCIÓN DE COPYRIGHT
         * 
         * Información sobre los desarrolladores y la organización
         * que creó la extensión.
         */
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

        /**
         * ENSAMBLAR TODA LA INTERFAZ
         * 
         * Agregar todos los elementos creados al contenedor principal
         * y luego insertar la interfaz completa en el DOM de la página.
         */
        elementos.contenedor.appendChild(elementos.barraArrastre);
        elementos.contenedor.appendChild(elementos.botonMinimizar);
        elementos.contenedor.appendChild(elementos.boton);
        elementos.contenedor.appendChild(elementos.selector);
        elementos.contenedor.appendChild(elementos.contadorDiv);
        elementos.contenedor.appendChild(elementos.botonReset);
        elementos.contenedor.appendChild(elementos.configDiv);
        elementos.contenedor.appendChild(elementos.copyrightDiv);
        
        // Insertar la interfaz completa en el DOM de la página
        document.body.appendChild(elementos.contenedor);
    }
    
    /**
     * =============================================================================
     * SISTEMA DE DETECCIÓN Y MANEJO DEL CHAT DE TIKTOK
     * =============================================================================
     * 
     * Este sistema es uno de los componentes más sofisticados de la extensión.
     * Se encarga de detectar automáticamente cuando el usuario interactúa con
     * el chat de TikTok Live y pausar/reactivar el auto tap-tap inteligentemente.
     * 
     * FUNCIONALIDADES PRINCIPALES:
     * - Búsqueda dinámica del elemento de chat en el DOM
     * - Observación de cambios en la estructura de la página
     * - Detección de interacciones del usuario con el chat
     * - Pausa automática durante escritura en el chat
     * - Reactivación automática tras período de inactividad
     * - Sistema de timers y cancelación inteligente
     */
    
    /**
     * FUNCIÓN PRINCIPAL DE MANEJO DE INTERACCIONES DE CHAT
     * 
     * Coordina todo el sistema de detección del chat. Primero intenta encontrar
     * el elemento de chat inmediatamente, y si no lo encuentra, configura un
     * observer para detectarlo cuando aparezca dinámicamente.
     * 
     * PROCESO:
     * 1. Búsqueda inmediata del elemento de chat
     * 2. Si no se encuentra, configurar MutationObserver
     * 3. Una vez encontrado, configurar todos los event listeners
     * 4. Devolver función de limpieza para cleanup posterior
     * 
     * @returns {Object} - Objeto con función de cleanup del observer
     */
    function manejarInteraccionChat() {
        console.log('🔍 Iniciando búsqueda del chat...');
        
        let chatInput = null;
        
        /**
         * OBJETO DE CONTROL DEL MUTATION OBSERVER
         * 
         * Encapsula la lógica del observer que vigila cambios en el DOM
         * para detectar cuando aparece dinámicamente el elemento de chat.
         */
        const chatObserver = {
            observer: null,
            active: false,
            
            /**
             * Función de limpieza que desconecta el observer y marca como inactivo
             */
            cleanup() {
                if (this.observer) {
                    this.observer.disconnect();
                    this.active = false;
                }
            }
        };

        /**
         * FUNCIÓN AUXILIAR PARA BÚSQUEDA INTELIGENTE DEL CHAT
         * 
         * Utiliza múltiples estrategias para encontrar el elemento de input del chat
         * en diferentes versiones y estados de la interfaz de TikTok Live.
         * 
         * ESTRATEGIAS DE BÚSQUEDA:
         * 1. Selectores específicos priorizados por confiabilidad
         * 2. Búsqueda alternativa por atributos contenteditable
         * 3. Validación de elementos encontrados
         * 
         * @returns {Element|null} - Elemento de chat encontrado o null
         */
        const buscarChatInput = () => {
            // Lista priorizada de selectores CSS para diferentes versiones de TikTok
            const selectores = [
                'div[contenteditable="plaintext-only"][maxlength="150"]',    // Selector más específico
                'div[contenteditable="plaintext-only"][placeholder="Di algo bonito"]', // Con placeholder específico
                'div[contenteditable="plaintext-only"]',                     // Genérico contenteditable
                'input[placeholder="Di algo bonito"]'                       // Fallback para input tradicional
            ];

            // Intentar cada selector en orden de prioridad
            for (const selector of selectores) {
                const elemento = document.querySelector(selector);
                if (elemento) {
                    console.log('✅ Chat encontrado con selector:', selector);
                    return elemento;
                }
            }

            // ESTRATEGIA ALTERNATIVA: Búsqueda manual por atributos
            // Si los selectores específicos fallan, buscar manualmente
            const posiblesChatInputs = Array.from(document.querySelectorAll('div[contenteditable]'));
            return posiblesChatInputs.find(el => el.getAttribute('contenteditable') === 'plaintext-only');
        };

        /**
         * INICIALIZAR MUTATION OBSERVER PARA DETECCIÓN DINÁMICA
         * 
         * Configura un observer que vigila cambios en el DOM para detectar
         * cuando el elemento de chat aparece dinámicamente (por ejemplo,
         * después de que se carga completamente la interfaz de TikTok).
         */
        const iniciarObservador = () => {
            // Evitar múltiples observers activos
            if (chatObserver.active) return;

            // Limpiar cualquier observer previo
            chatObserver.cleanup();
            
            // Crear nuevo MutationObserver
            chatObserver.observer = new MutationObserver(() => {
                // Si ya encontramos el chat, no seguir buscando
                if (chatInput) return;

                // Intentar encontrar el chat en cada mutación del DOM
                chatInput = buscarChatInput();
                if (chatInput) {
                    console.log('🎉 Chat encontrado por el observador!');
                    chatObserver.cleanup(); // Limpiar observer una vez encontrado
                    configurarEventosChat(chatInput); // Configurar eventos del chat
                }
            });

            // Configurar el observer para vigilar cambios en todo el documento
            chatObserver.observer.observe(document.body, {
                childList: true, // Vigilar adición/eliminación de nodos
                subtree: true    // Vigilar cambios en todo el subárbol
            });
            chatObserver.active = true;
        };

        // PASO 1: Búsqueda inmediata del elemento de chat
        chatInput = buscarChatInput();
        if (chatInput) {
            console.log('✨ Chat encontrado inmediatamente!');
            configurarEventosChat(chatInput);
        } else {
            console.log('⏳ Chat no encontrado inicialmente, iniciando observador...');
            iniciarObservador();
        }
        
        // PASO 2: Guardar referencia del observador en el estado global para limpieza posterior
        state.chatObserver = chatObserver;
        
        return chatObserver;
    }

    function configurarEventosChat(chatInput) {
        console.log('🔄 Configurando eventos del chat...');
        
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

        // Variables para el manejo de inactividad
        let inactivityTimer = null;
        
        // Función para manejar la actividad del usuario
        const handleActivity = () => {
            
            // Limpiar el timer existente de inactividad
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }

            // Si estamos pausados por chat y no hay texto, configurar nuevo timer
            if (state.pausadoPorChat && !chatInput.textContent.trim()) {
                inactivityTimer = setTimeout(() => {
                    console.log('⏳ Inactividad detectada en chat vacío');
                    iniciarCuentaRegresiva();
                }, 2000); // 2 segundos de inactividad
            }
        };

        // Reactivar el Auto Tap-Tap
        const reactivarAutoTapTap = () => {
            console.log('🎯 Intentando reactivar Auto Tap-Tap...');
            console.log('Estado actual:', { 
                apagadoManualmente: state.apagadoManualmente,
                pausadoPorChat: state.pausadoPorChat,
                activo: state.activo
            });
            
            if (!state.apagadoManualmente) {
                state.pausadoPorChat = false;
                timers.cleanupAll();
                
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }

                if (chatInput.getAttribute('contenteditable')) {
                    chatInput.blur();
                    chatInput.setAttribute('focused', 'false');
                } else {
                    chatInput.blur();
                }

                // Actualizar estado visual del botón antes de toggle
                elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
                elementos.boton.style.background = '#00ff88';
                elementos.selector.disabled = true;
                elementos.selector.style.opacity = '0.5';

                toggleAutoTapTap(true);
                mostrarNotificacionChat('¡Auto Tap-Tap reactivado! 🎉', 'success');
            }
        };

        // Manejador para cuando el usuario está escribiendo o deja de escribir
        const handleInput = () => {
            console.log('✍️ Actividad en chat detectada');
            timers.cleanupAll();
            handleActivity();
            
            if (state.pausadoPorChat) {
                if (chatInput.textContent.trim() !== '') {
                    console.log('💭 Usuario escribiendo, cancelando reactivación');
                    timers.cleanupAll();
                    if (inactivityTimer) {
                        clearTimeout(inactivityTimer);
                        inactivityTimer = null;
                    }
                } else {
                    console.log('📝 Chat vacío, esperando inactividad...');
                    handleActivity();
                }
            }
        };

        // Función para iniciar la cuenta regresiva
        const iniciarCuentaRegresiva = () => {
            if (state.pausadoPorChat && !state.apagadoManualmente && !chatInput.textContent.trim()) {
                console.log('🔄 Iniciando cuenta regresiva por inactividad en chat');
                timers.cleanupAll();
                
                // Limpiar timer de inactividad existente
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
                
                timers.chat = setTimeout(() => {
                    mostrarCuentaRegresiva(`⏳ Reactivando en ${state.tiempoReactivacion}s...`);
                    setTimeout(reactivarAutoTapTap, state.tiempoReactivacion * 1000);
                }, 0);
            }
        };

        // Pausar cuando el usuario interactúa con el chat
        const onFocus = (e) => {
            console.log('👆 Interacción detectada con el chat:', e.type);
            console.log('Estado actual:', {
                activo: state.activo,
                apagadoManualmente: state.apagadoManualmente,
                pausadoPorChat: state.pausadoPorChat
            });

            if (state.activo && !state.apagadoManualmente) {
                console.log('🛑 Pausando Auto Tap-Tap por interacción con chat');
                
                // Asegurar que se marca como pausado por chat antes de toggle
                state.pausadoPorChat = true;
                
                // Limpiar cualquier timer existente
                timers.cleanupAll();
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
                
                // Pausar el Auto Tap-Tap
                toggleAutoTapTap(false);
                
                // Mostrar notificación
                mostrarNotificacionChat('✍️ Auto Tap-Tap pausado mientras escribes...', 'warning');
                
                // Iniciar manejo de inactividad
                handleActivity();
                
                // Prevenir la propagación del evento
                e.stopPropagation();
            }
        };

        // Configurar eventos del chat
        chatInput.addEventListener('focus', onFocus, true);
        chatInput.addEventListener('click', onFocus, true);
        chatInput.addEventListener('mousedown', onFocus, true);
        chatInput.addEventListener('touchstart', onFocus, { passive: true, capture: true });
        chatInput.addEventListener('input', handleInput, true);

        // Eventos específicos para detectar inactividad
        if (chatInput.getAttribute('contenteditable')) {
            chatInput.addEventListener('keydown', (e) => {
                if (!state.pausadoPorChat) onFocus(e);
                handleActivity();
            }, true);
            
            chatInput.addEventListener('keyup', () => {
                setTimeout(handleInput, 50);
            }, true);
            
            chatInput.addEventListener('paste', () => {
                setTimeout(handleInput, 50);
            }, true);
            
            // Monitorear actividad del mouse
            chatInput.addEventListener('mousemove', handleActivity, { passive: true });
            chatInput.addEventListener('mouseenter', handleActivity, { passive: true });
        }

        // Click fuera del chat
        const handleClickOutside = (e) => {
            // Encontrar el contenedor del chat de manera más robusta
            const chatContainer = chatInput.closest([
                'div[class*="chat"]',
                'div[class*="message"]',
                'div[data-e2e*="chat"]',
                'div[data-e2e*="message"]',
                'div[contenteditable="plaintext-only"]',
                'div[contenteditable][maxlength="150"]',
                'div[contenteditable][role="textbox"]'
            ].join(',')) || chatInput.parentElement;

            console.log('🔍 Click detectado:', {
                target: e.target,
                isOutside: !chatContainer.contains(e.target),
                pausadoPorChat: state.pausadoPorChat,
                apagadoManualmente: state.apagadoManualmente
            });

            if (!chatContainer.contains(e.target) && state.pausadoPorChat && !state.apagadoManualmente) {
                timers.cleanupAll();
                timers.chat = setTimeout(reactivarAutoTapTap, state.tiempoReactivacion * 1000);
                mostrarCuentaRegresiva(`⏳ Reactivando en ${state.tiempoReactivacion}s...`);
            }
        };

        document.addEventListener('click', handleClickOutside, true);
        document.addEventListener('touchend', handleClickOutside, true);

        // Función de limpieza
        const cleanup = () => {
            console.log('🧹 Limpiando eventos del chat');
            timers.cleanupAll();
            document.removeEventListener('click', handleClickOutside, true);
            document.removeEventListener('touchend', handleClickOutside, true);
        };
        
        // Guardar la función de limpieza
        state.chatCleanup = cleanup;
        
        return cleanup;
    }

    // Función para mostrar notificaciones del chat
    function mostrarNotificacionChat(mensaje, tipo = 'info') {
        // Crear div de notificaciones bajo copyright si no existe
        if (!elementos.notificacionesContainer) {
            elementos.notificacionesContainer = document.createElement('div');
            elementos.notificacionesContainer.style.cssText = `
                margin-top: 10px;
                width: 100%;
            `;
            // Insertar después del div de copyright
            elementos.contenedor.appendChild(elementos.notificacionesContainer);
        }

        // Solo crear el contenedor si no existe
        if (!elementos.notificacionChat) {
            elementos.notificacionChat = document.createElement('div');
            elementos.notificacionChat.style.cssText = `
                padding: 10px 15px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s ease;
                width: 100%;
                text-align: center;
                margin-bottom: 5px;
                box-sizing: border-box;
            `;
            elementos.notificacionesContainer.appendChild(elementos.notificacionChat);
        }

        // Establecer estilos según el tipo de notificación
        const estilos = {
            success: {
                background: 'rgba(14, 79, 2, 0.95)',
                color: '#fff',
                border: '1px solid rgb(24, 80, 2)',
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
    
    /**
     * =============================================================================
     * SISTEMA DE NOTIFICACIÓN VISUAL DE CUENTA REGRESIVA
     * =============================================================================
     * 
     * Muestra notificaciones de cuenta regresiva en una esquina de la interfaz
     * para informar al usuario sobre reactivaciones automáticas pendientes.
     * 
     * PROPÓSITO:
     * Proporciona feedback visual cuando el sistema está esperando para reactivar
     * automáticamente el Auto Tap-Tap después de detectar inactividad en el chat.
     * 
     * UBICACIÓN VISUAL:
     * - Posición: Esquina inferior derecha de la interfaz principal
     * - Estilo: Globo semi-transparente con borde redondeado
     * - Z-index: Alto para estar siempre visible por encima de otros elementos
     * 
     * COMPORTAMIENTO:
     * 1. 🎨 Crea dinámicamente el contenedor si no existe
     * 2. 📝 Actualiza el mensaje de cuenta regresiva
     * 3. ✨ Aplica animación de fade-in para aparecer suavemente
     * 4. ⏰ Se auto-oculta después de 3 segundos con fade-out
     * 
     * CASOS DE USO:
     * - "⏳ Reactivando en 10s..." - Cuenta regresiva normal
     * - "🔄 Reactivando automáticamente..." - Confirmación de reactivación
     * - Cualquier mensaje temporal relacionado con el estado del chat
     * 
     * INTEGRACIÓN:
     * - Llamada desde: configurarEventosChat() durante manejo de inactividad
     * - Depende de: elementos.contenedor para posicionamiento relativo
     * - CSS: Posicionamiento absoluto relativo al contenedor principal
     * 
     * @param {string} mensaje - Texto a mostrar en la notificación
     * 
     * ARQUITECTURA DEL ELEMENTO:
     * - Contenedor: elementos.cuentaRegresivaDiv (creado dinámicamente)
     * - Posicionamiento: Absoluto, esquina inferior derecha
     * - Animación: Transición CSS de opacidad (fade in/out)
     * - Estilo: Diseño coherente con el resto de la interfaz
     */
    function mostrarCuentaRegresiva(mensaje) {
        // Verificar y crear contenedor de cuenta regresiva si no existe
        if (!elementos.cuentaRegresivaDiv) {
            // Crear elemento div para la notificación de cuenta regresiva
            elementos.cuentaRegresivaDiv = document.createElement('div');
            
            // Aplicar estilos CSS integrados para posicionamiento y apariencia
            elementos.cuentaRegresivaDiv.style.cssText = `
                position: absolute;           /* Posicionamiento absoluto respecto al contenedor */
                bottom: -5px;                /* 5px debajo del contenedor principal */
                right: -5px;                 /* 5px a la derecha del contenedor principal */
                background: rgba(0, 0, 0, 0.95);  /* Fondo negro semi-transparente */
                color: #fff;                 /* Texto blanco para contraste */
                border: 1px solid #666;      /* Borde gris sutil */
                padding: 8px 12px;           /* Espaciado interno cómodo */
                border-radius: 8px;          /* Bordes redondeados */
                font-family: Arial, sans-serif;  /* Fuente consistente */
                font-size: 12px;             /* Tamaño de texto compacto */
                z-index: 999999;             /* Z-index máximo para visibilidad */
                opacity: 0;                  /* Inicialmente invisible para animación */
                transition: opacity 0.3s ease;  /* Transición suave de aparición/desaparición */
                text-align: center;          /* Texto centrado */
                white-space: nowrap;         /* Evitar salto de línea */
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);  /* Sombra sutil para profundidad */
            `;
            
            // Agregar el elemento al contenedor principal de la interfaz
            elementos.contenedor.appendChild(elementos.cuentaRegresivaDiv);
        }

        // Actualizar el contenido del mensaje
        elementos.cuentaRegresivaDiv.textContent = mensaje;
        
        // Hacer visible la notificación con animación fade-in
        elementos.cuentaRegresivaDiv.style.opacity = '1';

        // Programar auto-ocultación después de 3 segundos
        setTimeout(() => {
            // Verificar que el elemento aún existe antes de ocultarlo
            if (elementos.cuentaRegresivaDiv) {
                // Aplicar animación fade-out
                elementos.cuentaRegresivaDiv.style.opacity = '0';
            }
        }, 3000); // 3000ms = 3 segundos de duración visible
    }

    // Configurar eventos
    function configurarEventos() {
        // Array para almacenar todos los eventos registrados
        const events = [];
        
        // Variable para almacenar el listener de mensajes
        let messageListener = null;
        
        // Helper para agregar eventos y facilitar limpieza
        const addEvent = (element, type, handler, options = false) => {
            element.addEventListener(type, handler, options);
            events.push({ element, type, handler, options });
        };

        // Toggle principal
        addEvent(elementos.boton, 'click', () => {
            state.apagadoManualmente = state.activo; // Solo cuando se apaga, no cuando se enciende
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

    // ========================================================================================
    // 🔍 SISTEMA DE VERIFICACIÓN DE ESTADO DE EXTENSIÓN
    // ========================================================================================
    
    /**
     * Verifica que el contexto de la extensión de Chrome siga siendo válido
     * 
     * PROPÓSITO:
     * Durante el desarrollo o actualizaciones de la extensión, el contexto puede
     * invalidarse, causando errores en la comunicación con el background script.
     * Esta función detecta esta situación y activa una reconexión automática.
     * 
     * MECÁNICA DE VERIFICACIÓN:
     * Utiliza chrome.runtime.getURL('') como método de prueba para verificar
     * si el contexto de runtime sigue activo. Si el contexto está invalidado,
     * Chrome lanzará una excepción específica que podemos capturar.
     * 
     * CASOS DE INVALIDACIÓN:
     * - Recarga de la extensión durante desarrollo
     * - Actualización automática de la extensión
     * - Deshabilitación y re-habilitación manual
     * - Errores internos del sistema de extensiones de Chrome
     * 
     * RESPUESTA A INVALIDACIÓN:
     * Cuando se detecta contexto invalidado, llama a reloadExtension()
     * para reinicializar completamente el content script.
     * 
     * FRECUENCIA DE USO:
     * - Llamada periódicamente cada 5 segundos desde configurarEventos()
     * - También puede ser llamada antes de operaciones críticas
     * 
     * @returns {boolean} - true si el contexto es válido, false si está invalidado
     * 
     * INTEGRACIÓN:
     * - Depende de: chrome.runtime API
     * - Llama a: reloadExtension() en caso de invalidación
     * - Usado por: setInterval en configurarEventos()
     * 
     * MANEJO DE ERRORES:
     * - Captura específicamente "Extension context invalidated"
     * - Log informativo para debugging
     * - Retorna false para indicar fallo de verificación
     */
    function checkExtensionStatus() {
        try {
            // Intentar acceder a chrome.runtime.getURL como prueba de contexto válido
            // Esta operación fallará si el contexto de la extensión se ha invalidado
            chrome.runtime.getURL('');
        } catch (error) {
            // Verificar si el error es específicamente de contexto invalidado
            if (error.message.includes('Extension context invalidated')) {
                console.log('🔄 Reconectando extensión debido a contexto invalidado...');
                reloadExtension(); // Activar proceso de reconexión
            }
            return false; // Indicar que la verificación falló
        }
        return true; // Contexto válido, extensión funcionando correctamente
    }

    // ========================================================================================
    // 📡 CONFIGURACIÓN DEL SISTEMA DE MENSAJERÍA INTER-SCRIPTS
    // ========================================================================================
    
    /**
     * Configura el listener principal para manejar mensajes del background script y popup
     * 
     * ARQUITECTURA DE COMUNICACIÓN:
     * Esta función establece el sistema de comunicación bidireccional entre el content script
     * y otros componentes de la extensión (background.js, popup.js). Implementa un patrón
     * robusto de manejo de mensajes con respuestas asíncronas.
     * 
     * FUNCIONALIDADES PRINCIPALES:
     * 1. 🔄 Limpieza de listeners previos para evitar duplicados
     * 2. 📨 Routing de mensajes basado en action
     * 3. 🔄 Respuestas asíncronas con manejo de errores
     * 4. ❤️ Health check periódico con background script
     * 5. 🛡️ Manejo robusto de errores de comunicación
     * 
     * TIPOS DE MENSAJES MANEJADOS:
     * - 'getStatus': Retorna estado actual de automatización
     * - 'toggle': Activa/desactiva Auto Tap-Tap
     * - 'updateInterval': Cambia velocidad de tap-taps
     * - 'updateTapTaps': Actualiza contador
     * - 'updateReactivationTime': Modifica tiempo de reactivación
     * 
     * PATRÓN DE RESPUESTA:
     * Todas las respuestas siguen el formato estándar:
     * - Éxito: { success: true, ...datos }
     * - Error: { error: "descripción del error" }
     * 
     * SISTEMA DE HEALTH CHECK:
     * - Ping cada 5 segundos al background script
     * - Auto-reconexión si se detecta pérdida de comunicación
     * - Limpieza automática de intervalos en caso de fallo
     * 
     * MANEJO DE ERRORES ROBUSTO:
     * - Try/catch en cada operación crítica
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
                chrome.runtime.sendMessage({ action: 'ping' }, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('Error en ping:', chrome.runtime.lastError);
                    }
                });
            }, 5000);
            
        } catch (error) {
            console.error('Error al configurar listener de mensajes:', error);
        }
    }
            }, 5000);
            
        } catch (error) {
            console.error('Error al configurar listener de mensajes:', error);
        }
    }

    // ========================================================================================
    // 🚀 FUNCIÓN DE INICIALIZACIÓN PRINCIPAL
    // ========================================================================================
    
    /**
     * Función principal que coordina la inicialización completa de la extensión
     * 
     * PROCESO DE INICIALIZACIÓN:
     * Esta función orquesta todo el proceso de arranque de la extensión de manera
     * secuencial y segura, asegurando que todos los componentes se configuren
     * correctamente antes de que el usuario pueda interactuar con la interfaz.
     * 
     * FASES DE INICIALIZACIÓN:
     * 1. 🎨 CREACIÓN DE INTERFAZ: Construye y posiciona la UI flotante
     * 2. 💾 RESTAURACIÓN DE ESTADO: Carga configuraciones persistentes
     * 3. 🔧 CONFIGURACIÓN DE EVENTOS: Establece todos los event listeners
     * 4. 💬 SISTEMA DE CHAT: Activa detección de interacciones de chat
     * 
     * DATOS PERSISTENTES RESTAURADOS:
     * - intervalo: Velocidad seleccionada de tap-taps (ms entre cada tap)
     * - totalTapTaps: Contador acumulativo total de todas las sesiones
     * - position: Posición X,Y de la ventana flotante en pantalla
     * - tiempoReactivacion: Segundos de espera para reactivación por chat
     * 
     * MANEJO DE POSICIONAMIENTO:
     * Restaura la posición exacta donde el usuario dejó la ventana flotante,
     * aplicando transform3d para rendimiento optimizado en GPU.
     * 
     * ORDEN DE EJECUCIÓN CRÍTICO:
     * 1. crearInterfaz() debe ejecutarse ANTES de cargar storage (necesita elementos)
     * 2. Storage debe cargarse ANTES de configurarEventos() (inicializa estado)
     * 3. configurarEventos() debe ejecutarse ANTES de manejarInteraccionChat()
     * 4. manejarInteraccionChat() se ejecuta AL FINAL (depende de estado completo)
     * 
     * OPERACIONES ASÍNCRONAS:
     * Todas las operaciones de storage se ejecutan de manera asíncrona
     * para no bloquear la UI, usando safeStorageOperation() para manejo de errores.
     * 
     * @description Inicializa todos los componentes de la extensión en orden correcto
     */
    function init() {
        // FASE 1: Crear la interfaz de usuario flotante
        crearInterfaz();
        
        // FASE 2: Cargar y restaurar estado persistente desde chrome.storage
        safeStorageOperation(() => {
            chrome.storage.local.get([
                'intervalo',           // Velocidad de tap-taps configurada
                'totalTapTaps',        // Contador total acumulativo
                'position',            // Posición de ventana flotante
                'tiempoReactivacion'   // Tiempo de espera para reactivación
            ], result => {
                // Restaurar intervalo de velocidad si existe configuración previa
                if (result.intervalo) {
                    elementos.selector.value = result.intervalo;
                    // Nota: No iniciar intervalo automáticamente al cargar
                    // El usuario debe activar manualmente el Auto Tap-Tap
                }
                
                // Restaurar contador total de sesiones anteriores
                if (result.totalTapTaps) {
                    state.contador = result.totalTapTaps;
                    actualizarContador();
                }
                
                // Restaurar posición de ventana flotante
                if (result.position) {
                    const { x, y } = result.position;
                    state.xOffset = x;
                    state.yOffset = y;
                    // Aplicar posición con transform3d para mejor rendimiento
                    elementos.contenedor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                }
                
                // Restaurar tiempo de reactivación personalizado
                if (result.tiempoReactivacion) {
                    state.tiempoReactivacion = result.tiempoReactivacion;
                    elementos.reactivacionInput.value = result.tiempoReactivacion;
                }
            });
        });
        
        // FASE 3: Configurar todos los event listeners y sistemas de comunicación
        configurarEventos();
        
        // FASE 4: Activar sistema de detección de interacciones de chat
        manejarInteraccionChat();
    }

    // ========================================================================================
    // 🎯 PUNTO DE ENTRADA PRINCIPAL DE LA EXTENSIÓN
    // ========================================================================================
    
    /**
     * INICIACIÓN AUTOMÁTICA DE LA APLICACIÓN
     * 
     * Ejecuta la función de inicialización inmediatamente cuando el script
     * se carga en la página de TikTok. Esta es la llamada que pone en marcha
     * todo el sistema de Auto Tap-Tap.
     * 
     * TIMING DE EJECUCIÓN:
     * Se ejecuta tan pronto como el DOM está listo y el content script
     * se inyecta en la página, asegurando que la extensión esté disponible
     * para el usuario lo antes posible.
     * 
     * PROTECCIÓN CONTRA MÚLTIPLES INSTANCIAS:
     * El guard clause al inicio del IIFE previene que múltiples instancias
     * de la extensión se ejecuten simultáneamente en la misma página.
     */
    init();

// ========================================================================================
// 🏁 FIN DEL IIFE (Immediately Invoked Function Expression)
// ========================================================================================

/**
 * CIERRE DEL CONTEXTO ENCAPSULADO
 * 
 * El paréntesis final cierra la función auto-ejecutable que encapsula todo
 * el código de la extensión. Esto mantiene el scope global limpio y previene
 * conflictos con otros scripts que puedan estar ejecutándose en TikTok.
 * 
 * BENEFICIOS DEL ENCAPSULAMIENTO:
 * - Previene contaminación del scope global
 * - Evita conflictos de variables con otros scripts
 * - Permite uso de 'strict mode' de manera aislada
 * - Facilita debugging y mantenimiento del código
 */
})();

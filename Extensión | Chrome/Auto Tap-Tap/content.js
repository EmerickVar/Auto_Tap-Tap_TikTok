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
 * =============================================================================
 * SISTEMA DE MENSAJERÍA BÁSICO PARA PÁGINAS NO-LIVE
 * =============================================================================
 * 
 * Esta función configura un sistema de mensajería mínimo que solo responde
 * a las consultas básicas del popup cuando no estamos en una página Live.
 * Esto previene el ciclo infinito de recarga causado por la falta de respuesta
 * del content script en páginas que no son de transmisión en vivo.
 * 
 * FUNCIONALIDAD LIMITADA:
 * - Solo responde a consultas de estado ('getStatus')
 * - Siempre retorna estado inactivo ya que no hay funcionalidad completa
 * - No maneja toggles ni configuraciones (solo disponibles en Live)
 * - Previene errores de comunicación que causan recargas automáticas
 */
function setupBasicMessageListener() {
    try {
        console.log('🔧 Configurando sistema de mensajería básico...');
        
        // Listener simplificado que solo maneja consultas de estado
        const basicMessageListener = (request, sender, sendResponse) => {
            try {
                // Solo respondemos a consultas de estado
                if (request.action === 'getStatus') {
                    console.log('📡 Popup consultó estado - Respondiendo con estado inactivo (página TikTok no-Live)');
                    
                    // Responder con estado básico indicando que estamos en TikTok pero no en Live
                    sendResponse({
                        activo: false,              // Siempre inactivo en páginas no-Live
                        contador: 0,                // Sin contador en modo básico
                        tiempoReactivacion: 10,     // Valor por defecto
                        pausadoPorChat: false,      // Sin detección de chat en modo básico
                        enTikTok: true,             // Nuevo: Indicar que SÍ estamos en TikTok
                        enLive: false               // Nuevo: Pero NO estamos en Live
                    });
                    return true; // Indicar que la respuesta es síncrona
                }
                
                // Para cualquier otra acción, responder con error explicativo
                if (request.action) {
                    console.log(`❌ Acción '${request.action}' no disponible en modo básico`);
                    sendResponse({ 
                        error: 'Funcionalidad no disponible. Ve a una página Live de TikTok.' 
                    });
                    return true;
                }
                
                // Si no es una acción reconocida, no responder
                console.log('🤷 Mensaje no reconocido en modo básico:', request);
                
            } catch (error) {
                console.error('Error en listener básico:', error);
                sendResponse({ error: 'Error interno del content script' });
            }
            
            return true; // Mantener el canal abierto para respuesta asíncrona
        };
        
        // Registrar el listener
        chrome.runtime.onMessage.addListener(basicMessageListener);
        console.log('✅ Sistema de mensajería básico configurado correctamente');
        
    } catch (error) {
        console.error('❌ Error al configurar sistema de mensajería básico:', error);
    }
}

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
     * VERIFICACIÓN INICIAL - DETERMINAR SI ESTAMOS EN UN LIVE DE TIKTOK
     * 
     * La extensión completa solo debe funcionar en páginas de transmisiones en vivo de TikTok.
     * Sin embargo, necesitamos responder a mensajes del popup en todas las páginas de TikTok.
     */
    const fullPath = window.location.pathname + window.location.search;
    const pathname = window.location.pathname;
    
    // Debug: Imprimir información de la URL para diagnosticar
    console.log('🔍 Analizando URL:', {
        href: window.location.href,
        pathname: pathname,
        search: window.location.search,
        fullPath: fullPath
    });
    
    // Patrón mejorado para detectar páginas Live de TikTok
    // Debe coincidir con: /@username/live (con o sin parámetros adicionales)
    const livePattern = /^\/@[^\/]+\/live(?:\/[^?]*)?$/;
    const isOnLive = livePattern.test(pathname); // Solo usar pathname, no search params
    
    console.log('🎯 Resultado detección Live:', {
        pattern: livePattern.toString(),
        pathname: pathname,
        matches: isOnLive
    });

    if (!isOnLive) {
        console.log('ℹ️ Extensión en modo básico: Solo responderá a mensajes del popup');
        console.log('🔧 Llamando a setupBasicMessageListener()...');
        // Configurar solo el sistema de mensajería básico para responder al popup
        try {
            setupBasicMessageListener();
            console.log('✅ setupBasicMessageListener() ejecutado sin errores');
        } catch (error) {
            console.error('❌ Error al ejecutar setupBasicMessageListener():', error);
        }
        return;
    }

    console.log('✅ Extensión en modo completo: Estamos en un Live de TikTok');

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
     * VARIABLE GLOBAL PARA EL LISTENER DE MENSAJES
     * =============================================================================
     * 
     * Variable que almacena la referencia al listener de mensajes para poder
     * limpiarlo correctamente cuando sea necesario.
     */
    let messageListener = null;
    
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
     * VERIFICAR SI ESTAMOS EN UNA PÁGINA DE LIVE DE TIKTOK
     * 
     * Función que verifica si la URL actual corresponde a una transmisión en vivo
     * de TikTok. Esta verificación es crucial para evitar intentos de conexión
     * innecesarios en otras partes de TikTok.
     * 
     * FORMATO DE URLs DE LIVE DE TIKTOK:
     * - /@[usuario]/live - Formato estándar de live
     * - /@[usuario]/live/[id] - Live con ID específico
     * - /@[usuario]/live?[parámetros] - Live con parámetros de consulta
     * - /@[usuario]/live/[id]?[parámetros] - Live con ID y parámetros
     * 
     * @returns {boolean} - true si estamos en una página de live, false en caso contrario
     */
    function isOnTikTokLive() {
        const pathname = window.location.pathname;
        const search = window.location.search;
        const fullPath = pathname + search;
        
        // Patrón regex para detectar URLs de live de TikTok: /@[usuario]/live
        // Acepta cualquier cosa después de /live (incluyendo parámetros de consulta)
        const livePattern = /^\/@[^\/]+\/live(?:\/[^?]*)?(?:\?.*)?$/;
        const isLive = livePattern.test(fullPath);
        
        console.log(`🎯 Verificación de ubicación: ${isLive ? '✅ En Live' : '❌ Fuera de Live'} - ${fullPath}`);
        
        // Log adicional para debugging del patrón
        if (!isLive && (pathname.includes('live') || search.includes('live'))) {
            console.log(`🔍 URL contiene 'live' pero no coincide con el patrón /@usuario/live`);
        }
        
        return isLive;
    }
    
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
        // Verificar que estemos en un live antes de realizar operaciones
        if (!isOnTikTokLive()) {
            console.warn('🚫 Operación de almacenamiento cancelada: No estamos en un Live de TikTok');
            return Promise.reject(new Error('Not on TikTok Live page'));
        }
        
        try {
            return operation();
        } catch (error) {
            console.warn('Error en operación de almacenamiento:', error);
            // Si el contexto de la extensión se invalió, intentar reconectar solo si estamos en live
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
     * 1. Verifica que todavía estemos en una página de Live de TikTok
     * 2. Limpia todos los timers y estados anteriores
     * 3. Realiza múltiples intentos de reconexión con delays progresivos
     * 4. Verifica la validez del contexto de Chrome extension APIs
     * 5. Restaura el estado anterior si estaba activo
     * 6. Reconfigura todos los event listeners
     * 7. Sincroniza la configuración desde el almacenamiento
     * 8. Si todos los intentos fallan, recarga la página como último recurso
     */
    function reloadExtension() {
        console.log('🔄 Reconectando extensión...');
        
        // PASO 0: Verificar que todavía estemos en una página de Live de TikTok
        if (!isOnTikTokLive()) {
            console.warn('🚫 Reconexión cancelada: No estamos en un Live de TikTok');
            // Limpiar todos los recursos y detener la extensión
            if (state.intervalo) clearInterval(state.intervalo);
            if (state.chatTimeout) clearTimeout(state.chatTimeout);
            safeInterval.clearAll();
            return;
        }
        
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
            // Verificar nuevamente que sigamos en un live antes de cada intento
            if (!isOnTikTokLive()) {
                console.warn('🚫 Reintento cancelado: Ya no estamos en un Live de TikTok');
                return;
            }
            
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
                        contador: state.contador,
                        enTikTok: true,
                        enLive: true
                    });
                } else {
                    safeRuntimeMessage({ 
                        action: 'stopped',
                        enTikTok: true,
                        enLive: true
                    });
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
            // VERIFICACIÓN PREVIA: Solo enviar mensajes si estamos en una página de Live
            if (!isOnTikTokLive()) {
                console.warn('🚫 Mensaje cancelado: No estamos en un Live de TikTok');
                resolve({}); // Resolver con objeto vacío para evitar errores en el código que llama
                return;
            }
            
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
                count: state.contador,
                enTikTok: true,
                enLive: true
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
        if (nuevoEstado || fromChat) {
            // Solo activar si no viene del sistema de chat
            console.log('✨ Activando Auto Tap-Tap');
            const intervalo = parseInt(elementos.selector.value);
            elementos.selector.disabled = true;
            elementos.selector.style.opacity = '0.5';
            
            // Actualizar colores dinámicamente
            actualizarColoresBoton();
            
            // Al activar manualmente, resetear el estado de apagado manual
            state.apagadoManualmente = false;
            
            // Solo iniciar el intervalo si no está pausado por chat
            if (!state.pausadoPorChat) {
                console.log('🚀 Iniciando intervalo de tap-taps');
                presionarL(); // Ejecutar el primer tap-tap inmediatamente
                state.intervalo = safeInterval.create(presionarL, intervalo);
                
                // Notificar al background script sobre el estado activo
                safeRuntimeMessage({ 
                    action: 'started',
                    contador: state.contador,
                    enTikTok: true,
                    enLive: true
                })
                    .catch(error => console.warn('Error al notificar estado:', error));
            } else {
                console.log('⏸️ No se inicia intervalo - pausado por chat');
            }
        } else {
            // PASO 5B: LÓGICA DE DESACTIVACIÓN
            console.log('🛑 Desactivando Auto Tap-Tap');
            elementos.selector.disabled = false;
            elementos.selector.style.opacity = '1';
            
            // Actualizar colores dinámicamente
            actualizarColoresBoton();
            
            // Notificar al background script sobre el estado inactivo
            safeRuntimeMessage({ 
                action: 'stopped',
                enTikTok: true,
                enLive: true
            })
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
     * CONFIGURACIÓN DE EVENT LISTENERS Y SISTEMA DE MENSAJERÍA
     * =============================================================================
     * 
     * Esta función configura todos los event listeners necesarios para la interfaz
     * de usuario y establece el sistema de comunicación con el background script.
     */
    function setupMessageListener() {
        console.log('🔧 Configurando event listeners y sistema de mensajería...');
        
        // CONFIGURAR EVENT LISTENERS DE LA INTERFAZ
        
        // Botón principal de toggle
        elementos.boton.addEventListener('click', () => {
            toggleAutoTapTap();
        });
        
        // Selector de velocidad
        elementos.selector.addEventListener('change', () => {
            const nuevoIntervalo = parseInt(elementos.selector.value);
            // Si está activo, reiniciar con nuevo intervalo
            if (state.activo) {
                if (state.intervalo) {
                    safeInterval.clear(state.intervalo);
                }
                presionarL(); // Ejecutar inmediatamente
                state.intervalo = safeInterval.create(presionarL, nuevoIntervalo);
            }
            
            // Guardar configuración
            safeStorageOperation(() => {
                chrome.storage.local.set({ 
                    intervalo: nuevoIntervalo 
                });
            });
        });
        
        // Botón de reset del contador
        elementos.botonReset.addEventListener('click', () => {
            state.contador = 0;
            actualizarContador();
            safeStorageOperation(() => {
                chrome.storage.local.set({ 
                    totalTapTaps: 0 
                });
            });
        });
        
        // Input de tiempo de reactivación
        elementos.reactivacionInput.addEventListener('change', () => {
            const nuevoTiempo = parseInt(elementos.reactivacionInput.value);
            if (nuevoTiempo >= 10 && nuevoTiempo <= 60) {
                state.tiempoReactivacion = nuevoTiempo;
                safeStorageOperation(() => {
                    chrome.storage.local.set({ 
                        tiempoReactivacion: nuevoTiempo 
                    });
                });
            }
        });
        
        // Botón minimizar
        elementos.botonMinimizar.addEventListener('click', () => {
            const controles = [
                elementos.boton,
                elementos.selector,
                elementos.contadorDiv,
                elementos.botonReset,
                elementos.configDiv,
                elementos.copyrightDiv
            ];
            
            const isMinimized = elementos.boton.style.display === 'none';
            controles.forEach(el => {
                if (el) el.style.display = isMinimized ? 'block' : 'none';
            });
            
            elementos.botonMinimizar.textContent = isMinimized ? '−' : '+';
        });
        
        // CONFIGURAR SISTEMA DE ARRASTRE
        elementos.barraArrastre.addEventListener('mousedown', dragStart);
        elementos.barraArrastre.addEventListener('touchstart', dragStart, { passive: false });
        
        // CONFIGURAR SISTEMA DE MENSAJERÍA CON BACKGROUND SCRIPT
        if (messageListener) {
            chrome.runtime.onMessage.removeListener(messageListener);
        }
        
        messageListener = (request, sender, sendResponse) => {
            try {
                console.log('📨 Mensaje recibido:', request);
                
                switch (request.action) {
                    case 'getStatus':
                        sendResponse({
                            activo: state.activo,
                            contador: state.contador,
                            tiempoReactivacion: state.tiempoReactivacion,
                            pausadoPorChat: state.pausadoPorChat,
                            enTikTok: true,
                            enLive: true
                        });
                        break;
                        
                    case 'toggle':
                        toggleAutoTapTap();
                        sendResponse({ success: true });
                        break;
                        
                    case 'updateReactivationTime':
                        if (request.tiempo && request.tiempo >= 10 && request.tiempo <= 60) {
                            state.tiempoReactivacion = request.tiempo;
                            if (elementos.reactivacionInput) {
                                elementos.reactivacionInput.value = request.tiempo;
                            }
                            sendResponse({ success: true });
                        } else {
                            sendResponse({ error: 'Tiempo inválido' });
                        }
                        break;
                        
                    default:
                        console.log('🤷 Acción no reconocida:', request.action);
                        sendResponse({ error: 'Acción no reconocida' });
                        break;
                }
                
            } catch (error) {
                console.error('Error procesando mensaje:', error);
                sendResponse({ error: 'Error interno del content script' });
            }
            
            return true; // Mantener canal abierto para respuesta asíncrona
        };
        
        chrome.runtime.onMessage.addListener(messageListener);
        console.log('✅ Sistema de mensajería configurado correctamente');
    }
    
    /**
     * FUNCIONES DE ARRASTRE PARA INTERFAZ MÓVIL
     * 
     * Funciones que manejan el arrastre de la ventana flotante.
     */
    function dragStart(e) {
        state.isDragging = true;
        
        if (e.type === 'touchstart') {
            state.initialX = e.touches[0].clientX - state.xOffset;
            state.initialY = e.touches[0].clientY - state.yOffset;
        } else {
            state.initialX = e.clientX - state.xOffset;
            state.initialY = e.clientY - state.yOffset;
        }
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    }
    
    function drag(e) {
        if (!state.isDragging) return;
        
        e.preventDefault();
        
        if (e.type === 'touchmove') {
            state.currentX = e.touches[0].clientX - state.initialX;
            state.currentY = e.touches[0].clientY - state.initialY;
        } else {
            state.currentX = e.clientX - state.initialX;
            state.currentY = e.clientY - state.initialY;
        }
        
        state.xOffset = state.currentX;
        state.yOffset = state.currentY;
        
        elementos.contenedor.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;
    }
    
    function dragEnd() {
        state.isDragging = false;
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchend', dragEnd);
        
        // Guardar posición
        safeStorageOperation(() => {
            chrome.storage.local.set({
                position: {
                    x: state.xOffset,
                    y: state.yOffset
                }
            });
        });
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
                elementos.boton.style.background = '#00f2ea';
                // Actualizar colores dinámicamente
                actualizarColoresBoton();
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
        // Crear div de notificaciones independiente si no existe
        if (!elementos.notificacionChat) {
            elementos.notificacionChat = document.createElement('div');
            elementos.notificacionChat.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 20px;
                z-index: 1000000;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.3s ease;
                text-align: center;
                box-sizing: border-box;
                max-width: 280px;
                word-wrap: break-word;
                transform: translateY(10px);
                pointer-events: none;
            `;
            // Agregar directamente al body para que sea independiente
            document.body.appendChild(elementos.notificacionChat);
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

        // Aplicar estilos según tipo
        Object.assign(elementos.notificacionChat.style, estilos[tipo]);
        elementos.notificacionChat.textContent = mensaje;
        
        // Mostrar con animación de entrada
        elementos.notificacionChat.style.opacity = '1';
        elementos.notificacionChat.style.transform = 'translateY(0)';

        // Ocultar después de 3 segundos con animación de salida
        setTimeout(() => {
            if (elementos.notificacionChat) {
                elementos.notificacionChat.style.opacity = '0';
                elementos.notificacionChat.style.transform = 'translateY(10px)';
            }
        }, 3000);
    }
    
    /**
     * =============================================================================
     * FUNCIÓN PARA LIMPIAR NOTIFICACIONES FLOTANTES
     * =============================================================================
     * 
     * Remueve las notificaciones flotantes independientes del DOM para evitar
     * elementos huérfanos cuando la extensión se desactiva o recarga.
     * 
     * @description Limpia notificaciones de chat y cuenta regresiva del DOM
     */
    function limpiarNotificacionesFlotantes() {
        // Limpiar notificación de chat
        if (elementos.notificacionChat && elementos.notificacionChat.parentNode) {
            elementos.notificacionChat.parentNode.removeChild(elementos.notificacionChat);
            elementos.notificacionChat = null;
        }
        
        // Limpiar notificación de cuenta regresiva
        if (elementos.cuentaRegresivaDiv && elementos.cuentaRegresivaDiv.parentNode) {
            elementos.cuentaRegresivaDiv.parentNode.removeChild(elementos.cuentaRegresivaDiv);
            elementos.cuentaRegresivaDiv = null;
        }
    }

    /**
     * =============================================================================
     * SISTEMA DE DETECCIÓN DE CONTEXTO PARA BADGE CONTEXTUAL
     * =============================================================================
     * 
     * Sistema que detecta el contexto actual del usuario para mostrar el badge
     * apropiado según dónde se encuentre.
     */
    
    /**
     * DETECTAR SI ESTAMOS EN TIKTOK
     * 
     * Verifica si la página actual pertenece al dominio de TikTok.
     * 
     * @returns {boolean} - true si estamos en TikTok, false en caso contrario
     */
    function isOnTikTok() {
        return window.location.hostname.includes('tiktok.com');
    }
    
    /**
     * DETECTAR SI ESTAMOS EN UN LIVE DE TIKTOK
     * 
     * Verifica si la página actual es una transmisión en vivo de TikTok.
     * 
     * @returns {boolean} - true si estamos en un Live, false en caso contrario
     */
    function isOnTikTokLive() {
        if (!isOnTikTok()) return false;
        
        const pathname = window.location.pathname;
        const livePattern = /^\/@[^\/]+\/live(?:\/[^?]*)?$/;
        return livePattern.test(pathname);
    }
    
    /**
     * OBTENER CONTEXTO ACTUAL
     * 
     * Función helper que retorna el contexto actual del usuario.
     * 
     * @returns {Object} - Objeto con enTikTok y enLive
     */
    function getCurrentContext() {
        const enTikTok = isOnTikTok();
        const enLive = enTikTok && isOnTikTokLive();
        
        return { enTikTok, enLive };
    }
    
    /**
     * NOTIFICAR CAMBIO DE CONTEXTO AL BACKGROUND
     * 
     * Envía un mensaje al background script para actualizar el contexto
     * y cambiar el badge apropiadamente.
     * 
     * @param {boolean} enTikTok - Si estamos en TikTok
     * @param {boolean} enLive - Si estamos en Live
     */
    function notifyContextChange(enTikTok, enLive) {
        console.log('🔄 Notificando cambio de contexto:', { enTikTok, enLive });
        
        safeRuntimeMessage({
            action: 'updateContext',
            enTikTok: enTikTok,
            enLive: enLive
        }).catch(error => {
            console.warn('Error al notificar cambio de contexto:', error);
        });
    }

    /**
     * =============================================================================
     * FUNCIÓN HELPER PARA ACTUALIZAR COLORES DINÁMICAMENTE
     * =============================================================================
     * 
     * Actualiza los colores del botón y efectos hover según el estado actual
     * para mantener consistencia visual con los colores de TikTok.
     * 
     * COLORES UTILIZADOS:
     * - Estado OFF (desactivado): #ff0050 (magenta de TikTok)
     * - Estado ON (activado): #00f2ea (cyan de TikTok)
     * 
     * @description Actualiza colores del botón según estado activo/inactivo
     */
    function actualizarColoresBoton() {
        if (!elementos.boton) return;
        
        const isActive = state.activo && !state.pausadoPorChat;
        
        if (isActive) {
            // Estado activado - cyan de TikTok
            elementos.boton.style.background = '#00f2ea';
            elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
            
            // Actualizar eventos hover para estado activo
            elementos.boton.onmouseenter = function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 12px rgba(0, 242, 234, 0.3)';
            };
        } else {
            // Estado desactivado - magenta de TikTok  
            elementos.boton.style.background = '#ff0050';
            elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
            
            // Actualizar eventos hover para estado inactivo
            elementos.boton.onmouseenter = function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 12px rgba(255, 0, 80, 0.3)';
            };
        }
        
        // El evento mouseleave es el mismo para ambos estados
        elementos.boton.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        };
    }

    /**
     * =============================================================================
     * FUNCIÓN DE CREACIÓN DE INTERFAZ FLOTANTE
     * =============================================================================
     * 
     * Crea dinámicamente todos los elementos DOM necesarios para la interfaz
     * flotante de usuario. Construye una ventana draggable con controles
     * completos para la automatización.
     * 
     * ELEMENTOS CREADOS:
     * - Contenedor principal draggable
     * - Barra de arrastre con título y botón minimizar
     * - Botón principal de toggle ON/OFF
     * - Selector de velocidad/intervalo
     * - Display de contador de tap-taps
     * - Botón de reset del contador
     * - Configuración de tiempo de reactivación
     * - Información de copyright
     * 
     * @description Construye la interfaz visual completa de la extensión
     */
    function crearInterfaz() {
        // CREAR CONTENEDOR PRINCIPAL
        elementos.contenedor = document.createElement('div');
        elementos.contenedor.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 280px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            user-select: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        // CREAR BARRA DE ARRASTRE
        elementos.barraArrastre = document.createElement('div');
        elementos.barraArrastre.style.cssText = `
            background: linear-gradient(135deg, #ff0050, #ff3366);
            color: white;
            padding: 12px 15px;
            border-radius: 12px 12px 0 0;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
        `;
        elementos.barraArrastre.innerHTML = `
            <span>❤️ Auto Tap-Tap TikTok</span>
        `;
        
        // CREAR BOTÓN MINIMIZAR
        elementos.botonMinimizar = document.createElement('button');
        elementos.botonMinimizar.textContent = '−';
        elementos.botonMinimizar.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        elementos.barraArrastre.appendChild(elementos.botonMinimizar);
        
        // CREAR CONTENIDO PRINCIPAL
        const contenidoPrincipal = document.createElement('div');
        contenidoPrincipal.style.cssText = `
            padding: 15px;
        `;
        
        // CREAR BOTÓN PRINCIPAL DE TOGGLE
        elementos.boton = document.createElement('button');
        elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
        elementos.boton.style.cssText = `
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: #ff0050;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        `;
        
        // CREAR SELECTOR DE VELOCIDAD
        const selectorContainer = document.createElement('div');
        selectorContainer.style.cssText = `
            margin-bottom: 15px;
        `;
        
        const selectorLabel = document.createElement('label');
        selectorLabel.textContent = '⚡ Velocidad:';
        selectorLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #00f2ea;
        `;
        
        elementos.selector = document.createElement('select');
        elementos.selector.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
        `;
        
        // Poblar selector con opciones de velocidad
        config.intervalos.forEach(opcion => {
            const option = document.createElement('option');
            option.value = opcion.valor;
            option.textContent = opcion.texto;
            option.style.cssText = `
                background: #333;
                color: white;
            `;
            elementos.selector.appendChild(option);
        });
        elementos.selector.value = config.defaultInterval;
        
        selectorContainer.appendChild(selectorLabel);
        selectorContainer.appendChild(elementos.selector);
        
        // CREAR DISPLAY DEL CONTADOR
        elementos.contadorDiv = document.createElement('div');
        elementos.contadorDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const contadorLabel = document.createElement('div');
        contadorLabel.textContent = '📊 Tap-Taps en esta sesión:';
        contadorLabel.style.cssText = `
            font-size: 12px;
            color: #ccc;
            margin-bottom: 5px;
        `;
        
        elementos.contador = document.createElement('div');
        elementos.contador.textContent = '0';
        elementos.contador.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            color: #00f2ea;
        `;
        
        elementos.contadorDiv.appendChild(contadorLabel);
        elementos.contadorDiv.appendChild(elementos.contador);
        
        // CREAR BOTÓN DE RESET
        elementos.botonReset = document.createElement('button');
        elementos.botonReset.textContent = '🔄 Reset Contador';
        elementos.botonReset.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        `;
        
        // CREAR CONFIGURACIÓN DE REACTIVACIÓN
        elementos.configDiv = document.createElement('div');
        elementos.configDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const configLabel = document.createElement('div');
        configLabel.textContent = '⚙️ Tiempo de reactivación (chat):';
        configLabel.style.cssText = `
            font-size: 12px;
            color: #ccc;
            margin-bottom: 8px;
        `;
        
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        elementos.reactivacionInput = document.createElement('input');
        elementos.reactivacionInput.type = 'number';
        elementos.reactivacionInput.min = '10';
        elementos.reactivacionInput.max = '60';
        elementos.reactivacionInput.value = '10';
        elementos.reactivacionInput.style.cssText = `
            flex: 1;
            padding: 6px 8px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
        `;
        
        const unidadLabel = document.createElement('span');
        unidadLabel.textContent = 'segundos';
        unidadLabel.style.cssText = `
            font-size: 12px;
            color: #ccc;
        `;
        
        inputContainer.appendChild(elementos.reactivacionInput);
        inputContainer.appendChild(unidadLabel);
        elementos.configDiv.appendChild(configLabel);
        elementos.configDiv.appendChild(inputContainer);
        
        // CREAR INFORMACIÓN DE COPYRIGHT
        elementos.copyrightDiv = document.createElement('div');
        elementos.copyrightDiv.style.cssText = `
            text-align: center;
            font-size: 11px;
            color: #666;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;
        elementos.copyrightDiv.innerHTML = `
            © 2025 <a href="https://newagecoding.org/" target="_blank" style="color: #00f2ea; text-decoration: none;">New Age Coding</a><br>
            Por <a href="https://github.com/EmerickVar" target="_blank" style="color: #00f2ea; text-decoration: none;">@EmerickVar</a>
        `;
        
        // ENSAMBLAR TODOS LOS ELEMENTOS
        contenidoPrincipal.appendChild(elementos.boton);
        contenidoPrincipal.appendChild(selectorContainer);
        contenidoPrincipal.appendChild(elementos.contadorDiv);
        contenidoPrincipal.appendChild(elementos.botonReset);
        contenidoPrincipal.appendChild(elementos.configDiv);
        contenidoPrincipal.appendChild(elementos.copyrightDiv);
        
        elementos.contenedor.appendChild(elementos.barraArrastre);
        elementos.contenedor.appendChild(contenidoPrincipal);
        
        // INSERTAR EN EL DOM
        document.body.appendChild(elementos.contenedor);
        
        // APLICAR EFECTOS HOVER DINÁMICOS
        actualizarColoresBoton();
        
        elementos.botonReset.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        elementos.botonReset.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
        });
    }

    /**
     * =============================================================================

     * FUNCIÓN PRINCIPAL DE INICIALIZACIÓN - COORDINA TODO EL PROCESO DE ARRANQUE
     * =============================================================================
     * 
     * Esta función orquesta el proceso completo de inicialización de la extensión,
     * asegurando que todos los componentes se configuren correctamente antes de
     * que el usuario pueda interactuar con la interfaz.
     * 
     * FASES DE INICIALIZACIÓN:
     * 1. CREACIÓN DE INTERFAZ: Construye y posiciona la UI flotante
     * 2. RESTAURACIÓN DE ESTADO: Carga configuraciones persistentes
     * 3. CONFIGURACIÓN DE EVENTOS: Establece todos los event listeners
     * 4. SISTEMA DE CHAT: Activa detección de interacciones de chat
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
        setupMessageListener();
        
        // FASE 4: Activar sistema de detección de interacciones de chat
        manejarInteraccionChat();
        
        // FASE 5: Sistema de detección de navegación fuera del live
        setupNavigationDetection();
        
        // FASE 6: Notificar contexto inicial al background
        const { enTikTok, enLive } = getCurrentContext();
        console.log('🎯 Inicializando con contexto:', { enTikTok, enLive });
        notifyContextChange(enTikTok, enLive);
    }
    
    /**
     * SISTEMA DE DETECCIÓN DE NAVEGACIÓN
     * 
     * Implementa un sistema que detecta cuando el usuario navega fuera de una página de live
     * y limpia automáticamente todos los recursos de la extensión para evitar intentos
     * innecesarios de reconexión.
     * 
     * FUNCIONALIDADES:
     * - Detecta cambios de URL usando MutationObserver
     * - Monitorea eventos de navegación (popstate, beforeunload)
     * - Limpia recursos cuando se sale del live
     * - Previene reconexiones innecesarias
     */
    function setupNavigationDetection() {
        console.log('🔍 Configurando sistema de detección de navegación...');
        
        let lastUrl = window.location.href;
        
        /**
         * FUNCIÓN DE LIMPIEZA COMPLETA DE RECURSOS
         * 
         * Limpia todos los recursos de la extensión cuando se detecta
         * que el usuario ya no está en un live de TikTok.
         */
        const cleanupExtensionResources = () => {
            console.log('🧹 Limpieza completa de recursos - No estamos en Live');
            
            // Detener automatización
            if (state.intervalo) {
                safeInterval.clear(state.intervalo);
                state.intervalo = null;
            }
            
            // Limpiar todos los intervalos seguros
            safeInterval.clearAll();
            
            // Limpiar timers de chat
            if (state.chatTimeout) {
                clearTimeout(state.chatTimeout);
                state.chatTimeout = null;
            }
            
            // Limpiar observer de chat si existe
            if (state.chatObserver && state.chatObserver.cleanup) {
                state.chatObserver.cleanup();
            }
            
            // Limpiar eventos de chat si existe la función
            if (state.chatCleanup) {
                state.chatCleanup();
            }
            
            // Limpiar notificaciones flotantes independientes
            limpiarNotificacionesFlotantes();
            
            // Resetear estados relacionados con automatización
            state.activo = false;
            state.pausadoPorChat = false;
            
            // Actualizar interfaz para mostrar estado inactivo
            if (elementos.boton) {
                // Actualizar colores dinámicamente
                actualizarColoresBoton();
            }
            if (elementos.selector) {
                elementos.selector.disabled = false;
                elementos.selector.style.opacity = '1';
            }
            
            // Notificar al background script que se detuvo
            safeRuntimeMessage({ 
                action: 'stopped',
                enTikTok: true,
                enLive: false                    // Ya no estamos en Live
            })
                .catch(error => console.warn('Error al notificar estado:', error));
        };
        
        /**
         * VERIFICADOR DE CAMBIOS DE URL Y CONTEXTO
         * 
         * Verifica si la URL ha cambiado y actualiza el contexto apropiadamente.
         * También maneja la detección de cambios entre TikTok/no-TikTok y Live/no-Live.
         */
        const checkUrlChange = () => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log('🔄 Cambio de URL detectado:', {
                    anterior: lastUrl,
                    actual: currentUrl
                });
                lastUrl = currentUrl;
                
                // Obtener contexto actual
                const { enTikTok, enLive } = getCurrentContext();
                console.log('🎯 Contexto actual:', { enTikTok, enLive });
                
                // Notificar cambio de contexto al background
                notifyContextChange(enTikTok, enLive);
                
                // Si ya no estamos en un live, limpiar recursos
                if (!enLive) {
                    cleanupExtensionResources();
                }
            }
        };
        
        /**
         * MUTATION OBSERVER PARA DETECTAR CAMBIOS DE URL EN SPA
         * 
         * TikTok es una Single Page Application, por lo que los cambios de página
         * no siempre disparan eventos de navegación tradicionales.
         */
        const urlObserver = new MutationObserver(() => {
            // Usar setTimeout para evitar ejecutar demasiado frecuentemente
            setTimeout(checkUrlChange, 100);
        });
        
        // Configurar el observer para detectar cambios en el título de la página
        // que suelen ocurrir cuando TikTok cambia de página
        urlObserver.observe(document, {
            subtree: true,
            childList: true
        });
        
        /**
         * EVENT LISTENERS PARA EVENTOS DE NAVEGACIÓN
         * 
         * Detecta navegación tradicional y eventos del navegador.
         */
        
        // Detectar navegación con botones del navegador (atrás/adelante)
        window.addEventListener('popstate', () => {
            console.log('📍 Evento popstate detectado');
            setTimeout(checkUrlChange, 100);
        });
        
        // Detectar cuando el usuario va a salir de la página
        window.addEventListener('beforeunload', () => {
            console.log('🚪 Página being unloaded');
            cleanupExtensionResources();
        });
        
        // Detectar cambios de visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('👁️ Página oculta');
            } else {
                console.log('👁️ Página visible, verificando ubicación...');
                setTimeout(checkUrlChange, 500);
            }
        });
        
        /**
         * VERIFICACIÓN PERIÓDICA COMO RESPALDO
         * 
         * Como medida adicional de seguridad, verifica periódicamente
         * que seguimos en un live de TikTok.
         */
        const navigationCheckInterval = setInterval(() => {
            if (!isOnTikTokLive()) {
                console.log('⏰ Verificación periódica: No estamos en Live');
                cleanupExtensionResources();
                clearInterval(navigationCheckInterval);
            }
        }, 10000); // Verificar cada 10 segundos
        
        // Guardar referencia para limpieza posterior
        state.navigationCheckInterval = navigationCheckInterval;
        state.urlObserver = urlObserver;
        
        console.log('✅ Sistema de detección de navegación configurado correctamente');
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

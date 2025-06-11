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
        apagadoManualmente: false, // Indica si el usuario apagó manualmente (no reactivar automáticamente)
        
        // SISTEMA DE NOTIFICACIONES DE CUENTA REGRESIVA
        notificacionCuentaRegresiva: null, // Referencia a la notificación de cuenta regresiva activa
        limpiarCuentaRegresiva: null,       // Función para limpiar cuenta regresiva
        
        // MODO HUMANO - VARIABLES ALEATORIAS Y TIMERS
        modoHumano: {
            activo: false,              // Indica si el modo humano está activo
            frecuenciaSesion: 0,        // Duración de sesión activa (2750-7835 ms)
            frecuenciaTapTap: 0,        // Velocidad de tap-tap durante sesión (200-485 ms)
            cooldownSesion: 0,          // Tiempo de cooldown entre sesiones (3565-9295 ms)
            enSesion: false,            // Indica si está en sesión activa o en cooldown
            tiempoSesionRestante: 0,    // Tiempo restante de la sesión actual
            tiempoCooldownRestante: 0,  // Tiempo restante del cooldown actual
            pausadoPorChat: false,      // Indica si fue pausado por chat en modo humano
            timerSesion: null,          // Timer para duración de sesión
            timerCooldown: null,        // Timer para cooldown entre sesiones
            inicioSesion: null,         // Timestamp de inicio de sesión (para cálculos precisos)
            inicioCooldown: null        // Timestamp de inicio de cooldown (para cálculos precisos)
        }
    };
    
    /**
     * =============================================================================
     * TIMERS GLOBALES PARA GESTIÓN DE CUENTA REGRESIVA Y CHAT
     * =============================================================================
     * 
     * Objeto global que contiene todos los timers relacionados con el sistema
     * de chat y cuenta regresiva para evitar problemas de scope.
     */
    const timers = {
        typing: null,
        chat: null,
        countdown: null,
        cuentaRegresiva: null,
        // Timers específicos para modo humano
        modoHumanoSesion: null,
        modoHumanoCooldown: null,
        cleanupAll() {
            console.log('🧹 Ejecutando cleanup completo de timers...');
            Object.entries(this).forEach(([key, timer]) => {
                if (typeof timer === 'number') {
                    clearTimeout(timer);
                    clearInterval(timer);
                    this[key] = null;
                }
            });
            
            // Limpiar modo humano si está activo
            if (state.modoHumano && state.modoHumano.activo) {
                console.log('🧹 Limpiando modo humano durante cleanup de timers');
                // Limpiar timers específicos del modo humano
                if (state.modoHumano.timerSesion) {
                    clearTimeout(state.modoHumano.timerSesion);
                    state.modoHumano.timerSesion = null;
                }
                if (state.modoHumano.timerCooldown) {
                    clearTimeout(state.modoHumano.timerCooldown);
                    state.modoHumano.timerCooldown = null;
                }
            }
            
            // También limpiar notificaciones de cuenta regresiva si existen
            if (state.limpiarCuentaRegresiva && typeof state.limpiarCuentaRegresiva === 'function') {
                try {
                    state.limpiarCuentaRegresiva();
                } catch (error) {
                    console.warn('Error en cleanup de cuenta regresiva:', error);
                }
            }
            
            // Limpieza defensiva adicional de notificaciones persistentes
            try {
                if (state.notificacionCuentaRegresiva) {
                    removerNotificacion(state.notificacionCuentaRegresiva, true);
                    state.notificacionCuentaRegresiva = null;
                }
            } catch (error) {
                console.warn('Error en cleanup defensivo:', error);
            }
        }
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
            { valor: 0, texto: 'Modo humano | [Variable]' },           // Modo humano con valores aleatorios
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
                    }).catch(error => console.warn('Error al notificar inicio:', error));
                } else {
                    safeRuntimeMessage({ 
                        action: 'stopped',
                        enTikTok: true,
                        enLive: true
                    }).catch(error => console.warn('Error al notificar parada:', error));
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
                                console.warn('🚨 Background script respondió con error:', response.error);
                                console.warn('Mensaje original:', message);
                                
                                // Para errores de "Acción no reconocida", resolver en lugar de rechazar
                                // para evitar excepciones no capturadas
                                if (response.error.includes('Acción no reconocida')) {
                                    console.warn('⚠️ Resolviendo error de acción no reconocida silenciosamente');
                                    resolve({ error: response.error, handled: true });
                                    return;
                                }
                                
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
        
        // PASO 4
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
     * SISTEMA DE MODO HUMANO - GESTIÓN DE VARIABLES ALEATORIAS Y CICLOS
     * =============================================================================
     */
    
    /**
     * GENERAR VARIABLES ALEATORIAS PARA MODO HUMANO
     * 
     * Genera valores aleatorios dentro de los rangos especificados para
     * simular comportamiento humano más realista.
     * 
     * RANGOS:
     * - frecuenciaSesion: 27500-78350 ms (duración de sesión activa)
     * - frecuenciaTapTap: 200-485 ms (velocidad durante sesión)
     * - cooldownSesion: 3565-9295 ms (tiempo entre sesiones)
     */
    function generarVariablesModoHumano() {
        console.log('🎲 Generando nuevas variables aleatorias para modo humano...');
        
        // Generar valores aleatorios dentro de los rangos especificados
        state.modoHumano.frecuenciaSesion = Math.floor(Math.random() * (78350 - 27500 + 1)) + 27500;
        state.modoHumano.frecuenciaTapTap = Math.floor(Math.random() * (485 - 200 + 1)) + 200;
        state.modoHumano.cooldownSesion = Math.floor(Math.random() * (9295 - 3565 + 1)) + 3565;
        
        console.log('🎯 Variables generadas:', {
            frecuenciaSesion: `${state.modoHumano.frecuenciaSesion}ms (${(state.modoHumano.frecuenciaSesion / 1000).toFixed(1)}s)`,
            frecuenciaTapTap: `${state.modoHumano.frecuenciaTapTap}ms`,
            cooldownSesion: `${state.modoHumano.cooldownSesion}ms (${(state.modoHumano.cooldownSesion / 1000).toFixed(1)}s)`
        });
        
        // Actualizar texto del selector con las nuevas variables
        actualizarTextoSelectorModoHumano();
    }
    
    /**
     * INICIAR SESIÓN ACTIVA EN MODO HUMANO
     * 
     * Inicia una sesión de tap-taps con la frecuencia calculada
     * y programa el fin de la sesión.
     */
    function iniciarSesionModoHumano() {
        console.log('🚀 Iniciando sesión activa en modo humano...');
        console.log(`⏱️ Duración de sesión: ${state.modoHumano.frecuenciaSesion}ms (${(state.modoHumano.frecuenciaSesion / 1000).toFixed(1)}s)`);
        console.log(`💓 Velocidad tap-tap: ${state.modoHumano.frecuenciaTapTap}ms`);
        
        state.modoHumano.enSesion = true;
        state.modoHumano.tiempoSesionRestante = state.modoHumano.frecuenciaSesion;
        state.modoHumano.inicioSesion = Date.now(); // Registrar timestamp de inicio
        
        // Iniciar tap-taps con la frecuencia calculada
        presionarL(); // Ejecutar inmediatamente
        state.intervalo = safeInterval.create(presionarL, state.modoHumano.frecuenciaTapTap);
        
        // Programar el fin de la sesión
        timers.modoHumanoSesion = setTimeout(() => {
            console.log('⏸️ Sesión de modo humano completada, iniciando cooldown...');
            finalizarSesionModoHumano();
        }, state.modoHumano.frecuenciaSesion);
        
        // Notificación de inicio de sesión
        agregarNotificacion(
            `🤖 Modo Humano: Sesión activa por ${(state.modoHumano.frecuenciaSesion / 1000).toFixed(1)}s`, 
            'info', 
            3000
        );
    }
    
    /**
     * FINALIZAR SESIÓN Y COMENZAR COOLDOWN
     * 
     * Detiene los tap-taps e inicia el período de cooldown
     * antes de la siguiente sesión.
     */
    function finalizarSesionModoHumano() {
        console.log('🛑 Finalizando sesión de modo humano...');
        
        // Detener tap-taps
        if (state.intervalo) {
            safeInterval.clear(state.intervalo);
            state.intervalo = null;
        }
        
        // Limpiar timer de sesión
        if (timers.modoHumanoSesion) {
            clearTimeout(timers.modoHumanoSesion);
            timers.modoHumanoSesion = null;
        }
        
        state.modoHumano.enSesion = false;
        state.modoHumano.tiempoCooldownRestante = state.modoHumano.cooldownSesion;
        state.modoHumano.inicioCooldown = Date.now(); // Registrar timestamp de inicio del cooldown
        
        console.log(`😴 Iniciando cooldown por ${state.modoHumano.cooldownSesion}ms (${(state.modoHumano.cooldownSesion / 1000).toFixed(1)}s)`);
        
        // Programar el reinicio de la siguiente sesión
        timers.modoHumanoCooldown = setTimeout(() => {
            console.log('🔄 Cooldown completado, regenerando variables...');
            if (state.modoHumano.activo && !state.modoHumano.pausadoPorChat && !state.apagadoManualmente) {
                // Regenerar variables y comenzar nueva sesión
                generarVariablesModoHumano();
                iniciarSesionModoHumano();
            }
        }, state.modoHumano.cooldownSesion);
        
        // Notificación de cooldown
        agregarNotificacion(
            `😴 Modo Humano: Cooldown por ${(state.modoHumano.cooldownSesion / 1000).toFixed(1)}s`, 
            'warning', 
            3000
        );
    }
    
    /**
     * PAUSAR MODO HUMANO POR CHAT
     * 
     * Pausa los timers del modo humano sin regenerar variables,
     * preservando el estado actual para reanudar después.
     */
    function pausarModoHumanoPorChat() {
        console.log('💬 Pausando modo humano por interacción con chat...');
        
        state.modoHumano.pausadoPorChat = true;
        
        // Actualizar tiempos restantes antes de pausar
        actualizarTiemposRestantesModoHumano();
        
        // Pausar tap-taps si está en sesión activa
        if (state.modoHumano.enSesion && state.intervalo) {
            safeInterval.clear(state.intervalo);
            state.intervalo = null;
        }
        
        // Pausar timers pero conservar tiempo restante
        if (timers.modoHumanoSesion) {
            clearTimeout(timers.modoHumanoSesion);
            timers.modoHumanoSesion = null;
        }
        
        if (timers.modoHumanoCooldown) {
            clearTimeout(timers.modoHumanoCooldown);
            timers.modoHumanoCooldown = null;
        }
        
        console.log('⏸️ Timers de modo humano pausados, variables conservadas');
    }
    
    /**
     * REANUDAR MODO HUMANO DESPUÉS DEL CHAT
     * 
     * Reanuda los timers del modo humano desde donde se pausaron,
     * sin regenerar las variables.
     */
    function reanudarModoHumanoDesdeChat() {
        console.log('🔄 Reanudando modo humano desde pausa de chat...');
        
        state.modoHumano.pausadoPorChat = false;
        
        if (state.modoHumano.enSesion) {
            // Reanudar sesión activa
            console.log(`▶️ Reanudando sesión con ${state.modoHumano.tiempoSesionRestante}ms restantes`);
            
            // Reanudar tap-taps
            presionarL(); // Ejecutar inmediatamente
            state.intervalo = safeInterval.create(presionarL, state.modoHumano.frecuenciaTapTap);
            
            // Reanudar timer de sesión con tiempo restante
            timers.modoHumanoSesion = setTimeout(() => {
                console.log('⏸️ Sesión de modo humano completada tras reanudar, iniciando cooldown...');
                finalizarSesionModoHumano();
            }, state.modoHumano.tiempoSesionRestante);
            
        } else {
            // Reanudar cooldown
            console.log(`😴 Reanudando cooldown con ${state.modoHumano.tiempoCooldownRestante}ms restantes`);
            
            // Reanudar timer de cooldown con tiempo restante
            timers.modoHumanoCooldown = setTimeout(() => {
                console.log('🔄 Cooldown completado tras reanudar, regenerando variables...');
                if (state.modoHumano.activo && !state.modoHumano.pausadoPorChat && !state.apagadoManualmente) {
                    generarVariablesModoHumano();
                    iniciarSesionModoHumano();
                }
            }, state.modoHumano.tiempoCooldownRestante);
        }
        
        agregarNotificacion('🤖 Modo Humano reanudado desde chat', 'success', 3000);
    }
    
    /**
     * ACTUALIZAR TIEMPOS RESTANTES EN MODO HUMANO
     * 
     * Función helper que calcula y actualiza los tiempos restantes
     * de sesión o cooldown para una pausa más precisa.
     */
    function actualizarTiemposRestantesModoHumano() {
        if (!state.modoHumano.activo) return;
        
        const ahora = Date.now();
        
        if (state.modoHumano.enSesion && state.modoHumano.inicioSesion) {
            const tiempoTranscurrido = ahora - state.modoHumano.inicioSesion;
            state.modoHumano.tiempoSesionRestante = Math.max(0, state.modoHumano.frecuenciaSesion - tiempoTranscurrido);
            console.log(`⏱️ Tiempo de sesión restante: ${state.modoHumano.tiempoSesionRestante}ms`);
        } else if (!state.modoHumano.enSesion && state.modoHumano.inicioCooldown) {
            const tiempoTranscurrido = ahora - state.modoHumano.inicioCooldown;
            state.modoHumano.tiempoCooldownRestante = Math.max(0, state.modoHumano.cooldownSesion - tiempoTranscurrido);
            console.log(`⏱️ Tiempo de cooldown restante: ${state.modoHumano.tiempoCooldownRestante}ms`);
        }
    }
    
    /**
     * ACTUALIZAR TEXTO DINÁMICO DEL SELECTOR PARA MODO HUMANO
     * 
     * Actualiza el texto del selector de velocidad para mostrar las variables
     * actuales del modo humano cuando está activo.
     */
    function actualizarTextoSelectorModoHumano() {
        if (!elementos.selector) return;
        
        const opcionModoHumano = elementos.selector.querySelector('option[value="0"]');
        if (!opcionModoHumano) return;
        
        if (state.modoHumano.activo) {
            // Mostrar variables actuales
            const sesionS = (state.modoHumano.frecuenciaSesion / 1000).toFixed(1);
            const cooldownS = (state.modoHumano.cooldownSesion / 1000).toFixed(1);
            const tapMs = state.modoHumano.frecuenciaTapTap;
            
            opcionModoHumano.textContent = `Modo humano | Sesión:${sesionS}s Tap:${tapMs}ms Cooldown:${cooldownS}s`;
        } else {
            // Mostrar texto por defecto
            opcionModoHumano.textContent = 'Modo humano | [Variable]';
        }
    }
    
    /**
     * LIMPIAR COMPLETAMENTE EL MODO HUMANO
     * 
     * Limpia todos los timers y resetea todas las variables
     * del modo humano. Se usa cuando se desactiva manualmente.
     */
    function limpiarModoHumano() {
        console.log('🧹 Limpiando completamente el modo humano...');
        
        // Limpiar timers
        if (timers.modoHumanoSesion) {
            clearTimeout(timers.modoHumanoSesion);
            timers.modoHumanoSesion = null;
        }
        
        if (timers.modoHumanoCooldown) {
            clearTimeout(timers.modoHumanoCooldown);
            timers.modoHumanoCooldown = null;
        }
        
        // Resetear variables
        state.modoHumano.activo = false;
        state.modoHumano.frecuenciaSesion = 0;
        state.modoHumano.frecuenciaTapTap = 0;
        state.modoHumano.cooldownSesion = 0;
        state.modoHumano.enSesion = false;
        state.modoHumano.tiempoSesionRestante = 0;
        state.modoHumano.tiempoCooldownRestante = 0;
        state.modoHumano.pausadoPorChat = false;
        state.modoHumano.inicioSesion = null;
        state.modoHumano.inicioCooldown = null;
        
        // Restaurar texto original del selector
        actualizarTextoSelectorModoHumano();
        
        console.log('✅ Modo humano completamente limpiado');
    }
    
    /**
     * =============================================================================
     * FUNCIONES DE PAUSA Y REACTIVACIÓN CON INTEGRACIÓN DE MODO HUMANO
     * =============================================================================
     */

    /**
     * PAUSAR AUTO TAP-TAP POR INTERACCIÓN CON CHAT
     * 
     * Pausa el sistema cuando el usuario interactúa con el chat.
     * Integra soporte para modo humano pausando los timers específicos.
     * 
     * @returns {boolean} - true si se pausó exitosamente, false si no era necesario
     */
    function pausarPorChat() {
        console.log('💬 Pausando por interacción con chat...');
        
        // Verificar que el sistema esté activo
        if (!state.activo || state.pausadoPorChat) {
            console.log('⚠️ Sistema ya pausado o inactivo');
            return false;
        }
        
        // Marcar como pausado por chat
        state.pausadoPorChat = true;
        
        // PAUSA ESPECÍFICA PARA MODO HUMANO
        if (state.modoHumano.activo) {
            console.log('🤖 Pausando modo humano por chat...');
            pausarModoHumanoPorChat();
        } else {
            // PAUSA PARA MODO NORMAL
            console.log('⏸️ Pausando modo normal por chat...');
            if (state.intervalo) {
                safeInterval.clear(state.intervalo);
                state.intervalo = null;
            }
        }
        
        // Notificar al background script
        safeRuntimeMessage({
            action: 'paused_by_chat',
            enTikTok: true,
            enLive: true
        }).catch(error => console.warn('Error al notificar pausa por chat:', error));
        
        console.log('✅ Pausado exitosamente por chat');
        return true;
    }

    /**
     * REACTIVAR AUTO TAP-TAP DESPUÉS DE PAUSA POR CHAT
     * 
     * Reactiva el sistema después de una pausa por chat.
     * Integra soporte para modo humano reanudando desde donde se pausó.
     * 
     * @param {boolean} fromManual - Si la reactivación es manual o automática
     * @returns {boolean} - true si se reactivó exitosamente, false si no era necesario
     */
    function reactivarAutoTapTap(fromManual = false) {
        console.log('🔄 Reactivando Auto Tap-Tap...', { fromManual });
        
        // Verificar que esté pausado por chat
        if (!state.pausadoPorChat) {
            console.log('⚠️ No estaba pausado por chat');
            return false;
        }
        
        // Verificar que no esté apagado manualmente
        if (state.apagadoManualmente) {
            console.log('⚠️ Está apagado manualmente, no reactivar');
            return false;
        }
        
        // Marcar como no pausado por chat
        state.pausadoPorChat = false;
        
        // REACTIVACIÓN ESPECÍFICA PARA MODO HUMANO
        if (state.modoHumano.activo) {
            console.log('🤖 Reanudando modo humano desde chat...');
            reanudarModoHumanoDesdeChat();
        } else {
            // REACTIVACIÓN PARA MODO NORMAL
            console.log('▶️ Reanudando modo normal desde chat...');
            const intervalo = parseInt(elementos.selector.value);
            if (intervalo > 0) {
                presionarL(); // Ejecutar inmediatamente
                state.intervalo = safeInterval.create(presionarL, intervalo);
            }
        }
        
        // Actualizar colores del botón
        actualizarColoresBoton();
        
        // Notificar al background script
        safeRuntimeMessage({
            action: 'reactivated_from_chat',
            contador: state.contador,
            enTikTok: true,
            enLive: true
        }).catch(error => console.warn('Error al notificar reactivación:', error));
        
        console.log('✅ Reactivado exitosamente desde chat');
        return true;
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
        if (nuevoEstado) {
            console.log('✨ Activando Auto Tap-Tap');
            const intervalo = parseInt(elementos.selector.value);
            elementos.selector.disabled = true;
            elementos.selector.style.opacity = '0.5';
            
            // Actualizar colores dinámicamente
            actualizarColoresBoton();
            
            // Al activar manualmente, resetear el estado de apagado manual y pausa por chat
            state.apagadoManualmente = false;
            
            // Si es activación manual y estaba pausado por chat, limpiar ese estado
            if (!fromChat && state.pausadoPorChat) {
                console.log('🔄 Reactivación manual desde pausa por chat');
                state.pausadoPorChat = false;
                // Limpiar timers de chat si existen
                timers.cleanupAll();
                
                // Limpiar específicamente cualquier cuenta regresiva activa
                if (state.limpiarCuentaRegresiva && typeof state.limpiarCuentaRegresiva === 'function') {
                    state.limpiarCuentaRegresiva();
                }
                
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
            }
            
            // Iniciar intervalo si no está pausado por chat
            if (!state.pausadoPorChat) {
                // DETECTAR Y ACTIVAR MODO HUMANO
                if (intervalo === 0) {
                    console.log('🤖 Activando Modo Humano...');
                    state.modoHumano.activo = true;
                    generarVariablesModoHumano();
                    iniciarSesionModoHumano();
                    
                    // Mostrar notificación especial para modo humano
                    agregarNotificacion('🤖 Modo Humano activado con variables aleatorias', 'success', 4000);
                } else {
                    // Modo normal
                    console.log('🚀 Iniciando intervalo de tap-taps normal');
                    presionarL(); // Ejecutar el primer tap-tap inmediatamente
                    state.intervalo = safeInterval.create(presionarL, intervalo);
                }
                
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
            
            // Limpiar modo humano si está activo
            if (state.modoHumano.activo) {
                console.log('🧹 Limpiando modo humano por desactivación manual');
                limpiarModoHumano();
            }
            
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
                // Limpiar intervalo actual
                if (state.intervalo) {
                    safeInterval.clear(state.intervalo);
                }
                
                // Si estaba en modo humano, limpiarlo primero
                if (state.modoHumano.activo) {
                    console.log('🔄 Cambiando desde modo humano a intervalo normal');
                    limpiarModoHumano();
                }
                
                // Configurar nuevo modo
                if (nuevoIntervalo === 0) {
                    // Cambiar a modo humano
                    console.log('🤖 Cambiando a Modo Humano...');
                    state.modoHumano.activo = true;
                    generarVariablesModoHumano();
                    iniciarSesionModoHumano();
                    agregarNotificacion('🤖 Modo Humano activado', 'success', 3000);
                } else {
                    // Modo normal
                    presionarL(); // Ejecutar inmediatamente
                    state.intervalo = safeInterval.create(presionarL, nuevoIntervalo);
                }
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
                elementos.selectorLabel,
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
                        
                    case 'updateTapTaps':
                        // Actualizar contador desde popup (principalmente para reset)
                        if (request.hasOwnProperty('count') && typeof request.count === 'number') {
                            state.contador = request.count;
                            if (elementos.contadorDiv) {
                                elementos.contadorDiv.textContent = `Tap-Taps: ${state.contador}`;
                            }
                            sendResponse({ success: true });
                        } else {
                            sendResponse({ error: 'Valor de contador inválido' });
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
                
                // Verificar que no hay una cuenta regresiva ya activa
                if (!timers.cuentaRegresiva) {
                    // Limpiar timers específicos sin tocar cuenta regresiva activa
                    if (timers.typing) {
                        clearTimeout(timers.typing);
                        timers.typing = null;
                    }
                    if (timers.chat) {
                        clearTimeout(timers.chat);
                        timers.chat = null;
                    }
                    if (timers.countdown) {
                        clearTimeout(timers.countdown);
                        timers.countdown = null;
                    }
                    
                    // Limpiar timer de inactividad existente
                    if (inactivityTimer) {
                        clearTimeout(inactivityTimer);
                        inactivityTimer = null;
                    }
                    
                    // Usar timeout con delay para evitar race conditions
                    timers.chat = setTimeout(() => {
                        // Verificar nuevamente que las condiciones siguen siendo válidas
                        if (state.pausadoPorChat && !state.apagadoManualmente && !chatInput.textContent.trim()) {
                            mostrarCuentaRegresiva(`⏳ Reactivando en ${state.tiempoReactivacion}s...`);
                        }
                    }, 100); // Pequeño delay para estabilidad
                } else {
                    console.log('⚠️ Ya hay una cuenta regresiva activa, no creando duplicado');
                }
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
                
                // Limpiar cualquier timer existente
                timers.cleanupAll();
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = null;
                }
                
                // Pausar específicamente por chat
                const pausado = pausarPorChat();
                
                if (pausado) {
                    // Mostrar notificación
                    mostrarNotificacionChat('✍️ Auto Tap-Tap pausado mientras escribes...', 'warning');
                    
                    // Iniciar manejo de inactividad
                    handleActivity();
                }
                
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
                console.log('🎯 Click fuera del chat detectado - Iniciando cuenta regresiva');
                
                // Verificar que no hay una cuenta regresiva ya activa para evitar duplicados
                if (!timers.cuentaRegresiva) {
                    // Limpiar timers ESPECÍFICAMENTE excluyendo cuenta regresiva para evitar race conditions
                    if (timers.typing) {
                        clearTimeout(timers.typing);
                        timers.typing = null;
                    }
                    if (timers.chat) {
                        clearTimeout(timers.chat);
                        timers.chat = null;
                    }
                    if (timers.countdown) {
                        clearTimeout(timers.countdown);
                        timers.countdown = null;
                    }
                    
                    // Limpiar timer de inactividad si existe
                    if (inactivityTimer) {
                        clearTimeout(inactivityTimer);
                        inactivityTimer = null;
                    }
                    
                    // Iniciar cuenta regresiva de forma segura
                    setTimeout(() => {
                        mostrarCuentaRegresiva(`⏳ Reactivando en ${state.tiempoReactivacion}s...`);
                    }, 100); // Pequeño delay para asegurar que la limpieza se complete
                } else {
                    console.log('⚠️ Ya hay una cuenta regresiva activa, no creando duplicado');
                }
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
        // Usar el nuevo sistema de notificaciones integradas
        agregarNotificacion(mensaje, tipo, 3000);
    }
    
    // Función para mostrar cuenta regresiva de reactivación
    function mostrarCuentaRegresiva(mensajeInicial) {
        console.log(`🚀 Iniciando mostrarCuentaRegresiva: "${mensajeInicial}"`);
        
        // Verificación defensiva: asegurar que las condiciones son correctas
        if (!state.pausadoPorChat || state.apagadoManualmente || state.activo) {
            console.log('⚠️ Condiciones no válidas para cuenta regresiva:', {
                pausadoPorChat: state.pausadoPorChat,
                apagadoManualmente: state.apagadoManualmente,
                activo: state.activo
            });
            return;
        }
        
        // Verificar si ya hay una cuenta regresiva activa
        if (timers.cuentaRegresiva) {
            console.log('⚠️ Ya hay una cuenta regresiva activa, cancelando nueva');
            return;
        }
        
        // Limpiar timer anterior de cuenta regresiva si existe
        if (timers.cuentaRegresiva) {
            clearInterval(timers.cuentaRegresiva);
            timers.cuentaRegresiva = null;
        }
        
        // Limpiar notificación anterior si existe
        if (state.notificacionCuentaRegresiva) {
            removerNotificacion(state.notificacionCuentaRegresiva);
            state.notificacionCuentaRegresiva = null;
        }
        
        // Variables para la cuenta regresiva
        let tiempoRestante = state.tiempoReactivacion;
        
        // Crear notificación inicial con duración 0 (permanente hasta que la removamos)
        state.notificacionCuentaRegresiva = agregarNotificacion(`⏳ Reactivando en ${tiempoRestante}s...`, 'countdown', 0);
        
        // Función de limpieza para la cuenta regresiva
        const limpiarCuentaRegresiva = () => {
            console.log('🧹 Limpiando cuenta regresiva...');
            
            // Limpiar timer
            if (timers.cuentaRegresiva) {
                clearInterval(timers.cuentaRegresiva);
                timers.cuentaRegresiva = null;
            }
            
            // Limpiar notificación con remoción inmediata para evitar persistence
            if (state.notificacionCuentaRegresiva) {
                try {
                    removerNotificacion(state.notificacionCuentaRegresiva, true); // immediate = true
                    state.notificacionCuentaRegresiva = null;
                } catch (error) {
                    console.warn('Error al limpiar notificación de cuenta regresiva:', error);
                    state.notificacionCuentaRegresiva = null;
                }
            }
            
            // Limpieza adicional defensiva: buscar cualquier notificación huérfana de countdown
            try {
                if (elementos.contenedorNotificaciones) {
                    const notificacionesCountdown = Array.from(elementos.contenedorNotificaciones.children)
                        .filter(el => el.textContent && el.textContent.includes('Reactivando en'));
                    
                    if (notificacionesCountdown.length > 0) {
                        console.log(`🗑️ Limpiando ${notificacionesCountdown.length} notificaciones huérfanas de countdown`);
                        notificacionesCountdown.forEach(el => {
                            try {
                                el.parentNode.removeChild(el);
                            } catch (err) {
                                console.warn('Error limpiando notificación huérfana:', err);
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn('Error en limpieza defensiva:', error);
            }
        };
        
        // Iniciar cuenta regresiva
        timers.cuentaRegresiva = setInterval(() => {
            // Verificar que aún estamos pausados por chat y no apagados manualmente
            if (!state.pausadoPorChat || state.apagadoManualmente || state.activo) {
                console.log('⚠️ Cancelando cuenta regresiva - estado cambió:', {
                    pausadoPorChat: state.pausadoPorChat,
                    apagadoManualmente: state.apagadoManualmente,
                    activo: state.activo
                });
                limpiarCuentaRegresiva();
                return;
            }
            
            tiempoRestante--;
            
            if (tiempoRestante > 0) {
                // Actualizar el texto de la notificación existente
                if (state.notificacionCuentaRegresiva && state.notificacionCuentaRegresiva.parentNode) {
                    state.notificacionCuentaRegresiva.textContent = `⏳ Reactivando en ${tiempoRestante}s...`;
                    
                    // Cambiar color cuando quedan pocos segundos
                    if (tiempoRestante <= 3) {
                elementos.cuentaRegresivaDiv = null;
 } else {
                        state.notificacionCuentaRegresiva.style.color = '#ff8c00';
                    }
                }
            } else {
                // Tiempo agotado, reactivar sistema
                console.log('⏰ Tiempo de cuenta regresiva agotado, reactivando sistema...');
                state.contador = 0; // Reiniciar contador al reactivar
                actualizarContador();
                reactivarAutoTapTap(true);
                limpiarCuentaRegresiva();
            }
        }, 1000);
    }

    /**
     * =============================================================================
     * SISTEMA DE GESTIÓN DE NOTIFICACIONES INTEGRADAS
     * =============================================================================
     * 
     * Sistema que gestiona las notificaciones dentro del div flotante principal,
     * permitiendo que se apilen verticalmente en la esquina inferior derecha.
     */
    
    /**
     * AGREGAR NOTIFICACIÓN AL CONTENEDOR INTEGRADO
     * 
     * Crea y agrega una nueva notificación al contenedor de notificaciones
     * del div flotante principal.
     * 
     * @param {string} mensaje - Texto a mostrar en la notificación
     * @param {string} tipo - Tipo de notificación ('success', 'warning', 'info', 'countdown')
     * @param {number} duracion - Duración en milisegundos (0 = permanente)
     * @returns {HTMLElement} - Elemento de la notificación creada
     */
    function agregarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
        if (!elementos.contenedorNotificaciones) {
            console.warn('Contenedor de notificaciones no disponible');
            return null;
        }
        
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.3s ease;
            text-align: center;
            box-sizing: border-box;
            max-width: 250px;
            word-wrap: break-word;
            pointer-events: auto;
            margin-bottom: 4px;
        `;
        
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
            },
            countdown: {
                background: 'rgba(255, 165, 0, 0.95)',
                color: '#fff',
                border: '1px solid #ff8c00',
                boxShadow: '0 2px 8px rgba(255, 165, 0, 0.3)'
            }
        };
        
        // Aplicar estilos según tipo
        Object.assign(notificacion.style, estilos[tipo]);
        notificacion.textContent = mensaje;
        
        // Agregar al contenedor
        elementos.contenedorNotificaciones.appendChild(notificacion);
        
        // Animar entrada
        setTimeout(() => {
            notificacion.style.opacity = '1';
            notificacion.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-eliminar si tiene duración especificada
        if (duracion > 0) {
            setTimeout(() => {
                removerNotificacion(notificacion);
            }, duracion);
        }
        
        return notificacion;
    }
    
    /**
     * REMOVER NOTIFICACIÓN DEL CONTENEDOR
     * 
     * Remueve una notificación específica con animación de salida.
     * 
     * @param {HTMLElement} notificacion - Elemento de notificación a remover
     * @param {boolean} immediate - Si debe removerse inmediatamente sin animación
     */
    function removerNotificacion(notificacion, immediate = false) {
        if (!notificacion) return;
        
        try {
            if (immediate || !notificacion.parentNode) {
                // Remover inmediatamente sin animación
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
                return;
            }
            
            // Animar salida solo si el elemento aún está en el DOM
            if (notificacion.parentNode) {
                notificacion.style.opacity = '0';
                notificacion.style.transform = 'translateX(20px)';
                
                // Remover del DOM después de la animación
                setTimeout(() => {
                    try {
                        if (notificacion.parentNode) {
                            notificacion.parentNode.removeChild(notificacion);
                        }
                    } catch (error) {
                        console.warn('Error al remover notificación:', error);
                    }
                }, 300);
            }
        } catch (error) {
            console.warn('Error en removerNotificacion:', error);
        }
    }
    
    /**
     * LIMPIAR TODAS LAS NOTIFICACIONES
     * 
     * Remueve todas las notificaciones del contenedor.
     */
    function limpiarTodasLasNotificaciones() {
        if (elementos.contenedorNotificaciones) {
            const notificaciones = elementos.contenedorNotificaciones.children;
            Array.from(notificaciones).forEach(notificacion => {
                removerNotificacion(notificacion);
            });
        }
    }

    /**
     * LIMPIAR NOTIFICACIONES FLOTANTES (VERSIÓN ROBUSTA)
     * 
     * Realiza una limpieza completa y robusta de todas las notificaciones flotantes
     * usando múltiples estrategias para garantizar la limpieza completa.
     * Esta función es más agresiva que limpiarTodasLasNotificaciones para casos críticos.
     */
    function limpiarNotificacionesFlotantes() {
        console.log('🧹 Iniciando limpieza completa de notificaciones flotantes...');
        
        try {
            // ESTRATEGIA 1: Limpieza individual usando la función existente
            if (elementos.contenedorNotificaciones) {
                const notificaciones = elementos.contenedorNotificaciones.children;
                console.log(`📊 Encontradas ${notificaciones.length} notificaciones para limpiar`);
                
                // Limpiar cada notificación individualmente con try-catch
                Array.from(notificaciones).forEach((notificacion, index) => {
                    try {
                        removerNotificacion(notificacion, true); // immediate = true para limpieza rápida
                    } catch (error) {
                        console.warn(`⚠️ Error al remover notificación ${index}:`, error);
                    }
                });
            }
            
            // ESTRATEGIA 2: Limpieza directa del contenedor (fallback)
            if (elementos.contenedorNotificaciones && elementos.contenedorNotificaciones.children.length > 0) {
                console.log('🔄 Aplicando limpieza fallback con innerHTML...');
                try {
                    elementos.contenedorNotificaciones.innerHTML = '';
                } catch (error) {
                    console.warn('⚠️ Error en limpieza fallback:', error);
                }
            }
            
            // ESTRATEGIA 3: Limpieza extrema - buscar elementos huérfanos
            try {
                const elementosHuerfanos = document.querySelectorAll('.tiktok-notification, .auto-taptap-notification, [class*="notification"]');
                elementosHuerfanos.forEach((elemento, index) => {
                    try {
                        // Solo remover si parece ser una notificación de nuestra extensión
                        if (elemento.textContent && (
                            elemento.textContent.includes('Modo Humano') ||
                            elemento.textContent.includes('Auto Tap-Tap') ||
                            elemento.textContent.includes('Chat detectado') ||
                            elemento.textContent.includes('Reactivando')
                        )) {
                            elemento.remove();
                            console.log(`🗑️ Elemento huérfano removido: ${index}`);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error al remover elemento huérfano ${index}:`, error);
                    }
                });
            } catch (error) {
                console.warn('⚠️ Error en limpieza extrema:', error);
            }
            
            // ESTRATEGIA 4: Limpiar referencias en el estado
            try {
                if (state.notificacionCuentaRegresiva) {
                    state.notificacionCuentaRegresiva = null;
                }
                if (state.limpiarCuentaRegresiva && typeof state.limpiarCuentaRegresiva === 'function') {
                    state.limpiarCuentaRegresiva();
                    state.limpiarCuentaRegresiva = null;
                }
            } catch (error) {
                console.warn('⚠️ Error al limpiar referencias de estado:', error);
            }
            
            console.log('✅ Limpieza completa de notificaciones flotantes completada');
            
        } catch (error) {
            console.error('❌ Error crítico en limpieza de notificaciones:', error);
            // Fallback extremo: intentar remover el contenedor completo y recrearlo
            try {
                if (elementos.contenedorNotificaciones && elementos.contenedorNotificaciones.parentNode) {
                    const parent = elementos.contenedorNotificaciones.parentNode;
                    parent.removeChild(elementos.contenedorNotificaciones);
                    // Recrear contenedor básico
                    elementos.contenedorNotificaciones = document.createElement('div');
                    elementos.contenedorNotificaciones.id = 'tiktok-notifications-container';
                    elementos.contenedorNotificaciones.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10001;
                        pointer-events: none;
                    `;
                    parent.appendChild(elementos.contenedorNotificaciones);
                    console.log('🔄 Contenedor de notificaciones recreado');
                }
            } catch (recreateError) {
                console.error('❌ Error crítico en recreación de contenedor:', recreateError);
            }
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
        
        elementos.selectorLabel = document.createElement('label');
        elementos.selectorLabel.textContent = '⚡ Velocidad:';
        elementos.selectorLabel.style.cssText = `
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
        
        selectorContainer.appendChild(elementos.selectorLabel);
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
        
        // CREAR CONTENEDOR DE NOTIFICACIONES
        elementos.contenedorNotificaciones = document.createElement('div');
        elementos.contenedorNotificaciones.style.cssText = `
            position: absolute;
            bottom: -10px;
            right: 0;
            width: 100%;
            z-index: 1000002;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
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
        elementos.contenedor.appendChild(elementos.contenedorNotificaciones);
        
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
            
            // Limpiar modo humano si está activo
            if (state.modoHumano.activo) {
                console.log('🧹 Limpiando modo humano durante cleanup');
                limpiarModoHumano();
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
            
            // Limpiar timers de chat y cuenta regresiva
            timers.cleanupAll();
            
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

    /**
     * =============================================================================
     * FUNCIÓN DE LIMPIEZA DEFENSIVA PERIÓDICA
     * =============================================================================
     * 
     * Función que se ejecuta periódicamente para limpiar cualquier notificación
     * huérfana que pueda haber quedado en el DOM debido a race conditions o errores.
     */
    function limpiezaDefensivaPeriodica() {
        try {
            if (!elementos.contenedorNotificaciones) return;
            
            const notificacionesHuerfanas = Array.from(elementos.contenedorNotificaciones.children)
                .filter(el => {
                    const texto = el.textContent || '';
                    return texto.includes('Reactivando en') || 
                           texto.includes('Reactivando Auto Tap-Tap') ||
                           texto.includes('Auto Tap-Tap pausado');
                });
            
            if (notificacionesHuerfanas.length > 0) {
                console.log(`🗑️ Limpieza defensiva: encontradas ${notificacionesHuerfanas.length} notificaciones huérfanas`);
                
                notificacionesHuerfanas.forEach((el, index) => {
                    try {
                        // Verificar si la notificación debería estar activa
                        const texto = el.textContent || '';
                        let deberiaEstarActiva = false;
                        
                        if (texto.includes('Reactivando en') && state.pausadoPorChat && timers.cuentaRegresiva) {
                            // Esta notificación debería estar activa, no la toques
                            if (state.notificacionCuentaRegresiva === el) {
                                deberiaEstarActiva = true;
                            }
                        }
                        
                        if (!deberiaEstarActiva) {
                            console.log(`🗑️ Removiendo notificación huérfana ${index + 1}: "${texto.substring(0, 50)}..."`);
                            if (el.parentNode) {
                                el.parentNode.removeChild(el);
                            }
                        }
                    } catch (error) {
                        console.warn(`Error removiendo notificación huérfana ${index}:`, error);
                    }
                });
            }
        } catch (error) {
            console.warn('Error en limpieza defensiva periódica:', error);
        }
    }

    // Configurar limpieza defensiva periódica cada 30 segundos
    setInterval(limpiezaDefensivaPeriodica, 30000);

    /**
     * =============================================================================
     * PUNTO DE ENTRADA PRINCIPAL DE LA EXTENSIÓN
     * =============================================================================
     * 
     * Esta es la llamada que inicia todo el proceso de la extensión. Se ejecuta
     * inmediatamente después de que el script se inyecta en la página, y llama
     * a la función init() para comenzar la inicialización.
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

/**
 * ======================================================================================
 * BACKGROUND.JS - SERVICIO TRABAJADOR (SERVICE WORKER) DE LA EXTENSIÓN AUTO TAP-TAP
 * ======================================================================================
 * 
 * Este archivo actúa como el cerebro de la extensión de Chrome, ejecutándose en segundo
 * plano como un service worker persistente. Sus responsabilidades principales incluyen:
 * 
 * 🎯 FUNCIONALIDADES PRINCIPALES:
 * - Gestión de insignia (badge) animada en el ícono de la extensión
 * - Sincronización de estado entre content script y background
 * - Comunicación bidireccional mediante chrome.runtime messaging
 * - Persistencia de datos usando chrome.storage
 * - Monitoreo periódico del estado de tabs activos de TikTok
 * 
 * 🔄 FLUJO DE TRABAJO:
 * 1. Inicialización al instalar la extensión
 * 2. Escucha constante de mensajes del content script
 * 3. Actualización visual de la insignia según el estado
 * 4. Sincronización automática cada 5 segundos
 * 
 * 💾 ALMACENAMIENTO:
 * - totalTapTaps: Contador global acumulativo de taps realizados
 * - tiempoReactivacion: Tiempo en segundos para reactivar automatización
 * 
 * @author Emerick Echeverría Vargas
 * @version 1.0
 * @description Service Worker para gestión de estado y comunicación
 */

// ========================================================================================
// VARIABLES GLOBALES DE ESTADO
// ========================================================================================

/**
 * Contador legacy de taps - Mantenido por compatibilidad
 * @type {number}
 * @deprecated Se usa extensionState.contador en su lugar
 */
let taptapsCount = 0;

/**
 * Referencia al intervalo de animación de la insignia
 * Se usa para controlar y limpiar la animación cuando sea necesario
 * @type {number|null}
 */
let badgeInterval = null;

/**
 * Estado centralizado de la extensión
 * Mantiene sincronizada la información entre background y content scripts
 * @type {Object}
 * @property {boolean} active - Indica si la automatización está activa
 * @property {number} contador - Número total de taps realizados en la sesión actual
 */
let extensionState = {
    active: false,      // Estado de activación de la automatización
    contador: 0         // Contador de taps de la sesión actual
};

// ========================================================================================
// 🏷️ SISTEMA DE GESTIÓN DE INSIGNIA (BADGE)
// ========================================================================================

/**
 * Actualiza el texto de la insignia del ícono de la extensión en la barra de herramientas
 * 
 * FUNCIONALIDAD:
 * Esta función se encarga de mostrar visualmente el contador de tap-taps en la insignia
 * del ícono de la extensión. Proporciona feedback visual inmediato al usuario sobre
 * la actividad de la automatización.
 * 
 * COMPORTAMIENTO:
 * - Si count > 0: Muestra el número en la insignia
 * - Si count = 0: Deja la insignia sin texto (vacía)
 * 
 * CASOS DE USO:
 * 1. Actualización en tiempo real del contador de tap-taps
 * 2. Limpieza de la insignia cuando se detiene la automatización
 * 3. Sincronización visual con el estado del content script
 * 
 * @param {number} count - Número de tap-taps a mostrar en la insignia
 * @description Controla la visualización numérica en la insignia del ícono de extensión
 * 
 * INTEGRACIÓN:
 * - Llamada desde: syncState(), onMessage listener, animateBadge()
 * - API usada: chrome.action.setBadgeText()
 */
function updateBadge(count) {
    // Convierte el contador a string si es mayor a 0, sino muestra texto vacío
    const text = count > 0 ? count.toString() : '';
    
    // Aplica el texto a la insignia usando Chrome Extensions API
    chrome.action.setBadgeText({ text });
}

/**
 * Inicia la animación parpadeante de la insignia cuando la automatización está activa
 * 
 * PROPÓSITO:
 * Proporciona feedback visual dinámico al usuario indicando que la automatización
 * está funcionando activamente. La animación alternante llama la atención y comunica
 * claramente el estado activo del sistema.
 * 
 * MECÁNICA DE ANIMACIÓN:
 * 1. 🔴 Limpia cualquier animación previa en curso
 * 2. 🎨 Alterna entre dos tonos de verde cada segundo:
 *    - Verde claro (#00ff88) - Estado "encendido" de la animación
 *    - Verde medio (#00cc66) - Estado "apagado" de la animación
 * 3. ⏱️ Intervalo de 1000ms para crear efecto parpadeante suave
 * 4. 🛑 Se auto-detiene cuando extensionState.active cambia a false
 * 
 * GESTIÓN DE RECURSOS:
 * - Limpia intervalos anteriores para evitar memory leaks
 * - Se detiene automáticamente cuando la extensión se desactiva
 * - Restaura color rojo (#ff0050) al detenerse
 * 
 * ESTADOS VISUALES:
 * - ACTIVO: Animación verde parpadeante (vida/funcionando)
 * - INACTIVO: Color rojo sólido (detenido/error)
 * 
 * @description Controla la animación visual del estado activo de la extensión
 * 
 * FLUJO DE EJECUCIÓN:
 * 1. Verificación y limpieza de intervalo previo
 * 2. Inicialización de variable de alternancia
 * 3. Creación de nuevo intervalo con callback de animación
 * 4. Verificación continua del estado de extensión
 * 5. Auto-limpieza al desactivarse
 * 
 * INTEGRACIÓN:
 * - Llamada desde: onMessage listener (caso 'started')
 * - Depende de: extensionState.active
 * - API usada: chrome.action.setBadgeBackgroundColor()
 */
function animateBadge() {
    // Limpia cualquier animación previa para evitar múltiples intervalos concurrentes
    if (badgeInterval) {
        clearInterval(badgeInterval);
    }
    
    // Variable para controlar la alternancia de colores en la animación
    let isAlternate = false;
    
    // Establece intervalo de animación con ciclo de 1 segundo
    badgeInterval = setInterval(() => {
        // Verifica si la extensión sigue activa antes de continuar animación
        if (extensionState.active) {
            // Alterna entre dos tonos de verde para crear efecto parpadeante
            chrome.action.setBadgeBackgroundColor({ 
                color: isAlternate ? '#00cc66' : '#00ff88' 
            });
            // Cambia el estado para la siguiente iteración
            isAlternate = !isAlternate;
        } else {
            // Si la extensión se desactiva, detiene la animación automáticamente
            clearInterval(badgeInterval);
            // Restaura el color rojo para indicar estado inactivo
            chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
        }
    }, 1000); // Intervalo de 1 segundo para animación suave
}

// ========================================================================================
// 🔄 SISTEMA DE SINCRONIZACIÓN DE ESTADO
// ========================================================================================

/**
 * Sincroniza el estado del background script con los content scripts activos
 * 
 * ARQUITECTURA DE SINCRONIZACIÓN:
 * Esta función implementa un sistema de sincronización bidireccional que mantiene
 * coherencia entre el service worker (background) y los content scripts ejecutándose
 * en pestañas de TikTok. Es crucial para evitar desincronización de estados.
 * 
 * ALGORITMO DE SINCRONIZACIÓN:
 * 1. 🔍 DESCUBRIMIENTO: Identifica pestañas activas del navegador
 * 2. 🎯 FILTRADO: Selecciona solo pestañas de TikTok activas
 * 3. 📡 CONSULTA: Envía mensaje 'getStatus' a cada content script
 * 4. 📊 ACTUALIZACIÓN: Sincroniza estado local con respuesta remota
 * 5. 🎨 VISUALIZACIÓN: Actualiza insignia y animaciones según estado
 * 
 * CASOS DE RECUPERACIÓN:
 * - Manejo de errores de comunicación (content script no responde)
 * - Verificación de chrome.runtime.lastError para conexiones perdidas
 * - Continuación de operación aunque algunos tabs fallen
 * 
 * FLUJO DE DATOS:
 * background.js ----[getStatus]----> content.js
 * background.js <---[{activo, contador}]--- content.js
 * 
 * FRECUENCIA DE SINCRONIZACIÓN:
 * - Ejecutada automáticamente cada 5 segundos (ver setInterval al final)
 * - También puede ser llamada manualmente cuando sea necesario
 * 
 * @async
 * @description Mantiene sincronizado el estado entre background y content scripts
 * 
 * ESTADOS MANEJADOS:
 * - active/activo: Boolean indicando si automatización está ejecutándose
 * - contador: Number con total de tap-taps realizados en sesión actual
 * 
 * INTEGRACIÓN CON OTROS SISTEMAS:
 * - updateBadge(): Actualiza contador visual
 * - animateBadge(): Inicia animación si está activo
 * - extensionState: Actualiza estado centralizado
 * 
 * MANEJO DE ERRORES:
 * - try/catch para capturar errores de Chrome API
 * - Verificación de chrome.runtime.lastError
 * - Log de errores para debugging
 * - Operación no-destructiva (no afecta funcionamiento si falla)
 */
async function syncState() {
    try {
        // Consulta todas las pestañas activas del navegador
        const tabs = await chrome.tabs.query({ active: true });
        
        // Filtra solo pestañas que contengan TikTok en su URL
        const tiktokTabs = tabs.filter(tab => tab.url?.includes('tiktok.com'));
        
        // Itera a través de cada pestaña de TikTok encontrada
        for (const tab of tiktokTabs) {
            // Envía mensaje de consulta de estado al content script de la pestaña
            chrome.tabs.sendMessage(tab.id, { 
                action: 'getStatus' 
            }, response => {
                // Verifica que no haya errores de comunicación y que haya respuesta válida
                if (!chrome.runtime.lastError && response) {
                    // Actualiza el estado local con los datos del content script
                    extensionState = {
                        active: response.activo,        // Estado de automatización activa
                        contador: response.contador     // Contador de tap-taps actual
                    };
                    
                    // Actualiza la insignia con el nuevo contador
                    updateBadge(response.contador);
                    
                    // Si la automatización está activa, inicia animación visual
                    if (response.activo) {
                        animateBadge();
                    }
                }
                // Nota: Los errores de comunicación se ignoran silenciosamente para
                // evitar spam en consola cuando las pestañas no tienen content script
            });
        }
    } catch (error) {
        // Registra errores para debugging sin interrumpir operación
        console.error('Error syncing state:', error);
    }
}

// ========================================================================================
// 🚀 INICIALIZACIÓN DE LA EXTENSIÓN
// ========================================================================================

/**
 * Maneja la inicialización completa de la extensión al momento de la instalación
 * 
 * EVENTO ACTIVADO CUANDO:
 * - Primera instalación de la extensión
 * - Actualización a nueva versión de la extensión
 * - Habilitación de extensión previamente deshabilitada
 * - Recarga de extensión durante desarrollo
 * 
 * PROCESO DE INICIALIZACIÓN:
 * 1. 💾 CONFIGURACIÓN DE ALMACENAMIENTO: Establece valores por defecto en chrome.storage
 * 2. 🎨 CONFIGURACIÓN VISUAL: Establece colores y estado inicial de la insignia
 * 3. 🔧 PREPARACIÓN DE ESTADO: Prepara variables globales para operación
 * 
 * VALORES POR DEFECTO ESTABLECIDOS:
 * - totalTapTaps: 0 (contador acumulativo global de todos los tap-taps)
 * - tiempoReactivacion: 10 (segundos de espera antes de reactivar automatización)
 * 
 * CONFIGURACIÓN VISUAL INICIAL:
 * - Color de insignia: Rojo (#ff0050) indicando estado inactivo
 * - Texto de insignia: Vacío hasta que se inicie automatización
 * 
 * ARQUITECTURA DE STORAGE:
 * Se usa chrome.storage.local que persiste entre sesiones del navegador
 * y es accesible tanto desde background como content scripts.
 * 
 * @description Inicializa storage y configuración visual al instalar la extensión
 * 
 * FLUJO DE DATOS:
 * 1. chrome.storage.local.get() → Lee configuración existente
 * 2. Verificación de valores existentes
 * 3. chrome.storage.local.set() → Establece defaults si no existen
 * 4. chrome.action.setBadgeBackgroundColor() → Configura estado visual
 * 
 * CONSIDERACIONES DE RENDIMIENTO:
 * - Operación asíncrona no-bloqueante
 * - Solo establece valores si no existen (evita sobreescribir)
 * - Configuración una sola vez por ciclo de vida de extensión
 */
chrome.runtime.onInstalled.addListener(() => {
    // ============================================================================
    // INICIALIZACIÓN DEL ALMACENAMIENTO PERSISTENTE
    // ============================================================================
    
    /**
     * Obtiene configuración existente y establece valores por defecto si es necesario
     * 
     * PARÁMETROS DE STORAGE VERIFICADOS:
     * - totalTapTaps: Contador global acumulativo de tap-taps entre sesiones
     * - tiempoReactivacion: Tiempo en segundos para reactivar automatización
     */
    chrome.storage.local.get(['totalTapTaps', 'tiempoReactivacion'], result => {
        // Verifica si totalTapTaps existe, si no, lo inicializa en 0
        if (!result.totalTapTaps) {
            chrome.storage.local.set({ totalTapTaps: 0 });
        }
        
        // Verifica si tiempoReactivacion existe, si no, lo inicializa en 10 segundos
        if (!result.tiempoReactivacion) {
            chrome.storage.local.set({ tiempoReactivacion: 10 });
        }
    });
    
    // ============================================================================
    // CONFIGURACIÓN VISUAL INICIAL DE LA INSIGNIA
    // ============================================================================
    
    /**
     * Establece el color inicial de la insignia en rojo para indicar estado inactivo
     * 
     * CÓDIGO DE COLORES:
     * - #ff0050 (Rojo): Estado inactivo/detenido
     * - #00ff88 (Verde): Estado activo (establecido dinámicamente)
     * - #00cc66 (Verde medio): Usado en animación parpadeante
     */
    chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
});

// ========================================================================================
// 📡 SISTEMA DE COMUNICACIÓN INTER-SCRIPTS (MESSAGE HANDLING)
// ========================================================================================

/**
 * Maneja todos los mensajes entrantes desde content scripts, popup y otros componentes
 * 
 * ARQUITECTURA DE MENSAJERÍA:
 * Este listener actúa como el hub central de comunicación de la extensión,
 * procesando diferentes tipos de mensajes y coordinando respuestas apropiadas.
 * Implementa un patrón de switch para routing eficiente de mensajes.
 * 
 * FLUJO DE COMUNICACIÓN:
 * content.js ----[mensaje]----> background.js
 * popup.js   ----[mensaje]----> background.js
 * background.js ----[respuesta]----> origen
 * 
 * TIPOS DE MENSAJES SOPORTADOS:
 * 1. 'started' - Notifica inicio de automatización
 * 2. 'stopped' - Notifica detención de automatización  
 * 3. 'updateTapTaps' - Actualiza contador de tap-taps
 * 4. 'ping' - Verifica conectividad (health check)
 * 
 * PARÁMETROS DE CALLBACK:
 * @param {Object} request - Objeto mensaje con propiedades action y datos adicionales
 * @param {Object} sender - Información sobre el origen del mensaje
 * @param {Function} sendResponse - Callback para enviar respuesta al remitente
 * 
 * PATRÓN DE RESPUESTA:
 * Todas las respuestas siguen el formato:
 * - Éxito: { success: true, ...datos }
 * - Error: { error: "descripción del error" }
 * 
 * @description Hub central de procesamiento de mensajes entre componentes
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Routing de mensajes basado en la propiedad 'action'
    switch(request.action) {
        
        // ====================================================================
        // CASO: AUTOMATIZACIÓN INICIADA
        // ====================================================================
        case 'started':
            /**
             * Procesa notificación de inicio de automatización
             * 
             * ACCIONES EJECUTADAS:
             * 1. Actualiza estado global a activo
             * 2. Sincroniza contador si se proporciona
             * 3. Cambia insignia a modo "ON" con color verde
             * 4. Inicia animación parpadeante
             * 5. Confirma operación exitosa
             * 
             * DATOS DE REQUEST ESPERADOS:
             * - contador (opcional): Número actual de tap-taps realizados
             */
            extensionState.active = true;
            
            // Actualiza contador si se proporciona en el mensaje
            if (request.contador !== undefined) {
                extensionState.contador = request.contador;
                updateBadge(request.contador);
            }
            
            // Configura insignia para estado activo
            chrome.action.setBadgeText({ text: 'ON' });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff88' });
            
            // Inicia animación visual de estado activo
            animateBadge();
            
            // Confirma procesamiento exitoso
            sendResponse({ success: true });
            break;
            
        // ====================================================================
        // CASO: AUTOMATIZACIÓN DETENIDA
        // ====================================================================
        case 'stopped':
            /**
             * Procesa notificación de detención de automatización
             * 
             * ACCIONES EJECUTADAS:
             * 1. Actualiza estado global a inactivo
             * 2. Cambia insignia a modo "OFF" con color rojo
             * 3. Detiene cualquier animación en curso
             * 4. Limpia recursos de intervalos
             * 5. Confirma operación exitosa
             */
            extensionState.active = false;
            
            // Configura insignia para estado inactivo
            chrome.action.setBadgeText({ text: 'OFF' });
            chrome.action.setBadgeBackgroundColor({ color: '#ff0050' });
            
            // Detiene animación y limpia intervalo
            if (badgeInterval) {
                clearInterval(badgeInterval);
            }
            
            // Confirma procesamiento exitoso
            sendResponse({ success: true });
            break;
            
        // ====================================================================
        // CASO: ACTUALIZACIÓN DE CONTADOR
        // ====================================================================
        case 'updateTapTaps':
            /**
             * Procesa actualización del contador de tap-taps
             * 
             * FUNCIONALIDAD:
             * Permite al content script notificar cambios en el contador
             * sin cambiar el estado de activación de la automatización.
             * 
             * DATOS DE REQUEST ESPERADOS:
             * - count: Nuevo número de tap-taps realizados
             */
            extensionState.contador = request.count;
            updateBadge(request.count);
            sendResponse({ success: true });
            break;
            
        // ====================================================================
        // CASO: VERIFICACIÓN DE CONECTIVIDAD (PING)
        // ====================================================================
        case 'ping':
            /**
             * Responde a verificación de conectividad
             * 
             * PROPÓSITO:
             * Permite a otros componentes verificar que el background script
             * está funcionando correctamente y puede procesar mensajes.
             * 
             * USO TÍPICO:
             * - Health checks desde content scripts
             * - Verificación de conectividad desde popup
             * - Debugging de comunicación inter-scripts
             */
            sendResponse({ success: true });
            break;

        // ====================================================================
        // CASO: ACCIÓN NO RECONOCIDA
        // ====================================================================
        default:
            /**
             * Maneja mensajes con acciones no implementadas
             * 
             * COMPORTAMIENTO:
             * Proporciona respuesta de error descriptiva para debugging
             * y desarrollo de nuevas funcionalidades.
             */
            sendResponse({ error: 'Acción no reconocida' });
            break;
    }
});

// ========================================================================================
// ⏰ SISTEMA DE SINCRONIZACIÓN AUTOMÁTICA PERIÓDICA
// ========================================================================================

/**
 * Ejecuta sincronización automática de estado cada 5 segundos
 * 
 * PROPÓSITO DE LA SINCRONIZACIÓN PERIÓDICA:
 * Mantiene coherencia entre el background script y content scripts activos,
 * especialmente importante cuando:
 * - El usuario navega entre pestañas de TikTok
 * - Se abren/cierran pestañas de TikTok
 * - Hay fallos de comunicación temporal
 * - El content script se reinicia o refresca
 * 
 * FRECUENCIA DE SINCRONIZACIÓN:
 * - Intervalo: 5000ms (5 segundos)
 * - Suficientemente frecuente para mantener UI actualizada
 * - No tan frecuente como para impactar rendimiento
 * 
 * FUNCIONALIDAD EJECUTADA:
 * Llama a syncState() que realiza:
 * 1. Busca pestañas activas de TikTok
 * 2. Consulta estado actual de cada content script
 * 3. Actualiza estado local del background script
 * 4. Sincroniza insignia y animaciones visuales
 * 
 * CONSIDERACIONES DE RENDIMIENTO:
 * - Operación asíncrona no-bloqueante
 * - Manejo graceful de errores sin interrumpir el intervalo
 * - Filtrado inteligente de pestañas para minimizar overhead
 * 
 * CASOS DE USO:
 * - Recuperación automática de desincronización
 * - Actualización de estado al cambiar pestañas
 * - Mantener UI consistente entre sesiones largas
 * - Detectar cambios de estado iniciados desde el content script
 * 
 * @description Timer para sincronización automática cada 5 segundos
 * 
 * INTEGRACIÓN:
 * - Ejecuta: syncState()
 * - Persiste durante toda la vida del service worker
 * - Se reinicia automáticamente si el service worker se reactiva
 */
setInterval(syncState, 5000);
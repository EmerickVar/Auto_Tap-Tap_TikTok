/*
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                          📜 POPUP.JS - LÓGICA DE INTERFAZ DE USUARIO                                                                  ║
║                                                      Documentación completa en español mexicano                                                                        ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                                                                          ║
║  📋 DESCRIPCIÓN GENERAL:                                                                                                                                                ║
║      Este archivo JavaScript maneja toda la lógica de interacción del popup de la extensión "TikTok Auto Tap-Tap".                                                  ║
║      Actúa como controlador principal entre la interfaz de usuario (popup.html) y los scripts de contenido (content.js/background.js).                             ║
║      Gestiona el estado de la extensión, actualiza la UI dinámicamente y facilita la comunicación bidireccional.                                                    ║
║                                                                                                                                                                          ║
║  🏗️ ARQUITECTURA DEL CONTROLADOR:                                                                                                                                       ║
║      1. INICIALIZACIÓN DOM: Event listener para DOMContentLoaded garantiza elementos disponibles                                                                      ║
║      2. REFERENCIAS ELEMENTOS: Objeto centralizado con todas las referencias del DOM                                                                                   ║
║      3. GESTIÓN DE ESTADO: Variables globales para controlar intervalos y limpieza                                                                                    ║
║      4. FUNCIONES CORE: Actualizadores de UI y comunicación con content scripts                                                                                       ║
║      5. EVENT LISTENERS: Manejadores de eventos para todos los elementos interactivos                                                                                 ║
║      6. SINCRONIZACIÓN: Sistema de actualización periódica y manejo de storage                                                                                        ║
║                                                                                                                                                                          ║
║  🔄 FLUJO DE COMUNICACIÓN:                                                                                                                                              ║
║      1. 🚀 POPUP ABRE: Usuario hace clic en ícono → DOM se carga                                                                                                       ║
║      2. 📡 INICIALIZACIÓN: Script consulta tab activo y estado del content script                                                                                      ║
║      3. 🔄 SINCRONIZACIÓN: Estado se recupera de storage y content script                                                                                              ║
║      4. 🎨 ACTUALIZACIÓN UI: Interfaz refleja estado actual del sistema                                                                                                ║
║      5. 👆 INTERACCIÓN: Usuario activa controles → Mensajes a content script                                                                                           ║
║      6. 📊 MONITOREO: Actualización continua cada segundo del estado                                                                                                   ║
║                                                                                                                                                                          ║
║  🎯 FUNCIONALIDADES PRINCIPALES:                                                                                                                                        ║
║      • ▶️ CONTROL TOGGLE: Activar/desactivar automatización del tap-tap                                                                                                ║
║      • 📊 ACTUALIZACIÓN UI: Sincronización visual con estado real del sistema                                                                                          ║
║      • 🗑️ RESET ESTADÍSTICAS: Limpieza de contadores con confirmación                                                                                                  ║
║      • ⚙️ CONFIGURACIÓN: Ajuste de parámetros del sistema de chat                                                                                                       ║
║      • 🔗 NAVEGACIÓN: Apertura directa de TikTok desde la extensión                                                                                                     ║
║      • 🚨 DETECCIÓN ERRORES: Manejo de estados de error y recuperación                                                                                                  ║
║                                                                                                                                                                          ║
║  📡 SISTEMA DE MENSAJERÍA:                                                                                                                                              ║
║      • chrome.tabs.sendMessage(): Comunicación con content scripts                                                                                                     ║
║      • chrome.runtime.onMessage: Escucha de mensajes del background                                                                                                    ║
║      • chrome.storage.local: Persistencia de configuraciones y estadísticas                                                                                           ║
║      • Callbacks y promesas para manejo asíncrono                                                                                                                      ║
║                                                                                                                                                                          ║
║  🛡️ MANEJO DE ERRORES:                                                                                                                                                  ║
║      • Validación de tabs activos y URLs de TikTok                                                                                                                     ║
║      • Control de chrome.runtime.lastError para mensajes fallidos                                                                                                     ║
║      • Try-catch en operaciones asíncronas críticas                                                                                                                    ║
║      • Fallbacks y estados de recuperación automática                                                                                                                  ║
║                                                                                                                                                                          ║
║  👨‍💻 INFORMACIÓN DEL DESARROLLADOR:                                                                                                                                    ║
║      • AUTOR: Emerick Echeverría Vargas (@EmerickVar)                                                                                                                  ║
║      • ORGANIZACIÓN: New Age Coding Organization                                                                                                                       ║
║      • VERSIÓN: 1.1.2 LTS (Junio 2025)                                                                                                                                     ║
║      • COMPATIBILIDAD: Chrome Extension Manifest V3, ES6+, Async/Await                                                                                                ║
║                                                                                                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

// filepath: /Users/emerickvar/Documents/GitHub/Auto_Tap-Tap_TikTok/Extensión | Chrome/Auto Tap-Tap/popup.js

/* 
================================================================================
🚀 INICIALIZADOR PRINCIPAL DEL POPUP
================================================================================
Event listener que garantiza que todo el DOM esté completamente cargado antes
de ejecutar cualquier lógica de inicialización o manipulación de elementos
================================================================================
*/
document.addEventListener('DOMContentLoaded', () => {
    /* 
    ================================================================================
    📋 OBJETO DE REFERENCIAS DEL DOM
    ================================================================================
    Contenedor centralizado de todas las referencias a elementos HTML del popup.
    Facilita el acceso y manipulación de elementos, mejora la mantenibilidad
    y evita consultas repetitivas al DOM durante la ejecución.
    ================================================================================
    */
    const elementos = {
        // 🎛️ BOTÓN PRINCIPAL DE TOGGLE - Control primario para activar/desactivar
        toggleButton: document.getElementById('toggleButton'),
        
        // 🚦 INDICADOR TEXTUAL DE ESTADO - Muestra "Activo" o "Inactivo"
        statusText: document.getElementById('statusText'),
        
        // 📊 CONTADOR TOTAL ACUMULATIVO - Estadística persistente entre sesiones
        totalTapTaps: document.getElementById('totalTapTaps'),
        
        // 🔢 CONTADOR DE SESIÓN ACTUAL - Se resetea al reiniciar navegador
        sessionTapTaps: document.getElementById('sessionTapTaps'),
        
        // 🗑️ BOTÓN DE RESET DE ESTADÍSTICAS - Limpia todos los contadores
        resetStats: document.getElementById('resetStats'),
        
        // 🔗 BOTÓN DE APERTURA DE TIKTOK - Navegación directa a la plataforma
        openTikTok: document.getElementById('openTikTok'),
        
        // ⚙️ INPUT DE CONFIGURACIÓN DE CHAT - Ajuste de tiempo de reactivación
        chatReactivationTime: document.getElementById('chatReactivationTime')
    };
    
    /* 
    ================================================================================
    ⏱️ VARIABLE DE CONTROL DE INTERVALOS
    ================================================================================
    Almacena la referencia del intervalo de actualización periódica para permitir
    limpieza adecuada y evitar memory leaks cuando el popup se cierra
    ================================================================================
    */
    let updateInterval = null;

    /* 
    ================================================================================
    🧹 FUNCIÓN DE LIMPIEZA DE RECURSOS
    ================================================================================
    Limpia intervalos activos para prevenir memory leaks y uso innecesario de CPU
    cuando el popup se cierra o la extensión se suspende
    ================================================================================
    */
    const cleanup = () => {
        // Verificar si existe un intervalo activo antes de limpiarlo
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null; // Resetear referencia para futuras verificaciones
        }
    };
    
    /* 
    ================================================================================
    🎨 FUNCIÓN DE ACTUALIZACIÓN DE INTERFAZ DE USUARIO
    ================================================================================
    Actualiza todos los elementos visuales del popup según el estado actual del
    sistema de automatización. Maneja transiciones de estado y feedback visual.
    
    PARÁMETROS:
    - activo (boolean): Estado actual del sistema de automatización
    - contador (number): Cantidad de tap-taps realizados en la sesión actual
    
    FUNCIONALIDAD:
    1. Actualiza texto y clases CSS del indicador de estado
    2. Modifica texto y estilo del botón toggle según el estado
    3. Actualiza contador de tap-taps de la sesión actual
    4. Proporciona feedback visual inmediato al usuario
    ================================================================================
    */
    const updateUI = (activo, contador = 0) => {
        if (activo) {
            // 🟢 ESTADO ACTIVO - Sistema de automatización funcionando
            elementos.statusText.textContent = 'Activo';
            elementos.statusText.className = 'status-text active'; // CSS para estilo verde/activo
            elementos.toggleButton.textContent = 'Detener';
            elementos.toggleButton.className = 'toggle-button stop'; // CSS para botón de stop
        } else {
            // 🔴 ESTADO INACTIVO - Sistema detenido o pausado
            elementos.statusText.textContent = 'Inactivo';
            elementos.statusText.className = 'status-text inactive'; // CSS para estilo gris/inactivo
            elementos.toggleButton.textContent = 'Iniciar';
            elementos.toggleButton.className = 'toggle-button start'; // CSS para botón de inicio
        }
        // 📊 Actualizar contador de sesión con valor actual o 0 por defecto
        elementos.sessionTapTaps.textContent = contador;
    };
    
    /* 
    ================================================================================
    🔄 FUNCIÓN DE ACTUALIZACIÓN DE ESTADO DEL POPUP
    ================================================================================
    Función principal que sincroniza el estado del popup con el content script
    y maneja todas las validaciones de conectividad y estado del sistema.
    
    FLUJO DE EJECUCIÓN:
    1. 🔍 Consulta tab activo en la ventana actual
    2. ✅ Valida que sea una página de TikTok
    3. 📡 Envía mensaje al content script para obtener estado
    4. 🎨 Actualiza UI según respuesta recibida
    5. 📊 Sincroniza estadísticas desde chrome.storage
    6. 🚨 Maneja errores y estados de recuperación
    
    CASOS DE ERROR MANEJADOS:
    - Tab no está en TikTok.com
    - Content script no responde (necesita recarga)
    - Errores de comunicación chrome.runtime
    ================================================================================
    */
    const updatePopupStatus = async () => {
        try {
            // 🔍 CONSULTA DEL TAB ACTIVO
            // Obtiene información del tab actualmente visible en la ventana actual
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // ✅ VALIDACIÓN DE TIKTOK
            // Verifica que el tab existe y que la URL corresponde a TikTok
            if (!tab || !tab.url || !tab.url.includes('tiktok.com')) {
                // 🚨 ESTADO: NO ESTÁ EN TIKTOK
                elementos.statusText.textContent = '⚠️ Abre TikTok primero';
                elementos.toggleButton.disabled = true; // Deshabilitar botón principal
                elementos.openTikTok.style.display = 'block'; // Mostrar botón "Abrir TikTok"
                return; // Salir temprano, no procesar más
            }
            
            // ✅ ESTADO: ESTÁ EN TIKTOK
            elementos.openTikTok.style.display = 'none'; // Ocultar botón "Abrir TikTok"
            
            // 📡 COMUNICACIÓN CON CONTENT SCRIPT
            // Envía mensaje para obtener estado actual del sistema de automatización
            chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, response => {
                if (chrome.runtime.lastError) {
                    // 🚨 ERROR: CONTENT SCRIPT NO RESPONDE
                    // Indica que el content script no está cargado o hay error de comunicación
                    elementos.statusText.textContent = '🔄 Recarga la página de TikTok';
                    elementos.toggleButton.disabled = true;
                    elementos.sessionTapTaps.textContent = '0';
                    
                    // 🔄 RECARGA AUTOMÁTICA
                    // Intenta resolver el problema recargando la página después de 3 segundos
                    setTimeout(() => {
                        chrome.tabs.reload(tab.id);
                    }, 3000);
                } else if (response) {
                    // ✅ RESPUESTA EXITOSA DEL CONTENT SCRIPT
                    // Verificar si tenemos los nuevos campos de contexto
                    if (response.enTikTok !== undefined && response.enLive !== undefined) {
                        // 🎯 MANEJO DE LOS TRES ESTADOS SEGÚN CONTEXTO
                        if (response.enTikTok && response.enLive) {
                            // 🟢 ESTADO: EN TIKTOK LIVE - Funcionalidad completa
                            updateUI(response.activo, response.contador);
                            elementos.toggleButton.disabled = false; // Habilitar control principal
                            
                            // ⚙️ SINCRONIZAR CONFIGURACIÓN DE CHAT
                            if (response.tiempoReactivacion) {
                                elementos.chatReactivationTime.value = response.tiempoReactivacion;
                            }
                        } else if (response.enTikTok && !response.enLive) {
                            // 🟡 ESTADO: EN TIKTOK PERO NO EN LIVE - Mensaje específico + botón deshabilitado
                            elementos.statusText.textContent = 'ℹ️ Solo funciona en TikTok Live';
                            elementos.statusText.className = 'status-text inactive';
                            elementos.toggleButton.textContent = 'Solo en Live';
                            elementos.toggleButton.className = 'toggle-button start';
                            elementos.toggleButton.disabled = true; // Deshabilitar botón
                            elementos.sessionTapTaps.textContent = '0';
                        } else {
                            // 🔴 ESTADO: NO EN TIKTOK - Comportamiento original
                            elementos.statusText.textContent = '⚠️ Abre TikTok primero';
                            elementos.toggleButton.disabled = true;
                        }
                    } else {
                        // 🔄 COMPATIBILIDAD: Respuesta sin nuevos campos (modo legacy)
                        updateUI(response.activo, response.contador);
                        elementos.toggleButton.disabled = false;
                        
                        if (response.tiempoReactivacion) {
                            elementos.chatReactivationTime.value = response.tiempoReactivacion;
                        }
                    }
                }
            });
            
            // 📊 ACTUALIZACIÓN DE ESTADÍSTICAS TOTALES
            // Recupera contador total persistente desde chrome.storage.local
            chrome.storage.local.get(['totalTapTaps'], result => {
                elementos.totalTapTaps.textContent = result.totalTapTaps || 0;
            });
        } catch (error) {
            // 🚨 MANEJO DE ERRORES CRÍTICOS
            // Log para debugging y diagnóstico de problemas
            console.error('Error updating popup:', error);
        }
    };
    
    /* 
    ================================================================================
    🎛️ MANEJADORES DE EVENTOS - SISTEMA DE INTERACCIÓN
    ================================================================================
    Conjunto de event listeners que manejan todas las interacciones del usuario
    con los elementos del popup y comunican las acciones al content script
    ================================================================================
    */
    
    /* 
    ▶️ EVENT LISTENER: BOTÓN TOGGLE PRINCIPAL
    Maneja el evento click del botón principal que activa/desactiva la automatización.
    
    FUNCIONALIDAD:
    1. Obtiene tab activo para enviar mensaje
    2. Envía comando 'toggle' al content script
    3. Actualiza estado del popup si la operación es exitosa
    4. Proporciona feedback inmediato al usuario
    */
    elementos.toggleButton.addEventListener('click', async () => {
        // 🔍 Obtener tab activo para comunicación
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 📡 Enviar comando toggle al content script
        chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, response => {
            // ✅ Verificar éxito de la operación y actualizar UI
            if (!chrome.runtime.lastError && response?.success) {
                updatePopupStatus(); // Refrescar estado completo del popup
            }
        });
    });
    
    /* 
    🗑️ EVENT LISTENER: BOTÓN RESET DE ESTADÍSTICAS
    Maneja la limpieza completa de todas las estadísticas (sesión + total).
    
    FUNCIONALIDAD:
    1. Resetea contador total en chrome.storage.local
    2. Envía comando al content script para resetear contador de sesión
    3. Actualiza UI inmediatamente para reflejar cambios
    4. Operación destructiva sin confirmación (UX simplificada)
    */
    elementos.resetStats.addEventListener('click', async () => {
        // 🔍 Obtener tab activo para comunicación con content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 🗑️ Limpiar contador total persistente en storage
        chrome.storage.local.set({ totalTapTaps: 0 });
        
        // 📡 Enviar comando al content script para resetear contador de sesión
        chrome.tabs.sendMessage(tab.id, { action: 'updateTapTaps', count: 0 }, response => {
            // ✅ Actualizar UI solo si la operación fue exitosa
            if (!chrome.runtime.lastError && response?.success) {
                elementos.totalTapTaps.textContent = '0';    // Mostrar total en 0
                elementos.sessionTapTaps.textContent = '0';  // Mostrar sesión en 0
            }
        });
    });
    
    /* 
    🔗 EVENT LISTENER: BOTÓN ABRIR TIKTOK
    Maneja la apertura de una nueva pestaña dirigida a TikTok.com.
    
    FUNCIONALIDAD:
    - Crea nueva pestaña con URL de TikTok
    - No requiere validaciones adicionales
    - Operación directa mediante Chrome Extension API
    */
    elementos.openTikTok.addEventListener('click', () => {
        // 🌐 Crear nueva pestaña con TikTok
        chrome.tabs.create({ url: 'https://www.tiktok.com' });
    });
    
    /* 
    ⚙️ EVENT LISTENER: INPUT DE CONFIGURACIÓN DE CHAT
    Maneja cambios en el tiempo de reactivación del chat y sincroniza
    la configuración entre el popup y el content script.
    
    FUNCIONALIDAD:
    1. Valida que el valor esté en rango permitido (5-60 segundos)
    2. Guarda configuración en chrome.storage.local
    3. Envía nueva configuración al content script
    4. Mantiene sincronización bidireccional de settings
    
    VALIDACIONES:
    - Mínimo: 5 segundos (permite reactivación más rápida)
    - Máximo: 60 segundos (evita inactividad prolongada)
    - Auto-corrección de valores fuera de rango
    */
    elementos.chatReactivationTime.addEventListener('change', () => {
        // 📊 VALIDACIÓN Y SANITIZACIÓN DEL INPUT
        let tiempo = parseInt(elementos.chatReactivationTime.value);
        
        // 🔧 Corregir valores inválidos o fuera de rango
        if (isNaN(tiempo) || tiempo < 5) tiempo = 5;    // Mínimo 5 segundos
        if (tiempo > 60) tiempo = 60;                   // Máximo 60 segundos
        
        // 🎯 Actualizar input con valor corregido
        elementos.chatReactivationTime.value = tiempo;
        
        // 💾 GUARDAR CONFIGURACIÓN EN STORAGE
        chrome.storage.local.set({ tiempoReactivacion: tiempo }, () => {
            // 📡 SINCRONIZAR CON CONTENT SCRIPT
            // Obtener tab activo y enviar nueva configuración
            const [tab] = chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                // ✅ Verificar que el tab sea válido y esté en TikTok
                if (tab && tab.url.includes('tiktok.com')) {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'updateReactivationTime', 
                        tiempo: tiempo 
                    });
                }
            });
        });
    });
    
    /* 
    📨 LISTENER DE MENSAJES DEL RUNTIME
    Escucha mensajes enviados desde otros componentes de la extensión
    (principalmente background.js) para sincronizar cambios de configuración.
    
    MENSAJES MANEJADOS:
    - 'tiempoReactivacionChanged': Actualiza input cuando la configuración cambia externamente
    */
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'tiempoReactivacionChanged') {
            // 🔄 Sincronizar input con cambio externo de configuración
            elementos.chatReactivationTime.value = request.tiempo;
        }
    });
    
    /* 
    ================================================================================
    ⚡️ INICIALIZACIÓN Y CONFIGURACIÓN INICIAL DEL POPUP
    ================================================================================
    Secuencia de inicialización que prepara el popup con configuraciones
    guardadas y establece el sistema de actualización continua
    ================================================================================
    */
    
    /* 
    💾 CARGA DE CONFIGURACIÓN PERSISTENTE
    Recupera el tiempo de reactivación del chat desde chrome.storage.local
    y actualiza el input correspondiente para mostrar el valor actual al usuario.
    
    PROPÓSITO:
    - Mantener consistencia entre sesiones
    - Mostrar configuración actual al abrir popup
    - Evitar que el usuario pierda sus ajustes personalizados
    */
    chrome.storage.local.get(['tiempoReactivacion'], result => {
        if (result.tiempoReactivacion) {
            // 🎯 Aplicar configuración guardada al input
            elementos.chatReactivationTime.value = result.tiempoReactivacion;
        }
        // Si no hay configuración guardada, mantiene valor por defecto del HTML (10)
    });
    
    /* 
    🚀 INICIALIZACIÓN INMEDIATA
    Ejecuta la primera actualización de estado del popup para sincronizar
    inmediatamente con el estado actual del content script y mostrar
    información correcta al usuario desde el primer momento.
    */
    updatePopupStatus();
    
    /* 
    ⏱️ SISTEMA DE ACTUALIZACIÓN PERIÓDICA
    Establece un intervalo que actualiza el estado del popup cada segundo.
    
    FUNCIONALIDAD:
    - Mantiene sincronización continua con content script
    - Actualiza contadores en tiempo real
    - Detecta cambios de estado automáticamente
    - Proporciona experiencia de usuario fluida y responsiva
    
    FRECUENCIA: 1000ms (1 segundo)
    JUSTIFICACIÓN: Balance entre responsividad y rendimiento
    */
    updateInterval = setInterval(updatePopupStatus, 1000);
    
    /* 
    🧹 REGISTRO DE LIMPIEZA PARA SUSPENSIÓN
    Registra la función de limpieza para ser ejecutada cuando Chrome
    suspende la extensión, previniendo memory leaks y uso innecesario de recursos.
    
    IMPORTANTE: 
    - Crítico para extensiones Manifest V3
    - Previene acumulación de intervalos activos
    - Mejora rendimiento general del navegador
    */
    chrome.runtime.onSuspend.addListener(cleanup);

/* 
================================================================================
🏁 CIERRE DEL EVENT LISTENER DOMCONTENTLOADED
================================================================================
Fin del scope principal del popup script. Toda la lógica está encapsulada
dentro del event listener para garantizar que el DOM esté completamente cargado.
================================================================================
*/
});
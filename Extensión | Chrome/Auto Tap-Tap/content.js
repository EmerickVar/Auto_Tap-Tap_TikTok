/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 AUTO TAP-TAP TIKTOK - CONTENT SCRIPT PRINCIPAL (BACKUP VERSION)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @fileoverview Content Script principal para automatización de tap-taps en TikTok Live.
 *               Este archivo contiene la implementación completa del sistema de 
 *               automatización, incluyendo interfaz flotante, modo humano, 
 *               gestión de chat y sistema de notificaciones.
 * 
 * @author       Emerick Echeverría Vargas (@EmerickVar)
 * @company      New Age Coding Organization (https://newagecoding.org)
 * @github       https://github.com/EmerickVar/TikTok.Auto_Tap-Tap
 * @version      1.1.0
 * @since        2025-12-01
 * @license      Propietario
 * 
 * @description  
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ DESCRIPCIÓN GENERAL                                                     │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ Esta extensión automatiza la interacción con los "tap-taps" (corazones) │
 * │ en las transmisiones en vivo de TikTok, proporcionando:                 │
 * │                                                                         │
 * │ • 🎯 Automatización inteligente con detección de contexto               │
 * │ • 🤖 Modo humano con comportamiento aleatorio y natural                 │
 * │ • 💬 Sistema de pausa automática al interactuar con el chat             │
 * │ • 🎨 Interfaz flotante moderna y completamente funcional                │
 * │ • 🔄 Sistema de reconexión y recuperación de errores                    │
 * │ • 📊 Contador de tap-taps con persistencia                              │
 * │ • 🛡️ Gestión defensiva de recursos y limpieza automática                │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * @architecture
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ARQUITECTURA MODULAR                                                    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │ ContextModule      → Detección de contexto y validación de páginas      │
 * │ StateModule        → Estado global centralizado de la aplicación        │
 * │ TimerModule        → Gestión unificada de todos los timers              │
 * │ StorageModule      → Operaciones seguras con Chrome Storage API         │
 * │ MessagingModule    → Comunicación bidireccional con background script   │
 * │ AutomationModule   → Lógica principal de automatización de tap-taps     │
 * │ IntervalModule     → Gestión segura de intervalos                       │
 * │ ModoHumanoModule   → Simulación de comportamiento humano natural        │
 * │ ChatModule         → Detección y manejo de interacciones con chat       │
 * │ NotificationModule → Sistema de notificaciones flotantes                │
 * │ UIModule           → Interfaz de usuario flotante y interactiva         │
 * │ DragModule         → Sistema de arrastre para la interfaz               │
 * │ NavigationModule   → Detección de cambios de navegación                 │
 * │ ExtensionModule    → Reconexión y recuperación de extensión             │
 * │ InitModule         → Coordinación de inicialización                     │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * @features
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ CARACTERÍSTICAS PRINCIPALES                                             │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │ ⚡️ VELOCIDADES CONFIGURABLES:                                           │
 * │    • Modo Humano (Variable/Aleatorio)                                   │
 * │    • 200ms (Muy rápido)                                                 │
 * │    • 250ms (Rápido)                                                     │
 * │    • 500ms (Normal)                                                     │
 * │    • 1000ms (Lento)                                                     │
 * │                                                                         │
 * │ 🤖 MODO HUMANO AVANZADO:                                                │
 * │    • Sesiones de actividad con duración variable (15-45s)               │
 * │    • Cooldowns realistas entre sesiones (5-20s)                         │
 * │    • Frecuencia de tap-taps variable dentro de sesiones                 │
 * │    • Comportamiento completamente aleatorio y natural                   │
 * │                                                                         │
 * │ 💬 INTEGRACIÓN CON CHAT:                                                │
 * │    • Detección automática del campo de chat                             │
 * │    • Pausa inmediata al interactuar con el chat                         │
 * │    • Reactivación automática configurable (10-60s)                      │
 * │    • Gestión inteligente de eventos de foco                             │
 * │                                                                         │
 * │ 🎨 INTERFAZ MODERNA:                                                    │
 * │    • Diseño glassmorphism con efectos visuales                          │
 * │    • Completamente arrastrable y reposicionable                         │
 * │    • Minimizable para mayor comodidad                                   │
 * │    • Notificaciones contextuales elegantes                              │
 * │    • Persistencia de posición y configuraciones                         │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * @security
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SEGURIDAD Y ROBUSTEZ                                                    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │ • Validación estricta de contexto (solo TikTok Live)                    │
 * │ • Prevención de inyección múltiple                                      │
 * │ • Gestión defensiva de recursos y limpieza automática                   │
 * │ • Recuperación automática de errores de conexión                        │
 * │ • Manejo seguro de eventos DOM y observers                              │
 * │ • Cleanup completo al cambiar de página                                 │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * @compatibility
 * • Chrome Extensions Manifest V3
 * • TikTok Live (versiones actuales)
 * • Desktop y Mobile Web
 * 
 * @dependencies
 * • Chrome Storage API
 * • Chrome Runtime API
 * • DOM Level 2+ Events
 * • MutationObserver API
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';
    
    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🔍 MÓDULO DE VERIFICACIÓN DE CONTEXTO
     * ═══════════════════════════════════════════════════════════════════════════════
     * 
     * @module ContextModule
     * @description Módulo especializado en la validación y verificación del contexto
     *              de ejecución de la extensión. Determina si estamos en las páginas
     *              correctas de TikTok y si la extensión debe activarse completamente.
     * 
     * @purpose
     * Este módulo es fundamental para la seguridad y funcionalidad correcta de la 
     * extensión, asegurando que solo se ejecute en los contextos apropiados y 
     * evitando conflictos o comportamientos inesperados en otras páginas.
     * 
     * @responsibilities
     * • Verificar que estemos en el dominio de TikTok
     * • Detectar específicamente páginas de transmisiones en vivo
     * • Validar patrones de URL para Live streams
     * • Prevenir inyección múltiple del content script
     * • Proporcionar estado contextual para otros módulos
     * 
     * @security
     * • Validación estricta de hostname
     * • Patrones de URL específicos y seguros
     * • Prevención de ejecución en contextos no deseados
     * • Verificación de inyección previa
     * 
     * @patterns
     * URL Pattern para TikTok Live: /@username/live
     * Ejemplos válidos:
     * - https://www.tiktok.com/@usuario/live
     * - https://www.tiktok.com/@usuario/live/12345
     * - https://m.tiktok.com/@usuario/live
     */
    const ContextModule = {
        /**
         * Verifica si estamos en una página de TikTok
         * 
         * @method isOnTikTok
         * @description Valida que el hostname actual corresponda al dominio de TikTok.
         *              Esta es la primera línea de defensa para asegurar que solo
         *              ejecutemos en el sitio correcto.
         * 
         * @implementation
         * Utiliza window.location.hostname para verificar que contenga 'tiktok.com',
         * lo que incluye subdominios como www.tiktok.com, m.tiktok.com, etc.
         * 
         * @returns {boolean} true si estamos en TikTok, false en caso contrario
         * 
         * @example
         * // En https://www.tiktok.com/...
         * ContextModule.isOnTikTok(); // returns true
         * 
         * // En https://youtube.com/...
         * ContextModule.isOnTikTok(); // returns false
         * 
         * @security
         * • No utiliza regex complejo para evitar vulnerabilidades
         * • Método simple y confiable de verificación de dominio
         * • Incluye subdominios oficiales de TikTok
         */
        isOnTikTok() {
            return window.location.hostname.includes('tiktok.com');
        },
        
        /**
         * Verifica si estamos en una página de Live de TikTok
         * 
         * @method isOnTikTokLive
         * @description Determina específicamente si la URL actual corresponde a una
         *              transmisión en vivo de TikTok. Esta validación es crucial para
         *              activar la funcionalidad completa de la extensión.
         * 
         * @algorithm
         * 1. Verificar primero que estemos en TikTok (seguridad)
         * 2. Extraer pathname de la URL actual
         * 3. Aplicar patrón regex específico para Live streams
         * 4. Retornar resultado de la validación
         * 
         * @regex-pattern /^\/@[^\/]+\/live(?:\/[^?]*)?$/
         * - ^           : Inicio de string
         * - \/@         : Literal "/@" 
         * - [^\/]+      : Uno o más caracteres que no sean "/"
         * - \/live      : Literal "/live"
         * - (?:\/[^?]*) : Grupo no capturador opcional con "/" + chars hasta "?"
         * - ?           : El grupo anterior es opcional
         * - $           : Final de string
         * 
         * @returns {boolean} true si estamos en un Live de TikTok
         * 
         * @example
         * // URL: https://www.tiktok.com/@usuario/live
         * ContextModule.isOnTikTokLive(); // returns true
         * 
         * // URL: https://www.tiktok.com/@usuario/video/12345
         * ContextModule.isOnTikTokLive(); // returns false
         * 
         * @performance O(1) - Operación de regex simple
         * @dependency Depende de isOnTikTok() para validación previa
         */
        isOnTikTokLive() {
            if (!this.isOnTikTok()) return false;
            
            const pathname = window.location.pathname;
            const livePattern = /^\/@[^\/]+\/live(?:\/[^?]*)?$/;
            return livePattern.test(pathname);
        },
        
        /**
         * Obtiene el contexto actual completo del usuario
         * 
         * @method getCurrentContext
         * @description Proporciona un objeto con el estado contextual completo,
         *              incluyendo si estamos en TikTok y específicamente en un Live.
         *              Este método es usado por otros módulos para tomar decisiones
         *              de funcionamiento.
         * 
         * @returns {Object} Objeto con propiedades de contexto
         * @returns {boolean} returns.enTikTok - true si estamos en TikTok
         * @returns {boolean} returns.enLive - true si estamos en un Live de TikTok
         * 
         * @example
         * const contexto = ContextModule.getCurrentContext();
         * if (contexto.enLive) {
         *     // Activar funcionalidad completa
         * } else if (contexto.enTikTok) {
         *     // Modo básico de TikTok
         * } else {
         *     // No ejecutar nada
         * }
         * 
         * @usage
         * • Usado en inicialización para determinar modo de operación
         * • Consultado por NavigationModule en cambios de URL
         * • Referenciado por MessagingModule para reportar estado
         * • Utilizado por background script para icon badge
         * 
         * @performance O(1) - Reutiliza métodos de verificación ya optimizados
         */
        getCurrentContext() {
            const enTikTok = this.isOnTikTok();
            const enLive = enTikTok && this.isOnTikTokLive();
            
            return { enTikTok, enLive };
        },
        
        /**
         * Verifica si la extensión ya está inyectada en la página
         * 
         * @method isAlreadyInjected
         * @description Previene la inyección múltiple del content script verificando
         *              la existencia de un elemento marcador único en el DOM.
         *              Esto es especialmente importante en SPAs como TikTok donde
         *              la navegación no siempre recarga la página completa.
         * 
         * @implementation
         * Busca un elemento con ID único 'tiktok-auto-taptap' que se crea durante
         * la inicialización de la interfaz. Si existe, significa que la extensión
         * ya está ejecutándose en esta página.
         * 
         * @returns {boolean} true si la extensión ya está inyectada
         * 
         * @security
         * • Previene conflictos por ejecución múltiple
         * • Evita duplicación de event listeners
         * • Protege contra memory leaks
         * • Mantiene un solo punto de control
         * 
         * @example
         * if (ContextModule.isAlreadyInjected()) {
         *     console.log('Extensión ya activa, abortando');
         *     return;
         * }
         * 
         * @see UIModule.crearInterfaz() - Donde se crea el elemento marcador
         * @performance O(1) - Simple búsqueda por ID en el DOM
         */
        isAlreadyInjected() {
            return !!document.getElementById('tiktok-auto-taptap');
        }
    };
    
    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 🗄️ MÓDULO DE ESTADO GLOBAL
     * ═══════════════════════════════════════════════════════════════════════════════
     * 
     * @module StateModule
     * @description Módulo de gestión centralizada del estado global de la aplicación.
     *              Actúa como una "base de datos" en memoria que mantiene toda la
     *              información crítica del estado actual de la extensión.
     * 
     * @architecture
     * Implementa un patrón de estado centralizado donde todos los módulos consultan
     * y modifican el estado a través de este módulo central, evitando duplicación
     * de datos y asegurando consistencia.
     * 
     * @categories
     * ┌─────────────────────────────────────────────────────────────────────────┐
     * │ CATEGORÍAS DE ESTADO                                                    │
     * ├─────────────────────────────────────────────────────────────────────────┤
     * │                                                                         │
     * │ 🎯 Estado de Automatización                                             │
     * │    • Control de intervalos y activación                                 │
     * │    • Contador de tap-taps realizados                                    │
     * │                                                                         │
     * │ 🖱️ Estado de Interfaz Arrastrable                                       │
     * │    • Posiciones y coordenadas de arrastre                               │
     * │    • Estados de interacción del usuario                                 │
     * │                                                                         │
     * │ 💬 Sistema de Reactivación por Chat                                     │
     * │    • Estados de pausa y reactivación                                    │
     * │    • Timers y configuraciones de chat                                   │
     * │                                                                         │
     * │ 🔔 Sistema de Notificaciones                                            │
     * │    • Referencias a notificaciones activas                               │
     * │    • Funciones de limpieza y gestión                                    │
     * │                                                                         │
     * │ 🤖 Modo Humano Avanzado                                                 │
     * │    • Variables aleatorias y configuraciones                             │
     * │    • Estados de sesión y cooldown                                       │
     * │    • Timers y referencias temporales                                    │
     * │                                                                         │
     * │ 🔧 Referencias Adicionales                                              │
     * │    • Observers y sistemas de limpieza                                   │
     * │    • Intervalos de verificación                                         │
     * │                                                                         │
     * └─────────────────────────────────────────────────────────────────────────┘
     * 
     * @data-integrity
     * • Estado inmutable donde sea posible
     * • Validación de tipos en propiedades críticas
     * • Valores por defecto seguros
     * • Cleanup automático de referencias obsoletas
     * 
     * @performance
     * • Acceso O(1) a todas las propiedades
     * • Estructura plana para eficiencia de memoria
     * • Referencias directas en lugar de búsquedas
     */
    const StateModule = {
        // ═════════════════════════════════════════════════════════════════════════
        // 🎯 ESTADO DE AUTOMATIZACIÓN
        // ═════════════════════════════════════════════════════════════════════════
        
        /**
         * @property {number|null} intervalo
         * @description ID del intervalo principal de automatización. null cuando inactivo.
         * @default null
         * @usage Usado por AutomationModule e IntervalModule para control de ejecución
         */
        intervalo: null,
        
        /**
         * @property {boolean} activo
         * @description Estado principal de activación de la extensión.
         * @default false
         * @usage Consultado por todos los módulos para determinar funcionamiento
         */
        activo: false,
        
        /**
         * @property {number} contador
         * @description Número total de tap-taps realizados en la sesión actual.
         * @default 0
         * @persistence Se guarda en Chrome Storage para mantener entre sesiones
         */
        contador: 0,
        
        // ═════════════════════════════════════════════════════════════════════════
        // 🖱️ ESTADO DE INTERFAZ ARRASTRABLE
        // ═════════════════════════════════════════════════════════════════════════
        
        /**
         * @property {boolean} isDragging
         * @description Indica si la interfaz está siendo arrastrada actualmente.
         * @default false
         * @usage Usado por DragModule para gestionar eventos de arrastre
         */
        isDragging: false,
        
        /**
         * @property {number} currentX
         * @description Posición X actual durante el arrastre.
         * @default 0
         * @units Píxeles relativos al viewport
         */
        currentX: 0,
        
        /**
         * @property {number} currentY
         * @description Posición Y actual durante el arrastre.
         * @default 0
         * @units Píxeles relativos al viewport
         */
        currentY: 0,
        
        /**
         * @property {number} initialX
         * @description Posición X inicial cuando comenzó el arrastre.
         * @default 0
         * @usage Usado para calcular desplazamientos relativos
         */
        initialX: 0,
        
        /**
         * @property {number} initialY
         * @description Posición Y inicial cuando comenzó el arrastre.
         * @default 0
         * @usage Usado para calcular desplazamientos relativos
         */
        initialY: 0,
        
        /**
         * @property {number} xOffset
         * @description Desplazamiento total acumulado en X.
         * @default 0
         * @persistence Se guarda en storage para restaurar posición
         */
        xOffset: 0,
        
        /**
         * @property {number} yOffset
         * @description Desplazamiento total acumulado en Y.
         * @default 0
         * @persistence Se guarda en storage para restaurar posición
         */
        yOffset: 0,
        
        // ═════════════════════════════════════════════════════════════════════════
        // 💬 SISTEMA DE REACTIVACIÓN POR CHAT
        // ═════════════════════════════════════════════════════════════════════════
        
        /**
         * @property {number|null} chatTimeout
         * @description ID del timeout para reactivación automática tras chat.
         * @default null
         * @cleanup Se limpia automáticamente al ejecutarse o cancelarse
         */
        chatTimeout: null,
        
        /**
         * @property {number} tiempoReactivacion
         * @description Tiempo en segundos para reactivación automática tras chat.
         * @default 10
         * @range 10-60 segundos
         * @configurable Usuario puede modificar desde interfaz
         */
        tiempoReactivacion: 10,
        
        /**
         * @property {boolean} pausadoPorChat
         * @description Indica si el sistema está pausado por interacción con chat.
         * @default false
         * @critical Estado crítico que afecta toda la automatización
         */
        pausadoPorChat: false,
        
        /**
         * @property {boolean} apagadoManualmente
         * @description Indica si el usuario desactivó manualmente la extensión.
         * @default false
         * @purpose Evita reactivación automática cuando el usuario lo desactivó
         */
        apagadoManualmente: false,
        
        // ═════════════════════════════════════════════════════════════════════════
        // 🔔 SISTEMA DE NOTIFICACIONES
        // ═════════════════════════════════════════════════════════════════════════
        
        /**
         * @property {HTMLElement|null} notificacionCuentaRegresiva
         * @description Referencia al elemento DOM de la notificación de cuenta regresiva.
         * @default null
         * @lifecycle Se crea/destruye dinámicamente durante cuenta regresiva
         */
        notificacionCuentaRegresiva: null,
        
        /**
         * @property {Function|null} limpiarCuentaRegresiva
         * @description Función de limpieza para la cuenta regresiva actual.
         * @default null
         * @usage Llamada para cancelar cuenta regresiva activa
         */
        limpiarCuentaRegresiva: null,
        
        // ═════════════════════════════════════════════════════════════════════════
        // 🤖 MODO HUMANO AVANZADO
        // ═════════════════════════════════════════════════════════════════════════
        
        /**
         * @property {Object} modoHumano
         * @description Configuración completa del modo humano con comportamiento aleatorio.
         * 
         * @property {boolean} modoHumano.activo
         * @description Si el modo humano está actualmente activo.
         * @default false
         * 
         * @property {number} modoHumano.frecuenciaSesion
         * @description Duración en ms de una sesión activa de modo humano.
         * @range 27500-78350 ms (27.5-78.35 segundos)
         * @random Se genera aleatoriamente en cada sesión
         * 
         * @property {number} modoHumano.frecuenciaTapTap
         * @description Intervalo en ms entre tap-taps durante sesión activa.
         * @range 200-485 ms
         * @random Se genera aleatoriamente en cada sesión
         * 
         * @property {number} modoHumano.cooldownSesion
         * @description Duración en ms del cooldown entre sesiones.
         * @range 3565-9295 ms (3.5-9.3 segundos)
         * @random Se genera aleatoriamente en cada sesión
         * 
         * @property {boolean} modoHumano.enSesion
         * @description Si actualmente está en una sesión activa (vs cooldown).
         * @default false
         * 
         * @property {number} modoHumano.tiempoSesionRestante
         * @description Tiempo restante en ms de la sesión actual.
         * @default 0
         * @usage Para reanudar correctamente tras pausas por chat
         * 
         * @property {number} modoHumano.tiempoCooldownRestante
         * @description Tiempo restante en ms del cooldown actual.
         * @default 0
         * @usage Para reanudar correctamente tras pausas por chat
         * 
         * @property {boolean} modoHumano.pausadoPorChat
         * @description Si el modo humano específicamente está pausado por chat.
         * @default false
         * @separate Del pausadoPorChat general para lógica específica
         * 
         * @property {number|null} modoHumano.timerSesion
         * @description ID del timer de la sesión activa.
         * @default null
         * 
         * @property {number|null} modoHumano.timerCooldown
         * @description ID del timer del cooldown.
         * @default null
         * 
         * @property {number|null} modoHumano.inicioSesion
         * @description Timestamp de inicio de la sesión actual.
         * @default null
         * @usage Para calcular tiempo transcurrido y restante
         * 
         * @property {number|null} modoHumano.inicioCooldown
         * @description Timestamp de inicio del cooldown actual.
         * @default null
         * @usage Para calcular tiempo transcurrido y restante
         */
        modoHumano: {
            activo: false,
            frecuenciaSesion: 0,
            frecuenciaTapTap: 0,
            cooldownSesion: 0,
            enSesion: false,
            tiempoSesionRestante: 0,
            tiempoCooldownRestante: 0,
            pausadoPorChat: false,
            timerSesion: null,
            timerCooldown: null,
            inicioSesion: null,
            inicioCooldown: null
        },
        
        // ═════════════════════════════════════════════════════════════════════════
        // 🔧 REFERENCIAS ADICIONALES
        // ═════════════════════════════════════════════════════════════════════════
        
        /**
         * @property {Object|null} chatObserver
         * @description Instancia del MutationObserver para detectar aparición del chat.
         * @default null
         * @lifecycle Se crea al inicializar y se limpia al salir de Live
         */
        chatObserver: null,
        
        /**
         * @property {Function|null} chatCleanup
         * @description Función de limpieza para eventos del chat.
         * @default null
         * @usage Llamada para remover event listeners del chat
         */
        chatCleanup: null,
        
        /**
         * @property {number|null} navigationCheckInterval
         * @description ID del intervalo de verificación de navegación.
         * @default null
         * @purpose Detectar cuando el usuario sale de páginas Live
         */
        navigationCheckInterval: null,
        
        /**
         * @property {MutationObserver|null} urlObserver
         * @description Observer para detectar cambios de URL en SPA.
         * @default null
         * @purpose Detectar navegación sin recarga de página
         */
        urlObserver: null
    };
    
    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * ⏰ MÓDULO DE GESTIÓN DE TIMERS
     * ═══════════════════════════════════════════════════════════════════════════════
     * 
     * @module TimerModule
     * @description Módulo centralizado para la gestión segura y eficiente de todos
     *              los timers, timeouts e intervalos utilizados por la extensión.
     *              Previene memory leaks y proporciona cleanup centralizado.
     * 
     * @purpose
     * En una extensión compleja como esta, múltiples módulos crean y gestionan
     * timers. Sin una gestión centralizada, es fácil que se produzcan memory leaks
     * o timers órfanos que continúan ejecutándose después de que deberían haber
     * sido limpiados.
     * 
     * @benefits
     * • Prevención de memory leaks
     * • Cleanup centralizado y confiable
     * • Debugging simplificado de timers activos
     * • Gestión de lifecycle consistente
     * • Prevención de timers duplicados
     * 
     * @timer-categories
     * ┌─────────────────────────────────────────────────────────────────────────┐
     * │ CATEGORÍAS DE TIMERS                                                    │
     * ├─────────────────────────────────────────────────────────────────────────┤
     * │                                                                         │
     * │ ⌨️  typing          → Timer de inactividad del chat                     │
     * │ 💬 chat            → Timeout general del sistema de chat                │
     * │ ⏱️  countdown       → Timer de cuenta regresiva visual                  │
     * │ 🔄 cuentaRegresiva → Timer específico de reactivación                   │
     * │ 🤖 modoHumanoSesion → Timer de sesión activa del modo humano            │
     * │ 😴 modoHumanoCooldown → Timer de cooldown del modo humano               │
     * │                                                                         │
     * └─────────────────────────────────────────────────────────────────────────┘
     * 
     * @architecture
     * Utiliza un Map central para rastrear todos los timers por categoría,
     * permitiendo limpieza selectiva o total según las necesidades.
     * 
     * @thread-safety
     * • Operaciones atómicas para evitar race conditions
     * • Validación de existencia antes de cleanup
     * • Manejo seguro de IDs nulos o inválidos
     */
    const TimerModule = {
        /**
         * @property {Object} timers
         * @description Registro central de todos los timers activos categorizados.
         * 
         * @structure
         * Cada propiedad mantiene el ID retornado por setTimeout/setInterval,
         * o null cuando no hay timer activo de esa categoría.
         * 
         * @lifecycle
         * • Se asigna un ID cuando se crea el timer
         * • Se establece a null cuando se limpia
         * • Se valida antes de cualquier operación de cleanup
         */
        timers: {
            /**
             * @property {number|null} typing
             * @description Timer para detectar inactividad en el chat.
             * @usage ChatModule lo usa para detectar cuando el usuario deja de escribir
             */
            typing: null,
            
            /**
             * @property {number|null} chat
             * @description Timeout general del sistema de chat.
             * @usage Para reactivación automática después de interacción con chat
             */
            chat: null,
            
            /**
             * @property {number|null} countdown
             * @description Timer de cuenta regresiva visual genérica.
             * @usage NotificationModule para mostrar cuenta regresiva visual
             */
            countdown: null,
            
            /**
             * @property {number|null} cuentaRegresiva
             * @description Timer específico de cuenta regresiva para reactivación.
             * @usage Sistema de reactivación automática tras pausa por chat
             */
            cuentaRegresiva: null,
            
            /**
             * @property {number|null} modoHumanoSesion
             * @description Timer que controla la duración de sesiones activas en modo humano.
             * @usage ModoHumanoModule para gestionar sesiones de tap-taps aleatorios
             */
            modoHumanoSesion: null,
            
            /**
             * @property {number|null} modoHumanoCooldown
             * @description Timer que controla los cooldowns entre sesiones de modo humano.
             * @usage ModoHumanoModule para simular pausas naturales humanas
             */
            modoHumanoCooldown: null
        },
        
        /**
         * Ejecuta limpieza completa de todos los timers activos
         * 
         * @method cleanupAll
         * @description Realiza una limpieza exhaustiva de todos los timers registrados
         *              en el sistema. Es el método principal para cleanup durante
         *              shutdown o cambio de contexto.
         * 
         * @algorithm
         * 1. Iterar sobre todas las entradas del objeto timers
         * 2. Para cada timer con un ID válido:
         *    - Intentar clearTimeout() (funciona para ambos tipos)
         *    - Intentar clearInterval() (por seguridad)
         *    - Establecer la referencia a null
         * 3. Ejecutar limpieza especializada de modo humano
         * 4. Limpiar sistema de notificaciones
         * 
         * @safety
         * • clearTimeout y clearInterval son operaciones seguras con IDs inválidos
         * • Múltiples llamadas son seguras (operaciones idempotentes)
         * • No lanza excepciones por timers ya limpiados
         * 
         * @side-effects
         * • Detiene todos los timers activos inmediatamente
         * • Puede interrumpir operaciones en progreso
         * • Limpia referencias en StateModule.modoHumano
         * • Ejecuta NotificationModule.limpiarCuentaRegresiva()
         * 
         * @usage
         * • Llamado durante NavigationModule.cleanupExtensionResources()
         * • Ejecutado en ExtensionModule.reload()
         * • Usado en InitModule cleanup defensivo
         * • Invocado durante shutdown completo
         * 
         * @performance O(n) donde n = número de categorías de timers
         * @thread-safety Thread-safe para operaciones de cleanup
         */
        cleanupAll() {
            console.log('🧹 Ejecutando cleanup completo de timers...');
            
            // Limpiar todos los timers registrados
            Object.entries(this.timers).forEach(([key, timer]) => {
                if (typeof timer === 'number') {
                    // Limpiar tanto timeouts como intervals por seguridad
                    clearTimeout(timer);
                    clearInterval(timer);
                    this.timers[key] = null;
                }
            });
            
            // Limpieza especializada del modo humano
            if (StateModule.modoHumano && StateModule.modoHumano.activo) {
                console.log('🧹 Limpiando modo humano durante cleanup de timers');
                ModoHumanoModule.limpiar();
            }
            
            // Limpiar sistema de notificaciones relacionado con timers
            NotificationModule.limpiarCuentaRegresiva();
        }
    };
    
    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 💾 MÓDULO DE ALMACENAMIENTO SEGURO
     * ═══════════════════════════════════════════════════════════════════════════════
     * 
     * @module StorageModule
     * @description Módulo especializado en operaciones seguras y robustas con
     *              Chrome Storage API. Proporciona una capa de abstracción que
     *              maneja errores, validaciones y reconexión automática.
     * 
     * @purpose
     * Chrome Storage API puede fallar por múltiples razones: contexto invalidado,
     * límites de cuota, extensión deshabilitada, etc. Este módulo encapsula
     * toda la lógica de manejo de errores y recuperación automática.
     * 
     * @features
     * • Validación de contexto antes de operaciones
     * • Manejo robusto de errores de Chrome Runtime
     * • Reconexión automática cuando el contexto se invalida
     * • Operaciones con timeout para evitar colgarse
     * • Logging detallado para debugging
     * • Fallbacks seguros en caso de fallos
     * 
     * @error-handling
     * ┌─────────────────────────────────────────────────────────────────────────┐
     * │ TIPOS DE ERRORES MANEJADOS                                              │
     * ├─────────────────────────────────────────────────────────────────────────┤
     * │                                                                         │
     * │ 🔌 Extension context invalidated                                        │
     * │    → Activar ExtensionModule.reload()                                   │
     * │                                                                         │
     * │ 📡 Message channel closed                                               │
     * │    → Intentar reconexión automática                                     │
     * │                                                                         │
     * │ 🚫 Chrome runtime not available                                         │
     * │    → Fallar silenciosamente con warning                                 │
     * │                                                                         │
     * │ 🌐 CORS Policy errors                                                   │
     * │    → Ignorar (operación en contexto válido)                             │
     * │                                                                         │
     * │ 💽 Quota exceeded                                                       │
     * │    → Log error y continuar                                              │
     * │                                                                         │
     * └─────────────────────────────────────────────────────────────────────────┘
     * 
     * @storage-keys
     * • intervalo: Velocidad seleccionada (200, 250, 500, 1000, 0)
     * • totalTapTaps: Contador total de tap-taps
     * • position: {x, y} Posición de la interfaz flotante
     * • tiempoReactivacion: Segundos para reactivación tras chat
     * 
     * @api-wrapper
     * Este módulo actúa como wrapper de chrome.storage.local proporcionando:
     * • Promesas en lugar de callbacks
     * • Validación automática de contexto
     * • Manejo uniforme de errores
     * • Logging y debugging mejorado
     */
    const StorageModule = {
        /**
         * Ejecuta una operación de almacenamiento de forma segura
         * 
         * @method safeOperation
         * @description Wrapper que proporciona seguridad y validación para todas
         *              las operaciones de almacenamiento. Verifica el contexto,
         *              maneja errores y activa recuperación cuando es necesario.
         * 
         * @param {Function} operation - Función que realiza la operación de storage
         * @returns {Promise} Promesa que resuelve con el resultado o rechaza con error
         * 
         * @validation
         * Antes de ejecutar cualquier operación, verifica que estemos en un
         * contexto válido (TikTok Live) para evitar operaciones innecesarias
         * o problemáticas en páginas incorrectas.
         * 
         * @error-recovery
         * Si detecta errores específicos del contexto de extensión invalidado,
         * automáticamente activa el sistema de reconexión a través de
         * ExtensionModule.reload().
         * 
         * @example
         * const resultado = await StorageModule.safeOperation(() => {
         *     return chrome.storage.local.get(['key']);
         * });
         * 
         * @throws {Error} 'Not on TikTok Live page' si el contexto no es válido
         * @throws {Error} Errores propagados de la operación si no son recuperables
         */
        safeOperation(operation) {
            // Validación previa de contexto
            if (!ContextModule.isOnTikTokLive()) {
                console.warn('🚫 Operación de almacenamiento cancelada: No estamos en un Live de TikTok');
                return Promise.reject(new Error('Not on TikTok Live page'));
            }
            
            try {
                return operation();
            } catch (error) {
                console.warn('Error en operación de almacenamiento:', error);
                
                // Recuperación automática para errores de contexto
                if (error.message.includes('Extension context invalidated')) {
                    ExtensionModule.reload();
                }
                
                return Promise.reject(error);
            }
        },
        
        /**
         * Guarda datos en el almacenamiento local de Chrome
         * 
         * @method save
         * @description Persiste datos de forma segura en chrome.storage.local con
         *              manejo robusto de errores y validación de contexto.
         * 
         * @param {Object} data - Objeto con los datos a guardar
         * @returns {Promise<void>} Promesa que resuelve cuando se completa el guardado
         * 
         * @implementation
         * Utiliza el patrón Promise con callback clásico de Chrome API,
         * proporcionando una interfaz moderna de Promesas para el resto
         * de la aplicación.
         * 
         * @error-handling
         * • Verifica chrome.runtime.lastError después de la operación
         * • Rechaza la promesa si hay errores
         * • Resuelve sin valor si la operación es exitosa
         * 
         * @example
         * await StorageModule.save({
         *     intervalo: 200,
         *     contador: 150,
         *     position: { x: 100, y: 50 }
         * });
         * 
         * @performance
         * • Operación asíncrona no bloqueante
         * • Almacenamiento local (más rápido que sync)
         * • Batch de múltiples propiedades en una sola llamada
         */
        save(data) {
            return this.safeOperation(() => {
                return new Promise((resolve, reject) => {
                    chrome.storage.local.set(data, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });
            });
        },
        
        /**
         * Obtiene datos del almacenamiento local de Chrome
         * 
         * @method get
         * @description Recupera datos guardados de forma segura desde chrome.storage.local
         *              con manejo de errores y fallbacks apropiados.
         * 
         * @param {Array<string>|string} keys - Clave(s) a recuperar del almacenamiento
         * @returns {Promise<Object>} Promesa que resuelve con los datos recuperados
         * 
         * @implementation
         * Convierte la API de callback de Chrome en una Promise moderna,
         * facilitando el uso con async/await en el resto de la aplicación.
         * 
         * @fallback-behavior
         * Si una clave no existe en el almacenamiento, Chrome Storage devuelve
         * un objeto vacío para esa clave. Este comportamiento se mantiene
         * para consistencia con la API nativa.
         * 
         * @example
         * // Obtener una sola clave
         * const result = await StorageModule.get('intervalo');
         * console.log(result.intervalo); // 200 o undefined
         * 
         * // Obtener múltiples claves
         * const data = await StorageModule.get(['intervalo', 'contador', 'position']);
         * console.log(data); // { intervalo: 200, contador: 150, position: {...} }
         * 
         * @performance
         * • Operación asíncrona optimizada
         * • Recuperación batch de múltiples claves
         * • Almacenamiento local (acceso rápido)
         * 
         * @error-propagation
         * Los errores se propagan hacia arriba para ser manejados por el
         * código que llama, permitiendo decisiones contextuales sobre
         * cómo manejar fallos de recuperación.
         */
        get(keys) {
            return this.safeOperation(() => {
                return new Promise((resolve, reject) => {
                    chrome.storage.local.get(keys, (result) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });
        }
    };
    
    /**
     * ═══════════════════════════════════════════════════════════════════════════════
     * 📡 MÓDULO DE MENSAJERÍA
     * ═══════════════════════════════════════════════════════════════════════════════
     * 
     * @module MessagingModule
     * @description Módulo especializado en la comunicación bidireccional entre el
     *              content script y el background script. Maneja el protocolo de
     *              mensajes, errores de conexión y modos de operación diferenciados.
     * 
     * @purpose
     * La comunicación entre content script y background script es fundamental para:
     * • Sincronizar estado con el popup de la extensión
     * • Actualizar el badge del icono en tiempo real
     * • Persistir configuraciones globales
     * • Coordinar acciones entre diferentes tabs
     * • Manejar reconexión cuando el contexto se invalida
     * 
     * @architecture
     * ┌─────────────────────────────────────────────────────────────────────────┐
     * │ ARQUITECTURA DE COMUNICACIÓN                                            │
     * ├─────────────────────────────────────────────────────────────────────────┤
     * │                                                                         │
     * │ Content Script ←→ Background Script ←→ Popup                            │
     * │                                                                         │
     * │ • sendMessage()     → Envío seguro con timeout                          │
     * │ • messageListener   → Recepción y procesamiento                         │
     * │ • setupBasicListener() → Modo básico para páginas no-Live               │
     * │ • setupFullListener()  → Modo completo para TikTok Live                 │
     * │                                                                         │
     * └─────────────────────────────────────────────────────────────────────────┘
     * 
     * @protocol
     * MENSAJES ENVIADOS AL BACKGROUND:
     * • started: { action, contador, enTikTok, enLive }
     * • stopped: { action, enTikTok, enLive }
     * • paused_by_chat: { action, enTikTok, enLive }
     * • reactivated_from_chat: { action, contador, enTikTok, enLive }
     * • updateContext: { action, enTikTok, enLive }
     * • updateTapTaps: { action, count, enTikTok, enLive }
     * 
     * MENSAJES RECIBIDOS DEL POPUP:
     * • getStatus: → Retorna estado actual completo
     * • toggle: → Activa/desactiva automatización
     * • updateReactivationTime: { tiempo } → Cambia tiempo de reactivación
     * • updateTapTaps: { count } → Sincroniza contador
     * 
     * @error-handling
     * • Extension context invalidated → ExtensionModule.reload()
     * • Message channel closed → Reconexión automática
     * • CORS policy errors → Ignorar silenciosamente
     * • Timeout en mensajes → Reject con error específico
     * • Background script no disponible → Fallback seguro
     * 
     * @reliability
     * • Timeout de 1 segundo para evitar colgarse
     * • Validación de contexto antes de enviar
     * • Reconexión automática en errores críticos
     * • Fallbacks seguros para todos los escenarios
     */
    const MessagingModule = {
        /**
         * @property {Function|null} messageListener
         * @description Referencia al listener de mensajes activo para permitir
         *              su remoción durante reconfiguración o cleanup.
         * @lifecycle Se establece en setupFullListener/setupBasicListener
         */
        messageListener: null,
        
        /**
         * Envía un mensaje seguro al background script
         * 
         * @method sendMessage
         * @description Envía mensajes al background script con manejo robusto de
         *              errores, timeout automático y reconexión en caso de fallos.
         *              Es el método principal para comunicación content → background.
         * 
         * @param {Object} message - Objeto mensaje a enviar al background script
         * @param {string} message.action - Acción específica a ejecutar
         * @param {...*} message[key] - Propiedades adicionales según la acción
         * @returns {Promise<Object>} Promesa que resuelve con la respuesta del background
         * 
         * @algorithm
         * 1. Validar contexto (solo TikTok Live para modo completo)
         * 2. Configurar timeout de 1 segundo para evitar colgarse
         * 3. Enviar mensaje usando chrome.runtime.sendMessage
         * 4. Manejar errores específicos con recuperación automática
         * 5. Procesar respuesta y validar formato
         * 6. Resolver/rechazar promesa según resultado
         * 
         * @error-recovery
         * EXTENSION CONTEXT INVALIDATED:
         * • Activa ExtensionModule.reload() automáticamente
         * • Intenta reconectar la extensión
         * 
         * MESSAGE CHANNEL CLOSED:
         * • Activa ExtensionModule.reload() automáticamente
         * • Indica que el background script se desconectó
         * 
         * CORS POLICY ERRORS:
         * • Se ignoran silenciosamente (false positive)
         * • Común en ciertos contextos de TikTok
         * 
         * @timeout
         * Implementa timeout de 1000ms para evitar que la aplicación se cuelgue
         * esperando respuestas que nunca llegarán debido a contextos invalidados.
         * 
         * @example
         * // Notificar inicio de automatización
         * await MessagingModule.sendMessage({
         *     action: 'started',
         *     contador: 150,
         *     enTikTok: true,
         *     enLive: true
         * });
         * 
         * // Actualizar contexto tras navegación
         * await MessagingModule.sendMessage({
         *     action: 'updateContext',
         *     enTikTok: false,
         *     enLive: false
         * });
         * 
         * @performance
         * • Timeout de 1s previene bloqueos indefinidos
         * • Validación temprana evita llamadas innecesarias
         * • Manejo eficiente de errores comunes
         * 
         * @thread-safety
         * Cada llamada es independiente con su propio timeout y error handling.
         * No hay estado compartido que pueda causar race conditions.
         */
        sendMessage(message) {
            return new Promise((resolve, reject) => {
                // Validación de contexto para mensajes desde modo completo
                if (!ContextModule.isOnTikTokLive()) {
                    console.warn('🚫 Mensaje cancelado: No estamos en un Live de TikTok');
                    resolve({});
                    return;
                }
                
                // Configurar timeout para evitar colgarse
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout al enviar mensaje'));
                }, 1000);

                try {
                    chrome.runtime.sendMessage(message, response => {
                        clearTimeout(timeout);

                        // Manejar errores de Chrome Runtime
                        if (chrome.runtime.lastError) {
                            const error = chrome.runtime.lastError;
                            
                            // Errores críticos que requieren reconexión
                            if (error.message.includes('Extension context invalidated') ||
                                error.message.includes('message channel closed')) {
                                ExtensionModule.reload();
                            }
                            
                            // Ignorar errores de CORS (false positives en TikTok)
                            if (!error.message.includes('CORS')) {
                                reject(error);
                            } else {
                                resolve({});
                            }
                            return;
                        }

                        // Manejar respuesta vacía (background no disponible)
                        if (!response) {
                            resolve({});
                            return;
                        }

                        // Procesar errores en la respuesta
                        if (response.error) {
                            console.warn('🚨 Background script respondió con error:', response.error);
                            
                            // Errores conocidos que no requieren rechazo
                            if (response.error.includes('Acción no reconocida')) {
                                resolve({ error: response.error, handled: true });
                                return;
                            }
                            
                            reject(new Error(response.error));
                            return;
                        }

                        // Respuesta exitosa
                        resolve(response);
                    });
                } catch (error) {
                    clearTimeout(timeout);
                    console.warn('Error al enviar mensaje:', error);
                    
                    // Ignorar errores de CORS también en catch
                    if (!error.message.includes('CORS')) {
                        reject(error);
                    } else {
                        resolve({});
                    }
                }
            });
        },
        
        /**
         * Configura el listener básico de mensajes para páginas no-Live
         * 
         * @method setupBasicListener
         * @description Establece un listener minimalista para responder consultas
         *              del popup cuando estamos en páginas de TikTok que no son Live.
         *              Permite que el popup funcione mostrando estado inactivo.
         * 
         * @purpose
         * Cuando el usuario está en TikTok pero no en una página Live, el popup
         * aún necesita consultar el estado para mostrar información coherente.
         * Este listener proporciona respuestas básicas sin activar funcionalidad.
         * 
         * @functionality
         * MENSAJES SOPORTADOS:
         * • getStatus → Responde con estado inactivo y contexto parcial
         * • Cualquier otra acción → Error indicando que necesita ir a Live
         * 
         * @responses
         * getStatus Response:
         * {
         *   activo: false,
         *   contador: 0,
         *   tiempoReactivacion: 10,
         *   pausadoPorChat: false,
         *   enTikTok: true,
         *   enLive: false
         * }
         * 
         * Other Actions Response:
         * {
         *   error: 'Funcionalidad no disponible. Ve a una página Live de TikTok.'
         * }
         * 
         * @error-handling
         * • Try-catch completo para prevenir fallos
         * • Respuestas de error descriptivas
         * • Logging detallado para debugging
         * 
         * @example
         * // En página https://www.tiktok.com/@usuario (no Live)
         * // Popup consulta estado
         * // → Recibe { activo: false, enTikTok: true, enLive: false }
         */
        setupBasicListener() {
            console.log('🔧 Configurando sistema de mensajería básico...');
            
            const basicMessageListener = (request, sender, sendResponse) => {
                try {
                    if (request.action === 'getStatus') {
                        console.log('📡 Popup consultó estado - Respondiendo con estado inactivo (página TikTok no-Live)');
                        
                        sendResponse({
                            activo: false,
                            contador: 0,
                            tiempoReactivacion: 10,
                            pausadoPorChat: false,
                            enTikTok: true,
                            enLive: false
                        });
                        return true;
                    }
                    
                    if (request.action) {
                        console.log(`❌ Acción '${request.action}' no disponible en modo básico`);
                        sendResponse({ 
                            error: 'Funcionalidad no disponible. Ve a una página Live de TikTok.' 
                        });
                        return true;
                    }
                    
                    console.log('🤷 Mensaje no reconocido en modo básico:', request);
                    
                } catch (error) {
                    console.error('Error en listener básico:', error);
                    sendResponse({ error: 'Error interno del content script' });
                }
                
                return true;
            };
            
            chrome.runtime.onMessage.addListener(basicMessageListener);
            console.log('✅ Sistema de mensajería básico configurado correctamente');
        },
        
        /**
         * Configura el listener completo de mensajes para páginas Live
         * 
         * @method setupFullListener
         * @description Establece el sistema completo de mensajería para cuando estamos
         *              en una página Live de TikTok. Soporta todas las funcionalidades
         *              y mantiene sincronización completa con popup y background.
         * 
         * @purpose
         * Este es el listener principal que maneja toda la comunicación durante
         * el funcionamiento normal de la extensión en páginas Live, incluyendo
         * consultas de estado, comandos de control y sincronización de datos.
         * 
         * @message-handling
         * ┌─────────────────────────────────────────────────────────────────────────┐
         * │ ACCIONES SOPORTADAS                                                     │
         * ├─────────────────────────────────────────────────────────────────────────┤
         * │                                                                         │
         * │ getStatus               → Estado completo actual                        │
         * │ toggle                  → Activar/desactivar automatización             │
         * │ updateReactivationTime  → Cambiar tiempo de reactivación (10-60s)       │
         * │ updateTapTaps          → Sincronizar contador de tap-taps               │
         * │                                                                         │
         * └─────────────────────────────────────────────────────────────────────────┘
         * 
         * @state-synchronization
         * getStatus devuelve el estado completo:
         * {
         *   activo: boolean,           // Si automatización está activa
         *   contador: number,          // Tap-taps realizados
         *   tiempoReactivacion: number, // Segundos para reactivar tras chat
         *   pausadoPorChat: boolean,   // Si está pausado por chat
         *   enTikTok: true,           // Siempre true en modo completo
         *   enLive: true              // Siempre true en modo completo
         * }
         * 
         * @validation
         * • updateReactivationTime: valida rango 10-60 segundos
         * • updateTapTaps: valida que count sea number válido
         * • toggle: sin validación adicional (delegado a AutomationModule)
         * 
         * @error-handling
         * • Try-catch completo alrededor de todo el procesamiento
         * • Respuestas de error específicas para cada validación
         * • Logging detallado para debugging
         * • Siempre retorna true para mantener canal abierto
         * 
         * @integration
         * • AutomationModule.toggle() para control principal
         * • StateModule para sincronización de estado
         * • UIModule.elementos para actualizar interfaz
         * • Storage automático de configuraciones
         * 
         * @performance
         * • Validaciones rápidas antes de operaciones costosas
         * • Respuestas síncronas cuando es posible
         * • Delegación eficiente a módulos especializados
         */
        setupFullListener() {
            console.log('🔧 Configurando event listeners y sistema de mensajería...');
            
            // Remover listener anterior si existe
            if (this.messageListener) {
                chrome.runtime.onMessage.removeListener(this.messageListener);
            }
            
            this.messageListener = (request, sender, sendResponse) => {
                try {
                    console.log('📨 Mensaje recibido:', request);
                    
                    switch (request.action) {
                        case 'getStatus':
                            sendResponse({
                                activo: StateModule.activo,
                                contador: StateModule.contador,
                                tiempoReactivacion: StateModule.tiempoReactivacion,
                                pausadoPorChat: StateModule.pausadoPorChat,
                                enTikTok: true,
                                enLive: true
                            });
                            break;
                            
                        case 'toggle':
                            AutomationModule.toggle();
                            sendResponse({ success: true });
                            break;
                            
                        case 'updateReactivationTime':
                            if (request.tiempo && request.tiempo >= 10 && request.tiempo <= 60) {
                                StateModule.tiempoReactivacion = request.tiempo;
                                if (UIModule.elementos.reactivacionInput) {
                                    UIModule.elementos.reactivacionInput.value = request.tiempo;
                                }
                                sendResponse({ success: true });
                            } else {
                                sendResponse({ error: 'Tiempo inválido' });
                            }
                            break;
                            
                        case 'updateTapTaps':
                            if (request.hasOwnProperty('count') && typeof request.count === 'number') {
                                StateModule.contador = request.count;
                                UIModule.actualizarContador();
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
                
                return true; // Mantener canal de mensaje abierto
            };
            
            chrome.runtime.onMessage.addListener(this.messageListener);
            console.log('✅ Sistema de mensajería configurado correctamente');
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE AUTOMATIZACIÓN
     * =============================================================================
     * 
     * Maneja la lógica principal de automatización de tap-taps
     */
    const AutomationModule = {
        /**
         * Simula un tap-tap presionando la tecla L
         */
        presionarL() {
            const evento = new KeyboardEvent('keydown', {
                key: 'l',
                code: 'KeyL',
                keyCode: 76,
                which: 76,
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(evento);
            StateModule.contador++;
            UIModule.actualizarContador();
            
            setTimeout(() => {
                this.guardarEstadisticas();
                
                MessagingModule.sendMessage({ 
                    action: 'updateTapTaps', 
                    count: StateModule.contador,
                    enTikTok: true,
                    enLive: true
                }).catch(error => {
                    if (!error.message.includes('Extension context invalidated') && 
                        !error.message.includes('message channel closed') &&
                        !error.message.includes('CORS')) {
                        console.warn('Error al actualizar contador:', error);
                    }
                });
            }, 0);
        },
        
        /**
         * Guarda las estadísticas en el almacenamiento
         */
        async guardarEstadisticas() {
            try {
                const result = await StorageModule.get(['totalTapTaps']);
                await StorageModule.save({ 
                    totalTapTaps: (result.totalTapTaps || 0) + 1 
                });
            } catch (error) {
                console.warn('Error guardando estadísticas:', error);
            }
        },
        
        /**
         * Alterna el estado de la automatización
         * @param {boolean} fromChat - Si viene del sistema de chat
         */
        toggle(fromChat = false) {
            console.log('🔄 Toggle Auto Tap-Tap:', {
                fromChat,
                estadoActual: StateModule.activo,
                pausadoPorChat: StateModule.pausadoPorChat,
                apagadoManualmente: StateModule.apagadoManualmente
            });

            if (!fromChat) {
                StateModule.apagadoManualmente = StateModule.activo;
            }
            
            const nuevoEstado = !StateModule.activo;
            
            if (StateModule.intervalo) {
                console.log('🧹 Limpiando intervalo existente');
                IntervalModule.clear(StateModule.intervalo);
                StateModule.intervalo = null;
            }
            
            StateModule.activo = nuevoEstado;
            
            if (nuevoEstado) {
                this.activar(fromChat);
            } else {
                this.desactivar();
            }

            console.log('Estado final:', {
                activo: StateModule.activo,
                pausadoPorChat: StateModule.pausadoPorChat,
                apagadoManualmente: StateModule.apagadoManualmente,
                tieneIntervalo: !!StateModule.intervalo
            });
        },
        
        /**
         * Activa la automatización
         * @param {boolean} fromChat - Si viene del sistema de chat
         */
        activar(fromChat) {
            console.log('✨ Activando Auto Tap-Tap');
            const intervalo = parseInt(UIModule.elementos.selector.value);
            UIModule.elementos.selector.disabled = true;
            UIModule.elementos.selector.style.opacity = '0.5';
            
            UIModule.actualizarColoresBoton();
            
            StateModule.apagadoManualmente = false;
            
            if (!fromChat && StateModule.pausadoPorChat) {
                console.log('🔄 Reactivación manual desde pausa por chat');
                StateModule.pausadoPorChat = false;
                TimerModule.cleanupAll();
                
                if (StateModule.limpiarCuentaRegresiva && typeof StateModule.limpiarCuentaRegresiva === 'function') {
                    StateModule.limpiarCuentaRegresiva();
                }
            }
            
            if (!StateModule.pausadoPorChat) {
                if (intervalo === 0) {
                    console.log('🤖 Activando Modo Humano...');
                    StateModule.modoHumano.activo = true;
                    ModoHumanoModule.generarVariables();
                    ModoHumanoModule.iniciarSesion();
                    
                    NotificationModule.agregar('🤖 Modo Humano activado con variables aleatorias', 'success', 4000);
                } else {
                    console.log('🚀 Iniciando intervalo de tap-taps normal');
                    this.presionarL();
                    StateModule.intervalo = IntervalModule.create(() => this.presionarL(), intervalo);
                }
                
                MessagingModule.sendMessage({ 
                    action: 'started',
                    contador: StateModule.contador,
                    enTikTok: true,
                    enLive: true
                }).catch(error => console.warn('Error al notificar estado:', error));
            } else {
                console.log('⏸️ No se inicia intervalo - pausado por chat');
            }
        },
        
        /**
         * Desactiva la automatización
         */
        desactivar() {
            console.log('🛑 Desactivando Auto Tap-Tap');
            
            if (StateModule.modoHumano.activo) {
                console.log('🧹 Limpiando modo humano por desactivación manual');
                ModoHumanoModule.limpiar();
            }
            
            UIModule.elementos.selector.disabled = false;
            UIModule.elementos.selector.style.opacity = '1';
            
            UIModule.actualizarColoresBoton();
            
            MessagingModule.sendMessage({ 
                action: 'stopped',
                enTikTok: true,
                enLive: true
            }).catch(error => console.warn('Error al notificar estado:', error));
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE GESTIÓN DE INTERVALOS
     * =============================================================================
     * 
     * Gestiona los intervalos de forma segura
     */
    const IntervalModule = {
        intervals: new Map(),
        
        /**
         * Crea un nuevo intervalo seguro
         * @param {Function} callback - Función a ejecutar
         * @param {number} delay - Tiempo entre ejecuciones
         * @returns {number} ID del intervalo
         */
        create(callback, delay) {
            const id = setInterval(callback, delay);
            this.intervals.set(id, { callback, delay });
            return id;
        },
        
        /**
         * Limpia un intervalo específico
         * @param {number} id - ID del intervalo
         */
        clear(id) {
            clearInterval(id);
            this.intervals.delete(id);
        },
        
        /**
         * Limpia todos los intervalos
         */
        clearAll() {
            this.intervals.forEach((_, id) => this.clear(id));
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE MODO HUMANO
     * =============================================================================
     * 
     * Gestiona el modo humano con variables aleatorias
     */
    const ModoHumanoModule = {
        /**
         * Genera variables aleatorias para el modo humano
         */
        generarVariables() {
            console.log('🎲 Generando nuevas variables aleatorias para modo humano...');
            
            StateModule.modoHumano.frecuenciaSesion = Math.floor(Math.random() * (78350 - 27500 + 1)) + 27500;
            StateModule.modoHumano.frecuenciaTapTap = Math.floor(Math.random() * (485 - 200 + 1)) + 200;
            StateModule.modoHumano.cooldownSesion = Math.floor(Math.random() * (9295 - 3565 + 1)) + 3565;
            
            console.log('🎯 Variables generadas:', {
                frecuenciaSesion: `${StateModule.modoHumano.frecuenciaSesion}ms (${(StateModule.modoHumano.frecuenciaSesion / 1000).toFixed(1)}s)`,
                frecuenciaTapTap: `${StateModule.modoHumano.frecuenciaTapTap}ms`,
                cooldownSesion: `${StateModule.modoHumano.cooldownSesion}ms (${(StateModule.modoHumano.cooldownSesion / 1000).toFixed(1)}s)`
            });
            
            this.actualizarTextoSelector();
        },
        
        /**
         * Inicia una sesión activa del modo humano
         */
        iniciarSesion() {
            console.log('🚀 Iniciando sesión activa en modo humano...');
            
            StateModule.modoHumano.enSesion = true;
            StateModule.modoHumano.tiempoSesionRestante = StateModule.modoHumano.frecuenciaSesion;
            StateModule.modoHumano.inicioSesion = Date.now();
            
            AutomationModule.presionarL();
            StateModule.intervalo = IntervalModule.create(() => AutomationModule.presionarL(), StateModule.modoHumano.frecuenciaTapTap);
            
            TimerModule.timers.modoHumanoSesion = setTimeout(() => {
                console.log('⏸️ Sesión de modo humano completada, iniciando cooldown...');
                this.finalizarSesion();
            }, StateModule.modoHumano.frecuenciaSesion);
            
            NotificationModule.agregar(
                `🤖 Modo Humano: Sesión activa por ${(StateModule.modoHumano.frecuenciaSesion / 1000).toFixed(1)}s`, 
                'info', 
                3000
            );
        },
        
        /**
         * Finaliza la sesión y comienza el cooldown
         */
        finalizarSesion() {
            console.log('🛑 Finalizando sesión de modo humano...');
            
            if (StateModule.intervalo) {
                IntervalModule.clear(StateModule.intervalo);
                StateModule.intervalo = null;
            }
            
            if (TimerModule.timers.modoHumanoSesion) {
                clearTimeout(TimerModule.timers.modoHumanoSesion);
                TimerModule.timers.modoHumanoSesion = null;
            }
            
            StateModule.modoHumano.enSesion = false;
            StateModule.modoHumano.tiempoCooldownRestante = StateModule.modoHumano.cooldownSesion;
            StateModule.modoHumano.inicioCooldown = Date.now();
            
            console.log(`😴 Iniciando cooldown por ${StateModule.modoHumano.cooldownSesion}ms (${(StateModule.modoHumano.cooldownSesion / 1000).toFixed(1)}s)`);
            
            TimerModule.timers.modoHumanoCooldown = setTimeout(() => {
                console.log('🔄 Cooldown completado, regenerando variables...');
                if (StateModule.modoHumano.activo && !StateModule.modoHumano.pausadoPorChat && !StateModule.apagadoManualmente) {
                    this.generarVariables();
                    this.iniciarSesion();
                }
            }, StateModule.modoHumano.cooldownSesion);
            
            NotificationModule.agregar(
                `😴 Modo Humano: Cooldown por ${(StateModule.modoHumano.cooldownSesion / 1000).toFixed(1)}s`, 
                'warning', 
                3000
            );
        },
        
        /**
         * Pausa el modo humano por interacción con chat
         */
        pausarPorChat() {
            console.log('💬 Pausando modo humano por interacción con chat...');
            
            StateModule.modoHumano.pausadoPorChat = true;
            
            this.actualizarTiemposRestantes();
            
            if (StateModule.modoHumano.enSesion && StateModule.intervalo) {
                IntervalModule.clear(StateModule.intervalo);
                StateModule.intervalo = null;
            }
            
            if (TimerModule.timers.modoHumanoSesion) {
                clearTimeout(TimerModule.timers.modoHumanoSesion);
                TimerModule.timers.modoHumanoSesion = null;
            }
            
            if (TimerModule.timers.modoHumanoCooldown) {
                clearTimeout(TimerModule.timers.modoHumanoCooldown);
                TimerModule.timers.modoHumanoCooldown = null;
            }
            
            console.log('⏸️ Timers de modo humano pausados, variables conservadas');
        },
        
        /**
         * Reanuda el modo humano después del chat
         */
        reanudarDesdeChat() {
            console.log('🔄 Reanudando modo humano desde pausa de chat...');
            
            StateModule.modoHumano.pausadoPorChat = false;
            
            if (StateModule.modoHumano.enSesion) {
                console.log(`▶️ Reanudando sesión con ${StateModule.modoHumano.tiempoSesionRestante}ms restantes`);
                
                AutomationModule.presionarL();
                StateModule.intervalo = IntervalModule.create(() => AutomationModule.presionarL(), StateModule.modoHumano.frecuenciaTapTap);
                
                TimerModule.timers.modoHumanoSesion = setTimeout(() => {
                    console.log('⏸️ Sesión de modo humano completada tras reanudar, iniciando cooldown...');
                    this.finalizarSesion();
                }, StateModule.modoHumano.tiempoSesionRestante);
                
            } else {
                console.log(`😴 Reanudando cooldown con ${StateModule.modoHumano.tiempoCooldownRestante}ms restantes`);
                
                TimerModule.timers.modoHumanoCooldown = setTimeout(() => {
                    console.log('🔄 Cooldown completado tras reanudar, regenerando variables...');
                    if (StateModule.modoHumano.activo && !StateModule.modoHumano.pausadoPorChat && !StateModule.apagadoManualmente) {
                        this.generarVariables();
                        this.iniciarSesion();
                    }
                }, StateModule.modoHumano.tiempoCooldownRestante);
            }
            
            NotificationModule.agregar('🤖 Modo Humano reanudado desde chat', 'success', 3000);
        },
        
        /**
         * Actualiza los tiempos restantes del modo humano
         */
        actualizarTiemposRestantes() {
            if (!StateModule.modoHumano.activo) return;
            
            const ahora = Date.now();
            
            if (StateModule.modoHumano.enSesion && StateModule.modoHumano.inicioSesion) {
                const tiempoTranscurrido = ahora - StateModule.modoHumano.inicioSesion;
                StateModule.modoHumano.tiempoSesionRestante = Math.max(0, StateModule.modoHumano.frecuenciaSesion - tiempoTranscurrido);
                console.log(`⏱️ Tiempo de sesión restante: ${StateModule.modoHumano.tiempoSesionRestante}ms`);
            } else if (!StateModule.modoHumano.enSesion && StateModule.modoHumano.inicioCooldown) {
                const tiempoTranscurrido = ahora - StateModule.modoHumano.inicioCooldown;
                StateModule.modoHumano.tiempoCooldownRestante = Math.max(0, StateModule.modoHumano.cooldownSesion - tiempoTranscurrido);
                console.log(`⏱️ Tiempo de cooldown restante: ${StateModule.modoHumano.tiempoCooldownRestante}ms`);
            }
        },
        
        /**
         * Actualiza el texto del selector para modo humano
         */
        actualizarTextoSelector() {
            if (!UIModule.elementos.selector) return;
            
            const opcionModoHumano = UIModule.elementos.selector.querySelector('option[value="0"]');
            if (!opcionModoHumano) return;
            
            if (StateModule.modoHumano.activo) {
                const sesionS = (StateModule.modoHumano.frecuenciaSesion / 1000).toFixed(1);
                const cooldownS = (StateModule.modoHumano.cooldownSesion / 1000).toFixed(1);
                const tapMs = StateModule.modoHumano.frecuenciaTapTap;
                
                opcionModoHumano.textContent = `Modo humano | Sesión:${sesionS}s Tap:${tapMs}ms Cooldown:${cooldownS}s`;
            } else {
                opcionModoHumano.textContent = 'Modo humano | [Variable]';
            }
        },
        
        /**
         * Limpia completamente el modo humano
         */
        limpiar() {
            console.log('🧹 Limpiando completamente el modo humano...');
            
            if (TimerModule.timers.modoHumanoSesion) {
                clearTimeout(TimerModule.timers.modoHumanoSesion);
                TimerModule.timers.modoHumanoSesion = null;
            }
            
            if (TimerModule.timers.modoHumanoCooldown) {
                clearTimeout(TimerModule.timers.modoHumanoCooldown);
                TimerModule.timers.modoHumanoCooldown = null;
            }
            
            StateModule.modoHumano.activo = false;
            StateModule.modoHumano.frecuenciaSesion = 0;
            StateModule.modoHumano.frecuenciaTapTap = 0;
            StateModule.modoHumano.cooldownSesion = 0;
            StateModule.modoHumano.enSesion = false;
            StateModule.modoHumano.tiempoSesionRestante = 0;
            StateModule.modoHumano.tiempoCooldownRestante = 0;
            StateModule.modoHumano.pausadoPorChat = false;
            StateModule.modoHumano.inicioSesion = null;
            StateModule.modoHumano.inicioCooldown = null;
            
            this.actualizarTextoSelector();
            
            console.log('✅ Modo humano completamente limpiado');
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE GESTIÓN DE CHAT
     * =============================================================================
     * 
     * Maneja la detección y respuesta a interacciones con el chat
     */
    const ChatModule = {
        inactivityTimer: null,
        
        /**
         * Busca el elemento de input del chat
         * @returns {Element|null} Elemento del chat
         */
        buscarChatInput() {
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

            const posiblesChatInputs = Array.from(document.querySelectorAll('div[contenteditable]'));
            return posiblesChatInputs.find(el => el.getAttribute('contenteditable') === 'plaintext-only');
        },
        
        /**
         * Pausa el sistema por interacción con chat
         * @returns {boolean} true si se pausó exitosamente
         */
        pausarPorChat() {
            console.log('💬 Pausando por interacción con chat...');
            
            if (!StateModule.activo || StateModule.pausadoPorChat) {
                console.log('⚠️ Sistema ya pausado o inactivo');
                return false;
            }
            
            StateModule.pausadoPorChat = true;
            
            if (StateModule.modoHumano.activo) {
                console.log('🤖 Pausando modo humano por chat...');
                ModoHumanoModule.pausarPorChat();
            } else {
                console.log('⏸️ Pausando modo normal por chat...');
                if (StateModule.intervalo) {
                    IntervalModule.clear(StateModule.intervalo);
                    StateModule.intervalo = null;
                }
            }
            
            MessagingModule.sendMessage({
                action: 'paused_by_chat',
                enTikTok: true,
                enLive: true
            }).catch(error => console.warn('Error al notificar pausa por chat:', error));
            
            console.log('✅ Pausado exitosamente por chat');
            return true;
        },
        
        /**
         * Reactiva el sistema después de pausa por chat
         * @param {boolean} fromManual - Si es reactivación manual
         * @returns {boolean} true si se reactivó exitosamente
         */
        reactivarAutoTapTap(fromManual = false) {
            console.log('🔄 Reactivando Auto Tap-Tap...', { fromManual });
            
            if (!StateModule.pausadoPorChat) {
                console.log('⚠️ No estaba pausado por chat');
                return false;
            }
            
            if (StateModule.apagadoManualmente) {
                console.log('⚠️ Está apagado manualmente, no reactivar');
                return false;
            }
            
            StateModule.pausadoPorChat = false;
            
            if (StateModule.modoHumano.activo) {
                console.log('🤖 Reanudando modo humano desde chat...');
                ModoHumanoModule.reanudarDesdeChat();
            } else {
                console.log('▶️ Reanudando modo normal desde chat...');
                const intervalo = parseInt(UIModule.elementos.selector.value);
                if (intervalo > 0) {
                    AutomationModule.presionarL();
                    StateModule.intervalo = IntervalModule.create(() => AutomationModule.presionarL(), intervalo);
                }
            }
            
            UIModule.actualizarColoresBoton();
            
            MessagingModule.sendMessage({
                action: 'reactivated_from_chat',
                contador: StateModule.contador,
                enTikTok: true,
                enLive: true
            }).catch(error => console.warn('Error al notificar reactivación:', error));
            
            console.log('✅ Reactivado exitosamente desde chat');
            return true;
        },
        
        /**
         * Configura los eventos del chat
         * @param {Element} chatInput - Elemento del chat
         * @returns {Function} Función de limpieza
         */
        configurarEventos(chatInput) {
            console.log('🔄 Configurando eventos del chat...');

            const handleActivity = () => {
                if (this.inactivityTimer) {
                    clearTimeout(this.inactivityTimer);
                }

                if (StateModule.pausadoPorChat && !chatInput.textContent.trim()) {
                    this.inactivityTimer = setTimeout(() => {
                        console.log('⏳ Inactividad detectada en chat vacío');
                        NotificationModule.mostrarCuentaRegresiva(`⏳ Reactivando en ${StateModule.tiempoReactivacion}s...`);
                    }, 2000);
                }
            };

            const handleInput = () => {
                console.log('✍️ Actividad en chat detectada');
                TimerModule.cleanupAll();
                handleActivity();
                
                if (StateModule.pausadoPorChat) {
                    if (chatInput.textContent.trim() !== '') {
                        console.log('💭 Usuario escribiendo, cancelando reactivación');
                        TimerModule.cleanupAll();
                        if (this.inactivityTimer) {
                            clearTimeout(this.inactivityTimer);
                            this.inactivityTimer = null;
                        }
                    } else {
                        console.log('📝 Chat vacío, esperando inactividad...');
                        handleActivity();
                    }
                }
            };

            const onFocus = (e) => {
                console.log('👆 Interacción detectada con el chat:', e.type);

                if (StateModule.activo && !StateModule.apagadoManualmente) {
                    console.log('🛑 Pausando Auto Tap-Tap por interacción con chat');
                    
                    TimerModule.cleanupAll();
                    if (this.inactivityTimer) {
                        clearTimeout(this.inactivityTimer);
                        this.inactivityTimer = null;
                    }
                    
                    const pausado = this.pausarPorChat();
                    
                    if (pausado) {
                        NotificationModule.agregar('✍️ Auto Tap-Tap pausado mientras escribes...', 'warning', 3000);
                        handleActivity();
                    }
                    
                    e.stopPropagation();
                }
            };

            const handleClickOutside = (e) => {
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
                    pausadoPorChat: StateModule.pausadoPorChat,
                    apagadoManualmente: StateModule.apagadoManualmente
                });

                if (!chatContainer.contains(e.target) && StateModule.pausadoPorChat && !StateModule.apagadoManualmente) {
                    console.log('🎯 Click fuera del chat detectado - Iniciando cuenta regresiva');
                    
                    if (!TimerModule.timers.cuentaRegresiva) {
                        setTimeout(() => {
                            NotificationModule.mostrarCuentaRegresiva(`⏳ Reactivando en ${StateModule.tiempoReactivacion}s...`);
                        }, 100);
                    } else {
                        console.log('⚠️ Ya hay una cuenta regresiva activa, no creando duplicado');
                    }
                }
            };

            // Configurar eventos
            chatInput.addEventListener('focus', onFocus, true);
            chatInput.addEventListener('click', onFocus, true);
            chatInput.addEventListener('mousedown', onFocus, true);
            chatInput.addEventListener('touchstart', onFocus, { passive: true, capture: true });
            chatInput.addEventListener('input', handleInput, true);

            if (chatInput.getAttribute('contenteditable')) {
                chatInput.addEventListener('keydown', (e) => {
                    if (!StateModule.pausadoPorChat) onFocus(e);
                    handleActivity();
                }, true);
                
                chatInput.addEventListener('keyup', () => {
                    setTimeout(handleInput, 50);
                }, true);
                
                chatInput.addEventListener('paste', () => {
                    setTimeout(handleInput, 50);
                }, true);
                
                chatInput.addEventListener('mousemove', handleActivity, { passive: true });
                chatInput.addEventListener('mouseenter', handleActivity, { passive: true });
            }

            document.addEventListener('click', handleClickOutside, true);
            document.addEventListener('touchend', handleClickOutside, true);

            // Función de limpieza
            const cleanup = () => {
                console.log('🧹 Limpiando eventos del chat');
                TimerModule.cleanupAll();
                document.removeEventListener('click', handleClickOutside, true);
                document.removeEventListener('touchend', handleClickOutside, true);
            };
            
            StateModule.chatCleanup = cleanup;
            
            return cleanup;
        },
        
        /**
         * Maneja la búsqueda e inicialización del chat
         * @returns {Object} Objeto con función de cleanup
         */
        manejarInteraccion() {
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

            const iniciarObservador = () => {
                if (chatObserver.active) return;

                chatObserver.cleanup();
                
                chatObserver.observer = new MutationObserver(() => {
                    if (chatInput) return;

                    chatInput = this.buscarChatInput();
                    if (chatInput) {
                        console.log('🎉 Chat encontrado por el observador!');
                        chatObserver.cleanup();
                        this.configurarEventos(chatInput);
                    }
                });

                chatObserver.observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                chatObserver.active = true;
            };

            chatInput = this.buscarChatInput();
            if (chatInput) {
                console.log('✨ Chat encontrado inmediatamente!');
                this.configurarEventos(chatInput);
            } else {
                console.log('⏳ Chat no encontrado inicialmente, iniciando observador...');
                iniciarObservador();
            }
            
            StateModule.chatObserver = chatObserver;
            
            return chatObserver;
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE NOTIFICACIONES
     * =============================================================================
     * 
     * Gestiona el sistema de notificaciones de la extensión
     */
    const NotificationModule = {
        /**
         * Agrega una notificación al contenedor
         * @param {string} mensaje - Texto a mostrar
         * @param {string} tipo - Tipo de notificación
         * @param {number} duracion - Duración en ms (0 = permanente)
         * @returns {HTMLElement} Elemento de notificación
         */
        agregar(mensaje, tipo = 'info', duracion = 3000) {
            if (!UIModule.elementos.contenedorNotificaciones) {
                console.warn('Contenedor de notificaciones no disponible');
                return null;
            }
            
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
            
            Object.assign(notificacion.style, estilos[tipo]);
            notificacion.textContent = mensaje;
            
            UIModule.elementos.contenedorNotificaciones.appendChild(notificacion);
            
            setTimeout(() => {
                notificacion.style.opacity = '1';
                notificacion.style.transform = 'translateX(0)';
            }, 10);
            
            if (duracion > 0) {
                setTimeout(() => {
                    this.remover(notificacion);
                }, duracion);
            }
            
            return notificacion;
        },
        
        /**
         * Remueve una notificación específica
         * @param {HTMLElement} notificacion - Elemento a remover
         * @param {boolean} immediate - Si debe removerse inmediatamente
         */
        remover(notificacion, immediate = false) {
            if (!notificacion) return;
            
            try {
                if (immediate || !notificacion.parentNode) {
                    if (notificacion.parentNode) {
                        notificacion.parentNode.removeChild(notificacion);
                    }
                    return;
                }
                
                if (notificacion.parentNode) {
                    notificacion.style.opacity = '0';
                    notificacion.style.transform = 'translateX(20px)';
                    
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
        },
        
        /**
         * Muestra cuenta regresiva de reactivación
         * @param {string} mensajeInicial - Mensaje inicial
         */
        mostrarCuentaRegresiva(mensajeInicial) {
            console.log(`🚀 Iniciando mostrarCuentaRegresiva: "${mensajeInicial}"`);
            
            if (!StateModule.pausadoPorChat || StateModule.apagadoManualmente || StateModule.activo) {
                console.log('⚠️ Condiciones no válidas para cuenta regresiva');
                console.log('Estado actual:', {
                    pausadoPorChat: StateModule.pausadoPorChat,
                    apagadoManualmente: StateModule.apagadoManualmente,
                    activo: StateModule.activo
                });
                return;
            }
            
            if (TimerModule.timers.cuentaRegresiva) {
                console.log('⚠️ Ya hay una cuenta regresiva activa, cancelando nueva');
                return;
            }
            
            if (StateModule.notificacionCuentaRegresiva) {
                this.remover(StateModule.notificacionCuentaRegresiva);
                StateModule.notificacionCuentaRegresiva = null;
            }
            
            let tiempoRestante = StateModule.tiempoReactivacion;
            
            StateModule.notificacionCuentaRegresiva = this.agregar(`⏳ Reactivando en ${tiempoRestante}s...`, 'countdown', 0);
            
            const limpiarCuentaRegresiva = () => {
                console.log('🧹 Limpiando cuenta regresiva...');
                
                if (TimerModule.timers.cuentaRegresiva) {
                    clearInterval(TimerModule.timers.cuentaRegresiva);
                    TimerModule.timers.cuentaRegresiva = null;
                }
                
                if (StateModule.notificacionCuentaRegresiva) {
                    try {
                        this.remover(StateModule.notificacionCuentaRegresiva, true);
                        StateModule.notificacionCuentaRegresiva = null;
                    } catch (error) {
                        console.warn('Error al limpiar notificación de cuenta regresiva:', error);
                        StateModule.notificacionCuentaRegresiva = null;
                    }
                }
                
                // Limpieza defensiva adicional
                try {
                    if (UIModule.elementos.contenedorNotificaciones) {
                        const notificacionesCountdown = Array.from(UIModule.elementos.contenedorNotificaciones.children)
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
            
            StateModule.limpiarCuentaRegresiva = limpiarCuentaRegresiva;
            
            TimerModule.timers.cuentaRegresiva = setInterval(() => {
                if (!StateModule.pausadoPorChat || StateModule.apagadoManualmente || StateModule.activo) {
                    console.log('⚠️ Cancelando cuenta regresiva - estado cambió');
                    limpiarCuentaRegresiva();
                    return;
                }
                
                tiempoRestante--;
                
                if (tiempoRestante > 0) {
                    if (StateModule.notificacionCuentaRegresiva && StateModule.notificacionCuentaRegresiva.parentNode) {
                        StateModule.notificacionCuentaRegresiva.textContent = `⏳ Reactivando en ${tiempoRestante}s...`;
                        
                        if (tiempoRestante <= 3) {
                            StateModule.notificacionCuentaRegresiva.style.color = '#ffff00';
                        } else {
                            StateModule.notificacionCuentaRegresiva.style.color = '#ff8c00';
                        }
                    }
                } else {
                    console.log('⏰ Tiempo de cuenta regresiva agotado, reactivando sistema...');
                    StateModule.contador = 0;
                    UIModule.actualizarContador();
                    ChatModule.reactivarAutoTapTap(true);
                    limpiarCuentaRegresiva();
                }
            }, 1000);
        },
        
        /**
         * Limpia la cuenta regresiva actual
         */
        limpiarCuentaRegresiva() {
            if (StateModule.limpiarCuentaRegresiva && typeof StateModule.limpiarCuentaRegresiva === 'function') {
                try {
                    StateModule.limpiarCuentaRegresiva();
                } catch (error) {
                    console.warn('Error en cleanup de cuenta regresiva:', error);
                }
            }
            
            try {
                if (StateModule.notificacionCuentaRegresiva) {
                    this.remover(StateModule.notificacionCuentaRegresiva, true);
                    StateModule.notificacionCuentaRegresiva = null;
                }
            } catch (error) {
                console.warn('Error en cleanup defensivo:', error);
            }
        },
        
        /**
         * Limpia todas las notificaciones flotantes
         */
        limpiarTodasLasNotificaciones() {
            console.log('🧹 Iniciando limpieza completa de notificaciones flotantes...');
            
            try {
                if (UIModule.elementos.contenedorNotificaciones) {
                    const notificaciones = UIModule.elementos.contenedorNotificaciones.children;
                    console.log(`📊 Encontradas ${notificaciones.length} notificaciones para limpiar`);
                    
                    Array.from(notificaciones).forEach((notificacion, index) => {
                        try {
                            this.remover(notificacion, true);
                        } catch (error) {
                            console.warn(`⚠️ Error al remover notificación ${index}:`, error);
                        }
                    });
                }
                
                if (UIModule.elementos.contenedorNotificaciones && UIModule.elementos.contenedorNotificaciones.children.length > 0) {
                    console.log('🔄 Aplicando limpieza fallback con innerHTML...');
                    try {
                        UIModule.elementos.contenedorNotificaciones.innerHTML = '';
                    } catch (error) {
                        console.warn('⚠️ Error en limpieza fallback:', error);
                    }
                }
                
                try {
                    const elementosHuerfanos = document.querySelectorAll('.tiktok-notification, .auto-taptap-notification, [class*="notification"]');
                    elementosHuerfanos.forEach((elemento, index) => {
                        try {
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
                
                this.limpiarCuentaRegresiva();
                
                console.log('✅ Limpieza completa de notificaciones flotantes completada');
                
            } catch (error) {
                console.error('❌ Error crítico en limpieza de notificaciones:', error);
            }
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE INTERFAZ DE USUARIO
     * =============================================================================
     * 
     * Gestiona la creación y actualización de la interfaz
     */
    const UIModule = {
        elementos: {},
        
        config: {
            intervalos: [
                { valor: 0, texto: 'Modo humano | [Variable]' },
                { valor: 200, texto: '200 milisegundos | [Muy rápido]' },
                { valor: 250, texto: '250 milisegundos | [Rápido]' },
                { valor: 500, texto: '500 milisegundos | [Normal]' },
                { valor: 1000, texto: '1  segundo      | [Lento]' }
            ],
            defaultInterval: 200
        },
        
        /**
         * Actualiza el contador en la interfaz
         */
        actualizarContador() {
            if (this.elementos.contador) {
                this.elementos.contador.textContent = StateModule.contador;
            }
        },
        
        /**
         * Actualiza los colores del botón según el estado
         */
        actualizarColoresBoton() {
            if (!this.elementos.boton) return;
            
            const isActive = StateModule.activo && !StateModule.pausadoPorChat;
            
            if (isActive) {
                this.elementos.boton.style.background = '#00f2ea';
                this.elementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
                
                this.elementos.boton.onmouseenter = function() {
                    this.style.transform = 'translateY(-1px)';
                    this.style.boxShadow = '0 4px 12px rgba(0, 242, 234, 0.3)';
                };
            } else {
                this.elementos.boton.style.background = '#ff0050';
                this.elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
                
                this.elementos.boton.onmouseenter = function() {
                    this.style.transform = 'translateY(-1px)';
                    this.style.boxShadow = '0 4px 12px rgba(255, 0, 80, 0.3)';
                };
            }
            
            this.elementos.boton.onmouseleave = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
        },
        
        /**
         * Crea la interfaz flotante completa
         */
        crearInterfaz() {
            this.elementos.contenedor = document.createElement('div');
            this.elementos.contenedor.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 280px;
                background: rgba(0, 0, 0, 0.95);
                color: white;
                border-                radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                font-family: Arial, sans-serif;
                font-size: 14px;
                user-select: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            
            // Crear barra de arrastre
            this.elementos.barraArrastre = document.createElement('div');
            this.elementos.barraArrastre.style.cssText = `
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
            this.elementos.barraArrastre.innerHTML = `
                <span>❤️ Auto Tap-Tap TikTok</span>
            `;
            
            // Crear botón minimizar
            this.elementos.botonMinimizar = document.createElement('button');
            this.elementos.botonMinimizar.textContent = '−';
            this.elementos.botonMinimizar.style.cssText = `
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
            this.elementos.barraArrastre.appendChild(this.elementos.botonMinimizar);
            
            // Crear contenido principal
            const contenidoPrincipal = document.createElement('div');
            contenidoPrincipal.style.cssText = `padding: 15px;`;
            
            // Crear elementos individuales
            this.crearBotonPrincipal(contenidoPrincipal);
            this.crearSelectorVelocidad(contenidoPrincipal);
            this.crearContador(contenidoPrincipal);
            this.crearBotonReset(contenidoPrincipal);
            this.crearConfiguracionReactivacion(contenidoPrincipal);
            this.crearCopyright(contenidoPrincipal);
            
            // Crear contenedor de notificaciones
            this.elementos.contenedorNotificaciones = document.createElement('div');
            this.elementos.contenedorNotificaciones.style.cssText = `
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
            
            // Ensamblar elementos
            this.elementos.contenedor.appendChild(this.elementos.barraArrastre);
            this.elementos.contenedor.appendChild(contenidoPrincipal);
            this.elementos.contenedor.appendChild(this.elementos.contenedorNotificaciones);
            
            // Insertar en el DOM
            document.body.appendChild(this.elementos.contenedor);
            
            // Configurar eventos
            this.configurarEventosUI();
            
            // Aplicar efectos iniciales
            this.actualizarColoresBoton();
        },
        
        /**
         * Crea el botón principal de toggle
         * @param {HTMLElement} contenedor - Contenedor padre
         */
        crearBotonPrincipal(contenedor) {
            this.elementos.boton = document.createElement('button');
            this.elementos.boton.textContent = '❤️ Auto Tap-Tap: OFF';
            this.elementos.boton.style.cssText = `
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
            contenedor.appendChild(this.elementos.boton);
        },
        
        /**
         * Crea el selector de velocidad
         * @param {HTMLElement} contenedor - Contenedor padre
         */
        crearSelectorVelocidad(contenedor) {
            const selectorContainer = document.createElement('div');
            selectorContainer.style.cssText = `margin-bottom: 15px;`;
            
            this.elementos.selectorLabel = document.createElement('label');
            this.elementos.selectorLabel.textContent = '⚡️ Velocidad:';
            this.elementos.selectorLabel.style.cssText = `
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: #00f2ea;
            `;
            
            this.elementos.selector = document.createElement('select');
            this.elementos.selector.style.cssText = `
                width: 100%;
                padding: 8px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 14px;
            `;
            
            // Poblar opciones
            this.config.intervalos.forEach(opcion => {
                const option = document.createElement('option');
                option.value = opcion.valor;
                option.textContent = opcion.texto;
                option.style.cssText = `
                    background: #333;
                    color: white;
                `;
                this.elementos.selector.appendChild(option);
            });
            this.elementos.selector.value = this.config.defaultInterval;
            
            selectorContainer.appendChild(this.elementos.selectorLabel);
            selectorContainer.appendChild(this.elementos.selector);
            contenedor.appendChild(selectorContainer);
        },
        
        /**
         * Crea el contador de tap-taps
         * @param {HTMLElement} contenedor - Contenedor padre
         */
        crearContador(contenedor) {
            this.elementos.contadorDiv = document.createElement('div');
            this.elementos.contadorDiv.style.cssText = `
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
            
            this.elementos.contador = document.createElement('div');
            this.elementos.contador.textContent = '0';
            this.elementos.contador.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: #00f2ea;
            `;
            
            this.elementos.contadorDiv.appendChild(contadorLabel);
            this.elementos.contadorDiv.appendChild(this.elementos.contador);
            contenedor.appendChild(this.elementos.contadorDiv);
        },
        
        /**
         * Crea el botón de reset
         * @param {HTMLElement} contenedor - Contenedor padre
         */
        crearBotonReset(contenedor) {
            this.elementos.botonReset = document.createElement('button');
            this.elementos.botonReset.textContent = '🔄 Reset Contador';
            this.elementos.botonReset.style.cssText = `
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
            
            this.elementos.botonReset.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(255, 255, 255, 0.2)';
            });
            
            this.elementos.botonReset.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(255, 255, 255, 0.1)';
            });
            
            contenedor.appendChild(this.elementos.botonReset);
        },
        
        /**
         * Crea la configuración de reactivación
         * @param {HTMLElement} contenedor - Contenedor padre
         */
        crearConfiguracionReactivacion(contenedor) {
            this.elementos.configDiv = document.createElement('div');
            this.elementos.configDiv.style.cssText = `
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
            
            this.elementos.reactivacionInput = document.createElement('input');
            this.elementos.reactivacionInput.type = 'number';
            this.elementos.reactivacionInput.min = '10';
            this.elementos.reactivacionInput.max = '60';
            this.elementos.reactivacionInput.value = '10';
            this.elementos.reactivacionInput.style.cssText = `
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
            
            inputContainer.appendChild(this.elementos.reactivacionInput);
            inputContainer.appendChild(unidadLabel);
            this.elementos.configDiv.appendChild(configLabel);
            this.elementos.configDiv.appendChild(inputContainer);
            contenedor.appendChild(this.elementos.configDiv);
        },
        
        /**
         * Crea la información de copyright
         * @param {HTMLElement} contenedor - Contenedor padre
         */
        crearCopyright(contenedor) {
            this.elementos.copyrightDiv = document.createElement('div');
            this.elementos.copyrightDiv.style.cssText = `
                text-align: center;
                font-size: 11px;
                color: #666;
                padding-top: 10px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            `;
            this.elementos.copyrightDiv.innerHTML = `
                © 2025 <a href="https://newagecoding.org/" target="_blank" style="color: #00f2ea; text-decoration: none;">New Age Coding Organization</a><br>
                Por <a href="https://github.com/EmerickVar" target="_blank" style="color: #00f2ea; text-decoration: none;">@EmerickVar</a>
            `;
            contenedor.appendChild(this.elementos.copyrightDiv);
        },
        
        /**
         * Configura los eventos de la interfaz
         */
        configurarEventosUI() {
            // Botón principal
            this.elementos.boton.addEventListener('click', () => {
                AutomationModule.toggle();
            });
            
            // Selector de velocidad
            this.elementos.selector.addEventListener('change', () => {
                const nuevoIntervalo = parseInt(this.elementos.selector.value);
                
                if (StateModule.activo) {
                    if (StateModule.intervalo) {
                        IntervalModule.clear(StateModule.intervalo);
                    }
                    
                    if (StateModule.modoHumano.activo) {
                        console.log('🔄 Cambiando desde modo humano a intervalo normal');
                        ModoHumanoModule.limpiar();
                    }
                    
                    if (nuevoIntervalo === 0) {
                        console.log('🤖 Cambiando a Modo Humano...');
                        StateModule.modoHumano.activo = true;
                        ModoHumanoModule.generarVariables();
                        ModoHumanoModule.iniciarSesion();
                        NotificationModule.agregar('🤖 Modo Humano activado', 'success', 3000);
                    } else {
                        AutomationModule.presionarL();
                        StateModule.intervalo = IntervalModule.create(() => AutomationModule.presionarL(), nuevoIntervalo);
                    }
                }
                
                StorageModule.save({ intervalo: nuevoIntervalo });
            });
            
            // Botón reset
            this.elementos.botonReset.addEventListener('click', () => {
                StateModule.contador = 0;
                this.actualizarContador();
                StorageModule.save({ totalTapTaps: 0 });
            });
            
            // Input de reactivación
            this.elementos.reactivacionInput.addEventListener('change', () => {
                const nuevoTiempo = parseInt(this.elementos.reactivacionInput.value);
                if (nuevoTiempo >= 10 && nuevoTiempo <= 60) {
                    StateModule.tiempoReactivacion = nuevoTiempo;
                    StorageModule.save({ tiempoReactivacion: nuevoTiempo });
                }
            });
            
            // Botón minimizar
            this.elementos.botonMinimizar.addEventListener('click', () => {
                const controles = [
                    this.elementos.boton,
                    this.elementos.selectorLabel,
                    this.elementos.selector,
                    this.elementos.contadorDiv,
                    this.elementos.botonReset,
                    this.elementos.configDiv,
                    this.elementos.copyrightDiv
                ];
                
                const isMinimized = this.elementos.boton.style.display === 'none';
                controles.forEach(el => {
                    if (el) el.style.display = isMinimized ? 'block' : 'none';
                });
                
                this.elementos.botonMinimizar.textContent = isMinimized ? '−' : '+';
            });
            
            // Sistema de arrastre
            DragModule.configurar(this.elementos.barraArrastre, this.elementos.contenedor);
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE ARRASTRE
     * =============================================================================
     * 
     * Gestiona el sistema de arrastre de la ventana flotante
     */
    const DragModule = {
        /**
         * Configura el sistema de arrastre
         * @param {HTMLElement} handle - Elemento de agarre
         * @param {HTMLElement} container - Contenedor a mover
         */
        configurar(handle, container) {
            handle.addEventListener('mousedown', (e) => this.dragStart(e, container));
            handle.addEventListener('touchstart', (e) => this.dragStart(e, container), { passive: false });
        },
        
        /**
         * Inicia el arrastre
         * @param {Event} e - Evento de inicio
         * @param {HTMLElement} container - Contenedor a mover
         */
        dragStart(e, container) {
            StateModule.isDragging = true;
            
            if (e.type === 'touchstart') {
                StateModule.initialX = e.touches[0].clientX - StateModule.xOffset;
                StateModule.initialY = e.touches[0].clientY - StateModule.yOffset;
            } else {
                StateModule.initialX = e.clientX - StateModule.xOffset;
                StateModule.initialY = e.clientY - StateModule.yOffset;
            }
            
            const dragHandler = (e) => this.drag(e, container);
            const dragEndHandler = () => this.dragEnd(dragHandler, dragEndHandler);
            
            document.addEventListener('mousemove', dragHandler);
            document.addEventListener('touchmove', dragHandler, { passive: false });
            document.addEventListener('mouseup', dragEndHandler);
            document.addEventListener('touchend', dragEndHandler);
        },
        
        /**
         * Maneja el movimiento durante el arrastre
         * @param {Event} e - Evento de movimiento
         * @param {HTMLElement} container - Contenedor a mover
         */
        drag(e, container) {
            if (!StateModule.isDragging) return;
            
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                StateModule.currentX = e.touches[0].clientX - StateModule.initialX;
                StateModule.currentY = e.touches[0].clientY - StateModule.initialY;
            } else {
                StateModule.currentX = e.clientX - StateModule.initialX;
                StateModule.currentY = e.clientY - StateModule.initialY;
            }
            
            StateModule.xOffset = StateModule.currentX;
            StateModule.yOffset = StateModule.currentY;
            
            container.style.transform = `translate3d(${StateModule.currentX}px, ${StateModule.currentY}px, 0)`;
        },
        
        /**
         * Finaliza el arrastre
         * @param {Function} dragHandler - Handler de movimiento
         * @param {Function} dragEndHandler - Handler de fin
         */
        dragEnd(dragHandler, dragEndHandler) {
            StateModule.isDragging = false;
            
            document.removeEventListener('mousemove', dragHandler);
            document.removeEventListener('touchmove', dragHandler);
            document.removeEventListener('mouseup', dragEndHandler);
            document.removeEventListener('touchend', dragEndHandler);
            
            // Guardar posición
            StorageModule.save({
                position: {
                    x: StateModule.xOffset,
                    y: StateModule.yOffset
                }
            });
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE NAVEGACIÓN
     * =============================================================================
     * 
     * Gestiona la detección de cambios de navegación
     */
    const NavigationModule = {
        lastUrl: window.location.href,
        
        /**
         * Configura la detección de navegación
         */
        configurar() {
            console.log('🔍 Configurando sistema de detección de navegación...');
            
            // Observer para cambios de URL
            const urlObserver = new MutationObserver(() => {
                setTimeout(() => this.checkUrlChange(), 100);
            });
            
            urlObserver.observe(document, {
                subtree: true,
                childList: true
            });
            
            // Eventos de navegación
            window.addEventListener('popstate', () => {
                console.log('📍 Evento popstate detectado');
                setTimeout(() => this.checkUrlChange(), 100);
            });
            
            window.addEventListener('beforeunload', () => {
                console.log('🚪 Página being unloaded');
                this.cleanupExtensionResources();
            });
            
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    console.log('👁️ Página oculta');
                } else {
                    console.log('👁️ Página visible, verificando ubicación...');
                    setTimeout(() => this.checkUrlChange(), 500);
                }
            });
            
            // Verificación periódica
            const navigationCheckInterval = setInterval(() => {
                if (!ContextModule.isOnTikTokLive()) {
                    console.log('⏰ Verificación periódica: No estamos en Live');
                    this.cleanupExtensionResources();
                    clearInterval(navigationCheckInterval);
                }
            }, 10000);
            
            // Guardar referencias
            StateModule.navigationCheckInterval = navigationCheckInterval;
            StateModule.urlObserver = urlObserver;
            
            console.log('✅ Sistema de detección de navegación configurado correctamente');
        },
        
        /**
         * Verifica cambios de URL
         */
        checkUrlChange() {
            const currentUrl = window.location.href;
            if (currentUrl !== this.lastUrl) {
                console.log('🔄 Cambio de URL detectado:', {
                    anterior: this.lastUrl,
                    actual: currentUrl
                });
                this.lastUrl = currentUrl;
                
                const { enTikTok, enLive } = ContextModule.getCurrentContext();
                console.log('🎯 Contexto actual:', { enTikTok, enLive });
                
                // Notificar cambio de contexto
                MessagingModule.sendMessage({
                    action: 'updateContext',
                    enTikTok: enTikTok,
                    enLive: enLive
                }).catch(error => {
                    console.warn('Error al notificar cambio de contexto:', error);
                });
                
                if (!enLive) {
                    this.cleanupExtensionResources();
                }
            }
        },
        
        /**
         * Limpia todos los recursos de la extensión
         */
        cleanupExtensionResources() {
            console.log('🧹 Limpieza completa de recursos - No estamos en Live');
            
            // Detener automatización
            if (StateModule.intervalo) {
                IntervalModule.clear(StateModule.intervalo);
                StateModule.intervalo = null;
            }
            
            // Limpiar modo humano
            if (StateModule.modoHumano.activo) {
                console.log('🧹 Limpiando modo humano durante cleanup');
                ModoHumanoModule.limpiar();
            }
            
            // Limpiar todos los intervalos
            IntervalModule.clearAll();
            
            // Limpiar timers
            TimerModule.cleanupAll();
            
            // Limpiar observer de chat
            if (StateModule.chatObserver && StateModule.chatObserver.cleanup) {
                StateModule.chatObserver.cleanup();
            }
            
            // Limpiar eventos de chat
            if (StateModule.chatCleanup) {
                StateModule.chatCleanup();
            }
            
            // Limpiar notificaciones
            NotificationModule.limpiarTodasLasNotificaciones();
            
            // Resetear estados
            StateModule.activo = false;
            StateModule.pausadoPorChat = false;
            
            // Actualizar interfaz
            UIModule.actualizarColoresBoton();
            if (UIModule.elementos.selector) {
                UIModule.elementos.selector.disabled = false;
                UIModule.elementos.selector.style.opacity = '1';
            }
            
            // Notificar al background
            MessagingModule.sendMessage({ 
                action: 'stopped',
                enTikTok: true,
                enLive: false
            }).catch(error => console.warn('Error al notificar estado:', error));
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE RECONEXIÓN DE EXTENSIÓN
     * =============================================================================
     * 
     * Gestiona la reconexión cuando el contexto se invalida
     */
    const ExtensionModule = {
        /**
         * Intenta reconectar la extensión
         */
        reload() {
            console.log('🔄 Reconectando extensión...');
            
            if (!ContextModule.isOnTikTokLive()) {
                console.warn('🚫 Reconexión cancelada: No estamos en un Live de TikTok');
                NavigationModule.cleanupExtensionResources();
                return;
            }
            
            // Limpiar recursos actuales
            if (StateModule.intervalo) clearInterval(StateModule.intervalo);
            if (StateModule.chatTimeout) clearTimeout(StateModule.chatTimeout);
            
            let intentosReconexion = 0;
            const maxIntentos = 3;
            
            const intentarReconexion = () => {
                if (!ContextModule.isOnTikTokLive()) {
                    console.warn('🚫 Reintento cancelado: Ya no estamos en un Live de TikTok');
                    return;
                }
                
                if (intentosReconexion >= maxIntentos) {
                    console.warn('❌ Máximo de intentos de reconexión alcanzado, recargando página...');
                    window.location.reload();
                    return;
                }
                
                intentosReconexion++;
                console.log(`🔄 Intento de reconexión ${intentosReconexion}/${maxIntentos}...`);
                
                try {
                    // Verificar contexto de extensión
                    chrome.runtime.getURL('');
                    
                    // Restaurar estado si estaba activo
                    if (StateModule.activo) {
                        const intervalo = parseInt(UIModule.elementos.selector.value);
                        StateModule.intervalo = setInterval(() => AutomationModule.presionarL(), intervalo);
                        
                        MessagingModule.sendMessage({ 
                            action: 'started',
                            contador: StateModule.contador,
                            enTikTok: true,
                            enLive: true
                        }).catch(error => console.warn('Error al notificar inicio:', error));
                    } else {
                        MessagingModule.sendMessage({ 
                            action: 'stopped',
                            enTikTok: true,
                            enLive: true
                        }).catch(error => console.warn('Error al notificar parada:', error));
                    }
                    
                    // Reconfigurar listeners
                    MessagingModule.setupFullListener();
                    
                    // Sincronizar configuración
                    StorageModule.get(['tiempoReactivacion']).then(result => {
                        if (result.tiempoReactivacion) {
                            StateModule.tiempoReactivacion = result.tiempoReactivacion;
                            if (UIModule.elementos.reactivacionInput) {
                                UIModule.elementos.reactivacionInput.value = result.tiempoReactivacion;
                            }
                        }
                    });
                    
                    console.log('✅ Reconexión exitosa');
                    
                } catch (error) {
                    console.warn(`❌ Error en intento ${intentosReconexion}:`, error);
                    setTimeout(intentarReconexion, 1000 * intentosReconexion);
                }
            };
            
            intentarReconexion();
        }
    };
    
    /**
     * =============================================================================
     * MÓDULO DE INICIALIZACIÓN
     * =============================================================================
     * 
     * Coordina la inicialización de todos los módulos
     */
    const InitModule = {
        /**
         * Función principal de inicialización
         */
        async init() {
            console.log('🚀 Iniciando extensión Auto Tap-Tap TikTok...');
            
            // Fase 1: Crear interfaz
            UIModule.crearInterfaz();
            
            // Fase 2: Restaurar estado persistente
            try {
                const result = await StorageModule.get([
                    'intervalo',
                    'totalTapTaps',
                    'position',
                    'tiempoReactivacion'
                ]);
                
                if (result.intervalo) {
                    UIModule.elementos.selector.value = result.intervalo;
                }
                
                if (result.totalTapTaps) {
                    StateModule.contador = result.totalTapTaps;
                    UIModule.actualizarContador();
                }
                
                if (result.position) {
                    const { x, y } = result.position;
                    StateModule.xOffset = x;
                    StateModule.yOffset = y;
                    UIModule.elementos.contenedor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                }
                
                if (result.tiempoReactivacion) {
                    StateModule.tiempoReactivacion = result.tiempoReactivacion;
                    UIModule.elementos.reactivacionInput.value = result.tiempoReactivacion;
                }
            } catch (error) {
                console.warn('Error restaurando estado:', error);
            }
            
            // Fase 3: Configurar event listeners
            MessagingModule.setupFullListener();
            
            // Fase 4: Activar sistema de chat
            ChatModule.manejarInteraccion();
            
            // Fase 5: Sistema de navegación
            NavigationModule.configurar();
            
            // Fase 6: Notificar contexto inicial
            const { enTikTok, enLive } = ContextModule.getCurrentContext();
            console.log('🎯 Inicializando con contexto:', { enTikTok, enLive });
            
            MessagingModule.sendMessage({
                action: 'updateContext',
                enTikTok: enTikTok,
                enLive: enLive
            }).catch(error => {
                console.warn('Error al notificar contexto inicial:', error);
            });
            
            // Configurar limpieza defensiva periódica
            setInterval(() => this.limpiezaDefensivaPeriodica(), 30000);
            
            console.log('✅ Extensión inicializada correctamente');
        },
        
        /**
         * Limpieza defensiva periódica
         */
        limpiezaDefensivaPeriodica() {
            try {
                if (!UIModule.elementos.contenedorNotificaciones) return;
                
                const notificacionesHuerfanas = Array.from(UIModule.elementos.contenedorNotificaciones.children)
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
                            const texto = el.textContent || '';
                            let deberiaEstarActiva = false;
                            
                            if (texto.includes('Reactivando en') && StateModule.pausadoPorChat && TimerModule.timers.cuentaRegresiva) {
                                if (StateModule.notificacionCuentaRegresiva === el) {
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
    };
    
    /**
     * =============================================================================
     * PUNTO DE ENTRADA PRINCIPAL
     * =============================================================================
     */
    
    // Verificar si ya está inyectada
    if (ContextModule.isAlreadyInjected()) {
        console.log('⚠️ La extensión ya está inyectada, saliendo...');
        return;
    }
    
    // Verificar contexto inicial
    const { enTikTok, enLive } = ContextModule.getCurrentContext();
    
    console.log('🔍 Analizando URL:', {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        enTikTok,
        enLive
    });
    
    if (!enLive) {
        console.log('ℹ️ Extensión en modo básico: Solo responderá a mensajes del popup');
        console.log('🔧 Configurando listener básico...');
        
        try {
            MessagingModule.setupBasicListener();
            console.log('✅ Listener básico configurado correctamente');
        } catch (error) {
            console.error('❌ Error al configurar listener básico:', error);
        }
        return;
    }
    
    console.log('✅ Extensión en modo completo: Estamos en un Live de TikTok');
    
    // Inicializar extensión completa
    InitModule.init();

})();
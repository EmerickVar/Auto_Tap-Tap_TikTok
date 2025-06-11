# 🏗️ Diagramas Técnicos - TikTok Auto Tap-Tap

*Documentación visual de la arquitectura y flujos del sistema*

**📅 Versión:** 1.0.0 - Junio 2025  
**🎯 Propósito:** Diagramas técnicos consolidados, verificados y actualizados

---

## 📋 Índice de Diagramas

1. [🎯 Arquitectura General](#-arquitectura-general)
2. [🔄 Flujo de Comunicación](#-flujo-de-comunicación)
3. [⚡ Proceso de Inicialización](#-proceso-de-inicialización)
4. [🎮 Automatización Principal](#-automatización-principal)
5. [💬 Sistema de Chat](#-sistema-de-chat)
6. [🎨 Gestión de Estados](#-gestión-de-estados)
7. [💾 Sistema de Almacenamiento](#-sistema-de-almacenamiento)
8. [📊 Correcciones JavaScript (Junio-Junio 2025)](#-correcciones-javascript-junio-junio-2025)

---

## 🎯 Arquitectura General

```mermaid
graph TB
    subgraph "Chrome Extension V3"
        M[manifest.json<br/>📋 Configuración]
        
        subgraph "Background Script"
            BG[background.js<br/>🔧 Service Worker]
            BADGE[🏷️ Sistema Badges]
            SYNC[🔄 Sincronización]
        end
        
        subgraph "Content Script"
            CS[content.js<br/>📜 IIFE Container]
            STATE[📊 Gestor Estado]
            UI[🎨 Interfaz Flotante]
            CHAT[💬 Detector Chat]
            AUTO[🤖 Motor Automatización]
        end
        
        subgraph "Popup Interface"
            PH[popup.html<br/>🖼️ Estructura]
            PJ[popup.js<br/>⚡ Lógica]
            PC[popup.css<br/>🎨 Estilos]
        end
        
        subgraph "Storage System"
            LS[chrome.storage.local<br/>💾 Persistencia]
            CONFIG[⚙️ Configuración]
        end
    end
    
    subgraph "TikTok Live Page"
        DOM[🌐 TikTok DOM]
        CHAT_INPUT[💬 Input Chat]
        HEART_BTN[❤️ Botón Corazón]
    end
    
    %% Conexiones principales
    M --> BG
    M --> CS
    M --> PH
    
    CS <==> DOM
    AUTO --> HEART_BTN
    CHAT --> CHAT_INPUT
    
    BG <==> LS
    CS <==> LS
    PJ <==> LS
    
    %% Comunicación entre componentes
    BG <==> CS
    BG <==> PJ
    PJ <==> CS
    
    %% Estilos
    classDef bgStyle fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef csStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef popupStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef storageStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef tikTokStyle fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    
    class BG,BADGE,SYNC bgStyle
    class CS,STATE,UI,CHAT,AUTO csStyle
    class PH,PJ,PC popupStyle
    class LS,CONFIG storageStyle
    class DOM,CHAT_INPUT,HEART_BTN tikTokStyle
```

---

## 🔄 Flujo de Comunicación

```mermaid
sequenceDiagram
    participant P as 🎨 popup.js
    participant B as 🔧 background.js
    participant C as 📜 content.js
    participant S as 💾 Storage
    participant T as 🌐 TikTok
    
    Note over P,T: 🚀 Inicialización del Sistema
    
    P->>+B: ping (health check)
    B-->>-P: {success: true}
    
    P->>+C: getStatus
    C-->>-P: {activo, contador, configuración}
    
    Note over P,T: ⚡ Proceso de Activación
    
    P->>+C: toggleAutomation
    C->>C: 🔍 Validar página TikTok Live
    
    C->>+S: 📥 Cargar configuración
    S-->>-C: {intervalo, tiempoReactivacion}
    
    C->>+B: 📤 started
    B->>B: 🏷️ Badge verde + animación
    B-->>-C: {success: true}
    
    C->>C: ⏰ Iniciar setInterval
    C-->>-P: {success: true, activo: true}
    
    Note over P,T: 🔄 Loop de Automatización Activo
    
    loop Cada intervalo configurado
        C->>+T: 🔍 Buscar botón corazón
        alt Botón encontrado y visible
            T-->>C: ❤️ Elemento disponible
            C->>T: 👆 click()
            C->>C: 📈 contador++
            C->>+S: 💾 Guardar contador
            S-->>-C: {success: true}
            C->>+B: 📊 updateCount
            B->>B: 🔄 Actualizar badge número
            B-->>-C: {success: true}
        else Chat detectado como activo
            C->>C: ⏸️ Pausar automáticamente
            C->>C: 🔔 Mostrar notificación chat
            C->>C: 🕐 Iniciar cuenta regresiva
        end
    end
    
    Note over P,T: 💬 Interacción con Chat
    
    C->>T: 👂 Detectar focus en chat
    T-->>C: 🎯 Usuario interactúa
    C->>C: ⏸️ Pausar por chat
    C->>C: 👁️ Monitorear inactividad
    
    alt Usuario deja de escribir
        C->>C: ⏱️ Timer inactividad
        C->>C: 🕐 Mostrar cuenta regresiva
        C->>C: ▶️ Reanudar automáticamente
    else Usuario sale del chat
        C->>C: ⚡ Reanudar inmediatamente
    end
    
    Note over P,T: ⏹️ Proceso de Desactivación
    
    P->>+C: toggleAutomation
    C->>C: 🧹 Limpiar intervalos
    C->>+B: 📤 stopped
    B->>B: 🏷️ Badge rojo + detener animación
    B-->>-C: {success: true}
    C-->>-P: {success: true, activo: false}
```

---

## ⚡ Proceso de Inicialización

```mermaid
flowchart TD
    START([🚀 Extensión Cargada]) --> MANIFEST{📋 Leer manifest.json}
    
    MANIFEST --> BG_INIT[⚙️ Inicializar background.js]
    MANIFEST --> CS_CHECK{🔍 ¿Página TikTok Live?}
    MANIFEST --> POPUP_READY[🎨 Popup listo para uso]
    
    %% Background initialization path
    BG_INIT --> BG_STATE[📊 Inicializar extensionState]
    BG_STATE --> BG_STORAGE[💾 Configurar storage inicial]
    BG_STORAGE --> BG_BADGE[🏷️ Configurar badge rojo OFF]
    BG_BADGE --> BG_LISTEN[👂 Activar message listeners]
    BG_LISTEN --> BG_SYNC[🔄 Iniciar sync periódico 5s]
    
    %% Content script conditional injection
    CS_CHECK -->|❌ No| CS_WAIT[⏳ Esperar navegación]
    CS_CHECK -->|✅ Sí| CS_INJECT[📜 Inyectar content.js]
    
    CS_WAIT --> CS_CHECK
    
    %% Content script initialization sequence
    CS_INJECT --> CS_IIFE[🔒 Ejecutar IIFE]
    CS_IIFE --> CS_STATE_INIT[📊 Inicializar state global]
    CS_STATE_INIT --> CS_STORAGE_LOAD[💾 Cargar configuración storage]
    CS_STORAGE_LOAD --> CS_UI_CREATE[🎨 Crear interfaz flotante]
    CS_UI_CREATE --> CS_EVENTS[🎯 Configurar event listeners]
    CS_EVENTS --> CS_CHAT_INIT[💬 Inicializar detector chat]
    CS_CHAT_INIT --> CS_MESSAGING[📡 Configurar mensajería]
    CS_MESSAGING --> CS_READY[✅ Content script listo]
    
    %% Popup interaction flow
    POPUP_READY --> POPUP_CLICK{👆 ¿Usuario abre popup?}
    POPUP_CLICK -->|❌ No| POPUP_WAIT[⏳ Esperar interacción]
    POPUP_CLICK -->|✅ Sí| POPUP_LOAD[📄 Cargar popup.html]
    
    POPUP_WAIT --> POPUP_CLICK
    
    POPUP_LOAD --> POPUP_DOM[🏗️ DOM cargado]
    POPUP_DOM --> POPUP_JS[📜 Ejecutar popup.js]
    POPUP_JS --> POPUP_REFS[🔗 Obtener referencias DOM]
    POPUP_REFS --> POPUP_STATUS[🔄 Actualizar estado inicial]
    POPUP_STATUS --> POPUP_EVENTS[🎯 Configurar event listeners]
    POPUP_EVENTS --> POPUP_INTERVAL[⏰ Iniciar actualización periódica]
    POPUP_INTERVAL --> POPUP_READY_FINAL[✅ Popup completamente funcional]
    
    %% Final convergence
    BG_SYNC --> SYSTEM_READY[🎉 Sistema Completamente Inicializado]
    CS_READY --> SYSTEM_READY
    POPUP_READY_FINAL --> SYSTEM_READY
    
    %% Styling
    classDef bgStyle fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef csStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef popupStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef systemStyle fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    
    class BG_INIT,BG_STATE,BG_STORAGE,BG_BADGE,BG_LISTEN,BG_SYNC bgStyle
    class CS_INJECT,CS_IIFE,CS_STATE_INIT,CS_STORAGE_LOAD,CS_UI_CREATE,CS_EVENTS,CS_CHAT_INIT,CS_MESSAGING,CS_READY csStyle
    class POPUP_LOAD,POPUP_DOM,POPUP_JS,POPUP_REFS,POPUP_STATUS,POPUP_EVENTS,POPUP_INTERVAL,POPUP_READY_FINAL popupStyle
    class SYSTEM_READY systemStyle
```

---

## 🎮 Automatización Principal

```mermaid
flowchart TD
    TOGGLE_CLICK([👆 Usuario Toggle]) --> CHECK_STATE{🔍 ¿Estado actual?}
    
    CHECK_STATE -->|🔴 Inactivo| START_FLOW[▶️ Iniciar Automatización]
    CHECK_STATE -->|🟢 Activo| STOP_FLOW[⏹️ Detener Automatización]
    
    %% Start Flow
    START_FLOW --> VALIDATE_PAGE{🎯 ¿TikTok Live válido?}
    VALIDATE_PAGE -->|❌ No| SHOW_ERROR[🚨 Mostrar error]
    VALIDATE_PAGE -->|✅ Sí| SET_ACTIVE[✅ state.activo = true]
    
    SET_ACTIVE --> NOTIFY_BG_START[📡 Notificar background 'started']
    NOTIFY_BG_START --> BG_UPDATE_START[🏷️ Background: badge verde + animación]
    BG_UPDATE_START --> START_INTERVAL[⏰ Iniciar setInterval]
    
    START_INTERVAL --> AUTOMATION_LOOP{🔄 Loop de Automatización}
    
    %% Main Automation Loop
    AUTOMATION_LOOP --> CHECK_ACTIVE{🔍 ¿Sigue activo?}
    CHECK_ACTIVE -->|❌ No| CLEANUP[🧹 Limpiar intervalo]
    CHECK_ACTIVE -->|✅ Sí| CHECK_CHAT{💬 ¿Chat activo?}
    
    CHECK_CHAT -->|✅ Sí| PAUSE_AUTO[⏸️ Pausar automáticamente]
    CHECK_CHAT -->|❌ No| FIND_HEART{❤️ ¿Botón corazón disponible?}
    
    FIND_HEART -->|❌ No| WAIT_HEART[⏳ Esperar botón]
    FIND_HEART -->|✅ Sí| CLICK_HEART[👆 Ejecutar click]
    
    CLICK_HEART --> INCREMENT[📈 Incrementar contador]
    INCREMENT --> UPDATE_STORAGE[💾 Actualizar storage]
    UPDATE_STORAGE --> NOTIFY_BG_COUNT[📡 Notificar background contador]
    NOTIFY_BG_COUNT --> BG_UPDATE_BADGE[🏷️ Actualizar badge número]
    BG_UPDATE_BADGE --> WAIT_INTERVAL[⏱️ Esperar próximo intervalo]
    
    WAIT_INTERVAL --> AUTOMATION_LOOP
    WAIT_HEART --> AUTOMATION_LOOP
    
    %% Pause Flow (Chat interaction)
    PAUSE_AUTO --> SAVE_STATE[💾 Guardar estado de pausa]
    SAVE_STATE --> SHOW_CHAT_NOTIFICATION[🔔 Mostrar notificación chat]
    SHOW_CHAT_NOTIFICATION --> WAIT_CHAT_INACTIVE[⏳ Esperar inactividad chat]
    WAIT_CHAT_INACTIVE --> COUNTDOWN[🕐 Cuenta regresiva reactivación]
    COUNTDOWN --> RESUME_AUTO[▶️ Reanudar automatización]
    RESUME_AUTO --> AUTOMATION_LOOP
    
    %% Stop Flow
    STOP_FLOW --> CLEAR_INTERVAL[⏹️ Limpiar setInterval]
    CLEAR_INTERVAL --> SET_INACTIVE[❌ state.activo = false]
    SET_INACTIVE --> NOTIFY_BG_STOP[📡 Notificar background 'stopped']
    NOTIFY_BG_STOP --> BG_UPDATE_STOP[🏷️ Background: badge rojo + detener animación]
    BG_UPDATE_STOP --> UPDATE_UI[🎨 Actualizar UI a inactivo]
    
    %% Error and cleanup paths
    SHOW_ERROR --> END_FLOW([🏁 Fin del flujo])
    CLEANUP --> END_FLOW
    UPDATE_UI --> END_FLOW
    
    %% Styling
    classDef startStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef stopStyle fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef automationStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef chatStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef bgStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class START_FLOW,SET_ACTIVE,START_INTERVAL,RESUME_AUTO startStyle
    class STOP_FLOW,CLEAR_INTERVAL,SET_INACTIVE stopStyle
    class AUTOMATION_LOOP,CLICK_HEART,INCREMENT,WAIT_INTERVAL automationStyle
    class PAUSE_AUTO,SAVE_STATE,WAIT_CHAT_INACTIVE,COUNTDOWN chatStyle
    class NOTIFY_BG_START,NOTIFY_BG_STOP,NOTIFY_BG_COUNT,BG_UPDATE_START,BG_UPDATE_STOP,BG_UPDATE_BADGE bgStyle
```

---

## 💬 Sistema de Chat

```mermaid
flowchart TD
    CHAT_INIT([🚀 Inicializar Sistema de Chat]) --> IMMEDIATE_SEARCH[🔍 Búsqueda inmediata de chat]
    
    IMMEDIATE_SEARCH --> CHAT_FOUND{❓ ¿Chat encontrado?}
    
    CHAT_FOUND -->|✅ Sí| CONFIGURE_EVENTS[⚙️ Configurar eventos de chat]
    CHAT_FOUND -->|❌ No| START_OBSERVER[👁️ Iniciar MutationObserver]
    
    %% Observer path
    START_OBSERVER --> OBSERVE_DOM[🌐 Observar cambios en DOM]
    OBSERVE_DOM --> DOM_MUTATION{🔄 ¿Mutación detectada?}
    
    DOM_MUTATION -->|❌ No| OBSERVE_DOM
    DOM_MUTATION -->|✅ Sí| SEARCH_IN_MUTATION[🔍 Buscar chat en mutación]
    
    SEARCH_IN_MUTATION --> FOUND_IN_MUTATION{❓ ¿Chat encontrado?}
    FOUND_IN_MUTATION -->|❌ No| OBSERVE_DOM
    FOUND_IN_MUTATION -->|✅ Sí| CLEANUP_OBSERVER[🧹 Limpiar observer]
    
    CLEANUP_OBSERVER --> CONFIGURE_EVENTS
    
    %% Events configuration
    CONFIGURE_EVENTS --> ADD_FOCUS_LISTENER[👂 Agregar listener 'focus']
    ADD_FOCUS_LISTENER --> ADD_INPUT_LISTENER[👂 Agregar listener 'input']
    ADD_INPUT_LISTENER --> ADD_BLUR_LISTENER[👂 Agregar listener 'blur']
    ADD_BLUR_LISTENER --> CHAT_SYSTEM_READY[✅ Sistema de chat configurado]
    
    %% Chat interaction flows
    CHAT_SYSTEM_READY --> WAIT_INTERACTION[⏳ Esperar interacción]
    
    WAIT_INTERACTION --> USER_FOCUSES{👆 ¿Usuario enfoca chat?}
    USER_FOCUSES -->|❌ No| WAIT_INTERACTION
    USER_FOCUSES -->|✅ Sí| PAUSE_AUTOMATION[⏸️ Pausar automatización]
    
    PAUSE_AUTOMATION --> CLEAR_TIMER[🗑️ Limpiar timer previo]
    CLEAR_TIMER --> SHOW_CHAT_NOTIFICATION[🔔 Mostrar notificación 'Chat detectado']
    SHOW_CHAT_NOTIFICATION --> MONITOR_ACTIVITY[👁️ Monitorear actividad]
    
    MONITOR_ACTIVITY --> USER_TYPES{⌨️ ¿Usuario escribe?}
    USER_TYPES -->|✅ Sí| RESET_TIMER[🔄 Resetear timer inactividad]
    USER_TYPES -->|❌ No| CHECK_TIMER{⏱️ ¿Timer expirado?}
    
    RESET_TIMER --> MONITOR_ACTIVITY
    
    CHECK_TIMER -->|❌ No| MONITOR_ACTIVITY
    CHECK_TIMER -->|✅ Sí| START_COUNTDOWN[🕐 Iniciar cuenta regresiva]
    
    START_COUNTDOWN --> SHOW_COUNTDOWN[🔔 Mostrar 'Reactivando en X segundos']
    SHOW_COUNTDOWN --> COUNTDOWN_LOOP{🔄 Loop cuenta regresiva}
    
    COUNTDOWN_LOOP --> COUNTDOWN_TICK[⏰ Tick cuenta regresiva]
    COUNTDOWN_TICK --> UPDATE_NOTIFICATION[🔄 Actualizar notificación]
    UPDATE_NOTIFICATION --> COUNTDOWN_FINISHED{⏱️ ¿Cuenta terminada?}
    
    COUNTDOWN_FINISHED -->|❌ No| COUNTDOWN_LOOP
    COUNTDOWN_FINISHED -->|✅ Sí| REACTIVATE_AUTO[▶️ Reactivar automatización]
    
    REACTIVATE_AUTO --> SHOW_SUCCESS[🔔 Mostrar 'Reactivado automáticamente']
    SHOW_SUCCESS --> WAIT_INTERACTION
    
    %% User blur handling
    MONITOR_ACTIVITY --> USER_BLURS{👋 ¿Usuario sale del chat?}
    USER_BLURS -->|❌ No| MONITOR_ACTIVITY
    USER_BLURS -->|✅ Sí| IMMEDIATE_REACTIVATE[⚡ Reactivar inmediatamente]
    
    IMMEDIATE_REACTIVATE --> WAIT_INTERACTION
    
    %% Styling
    classDef observerStyle fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef eventsStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef pauseStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef countdownStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef reactivateStyle fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    
    class START_OBSERVER,OBSERVE_DOM,SEARCH_IN_MUTATION,CLEANUP_OBSERVER observerStyle
    class CONFIGURE_EVENTS,ADD_FOCUS_LISTENER,ADD_INPUT_LISTENER,ADD_BLUR_LISTENER eventsStyle
    class PAUSE_AUTOMATION,CLEAR_TIMER,MONITOR_ACTIVITY pauseStyle
    class START_COUNTDOWN,COUNTDOWN_LOOP,COUNTDOWN_TICK,UPDATE_NOTIFICATION countdownStyle
    class REACTIVATE_AUTO,IMMEDIATE_REACTIVATE,SHOW_SUCCESS reactivateStyle
```

---

## 🎨 Gestión de Estados

```mermaid
stateDiagram-v2
    [*] --> Inicializando: 🚀 Extension loads
    
    state "🔄 Inicializando" as Inicializando {
        [*] --> CreandoUI: Create floating interface
        CreandoUI --> CargandoConfig: Load saved settings
        CargandoConfig --> ConfigurandoEventos: Configure event listeners
        ConfigurandoEventos --> [*]
    }
    
    Inicializando --> Inactivo: ✅ Ready
    
    state "🔴 Inactivo" as Inactivo {
        [*] --> EnEspera: Waiting for user
        EnEspera --> Validando: User clicks toggle
        Validando --> EstadoError: ❌ Invalid page
        Validando --> Iniciando: ✅ Valid TikTok Live
        EstadoError --> EnEspera: Show error message
        Iniciando --> [*]: Transition to Active
    }
    
    state "🟢 Activo" as Activo {
        [*] --> Ejecutando: Automation started
        Ejecutando --> Ejecutando: Heart button found
        Ejecutando --> EsperandoBoton: Heart button not found
        EsperandoBoton --> Ejecutando: Heart button aparece
        Ejecutando --> Pausado: Chat interaction detected
        
        state "⏸️ Pausado" as Pausado {
            [*] --> ChatActivo: User typing in chat
            ChatActivo --> Monitoreando: Monitor inactivity
            Monitoreando --> CuentaRegresiva: Inactivity detected
            CuentaRegresiva --> ReanudarAuto: Timer expired
            ChatActivo --> ReanudarManual: User leaves chat
            ReanudarAuto --> [*]
            ReanudarManual --> [*]
        }
        
        Pausado --> Ejecutando: Resume automation
        Ejecutando --> [*]: User stops or error
    }
    
    Activo --> Inactivo: 🔴 Stop automation
    Inactivo --> Activo: 🟢 Start automation
    
    state "🚨 Estados de Error" as EstadosError {
        PaginaInvalida: Not TikTok Live page
        BotonNoEncontrado: Heart button not found
        ErrorStorage: Storage operation failed
        ErrorComunicacion: Background communication failed
    }
    
    Inactivo --> EstadosError: Various errors
    Activo --> EstadosError: Runtime errors
    EstadosError --> Inactivo: Recovery or reset
    
    %% Background sync states
    state "🔄 Background Sync" as BackgroundSync {
        [*] --> Sincronizando: Every 5 seconds
        Sincronizando --> ActualizandoBadge: Update badge count
        ActualizandoBadge --> VerificandoEstado: Verify active state
        VerificandoEstado --> AnimandoBadge: If active
        VerificandoEstado --> BadgeEstatico: If inactive
        AnimandoBadge --> [*]
        BadgeEstatico --> [*]
    }
    
    Activo --> BackgroundSync: Continuous sync
    Inactivo --> BackgroundSync: State monitoring
    
    %% UI Update flows
    state "🎨 Actualizaciones UI" as ActualizacionesUI {
        [*] --> SincPopup: Popup queries state
        SincPopup --> ActualizarIndicadores: Update status text
        ActualizarIndicadores --> ActualizarBotones: Update button states
        ActualizarBotones --> ActualizarContadores: Update statistics
        ActualizarContadores --> [*]
    }
    
    Activo --> ActualizacionesUI: State changes
    Inactivo --> ActualizacionesUI: State changes
    BackgroundSync --> ActualizacionesUI: Sync triggered
```

---

## 💾 Sistema de Almacenamiento

```mermaid
graph TB
    subgraph "Chrome Storage System"
        subgraph "Storage Keys"
            TOTAL[totalTapTaps<br/>📊 Contador global]
            TIEMPO[tiempoReactivacion<br/>⏰ Tiempo reactivación]
            ACTIVO[estado_activo<br/>🔄 Estado persistente]
            POSICION[position<br/>📍 Posición UI]
        end
        
        subgraph "Storage Operations"
            GET[chrome.storage.local.get]
            SET[chrome.storage.local.set]
            WATCH[storage.onChanged]
        end
    end
    
    subgraph "Content Script Storage"
        CS_SAVE[safeStorageOperation]
        CS_LOAD[Cargar configuración]
        CS_AUTO[Auto-save on changes]
    end
    
    subgraph "Background Script Storage"
        BG_INIT[Inicialización storage]
        BG_SYNC[Sincronización automática]
        BG_PERSIST[Persistencia de estado]
    end
    
    subgraph "Popup Script Storage"
        POP_LOAD[Cargar estadísticas]
        POP_CONFIG[Configuración usuario]
        POP_UPDATE[Actualización periódica]
    end
    
    %% Data flow
    CS_SAVE --> SET
    CS_LOAD --> GET
    BG_INIT --> SET
    BG_SYNC --> GET
    BG_PERSIST --> SET
    POP_LOAD --> GET
    POP_CONFIG --> SET
    POP_UPDATE --> GET
    
    SET --> TOTAL
    SET --> TIEMPO
    SET --> ACTIVO
    SET --> POSICION
    
    GET --> TOTAL
    GET --> TIEMPO
    GET --> ACTIVO
    GET --> POSICION
    
    %% Cross-component sync
    WATCH --> CS_AUTO
    WATCH --> BG_SYNC
    WATCH --> POP_UPDATE
    
    %% Styling
    classDef storageStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef operationStyle fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef csStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef bgStyle fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef popupStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    
    class TOTAL,TIEMPO,ACTIVO,POSICION storageStyle
    class GET,SET,WATCH operationStyle
    class CS_SAVE,CS_LOAD,CS_AUTO csStyle
    class BG_INIT,BG_SYNC,BG_PERSIST bgStyle
    class POP_LOAD,POP_CONFIG,POP_UPDATE popupStyle
```

### 🔄 Flujo de Sincronización

```mermaid
sequenceDiagram
    participant T as ⏰ Timer (5s)
    participant B as 🔧 background.js
    participant C as 📜 content.js
    participant S as 💾 Storage
    participant UI as 🎨 Badge UI
    
    Note over T,UI: 🔄 Proceso de Sincronización Automática
    
    loop Cada 5 segundos
        T->>+B: ⏰ Trigger sync
        
        B->>+C: 📡 {action: 'getStatus'}
        
        alt Content script responde
            C->>+S: 📥 Obtener estado actual
            S-->>-C: {contador, activo, etc}
            C-->>-B: {contador, activo, contexto}
            
            B->>B: 📊 extensionState.contador = valor
            B->>B: 🔄 extensionState.active = estado
            
            B->>+UI: 🏷️ updateBadge(contador)
            UI-->>-B: Badge actualizado
            
            alt Si está activo
                B->>+UI: ✨ animateBadge()
                UI-->>-B: Animación iniciada
            end
            
        else Content script no responde
            Note over B,C: 🚨 Error silencioso (tab sin content script)
        end
    end
    
    B-->>-T: ✅ Sincronización completada
```

---

## 📊 Correcciones JavaScript (Junio-Junio 2025)

> **🎉 Estado Final**: Sistema completamente estable, todas las correcciones implementadas y validadas

### 🐛 Error de Scope: reactivarAutoTapTap

```mermaid
graph TB
    subgraph "❌ Problema Original"
        CONF[configurarEventosChat]
        LOCAL[reactivarAutoTapTap función local]
        MOSTRAR[mostrarCuentaRegresiva]
        ERROR[🚨 ReferenceError: reactivarAutoTapTap is not defined]
        
        CONF --> LOCAL
        MOSTRAR --> ERROR
        LOCAL -.->|No accesible| MOSTRAR
    end
    
    subgraph "✅ Solución Aplicada"
        GLOBAL[reactivarAutoTapTap función global]
        SEARCH[🔍 Búsqueda dinámica de chat]
        ROBUST[🛡️ Manejo de errores try-catch]
        SUCCESS[🎯 Llamada exitosa desde cualquier scope]
        
        GLOBAL --> SEARCH
        GLOBAL --> ROBUST
        MOSTRAR --> SUCCESS
        GLOBAL -.->|Accesible globalmente| MOSTRAR
    end
    
    %% Styling
    classDef errorStyle fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef successStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef processStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    
    class ERROR errorStyle
    class GLOBAL,SEARCH,ROBUST,SUCCESS successStyle
    class CONF,LOCAL,MOSTRAR processStyle
```

### 🔄 Flujo de Corrección updateTapTaps

```mermaid
sequenceDiagram
    participant P as 🎨 popup.js
    participant C as 📜 content.js
    participant S as 💾 Storage
    
    Note over P,S: 🔄 Reset Contador (Corrección Junio 2025)
    
    P->>+C: 📤 {action: 'updateTapTaps', count: 0}
    
    C->>C: ✅ Validar request.hasOwnProperty('count')
    C->>C: ✅ Validar typeof request.count === 'number'
    
    alt Validación exitosa
        C->>C: 🔄 state.contador = request.count
        C->>C: 📱 elementos.contadorDiv.textContent = `Tap-Taps: ${count}`
        C-->>P: {success: true}
        
        P->>P: 🎨 updateUI con contador reseteado
        
    else Validación falla
        C-->>P: {error: 'Valor de contador inválido'}
        P->>P: 🚨 Mostrar error en UI
    end
    
    deactivate C
```

### 🕐 Flujo de Cuenta Regresiva (timers)

```mermaid
graph LR
    INIT[🚀 Inicialización] --> TIMERS_DEF[📊 Definir objeto timers global]
    
    TIMERS_DEF --> TIMERS_OBJ{🔧 timers object}
    
    TIMERS_OBJ --> TYPING[⌨️ typing: null]
    TIMERS_OBJ --> CHAT[💬 chat: null]
    TIMERS_OBJ --> COUNTDOWN[🕐 countdown: null]
    TIMERS_OBJ --> CUENTA[🔔 cuentaRegresiva: null]
    TIMERS_OBJ --> CLEANUP[🧹 cleanupAll method]
    
    CUENTA --> MOSTRAR_CUENTA[📱 mostrarCuentaRegresiva]
    
    MOSTRAR_CUENTA --> ACCESS_OK[✅ Acceso correcto a timers]
    ACCESS_OK --> NO_ERROR[🚫 Sin 'timers is not defined']
    
    %% Styling
    classDef successStyle fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef timerStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class ACCESS_OK,NO_ERROR successStyle
    class TYPING,CHAT,COUNTDOWN,CUENTA,CLEANUP timerStyle
```

---

## 🎉 Estado Final de Diagramas (Junio 2025)

### 📊 Resumen de Diagramas Técnicos Completos

**🏆 Documentación Visual Completa**: Todos los diagramas técnicos han sido **actualizados y validados** para reflejar el estado final del sistema TikTok Auto Tap-Tap.

#### 🎯 Diagramas Incluidos

```bash
✅ ARQUITECTURA GENERAL: Componentes principales y relaciones
✅ FLUJO DE COMUNICACIÓN: Secuencia de mensajes entre componentes
✅ PROCESO DE INICIALIZACIÓN: Carga completa del sistema
✅ AUTOMATIZACIÓN PRINCIPAL: Lógica de tap-taps y control
✅ SISTEMA DE CHAT: Detección y pausa inteligente
✅ GESTIÓN DE ESTADOS: Estados del sistema y transiciones
✅ SISTEMA DE ALMACENAMIENTO: Persistencia y sincronización
✅ CORRECCIONES JAVASCRIPT: Errores resueltos y flujos
```

#### 🔧 Diagramas Técnicos Verificados

```mermaid
graph TB
    subgraph "📚 Documentación Final"
        D1[🎯 Arquitectura General]
        D2[🔄 Flujo de Comunicación]
        D3[⚡ Inicialización]
        D4[🎮 Automatización]
        D5[💬 Sistema Chat]
        D6[🎨 Estados]
        D7[💾 Storage]
        D8[📊 Correcciones JS]
        
        STATUS[✅ TODOS VALIDADOS]
    end
    
    D1 --> STATUS
    D2 --> STATUS
    D3 --> STATUS
    D4 --> STATUS
    D5 --> STATUS
    D6 --> STATUS
    D7 --> STATUS
    D8 --> STATUS
    
    classDef validatedStyle fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    class D1,D2,D3,D4,D5,D6,D7,D8,STATUS validatedStyle
```

#### 🎨 Propósito de la Documentación Visual

**📋 Para Desarrolladores:**
- ✅ **Comprensión inmediata** de la arquitectura del sistema
- ✅ **Flujos de datos** claros y documentados visualmente
- ✅ **Puntos de integración** identificados y explicados
- ✅ **Debugging visual** para localizar problemas rápidamente

**📋 Para Testing:**
- ✅ **Validación de flujos** mediante diagramas de secuencia
- ✅ **Verificación de estados** con diagramas de estado
- ✅ **Cobertura de testing** basada en componentes visualizados

**📋 Para Mantenimiento:**
- ✅ **Documentación actualizada** que refleja el estado real del código
- ✅ **Evolución del sistema** documentada visualmente
- ✅ **Puntos críticos** identificados para futuras actualizaciones

### 🏅 Certificación de Diagramas

**🎖️ ESTADO**: **DOCUMENTACIÓN VISUAL COMPLETA**  
**📅 ACTUALIZACIÓN**: Junio 2025  
**🔍 VERIFICACIÓN**: Todos los diagramas reflejan el estado actual del código  
**✅ READY FOR REFERENCE**: **CERTIFICADO PARA USO**

---

## 📝 Nota Final - Junio 2025

> **📅 Fecha de Consolidación**: 10 de Junio de 2025  
> **🎯 Propósito**: Documentación visual técnica completa y verificada  
> **✅ Estado**: Todos los diagramas actualizados y validados

**Esta documentación de diagramas técnicos representa la culminación del desarrollo visual del proyecto TikTok Auto Tap-Tap**. Cada diagrama ha sido verificado para asegurar que refleje con precisión el comportamiento y la arquitectura actual del sistema.

### 🔄 Sincronización con Código

- **📊 Diagramas**: Actualizados para reflejar todas las correcciones implementadas
- **🔧 Flujos**: Validados contra el comportamiento real del sistema
- **📋 Estados**: Documentados según la lógica actual implementada
- **💾 Storage**: Reflejando la estructura de datos actual

**Los diagramas técnicos están ahora completamente sincronizados con el código y listos para uso de referencia.**

---

*🎉 Documentación visual técnica completa y verificada - Junio 2025*

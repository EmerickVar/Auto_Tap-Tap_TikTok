# 🏗️ DIAGRAMA COMPLETO DE ARQUITECTURA Y FLUJOS
## TikTok Auto Tap-Tap - Chrome Extension

**📅 Fecha de Actualización:** 7 de diciembre de 2024  
**👨‍💻 Desarrollador:** Emerick Echeverría Vargas  
**📊 Estado:** Arquitectura actualizada con sistema contextual

---

## 📋 **ÍNDICE DE DIAGRAMAS**

1. [🎯 Arquitectura General](#-arquitectura-general)
2. [🔄 Flujo de Comunicación entre Componentes](#-flujo-de-comunicación-entre-componentes)
3. [⚡ Proceso de Inicialización](#-proceso-de-inicialización)
4. [🎮 Flujo de Automatización Principal](#-flujo-de-automatización-principal)
5. [💬 Sistema de Detección de Chat](#-sistema-de-detección-de-chat)
6. [🎨 Gestión de UI y Estados](#-gestión-de-ui-y-estados)
7. [💾 Sistema de Almacenamiento](#-sistema-de-almacenamiento)
8. [🔄 Sincronización y Background](#-sincronización-y-background)

---

## 🎯 **ARQUITECTURA GENERAL**

```mermaid
graph TB
    subgraph "Chrome Extension Architecture"
        subgraph "Manifest V3"
            M[manifest.json]
        end
        
        subgraph "Background Script"
            BG[background.js]
            SW[Service Worker]
            BADGE[Badge System]
            SYNC[Sync Manager]
        end
        
        subgraph "Content Script"
            CS[content.js]
            IIFE[IIFE Container]
            STATE[State Manager]
            UI[UI Creator]
            CHAT[Chat Detector]
            AUTO[Automation Engine]
        end
        
        subgraph "Popup Interface"
            PH[popup.html]
            PC[popup.css]
            PJ[popup.js]
            CTRL[Controls]
            STATS[Statistics]
        end
        
        subgraph "Storage System"
            LS[chrome.storage.local]
            CONFIG[Configuration]
            PERSIST[Persistence]
        end
        
        subgraph "TikTok Page"
            DOM[TikTok DOM]
            LIVE[Live Stream]
            CHAT_INPUT[Chat Input]
            HEART_BTN[Heart Button]
        end
    end
    
    %% Connections
    M --> BG
    M --> CS
    M --> PH
    
    BG --> SW
    BG --> BADGE
    BG --> SYNC
    
    CS --> IIFE
    CS --> STATE
    CS --> UI
    CS --> CHAT
    CS --> AUTO
    
    PH --> PC
    PH --> PJ
    PJ --> CTRL
    PJ --> STATS
    
    CS <==> DOM
    AUTO --> HEART_BTN
    CHAT --> CHAT_INPUT
    
    BG <==> LS
    CS <==> LS
    PJ <==> LS
    
    LS --> CONFIG
    LS --> PERSIST
    
    %% Messaging
    BG <==> CS
    BG <==> PJ
    PJ <==> CS
```

---

## 🔄 **FLUJO DE COMUNICACIÓN ENTRE COMPONENTES**

```mermaid
sequenceDiagram
    participant P as popup.js
    participant B as background.js
    participant C as content.js
    participant S as chrome.storage
    participant T as TikTok DOM
    
    Note over P,T: 🚀 Usuario abre popup
    
    P->>+B: ping (health check)
    B-->>-P: success: true
    
    P->>+C: getStatus
    C-->>-P: activo, contador, tiempoReactivacion
    
    Note over P,T: 👆 Usuario activa automatización
    
    P->>+C: toggleAutomation
    C->>C: Validar página TikTok
    C->>+S: Cargar configuración
    S-->>-C: intervalo, reactivacionTime
    C->>C: state.activo = true
    C->>+B: started
    B->>B: Actualizar badge verde
    B-->>-C: Badge actualizado
    C->>C: Iniciar setInterval
    C-->>-P: success: true, activo: true
    
    Note over P,T: 🔄 Loop de automatización activo
    
    loop Cada intervalo configurado
        C->>+T: Buscar botón corazón
        alt Botón encontrado y visible
            T-->>C: Elemento corazón
            C->>T: click()
            C->>C: contador++
            C->>+S: Guardar contador
            S-->>-C: Guardado exitoso
        else Botón no encontrado
            C->>C: Log error
        end
    end
    
    Note over P,T: 💬 Detección de chat activo
    
    loop Monitor continuo
        C->>+T: Observar cambios en chat
        T-->>-C: MutationEvent
        C->>C: Procesar mensajes
        C->>+S: Actualizar último chat visto
        S-->>-C: Guardado exitoso
    end
    
    Note over P,T: ⏹️ Usuario desactiva
    
    P->>+C: toggleAutomation
    C->>C: state.activo = false
    C->>C: clearInterval
    C->>+B: stopped
    B->>B: Actualizar badge gris
    B-->>-C: Badge actualizado
    C->>+S: Guardar estado final
    S-->>-C: Estado guardado
    C-->>-P: success: true, activo: false
    
    Note over P,T: 🔄 Sincronización periódica
    
    loop Cada 30 segundos
        B->>+C: sync request
        C->>+S: Guardar estado actual
        S-->>-C: Estado sincronizado
        C-->>-B: Sync completo
    end
```

---

## ⚡ **PROCESO DE INICIALIZACIÓN**

```mermaid
flowchart TD
    START([🚀 Extensión Cargada]) --> MANIFEST{📋 Leer manifest.json}
    
    MANIFEST --> BG_INIT[⚙️ Inicializar background.js]
    MANIFEST --> CS_CHECK{🔍 ¿Página TikTok Live?}
    MANIFEST --> POPUP_READY[🎨 Popup listo para uso]
    
    %% Background initialization
    BG_INIT --> BG_STATE[📊 Inicializar extensionState]
    BG_STATE --> BG_STORAGE[💾 Configurar storage inicial]
    BG_STORAGE --> BG_BADGE[🏷️ Configurar badge rojo]
    BG_BADGE --> BG_LISTEN[👂 Activar message listeners]
    BG_LISTEN --> BG_SYNC[🔄 Iniciar sync periódico]
    
    %% Content script check
    CS_CHECK -->|❌ No| CS_WAIT[⏳ Esperar navegación]
    CS_CHECK -->|✅ Sí| CS_INJECT[📜 Inyectar content.js]
    
    CS_WAIT --> CS_CHECK
    
    %% Content script initialization
    CS_INJECT --> CS_IIFE[🔒 Ejecutar IIFE]
    CS_IIFE --> CS_STATE_INIT[📊 Inicializar state]
    CS_STATE_INIT --> CS_STORAGE_LOAD[💾 Cargar configuración]
    CS_STORAGE_LOAD --> CS_UI_CREATE[🎨 Crear interfaz flotante]
    CS_UI_CREATE --> CS_EVENTS[🎯 Configurar event listeners]
    CS_EVENTS --> CS_CHAT_INIT[💬 Inicializar detector de chat]
    CS_CHAT_INIT --> CS_MESSAGING[📡 Configurar mensajería]
    CS_MESSAGING --> CS_READY[✅ Content script listo]
    
    %% Popup interaction
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
    
    %% Final states
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

## 🎮 **FLUJO DE AUTOMATIZACIÓN PRINCIPAL**

```mermaid
flowchart TD
    TOGGLE_CLICK([👆 Usuario hace clic en Toggle]) --> CHECK_STATE{🔍 ¿Estado actual?}
    
    CHECK_STATE -->|🔴 Inactivo| START_FLOW[▶️ Iniciar Automatización]
    CHECK_STATE -->|🟢 Activo| STOP_FLOW[⏹️ Detener Automatización]
    
    %% Start Flow
    START_FLOW --> VALIDATE_PAGE{🎯 ¿Página TikTok Live válida?}
    VALIDATE_PAGE -->|❌ No| SHOW_ERROR[🚨 Mostrar error]
    VALIDATE_PAGE -->|✅ Sí| SET_ACTIVE[✅ state.activo = true]
    
    SET_ACTIVE --> NOTIFY_BG_START[📡 Notificar background 'started']
    NOTIFY_BG_START --> BG_UPDATE_START[🏷️ Background: badge verde + animación]
    BG_UPDATE_START --> START_INTERVAL[⏰ Iniciar setInterval]
    
    START_INTERVAL --> AUTOMATION_LOOP{🔄 Loop de Automatización}
    
    %% Automation Loop
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
    
    %% Pause Flow (Chat)
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
```

---

## 💬 **SISTEMA DE DETECCIÓN DE CHAT**

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
    
    START_COUNTDOWN --> SHOW_COUNTDOWN[🔔 Mostrar "Reactivando en X segundos"]
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

## 🎨 **GESTIÓN DE UI Y ESTADOS**

```mermaid
stateDiagram-v2
    [*] --> Initializing: 🚀 Extension loads
    
    state "🔄 Initializing" as Initializing {
        [*] --> CreatingUI: Create floating interface
        CreatingUI --> LoadingConfig: Load saved settings
        LoadingConfig --> SettingEvents: Configure event listeners
        SettingEvents --> [*]
    }
    
    Initializing --> Inactive: ✅ Ready
    
    state "🔴 Inactive" as Inactive {
        [*] --> Standby: Waiting for user
        Standby --> ValidatingPage: User clicks toggle
        ValidatingPage --> ErrorState: ❌ Invalid page
        ValidatingPage --> StartingUp: ✅ Valid TikTok Live
        ErrorState --> Standby: Show error message
        StartingUp --> [*]: Transition to Active
    }
    
    state "🟢 Active" as Active {
        [*] --> Running: Automation started
        Running --> Executing: Heart button found
        Executing --> Waiting: Click executed
        Waiting --> Running: Interval elapsed
        Running --> Paused: Chat interaction detected
        
        state "⏸️ Paused" as Paused {
            [*] --> ChatActive: User typing in chat
            ChatActive --> Monitoring: Monitor inactivity
            Monitoring --> Countdown: Inactivity detected
            Countdown --> AutoResume: Timer expired
            ChatActive --> ManualResume: User leaves chat
            AutoResume --> [*]
            ManualResume --> [*]
        }
        
        Paused --> Running: Resume automation
        Running --> [*]: User stops or error
    }
    
    Active --> Inactive: 🔴 Stop automation
    Inactive --> Active: 🟢 Start automation
    
    state "🚨 Error States" as ErrorStates {
        InvalidPage: Not TikTok Live page
        NoHeartButton: Heart button not found
        StorageError: Storage operation failed
        CommunicationError: Background communication failed
    }
    
    Inactive --> ErrorStates: Various errors
    Active --> ErrorStates: Runtime errors
    ErrorStates --> Inactive: Recovery or reset
    
    %% Background sync states
    state "🔄 Background Sync" as BackgroundSync {
        [*] --> Syncing: Every 5 seconds
        Syncing --> UpdatingBadge: Update badge count
        UpdatingBadge --> CheckingState: Verify active state
        CheckingState --> AnimatingBadge: If active
        CheckingState --> StaticBadge: If inactive
        AnimatingBadge --> [*]
        StaticBadge --> [*]
    }
    
    Active --> BackgroundSync: Continuous sync
    Inactive --> BackgroundSync: State monitoring
    
    %% UI Update flows
    state "🎨 UI Updates" as UIUpdates {
        [*] --> PopupSync: Popup queries state
        PopupSync --> UpdateIndicators: Update status text
        UpdateIndicators --> UpdateButtons: Update button states
        UpdateButtons --> UpdateCounters: Update statistics
        UpdateCounters --> [*]
    }
    
    Active --> UIUpdates: State changes
    Inactive --> UIUpdates: State changes
    BackgroundSync --> UIUpdates: Sync triggered
```

---

## 💾 **SISTEMA DE ALMACENAMIENTO**

```mermaid
graph TB
    subgraph "Chrome Storage System"
        subgraph "Storage Keys"
            TOTAL[totalTapTaps<br/>📊 Contador global]
            TIEMPO[tiempoReactivacion<br/>⏰ Tiempo de reactivación]
            ACTIVO[estado_activo<br/>🔄 Estado persistente]
        end
        
        subgraph "Storage Operations"
            GET[chrome.storage.local.get()]
            SET[chrome.storage.local.set()]
            WATCH[storage.onChanged]
        end
    end
    
    subgraph "Content Script Storage"
        CS_SAVE[safeStorageOperation()]
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
        POP_CONFIG[Configuración de usuario]
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
    
    GET --> TOTAL
    GET --> TIEMPO
    GET --> ACTIVO
    
    %% Cross-component sync
    WATCH --> CS_AUTO
    WATCH --> BG_SYNC
    WATCH --> POP_UPDATE
    
    %% Storage flow sequence
    subgraph "Storage Operations Flow"
        START_OP([Operation Initiated])
        VALIDATE[Validate Data]
        EXECUTE[Execute Operation]
        ERROR_CHECK{Error?}
        SUCCESS[Success Response]
        ERROR_HANDLE[Error Handling]
        RETRY{Retry?}
        FALLBACK[Fallback/Default]
        
        START_OP --> VALIDATE
        VALIDATE --> EXECUTE
        EXECUTE --> ERROR_CHECK
        ERROR_CHECK -->|No| SUCCESS
        ERROR_CHECK -->|Yes| ERROR_HANDLE
        ERROR_HANDLE --> RETRY
        RETRY -->|Yes| EXECUTE
        RETRY -->|No| FALLBACK
    end
```
```

---

## 🔄 **SINCRONIZACIÓN Y BACKGROUND**

```mermaid
sequenceDiagram
    participant T as Timer (5s)
    participant B as background.js
    participant TAB as Active Tabs
    participant C as content.js
    participant UI as Badge/UI
    participant S as Storage
    
    Note over T,S: 🔄 Sincronización Automática cada 5 segundos
    
    T->>+B: ⏰ Timer trigger
    B->>B: 🔍 Iniciar syncState()
    
    B->>+TAB: 📋 chrome.tabs.query({active: true})
    TAB-->>-B: Array de tabs activos
    
    loop Para cada tab de TikTok
        B->>+C: 📡 sendMessage('getStatus')
        
        alt Content script responde
            C->>C: 📊 Obtener estado actual
            C-->>-B: {activo: boolean, contador: number}
            B->>B: 🔄 Actualizar extensionState
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
    
    Note over T,S: 📡 Comunicación de Mensajes Runtime
    
    participant CS as content.js
    participant BG as background.js
    participant P as popup.js
    
    Note over CS,P: 🎮 Flujo de Automatización
    
    CS->>+BG: 📤 {action: 'started', contador: X}
    BG->>BG: ✅ extensionState.active = true
    BG->>BG: 🏷️ Badge a verde + "ON"
    BG->>BG: ✨ Iniciar animateBadge()
    BG-->>-CS: {success: true}
    
    loop Durante automatización
        CS->>+BG: 📤 {action: 'updateTapTaps', count: X}
        BG->>BG: 📊 extensionState.contador = X
        BG->>+UI: 🔢 updateBadge(X)
        UI-->>-BG: Badge actualizado con número
        BG-->>-CS: {success: true}
        
        CS->>+S: 💾 set totalTapTaps: X
        S-->>-CS: Guardado exitoso
    end
    
    Note over CS,P: 🎨 Popup abierto - Actualización UI
    
    P->>+CS: 📡 action: getStatus
    CS-->>-P: activo: true, contador: X, tiempoReactivacion: Y
    
    P->>+S: 📊 get totalTapTaps
    S-->>-P: totalTapTaps: Z
    
    P->>P: 🎨 updateUI activo, contador
    P->>P: 📈 Mostrar estadísticas
    
    Note over CS,P: ⏹️ Detener Automatización
    
    P->>+CS: 📤 action: toggle
    CS->>CS: ⏹️ Detener intervalos
    CS->>+BG: 📤 action: stopped
    BG->>BG: ❌ extensionState.active = false
    BG->>BG: 🏷️ Badge a rojo + OFF
    BG->>BG: 🛑 Detener animación
    BG-->>-CS: success: true
    CS-->>-P: success: true
    
    P->>P: 🎨 updateUI false, contador
```

---

## 📊 **MÉTRICAS Y ESTADÍSTICAS DEL SISTEMA**

### 🔢 **Componentes Principales**
- **6 archivos** principales de código
- **4 sistemas** de comunicación inter-componentes  
- **3 interfaces** de usuario (content UI, popup, badge)
- **2 sistemas** de almacenamiento (chrome.storage + estado runtime)
- **1 service worker** para gestión de background

### ⚡ **Flujos de Datos**
- **12 tipos** de mensajes diferentes entre componentes
- **5 segundos** de intervalo de sincronización automática
- **3 niveles** de manejo de errores y recuperación
- **2 tipos** de persistencia (sesión + permanente)

### 🎯 **Puntos de Integración**
- **Chrome APIs**: `tabs`, `storage`, `runtime`, `action`
- **TikTok DOM**: Detección de elementos, eventos de chat
- **UI Components**: 3 interfaces sincronizadas en tiempo real
- **Background Tasks**: Sincronización, badges, persistencia

---

## 👨‍💻 **Información del Desarrollador**
- **Autor**: Emerick Echeverría Vargas (@EmerickVar)
- **Organización**: New Age Coding Organization
- **Proyecto**: TikTok Auto Tap-Tap Chrome Extension
- **Versión**: 1.0.0
- **Fecha de diagramas**: 7 de diciembre de 2024

---

> **📌 Nota**: Estos diagramas representan la arquitectura completa y todos los flujos de la extensión TikTok Auto Tap-Tap, proporcionando una visión comprehensiva del sistema para desarrolladores, colaboradores y futuras modificaciones del proyecto.

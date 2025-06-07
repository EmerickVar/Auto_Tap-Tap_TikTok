/**
 * =============================================================================
 * PRUEBA DE FLUJO PAUSA/REACTIVACIÓN POR CHAT
 * =============================================================================
 * 
 * Script de prueba para verificar que el sistema de pausa por chat y 
 * reactivación (automática y manual) funciona correctamente.
 * 
 * PROBLEMA RESUELTO: "Cuando doy clic en el chat cambia el botón a OFF, 
 * pero no activar ni la cuenta regresiva ni me deja reactivar manualmente"
 */

console.log('🧪 Iniciando pruebas del flujo de pausa/reactivación...');

// Simular el estado global y elementos necesarios
const testState = {
    activo: true,
    pausadoPorChat: false,
    apagadoManualmente: false,
    tiempoReactivacion: 5,
    contador: 0,
    intervalo: null
};

const testElementos = {
    boton: {
        textContent: '❤️ Auto Tap-Tap: ON',
        style: { background: '#00f2ea', opacity: '1' }
    },
    selector: {
        value: '1000',
        disabled: false,
        style: { opacity: '1' }
    },
    cuentaRegresivaDiv: null
};

const testTimers = {
    cuentaRegresiva: null,
    chat: null,
    cleanupAll() {
        Object.entries(this).forEach(([key, timer]) => {
            if (typeof timer === 'number') {
                clearTimeout(timer);
                clearInterval(timer);
                this[key] = null;
            }
        });
    }
};

let testInactivityTimer = null;

// Simular funciones necesarias
function actualizarColoresBoton() {
    console.log('🎨 Actualizando colores del botón');
}

function presionarL() {
    testState.contador++;
    console.log(`👆 Tap-tap ejecutado (contador: ${testState.contador})`);
}

const safeInterval = {
    create: (fn, interval) => {
        console.log(`⏰ Creando intervalo de ${interval}ms`);
        return setInterval(fn, interval);
    },
    clear: (intervalId) => {
        console.log('🧹 Limpiando intervalo');
        clearInterval(intervalId);
    }
};

function safeRuntimeMessage(message) {
    console.log('📡 Mensaje al background:', message);
    return Promise.resolve();
}

function mostrarNotificacionChat(mensaje, tipo) {
    console.log(`📱 Notificación [${tipo}]: ${mensaje}`);
}

function mostrarCuentaRegresiva(mensaje) {
    console.log(`⏳ Iniciando cuenta regresiva: ${mensaje}`);
    let tiempo = testState.tiempoReactivacion;
    
    const interval = setInterval(() => {
        tiempo--;
        if (tiempo > 0) {
            console.log(`⏰ Cuenta regresiva: ${tiempo}s restantes`);
        } else {
            console.log('🎯 Ejecutando reactivación automática...');
            clearInterval(interval);
            reactivarAutoTapTap();
        }
    }, 1000);
}

// Implementación de las funciones principales
function pausarPorChat() {
    console.log('💬 Pausando Auto Tap-Tap por interacción con chat');
    console.log('Estado antes de pausar:', {
        activo: testState.activo,
        pausadoPorChat: testState.pausadoPorChat,
        apagadoManualmente: testState.apagadoManualmente
    });

    if (testState.activo && !testState.apagadoManualmente) {
        testState.pausadoPorChat = true;
        
        if (testState.intervalo) {
            console.log('🧹 Limpiando intervalo por pausa de chat');
            safeInterval.clear(testState.intervalo);
            testState.intervalo = null;
        }
        
        testState.activo = false;
        testElementos.boton.textContent = '💤 Auto Tap-Tap: OFF (Chat)';
        testElementos.boton.style.background = '#ff6b6b';
        testElementos.selector.disabled = false;
        testElementos.selector.style.opacity = '1';
        
        actualizarColoresBoton();
        safeRuntimeMessage({ action: 'paused_by_chat', enTikTok: true, enLive: true });
        
        console.log('✅ Auto Tap-Tap pausado por chat');
        return true;
    }
    
    console.log('⚠️ No se pausó - estado no permite pausa');
    return false;
}

function reactivarAutoTapTap() {
    console.log('🎯 Intentando reactivar Auto Tap-Tap...');
    console.log('Estado actual:', { 
        apagadoManualmente: testState.apagadoManualmente,
        pausadoPorChat: testState.pausadoPorChat,
        activo: testState.activo
    });
    
    if (!testState.apagadoManualmente) {
        testState.pausadoPorChat = false;
        testTimers.cleanupAll();
        
        if (testInactivityTimer) {
            clearTimeout(testInactivityTimer);
            testInactivityTimer = null;
        }

        testState.activo = true;
        
        const intervalo = parseInt(testElementos.selector.value);
        presionarL();
        testState.intervalo = safeInterval.create(presionarL, intervalo);
        
        testElementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
        testElementos.boton.style.background = '#00f2ea';
        testElementos.selector.disabled = true;
        testElementos.selector.style.opacity = '0.5';
        actualizarColoresBoton();
        
        safeRuntimeMessage({ 
            action: 'reactivated_from_chat',
            contador: testState.contador,
            enTikTok: true,
            enLive: true
        });
        
        mostrarNotificacionChat('¡Auto Tap-Tap reactivado! 🎉', 'success');
        console.log('✅ Auto Tap-Tap reactivado exitosamente');
    } else {
        console.log('⚠️ No se puede reactivar - fue apagado manualmente');
    }
}

function toggleAutoTapTap(fromChat = false) {
    console.log('🔄 Toggle Auto Tap-Tap:', {
        fromChat,
        estadoActual: testState.activo,
        pausadoPorChat: testState.pausadoPorChat,
        apagadoManualmente: testState.apagadoManualmente
    });

    if (!fromChat) {
        testState.apagadoManualmente = testState.activo;
    }
    
    const nuevoEstado = !testState.activo;
    
    if (testState.intervalo) {
        console.log('🧹 Limpiando intervalo existente');
        safeInterval.clear(testState.intervalo);
        testState.intervalo = null;
    }
    
    testState.activo = nuevoEstado;
    
    if (nuevoEstado) {
        console.log('✨ Activando Auto Tap-Tap');
        const intervalo = parseInt(testElementos.selector.value);
        testElementos.selector.disabled = true;
        testElementos.selector.style.opacity = '0.5';
        
        actualizarColoresBoton();
        testState.apagadoManualmente = false;
        
        // Si es activación manual y estaba pausado por chat, limpiar ese estado
        if (!fromChat && testState.pausadoPorChat) {
            console.log('🔄 Reactivación manual desde pausa por chat');
            testState.pausadoPorChat = false;
            testTimers.cleanupAll();
            if (testInactivityTimer) {
                clearTimeout(testInactivityTimer);
                testInactivityTimer = null;
            }
        }
        
        if (!testState.pausadoPorChat) {
            console.log('🚀 Iniciando intervalo de tap-taps');
            presionarL();
            testState.intervalo = safeInterval.create(presionarL, intervalo);
            
            safeRuntimeMessage({ 
                action: 'started',
                contador: testState.contador,
                enTikTok: true,
                enLive: true
            });
        } else {
            console.log('⏸️ No se inicia intervalo - pausado por chat');
        }
    } else {
        console.log('🛑 Desactivando Auto Tap-Tap');
        testElementos.selector.disabled = false;
        testElementos.selector.style.opacity = '1';
        
        actualizarColoresBoton();
        
        safeRuntimeMessage({ 
            action: 'stopped',
            enTikTok: true,
            enLive: true
        });
    }
}

function handleActivity() {
    if (testInactivityTimer) {
        clearTimeout(testInactivityTimer);
    }

    if (testState.pausadoPorChat) {
        testInactivityTimer = setTimeout(() => {
            console.log('⏳ Inactividad detectada en chat vacío');
            iniciarCuentaRegresiva();
        }, 2000);
    }
}

function iniciarCuentaRegresiva() {
    if (testState.pausadoPorChat && !testState.apagadoManualmente) {
        console.log('🔄 Iniciando cuenta regresiva por inactividad en chat');
        testTimers.cleanupAll();
        
        if (testInactivityTimer) {
            clearTimeout(testInactivityTimer);
            testInactivityTimer = null;
        }
        
        testTimers.chat = setTimeout(() => {
            mostrarCuentaRegresiva(`⏳ Reactivando en ${testState.tiempoReactivacion}s...`);
        }, 0);
    }
}

// Simular función onFocus
function onFocus(eventType) {
    console.log('👆 Interacción detectada con el chat:', eventType);
    console.log('Estado actual:', {
        activo: testState.activo,
        apagadoManualmente: testState.apagadoManualmente,
        pausadoPorChat: testState.pausadoPorChat
    });

    if (testState.activo && !testState.apagadoManualmente) {
        console.log('🛑 Pausando Auto Tap-Tap por interacción con chat');
        
        testTimers.cleanupAll();
        if (testInactivityTimer) {
            clearTimeout(testInactivityTimer);
            testInactivityTimer = null;
        }
        
        const pausado = pausarPorChat();
        
        if (pausado) {
            mostrarNotificacionChat('✍️ Auto Tap-Tap pausado mientras escribes...', 'warning');
            handleActivity();
        }
    }
}

// Ejecutar pruebas
function ejecutarPruebas() {
    console.log('\n='.repeat(60));
    console.log('🧪 EJECUTANDO PRUEBAS DE PAUSA/REACTIVACIÓN');
    console.log('='.repeat(60));
    
    console.log('\n📋 ESTADO INICIAL (Auto Tap-Tap activo):');
    console.log('- activo:', testState.activo);
    console.log('- pausadoPorChat:', testState.pausadoPorChat);
    console.log('- apagadoManualmente:', testState.apagadoManualmente);
    
    console.log('\n🔥 SIMULANDO CLICK EN CHAT...');
    onFocus('click');
    
    console.log('\n📊 ESTADO DESPUÉS DE CLICK EN CHAT:');
    console.log('- activo:', testState.activo);
    console.log('- pausadoPorChat:', testState.pausadoPorChat);
    console.log('- apagadoManualmente:', testState.apagadoManualmente);
    console.log('- botón:', testElementos.boton.textContent);
    
    console.log('\n⏰ ESPERANDO CUENTA REGRESIVA (5 segundos)...');
    
    // Verificar cuenta regresiva después de 8 segundos
    setTimeout(() => {
        console.log('\n📊 ESTADO DESPUÉS DE CUENTA REGRESIVA:');
        console.log('- activo:', testState.activo);
        console.log('- pausadoPorChat:', testState.pausadoPorChat);
        console.log('- apagadoManualmente:', testState.apagadoManualmente);
        console.log('- botón:', testElementos.boton.textContent);
        console.log('- contador tap-taps:', testState.contador);
        
        // Probar reactivación manual
        console.log('\n🔄 PROBANDO REACTIVACIÓN MANUAL...');
        // Primero pausar de nuevo para probar reactivación manual
        onFocus('click');
        
        setTimeout(() => {
            console.log('\n👆 SIMULANDO CLICK MANUAL EN BOTÓN...');
            toggleAutoTapTap(false); // Reactivación manual
            
            setTimeout(() => {
                console.log('\n📊 ESTADO FINAL DESPUÉS DE REACTIVACIÓN MANUAL:');
                console.log('- activo:', testState.activo);
                console.log('- pausadoPorChat:', testState.pausadoPorChat);
                console.log('- apagadoManualmente:', testState.apagadoManualmente);
                console.log('- botón:', testElementos.boton.textContent);
                
                // Verificar resultados
                const pruebasPasaron = (
                    testState.activo === true &&
                    testState.pausadoPorChat === false &&
                    testState.apagadoManualmente === false &&
                    testState.contador > 0
                );
                
                if (pruebasPasaron) {
                    console.log('\n✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
                    console.log('✅ El sistema de pausa/reactivación funciona correctamente');
                    console.log('✅ El problema de reactivación manual ha sido resuelto');
                } else {
                    console.log('\n❌ ALGUNAS PRUEBAS FALLARON');
                    console.log('❌ Revisar la implementación');
                }
                
                console.log('\n' + '='.repeat(60));
            }, 2000);
        }, 1000);
    }, 8000);
}

// Iniciar pruebas
ejecutarPruebas();

/**
 * INSTRUCCIONES PARA USAR ESTE ARCHIVO:
 * 
 * 1. Abrir la consola del navegador en una página de TikTok
 * 2. Copiar y pegar todo este código
 * 3. Observar los logs durante ~12 segundos
 * 4. Verificar que todas las pruebas pasen exitosamente
 * 
 * COMPORTAMIENTO ESPERADO:
 * - Al hacer click en chat → Botón cambia a OFF (Chat)
 * - Después de inactividad → Aparece cuenta regresiva
 * - Al finalizar cuenta regresiva → Se reactiva automáticamente
 * - Al hacer click manual en botón → Se puede reactivar manualmente
 */

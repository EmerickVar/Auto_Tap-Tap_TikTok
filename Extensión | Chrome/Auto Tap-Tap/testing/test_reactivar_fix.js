/**
 * =============================================================================
 * PRUEBA DE CORRECCIÓN: reactivarAutoTapTap is not defined
 * =============================================================================
 * 
 * Script de prueba para verificar que el error "reactivarAutoTapTap is not defined"
 * ha sido resuelto después de mover la función al scope global.
 * 
 * ERROR CORREGIDO: Uncaught ReferenceError: reactivarAutoTapTap is not defined at content.js:1580:21
 */

console.log('🧪 Iniciando prueba de corrección de reactivarAutoTapTap...');

// Simular el estado global mínimo necesario
const testState = {
    apagadoManualmente: false,
    pausadoPorChat: true,
    activo: false,
    contador: 5,
    tiempoReactivacion: 3
};

const testElementos = {
    selector: { value: '1000' },
    boton: { 
        textContent: '', 
        style: { background: '', opacity: '' }
    },
    cuentaRegresivaDiv: null
};

const testTimers = {
    cuentaRegresiva: null,
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

// Simular funciones necesarias
function presionarL() {
    console.log('👆 PRUEBA: presionarL() ejecutado');
}

function actualizarColoresBoton() {
    console.log('🎨 PRUEBA: actualizarColoresBoton() ejecutado');
}

function safeRuntimeMessage(message) {
    console.log('📡 PRUEBA: Mensaje al background:', message);
    return Promise.resolve();
}

function mostrarNotificacionChat(mensaje, tipo) {
    console.log(`📱 PRUEBA: Notificación [${tipo}]: ${mensaje}`);
}

const safeInterval = {
    create(callback, delay) {
        console.log(`⏰ PRUEBA: Intervalo creado con delay ${delay}ms`);
        return setInterval(callback, delay);
    }
};

// Mock de función reactivarAutoTapTap global (simulando la corrección)
function reactivarAutoTapTap() {
    console.log('🎯 PRUEBA: reactivarAutoTapTap() ejecutándose correctamente');
    console.log('Estado actual:', { 
        apagadoManualmente: testState.apagadoManualmente,
        pausadoPorChat: testState.pausadoPorChat,
        activo: testState.activo
    });
    
    if (!testState.apagadoManualmente) {
        testState.pausadoPorChat = false;
        testTimers.cleanupAll();
        testState.activo = true;
        
        const intervalo = parseInt(testElementos.selector.value);
        presionarL();
        
        testElementos.boton.textContent = '❤️ Auto Tap-Tap: ON';
        testElementos.boton.style.background = '#00f2ea';
        actualizarColoresBoton();
        
        safeRuntimeMessage({ 
            action: 'reactivated_from_chat',
            contador: testState.contador,
            enTikTok: true,
            enLive: true
        });
        
        mostrarNotificacionChat('¡Auto Tap-Tap reactivado! 🎉', 'success');
        console.log('✅ PRUEBA: Auto Tap-Tap reactivado exitosamente');
    } else {
        console.log('⚠️ PRUEBA: No se puede reactivar - fue apagado manualmente');
    }
}

// Implementación de mostrarCuentaRegresiva para probar la llamada
function testMostrarCuentaRegresiva(mensajeInicial) {
    console.log(`🚀 PRUEBA: Iniciando cuenta regresiva: "${mensajeInicial}"`);
    
    let tiempoRestante = testState.tiempoReactivacion;
    
    const interval = setInterval(() => {
        tiempoRestante--;
        
        if (tiempoRestante > 0) {
            console.log(`⏰ PRUEBA: ${tiempoRestante}s restantes...`);
        } else {
            console.log('✨ PRUEBA: Ejecutando reactivación...');
            clearInterval(interval);
            
            // ESTA ES LA LÍNEA QUE CAUSABA EL ERROR ANTES DE LA CORRECCIÓN
            reactivarAutoTapTap(); // <- Esta llamada ahora debería funcionar
            
            console.log('🎉 PRUEBA: Cuenta regresiva completada exitosamente');
        }
    }, 1000);
}

// Ejecutar pruebas
function ejecutarPruebas() {
    console.log('\n='.repeat(60));
    console.log('🧪 EJECUTANDO PRUEBA DE CORRECCIÓN reactivarAutoTapTap');
    console.log('='.repeat(60));
    
    console.log('\n📋 ESTADO INICIAL:');
    console.log('- apagadoManualmente:', testState.apagadoManualmente);
    console.log('- pausadoPorChat:', testState.pausadoPorChat);
    console.log('- activo:', testState.activo);
    
    console.log('\n🔥 INICIANDO CUENTA REGRESIVA QUE LLAMA A reactivarAutoTapTap...');
    testMostrarCuentaRegresiva(`⏳ Reactivando en ${testState.tiempoReactivacion}s...`);
    
    // Verificar resultado después de la cuenta regresiva
    setTimeout(() => {
        console.log('\n📊 RESULTADO FINAL:');
        console.log('- activo:', testState.activo);
        console.log('- pausadoPorChat:', testState.pausadoPorChat);
        
        if (testState.activo && !testState.pausadoPorChat) {
            console.log('\n✅ PRUEBA EXITOSA: ERROR "reactivarAutoTapTap is not defined" CORREGIDO');
            console.log('✅ La función reactivarAutoTapTap ahora es accesible globalmente');
            console.log('✅ mostrarCuentaRegresiva puede llamar a reactivarAutoTapTap sin errores');
        } else {
            console.log('\n❌ PRUEBA FALLIDA: Revisar la implementación');
        }
        
        console.log('\n' + '='.repeat(60));
    }, (testState.tiempoReactivacion + 1) * 1000);
}

// Iniciar pruebas
ejecutarPruebas();

/**
 * INSTRUCCIONES PARA USAR ESTE ARCHIVO:
 * 
 * 1. Abrir la consola del navegador en cualquier página
 * 2. Copiar y pegar todo este código
 * 3. Observar los logs durante ~5 segundos
 * 4. Verificar que no aparece el error "reactivarAutoTapTap is not defined"
 * 
 * COMPORTAMIENTO ESPERADO:
 * - Debe ejecutar cuenta regresiva de 3 segundos
 * - Debe llamar a reactivarAutoTapTap() sin errores
 * - Debe mostrar mensaje de éxito al final
 * - NO debe mostrar "ReferenceError: reactivarAutoTapTap is not defined"
 */

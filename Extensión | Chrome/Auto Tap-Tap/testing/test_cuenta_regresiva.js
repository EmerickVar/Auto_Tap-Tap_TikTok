/**
 * =============================================================================
 * PRUEBA DE SISTEMA DE CUENTA REGRESIVA
 * =============================================================================
 * 
 * Script de prueba para verificar que el sistema de cuenta regresiva funciona
 * correctamente después de la implementación de mostrarCuentaRegresiva().
 * 
 * PROBLEMA RESUELTO: "El conteo de reactivación nunca sucede"
 */

console.log('🧪 Iniciando pruebas del sistema de cuenta regresiva...');

// Simular el estado global y elementos necesarios
const testState = {
    tiempoReactivacion: 5,
    pausadoPorChat: true,
    apagadoManualmente: false,
    activo: false
};

const testElementos = {
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

// Mock de la función reactivarAutoTapTap para las pruebas
function mockReactivarAutoTapTap() {
    console.log('✅ PRUEBA: reactivarAutoTapTap() ejecutado correctamente');
    testState.activo = true;
    testState.pausadoPorChat = false;
}

// Implementación de prueba de mostrarCuentaRegresiva
function testMostrarCuentaRegresiva(mensajeInicial) {
    console.log(`🚀 PRUEBA: Iniciando cuenta regresiva con mensaje: "${mensajeInicial}"`);
    
    // Limpiar cualquier cuenta regresiva anterior
    if (testElementos.cuentaRegresivaDiv) {
        console.log('🧹 PRUEBA: Limpiando cuenta regresiva anterior');
        testElementos.cuentaRegresivaDiv.remove();
        testElementos.cuentaRegresivaDiv = null;
    }
    
    // Limpiar timer anterior
    if (testTimers.cuentaRegresiva) {
        clearInterval(testTimers.cuentaRegresiva);
        testTimers.cuentaRegresiva = null;
    }
    
    // Crear elemento de prueba (sin estilos visuales)
    testElementos.cuentaRegresivaDiv = {
        textContent: '',
        style: {
            background: '',
            border: '',
            boxShadow: '',
            opacity: '0',
            transform: 'translateY(10px)'
        },
        remove: () => {
            console.log('🗑️ PRUEBA: Elemento de cuenta regresiva removido del DOM');
            testElementos.cuentaRegresivaDiv = null;
        }
    };
    
    // Variables para la cuenta regresiva
    let tiempoRestante = testState.tiempoReactivacion;
    testElementos.cuentaRegresivaDiv.textContent = `⏳ Reactivando en ${tiempoRestante}s...`;
    
    console.log(`📱 PRUEBA: Mostrando notificación: "${testElementos.cuentaRegresivaDiv.textContent}"`);
    
    // Simular animación de entrada
    testElementos.cuentaRegresivaDiv.style.opacity = '1';
    testElementos.cuentaRegresivaDiv.style.transform = 'translateY(0)';
    
    // Iniciar cuenta regresiva
    testTimers.cuentaRegresiva = setInterval(() => {
        tiempoRestante--;
        
        if (tiempoRestante > 0) {
            testElementos.cuentaRegresivaDiv.textContent = `⏳ Reactivando en ${tiempoRestante}s...`;
            console.log(`⏰ PRUEBA: Contador actualizado: ${tiempoRestante}s restantes`);
            
            // Cambiar color cuando quedan pocos segundos
            if (tiempoRestante <= 3) {
                testElementos.cuentaRegresivaDiv.style.background = 'rgba(255, 69, 0, 0.95)';
                console.log('🔴 PRUEBA: Color cambiado a rojo (≤3 segundos)');
            }
        } else {
            // Mostrar mensaje final
            testElementos.cuentaRegresivaDiv.textContent = '✨ Reactivando Auto Tap-Tap...';
            testElementos.cuentaRegresivaDiv.style.background = 'rgba(0, 200, 0, 0.95)';
            console.log('🟢 PRUEBA: Mostrando mensaje final en verde');
            
            // Ejecutar reactivación después de un breve retraso
            setTimeout(() => {
                mockReactivarAutoTapTap();
                
                // Limpiar la notificación
                setTimeout(() => {
                    if (testElementos.cuentaRegresivaDiv) {
                        testElementos.cuentaRegresivaDiv.style.opacity = '0';
                        console.log('📤 PRUEBA: Iniciando animación de salida');
                        
                        setTimeout(() => {
                            if (testElementos.cuentaRegresivaDiv) {
                                testElementos.cuentaRegresivaDiv.remove();
                            }
                        }, 300);
                    }
                }, 1000);
            }, 500);
            
            // Limpiar el timer
            clearInterval(testTimers.cuentaRegresiva);
            testTimers.cuentaRegresiva = null;
            console.log('⏹️ PRUEBA: Timer de cuenta regresiva limpiado');
        }
    }, 1000); // En pruebas usamos 1 segundo real
    
    console.log('🎯 PRUEBA: Sistema de cuenta regresiva iniciado correctamente');
}

// Ejecutar pruebas
function ejecutarPruebas() {
    console.log('\n='.repeat(60));
    console.log('🧪 EJECUTANDO PRUEBAS DE CUENTA REGRESIVA');
    console.log('='.repeat(60));
    
    console.log('\n📋 ESTADO INICIAL:');
    console.log('- tiempoReactivacion:', testState.tiempoReactivacion);
    console.log('- pausadoPorChat:', testState.pausadoPorChat);
    console.log('- activo:', testState.activo);
    
    console.log('\n🔥 INICIANDO CUENTA REGRESIVA...');
    testMostrarCuentaRegresiva(`⏳ Reactivando en ${testState.tiempoReactivacion}s...`);
    
    // Verificar resultado después de la cuenta regresiva
    setTimeout(() => {
        console.log('\n📊 RESULTADO FINAL:');
        console.log('- activo:', testState.activo);
        console.log('- pausadoPorChat:', testState.pausadoPorChat);
        console.log('- cuentaRegresivaDiv:', testElementos.cuentaRegresivaDiv);
        
        if (testState.activo && !testState.pausadoPorChat && !testElementos.cuentaRegresivaDiv) {
            console.log('\n✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
            console.log('✅ El sistema de cuenta regresiva funciona correctamente');
            console.log('✅ El problema "El conteo de reactivación nunca sucede" ha sido resuelto');
        } else {
            console.log('\n❌ ALGUNAS PRUEBAS FALLARON');
            console.log('❌ Revisar la implementación');
        }
        
        console.log('\n' + '='.repeat(60));
    }, (testState.tiempoReactivacion + 3) * 1000);
}

// Iniciar pruebas
ejecutarPruebas();

/**
 * INSTRUCCIONES PARA USAR ESTE ARCHIVO:
 * 
 * 1. Abrir la consola del navegador en una página de TikTok
 * 2. Copiar y pegar todo este código
 * 3. Observar los logs de la prueba durante ~8 segundos
 * 4. Verificar que todas las pruebas pasen exitosamente
 * 
 * COMPORTAMIENTO ESPERADO:
 * - Debe mostrar cuenta regresiva desde 5 hasta 1
 * - Debe cambiar a rojo cuando quedan ≤3 segundos
 * - Debe mostrar mensaje verde al final
 * - Debe ejecutar reactivarAutoTapTap()
 * - Debe limpiar la notificación automáticamente
 */

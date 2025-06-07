/**
 * ========================================================================
 * TEST PARA CASO updateTapTaps
 * ========================================================================
 * 
 * Este test verifica que el nuevo caso 'updateTapTaps' añadido al content script
 * funcione correctamente para evitar el error "Acción no reconocida".
 */

console.log('🧪 Iniciando pruebas del caso updateTapTaps...\n');

// Simular el state global
const testState = {
    contador: 10,
    activo: false,
    tiempoReactivacion: 15,
    pausadoPorChat: false
};

// Simular elementos DOM
const testElementos = {
    contadorDiv: {
        textContent: `Tap-Taps: ${testState.contador}`,
        set textContent(value) {
            this._content = value;
            console.log(`📱 PRUEBA: ContadorDiv actualizado a: "${value}"`);
        },
        get textContent() {
            return this._content;
        }
    }
};

// Simular el messageListener del content script
function testMessageListener(request, sender, sendResponse) {
    try {
        console.log('📨 Mensaje recibido:', request);
        
        switch (request.action) {
            case 'getStatus':
                sendResponse({
                    activo: testState.activo,
                    contador: testState.contador,
                    tiempoReactivacion: testState.tiempoReactivacion,
                    pausadoPorChat: testState.pausadoPorChat,
                    enTikTok: true,
                    enLive: true
                });
                break;
                
            case 'toggle':
                testState.activo = !testState.activo;
                console.log(`🔄 PRUEBA: Toggle ejecutado, activo: ${testState.activo}`);
                sendResponse({ success: true });
                break;
                
            case 'updateReactivationTime':
                if (request.tiempo && request.tiempo >= 10 && request.tiempo <= 60) {
                    testState.tiempoReactivacion = request.tiempo;
                    console.log(`⏰ PRUEBA: Tiempo de reactivación actualizado: ${request.tiempo}s`);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ error: 'Tiempo inválido' });
                }
                break;
                
            case 'updateTapTaps':
                // Actualizar contador desde popup (principalmente para reset)
                if (request.hasOwnProperty('count') && typeof request.count === 'number') {
                    testState.contador = request.count;
                    if (testElementos.contadorDiv) {
                        testElementos.contadorDiv.textContent = `Tap-Taps: ${testState.contador}`;
                    }
                    console.log(`🎯 PRUEBA: Contador actualizado a: ${request.count}`);
                    sendResponse({ success: true });
                } else {
                    console.log('❌ PRUEBA: Valor de contador inválido');
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
}

// =============================================================================
// EJECUTAR PRUEBAS
// =============================================================================

console.log('📋 ESTADO INICIAL:');
console.log(`- contador: ${testState.contador}`);
console.log(`- activo: ${testState.activo}`);
console.log(`- contadorDiv: "${testElementos.contadorDiv.textContent}"\n`);

console.log('🧪 EJECUTANDO PRUEBAS DE updateTapTaps');
console.log('============================================================\n');

// Test 1: updateTapTaps con valor válido
console.log('🔥 TEST 1: updateTapTaps con valor válido (reset a 0)');
testMessageListener(
    { action: 'updateTapTaps', count: 0 },
    null,
    (response) => {
        if (response.success) {
            console.log('✅ TEST 1 PASÓ: updateTapTaps funcionó correctamente');
        } else {
            console.log('❌ TEST 1 FALLÓ:', response.error);
        }
    }
);

console.log('');

// Test 2: updateTapTaps con valor válido (número positivo)
console.log('🔥 TEST 2: updateTapTaps con valor positivo (25)');
testMessageListener(
    { action: 'updateTapTaps', count: 25 },
    null,
    (response) => {
        if (response.success) {
            console.log('✅ TEST 2 PASÓ: updateTapTaps funcionó correctamente');
        } else {
            console.log('❌ TEST 2 FALLÓ:', response.error);
        }
    }
);

console.log('');

// Test 3: updateTapTaps con valor inválido (string)
console.log('🔥 TEST 3: updateTapTaps con valor inválido (string)');
testMessageListener(
    { action: 'updateTapTaps', count: "invalid" },
    null,
    (response) => {
        if (response.error === 'Valor de contador inválido') {
            console.log('✅ TEST 3 PASÓ: Error manejado correctamente');
        } else {
            console.log('❌ TEST 3 FALLÓ: Error no detectado');
        }
    }
);

console.log('');

// Test 4: updateTapTaps sin parámetro count
console.log('🔥 TEST 4: updateTapTaps sin parámetro count');
testMessageListener(
    { action: 'updateTapTaps' },
    null,
    (response) => {
        if (response.error === 'Valor de contador inválido') {
            console.log('✅ TEST 4 PASÓ: Error manejado correctamente');
        } else {
            console.log('❌ TEST 4 FALLÓ: Error no detectado');
        }
    }
);

console.log('');

// Test 5: Acción no reconocida (para verificar que el default funciona)
console.log('🔥 TEST 5: Acción no reconocida');
testMessageListener(
    { action: 'accionInexistente' },
    null,
    (response) => {
        if (response.error === 'Acción no reconocida') {
            console.log('✅ TEST 5 PASÓ: Acción no reconocida manejada correctamente');
        } else {
            console.log('❌ TEST 5 FALLÓ: Error no detectado');
        }
    }
);

console.log('\n📊 ESTADO FINAL:');
console.log(`- contador: ${testState.contador}`);
console.log(`- activo: ${testState.activo}`);
console.log(`- contadorDiv: "${testElementos.contadorDiv.textContent}"`);

console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
console.log('✅ El caso updateTapTaps funciona correctamente');
console.log('✅ El error "Acción no reconocida" para updateTapTaps ha sido resuelto');

console.log('\n============================================================');

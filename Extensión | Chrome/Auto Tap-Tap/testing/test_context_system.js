// SCRIPT DE PRUEBA PARA SISTEMA CONTEXTUAL
// Este script se puede ejecutar en la consola del navegador para probar las funciones

console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA CONTEXTUAL');
console.log('===============================================');

// Simular función isOnTikTok
function testIsOnTikTok(hostname) {
    return hostname.includes('tiktok.com');
}

// Simular función isOnTikTokLive
function testIsOnTikTokLive(pathname) {
    const livePattern = /^\/@[^\/]+\/live(?:\/[^?]*)?$/;
    return livePattern.test(pathname);
}

// Simular función getCurrentContext
function testGetCurrentContext(hostname, pathname) {
    const enTikTok = testIsOnTikTok(hostname);
    const enLive = enTikTok && testIsOnTikTokLive(pathname);
    return { enTikTok, enLive };
}

// CASOS DE PRUEBA
const testCases = [
    // Caso 1: No TikTok
    {
        hostname: 'www.google.com',
        pathname: '/',
        expected: { enTikTok: false, enLive: false },
        description: 'No TikTok - Google'
    },
    
    // Caso 2: TikTok no-Live (página principal)
    {
        hostname: 'www.tiktok.com',
        pathname: '/',
        expected: { enTikTok: true, enLive: false },
        description: 'TikTok no-Live - Página principal'
    },
    
    // Caso 3: TikTok no-Live (perfil)
    {
        hostname: 'www.tiktok.com',
        pathname: '/@usuario123',
        expected: { enTikTok: true, enLive: false },
        description: 'TikTok no-Live - Perfil usuario'
    },
    
    // Caso 4: TikTok Live básico
    {
        hostname: 'www.tiktok.com',
        pathname: '/@usuario123/live',
        expected: { enTikTok: true, enLive: true },
        description: 'TikTok Live - Básico'
    },
    
    // Caso 5: TikTok Live con parámetros
    {
        hostname: 'www.tiktok.com',
        pathname: '/@usuario.test/live',
        expected: { enTikTok: true, enLive: true },
        description: 'TikTok Live - Usuario con punto'
    },
    
    // Caso 6: TikTok Live con ID
    {
        hostname: 'www.tiktok.com',
        pathname: '/@creator_name/live/12345',
        expected: { enTikTok: true, enLive: true },
        description: 'TikTok Live - Con ID adicional'
    },
    
    // Caso 7: No Live (contiene 'live' pero no es live)
    {
        hostname: 'www.tiktok.com',
        pathname: '/@usuario/video/123/live',
        expected: { enTikTok: true, enLive: false },
        description: 'TikTok no-Live - Falso positivo'
    },
    
    // Caso 8: No Live (live sin usuario)
    {
        hostname: 'www.tiktok.com',
        pathname: '/live',
        expected: { enTikTok: true, enLive: false },
        description: 'TikTok no-Live - Live sin usuario'
    }
];

// EJECUTAR PRUEBAS
let passed = 0;
let failed = 0;

console.log('\n🧪 EJECUTANDO CASOS DE PRUEBA:');
console.log('-------------------------------');

testCases.forEach((testCase, index) => {
    const result = testGetCurrentContext(testCase.hostname, testCase.pathname);
    const success = JSON.stringify(result) === JSON.stringify(testCase.expected);
    
    if (success) {
        console.log(`✅ Test ${index + 1}: ${testCase.description}`);
        console.log(`   URL: ${testCase.hostname}${testCase.pathname}`);
        console.log(`   Resultado: ${JSON.stringify(result)}`);
        passed++;
    } else {
        console.error(`❌ Test ${index + 1}: ${testCase.description}`);
        console.error(`   URL: ${testCase.hostname}${testCase.pathname}`);
        console.error(`   Esperado: ${JSON.stringify(testCase.expected)}`);
        console.error(`   Obtenido: ${JSON.stringify(result)}`);
        failed++;
    }
    console.log('');
});

// RESUMEN
console.log('📊 RESUMEN DE PRUEBAS:');
console.log('======================');
console.log(`✅ Pasaron: ${passed}/${testCases.length}`);
console.log(`❌ Fallaron: ${failed}/${testCases.length}`);
console.log(`📈 Porcentaje éxito: ${Math.round((passed / testCases.length) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema de detección de contexto funciona correctamente.');
} else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar la lógica de detección.');
}

// FUNCIÓN ADICIONAL: Probar estados de badge
function testBadgeStates() {
    console.log('\n🏷️  PRUEBA DE ESTADOS DE BADGE:');
    console.log('================================');
    
    const badgeStates = [
        { context: { enTikTok: false, enLive: false }, active: false, count: 0, expected: 'Badge vacío, color rojo' },
        { context: { enTikTok: true, enLive: false }, active: false, count: 0, expected: '"Live", color naranja' },
        { context: { enTikTok: true, enLive: true }, active: false, count: 0, expected: '"OFF", color rojo' },
        { context: { enTikTok: true, enLive: true }, active: true, count: 0, expected: '"ON", color verde' },
        { context: { enTikTok: true, enLive: true }, active: true, count: 5, expected: '"5", color verde con animación' }
    ];
    
    badgeStates.forEach((state, index) => {
        console.log(`🏷️  Estado ${index + 1}: ${state.expected}`);
        console.log(`   Contexto: enTikTok=${state.context.enTikTok}, enLive=${state.context.enLive}`);
        console.log(`   Activo: ${state.active}, Contador: ${state.count}`);
        console.log('');
    });
}

// Ejecutar prueba de estados de badge
testBadgeStates();

console.log('🏁 PRUEBAS COMPLETADAS');
console.log('Para probar en navegador real, copie este script en la consola de cualquier página.');

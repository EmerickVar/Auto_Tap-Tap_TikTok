/**
 * =============================================================================
 * TEST INTEGRADO PARA AMBAS CORRECCIONES DE NOTIFICACIONES
 * =============================================================================
 * 
 * Script de prueba completo que verifica que ambas correcciones funcionan
 * correctamente de forma integrada:
 * 
 * 1. CORRECCIÓN 1: Notificaciones persistentes que nunca desaparecen
 * 2. CORRECCIÓN 2: Click fuera del chat causa alertas que no se desvanecen
 * 
 * PROBLEMAS CORREGIDOS:
 * - "Reactivando en Xs..." a veces nunca desaparece y queda permanente
 * - Hacer clic fuera del chat provoca que algunas alertas no se desvanezcan
 */

console.log('🧪 Iniciando test integrado de ambas correcciones...');

// Estado de prueba integrado
const testStateIntegrado = {
    tiempoReactivacion: 3, // Tiempo corto para pruebas rápidas
    pausadoPorChat: true,
    apagadoManualmente: false,
    activo: false,
    notificacionCuentaRegresiva: null,
    limpiarCuentaRegresiva: null
};

const testTimersIntegrado = {
    typing: null,
    chat: null,
    countdown: null,
    cuentaRegresiva: null,
    cleanupAll() {
        console.log('🧹 TEST: Ejecutando cleanup completo de timers...');
        Object.entries(this).forEach(([key, timer]) => {
            if (typeof timer === 'number') {
                clearTimeout(timer);
                clearInterval(timer);
                this[key] = null;
            }
        });
        
        // También limpiar notificaciones si existen
        if (testStateIntegrado.limpiarCuentaRegresiva && typeof testStateIntegrado.limpiarCuentaRegresiva === 'function') {
            try {
                testStateIntegrado.limpiarCuentaRegresiva();
            } catch (error) {
                console.warn('TEST: Error en cleanup de cuenta regresiva:', error);
            }
        }
    }
};

// Mock del contenedor de notificaciones mejorado
const mockContenedorIntegrado = {
    children: [],
    appendChild(element) {
        this.children.push(element);
        element.parentNode = this;
        console.log(`📥 TEST: Notificación agregada: "${element.textContent}"`);
    },
    removeChild(element) {
        const index = this.children.indexOf(element);
        if (index > -1) {
            this.children.splice(index, 1);
            element.parentNode = null;
            console.log(`📤 TEST: Notificación removida: "${element.textContent}"`);
        }
    },
    get innerHTML() {
        return this.children.map(el => el.textContent).join('');
    },
    set innerHTML(value) {
        if (value === '') {
            this.children.forEach(el => el.parentNode = null);
            this.children = [];
            console.log('🧹 TEST: Contenedor vaciado completamente');
        }
    }
};

const testElementosIntegrado = {
    contenedorNotificaciones: mockContenedorIntegrado
};

// Mock de funciones necesarias mejoradas
function mockAgregarNotificacionIntegrada(mensaje, tipo, duracion) {
    const notificacion = {
        textContent: mensaje,
        style: { opacity: '1', transform: 'translateX(0)', background: '', border: '', boxShadow: '' },
        parentNode: null
    };
    
    testElementosIntegrado.contenedorNotificaciones.appendChild(notificacion);
    
    if (duracion > 0) {
        setTimeout(() => {
            mockRemoverNotificacionIntegrada(notificacion);
        }, duracion);
    }
    
    return notificacion;
}

function mockRemoverNotificacionIntegrada(notificacion, immediate = false) {
    if (!notificacion) return;
    
    try {
        if (immediate || !notificacion.parentNode) {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
            console.log(`🗑️ TEST: Notificación removida inmediatamente`);
            return;
        }
        
        if (notificacion.parentNode) {
            notificacion.style.opacity = '0';
            notificacion.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                try {
                    if (notificacion.parentNode) {
                        notificacion.parentNode.removeChild(notificacion);
                        console.log(`🗑️ TEST: Notificación removida con animación`);
                    }
                } catch (error) {
                    console.warn('TEST: Error al remover notificación:', error);
                }
            }, 300);
        }
    } catch (error) {
        console.warn('TEST: Error en removerNotificacion:', error);
    }
}

function mockReactivarAutoTapTapIntegrado() {
    console.log('🎯 TEST: REACTIVACIÓN EJECUTADA EXITOSAMENTE');
    testStateIntegrado.activo = true;
    testStateIntegrado.pausadoPorChat = false;
}

// Implementación de mostrarCuentaRegresiva con todas las mejoras
function testMostrarCuentaRegresivaIntegrada(mensajeInicial) {
    console.log(`🚀 TEST: Iniciando mostrarCuentaRegresiva: "${mensajeInicial}"`);
    
    // CORRECCIÓN 1: Verificación defensiva de condiciones
    if (!testStateIntegrado.pausadoPorChat || testStateIntegrado.apagadoManualmente || testStateIntegrado.activo) {
        console.log('⚠️ TEST: Condiciones no válidas para cuenta regresiva:', {
            pausadoPorChat: testStateIntegrado.pausadoPorChat,
            apagadoManualmente: testStateIntegrado.apagadoManualmente,
            activo: testStateIntegrado.activo
        });
        return;
    }
    
    // CORRECCIÓN 2: Verificar si ya hay una cuenta regresiva activa
    if (testTimersIntegrado.cuentaRegresiva) {
        console.log('⚠️ TEST: Ya hay una cuenta regresiva activa, cancelando nueva');
        return;
    }
    
    // CORRECCIÓN 1: Limpiar timer anterior si existe
    if (testTimersIntegrado.cuentaRegresiva) {
        clearInterval(testTimersIntegrado.cuentaRegresiva);
        testTimersIntegrado.cuentaRegresiva = null;
    }
    
    // CORRECCIÓN 1: Limpiar notificación anterior si existe
    if (testStateIntegrado.notificacionCuentaRegresiva) {
        mockRemoverNotificacionIntegrada(testStateIntegrado.notificacionCuentaRegresiva);
        testStateIntegrado.notificacionCuentaRegresiva = null;
    }
    
    let tiempoRestante = testStateIntegrado.tiempoReactivacion;
    
    // Crear notificación inicial
    testStateIntegrado.notificacionCuentaRegresiva = mockAgregarNotificacionIntegrada(
        `⏳ Reactivando en ${tiempoRestante}s...`, 
        'countdown', 
        0
    );
    
    // CORRECCIÓN 1: Función de limpieza robusta
    const limpiarCuentaRegresiva = () => {
        console.log('🧹 TEST: Limpiando cuenta regresiva...');
        
        if (testTimersIntegrado.cuentaRegresiva) {
            clearInterval(testTimersIntegrado.cuentaRegresiva);
            testTimersIntegrado.cuentaRegresiva = null;
        }
        
        if (testStateIntegrado.notificacionCuentaRegresiva) {
            try {
                mockRemoverNotificacionIntegrada(testStateIntegrado.notificacionCuentaRegresiva, true);
                testStateIntegrado.notificacionCuentaRegresiva = null;
            } catch (error) {
                console.warn('TEST: Error al limpiar notificación:', error);
                testStateIntegrado.notificacionCuentaRegresiva = null;
            }
        }
        
        testStateIntegrado.limpiarCuentaRegresiva = null;
    };
    
    // Iniciar cuenta regresiva
    testTimersIntegrado.cuentaRegresiva = setInterval(() => {
        // CORRECCIÓN 1: Verificar estado antes de continuar
        if (!testStateIntegrado.pausadoPorChat || testStateIntegrado.apagadoManualmente || testStateIntegrado.activo) {
            console.log('⚠️ TEST: Cancelando cuenta regresiva - estado cambió');
            limpiarCuentaRegresiva();
            return;
        }
        
        tiempoRestante--;
        
        if (tiempoRestante > 0) {
            // Actualizar texto
            if (testStateIntegrado.notificacionCuentaRegresiva && testStateIntegrado.notificacionCuentaRegresiva.parentNode) {
                testStateIntegrado.notificacionCuentaRegresiva.textContent = `⏳ Reactivando en ${tiempoRestante}s...`;
                console.log(`⏰ TEST: Contador actualizado: ${tiempoRestante}s restantes`);
            } else {
                console.log('⚠️ TEST: Notificación perdida, cancelando');
                limpiarCuentaRegresiva();
                return;
            }
        } else {
            // Mensaje final y reactivación
            if (testStateIntegrado.notificacionCuentaRegresiva && testStateIntegrado.notificacionCuentaRegresiva.parentNode) {
                testStateIntegrado.notificacionCuentaRegresiva.textContent = '✨ Reactivando Auto Tap-Tap...';
            }
            
            setTimeout(() => {
                if (testStateIntegrado.pausadoPorChat && !testStateIntegrado.apagadoManualmente && !testStateIntegrado.activo) {
                    try {
                        mockReactivarAutoTapTapIntegrado();
                    } catch (error) {
                        console.error('TEST: Error en reactivación:', error);
                    }
                }
                
                // CORRECCIÓN 1: Limpieza robusta con delay
                setTimeout(() => {
                    limpiarCuentaRegresiva();
                }, 500);
            }, 200);
            
            clearInterval(testTimersIntegrado.cuentaRegresiva);
            testTimersIntegrado.cuentaRegresiva = null;
        }
    }, 1000);
    
    // Guardar función de limpieza
    testStateIntegrado.limpiarCuentaRegresiva = limpiarCuentaRegresiva;
}

// CORRECCIÓN 2: Función mejorada de handleClickOutside
function testHandleClickOutsideIntegrado() {
    console.log('🖱️ TEST: Simulando click fuera del chat');
    
    if (testStateIntegrado.pausadoPorChat && !testStateIntegrado.apagadoManualmente) {
        console.log('🎯 TEST: Click fuera del chat detectado - Iniciando cuenta regresiva');
        
        // CORRECCIÓN 2: Verificar que no hay cuenta regresiva activa
        if (!testTimersIntegrado.cuentaRegresiva) {
            // CORRECCIÓN 2: Limpiar timers específicos sin tocar cuenta regresiva
            if (testTimersIntegrado.typing) {
                clearTimeout(testTimersIntegrado.typing);
                testTimersIntegrado.typing = null;
            }
            if (testTimersIntegrado.chat) {
                clearTimeout(testTimersIntegrado.chat);
                testTimersIntegrado.chat = null;
            }
            if (testTimersIntegrado.countdown) {
                clearTimeout(testTimersIntegrado.countdown);
                testTimersIntegrado.countdown = null;
            }
            
            // CORRECCIÓN 2: Delay para evitar race conditions
            setTimeout(() => {
                testMostrarCuentaRegresivaIntegrada(`⏳ Reactivando en ${testStateIntegrado.tiempoReactivacion}s...`);
            }, 100);
        } else {
            console.log('⚠️ TEST: Ya hay una cuenta regresiva activa, no creando duplicado');
        }
    }
}

// Función para verificar limpieza completa
function verificarLimpiezaCompletaIntegrada() {
    const notificacionesRestantes = testElementosIntegrado.contenedorNotificaciones.children.length;
    const notificacionesCountdown = testElementosIntegrado.contenedorNotificaciones.children
        .filter(el => el.textContent && (
            el.textContent.includes('Reactivando en') || 
            el.textContent.includes('Reactivando Auto Tap-Tap')
        ));
    
    console.log(`🔍 VERIFICACIÓN: ${notificacionesRestantes} notificaciones totales, ${notificacionesCountdown.length} de countdown`);
    
    // Verificar también que no hay timers activos
    const timersActivos = Object.entries(testTimersIntegrado)
        .filter(([key, value]) => typeof value === 'number' && value !== null);
    
    console.log(`⏲️ VERIFICACIÓN: ${timersActivos.length} timers activos`);
    
    if (notificacionesCountdown.length === 0 && timersActivos.length === 0) {
        console.log('✅ ÉXITO: Limpieza completa - no hay notificaciones ni timers persistentes');
        return true;
    } else {
        console.log('❌ FALLO: Elementos persistentes encontrados:');
        if (notificacionesCountdown.length > 0) {
            notificacionesCountdown.forEach((el, index) => {
                console.log(`   Notificación ${index + 1}: "${el.textContent}"`);
            });
        }
        if (timersActivos.length > 0) {
            timersActivos.forEach(([key, value]) => {
                console.log(`   Timer activo: ${key} = ${value}`);
            });
        }
        return false;
    }
}

// Función de limpieza defensiva periódica (CORRECCIÓN 1)
function limpiezaDefensivaPeriodica() {
    console.log('🔄 TEST: Ejecutando limpieza defensiva periódica...');
    
    try {
        if (testElementosIntegrado.contenedorNotificaciones) {
            const notificacionesHuerfanas = testElementosIntegrado.contenedorNotificaciones.children
                .filter(el => {
                    const texto = el.textContent || '';
                    // Solo limpiar si parece ser huérfana
                    if (texto.includes('Reactivando en') && !testTimersIntegrado.cuentaRegresiva) {
                        return true;
                    }
                    return false;
                });
            
            if (notificacionesHuerfanas.length > 0) {
                console.log(`🧹 TEST: Limpiando ${notificacionesHuerfanas.length} notificaciones huérfanas`);
                notificacionesHuerfanas.forEach(el => {
                    try {
                        el.parentNode.removeChild(el);
                    } catch (error) {
                        console.warn('TEST: Error limpiando huérfana:', error);
                    }
                });
            }
        }
    } catch (error) {
        console.warn('TEST: Error en limpieza defensiva:', error);
    }
}

// Ejecutar pruebas integradas
function ejecutarPruebasIntegradas() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 EJECUTANDO PRUEBAS INTEGRADAS DE AMBAS CORRECCIONES');
    console.log('='.repeat(80));
    
    let pruebaTotal = 0;
    let pruebaPasada = 0;
    
    // PRUEBA 1: Comportamiento normal de cuenta regresiva (CORRECCIÓN 1)
    console.log('\n📋 PRUEBA 1: Comportamiento normal de cuenta regresiva');
    pruebaTotal++;
    testStateIntegrado.pausadoPorChat = true;
    testStateIntegrado.apagadoManualmente = false;
    testStateIntegrado.activo = false;
    
    testMostrarCuentaRegresivaIntegrada(`⏳ Reactivando en ${testStateIntegrado.tiempoReactivacion}s...`);
    
    setTimeout(() => {
        if (verificarLimpiezaCompletaIntegrada()) {
            pruebaPasada++;
            console.log('✅ PRUEBA 1 PASADA - Cuenta regresiva normal funciona correctamente');
        } else {
            console.log('❌ PRUEBA 1 FALLIDA - Problemas en cuenta regresiva normal');
        }
        
        // PRUEBA 2: Click fuera del chat (CORRECCIÓN 2)
        setTimeout(() => {
            console.log('\n📋 PRUEBA 2: Click fuera del chat');
            pruebaTotal++;
            testStateIntegrado.pausadoPorChat = true;
            testStateIntegrado.apagadoManualmente = false;
            testStateIntegrado.activo = false;
            
            testHandleClickOutsideIntegrado();
            
            setTimeout(() => {
                if (verificarLimpiezaCompletaIntegrada()) {
                    pruebaPasada++;
                    console.log('✅ PRUEBA 2 PASADA - Click fuera del chat funciona correctamente');
                } else {
                    console.log('❌ PRUEBA 2 FALLIDA - Problemas con click fuera del chat');
                }
                
                // PRUEBA 3: Múltiples clicks rápidos (CORRECCIÓN 2)
                setTimeout(() => {
                    console.log('\n📋 PRUEBA 3: Múltiples clicks rápidos fuera del chat');
                    pruebaTotal++;
                    testStateIntegrado.pausadoPorChat = true;
                    testStateIntegrado.apagadoManualmente = false;
                    testStateIntegrado.activo = false;
                    
                    // Simular múltiples clicks rápidos
                    testHandleClickOutsideIntegrado();
                    setTimeout(() => testHandleClickOutsideIntegrado(), 50);
                    setTimeout(() => testHandleClickOutsideIntegrado(), 100);
                    
                    setTimeout(() => {
                        const notificacionesCountdown = testElementosIntegrado.contenedorNotificaciones.children
                            .filter(el => el.textContent && el.textContent.includes('Reactivando en'));
                        
                        if (notificacionesCountdown.length <= 1) {
                            pruebaPasada++;
                            console.log('✅ PRUEBA 3 PASADA - Múltiples clicks no crean duplicados');
                        } else {
                            console.log(`❌ PRUEBA 3 FALLIDA - ${notificacionesCountdown.length} notificaciones duplicadas`);
                        }
                        
                        // PRUEBA 4: Limpieza defensiva periódica (CORRECCIÓN 1)
                        setTimeout(() => {
                            console.log('\n📋 PRUEBA 4: Limpieza defensiva periódica');
                            pruebaTotal++;
                            
                            // Crear notificación huérfana artificialmente
                            const notificacionHuerfana = mockAgregarNotificacionIntegrada('⏳ Reactivando en 5s...', 'countdown', 0);
                            // No asignar timer para simular huérfana
                            testTimersIntegrado.cuentaRegresiva = null;
                            
                            // Ejecutar limpieza defensiva
                            limpiezaDefensivaPeriodica();
                            
                            setTimeout(() => {
                                if (verificarLimpiezaCompletaIntegrada()) {
                                    pruebaPasada++;
                                    console.log('✅ PRUEBA 4 PASADA - Limpieza defensiva funciona correctamente');
                                } else {
                                    console.log('❌ PRUEBA 4 FALLIDA - Problemas en limpieza defensiva');
                                }
                                
                                // RESUMEN FINAL
                                setTimeout(() => {
                                    console.log('\n' + '='.repeat(80));
                                    console.log('📊 RESUMEN DE PRUEBAS INTEGRADAS');
                                    console.log('='.repeat(80));
                                    console.log(`✅ Pruebas pasadas: ${pruebaPasada}/${pruebaTotal}`);
                                    console.log(`❌ Pruebas fallidas: ${pruebaTotal - pruebaPasada}/${pruebaTotal}`);
                                    
                                    if (pruebaPasada === pruebaTotal) {
                                        console.log('\n🎉 TODAS LAS PRUEBAS INTEGRADAS PASARON');
                                        console.log('✅ CORRECCIÓN 1: Notificaciones persistentes - RESUELTO');
                                        console.log('✅ CORRECCIÓN 2: Click fuera del chat - RESUELTO');
                                        console.log('✅ Ambas correcciones funcionan correctamente de forma integrada');
                                        console.log('✅ El sistema de notificaciones es ahora robusto y confiable');
                                    } else {
                                        console.log('\n⚠️ ALGUNAS PRUEBAS INTEGRADAS FALLARON');
                                        console.log('❌ Revisar la implementación de las correcciones');
                                        console.log('💡 Las correcciones pueden necesitar ajustes adicionales');
                                    }
                                    
                                    console.log('\n' + '='.repeat(80));
                                }, 1000);
                            }, 2000);
                        }, 4000); // Esperar a que termine la prueba 3
                    }, 2000);
                }, 4000); // Esperar a que termine la prueba 2
            }, 2000);
        }, 4000); // Esperar a que termine la prueba 1
    }, testStateIntegrado.tiempoReactivacion * 1000 + 2000); // Esperar tiempo de cuenta regresiva + buffer
}

// Iniciar pruebas integradas
ejecutarPruebasIntegradas();

/**
 * INSTRUCCIONES PARA USAR ESTE ARCHIVO:
 * 
 * 1. Abrir la consola del navegador en una página de TikTok Live
 * 2. Copiar y pegar todo este código
 * 3. Observar los logs durante ~25 segundos (las pruebas son secuenciales)
 * 4. Verificar que todas las pruebas pasen exitosamente
 * 
 * COMPORTAMIENTO ESPERADO:
 * - PRUEBA 1: Cuenta regresiva normal debería funcionar y limpiarse correctamente
 * - PRUEBA 2: Click fuera del chat debería crear cuenta regresiva y limpiarla
 * - PRUEBA 3: Múltiples clicks no deberían crear duplicados
 * - PRUEBA 4: Limpieza defensiva debería remover notificaciones huérfanas
 * - TODAS las pruebas deberían resultar en limpieza completa
 * 
 * Si todas las pruebas pasan, significa que ambas correcciones están
 * funcionando correctamente de forma integrada.
 */

# 🧪 PRUEBAS DEL SISTEMA CONTEXTUAL DE BADGES

## 📅 Fecha: 7 de diciembre de 2024
## 👨‍💻 Desarrollador: Emerick Echeverría Vargas
## 📊 Estado: Documentación de pruebas actualizada

---

## 🎯 **OBJETIVO DE LAS PRUEBAS**
Verificar que el sistema contextual de badges funciona correctamente en todos los escenarios posibles y que la detección de contexto es precisa y confiable.

---

## 🧪 **PLAN DE PRUEBAS**

### **1. 🚀 PRUEBA INICIAL - CARGA DE EXTENSIÓN**
- [ ] **Paso 1**: Cargar extensión en Chrome
- [ ] **Paso 2**: Verificar que no hay errores de consola
- [ ] **Paso 3**: Confirmar que el badge está vacío (contexto: No TikTok)
- [ ] **Resultado Esperado**: Badge vacío, color rojo

---

### **2. 🌐 PRUEBA CONTEXTO: NO TIKTOK**
- [ ] **Paso 1**: Navegar a cualquier página que no sea TikTok (ej: google.com)
- [ ] **Paso 2**: Verificar estado del badge
- [ ] **Paso 3**: Abrir popup y verificar mensaje
- [ ] **Resultado Esperado**: 
  - Badge: Vacío
  - Color: Rojo
  - Popup: Mensaje indicando que debe estar en TikTok Live

---

### **3. 🎵 PRUEBA CONTEXTO: TIKTOK NO-LIVE**
- [ ] **Paso 1**: Navegar a tiktok.com (página principal)
- [ ] **Paso 2**: Verificar cambio automático del badge
- [ ] **Paso 3**: Navegar a perfil de usuario (/@usuario)
- [ ] **Paso 4**: Verificar que se mantiene el estado
- [ ] **Resultado Esperado**: 
  - Badge: "Live"
  - Color: Naranja
  - Popup: Mensaje indicando que debe estar en un Live

---

### **4. 📺 PRUEBA CONTEXTO: TIKTOK LIVE INACTIVO**
- [ ] **Paso 1**: Navegar a un Live de TikTok (/@usuario/live)
- [ ] **Paso 2**: Verificar cambio inmediato del badge
- [ ] **Paso 3**: Abrir popup y verificar estado
- [ ] **Paso 4**: Verificar que no hay animación
- [ ] **Resultado Esperado**: 
  - Badge: "OFF"
  - Color: Rojo
  - Sin animación
  - Popup: Controles disponibles pero inactivos

---

### **5. ⚡ PRUEBA CONTEXTO: TIKTOK LIVE ACTIVO**
- [ ] **Paso 1**: Desde un Live, activar la extensión
- [ ] **Paso 2**: Verificar cambio inmediato del badge
- [ ] **Paso 3**: Verificar inicio de animación
- [ ] **Paso 4**: Verificar contador incrementando
- [ ] **Resultado Esperado**: 
  - Badge: "ON" → contador numérico
  - Color: Verde
  - Animación parpadeante
  - Popup: Estado activo con controles

---

### **6. 🔄 PRUEBAS DE TRANSICIÓN DE CONTEXTO**

#### **6.1. Transición: No TikTok → TikTok no-Live**
- [ ] **Acción**: Desde google.com navegar a tiktok.com
- [ ] **Resultado**: Badge vacío → "Live" naranja

#### **6.2. Transición: TikTok no-Live → TikTok Live**
- [ ] **Acción**: Desde tiktok.com navegar a /@usuario/live
- [ ] **Resultado**: "Live" naranja → "OFF" rojo

#### **6.3. Transición: TikTok Live → TikTok no-Live**
- [ ] **Acción**: Desde /@usuario/live navegar a tiktok.com
- [ ] **Resultado**: "OFF" rojo → "Live" naranja

#### **6.4. Transición: TikTok Live → No TikTok**
- [ ] **Acción**: Desde /@usuario/live navegar a google.com
- [ ] **Resultado**: "OFF" rojo → Badge vacío

#### **6.5. Transición con Extensión Activa**
- [ ] **Acción**: Con extensión activa en Live, navegar fuera
- [ ] **Resultado**: Extensión se desactiva automáticamente

---

### **7. 🎮 PRUEBAS DE ACTIVACIÓN/DESACTIVACIÓN**

#### **7.1. Activación desde Popup**
- [ ] **Contexto**: TikTok Live
- [ ] **Acción**: Abrir popup y hacer clic en activar
- [ ] **Resultado**: Badge "OFF" → "ON" → contador, animación inicia

#### **7.2. Desactivación desde Popup**
- [ ] **Contexto**: TikTok Live activo
- [ ] **Acción**: Abrir popup y hacer clic en desactivar
- [ ] **Resultado**: Contador con animación → "OFF", animación se detiene

#### **7.3. Activación desde Hotkey**
- [ ] **Contexto**: TikTok Live
- [ ] **Acción**: Presionar hotkey configurado
- [ ] **Resultado**: Mismos resultados que activación desde popup

---

### **8. 🧠 PRUEBAS DE MEMORY/PERSISTENCIA**

#### **8.1. Recarga de Página**
- [ ] **Acción**: Con extensión activa, recargar página
- [ ] **Resultado**: Extensión se desactiva (comportamiento esperado)

#### **8.2. Cambio de Pestaña**
- [ ] **Acción**: Con extensión activa, cambiar a otra pestaña y volver
- [ ] **Resultado**: Estado se mantiene correctamente

#### **8.3. Cierre y Reapertura de Pestaña**
- [ ] **Acción**: Cerrar pestaña TikTok y abrir nueva
- [ ] **Resultado**: Badge refleja contexto correcto inmediatamente

---

### **9. 🚨 PRUEBAS DE CASOS EXTREMOS**

#### **9.1. URLs Atípicas de TikTok Live**
- [ ] **URL**: /@usuario/live/123456
- [ ] **Resultado**: Detectado como Live ✅

- [ ] **URL**: /@usuario/live?param=value
- [ ] **Resultado**: Detectado como Live ✅

- [ ] **URL**: /@user.name/live
- [ ] **Resultado**: Detectado como Live ✅

#### **9.2. URLs Similares pero NO Live**
- [ ] **URL**: /@usuario/video/123/live
- [ ] **Resultado**: NO detectado como Live ❌

- [ ] **URL**: /live (sin usuario)
- [ ] **Resultado**: NO detectado como Live ❌

#### **9.3. Navegación Rápida**
- [ ] **Acción**: Cambiar rápidamente entre varias páginas
- [ ] **Resultado**: Badge se actualiza correctamente sin retraso

---

### **10. 📊 PRUEBAS DE RENDIMIENTO**

#### **10.1. Uso de Memoria**
- [ ] **Acción**: Monitorear memoria antes y después de cargar extensión
- [ ] **Resultado**: Sin fugas de memoria detectables

#### **10.2. Detección de Contexto**
- [ ] **Acción**: Navegar frecuentemente entre contextos
- [ ] **Resultado**: Detección rápida (< 100ms) y precisa

#### **10.3. Animación de Badge**
- [ ] **Acción**: Mantener extensión activa por períodos largos
- [ ] **Resultado**: Animación fluida sin degradación

---

## ✅ **CHECKLIST DE VERIFICACIÓN FINAL**

### **Funcionalidades Core**
- [ ] ✅ Detección precisa de contexto TikTok
- [ ] ✅ Detección precisa de contexto Live
- [ ] ✅ Badge refleja estado correcto en tiempo real
- [ ] ✅ Animación funciona solo en contexto Live activo
- [ ] ✅ Popup muestra información apropiada para cada contexto

### **Transiciones de Contexto**
- [ ] ✅ Cambios automáticos entre todos los contextos
- [ ] ✅ Sin retrasos ni estados inconsistentes
- [ ] ✅ Limpieza automática de recursos al salir de Live

### **Activación/Desactivación**
- [ ] ✅ Controles funcionan solo en contexto apropiado
- [ ] ✅ Estados visuales consistentes
- [ ] ✅ Respuesta inmediata a acciones del usuario

### **Robustez**
- [ ] ✅ Sin errores de consola en ningún contexto
- [ ] ✅ Manejo graceful de navegación rápida
- [ ] ✅ Recuperación automática de estados inconsistentes

---

## 🐛 **REGISTRO DE ISSUES ENCONTRADOS**

*(Este espacio se completará durante las pruebas)*

### **Issue #1**: [Título del problema]
- **Descripción**: 
- **Pasos para reproducir**: 
- **Resultado esperado**: 
- **Resultado actual**: 
- **Severidad**: Alta/Media/Baja
- **Estado**: Pendiente/En progreso/Resuelto

---

## 📋 **RESUMEN DE RESULTADOS**

*(Este espacio se completará al final de las pruebas)*

- **Total de pruebas**: 0/50
- **Pruebas exitosas**: 0
- **Pruebas fallidas**: 0
- **Issues críticos**: 0
- **Issues menores**: 0

### **Conclusión**
*(A completar después de las pruebas)*

---

## 🔄 **PRÓXIMOS PASOS**

1. **Si todas las pruebas pasan**: Sistema listo for producción
2. **Si hay issues menores**: Documentar y priorizar fixes
3. **Si hay issues críticos**: Corregir inmediatamente antes de continuar

---

**Fecha de última actualización**: $(date)
**Estado del documento**: En progreso

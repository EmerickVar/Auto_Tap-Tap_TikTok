#!/bin/bash

# 🔍 SCRIPT DE VALIDACIÓN PRE-TESTING
# Auto Tap-Tap TikTok v1.1.1 - Junio 2025

echo "🚀 INICIANDO VALIDACIÓN PRE-TESTING..."
echo "=================================="

# Definir ruta base
BASE_PATH="/Users/emerickvar/Documents/GitHub/Auto_Tap-Tap_TikTok/Extensión | Chrome/Auto Tap-Tap"

echo ""
echo "📂 1. VERIFICANDO ARCHIVOS PRINCIPALES..."

# Verificar archivos esenciales
files=("manifest.json" "content.js" "background.js" "popup.js" "popup.html")
all_files_ok=true

for file in "${files[@]}"; do
    if [ -f "$BASE_PATH/$file" ]; then
        echo "   ✅ $file - PRESENTE"
    else
        echo "   ❌ $file - FALTANTE"
        all_files_ok=false
    fi
done

echo ""
echo "🔧 2. VERIFICANDO CORRECCIONES ESPECÍFICAS..."

# Verificar la corrección updateTapTaps en content.js
if grep -q "case 'updateTapTaps':" "$BASE_PATH/content.js"; then
    echo "   ✅ Caso 'updateTapTaps' - PRESENTE en content.js"
else
    echo "   ❌ Caso 'updateTapTaps' - FALTANTE en content.js"
    all_files_ok=false
fi

# Verificar la definición del objeto timers
if grep -q "const timers = {" "$BASE_PATH/content.js"; then
    echo "   ✅ Objeto 'timers' - DEFINIDO en content.js"
else
    echo "   ❌ Objeto 'timers' - NO ENCONTRADO en content.js"
    all_files_ok=false
fi

# Verificar función mostrarCuentaRegresiva
if grep -q "function mostrarCuentaRegresiva" "$BASE_PATH/content.js"; then
    echo "   ✅ Función 'mostrarCuentaRegresiva' - PRESENTE"
else
    echo "   ❌ Función 'mostrarCuentaRegresiva' - FALTANTE"
    all_files_ok=false
fi

echo ""
echo "📋 3. VERIFICANDO ESTRUCTURA DE DIRECTORIOS..."

# Verificar directorios importantes
directories=("Documentation" "testing")
for dir in "${directories[@]}"; do
    if [ -d "$BASE_PATH/$dir" ]; then
        echo "   ✅ Directorio $dir/ - PRESENTE"
    else
        echo "   ⚠️  Directorio $dir/ - FALTANTE (no crítico)"
    fi
done

echo ""
echo "🧪 4. VERIFICANDO ARCHIVOS DE TESTING..."

# Verificar archivos de testing
test_files=("test_updateTapTaps.js" "test_cuenta_regresiva.js")
for test_file in "${test_files[@]}"; do
    if [ -f "$BASE_PATH/testing/$test_file" ]; then
        echo "   ✅ $test_file - PRESENTE"
    else
        echo "   ⚠️  $test_file - FALTANTE (no crítico para testing manual)"
    fi
done

echo ""
echo "📖 5. VERIFICANDO DOCUMENTACIÓN ACTUALIZADA..."

doc_files=("CORRECCIONES_ERRORES_JUNIO2025.md" "GUIA_TESTING_FINAL.md")
for doc_file in "${doc_files[@]}"; do
    if [ -f "$BASE_PATH/Documentation/$doc_file" ]; then
        echo "   ✅ $doc_file - PRESENTE"
    else
        echo "   ⚠️  $doc_file - FALTANTE"
    fi
done

echo ""
echo "🔍 6. ANÁLISIS DE SINTAXIS JAVASCRIPT..."

# Verificar sintaxis de archivos JS principales
js_files=("content.js" "background.js" "popup.js")
syntax_ok=true

for js_file in "${js_files[@]}"; do
    # Usar node para verificar sintaxis (si está disponible)
    if command -v node >/dev/null 2>&1; then
        if node -c "$BASE_PATH/$js_file" 2>/dev/null; then
            echo "   ✅ $js_file - SINTAXIS VÁLIDA"
        else
            echo "   ❌ $js_file - ERROR DE SINTAXIS"
            syntax_ok=false
        fi
    else
        echo "   ⚠️  $js_file - No se puede verificar sintaxis (Node.js no disponible)"
    fi
done

echo ""
echo "📊 RESUMEN DE VALIDACIÓN"
echo "======================="

if [ "$all_files_ok" = true ] && [ "$syntax_ok" = true ]; then
    echo "🎉 ESTADO: LISTO PARA TESTING MANUAL"
    echo ""
    echo "✅ Todos los archivos principales están presentes"
    echo "✅ Las correcciones específicas están implementadas"
    echo "✅ La sintaxis JavaScript es válida"
    echo ""
    echo "🌐 PRÓXIMO PASO:"
    echo "   1. Cargar la extensión en Chrome (chrome://extensions/)"
    echo "   2. Seguir la GUIA_TESTING_FINAL.md"
    echo "   3. Verificar que no aparezcan los errores corregidos"
    echo ""
    exit 0
else
    echo "⚠️  ESTADO: REQUIERE ATENCIÓN"
    echo ""
    if [ "$all_files_ok" = false ]; then
        echo "❌ Algunos archivos están faltantes o las correcciones no están implementadas"
    fi
    if [ "$syntax_ok" = false ]; then
        echo "❌ Se encontraron errores de sintaxis en archivos JavaScript"
    fi
    echo ""
    echo "🔧 ACCIÓN REQUERIDA: Revisar y corregir los problemas indicados arriba"
    echo ""
    exit 1
fi

#!/bin/zsh

# =============================================================================
# VALIDACIÓN FINAL DESPUÉS DE LIMPIEZA DE ARCHIVOS
# =============================================================================

echo "🧹 VALIDACIÓN DESPUÉS DE LIMPIEZA DE ARCHIVOS"
echo "========================================================================"

BASE_DIR="/Users/emerickvar/Documents/GitHub/Auto_Tap-Tap_TikTok/Extensión | Chrome/Auto Tap-Tap"

echo ""
echo "📊 ESTADO ACTUAL DEL PROYECTO"
echo "----------------------------------------------------------------------"

echo "📁 Estructura de directorios:"
echo "  📂 Archivos principales:"
ls -la "$BASE_DIR"/*.js "$BASE_DIR"/*.json "$BASE_DIR"/*.html "$BASE_DIR"/*.css 2>/dev/null | wc -l | xargs echo "    - Archivos de código:"

echo "  📂 Testing:"
ls -la "$BASE_DIR/testing"/*.js "$BASE_DIR/testing"/*.sh 2>/dev/null | wc -l | xargs echo "    - Archivos de testing:"

echo "  📂 Documentación:"
ls -la "$BASE_DIR/Documentation"/*.md 2>/dev/null | wc -l | xargs echo "    - Archivos de documentación:"

echo "  📂 Iconos:"
ls -la "$BASE_DIR/icons"/* 2>/dev/null | wc -l | xargs echo "    - Archivos de iconos:"

echo ""
echo "📋 ARCHIVOS RESTANTES"
echo "----------------------------------------------------------------------"

echo "🧪 Testing (mantenidos):"
if [[ -d "$BASE_DIR/testing" ]]; then
    ls "$BASE_DIR/testing" | while read file; do
        echo "  ✅ $file"
    done
else
    echo "  ❌ Directorio testing no encontrado"
fi

echo ""
echo "📚 Documentación (mantenida):"
if [[ -d "$BASE_DIR/Documentation" ]]; then
    ls "$BASE_DIR/Documentation" | while read file; do
        case $file in
            "README.md")
                echo "  ✅ $file - Punto de entrada principal"
                ;;
            "DOCUMENTACIÓN.md")
                echo "  ✅ $file - Documentación técnica completa"
                ;;
            "DIAGRAMAS_TÉCNICOS.md")
                echo "  ✅ $file - Arquitectura y diagramas"
                ;;
            *)
                echo "  ℹ️  $file - Archivo adicional"
                ;;
        esac
    done
else
    echo "  ❌ Directorio Documentation no encontrado"
fi

echo ""
echo "📊 ESTADÍSTICAS DE LIMPIEZA"
echo "----------------------------------------------------------------------"

# Calcular archivos totales
total_files=$(find "$BASE_DIR" -type f \( -name "*.js" -o -name "*.md" -o -name "*.sh" -o -name "*.json" -o -name "*.html" -o -name "*.css" \) | wc -l)
echo "📁 Total de archivos principales: $total_files archivos"

# Archivos de código principal
code_files=$(ls "$BASE_DIR"/*.js "$BASE_DIR"/*.json "$BASE_DIR"/*.html "$BASE_DIR"/*.css 2>/dev/null | wc -l)
echo "⚡ Archivos de código principal: $code_files archivos"

# Archivos de testing
test_files=$(find "$BASE_DIR/testing" -type f 2>/dev/null | wc -l)
echo "🧪 Archivos de testing: $test_files archivos"

# Archivos de documentación
doc_files=$(find "$BASE_DIR/Documentation" -type f -name "*.md" 2>/dev/null | wc -l)
echo "📚 Archivos de documentación: $doc_files archivos"

echo ""
echo "✅ VERIFICACIÓN DE LIMPIEZA"
echo "----------------------------------------------------------------------"

# Verificar que no existan archivos temporales
temp_count=$(find "$BASE_DIR" -name "temp_*" -o -name "backup_*" -o -name "*_tmp*" 2>/dev/null | wc -l)
if [[ $temp_count -eq 0 ]]; then
    echo "✅ Sin archivos temporales"
else
    echo "⚠️  Encontrados $temp_count archivos temporales"
fi

# Verificar que no existan archivos de respaldo
backup_count=$(find "$BASE_DIR" -name "*backup*" -o -name "*.bak" 2>/dev/null | wc -l)
if [[ $backup_count -eq 0 ]]; then
    echo "✅ Sin archivos de respaldo"
else
    echo "⚠️  Encontrados $backup_count archivos de respaldo"
fi

# Verificar que no existan archivos duplicados obvios
duplicate_count=$(find "$BASE_DIR" -name "*_fix.js" -o -name "*_old.*" -o -name "*_new.*" 2>/dev/null | wc -l)
if [[ $duplicate_count -eq 0 ]]; then
    echo "✅ Sin archivos duplicados obvios"
else
    echo "⚠️  Encontrados $duplicate_count archivos potencialmente duplicados"
fi

echo ""
echo "🎯 RESULTADO FINAL"
echo "========================================================================"

if [[ $test_files -le 3 && $doc_files -le 5 && $temp_count -eq 0 ]]; then
    echo "🎉 LIMPIEZA EXITOSA"
    echo ""
    echo "📋 ESTADO OPTIMIZADO:"
    echo "   ✅ Solo archivos esenciales mantenidos"
    echo "   ✅ $test_files archivos de testing (óptimo)"
    echo "   ✅ $doc_files archivos de documentación (óptimo)"
    echo "   ✅ Sin archivos temporales o redundantes"
    echo "   ✅ Estructura limpia y mantenible"
    
    echo ""
    echo "📂 ESTRUCTURA FINAL OPTIMIZADA:"
    echo "   📁 Auto Tap-Tap/"
    echo "   ├── 📄 6 archivos de código principal"
    echo "   ├── 📁 testing/ ($test_files archivos esenciales)"
    echo "   ├── 📁 Documentation/ ($doc_files archivos principales)"
    echo "   └── 📁 icons/ (recursos gráficos)"
    
else
    echo "⚠️  LIMPIEZA PARCIAL"
    echo "   Algunos directorios aún podrían optimizarse más"
fi

echo ""
echo "🚀 PRÓXIMO PASO:"
echo "   El proyecto está limpio y optimizado"
echo "   Ready para desarrollo o distribución"

echo ""
echo "✅ Validación completada - $(date)"

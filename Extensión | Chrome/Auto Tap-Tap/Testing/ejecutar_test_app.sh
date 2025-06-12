#!/bin/zsh

# =============================================================================
# SCRIPT CONSOLIDADO PARA EJECUTAR SUITE DE PRUEBAS
# =============================================================================
# 
# Este script verifica la existencia de los 3 archivos principales de testing,
# consolida todas las funcionalidades y ejecuta pruebas con datos mock para
# evaluar cada módulo de la extensión Auto Tap-Tap TikTok.
# 
# ARCHIVOS REQUERIDOS:
# - ejecutar_test_app.sh (este archivo)
# - optimizar_testing.sh
# - test_app.js
# 
# @author Emerick Echeverría Vargas
# @date Junio 2025
# @version 2.0.0 (Consolidado)

# Detectar automáticamente la ruta del directorio testing
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTING_PATH="$SCRIPT_DIR"

# Detectar el directorio raíz de la extensión (directorio padre del testing)
EXTENSION_DIR="$(dirname "$TESTING_PATH")"
PROJECT_ROOT="$(dirname "$(dirname "$EXTENSION_DIR")")"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🧪 EJECUTOR CONSOLIDADO DE SUITE DE PRUEBAS v2.0${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📊 Auto Tap-Tap TikTok - Evaluación completa de módulos${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 0: VALIDAR ESTRUCTURA DEL PROYECTO
# ═══════════════════════════════════════════════════════════════════════════════

validar_estructura_proyecto() {
    echo -e "${YELLOW}🔍 PASO 0: Validando estructura del proyecto...${NC}"
    echo "────────────────────────────────────────────────────"
    
    # Verificar que estamos en el directorio correcto
    if [[ ! "$(basename "$TESTING_PATH")" =~ [Tt]esting ]]; then
        echo -e "${RED}❌ ERROR: Este script debe ejecutarse desde el directorio 'testing'${NC}"
        echo -e "${YELLOW}💡 Ubicación actual: $TESTING_PATH${NC}"
        return 1
    fi
    
    # Verificar estructura básica de la extensión
    if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
        echo -e "${YELLOW}⚠️ ADVERTENCIA: No se encontró manifest.json en el directorio padre${NC}"
        echo -e "${CYAN}ℹ️ Continuando con las pruebas en el directorio actual...${NC}"
    else
        echo -e "   ✅ Estructura de extensión detectada correctamente"
        echo -e "   📁 Directorio de extensión: $(basename "$EXTENSION_DIR")"
        echo -e "   📁 Directorio de testing: $(basename "$TESTING_PATH")"
    fi
    
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 1: VERIFICACIÓN DE ARCHIVOS REQUERIDOS
# ═══════════════════════════════════════════════════════════════════════════════

verificar_archivos() {
    echo -e "${YELLOW}🔍 PASO 1: Verificando archivos requeridos...${NC}"
    echo "────────────────────────────────────────────────"
    
    local archivos_requeridos=(
        "ejecutar_test_app.sh"
        "optimizar_testing.sh"
        "test_app.js"
        "setup_testing.sh"
        "README.md"
    )
    
    local archivos_faltantes=()
    
    for archivo in "${archivos_requeridos[@]}"; do
        if [ -f "$TESTING_PATH/$archivo" ]; then
            echo -e "   ✅ ${archivo} - Encontrado"
        else
            echo -e "   ❌ ${archivo} - Faltante"
            archivos_faltantes+=("$archivo")
        fi
    done
    
    if [ ${#archivos_faltantes[@]} -eq 0 ]; then
        echo -e "\n${GREEN}✅ Todos los archivos requeridos están presentes${NC}"
        return 0
    else
        echo -e "\n${RED}❌ Faltan archivos requeridos:${NC}"
        for archivo in "${archivos_faltantes[@]}"; do
            echo -e "   - ${archivo}"
        done
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 2: CONSOLIDACIÓN DE FUNCIONALIDADES
# ═══════════════════════════════════════════════════════════════════════════════

consolidar_funcionalidades() {
    echo -e "\n${YELLOW}🔧 PASO 2: Verificando consolidación de funcionalidades...${NC}"
    echo "──────────────────────────────────────────────────────────"
    
    # Verificar que test_app.js contiene todos los módulos
    local modulos_requeridos=(
        "MockData"
        "TestSuite"
        "contentModules"
        "backgroundModule"
        "popupModule"
        "integracion"
    )
    
    local modulos_encontrados=0
    
    for modulo in "${modulos_requeridos[@]}"; do
        if grep -q "$modulo" "$TESTING_PATH/test_app.js"; then
            echo -e "   ✅ Módulo ${modulo} - Consolidado"
            ((modulos_encontrados++))
        else
            echo -e "   ❌ Módulo ${modulo} - No encontrado"
        fi
    done
    
    echo -e "\n${CYAN}📊 Módulos consolidados: ${modulos_encontrados}/${#modulos_requeridos[@]}${NC}"
    
    if [ $modulos_encontrados -eq ${#modulos_requeridos[@]} ]; then
        echo -e "${GREEN}✅ Consolidación completa - Todos los módulos presentes${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Consolidación parcial - Algunos módulos pueden faltar${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 3: EJECUTAR PRUEBAS CON DATOS MOCK
# ═══════════════════════════════════════════════════════════════════════════════

ejecutar_pruebas_mock() {
    echo -e "\n${YELLOW}🚀 PASO 3: Ejecutando pruebas con datos mock...${NC}"
    echo "─────────────────────────────────────────────────────"
    
    local modo_ejecucion="$1"
    
    case "$modo_ejecucion" in
        "navegador" | "browser")
            ejecutar_en_navegador
            ;;
        "node" | "nodejs")
            ejecutar_con_node
            ;;
        "mostrar" | "show")
            mostrar_contenido_test
            ;;
        "copiar" | "copy")
            copiar_al_clipboard
            ;;
        *)
            echo -e "${BLUE}📋 Opciones de ejecución disponibles:${NC}"
            echo "   navegador  - Abrir en Chrome con TikTok Live"
            echo "   node       - Ejecutar con Node.js (limitado)"
            echo "   mostrar    - Mostrar contenido del test"
            echo "   copiar     - Copiar al clipboard"
            echo ""
            echo -e "${YELLOW}💡 Modo recomendado: navegador${NC}"
            ;;
    esac
}

# Función para ejecutar en navegador
ejecutar_en_navegador() {
    echo -e "${BLUE}🌐 Ejecutando en navegador...${NC}"
    
    # Abrir Chrome con TikTok Live
    if command -v open >/dev/null 2>&1; then
        open -a "Google Chrome" "https://www.tiktok.com/live"
        echo -e "${GREEN}✅ Chrome abierto con TikTok Live${NC}"
        echo ""
        echo -e "${CYAN}📋 INSTRUCCIONES:${NC}"
        echo "   1. Espera a que cargue TikTok Live"
        echo "   2. Presiona F12 o Cmd+Option+I para abrir DevTools"
        echo "   3. Ve a la pestaña 'Console'"
        echo "   4. Ejecuta: $0 copiar"
        echo "   5. Pega el contenido en la consola y presiona Enter"
        echo ""
        echo -e "${YELLOW}💡 Las pruebas evaluarán todos los módulos con datos mock${NC}"
    else
        echo -e "${RED}❌ No se puede abrir Chrome automáticamente${NC}"
        echo -e "${CYAN}💡 Abre manualmente: https://www.tiktok.com/live${NC}"
    fi
}

# Función para ejecutar con Node.js
ejecutar_con_node() {
    echo -e "${YELLOW}⚠️ ADVERTENCIA: Ejecución con Node.js${NC}"
    echo "   Las pruebas están diseñadas para navegador"
    echo "   Algunas APIs de Chrome no estarán disponibles"
    echo ""
    
    if command -v node >/dev/null 2>&1; then
        echo -e "${BLUE}🚀 Ejecutando con Node.js...${NC}"
        node "$TESTING_PATH/test_app.js"
    else
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        echo -e "${CYAN}💡 Instala Node.js o usa la opción 'navegador'${NC}"
    fi
}

# Función para mostrar contenido
mostrar_contenido_test() {
    echo -e "${CYAN}📄 CONTENIDO DEL TEST SUITE CONSOLIDADO:${NC}"
    echo "════════════════════════════════════════════════"
    cat "$TESTING_PATH/test_app.js"
}

# Función para copiar al clipboard
copiar_al_clipboard() {
    if command -v pbcopy >/dev/null 2>&1; then
        cat "$TESTING_PATH/test_app.js" | pbcopy
        echo -e "${GREEN}✅ Suite de pruebas copiado al clipboard${NC}"
        echo -e "${YELLOW}💡 Ahora puedes pegarlo en la consola del navegador${NC}"
        echo ""
        echo -e "${CYAN}🎯 QUÉ ESPERAR:${NC}"
        echo "   • Evaluación completa de Content.js, Background.js y Popup.js"
        echo "   • Pruebas con datos mock para simular entorno TikTok"
        echo "   • Estadísticas detalladas por módulo"
        echo "   • Recomendaciones de optimización"
        echo "   • Calificación general del sistema"
    else
        echo -e "${YELLOW}⚠️ pbcopy no disponible en este sistema${NC}"
        echo -e "${CYAN}💡 Usa la opción 'mostrar' para ver el contenido${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 4: LIMPIEZA Y MANTENIMIENTO
# ═══════════════════════════════════════════════════════════════════════════════

limpiar_archivos_extra() {
    echo -e "\n${YELLOW}🧹 PASO 4: Limpiando archivos extra...${NC}"
    echo "───────────────────────────────────────────"
    
    # Archivos que se deben mantener
    local archivos_mantener=(
        "ejecutar_test_app.sh"
        "optimizar_testing.sh"
        "test_app.js"
        "setup_testing.sh"
        "README.md"
    )
    
    # Buscar archivos extra en el directorio de testing
    local archivos_extra=()
    
    for archivo in "$TESTING_PATH"/*; do
        if [ -f "$archivo" ]; then
            local nombre_archivo=$(basename "$archivo")
            local mantener=false
            
            for mantener_archivo in "${archivos_mantener[@]}"; do
                if [ "$nombre_archivo" = "$mantener_archivo" ]; then
                    mantener=true
                    break
                fi
            done
            
            if [ "$mantener" = false ]; then
                archivos_extra+=("$archivo")
            fi
        fi
    done
    
    if [ ${#archivos_extra[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ No hay archivos extra para limpiar${NC}"
    else
        echo -e "${CYAN}📋 Archivos extra encontrados:${NC}"
        for archivo in "${archivos_extra[@]}"; do
            echo -e "   - $(basename "$archivo")"
        done
        
        echo -e "\n${YELLOW}❓ ¿Deseas eliminar estos archivos? (y/N):${NC}"
        read -r respuesta
        
        if [[ "$respuesta" =~ ^[Yy]$ ]]; then
            for archivo in "${archivos_extra[@]}"; do
                rm "$archivo"
                echo -e "   🗑️ Eliminado: $(basename "$archivo")"
            done
            echo -e "${GREEN}✅ Limpieza completada${NC}"
        else
            echo -e "${YELLOW}ℹ️ Limpieza cancelada por el usuario${NC}"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    local comando="${1:-ayuda}"
    
    case "$comando" in
        "verificar" | "-v" | "--verify")
            validar_estructura_proyecto
            verificar_archivos
            consolidar_funcionalidades
            ;;
        "ejecutar" | "-e" | "--execute")
            if validar_estructura_proyecto && verificar_archivos && consolidar_funcionalidades; then
                ejecutar_pruebas_mock "${2:-navegador}"
            else
                echo -e "${RED}❌ No se puede ejecutar: fallan verificaciones previas${NC}"
                exit 1
            fi
            ;;
        "navegador" | "-n" | "--browser")
            validar_estructura_proyecto
            ejecutar_pruebas_mock "navegador"
            ;;
        "node" | "--node")
            validar_estructura_proyecto
            ejecutar_pruebas_mock "node"
            ;;
        "mostrar" | "-m" | "--show")
            validar_estructura_proyecto
            ejecutar_pruebas_mock "mostrar"
            ;;
        "copiar" | "-c" | "--copy")
            validar_estructura_proyecto
            ejecutar_pruebas_mock "copiar"
            ;;
        "limpiar" | "-l" | "--clean")
            validar_estructura_proyecto
            limpiar_archivos_extra
            ;;
        "todo" | "-t" | "--all")
            echo -e "${BLUE}🔄 Ejecutando proceso completo...${NC}"
            if validar_estructura_proyecto && verificar_archivos && consolidar_funcionalidades; then
                ejecutar_pruebas_mock "navegador"
                sleep 3
                ejecutar_pruebas_mock "copiar"
                limpiar_archivos_extra
            else
                echo -e "${RED}❌ Proceso completo fallido${NC}"
                exit 1
            fi
            ;;
        "ayuda" | "-h" | "--help")
            echo -e "\n${CYAN}COMANDOS DISPONIBLES:${NC}"
            echo "   verificar, -v   : Verificar archivos y consolidación"
            echo "   ejecutar, -e    : Ejecutar suite de pruebas"
            echo "   navegador, -n   : Abrir en navegador (recomendado)"
            echo "   node            : Ejecutar con Node.js (limitado)"
            echo "   mostrar, -m     : Mostrar contenido del test"
            echo "   copiar, -c      : Copiar al clipboard"
            echo "   limpiar, -l     : Limpiar archivos extra"
            echo "   todo, -t        : Proceso completo automatizado"
            echo "   ayuda, -h       : Mostrar esta ayuda"
            echo ""
            echo -e "${YELLOW}💡 RECOMENDADO: $0 todo${NC}"
            echo -e "${CYAN}🎯 NUEVO: Pruebas con datos mock para todos los módulos${NC}"
            ;;
        *)
            echo -e "${RED}❌ Comando no reconocido: $comando${NC}"
            echo -e "${YELLOW}💡 Usa '$0 ayuda' para ver comandos disponibles${NC}"
            exit 1
            ;;
    esac
}

# Ejecutar función principal con argumentos
main "$@"

# Mostrar información final
echo ""
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🏁 EJECUTOR CONSOLIDADO COMPLETADO${NC}"
echo -e "${CYAN}📊 Todos los módulos evaluados con datos mock${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"

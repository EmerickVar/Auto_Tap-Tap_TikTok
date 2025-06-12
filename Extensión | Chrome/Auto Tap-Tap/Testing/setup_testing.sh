#!/bin/zsh

# =============================================================================
# SCRIPT DE CONFIGURACIÓN AUTOMÁTICA PARA TESTING
# =============================================================================
# 
# Este script configura automáticamente el entorno de testing para cualquier
# usuario, detectando las rutas dinámicamente y verificando la estructura.
# 
# FUNCIONES:
# - Detección automática de rutas
# - Verificación de estructura del proyecto
# - Configuración de permisos de ejecución
# - Validación de dependencias del sistema
# 
# @author Emerick Echeverría Vargas
# @date Junio 2025
# @version 2.0.0 (Setup automático)

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}⚙️ CONFIGURADOR AUTOMÁTICO DE TESTING v1.0${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🎯 Configurando entorno de testing dinámicamente${NC}"
echo ""

# Detectar rutas automáticamente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTING_PATH="$SCRIPT_DIR"
EXTENSION_DIR="$(dirname "$TESTING_PATH")"
PROJECT_ROOT="$(dirname "$(dirname "$EXTENSION_DIR")")"

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 1: VERIFICAR ESTRUCTURA DEL PROYECTO
# ═══════════════════════════════════════════════════════════════════════════════

verificar_estructura() {
    echo -e "${YELLOW}🔍 PASO 1: Verificando estructura del proyecto...${NC}"
    echo "───────────────────────────────────────────────────────"
    
    echo -e "${CYAN}📁 Rutas detectadas:${NC}"
    echo -e "   🗂️ Testing: $TESTING_PATH"
    echo -e "   🗂️ Extensión: $EXTENSION_DIR" 
    echo -e "   🗂️ Proyecto: $PROJECT_ROOT"
    echo ""
    
    # Verificar archivos esenciales de la extensión
    local archivos_extension=(
        "manifest.json"
        "popup.js"
        "content.js"
        "background.js"
        "popup.html"
        "popup.css"
        "popup.js"
        "../icons/icono_16.png"
        "../icons/icono_48.png"
        "../icons/icono_96.png"
        "../icons/icono_128.png"
    )
    
    echo -e "${CYAN}📋 Verificando archivos de extensión:${NC}"
    local extension_valida=true
    for archivo in "${archivos_extension[@]}"; do
        if [ -f "$EXTENSION_DIR/$archivo" ]; then
            echo -e "   ✅ $archivo"
        else
            echo -e "   ❌ $archivo - FALTANTE"
            extension_valida=false
        fi
    done
    
    # Verificar archivos de testing
    local archivos_testing=(
        "ejecutar_test_app.sh"
        "optimizar_testing.sh"
        "test_app.js"
        "setup_testing.sh"
        "README.md"
    )
    
    echo -e "\n${CYAN}📋 Verificando archivos de testing:${NC}"
    local testing_valido=true
    for archivo in "${archivos_testing[@]}"; do
        if [ -f "$TESTING_PATH/$archivo" ]; then
            echo -e "   ✅ $archivo"
        else
            echo -e "   ❌ $archivo - FALTANTE"
            testing_valido=false
        fi
    done
    
    if [ "$extension_valida" = true ] && [ "$testing_valido" = true ]; then
        echo -e "\n${GREEN}✅ Estructura del proyecto válida${NC}"
        return 0
    else
        echo -e "\n${RED}❌ Estructura del proyecto incompleta${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 2: CONFIGURAR PERMISOS
# ═══════════════════════════════════════════════════════════════════════════════

configurar_permisos() {
    echo -e "\n${YELLOW}🔐 PASO 2: Configurando permisos de ejecución...${NC}"
    echo "─────────────────────────────────────────────────────────"
    
    local scripts=(
        "ejecutar_test_app.sh"
        "optimizar_testing.sh"
        "setup_testing.sh"
    )
    
    local permisos_ok=0
    for script in "${scripts[@]}"; do
        if [ -f "$TESTING_PATH/$script" ]; then
            if chmod +x "$TESTING_PATH/$script" 2>/dev/null; then
                echo -e "   ✅ Permisos configurados: $script"
                ((permisos_ok++))
            else
                echo -e "   ❌ Error configurando: $script"
            fi
        fi
    done
    
    echo -e "\n${CYAN}📊 Permisos configurados: $permisos_ok/${#scripts[@]} scripts${NC}"
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 3: VERIFICAR DEPENDENCIAS DEL SISTEMA
# ═══════════════════════════════════════════════════════════════════════════════

verificar_dependencias() {
    echo -e "\n${YELLOW}📦 PASO 3: Verificando dependencias del sistema...${NC}"
    echo "──────────────────────────────────────────────────────────"
    
    local dependencias=(
        "node:Node.js"
        "zsh:Z Shell"
        "open:Comando open (macOS)"
    )
    
    local deps_disponibles=0
    for dep in "${dependencias[@]}"; do
        local comando="${dep%%:*}"
        local nombre="${dep##*:}"
        
        if command -v "$comando" >/dev/null 2>&1; then
            echo -e "   ✅ $nombre disponible"
            ((deps_disponibles++))
        else
            echo -e "   ⚠️ $nombre no disponible"
        fi
    done
    
    echo -e "\n${CYAN}📊 Dependencias: $deps_disponibles/${#dependencias[@]} disponibles${NC}"
    
    if [ $deps_disponibles -ge 2 ]; then
        echo -e "${GREEN}✅ Suficientes dependencias para ejecutar testing${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Algunas funcionalidades pueden estar limitadas${NC}"
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 4: GENERAR INFORMACIÓN DE USO
# ═══════════════════════════════════════════════════════════════════════════════

generar_info_uso() {
    echo -e "\n${YELLOW}📖 PASO 4: Generando información de uso...${NC}"
    echo "─────────────────────────────────────────────────────"
    
    echo -e "\n${GREEN}🎉 CONFIGURACIÓN COMPLETADA${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    
    echo -e "\n${CYAN}🚀 COMANDOS DISPONIBLES:${NC}"
    echo -e "${YELLOW}Testing principal:${NC}"
    echo "   ./ejecutar_test_app.sh todo     # Proceso completo automatizado"
    echo "   ./ejecutar_test_app.sh navegador # Abrir pruebas en navegador"
    echo "   ./ejecutar_test_app.sh verificar # Solo verificar archivos"
    echo ""
    echo -e "${YELLOW}Optimización:${NC}"
    echo "   ./optimizar_testing.sh optimizar # Limpiar archivos extra"
    echo "   ./optimizar_testing.sh verificar # Verificar estado"
    echo ""
    echo -e "${YELLOW}Configuración:${NC}"
    echo "   ./setup_testing.sh              # Ejecutar este configurador"
    
    echo -e "\n${BLUE}💡 RECOMENDACIÓN:${NC}"
    echo -e "${CYAN}Ejecuta './ejecutar_test_app.sh todo' para comenzar${NC}"
    
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    if verificar_estructura; then
        configurar_permisos
        verificar_dependencias
        generar_info_uso
        
        echo -e "\n${GREEN}🏁 CONFIGURACIÓN AUTOMÁTICA COMPLETADA${NC}"
        echo -e "${CYAN}✨ El entorno de testing está listo para usar${NC}"
        return 0
    else
        echo -e "\n${RED}❌ ERROR: No se pudo completar la configuración${NC}"
        echo -e "${YELLOW}💡 Verifica que estés en el directorio correcto de la extensión${NC}"
        return 1
    fi
}

# Ejecutar configuración
main "$@"

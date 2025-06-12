#!/bin/zsh

# =============================================================================
# SCRIPT DE OPTIMIZACIÓN Y LIMPIEZA DE TESTING v2.0
# =============================================================================
# 
# Este script optimiza el directorio de testing manteniendo únicamente los
# 3 archivos esenciales y eliminando cualquier archivo redundante o temporal.
# 
# ARCHIVOS MANTENIDOS:
# - ejecutar_test_app.sh (script principal)
# - optimizar_testing.sh (este archivo)
# - test_app.js (suite de pruebas consolidado)
# 
# @author Emerick Echeverría Vargas
# @date Junio 2025
# @version 2.0.0 (Optimizado)

# Detectar automáticamente la ruta del directorio testing
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTING_PATH="$SCRIPT_DIR"

# Detectar el directorio raíz de la extensión (directorio padre del testing)
EXTENSION_DIR="$(dirname "$TESTING_PATH")"
PROJECT_ROOT="$(dirname "$(dirname "$EXTENSION_DIR")")"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🧹 OPTIMIZADOR DE TESTING v2.0${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🎯 Manteniendo solo los 3 archivos esenciales${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 0: VALIDAR ESTRUCTURA DEL PROYECTO
# ═══════════════════════════════════════════════════════════════════════════════

validar_estructura_proyecto() {
    echo -e "${YELLOW}🔍 PASO 0: Validando estructura del proyecto...${NC}"
    echo "──────────────────────────────────────────────────────"
    
    # Verificar que estamos en el directorio correcto
    if [[ ! "$(basename "$TESTING_PATH")" =~ [Tt]esting ]]; then
        echo -e "${RED}❌ ERROR: Este script debe ejecutarse desde el directorio 'testing'${NC}"
        echo -e "${YELLOW}💡 Ubicación actual: $TESTING_PATH${NC}"
        return 1
    fi
    
    # Verificar estructura básica de la extensión
    if [ ! -f "$EXTENSION_DIR/manifest.json" ]; then
        echo -e "${YELLOW}⚠️ ADVERTENCIA: No se encontró manifest.json en el directorio padre${NC}"
        echo -e "${CYAN}ℹ️ Continuando con el directorio actual como testing...${NC}"
    else
        echo -e "   ✅ Estructura de extensión detectada correctamente"
        echo -e "   📁 Directorio de extensión: $(basename "$EXTENSION_DIR")"
        echo -e "   📁 Directorio de testing: $(basename "$TESTING_PATH")"
    fi
    
    return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 1: VERIFICAR ARCHIVOS ESENCIALES
# ═══════════════════════════════════════════════════════════════════════════════

verificar_archivos_esenciales() {
    echo -e "${YELLOW}🔍 PASO 1: Verificando archivos esenciales...${NC}"
    echo "──────────────────────────────────────────────────"
    
    local archivos_esenciales=(
        "ejecutar_test_app.sh"
        "optimizar_testing.sh"
        "test_app.js"
        "setup_testing.sh"
        "README.md"
    )
    
    local todos_presentes=true
    
    for archivo in "${archivos_esenciales[@]}"; do
        if [ -f "$TESTING_PATH/$archivo" ]; then
            echo -e "   ✅ ${archivo} - Presente"
        else
            echo -e "   ❌ ${archivo} - FALTANTE"
            todos_presentes=false
        fi
    done
    
    if [ "$todos_presentes" = true ]; then
        echo -e "\n${GREEN}✅ Todos los archivos esenciales están presentes${NC}"
        return 0
    else
        echo -e "\n${RED}❌ CRÍTICO: Faltan archivos esenciales${NC}"
        echo -e "${YELLOW}💡 No se puede proceder con la optimización${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 2: IDENTIFICAR ARCHIVOS A ELIMINAR
# ═══════════════════════════════════════════════════════════════════════════════

identificar_archivos_extra() {
    echo -e "\n${YELLOW}🔍 PASO 2: Identificando archivos extra...${NC}"
    echo "─────────────────────────────────────────────────"
    
    # Archivos que se deben mantener
    local archivos_mantener=(
        "ejecutar_test_app.sh"
        "optimizar_testing.sh"
        "test_app.js"
        "setup_testing.sh"
        "README.md"
    )
    
    # Array para archivos extra
    archivos_para_eliminar=()
    
    # Buscar todos los archivos en el directorio
    for archivo in "$TESTING_PATH"/*; do
        if [ -f "$archivo" ]; then
            local nombre_archivo=$(basename "$archivo")
            local mantener=false
            
            # Verificar si el archivo debe mantenerse
            for mantener_archivo in "${archivos_mantener[@]}"; do
                if [ "$nombre_archivo" = "$mantener_archivo" ]; then
                    mantener=true
                    break
                fi
            done
            
            # Si no debe mantenerse, añadir a lista de eliminación
            if [ "$mantener" = false ]; then
                archivos_para_eliminar+=("$archivo")
            fi
        fi
    done
    
    # Mostrar resultados
    if [ ${#archivos_para_eliminar[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ No hay archivos extra para eliminar${NC}"
        echo -e "${CYAN}💡 El directorio ya está optimizado${NC}"
        return 1
    else
        echo -e "${YELLOW}📋 Archivos extra encontrados (${#archivos_para_eliminar[@]}):${NC}"
        for archivo in "${archivos_para_eliminar[@]}"; do
            local tamaño=$(du -h "$archivo" | cut -f1)
            echo -e "   🗂️ $(basename "$archivo") (${tamaño})"
        done
        return 0
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 3: CREAR BACKUP ANTES DE ELIMINAR
# ═══════════════════════════════════════════════════════════════════════════════

crear_backup() {
    echo -e "\n${YELLOW}📦 PASO 3: Creando backup de seguridad...${NC}"
    echo "─────────────────────────────────────────────────────"
    
    if [ ${#archivos_para_eliminar[@]} -eq 0 ]; then
        echo -e "${CYAN}ℹ️ No hay archivos para respaldar${NC}"
        return 0
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$TESTING_PATH/backup_optimizacion_$timestamp"
    
    # Crear directorio de backup
    mkdir -p "$backup_dir"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Directorio de backup creado: backup_optimizacion_$timestamp${NC}"
        
        # Copiar archivos al backup
        local archivos_respaldados=0
        for archivo in "${archivos_para_eliminar[@]}"; do
            if cp "$archivo" "$backup_dir/"; then
                ((archivos_respaldados++))
                echo -e "   📄 Respaldado: $(basename "$archivo")"
            else
                echo -e "   ❌ Error respaldando: $(basename "$archivo")"
            fi
        done
        
        echo -e "\n${CYAN}📊 Backup completado: ${archivos_respaldados}/${#archivos_para_eliminar[@]} archivos${NC}"
        return 0
    else
        echo -e "${RED}❌ Error creando directorio de backup${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 4: ELIMINAR ARCHIVOS EXTRA
# ═══════════════════════════════════════════════════════════════════════════════

eliminar_archivos_extra() {
    echo -e "\n${YELLOW}🗑️ PASO 4: Eliminando archivos extra...${NC}"
    echo "──────────────────────────────────────────────────"
    
    if [ ${#archivos_para_eliminar[@]} -eq 0 ]; then
        echo -e "${CYAN}ℹ️ No hay archivos para eliminar${NC}"
        return 0
    fi
    
    local archivos_eliminados=0
    local errores=0
    
    for archivo in "${archivos_para_eliminar[@]}"; do
        if rm "$archivo" 2>/dev/null; then
            ((archivos_eliminados++))
            echo -e "   🗑️ Eliminado: $(basename "$archivo")"
        else
            ((errores++))
            echo -e "   ❌ Error eliminando: $(basename "$archivo")"
        fi
    done
    
    echo -e "\n${CYAN}📊 Eliminación completada:${NC}"
    echo -e "   ✅ Eliminados: $archivos_eliminados"
    echo -e "   ❌ Errores: $errores"
    
    if [ $errores -eq 0 ]; then
        echo -e "${GREEN}✅ Todos los archivos extra fueron eliminados${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Algunos archivos no pudieron ser eliminados${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 5: VERIFICAR OPTIMIZACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

verificar_optimizacion() {
    echo -e "\n${YELLOW}✅ PASO 5: Verificando optimización final...${NC}"
    echo "───────────────────────────────────────────────────────"
    
    # Contar archivos restantes
    local archivos_restantes=$(find "$TESTING_PATH" -maxdepth 1 -type f | wc -l | tr -d ' ')
    local directorios_extra=$(find "$TESTING_PATH" -maxdepth 1 -type d ! -path "$TESTING_PATH" | wc -l | tr -d ' ')
    
    echo -e "${CYAN}📊 Estado final del directorio:${NC}"
    echo -e "   📄 Archivos: $archivos_restantes"
    echo -e "   📁 Directorios extra: $directorios_extra"
    
    # Listar archivos finales
    echo -e "\n${CYAN}📋 Archivos mantenidos:${NC}"
    for archivo in "$TESTING_PATH"/*; do
        if [ -f "$archivo" ]; then
            local tamaño=$(du -h "$archivo" | cut -f1)
            echo -e "   ✅ $(basename "$archivo") (${tamaño})"
        fi
    done
    
    # Verificar que solo tenemos 3 archivos
    if [ "$archivos_restantes" -eq 3 ]; then
        echo -e "\n${GREEN}🎉 OPTIMIZACIÓN PERFECTA: Solo 3 archivos esenciales${NC}"
        return 0
    elif [ "$archivos_restantes" -lt 3 ]; then
        echo -e "\n${RED}🚨 PROBLEMA: Faltan archivos esenciales${NC}"
        return 1
    else
        echo -e "\n${YELLOW}⚠️ OPTIMIZACIÓN PARCIAL: Más de 3 archivos presentes${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN 6: MOSTRAR ESTADÍSTICAS FINALES
# ═══════════════════════════════════════════════════════════════════════════════

mostrar_estadisticas() {
    echo -e "\n${PURPLE}📊 ESTADÍSTICAS FINALES DE OPTIMIZACIÓN${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    
    # Tamaño total del directorio
    local tamaño_total=$(du -sh "$TESTING_PATH" | cut -f1)
    echo -e "${CYAN}💾 Tamaño total del directorio: ${tamaño_total}${NC}"
    
    # Funcionalidades mantenidas
    echo -e "\n${GREEN}🎯 FUNCIONALIDADES MANTENIDAS:${NC}"
    echo -e "   ✅ Suite de pruebas consolidado con datos mock"
    echo -e "   ✅ Evaluación de todos los módulos de la extensión"
    echo -e "   ✅ Script de ejecución automatizada"
    echo -e "   ✅ Sistema de optimización y limpieza"
    
    # Beneficios de la optimización
    echo -e "\n${BLUE}📈 BENEFICIOS DE LA OPTIMIZACIÓN:${NC}"
    echo -e "   🚀 Estructura simplificada y mantenible"
    echo -e "   💾 Reducción del tamaño del proyecto"
    echo -e "   🔧 Testing consolidado en un solo archivo"
    echo -e "   📊 Evaluación exhaustiva con datos mock"
    echo -e "   🛡️ Backup automático de archivos eliminados"
}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    local comando="${1:-optimizar}"
    
    case "$comando" in
        "optimizar" | "-o" | "--optimize")
            if validar_estructura_proyecto && verificar_archivos_esenciales; then
                if identificar_archivos_extra; then
                    echo -e "\n${YELLOW}❓ ¿Deseas continuar con la optimización? (y/N):${NC}"
                    read -r respuesta
                    
                    if [[ "$respuesta" =~ ^[Yy]$ ]]; then
                        crear_backup
                        eliminar_archivos_extra
                        verificar_optimizacion
                        mostrar_estadisticas
                    else
                        echo -e "${YELLOW}ℹ️ Optimización cancelada por el usuario${NC}"
                    fi
                fi
            else
                echo -e "${RED}❌ No se puede proceder: archivos esenciales faltantes${NC}"
                exit 1
            fi
            ;;
        "verificar" | "-v" | "--verify")
            validar_estructura_proyecto
            verificar_archivos_esenciales
            identificar_archivos_extra
            ;;
        "forzar" | "-f" | "--force")
            echo -e "${RED}⚠️ MODO FORZADO: Eliminando sin confirmación${NC}"
            if validar_estructura_proyecto && verificar_archivos_esenciales; then
                if identificar_archivos_extra; then
                    crear_backup
                    eliminar_archivos_extra
                    verificar_optimizacion
                    mostrar_estadisticas
                fi
            fi
            ;;
        "ayuda" | "-h" | "--help")
            echo -e "\n${CYAN}COMANDOS DISPONIBLES:${NC}"
            echo "   optimizar, -o   : Optimizar directorio (con confirmación)"
            echo "   verificar, -v   : Solo verificar estado actual"
            echo "   forzar, -f      : Optimizar sin confirmación"
            echo "   ayuda, -h       : Mostrar esta ayuda"
            echo ""
            echo -e "${YELLOW}💡 RECOMENDADO: $0 optimizar${NC}"
            echo -e "${CYAN}🎯 OBJETIVO: Mantener solo 3 archivos esenciales${NC}"
            ;;
        *)
            echo -e "${RED}❌ Comando no reconocido: $comando${NC}"
            echo -e "${YELLOW}💡 Usa '$0 ayuda' para ver comandos disponibles${NC}"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"

echo ""
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🏁 OPTIMIZADOR DE TESTING COMPLETADO${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"

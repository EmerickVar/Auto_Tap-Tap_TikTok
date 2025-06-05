// Script para ejecutar en la consola del navegador o como userscript
(function() {
    'use strict';
    
    // Variables globales
    let intervalo = null;
    let activo = false;
    let contador = 0;
    
    // Función para presionar L
    function presionarL() {
        const evento = new KeyboardEvent('keydown', {
            key: 'l',
            code: 'KeyL',
            keyCode: 76,
            which: 76,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(evento);
        contador++;
        actualizarContador();
    }
    
    // Crear contenedor para el botón
    const contenedor = document.createElement('div');
    contenedor.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        background: rgba(0, 0, 0, 0.8);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        font-family: Arial, sans-serif;
        cursor: move;
        user-select: none;
    `;
    
    // Variables para el drag
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    // Funciones para hacer draggable
    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
        
        if (e.target === contenedor || e.target === barraArrastre) {
            isDragging = true;
        }
    }
    
    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            setTranslate(currentX, currentY, contenedor);
        }
    }
    
    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
    
    // Crear barra de arrastre
    const barraArrastre = document.createElement('div');
    barraArrastre.style.cssText = `
        width: 100%;
        height: 25px;
        background: rgba(255, 255, 255, 0.1);
        margin: -15px -15px 10px -15px;
        border-radius: 10px 10px 0 0;
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Agregar indicador de arrastre
    const indicadorArrastre = document.createElement('div');
    indicadorArrastre.style.cssText = `
        width: 40px;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
    `;
    barraArrastre.appendChild(indicadorArrastre);
    
    // Crear botón principal
    const boton = document.createElement('button');
    boton.textContent = '❤️ Auto Tap-Tap: OFF';
    boton.style.cssText = `
        background: #ff0050;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
        width: 100%;
        margin-bottom: 10px;
    `;
    
    // Crear selector de intervalo
    const selectorIntervalo = document.createElement('select');
    selectorIntervalo.style.cssText = `
        width: 100%;
        padding: 5px;
        margin-bottom: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
    `;
    
    // Opciones de intervalo
    const intervalos = [
        { valor: 50, texto: 'Cada vigésima de segundo'},
        { valor: 100, texto: 'Cada décima de segundo'},
        { valor: 250, texto: 'Cada cuarto de segundo'},
        { valor: 500, texto: 'Cada medio segundo'},
        { valor: 1000, texto: 'Cada 1 segundo' },
        { valor: 2000, texto: 'Cada 2 segundos' },
        { valor: 3000, texto: 'Cada 3 segundos' },
        { valor: 5000, texto: 'Cada 5 segundos' },
        { valor: 10000, texto: 'Cada 10 segundos' }
    ];
    
    intervalos.forEach(opcion => {
        const opt = document.createElement('option');
        opt.value = opcion.valor;
        opt.textContent = opcion.texto;
        selectorIntervalo.appendChild(opt);
    });
    
    selectorIntervalo.value = 500; // Valor por defecto
    
    // Crear contador
    const contadorDiv = document.createElement('div');
    contadorDiv.style.cssText = `
        color: white;
        text-align: center;
        margin-top: 10px;
        font-size: 14px;
    `;
    contadorDiv.innerHTML = '❤️ Tap-taps dados: <span id="contador-taptaps">0</span>';
    
    // Crear botón de reset
    const botonReset = document.createElement('button');
    botonReset.textContent = '🔄 Reset';
    botonReset.style.cssText = `
        background: #666;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 5px;
        width: 100%;
    `;
    
    // Función para actualizar el contador
    function actualizarContador() {
        const spanContador = document.getElementById('contador-taptaps');
        if (spanContador) {
            spanContador.textContent = contador;
        }
    }
    
    // Función para activar/desactivar
    function toggleAutoTapTap() {
        activo = !activo;
        
        if (activo) {
            const intervaloSeleccionado = parseInt(selectorIntervalo.value);
            boton.textContent = '❤️ Auto Tap-Tap: ON';
            boton.style.background = '#00ff88';
            
            // Ejecutar inmediatamente la primera vez
            presionarL();
            
            // Configurar intervalo
            intervalo = setInterval(presionarL, intervaloSeleccionado);
            
            // Deshabilitar el selector mientras está activo
            selectorIntervalo.disabled = true;
            selectorIntervalo.style.opacity = '0.5';
        } else {
            boton.textContent = '❤️ Auto Tap-Tap: OFF';
            boton.style.background = '#ff0050';
            
            // Detener intervalo
            clearInterval(intervalo);
            
            // Habilitar el selector
            selectorIntervalo.disabled = false;
            selectorIntervalo.style.opacity = '1';
        }
    }
    
    // Event listeners
    boton.addEventListener('click', toggleAutoTapTap);
    
    botonReset.addEventListener('click', function() {
        contador = 0;
        actualizarContador();
    });
    
    // Hover effects
    boton.addEventListener('mouseenter', function() {
        if (!activo) {
            boton.style.background = '#ff3366';
        } else {
            boton.style.background = '#00ffaa';
        }
    });
    
    boton.addEventListener('mouseleave', function() {
        if (!activo) {
            boton.style.background = '#ff0050';
        } else {
            boton.style.background = '#00ff88';
        }
    });
    
    // Crear botón para minimizar/expandir
    const botonMinimizar = document.createElement('button');
    botonMinimizar.textContent = '−';
    botonMinimizar.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: transparent;
        color: white;
        border: 1px solid white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 0;
        padding: 0;
    `;
    
    let minimizado = false;
    const elementosOcultables = [selectorIntervalo, contadorDiv, botonReset];
    
    botonMinimizar.addEventListener('click', function() {
        minimizado = !minimizado;
        if (minimizado) {
            botonMinimizar.textContent = '+';
            elementosOcultables.forEach(el => el.style.display = 'none');
            contenedor.style.padding = '10px';
            barraArrastre.style.margin = '-10px -10px 10px -10px';
        } else {
            botonMinimizar.textContent = '−';
            elementosOcultables.forEach(el => el.style.display = 'block');
            contenedor.style.padding = '15px';
            barraArrastre.style.margin = '-15px -15px 10px -15px';
        }
    });
    
    // Armar el contenedor
    contenedor.appendChild(barraArrastre);
    contenedor.appendChild(botonMinimizar);
    contenedor.appendChild(boton);
    contenedor.appendChild(selectorIntervalo);
    contenedor.appendChild(contadorDiv);
    contenedor.appendChild(botonReset);
    
    // Eventos para drag
    contenedor.addEventListener('touchstart', dragStart, false);
    contenedor.addEventListener('touchend', dragEnd, false);
    contenedor.addEventListener('touchmove', drag, false);
    
    contenedor.addEventListener('mousedown', dragStart, false);
    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('mousemove', drag, false);
    
    // Prevenir que los elementos hijos interfieran con el drag
    [boton, selectorIntervalo, botonReset, botonMinimizar].forEach(elemento => {
        elemento.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
    });
    
    // Esperar a que el DOM esté listo
    function inyectarBoton() {
        if (document.body) {
            document.body.appendChild(contenedor);
        } else {
            setTimeout(inyectarBoton, 100);
        }
    }
    
    // Inyectar el botón
    inyectarBoton();
    
    // Función para limpiar al salir
    window.addEventListener('beforeunload', function() {
        if (intervalo) {
            clearInterval(intervalo);
        }
    });
    
    // Atajo de teclado (Alt + L) para activar/desactivar
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'l') {
            toggleAutoTapTap();
            e.preventDefault();
        }
    });
    
})();

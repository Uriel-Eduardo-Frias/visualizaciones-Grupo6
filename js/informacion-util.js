(function () {
    'use strict';

    var botones = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var tarjetas = Array.prototype.slice.call(document.querySelectorAll('[data-categoria]'));
    var contador = document.getElementById('info-cantidad');

    if (!botones.length || !tarjetas.length) return;

    var validos = botones.map(function (b) { return b.getAttribute('data-filter'); });

    function actualizarContador(n) {
        if (contador) contador.textContent = n + (n === 1 ? ' tema' : ' temas');
    }

    function aplicarFiltro(filtro) {
        if (validos.indexOf(filtro) === -1) filtro = 'todas';
        var visibles = 0;

        tarjetas.forEach(function (tarjeta) {
            var coincide = filtro === 'todas' || tarjeta.getAttribute('data-categoria') === filtro;
            tarjeta.hidden = !coincide;
            if (coincide) visibles++;
        });

        botones.forEach(function (boton) {
            boton.setAttribute('aria-pressed', boton.getAttribute('data-filter') === filtro ? 'true' : 'false');
        });

        actualizarContador(visibles);
    }

    botones.forEach(function (boton) {
        boton.addEventListener('click', function () {
            var filtro = boton.getAttribute('data-filter');
            aplicarFiltro(filtro);
            // Guarda el filtro en la URL sin saltar de posición
            if (window.history && history.replaceState) {
                history.replaceState(null, '', filtro === 'todas' ? location.pathname + location.search : '#' + filtro);
            }
        });
    });

    window.addEventListener('hashchange', function () {
        aplicarFiltro(location.hash.replace('#', ''));
    });

    // Estado inicial (respeta #categoria si viene en la URL)
    aplicarFiltro(location.hash.replace('#', '') || 'todas');
})();
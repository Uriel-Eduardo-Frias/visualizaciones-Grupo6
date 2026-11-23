/* Detalle de un reclamo: lee el número de la URL (?numero=...) y completa la página.
   Usa los mismos datos que las listas (window.Portal), con foto incluida. */
document.addEventListener('DOMContentLoaded', () => {
    const P = window.Portal;
    if (!P) return;

    const $ = id => document.getElementById(id);
    const numero = new URLSearchParams(location.search).get('numero');
    const reclamo = P.todosLosReclamos().find(r => r.numero === numero);

    if (!reclamo) {
        $('detalle-numero').textContent = numero || '';
        $('titulo-reclamo').textContent = 'No encontramos este reclamo';
        $('detalle-fecha').textContent = '';
        $('detalle-descripcion').textContent = 'Es posible que el número sea incorrecto. Volvé a la lista y elegí un reclamo.';
        return;
    }

    const asunto = reclamo.asunto || reclamo.categoria || 'Reclamo';
    const estado = reclamo.estado || 'Recibido';

    $('detalle-numero').textContent = reclamo.numero;
    $('titulo-reclamo').textContent = asunto;
    $('detalle-fecha').textContent = `Presentado el ${P.formatearFechaHora(reclamo.fecha)}`;
    document.title = `${asunto} | Portal Ciudadano`;

    $('detalle-estado').textContent = estado;
    const contenedor = $('contenedor-estado');
    contenedor.classList.remove('derivado', 'resuelto', 'cancelado');
    if (estado.toLowerCase() === 'derivado') contenedor.classList.add('derivado');
    if (estado.toLowerCase() === 'resuelto') contenedor.classList.add('resuelto');
    if (estado.toLowerCase() === 'cancelado') contenedor.classList.add('cancelado');
    const iconoEstado = contenedor.querySelector('.icono-estado');
    if (iconoEstado) iconoEstado.textContent = estado.toLowerCase() === 'cancelado' ? '✕' : '✓';

    $('detalle-categoria').textContent = reclamo.categoria || 'Sin categoría';
    $('detalle-area').textContent = P.areaDe(reclamo.categoria);

    const ubicacion = [reclamo.direccion, reclamo.barrio, reclamo.localidad].filter(Boolean).join(', ');
    $('detalle-direccion').textContent = ubicacion || 'Ubicación no especificada';
    $('detalle-descripcion').textContent = reclamo.detalle || 'El vecino no agregó una descripción.';

    // Foto del problema
    const foto = reclamo.fotoData || reclamo.fotoUrl;
    const textoFoto = $('detalle-foto');

    // Si el HTML no trae el recuadro de la foto, se crea acá (no depende de foto-reclamo.css)
    let figura = $('detalle-foto-figura');
    let imagen = $('detalle-foto-img');
    if (!figura && textoFoto) {
        figura = document.createElement('figure');
        figura.id = 'detalle-foto-figura';
        figura.hidden = true;
        figura.style.cssText = 'width:100%;margin:0;';
        imagen = document.createElement('img');
        imagen.id = 'detalle-foto-img';
        figura.appendChild(imagen);
        textoFoto.insertAdjacentElement('afterend', figura);
    }
    if (imagen) {
        imagen.style.cssText = 'display:block;width:auto;height:auto;max-width:100%;max-height:480px;' +
            'border:1px solid #dfe7e2;border-radius:12px;background:#eaf1ec;';
    }

    if (foto && figura && textoFoto) {
        // Las fotos de ejemplo se buscan en img/reclamos/ y, si no están ahí, directamente en img/
        const candidatas = [foto];
        if (!reclamo.fotoData && foto.includes('/img/reclamos/')) candidatas.push(foto.replace('/img/reclamos/', '/img/'));

        imagen.alt = `Foto del problema: ${asunto}`;
        imagen.onload = () => { figura.hidden = false; textoFoto.hidden = true; };
        imagen.onerror = () => {
            candidatas.shift();
            if (candidatas.length) {
                imagen.src = candidatas[0];
                return;
            }
            figura.hidden = true;
            textoFoto.hidden = false;
            textoFoto.textContent = reclamo.fotoData
                ? 'No se pudo mostrar la foto de este reclamo.'
                : `No se pudo cargar la imagen. Buscamos "${foto}" y "${foto.replace('/img/reclamos/', '/img/')}": revisá que el archivo esté en la carpeta img, junto a css, js y html.`;
        };
        imagen.src = candidatas[0];
    } else if (reclamo.foto && textoFoto) {
        textoFoto.textContent = `Se adjuntó el archivo "${reclamo.foto}", pero la imagen no quedó guardada. Los reclamos nuevos sí guardan la foto.`;
    }

    const usuario = P.usuarioActual();
    const estadoMinusculas = estado.toLowerCase();
    const botonCancelar = $('btn-cancelar-reclamo');
    const dialogo = $('dialogo-cancelar');
    const aviso = $('aviso-cancelado');
    const puedeCancelar = Boolean(usuario) && reclamo.autor === usuario.documento &&
        estadoMinusculas !== 'resuelto' && estadoMinusculas !== 'cancelado';

    if (aviso && new URLSearchParams(location.search).get('cancelado') === '1' && estadoMinusculas === 'cancelado') {
        aviso.hidden = false;
    }

    if (botonCancelar && dialogo && puedeCancelar) {
        botonCancelar.hidden = false;
        $('dialogo-numero').textContent = reclamo.numero;
        botonCancelar.addEventListener('click', () => dialogo.showModal());
        $('cancelar-no').addEventListener('click', () => dialogo.close());
        $('cancelar-si').addEventListener('click', () => {
            if (P.cancelarReclamo(usuario.documento, reclamo.numero)) {
                const destino = new URL(location.href);
                destino.searchParams.set('cancelado', '1');
                location.href = destino.href;
                return;
            }
            dialogo.close();
            $('cancelar-error').hidden = false;
        });
    }
    const botonApoyar = $('btn-apoyar');
    const textoApoyos = $('apoyos-detalle');
    const esPropio = Boolean(usuario) && reclamo.autor === usuario.documento;
    const estaAbierto = estadoMinusculas !== 'resuelto' && estadoMinusculas !== 'cancelado';

    const actualizarApoyos = () => {
        if (!textoApoyos) return;
        const cantidad = P.cantidadApoyos(reclamo);
        textoApoyos.textContent = `${cantidad} ${cantidad === 1 ? 'vecino apoya' : 'vecinos apoyan'} este reclamo`;
    };
    actualizarApoyos();
    document.addEventListener('portal:adhesion', actualizarApoyos);

    if (botonApoyar && usuario && !esPropio && estaAbierto) {
        botonApoyar.dataset.sumarme = reclamo.numero;
        P.pintarSumarme(botonApoyar, P.estaAdherido(usuario.documento, reclamo.numero));
        botonApoyar.hidden = false;
    }

    if (new URLSearchParams(location.search).get('desde') === 'reclamos') {
        const volver = document.querySelector('.volver-a-mis-2');
        if (volver) {
            volver.href = 'reclamos2.html';
            const texto = volver.querySelector('.text-wrapper-18');
            if (texto) texto.textContent = 'Volver a reclamos';
        }
    }

    window.addEventListener('pageshow', evento => {
        if (evento.persisted) location.reload();
    });
});
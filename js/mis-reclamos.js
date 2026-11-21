/* Lista de reclamos. Sirve para dos pantallas:
   - Pública (reclamos.html / reclamos2.html): todos los reclamos, con botón "Sumarme".
   - Personal (mis-reclamos2.html, tbody con data-modo="mis"): los que hice y a los que me sumé. */
document.addEventListener('DOMContentLoaded', () => {
    const P = window.Portal;
    const lista = document.getElementById('lista-reclamos');
    if (!P || !lista) return;

    const modo = lista.dataset.modo === 'mis' ? 'mis' : 'publica';
    const usuario = P.usuarioActual();
    const columnas = lista.closest('table').querySelectorAll('thead th').length;
    const buscador = document.getElementById('buscar-reclamo');
    const resumen = document.getElementById('resumen-resultados');
    const selectEstado = document.getElementById('filtro-estado');
    const selectCategoria = document.getElementById('filtro-categoria');

    const filtros = { participacion: 'todos', estado: 'todos', categoria: 'todas', texto: '' };

    const obtenerReclamos = () => {
        if (modo === 'mis') return usuario ? P.reclamosDelUsuario(usuario.documento) : [];
        return P.todosLosReclamos();
    };

    /* ---------- Construcción de filas ---------- */
    const celda = (texto, clase) => {
        const td = document.createElement('td');
        if (clase) td.className = clase;
        td.textContent = texto;
        return td;
    };

    function celdaEstado(reclamo) {
        const td = document.createElement('td');
        const badge = document.createElement('span');
        const nombre = reclamo.estado || 'Recibido';
        const clases = { 'recibido': 'badge-recibido', 'en proceso': 'badge-proceso', 'derivado': 'badge-derivado', 'resuelto': 'badge-resuelto' };
        badge.className = `badge ${clases[nombre.toLowerCase()] || ''}`.trim();
        badge.textContent = nombre;
        td.appendChild(badge);
        return td;
    }

    function celdaParticipacion(reclamo) {
        const td = document.createElement('td');
        const etiqueta = document.createElement('span');
        const propio = reclamo.participacion === 'propio';
        etiqueta.className = `tag-part ${propio ? 'tag-propio' : 'tag-adherido'}`;
        etiqueta.textContent = propio ? 'Lo hice yo' : 'Me sumé';
        td.appendChild(etiqueta);
        return td;
    }

    function celdaArea(reclamo) {
        const td = document.createElement('td');
        const contenedor = document.createElement('div');
        contenedor.className = 'area-cell';

        const icono = document.createElement('span');
        icono.className = 'area-icon';
        if (reclamo.fotoUrl) {
            const imagen = document.createElement('img');
            imagen.src = reclamo.fotoUrl;
            imagen.alt = '';
            imagen.addEventListener('error', () => icono.removeChild(imagen));
            icono.appendChild(imagen);
        }

        const texto = document.createElement('span');
        texto.textContent = P.areaDe(reclamo.categoria);
        contenedor.append(icono, texto);
        td.appendChild(contenedor);
        return td;
    }

    function celdaCategoria(reclamo) {
        const td = document.createElement('td');
        const etiqueta = document.createElement('span');
        etiqueta.className = 'category-pill';
        etiqueta.textContent = reclamo.categoria || 'Sin categoría';
        td.appendChild(etiqueta);
        return td;
    }

    function celdaApoyos(reclamo) {
        const td = document.createElement('td');
        const contenedor = document.createElement('div');
        contenedor.className = 'apoyos';

        const cantidad = document.createElement('span');
        cantidad.className = 'apoyos-cant';
        cantidad.dataset.cant = reclamo.numero;
        cantidad.textContent = P.cantidadApoyos(reclamo);
        contenedor.appendChild(cantidad);

        if (usuario && reclamo.autor === usuario.documento) {
            const propio = document.createElement('span');
            propio.className = 'apoyos-propio';
            propio.textContent = 'Tu reclamo';
            contenedor.appendChild(propio);
        } else if (usuario) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'btn-outline-sm';
            boton.dataset.sumarme = reclamo.numero;
            P.pintarSumarme(boton, P.estaAdherido(usuario.documento, reclamo.numero));
            contenedor.appendChild(boton);
        } else {
            const enlace = document.createElement('a');
            enlace.className = 'btn-outline-sm';
            enlace.href = 'login.html?next=reclamos2.html';
            enlace.textContent = 'Sumarme';
            contenedor.appendChild(enlace);
        }

        td.appendChild(contenedor);
        return td;
    }

    function crearFila(reclamo) {
        const fila = document.createElement('tr');
        const asunto = String(reclamo.asunto || reclamo.categoria || '').trim();
        const celdas = [
            celda(asunto, 'item-title'),
        ];

        if (modo === 'mis') {
            celdas.push(celda(reclamo.categoria || 'Sin categoría'));
            celdas.push(celda(P.formatearFecha(reclamo.fecha, { day: 'numeric', month: 'short' })));
            celdas.push(celdaEstado(reclamo));
            celdas.push(celdaParticipacion(reclamo));
        } else {
            celdas.push(celdaArea(reclamo));
            celdas.push(celdaCategoria(reclamo));
            celdas.push(celda(P.formatearFecha(reclamo.fecha, { day: 'numeric', month: 'short' })));
            celdas.push(celdaEstado(reclamo));
            celdas.push(celda(P.nombreSolicitante(reclamo)));
            if (columnas >= 7) celdas.push(celdaApoyos(reclamo));
        }

        const tdAccion = document.createElement('td');
        tdAccion.className = 'action';
        const enlace = document.createElement('a');
        enlace.className = 'link-ver';
        enlace.href = `detalles-reclamo.html?numero=${encodeURIComponent(reclamo.numero)}`;
        enlace.textContent = 'Ver ›';
        tdAccion.appendChild(enlace);
        celdas.push(tdAccion);

        fila.append(...celdas);
        return fila;
    }

    function filaVacia(hayReclamos) {
        const fila = document.createElement('tr');
        const td = document.createElement('td');
        td.className = 'estado-vacio';
        td.colSpan = columnas;

        if (hayReclamos) {
            td.innerHTML = '<p>Ningún reclamo coincide con los filtros elegidos.</p>' +
                '<button type="button" class="btn o s" data-limpiar-filtros>Limpiar filtros</button>';
        } else if (modo === 'mis') {
            td.innerHTML = '<p>Todavía no hiciste ni te sumaste a ningún reclamo.</p>' +
                '<a class="btn s" href="nuevo-reclamo2.html">Hacer un reclamo</a> ' +
                '<a class="btn o s" href="reclamos2.html">Ver reclamos de otros vecinos</a>';
        } else {
            td.innerHTML = '<p>Todavía no hay reclamos para mostrar.</p>';
        }

        fila.appendChild(td);
        return fila;
    }

    /* ---------- Filtrado y render ---------- */
    function coincide(reclamo) {
        const estado = (reclamo.estado || 'Recibido').toLowerCase();
        const texto = `${reclamo.asunto || ''} ${reclamo.categoria || ''}`.toLowerCase();

        if (filtros.participacion !== 'todos' && reclamo.participacion !== filtros.participacion) return false;
        if (filtros.categoria !== 'todas' && (reclamo.categoria || '').toLowerCase() !== filtros.categoria) return false;
        if (filtros.texto && !texto.includes(filtros.texto)) return false;

        if (filtros.estado === 'activos') return estado !== 'resuelto';
        if (filtros.estado === 'resueltos') return estado === 'resuelto';
        if (filtros.estado !== 'todos') return estado === filtros.estado;
        return true;
    }

    function render() {
        const todos = obtenerReclamos();
        const visibles = todos.filter(coincide);

        lista.replaceChildren(...visibles.map(crearFila));
        if (!visibles.length) lista.appendChild(filaVacia(todos.length > 0));

        if (resumen) {
            resumen.textContent = todos.length
                ? `Mostrando ${visibles.length} de ${todos.length} ${todos.length === 1 ? 'reclamo' : 'reclamos'}`
                : '';
        }
    }

    function limpiarFiltros() {
        Object.assign(filtros, { participacion: 'todos', estado: 'todos', categoria: 'todas', texto: '' });
        if (selectEstado) selectEstado.value = 'todos';
        if (selectCategoria) selectCategoria.value = 'todas';
        if (buscador) buscador.value = '';
        document.querySelectorAll('.filter-pills .pill').forEach((boton, i) => marcarPill(boton, i === 0));
        render();
    }

    function marcarPill(boton, activo) {
        const atributo = boton.hasAttribute('aria-pressed') ? 'aria-pressed' : 'aria-selected';
        boton.classList.toggle('active', activo);
        boton.setAttribute(atributo, String(activo));
    }

    /* ---------- Eventos ---------- */
    document.querySelectorAll('.filter-pills .pill').forEach(boton => {
        boton.addEventListener('click', () => {
            boton.parentElement.querySelectorAll('.pill').forEach(otro => marcarPill(otro, otro === boton));
            if (boton.dataset.participacion) filtros.participacion = boton.dataset.participacion;
            else filtros.estado = boton.textContent.trim().toLowerCase();
            render();
        });
    });

    if (selectEstado) selectEstado.addEventListener('change', () => { filtros.estado = selectEstado.value; render(); });
    if (selectCategoria) selectCategoria.addEventListener('change', () => { filtros.categoria = selectCategoria.value; render(); });
    if (buscador) buscador.addEventListener('input', () => { filtros.texto = buscador.value.trim().toLowerCase(); render(); });

    lista.addEventListener('click', evento => {
        if (evento.target.closest('[data-limpiar-filtros]')) limpiarFiltros();
    });

    // Al sumarse o quitarse, solo se actualiza el contador (no se redibuja, para no perder el foco del botón)
    document.addEventListener('portal:adhesion', evento => {
        const reclamo = P.todosLosReclamos().find(r => r.numero === evento.detail.numero);
        const contador = lista.querySelector(`[data-cant="${CSS.escape(evento.detail.numero)}"]`);
        if (reclamo && contador) contador.textContent = P.cantidadApoyos(reclamo);
    });

    render();
});
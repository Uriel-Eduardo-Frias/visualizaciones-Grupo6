
document.addEventListener('DOMContentLoaded', () => {

    const lista = document.getElementById('lista-reclamos');

    // Reclamos de demostración
    const reclamosDemo = [
        {
            numero: 'DEMO001',
            asunto: 'Luminaria apagada',
            categoria: 'Alumbrado',
            fecha: '2026-10-28',
            estado: 'En proceso'
        },
        {
            numero: 'DEMO002',
            asunto: 'Bache en la calzada',
            categoria: 'Calles y baches',
            fecha: '2026-10-25',
            estado: 'Derivado'
        },
        {
            numero: 'DEMO003',
            asunto: 'Poda de árbol',
            categoria: 'Arbolado',
            fecha: '2026-11-02',
            estado: 'Recibido'
        },
        {
            numero: 'DEMO004',
            asunto: 'Recolección de residuos',
            categoria: 'Limpieza',
            fecha: '2026-10-12',
            estado: 'Resuelto'
        }
    ];

    // Recuperar reclamos del usuario
    let reclamos = JSON.parse(
        localStorage.getItem('misReclamos') || '[]'
    );

    // Asignar número y estado a reclamos antiguos
    let huboCambios = false;

    reclamos.forEach((reclamo, index) => {

        if (!reclamo.numero) {
            reclamo.numero = `RC-${Date.now()}-${index}`;
            huboCambios = true;
        }

        if (!reclamo.estado) {
            reclamo.estado = 'Recibido';
            huboCambios = true;
        }

    });

    // Guardar modificaciones
    if (huboCambios) {
        localStorage.setItem('misReclamos', JSON.stringify(reclamos));
    }

    // Mostrar reclamos de demostración
    reclamosDemo.forEach(reclamo => {
        lista.appendChild(crearFila(reclamo));
    });

    // Mostrar reclamos del usuario
    reclamos.forEach(reclamo => {
        lista.prepend(crearFila(reclamo));
    });


    // Buscador y filtros
    const botones = document.querySelectorAll('.filter-pills .pill');
    const buscador = document.getElementById('buscar-reclamo');

    function aplicarFiltros() {

        const botonActivo = document.querySelector(
            '.filter-pills .pill.active'
        );

        const filtroActivo = botonActivo
            ? botonActivo.textContent.trim().toLowerCase()
            : 'todos';

        const busqueda = buscador
            ? buscador.value.trim().toLowerCase()
            : '';

        const filas = lista.querySelectorAll('tr');

        filas.forEach(fila => {

            const asunto = fila.cells[0].textContent.toLowerCase();
            const categoria = fila.cells[1].textContent.toLowerCase();

            const estado = fila.querySelector('.badge')
                ?.textContent.trim().toLowerCase() || '';

            const coincideBusqueda =
                asunto.includes(busqueda) ||
                categoria.includes(busqueda);

            let coincideEstado = true;

            if (filtroActivo === 'activos') {
                coincideEstado = estado !== 'resuelto';
            }

            if (filtroActivo === 'resueltos') {
                coincideEstado = estado === 'resuelto';
            }

            fila.style.display =
                coincideBusqueda && coincideEstado ? '' : 'none';
        });
    }

    // Eventos de los botones
    botones.forEach(boton => {

        boton.addEventListener('click', () => {

            botones.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });

            boton.classList.add('active');
            boton.setAttribute('aria-selected', 'true');

            aplicarFiltros();
        });

    });

    // Evento del buscador
    if (buscador) {
        buscador.addEventListener('input', aplicarFiltros);
    }


    // Función para crear una fila
    function crearFila(reclamo) {

        const fila = document.createElement('tr');

        // Asunto
        const tdReclamo = document.createElement('td');
        tdReclamo.className = 'item-title';
        tdReclamo.textContent = reclamo.asunto || reclamo.categoria;

        // Categoría
        const tdArea = document.createElement('td');
        tdArea.textContent = reclamo.categoria || 'Sin categoría';

        // Fecha
        const tdFecha = document.createElement('td');

        const fecha = new Date(reclamo.fecha);

        tdFecha.textContent = !isNaN(fecha)
            ? fecha.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC'
            })
            : 'Sin fecha';

        // Estado
        const tdEstado = document.createElement('td');
        const badge = document.createElement('span');

        const estado = (reclamo.estado || 'Recibido').toLowerCase();

        badge.className = 'badge';

        if (estado === 'recibido') {
            badge.classList.add('badge-recibido');
        } else if (estado === 'en proceso') {
            badge.classList.add('badge-proceso');
        } else if (estado === 'derivado') {
            badge.classList.add('badge-derivado');
        } else if (estado === 'resuelto') {
            badge.classList.add('badge-resuelto');
        }

        badge.textContent = reclamo.estado || 'Recibido';

        tdEstado.appendChild(badge);

        // Acción
        const tdAccion = document.createElement('td');
        tdAccion.className = 'action';

        const enlace = document.createElement('a');

        enlace.href = `detalles-reclamo.html?numero=${encodeURIComponent(reclamo.numero)}`;
        enlace.className = 'link-ver';
        enlace.textContent = 'Ver ›';

        tdAccion.appendChild(enlace);

        // Agregar celdas a la fila
        fila.append(
            tdReclamo,
            tdArea,
            tdFecha,
            tdEstado,
            tdAccion
        );

        return fila;
    }

});


document.addEventListener('DOMContentLoaded', () => {

    const parametros = new URLSearchParams(window.location.search);
    const numero = parametros.get('numero');

    // Reclamos de demostración
    const reclamosDemo = [
        {
            numero: 'DEMO001',
            estado: 'En proceso',
            fecha: '2026-10-28'
        },
        {
            numero: 'DEMO002',
            estado: 'Derivado',
            fecha: '2026-10-25'
        },
        {
            numero: 'DEMO003',
            estado: 'Recibido',
            fecha: '2026-11-02'
        },
        {
            numero: 'DEMO004',
            estado: 'Resuelto',
            fecha: '2026-10-12'
        }
    ];

    // Recuperar reclamos del usuario
    const reclamos = JSON.parse(
        localStorage.getItem('misReclamos') || '[]'
    );

    // Buscar en ambos lugares
    const reclamo =
        reclamos.find(r => r.numero === numero) ||
        reclamosDemo.find(r => r.numero === numero);

    const contenedor = document.getElementById('seguimiento-lista');
    const ultimaActualizacion = document.getElementById('ultima-actualizacion');

    if (!contenedor) return;

    if (!reclamo) {
        contenedor.innerHTML = '<p>Reclamo no encontrado.</p>';
        return;
    }

    // Etapas posibles del reclamo
    const etapas = [
        {
            nombre: 'Recibido',
            descripcion: 'El municipio recibió tu reclamo.'
        },
        {
            nombre: 'Derivado',
            descripcion: 'El reclamo fue enviado al área responsable.'
        },
        {
            nombre: 'En proceso',
            descripcion: 'El área responsable está trabajando en el problema.'
        },
        {
            nombre: 'Resuelto',
            descripcion: 'El problema fue solucionado.'
        }
    ];

    // Determinar qué etapa está activa
    const estados = {
        'recibido': 0,
        'derivado': 1,
        'en proceso': 2,
        'resuelto': 3
    };

    const estadoActual = (reclamo.estado || 'Recibido')
        .trim()
        .toLowerCase();

    const indiceActual = estados[estadoActual];

    if (indiceActual === undefined) {
        contenedor.innerHTML = '<p>Estado de seguimiento no disponible.</p>';
        return;
    }

    // Formatear fecha
    const fecha = reclamo.fecha ? new Date(reclamo.fecha) : null;

    const fechaTexto = fecha && !isNaN(fecha)
        ? fecha.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        })
        : 'Fecha no disponible';

    // Construir visualmente las etapas
    contenedor.innerHTML = etapas.map((etapa, indice) => {

        const completada = indice < indiceActual;
        const actual = indice === indiceActual;
        const pendiente = indice > indiceActual;

        let indicador = '';
        let contenidoClase = 'detalle-de-resuelto';
        let fechaEtapa = 'Pendiente';
        let etiqueta = '';

        if (completada) {

            indicador = `
                <div class="indicador-y" aria-hidden="true">
                    <span class="estado-complete">
                        <span aria-hidden="true">✓</span>
                    </span>
                    ${indice < etapas.length - 1
                        ? '<span class="div-7"></span>'
                        : ''}
                </div>`;

            fechaEtapa = indice === 0 ? fechaTexto : 'Etapa completada';
            contenidoClase = 'div-8';

        } else if (actual) {

            indicador = `
                <div class="indicador-y" aria-hidden="true">
                    <span class="estado-complete">
                        <span aria-hidden="true">✓</span>
                    </span>
                    ${indice < etapas.length - 1
                        ? '<span class="div-7"></span>'
                        : ''}
                </div>`;

            contenidoClase = 'detalle-de-en';
            fechaEtapa = indice === 0 ? fechaTexto : 'Estado actual';

            etiqueta = `
                <span class="etapa-actual">
                    <span class="text-wrapper-17">Actual</span>
                </span>`;

        } else if (pendiente) {

            indicador = `
                <div class="indicador-y" aria-hidden="true">
                    <span class="estado-pending"></span>
                    ${indice < etapas.length - 1
                        ? '<span class="div-7"></span>'
                        : ''}
                </div>`;
        }

        return `
            <div class="div-6" role="listitem">
                ${indicador}

                <div class="${contenidoClase}">
                    <div class="etapa">
                        <span class="${actual ? 'text-wrapper-16' : 'text-wrapper-14'}">
                            ${etapa.nombre}
                        </span>
                        ${etiqueta}
                    </div>

                    <span class="text-wrapper-15">${fechaEtapa}</span>
                    <p class="text-wrapper-12">${etapa.descripcion}</p>
                </div>
            </div>
        `;

    }).join('');

    if (ultimaActualizacion) {
        ultimaActualizacion.textContent =
            `Estado actual: ${reclamo.estado || 'Recibido'}`;
    }

});

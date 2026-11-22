/* Línea de seguimiento del reclamo (Recibido → Derivado → En proceso → Resuelto).
   Usa las fechas de cada etapa (reclamo.historial) cuando existen. */
document.addEventListener('DOMContentLoaded', () => {
    const P = window.Portal;
    const contenedor = document.getElementById('seguimiento-lista');
    const ultimaActualizacion = document.getElementById('ultima-actualizacion');
    if (!P || !contenedor) return;

    const numero = new URLSearchParams(location.search).get('numero');
    const reclamo = P.todosLosReclamos().find(r => r.numero === numero);

    if (!reclamo) {
        contenedor.innerHTML = '<p>Reclamo no encontrado.</p>';
        return;
    }

    let etapas = [
        { nombre: 'Recibido', descripcion: 'El municipio recibió tu reclamo.' },
        { nombre: 'Derivado', descripcion: 'El reclamo fue enviado al área responsable.' },
        { nombre: 'En proceso', descripcion: 'El área responsable está trabajando en el problema.' },
        { nombre: 'Resuelto', descripcion: 'El problema fue solucionado.' },
    ];

    const indices = { 'recibido': 0, 'derivado': 1, 'en proceso': 2, 'resuelto': 3 };
    const estadoActual = (reclamo.estado || 'Recibido').trim().toLowerCase();
    let indiceActual = indices[estadoActual];

    if (estadoActual === 'cancelado') {
        const previo = reclamo.historial || {};
        etapas = etapas.filter((etapa, i) => i === 0 || previo[etapa.nombre.toLowerCase()]);
        etapas.push({ nombre: 'Cancelado', descripcion: 'El vecino canceló este reclamo.' });
        indiceActual = etapas.length - 1;
    }

    if (indiceActual === undefined) {
        contenedor.innerHTML = '<p>Estado de seguimiento no disponible.</p>';
        return;
    }

    const historial = reclamo.historial || {};
    let ultimaFecha = reclamo.fecha;

    contenedor.innerHTML = etapas.map((etapa, indice) => {
        const completada = indice < indiceActual;
        const actual = indice === indiceActual;
        const conector = indice < etapas.length - 1 ? '<span class="div-7"></span>' : '';

        const iso = historial[etapa.nombre.toLowerCase()] || (indice === 0 ? reclamo.fecha : '');
        if (iso && (completada || actual)) ultimaFecha = iso;

        let fechaEtapa = 'Pendiente';
        if (completada || actual) {
            fechaEtapa = iso ? P.formatearFechaHora(iso) : (actual ? 'Estado actual' : 'Etapa completada');
        }

        const indicador = (completada || actual)
            ? `<div class="indicador-y" aria-hidden="true"><span class="estado-complete"><span aria-hidden="true">✓</span></span>${conector}</div>`
            : `<div class="indicador-y" aria-hidden="true"><span class="estado-pending"></span>${conector}</div>`;

        const clase = completada ? 'div-8' : actual ? 'detalle-de-en' : 'detalle-de-resuelto';
        const etiqueta = actual ? '<span class="etapa-actual"><span class="text-wrapper-17">Actual</span></span>' : '';

        return `
            <div class="div-6" role="listitem">
                ${indicador}
                <div class="${clase}">
                    <div class="etapa">
                        <span class="${actual ? 'text-wrapper-16' : 'text-wrapper-14'}">${etapa.nombre}</span>
                        ${etiqueta}
                    </div>
                    <span class="text-wrapper-15">${fechaEtapa}</span>
                    <p class="text-wrapper-12">${etapa.descripcion}</p>
                </div>
            </div>`;
    }).join('');

    if (ultimaActualizacion) {
        ultimaActualizacion.textContent = `Última actualización: ${P.formatearFechaHora(ultimaFecha)}`;
    }
});
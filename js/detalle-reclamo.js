
document.addEventListener('DOMContentLoaded', () => {

    // Obtener el número desde la URL
    const parametros = new URLSearchParams(window.location.search);
    const numero = parametros.get('numero');

    // Reclamos de demostración
    const reclamosDemo = [
        {
            numero: 'DEMO001',
            asunto: 'Luminaria apagada',
            categoria: 'Alumbrado',
            fecha: '2026-10-28',
            estado: 'En proceso',
            direccion: 'Av. Crovara 1200, La Matanza',
            detalle: 'La luminaria de la calle no funciona durante la noche.',
            foto: ''
        },
        {
            numero: 'DEMO002',
            asunto: 'Bache en la calzada',
            categoria: 'Calles y baches',
            fecha: '2026-10-25',
            estado: 'Derivado',
            direccion: 'Av. General Paz 1500, La Matanza',
            detalle: 'Hay un bache de gran tamaño que dificulta la circulación de vehículos.',
            foto: ''
        },
        {
            numero: 'DEMO003',
            asunto: 'Poda de árbol',
            categoria: 'Arbolado',
            fecha: '2026-11-02',
            estado: 'Recibido',
            direccion: 'Calle San Martín 450, La Matanza',
            detalle: 'Las ramas del árbol sobresalen sobre la vereda y dificultan el paso.',
            foto: ''
        },
        {
            numero: 'DEMO004',
            asunto: 'Recolección de residuos',
            categoria: 'Limpieza',
            fecha: '2026-10-12',
            estado: 'Resuelto',
            direccion: 'Calle Belgrano 800, La Matanza',
            detalle: 'Los residuos permanecieron varios días sin ser recolectados.',
            foto: ''
        }
    ];

    // Recuperar reclamos del usuario
    const reclamosUsuario = JSON.parse(
        localStorage.getItem('misReclamos') || '[]'
    );

    // Buscar primero en los reclamos del usuario y después en los de demostración
    const reclamo =
        reclamosUsuario.find(r => r.numero === numero) ||
        reclamosDemo.find(r => r.numero === numero);

    // Si no existe, mostrar un mensaje
    if (!reclamo) {
        document.getElementById('contenido-principal').innerHTML = `
            <section class="presentacin-del">
                <h1 class="text-wrapper-3">Reclamo no encontrado</h1>
                <p>No pudimos encontrar la información de este reclamo.</p>
                <a href="mis-reclamos2.html">Volver a mis reclamos</a>
            </section>
        `;
        return;
    }

    // Formatear fecha
    const fecha = new Date(reclamo.fecha);

    const fechaFormateada = !isNaN(fecha)
        ? fecha.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        })
        : 'Sin fecha';

    // Completar los datos
    document.getElementById('detalle-numero').textContent =
        reclamo.numero || 'Sin número';

    document.getElementById('titulo-reclamo').textContent =
        reclamo.asunto || reclamo.categoria;

    document.getElementById('detalle-fecha').textContent =
        'Presentado el ' + fechaFormateada;

    actualizarEstadoVisual(reclamo.estado || 'Recibido');

    document.getElementById('detalle-categoria').textContent =
        reclamo.categoria || 'Sin categoría';

    document.getElementById('detalle-area').textContent =
        reclamo.categoria || 'Sin asignar';

    document.getElementById('detalle-direccion').textContent =
        reclamo.direccion || 'Sin dirección';

    document.getElementById('detalle-descripcion').textContent =
        reclamo.detalle || 'No se agregó una descripción.';

    document.getElementById('detalle-foto').textContent =
        reclamo.foto
            ? 'Archivo adjunto: ' + reclamo.foto
            : 'No se adjuntó una fotografía a este reclamo.';

});


function actualizarEstadoVisual(estado) {

    const contenedor = document.getElementById('contenedor-estado');
    const texto = document.getElementById('detalle-estado');
    const icono = contenedor?.querySelector('.icono-estado');

    if (!contenedor || !texto || !icono) return;

    const estados = {
        'recibido': {
            clase: 'recibido',
            icono: '✓'
        },
        'derivado': {
            clase: 'derivado',
            icono: '◷'
        },
        'en proceso': {
            clase: 'en-proceso',
            icono: '◷'
        },
        'resuelto': {
            clase: 'resuelto',
            icono: '✓'
        }
    };

    const normalizado = (estado || 'Recibido').trim().toLowerCase();
    const configuracion = estados[normalizado];

    if (!configuracion) return;

    contenedor.className = 'estado-etiqueta ' + configuracion.clase;

    texto.textContent = estado;
    icono.textContent = configuracion.icono;

    contenedor.setAttribute('aria-label', 'Estado actual: ' + estado);
}
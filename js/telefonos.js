document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.tel-item, .franja-tel');
    if (!items.length) return;

    const esTactil = window.matchMedia('(pointer: coarse)').matches;
    if (esTactil) return;

    const aviso = document.createElement('div');
    aviso.className = 'tel-aviso';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    aviso.hidden = true;
    document.body.appendChild(aviso);

    let temporizador;

    const mostrar = (numero, nombre, copiado) => {
        aviso.textContent = copiado
            ? `Llamá al ${numero} (${nombre}) desde tu celular. Copiamos el número para que lo uses.`
            : `Llamá al ${numero} (${nombre}) desde tu celular.`;
        aviso.hidden = false;
        clearTimeout(temporizador);
        temporizador = setTimeout(() => { aviso.hidden = true; }, 5000);
    };

    items.forEach(item => {
        item.addEventListener('click', evento => {
            evento.preventDefault();
            const numero = item.dataset.numero || item.querySelector('.tel-num').textContent.trim();
            const nombre = item.dataset.nombre || item.querySelector('.tel-nombre').textContent.trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(numero)
                    .then(() => mostrar(numero, nombre, true))
                    .catch(() => mostrar(numero, nombre, false));
            } else {
                mostrar(numero, nombre, false);
            }
        });
    });
});

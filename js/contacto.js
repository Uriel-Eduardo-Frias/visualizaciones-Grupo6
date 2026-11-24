document.querySelectorAll('[data-contact-form]').forEach(form => {
    const fields = form.querySelectorAll('input, textarea');

    function updateValidationState() {
        fields.forEach(field => {
            const invalid = !field.validity.valid;
            const container = field.closest('.campo');

            field.setAttribute('aria-invalid', String(invalid));
            container.classList.toggle('is-invalid', invalid);
        });
    }

    form.addEventListener('invalid', () => {
        form.classList.add('was-validated');
        updateValidationState();
    }, true);

    form.addEventListener('input', () => {
        if (form.classList.contains('was-validated')) {
            updateValidationState();
        }
    });
});

document.querySelectorAll('[data-contact-form]').forEach(form => {
    const descripcion = document.querySelector('.contenedor .descripcion');
    const confirmacion = document.createElement('section');
    confirmacion.className = 'consulta-enviada';
    confirmacion.hidden = true;
    confirmacion.setAttribute('role', 'status');

    const icono = document.createElement('div');
    icono.className = 'consulta-enviada-icono';
    icono.setAttribute('aria-hidden', 'true');
    icono.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

    const titulo = document.createElement('h2');
    titulo.tabIndex = -1;
    titulo.textContent = '¡Recibimos tu consulta!';

    const texto = document.createElement('p');

    const otra = document.createElement('button');
    otra.type = 'button';
    otra.className = 'consulta-enviada-otra';
    otra.textContent = 'Enviar otra consulta';

    confirmacion.append(icono, titulo, texto, otra);
    form.after(confirmacion);

    form.addEventListener('submit', evento => {
        evento.preventDefault();
        const nombre = form.elements.nombre.value.trim();
        const email = form.elements.email.value.trim();
        texto.textContent = `Gracias, ${nombre}. Vamos a responderte a ${email} a la brevedad.`;
        form.hidden = true;
        if (descripcion) descripcion.hidden = true;
        confirmacion.hidden = false;
        titulo.focus();
        confirmacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    otra.addEventListener('click', () => {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.campo').forEach(campo => campo.classList.remove('is-invalid'));
        form.querySelectorAll('input, textarea').forEach(campo => campo.removeAttribute('aria-invalid'));
        confirmacion.hidden = true;
        form.hidden = false;
        if (descripcion) descripcion.hidden = false;
        form.elements.nombre.focus();
    });
});

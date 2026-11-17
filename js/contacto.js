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

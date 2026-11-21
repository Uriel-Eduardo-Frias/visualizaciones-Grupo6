document.addEventListener('DOMContentLoaded', () => {
    const P = window.Portal;
    const usuario = P && P.usuarioActual();
    const form = document.getElementById('form-perfil');
    if (!usuario || !form) return;

    const SEXOS = { F: 'Femenino', M: 'Masculino', X: 'No binario (X)' };
    const CAMPOS = ['calle', 'numero', 'codigoPostal', 'email', 'telefono'];

    const texto = (id, valor) => { document.getElementById(id).textContent = valor; };
    const campo = nombre => form.elements.namedItem(nombre);

    /* ---------- Datos que vienen del registro (solo lectura) ---------- */
    const documento = `${usuario.tipoDocumento} ${P.formatearDocumento(usuario.tipoDocumento, usuario.documento)}`;

    texto('p-documento', documento);
    texto('p-nombre', usuario.nombre);
    texto('p-apellido', usuario.apellido);
    texto('p-sexo', SEXOS[usuario.sexo] || usuario.sexo);
    texto('p-nacimiento', P.formatearFecha(usuario.nacimiento, { day: 'numeric', month: 'long', year: 'numeric' }));


    const propios = P.todosLosReclamos().filter(r => r.autor === usuario.documento).length;
    const existentes = new Set(P.todosLosReclamos().map(r => r.numero));
    const adheridos = P.adhesionesDe(usuario.documento).filter(numero => existentes.has(numero)).length;
    texto('p-cant-propios', propios);
    texto('p-cant-adheridos', adheridos);
    document.getElementById('p-reclamos-vacio').hidden = propios + adheridos > 0;

    /* ---------- Campos editables ---------- */
    const domicilio = usuario.domicilio || {};
    ['calle', 'numero', 'piso', 'departamento', 'codigoPostal'].forEach(nombre => {
        campo(nombre).value = domicilio[nombre] || '';
    });
    campo('email').value = usuario.email || '';
    campo('telefono').value = usuario.telefono || '';

    const estado = document.getElementById('perfil-estado');
    const mostrarEstado = (mensaje, tipo) => {
        estado.textContent = mensaje;
        estado.className = `perfil-estado ${tipo}`;
        estado.hidden = false;
    };

    form.addEventListener('submit', evento => {
        evento.preventDefault();
        const valor = nombre => campo(nombre).value.trim();

        const datos = {
            email: valor('email'),
            telefono: valor('telefono'),
            domicilio: {
                calle: valor('calle'),
                numero: valor('numero'),
                piso: valor('piso'),
                departamento: valor('departamento'),
                codigoPostal: valor('codigoPostal').toUpperCase(),
            },
        };

        const errores = {};
        const d = datos.domicilio;

        // El domicilio es opcional, pero si se empieza a completar, debe quedar completo
        if (d.calle || d.numero || d.codigoPostal) {
            if (!d.calle) errores.calle = 'Ingresá la calle.';
            if (!d.numero) errores.numero = 'Ingresá la altura.';
            else if (!/^\d{1,6}$/.test(d.numero)) errores.numero = 'Usá solo números.';
            if (!d.codigoPostal) errores.codigoPostal = 'Ingresá el código postal.';
            else if (!/^([A-Z]\d{4}[A-Z]{3}|\d{4})$/.test(d.codigoPostal)) {
                errores.codigoPostal = 'Ingresá 4 números (por ejemplo 1754) o el formato completo (B1754ABC).';
            }
        }

        if (!P.emailValido(datos.email)) errores.email = 'Ingresá un correo electrónico válido.';

        if (datos.telefono) {
            const digitos = P.soloDigitos(datos.telefono);
            if (!/^[\d\s+()-]+$/.test(datos.telefono) || digitos.length < 8 || digitos.length > 13) {
                errores.telefono = 'Ingresá un teléfono válido, con código de área.';
            }
        }

        CAMPOS.forEach(nombre => P.marcarError(form, nombre, errores[nombre]));

        const primero = CAMPOS.find(nombre => errores[nombre]);
        if (primero) {
            campo(primero).focus();
            mostrarEstado('Revisá los campos marcados para poder guardar.', 'error');
            return;
        }

        try {
            const resultado = P.guardarPerfil(usuario.documento, datos);
            if (resultado.error) {
                if (resultado.campo) {
                    P.marcarError(form, resultado.campo, resultado.error);
                    campo(resultado.campo).focus();
                }
                mostrarEstado(resultado.error, 'error');
                return;
            }
            campo('codigoPostal').value = d.codigoPostal;
            mostrarEstado('Guardamos tus cambios.', 'ok');
        } catch (error) {
            mostrarEstado('No se pudieron guardar los cambios en este navegador. Intentá nuevamente.', 'error');
        }
    });
});
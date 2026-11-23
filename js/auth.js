/* ==========================================================================
   Portal Ciudadano · cuentas, sesión, reclamos y adhesiones (DEMOSTRACIÓN)
   Todo se guarda en el navegador (localStorage / sessionStorage).
   No es seguridad real: en producción esto debe validarse en un servidor.
   Expone window.Portal para que lo usen perfil.js y mis-reclamos.js.
   ========================================================================== */
(() => {
    'use strict';

    const CLAVES = {
        sesion: 'portal-ciudadano-demo-sesion',          // sessionStorage: documento del usuario
        usuarios: 'portal-ciudadano-demo-usuarios',      // localStorage: { [documento]: usuario }
        adhesiones: 'portal-ciudadano-demo-adhesiones',  // localStorage: { [documento]: [numeroReclamo] }
        reclamoPendiente: 'portal-ciudadano-demo-pending-claim',
        reclamos: 'misReclamos',                         // localStorage: reclamos creados
    };

    const EDAD_MINIMA = 16;

    const paginasProtegidas = new Set([
        'index2.html',
        'reclamos2.html',
        'mis-reclamos2.html',
        'perfil.html',
        'detalles-reclamo.html',
        'preguntas-frecuentes2.html',
        'nuevo-reclamo2.html',
        'reclamo-registrado2.html',
        'noticias_comunidad.html',
        'informacion-util2.html',
        'contacto2.html',
    ]);

    const paginaActual = location.pathname.split('/').pop();
    const body = document.body;
    const mensajeAuth = document.querySelector('[data-auth-message]');

    /* ---------- Almacenamiento ---------- */
    const leerJSON = (clave, defecto) => {
        try {
            const valor = localStorage.getItem(clave);
            return valor ? JSON.parse(valor) : defecto;
        } catch (error) {
            return defecto;
        }
    };
    const guardarJSON = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));

    /* ---------- Documentos ---------- */
    const soloDigitos = valor => String(valor || '').replace(/\D/g, '');

    function formatearDocumento(tipo, numero) {
        if (tipo === 'CUIL') return `${numero.slice(0, 2)}-${numero.slice(2, 10)}-${numero.slice(10)}`;
        return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function cuilValido(numero) {
        if (!/^\d{11}$/.test(numero)) return false;
        const prefijo = numero.slice(0, 2);
        if (!['20', '23', '24', '27', '30', '33', '34'].includes(prefijo)) return false;
        const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        const suma = pesos.reduce((total, peso, i) => total + peso * Number(numero[i]), 0);
        const resto = suma % 11;
        const digito = Number(numero[10]);
        if (resto === 0) return digito === 0;
        if (resto === 1) return prefijo === '23' && (digito === 4 || digito === 9);
        return digito === 11 - resto;
    }

    function validarDocumento(tipo, numero) {
        if (!numero) return 'Ingresá tu número de documento.';
        if (tipo === 'DNI') return /^\d{7,8}$/.test(numero) ? '' : 'El DNI tiene 7 u 8 números, sin puntos.';
        if (tipo === 'CUIL') return cuilValido(numero) ? '' : 'El CUIL no es válido. Revisá los 11 números.';
        return 'Elegí con qué documento te registrás.';
    }

    function edadDe(iso) {
        const [anio, mes, dia] = iso.split('-').map(Number);
        const hoy = new Date();
        let edad = hoy.getFullYear() - anio;
        if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) edad--;
        return edad;
    }

    const emailValido = valor => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);

    /* ---------- Contraseñas (hash con respaldo para demo) ---------- */
    async function hashClave(texto) {
        try {
            if (window.crypto && crypto.subtle) {
                const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('portal-demo:' + texto));
                return 'sha256:' + Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (error) { /* usa el respaldo */ }
        return 'plain:' + texto;
    }

    async function claveCoincide(texto, guardada) {
        if (guardada.startsWith('plain:')) return guardada === 'plain:' + texto;
        return guardada === await hashClave(texto);
    }

    /* ---------- Usuarios y sesión ---------- */
    const sinClave = usuario => {
        const { clave, ...publico } = usuario;
        return publico;
    };

    function usuarioActual() {
        try {
            const documento = sessionStorage.getItem(CLAVES.sesion);
            const usuario = documento && leerJSON(CLAVES.usuarios, {})[documento];
            return usuario ? sinClave(usuario) : null;
        } catch (error) {
            return null;
        }
    }

    async function registrar(datos) {
        const usuarios = leerJSON(CLAVES.usuarios, {});
        if (usuarios[datos.documento]) {
            return { campo: 'documento', error: 'Ya existe una cuenta con ese documento. Ingresá desde "Ingresar".' };
        }
        const email = datos.email.toLowerCase();
        if (Object.values(usuarios).some(u => u.email.toLowerCase() === email)) {
            return { campo: 'email', error: 'Ya existe una cuenta con ese correo electrónico.' };
        }
        usuarios[datos.documento] = {
            tipoDocumento: datos.tipoDocumento,
            documento: datos.documento,
            nombre: datos.nombre,
            apellido: datos.apellido,
            sexo: datos.sexo,
            nacimiento: datos.nacimiento,
            email: datos.email,
            telefono: '',
            domicilio: { calle: '', numero: '', piso: '', departamento: '', codigoPostal: '' },
            clave: await hashClave(datos.password),
        };
        guardarJSON(CLAVES.usuarios, usuarios);
        return { ok: true };
    }

    async function ingresar(documento, password) {
        const usuario = leerJSON(CLAVES.usuarios, {})[documento];
        if (!usuario || !(await claveCoincide(password, usuario.clave))) return null;
        return sinClave(usuario);
    }

    function guardarPerfil(documento, cambios) {
        const usuarios = leerJSON(CLAVES.usuarios, {});
        const usuario = usuarios[documento];
        if (!usuario) return { error: 'No encontramos tu cuenta. Volvé a ingresar.' };
        const email = cambios.email.toLowerCase();
        const repetido = Object.values(usuarios).some(u => u.documento !== documento && u.email.toLowerCase() === email);
        if (repetido) return { campo: 'email', error: 'Ese correo electrónico ya está en uso en otra cuenta.' };
        usuario.email = cambios.email;
        usuario.telefono = cambios.telefono;
        usuario.domicilio = cambios.domicilio;
        guardarJSON(CLAVES.usuarios, usuarios);
        return { ok: true };
    }

    function eliminarCuenta(documento) {
        const usuarios = leerJSON(CLAVES.usuarios, {});
        if (!usuarios || typeof usuarios !== 'object' || Array.isArray(usuarios) || !usuarios[documento]) {
            throw new Error('No encontramos la cuenta que querés eliminar.');
        }

        const adhesiones = leerJSON(CLAVES.adhesiones, {});
        const reclamos = leerJSON(CLAVES.reclamos, []);
        if (!adhesiones || typeof adhesiones !== 'object' || Array.isArray(adhesiones) || !Array.isArray(reclamos)) {
            throw new Error('No se pudieron leer los datos asociados a tu cuenta.');
        }
        const numerosEliminados = new Set(
            reclamos.filter(reclamo => reclamo.autor === documento).map(reclamo => reclamo.numero)
        );

        delete usuarios[documento];
        delete adhesiones[documento];
        Object.keys(adhesiones).forEach(otroDocumento => {
            if (!Array.isArray(adhesiones[otroDocumento])) {
                throw new Error('No se pudieron leer las adhesiones de las cuentas.');
            }
            adhesiones[otroDocumento] = adhesiones[otroDocumento]
                .filter(numero => !numerosEliminados.has(numero));
        });

        guardarJSON(CLAVES.reclamos, reclamos.filter(reclamo => reclamo.autor !== documento));
        guardarJSON(CLAVES.adhesiones, adhesiones);
        guardarJSON(CLAVES.usuarios, usuarios);
        sessionStorage.removeItem(CLAVES.sesion);
        sessionStorage.removeItem(CLAVES.reclamoPendiente);
    }

    /* ---------- Reclamos y adhesiones ---------- */
    const AREAS = {
        'Alumbrado': 'Alumbrado Público',
        'Calles y baches': 'Obras Públicas',
        'Arbolado': 'Espacios Verdes',
        'Limpieza': 'Higiene Urbana',
        'Tránsito': 'Tránsito y Transporte',
    };
    const FOTOS_POR_CATEGORIA = {
        'Alumbrado': '../img/reclamos/luminarias.jpg',
        'Calles y baches': '../img/reclamos/bache-escuela.jpg',
        'Arbolado': '../img/reclamos/rama-quebrada.jpg',
        'Limpieza': '../img/reclamos/basura.jpg',
        'Tránsito': '../img/reclamos/semaforo.jpg',
    };

    const normalizarCategoria = valor => String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    function areaDe(categoria) {
        if (!categoria) return 'Área a determinar';
        if (AREAS[categoria]) return AREAS[categoria];
        const normal = normalizarCategoria(categoria);
        for (const [k, v] of Object.entries(AREAS)) {
            if (normalizarCategoria(k) === normal) return v;
        }
        if (normal.includes('bache') || normal.includes('calle')) return AREAS['Calles y baches'];
        if (normal.includes('luz') || normal.includes('luminaria') || normal.includes('alumbr')) return AREAS['Alumbrado'];
        if (normal.includes('arbol') || normal.includes('rama') || normal.includes('verde')) return AREAS['Arbolado'];
        if (normal.includes('basura') || normal.includes('limp') || normal.includes('residu')) return AREAS['Limpieza'];
        if (normal.includes('transit') || normal.includes('semafor') || normal.includes('cartel')) return AREAS['Tránsito'];
        return 'Área a determinar';
    }

    function fotoAreaDe(categoria) {
        if (!categoria) return '../img/reclamos/luminarias.jpg';
        if (FOTOS_POR_CATEGORIA[categoria]) return FOTOS_POR_CATEGORIA[categoria];
        const normal = normalizarCategoria(categoria);
        for (const [k, v] of Object.entries(FOTOS_POR_CATEGORIA)) {
            if (normalizarCategoria(k) === normal) return v;
        }
        if (normal.includes('bache') || normal.includes('calle')) return FOTOS_POR_CATEGORIA['Calles y baches'];
        if (normal.includes('luz') || normal.includes('luminaria') || normal.includes('alumbr')) return FOTOS_POR_CATEGORIA['Alumbrado'];
        if (normal.includes('arbol') || normal.includes('rama') || normal.includes('verde')) return FOTOS_POR_CATEGORIA['Arbolado'];
        if (normal.includes('basura') || normal.includes('limp') || normal.includes('residu')) return FOTOS_POR_CATEGORIA['Limpieza'];
        if (normal.includes('transit') || normal.includes('semafor') || normal.includes('cartel')) return FOTOS_POR_CATEGORIA['Tránsito'];
        return '../img/reclamos/luminarias.jpg';
    }

    // Para usar fotos reales, reemplazá los archivos de ../img/reclamos/ (o cambiá fotoUrl).
    const reclamosDemo = [
        {
            numero: 'RC-2026-004390', asunto: 'Rama quebrada a punto de caer', categoria: 'Arbolado',
            direccion: 'Calle Arieta 2480', localidad: 'San Justo', barrio: 'Barrio Centro',
            detalle: 'Con el viento de ayer quedó una rama muy grande colgando sobre la vereda, justo por donde pasan los chicos para ir a la escuela.',
            fecha: '2026-11-19T10:05:00', estado: 'Recibido', solicitante: 'Gustavo P.', apoyos: 3, fotoUrl: '../img/reclamos/rama-quebrada.jpg',
            historial: { 'recibido': '2026-11-19T10:05:00' },
        },
        {
            numero: 'RC-2026-004351', asunto: 'Cartel caído sobre la vereda', categoria: 'Tránsito',
            direccion: 'Calle Italia y Calle Brasil', localidad: 'Isidro Casanova', barrio: 'Barrio San Alberto',
            detalle: 'El cartel se cayó sobre la vereda y quedó tirado junto al cordón desde el fin de semana. Los peatones tienen que bajar a la calle para esquivarlo y puede lastimar a alguien.',
            fecha: '2026-11-17T18:32:00', estado: 'Recibido', solicitante: 'Lucía M.', apoyos: 11, fotoUrl: '../img/reclamos/cartel-caido.jpg',
            historial: { 'recibido': '2026-11-17T18:32:00' },
        },
        {
            numero: 'RC-2026-004302', asunto: 'Tres luminarias apagadas en la cuadra', categoria: 'Alumbrado',
            direccion: 'Av. Brig. Gral. Juan Manuel de Rosas 3250', localidad: 'San Justo', barrio: 'Barrio Centro',
            detalle: 'Hace una semana que no funcionan las luminarias de toda la cuadra. De noche no se ve nada y ya hubo intentos de robo.',
            fecha: '2026-11-12T09:14:00', estado: 'En proceso', solicitante: 'Marcela R.', apoyos: 17, fotoUrl: '../img/reclamos/luminarias.jpg',
            historial: { 'recibido': '2026-11-12T09:14:00', 'derivado': '2026-11-13T11:20:00', 'en proceso': '2026-11-17T08:45:00' },
        },
        {
            numero: 'RC-2026-004266', asunto: 'Calle intransitable después de la lluvia', categoria: 'Calles y baches',
            direccion: 'Calle Güemes 2210', localidad: 'González Catán', barrio: 'Barrio Los Tilos',
            detalle: 'Con las últimas lluvias se hizo un pozo enorme y el agua no escurre. Los vecinos no podemos sacar los autos y no entra la ambulancia.',
            fecha: '2026-11-09T07:50:00', estado: 'En proceso', solicitante: 'Roberto D.', apoyos: 31, fotoUrl: '../img/reclamos/calle-inundada.jpg',
            historial: { 'recibido': '2026-11-09T07:50:00', 'derivado': '2026-11-10T10:00:00', 'en proceso': '2026-11-16T09:30:00' },
        },
        {
            numero: 'RC-2026-004198', asunto: 'Basura acumulada hace una semana', categoria: 'Limpieza',
            direccion: 'Calle Ombú 1540', localidad: 'Gregorio de Laferrere', barrio: 'Barrio Néstor Kirchner',
            detalle: 'No pasó el camión de recolección y las bolsas se juntaron en la esquina. Hay olor fuerte y empezaron a aparecer ratas.',
            fecha: '2026-11-05T16:10:00', estado: 'Derivado', solicitante: 'Natalia S.', apoyos: 8, fotoUrl: '../img/reclamos/basura.jpg',
            historial: { 'recibido': '2026-11-05T16:10:00', 'derivado': '2026-11-06T09:05:00' },
        },
        {
            numero: 'RC-2026-004127', asunto: 'Bache profundo frente a la escuela', categoria: 'Calles y baches',
            direccion: 'Calle Alvear 1120', localidad: 'Ramos Mejía', barrio: 'Barrio Parque',
            detalle: 'El bache tiene más de medio metro de ancho y está justo en la entrada de la escuela. Los autos frenan de golpe y los chicos cruzan por el costado.',
            fecha: '2026-10-30T12:25:00', estado: 'Derivado', solicitante: 'Silvia A.', apoyos: 24, fotoUrl: '../img/reclamos/bache-escuela.jpg',
            historial: { 'recibido': '2026-10-30T12:25:00', 'derivado': '2026-10-31T09:40:00' },
        },
        {
            numero: 'RC-2026-004075', asunto: 'Semáforo apagado en el cruce', categoria: 'Tránsito',
            direccion: 'Av. de Mayo y Rivadavia', localidad: 'Ramos Mejía', barrio: 'Centro',
            detalle: 'El semáforo no enciende desde el jueves y en horas pico se forma un embotellamiento. Cruzar a pie es peligroso.',
            fecha: '2026-10-27T19:03:00', estado: 'En proceso', solicitante: 'Martín C.', apoyos: 12, fotoUrl: '../img/reclamos/semaforo.jpg',
            historial: { 'recibido': '2026-10-27T19:03:00', 'derivado': '2026-10-28T10:15:00', 'en proceso': '2026-11-04T08:20:00' },
        },
        {
            numero: 'RC-2026-003981', asunto: 'Contenedor desbordado sin retirar', categoria: 'Limpieza',
            direccion: 'Calle Pergamino 3120', localidad: 'Villa Luzuriaga', barrio: 'Barrio Jardín',
            detalle: 'El contenedor de la esquina está desbordado y la basura invade la vereda y parte de la calle.',
            fecha: '2026-10-20T08:30:00', estado: 'Resuelto', solicitante: 'Héctor F.', apoyos: 8, fotoUrl: '../img/reclamos/contenedor.jpg',
            historial: { 'recibido': '2026-10-20T08:30:00', 'derivado': '2026-10-20T14:00:00', 'en proceso': '2026-10-21T09:00:00', 'resuelto': '2026-10-23T12:10:00' },
        },
        {
            numero: 'RC-2026-003904', asunto: 'Cables sueltos en un poste de luz', categoria: 'Alumbrado',
            direccion: 'Calle Lamadrid 980', localidad: 'Lomas del Mirador', barrio: 'Barrio Las Rosas',
            detalle: 'Hay cables colgando a la altura de la vereda y el poste hace chispas cuando llueve. Es un riesgo para quienes pasan.',
            fecha: '2026-10-15T21:40:00', estado: 'Resuelto', solicitante: 'Paula G.', apoyos: 6, fotoUrl: '../img/reclamos/cables.jpg',
            historial: { 'recibido': '2026-10-15T21:40:00', 'derivado': '2026-10-16T09:10:00', 'en proceso': '2026-10-19T10:30:00', 'resuelto': '2026-10-22T17:45:00' },
        },
    ];

    function reclamosGuardados() {
        const listaGuardada = leerJSON(CLAVES.reclamos, []);
        const lista = listaGuardada.filter(reclamo => {
            const asunto = String(reclamo.asunto || '').trim().toLowerCase();
            const detalle = String(reclamo.detalle || '').trim().toLowerCase();
            return asunto !== 'a' && asunto !== 'asa' && detalle !== 'a' && detalle !== 'asa';
        });
        let huboCambios = false;
        if (lista.length !== listaGuardada.length) huboCambios = true;
        const yo = usuarioActual();
        lista.forEach((reclamo, i) => {
            if (!reclamo.numero) { reclamo.numero = `RC-${Date.now()}-${i}`; huboCambios = true; }
            if (!reclamo.estado) { reclamo.estado = 'Recibido'; huboCambios = true; }
            if (!reclamo.fotoUrl) {
                reclamo.fotoUrl = fotoAreaDe(reclamo.categoria);
                huboCambios = true;
            }
            if (!reclamo.autor && yo) {
                reclamo.autor = yo.documento;
                huboCambios = true;
            }
        });
        if (huboCambios) {
            try { guardarJSON(CLAVES.reclamos, lista); } catch (error) { /* se ignora */ }
        }
        return lista;
    }

    function todosLosReclamos() {
        const tiempo = r => new Date(r.fecha).getTime() || 0;
        return [...reclamosGuardados(), ...reclamosDemo].sort((a, b) => tiempo(b) - tiempo(a));
    }

    const adhesionesDe = documento => leerJSON(CLAVES.adhesiones, {})[documento] || [];
    const estaAdherido = (documento, numero) => adhesionesDe(documento).includes(numero);

    function alternarAdhesion(documento, numero) {
        const yo = usuarioActual();
        if (!yo || yo.documento !== documento) throw new Error('sin sesión');
        const todas = leerJSON(CLAVES.adhesiones, {});
        const actuales = new Set(todas[documento] || []);
        const adherido = !actuales.has(numero);
        if (adherido) actuales.add(numero); else actuales.delete(numero);
        todas[documento] = Array.from(actuales);
        guardarJSON(CLAVES.adhesiones, todas);
        return adherido;
    }

    const MOTIVOS_CANCELACION = ['Ya se solucionó', 'Lo cargué por error', 'Está duplicado', 'Otro'];

    function cancelarReclamo(documento, numero, motivo, detalle) {
        const yo = usuarioActual();
        if (!yo || yo.documento !== documento) return false;
        if (!MOTIVOS_CANCELACION.includes(motivo)) return false;
        const lista = leerJSON(CLAVES.reclamos, []);
        const reclamo = lista.find(r => r.numero === numero);
        if (!reclamo || reclamo.autor !== documento) return false;
        const estado = String(reclamo.estado || 'Recibido').toLowerCase();
        if (estado === 'resuelto' || estado === 'cancelado') return false;
        reclamo.estado = 'Cancelado';
        reclamo.motivoCancelacion = motivo;
        const nota = String(detalle || '').trim().slice(0, 200);
        if (nota) reclamo.detalleCancelacion = nota; else delete reclamo.detalleCancelacion;
        reclamo.historial = { ...(reclamo.historial || {}), cancelado: new Date().toISOString() };
        try { guardarJSON(CLAVES.reclamos, lista); } catch (error) { return false; }
        return true;
    }

    function cantidadApoyos(reclamo) {
        const sumados = Object.values(leerJSON(CLAVES.adhesiones, {})).filter(lista => lista.includes(reclamo.numero)).length;
        return (reclamo.apoyos || 0) + sumados;
    }

    function reclamosDelUsuario(documento) {
        const adheridos = new Set(adhesionesDe(documento));
        return todosLosReclamos()
            .filter(r => r.autor === documento || adheridos.has(r.numero))
            .map(r => ({ ...r, participacion: r.autor === documento ? 'propio' : 'adherido' }));
    }

    function nombreSolicitante(reclamo) {
        if (reclamo.solicitante) return reclamo.solicitante;
        const yo = usuarioActual();
        if (reclamo.autor && yo && reclamo.autor === yo.documento) return 'Vos';
        const autor = reclamo.autor && leerJSON(CLAVES.usuarios, {})[reclamo.autor];
        return autor ? `${autor.nombre} ${autor.apellido.charAt(0)}.` : 'Vecino/a';
    }

    function formatearFecha(valor, opciones) {
        const fecha = new Date(valor);
        if (isNaN(fecha)) return 'Sin fecha';
        const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
        return fecha.toLocaleDateString('es-AR', { ...opciones, ...(soloFecha ? { timeZone: 'UTC' } : {}) });
    }

    function formatearFechaHora(valor) {
        const fecha = new Date(valor);
        if (isNaN(fecha)) return 'Fecha no disponible';
        const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
        const dia = fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', ...(soloFecha ? { timeZone: 'UTC' } : {}) });
        if (soloFecha) return dia;
        const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${dia} · ${hora}`;
    }

    // Reduce la foto (máx. 1000 px, JPEG) para que entre en el almacenamiento del navegador
    function redimensionarFoto(archivo, lado = 1000, calidad = 0.75) {
        return new Promise(resolver => {
            if (!archivo || !archivo.type.startsWith('image/')) return resolver('');
            const url = URL.createObjectURL(archivo);
            const imagen = new Image();
            imagen.onload = () => {
                const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
                const lienzo = document.createElement('canvas');
                lienzo.width = Math.round(imagen.width * escala);
                lienzo.height = Math.round(imagen.height * escala);
                lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
                URL.revokeObjectURL(url);
                resolver(lienzo.toDataURL('image/jpeg', calidad));
            };
            imagen.onerror = () => { URL.revokeObjectURL(url); resolver(''); };
            imagen.src = url;
        });
    }

    function pintarSumarme(boton, adherido) {
        boton.textContent = adherido ? 'Dejar de apoyar' : 'Apoyar';
        boton.classList.toggle('is-sumado', adherido);
    }

    /* ---------- Errores de formulario ---------- */
    function marcarError(form, campo, mensaje) {
        const aviso = form.querySelector(`[data-error-for="${campo}"]`);
        if (aviso) {
            aviso.textContent = mensaje || '';
            aviso.hidden = !mensaje;
        }
        const control = form.elements.namedItem(campo);
        const input = control && control.nodeType ? control : control && control[0];
        if (input) {
            if (mensaje) input.setAttribute('aria-invalid', 'true');
            else input.removeAttribute('aria-invalid');
        }
    }

    window.Portal = {
        EDAD_MINIMA, soloDigitos, formatearDocumento, validarDocumento, emailValido, edadDe,
        usuarioActual, guardarPerfil, reclamosDemo, todosLosReclamos, reclamosDelUsuario,
        adhesionesDe, estaAdherido, alternarAdhesion, cancelarReclamo, cantidadApoyos, nombreSolicitante,
        formatearFecha, formatearFechaHora, redimensionarFoto, areaDe, fotoAreaDe, pintarSumarme, marcarError, eliminarCuenta,
    };

    /* ======================================================================
       Control de acceso a las páginas
       ====================================================================== */
    function mostrarMensaje(mensaje) {
        if (mensajeAuth) {
            mensajeAuth.textContent = mensaje;
            mensajeAuth.hidden = false;
        }
    }

    function paginaSiguiente() {
        const pedida = new URLSearchParams(location.search).get('next') || 'index2.html';
        const archivo = pedida.split(/[?#]/)[0];
        return paginasProtegidas.has(archivo) ? pedida : 'index2.html';
    }

    function irAlLogin(siguiente, motivo) {
        const consulta = new URLSearchParams({ next: siguiente, required: motivo });
        location.replace(`login.html?${consulta}`);
    }

    const esPaginaDeAcceso = paginaActual === 'login.html' || paginaActual === 'registrarse.html';

    let almacenamientoOk = true;
    try {
        sessionStorage.getItem(CLAVES.sesion);
        localStorage.getItem(CLAVES.usuarios);
    } catch (error) {
        almacenamientoOk = false;
    }

    if (!almacenamientoOk) {
        if (esPaginaDeAcceso) {
            mostrarMensaje('El navegador no permite guardar la sesión de demostración. Habilitá el almacenamiento para continuar.');
        } else if (body.dataset.authRequired !== undefined) {
            irAlLogin(body.dataset.authNext || 'index2.html', 'storage');
        }
        return;
    }

    const usuario = usuarioActual();

    const equivalenteConSesion = {
        'index.html': 'index2.html',
        'reclamos.html': 'reclamos2.html',
        'contacto.html': 'contacto2.html',
        'informacion-util.html': 'informacion-util2.html',
        'preguntas-frecuentes.html': 'preguntas-frecuentes2.html',
        'noticias_comunidad2.html': 'noticias_comunidad.html',
        'mis-reclamos.html': 'mis-reclamos2.html',
    };

    if (usuario && equivalenteConSesion[paginaActual]) {
        location.replace(`${equivalenteConSesion[paginaActual]}${location.search}${location.hash}`);
        return;
    }

    window.addEventListener('pageshow', evento => {
        const ahora = usuarioActual();
        if (evento.persisted && (ahora ? ahora.documento : null) !== (usuario ? usuario.documento : null)) location.reload();
    });

    if (body.dataset.authRequired !== undefined) {
        if (!usuario) {
            irAlLogin(body.dataset.authNext || 'index2.html', 'login');
            return;
        }

        if (paginaActual === 'reclamo-registrado2.html') {
            try {
                if (sessionStorage.getItem(CLAVES.reclamoPendiente) !== 'true') {
                    location.replace('nuevo-reclamo2.html');
                    return;
                }
                sessionStorage.removeItem(CLAVES.reclamoPendiente);
            } catch (error) {
                location.replace('login.html?required=storage');
                return;
            }
        }

        if (body.dataset.authenticatedPage) {
            location.replace(`${body.dataset.authenticatedPage}${location.search}${location.hash}`);
            return;
        }
    }

    if (esPaginaDeAcceso && usuario) {
        location.replace(paginaSiguiente());
        return;
    }

    if (paginaActual === 'login.html') {
        const motivo = new URLSearchParams(location.search).get('required');
        if (motivo === 'login') {
            mostrarMensaje('Para hacer un reclamo o consultar tus gestiones, primero iniciá sesión.');
        } else if (motivo === 'storage') {
            mostrarMensaje('No se pudo acceder al almacenamiento de sesión del navegador. Habilitalo para continuar.');
        }
        const enlaceRegistro = document.querySelector('[data-register-link]');
        if (enlaceRegistro) enlaceRegistro.href = `registrarse.html?next=${encodeURIComponent(paginaSiguiente())}`;
    }

    if (paginaActual === 'registrarse.html') {
        const enlaceLogin = document.querySelector('[data-login-link]');
        if (enlaceLogin) enlaceLogin.href = `login.html?next=${encodeURIComponent(paginaSiguiente())}`;
    }

    /* ======================================================================
       Menú desplegable del usuario (reemplaza el bloque .user-menu)
       ====================================================================== */
    function montarMenuUsuario(persona) {
        document.querySelectorAll('.user-menu').forEach(menu => {
            menu.classList.add('user-menu--dropdown');
            menu.innerHTML = `
                <button class="user-trigger" type="button" aria-haspopup="true" aria-expanded="false"
                    aria-controls="menu-usuario" aria-label="Abrir el menú de tu cuenta">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span class="user-trigger-name"></span>
                    <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="user-dropdown" id="menu-usuario" hidden>
                    <div class="user-dropdown-id">
                        <strong data-menu-nombre></strong>
                        <span data-menu-doc></span>
                    </div>
                    <a href="perfil.html">Mi perfil</a>
                    <a href="mis-reclamos2.html">Mis reclamos</a>
                    <button class="item-salir" type="button" data-logout>Cerrar sesión</button>
                </div>`;
            menu.hidden = false;

            const nombreCompleto = `${persona.nombre} ${persona.apellido}`.trim();
            menu.querySelector('.user-trigger-name').textContent = persona.nombre;
            menu.querySelector('[data-menu-nombre]').textContent = nombreCompleto;
            menu.querySelector('[data-menu-doc]').textContent =
                `${persona.tipoDocumento} ${formatearDocumento(persona.tipoDocumento, persona.documento)}`;

            const boton = menu.querySelector('.user-trigger');
            const panel = menu.querySelector('.user-dropdown');
            boton.setAttribute('aria-label', `Abrir el menú de ${persona.nombre}`);
            boton.title = persona.nombre;

            menu.querySelectorAll('.user-dropdown a').forEach(enlace => {
                if (enlace.getAttribute('href') === paginaActual) enlace.setAttribute('aria-current', 'page');
            });

            const alternar = abrir => {
                panel.hidden = !abrir;
                boton.setAttribute('aria-expanded', String(abrir));
            };

            boton.addEventListener('click', () => alternar(panel.hidden));
            document.addEventListener('click', evento => {
                if (!menu.contains(evento.target)) alternar(false);
            });
            menu.addEventListener('keydown', evento => {
                if (evento.key === 'Escape' && !panel.hidden) {
                    alternar(false);
                    boton.focus();
                }
            });
        });
    }

    if (usuario) montarMenuUsuario(usuario);

    /* ---------- Cerrar sesión ---------- */
    document.querySelectorAll('[data-logout]').forEach(control => {
        control.addEventListener('click', evento => {
            evento.preventDefault();
            try {
                sessionStorage.removeItem(CLAVES.sesion);
                location.assign('index.html');
            } catch (error) {
                window.alert('No se pudo cerrar la sesión en este navegador. Intentá nuevamente.');
            }
        });
    });

    /* ---------- Botones "Sumarme" (cualquier elemento con data-sumarme) ---------- */
    document.querySelectorAll('[data-sumarme]').forEach(boton => {
        if (usuario) pintarSumarme(boton, estaAdherido(usuario.documento, boton.dataset.sumarme));
    });

    document.addEventListener('click', evento => {
        const boton = evento.target.closest('[data-sumarme]');
        if (!boton) return;
        evento.preventDefault();
        const actual = usuarioActual();
        if (!actual) {
            location.assign('login.html?next=reclamos2.html');
            return;
        }
        const numero = boton.dataset.sumarme;
        const reclamo = todosLosReclamos().find(r => r.numero === numero);
        if (reclamo && (reclamo.autor === actual.documento || String(reclamo.estado).toLowerCase() === 'cancelado')) return;
        try {
            const adherido = alternarAdhesion(actual.documento, numero);
            pintarSumarme(boton, adherido);
            document.dispatchEvent(new CustomEvent('portal:adhesion', { detail: { numero, adherido } }));
        } catch (error) {
            window.alert('No se pudo guardar tu adhesión en este navegador.');
        }
    });

    /* ======================================================================
       Formularios de ingreso y registro
       ====================================================================== */
    const formLogin = document.querySelector('[data-auth-form="login"]');
    const formRegistro = document.querySelector('[data-auth-form="register"]');

    document.querySelectorAll('input[data-solo-numeros]').forEach(input => {
        input.addEventListener('input', () => {
            const limpio = soloDigitos(input.value);
            if (limpio !== input.value) input.value = limpio;
        });
    });

    function iniciarSesion(documento) {
        sessionStorage.setItem(CLAVES.sesion, documento);
        location.assign(paginaSiguiente());
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async evento => {
            evento.preventDefault();
            const documento = soloDigitos(formLogin.elements.namedItem('documento').value);
            const password = formLogin.elements.namedItem('password').value;
            const enviar = formLogin.querySelector('[type="submit"]');

            enviar.disabled = true;
            try {
                const persona = await ingresar(documento, password);
                if (!persona) {
                    mostrarMensaje('El documento o la contraseña no son correctos. Revisalos e intentá de nuevo.');
                    return;
                }
                iniciarSesion(persona.documento);
            } catch (error) {
                mostrarMensaje('No se pudo iniciar la sesión en este navegador. Habilitá el almacenamiento e intentá nuevamente.');
            } finally {
                enviar.disabled = false;
            }
        });
    }

    if (formRegistro) {
        const campos = ['documento', 'nombre', 'apellido', 'sexo', 'nacimiento', 'email', 'password', 'confirm-password'];
        const etiquetaDoc = formRegistro.querySelector('[data-documento-label]');
        const ayudaDoc = formRegistro.querySelector('[data-documento-ayuda]');
        const inputDoc = formRegistro.elements.namedItem('documento');
        const inputNacimiento = formRegistro.elements.namedItem('nacimiento');

        inputNacimiento.max = new Date().toISOString().slice(0, 10);

        const actualizarTipo = () => {
            const tipo = formRegistro.elements.namedItem('tipoDocumento').value || 'DNI';
            etiquetaDoc.textContent = `Número de ${tipo}`;
            ayudaDoc.textContent = tipo === 'DNI' ? 'Entre 7 y 8 números, sin puntos.' : '11 números, sin guiones.';
            inputDoc.maxLength = tipo === 'DNI' ? 8 : 11;
        };
        formRegistro.querySelectorAll('input[name="tipoDocumento"]').forEach(radio => radio.addEventListener('change', actualizarTipo));
        actualizarTipo();

        formRegistro.addEventListener('submit', async evento => {
            evento.preventDefault();
            const valor = nombre => formRegistro.elements.namedItem(nombre).value;
            const datos = {
                tipoDocumento: valor('tipoDocumento'),
                documento: soloDigitos(valor('documento')),
                nombre: valor('nombre').trim().replace(/\s+/g, ' '),
                apellido: valor('apellido').trim().replace(/\s+/g, ' '),
                sexo: valor('sexo'),
                nacimiento: valor('nacimiento'),
                email: valor('email').trim(),
                password: valor('password'),
            };

            const errores = {};
            const errorDoc = validarDocumento(datos.tipoDocumento, datos.documento);
            if (errorDoc) errores.documento = errorDoc;
            if (datos.nombre.length < 2) errores.nombre = 'Ingresá tu nombre.';
            if (datos.apellido.length < 2) errores.apellido = 'Ingresá tu apellido.';
            if (!['F', 'M', 'X'].includes(datos.sexo)) errores.sexo = 'Elegí la opción que figura en tu documento.';
            if (!datos.nacimiento) {
                errores.nacimiento = 'Ingresá tu fecha de nacimiento.';
            } else if (datos.nacimiento < '1900-01-01' || edadDe(datos.nacimiento) < EDAD_MINIMA) {
                errores.nacimiento = `Tenés que tener ${EDAD_MINIMA} años o más y una fecha válida.`;
            }
            if (!emailValido(datos.email)) errores.email = 'Ingresá un correo electrónico válido.';
            if (datos.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.';
            if (valor('confirm-password') !== datos.password) errores['confirm-password'] = 'Las contraseñas no coinciden.';

            campos.forEach(campo => marcarError(formRegistro, campo, errores[campo]));
            if (mensajeAuth) mensajeAuth.hidden = true;

            const primero = campos.find(campo => errores[campo]);
            if (primero) {
                formRegistro.elements.namedItem(primero).focus();
                return;
            }

            const enviar = formRegistro.querySelector('[type="submit"]');
            enviar.disabled = true;
            try {
                const resultado = await registrar(datos);
                if (resultado.error) {
                    marcarError(formRegistro, resultado.campo, resultado.error);
                    formRegistro.elements.namedItem(resultado.campo).focus();
                    return;
                }
                iniciarSesion(datos.documento);
            } catch (error) {
                mostrarMensaje('No se pudo crear la cuenta en este navegador. Habilitá el almacenamiento e intentá nuevamente.');
            } finally {
                enviar.disabled = false;
            }
        });
    }
})();
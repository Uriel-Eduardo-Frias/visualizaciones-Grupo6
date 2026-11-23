# Portal Ciudadano · Municipio de La Matanza

Proyecto académico de visualización web: un prototipo de portal municipal para consultar información, teléfonos de emergencia, novedades comunitarias y gestionar reclamos vecinales.

## Funcionalidades

- **Página de inicio:** Bienvenida institucional, carrusel dinámico con imágenes del Centro de Operaciones y Monitoreo (COM) y accesos rápidos a servicios esenciales.
- **Gestión exclusiva de reclamos vecinales:** Formulario para reportar incidentes barriales (baches, luminarias, basurales, semáforos, etc.) con validación geográfica dentro del partido de La Matanza, autocompletado de dirección y selección sobre mapa interactivo.
- **Imágenes de referencia y fotos personalizadas:** Asignación visual por categoría y soporte para adjuntar imágenes propias al reclamo.
- **Seguimiento y estado de reclamos:** Consulta de reclamos propios y comunitarios con filtros, búsqueda y detalle paso a paso de su avance.
- **Información útil y teléfonos de emergencia:** Directorio de líneas de urgencia y asistencia directa al vecino.
- **Noticias y comunidad:** Novedades sobre salud, prevención y actividades municipales.
- **Acceso de demostración:** Registro e inicio de sesión simulados en el navegador (localStorage/sessionStorage).
- **Diseño adaptable:** Interfaz responsiva para celulares, tablets y computadoras de escritorio.

## Tecnologías y Librerías

- **HTML5 & CSS3:** Maquetación semántica, variables CSS institucionales y diseño adaptable sin frameworks pesados.
- **JavaScript (Vanilla):** Manejo de estado local, lógica de formularios y navegación.
- **Leaflet (v1.9.4) & OpenStreetMap / Nominatim:** Geocodificación y delimitación poligonal interactiva de La Matanza.
- **Swiper.js (v11):** Carrusel interactivo responsive con soporte táctil, autoplay y transiciones fluidas.

## Estructura del Proyecto

- `html/`: Páginas del portal (versiones públicas y con sesión iniciada).
  - `index.html` e `index2.html`: Portadas del portal (pública y autenticada).
  - `reclamos.html` y `reclamos2.html`: Listado general de reclamos comunitarios.
  - `nuevo-reclamo2.html`: Formulario interactivo con mapa para cargar un nuevo reclamo.
  - `reclamo-registrado2.html`: Pantalla de confirmación tras registrar un reclamo.
  - `mis-reclamos.html` y `mis-reclamos2.html`: Seguimiento y gestión de los reclamos propios del usuario.
  - `detalles-reclamo.html`: Vista detallada y estado de una solicitud específica.
  - `informacion-util.html` e `informacion-util2.html`: Números de emergencia y centros de atención.
  - `noticias_comunidad.html` y `noticias_comunidad2.html`: Portal de novedades barriales.
  - `contacto.html` y `contacto2.html`: Formulario y canales de atención ciudadana.
  - `preguntas-frecuentes.html` y `preguntas-frecuentes2.html`: Respuestas frecuentes sobre reclamos y el portal.
  - `login.html` y `registrarse.html`: Pantallas de inicio de sesión y registro de cuentas de demostración.
  - `perfil.html`: Gestión de datos del usuario autenticado.
- `img/`: Imágenes institucionales, fotos del carrusel y recursos gráficos.
  - `img/reclamos/`: Fotos de referencia categorizadas (baches, luminarias, basurales, etc.).
- `css/`: Hojas de estilo modulares (`styles.css`, `header-footer.css`, `acceso.css`, `mejoras.css`, etc.).
- `js/`: Scripts modulares.
  - `carrusel.js`: Inicialización y configuración del carrusel Swiper.
  - `auth.js`: Control de sesión de demostración, registro y redirecciones.
  - `mapas.js`: Inicialización de Leaflet, capas de OpenStreetMap y límites del municipio.
  - `mis-reclamos.js`, `seguimiento-reclamo.js`, `detalle-reclamo.js`: Lógica de listado y seguimiento.
  - `noticias.js`, `telefonos.js`, `contacto.js`, `perfil.js`: Lógica de soporte para cada sección.

## Alcance del acceso

El proyecto es un prototipo estático académico: iniciar sesión y registrarse simula el acceso guardando la sesión temporalmente en el navegador. No hay servidor, base de datos ni validación real de credenciales en backend. La comprobación del navegador sirve para demostrar el flujo de usuario, pero no reemplaza la autorización en un entorno de producción.

# Portal Ciudadano · Municipio de La Matanza

Proyecto académico de visualización web: un prototipo de portal municipal para consultar información y gestionar reclamos vecinales.

## Funcionalidades

- Página de inicio con accesos a servicios e información municipal.
- Pantallas para iniciar sesión y crear una cuenta.
- Acceso de demostración a las páginas autenticadas.
- Formulario para cargar un reclamo con ubicación validada dentro de La Matanza, búsqueda de direcciones y selección en mapa.
- Imagen de referencia fija según la categoría del reclamo, con opción de adjuntar una foto propia.
- Listado de reclamos con filtros y búsqueda.
- Diseño adaptable a distintos tamaños de pantalla.

La ubicación y las direcciones se consultan con Nominatim de OpenStreetMap. Al seleccionar un punto válido en el mapa se completan la dirección, la localidad y el barrio; al buscar una dirección, el mapa y esos datos se actualizan si el resultado pertenece a La Matanza. Las imágenes fijas por categoría están en `img/reclamos/`.

## Estructura

- `html/`: páginas del portal.
  - `index.html`: inicio público.
  - `login.html` y `registrarse.html`: pantallas de acceso y registro.
  - `index2.html`, `mis-reclamos2.html`, `nuevo-reclamo2.html` y `reclamo-registrado2.html`: pantallas para usuarios con sesión de demostración.
  - `mis-reclamos.html`: redirige al acceso si no hay sesión; si existe una, continúa a la versión autenticada.
- `img/reclamos/`: imágenes de referencia asociadas a las categorías y fotos de ejemplo.
- `css/`: estilos generales (`styles.css`), componentes de navegación y pie (`header-footer.css`) y acceso (`acceso.css`).
- `js/auth.js`: flujo de sesión de demostración, redirecciones y confirmación de reclamos.


## Alcance del acceso

El proyecto es un prototipo estático: iniciar sesión y registrarse simula el acceso guardando la sesión temporalmente en el navegador. No hay servidor, base de datos ni validación real de credenciales. No ingreses contraseñas reales. La comprobación del navegador sirve para mostrar el flujo, pero no protege datos ni reemplaza la autorización del lado del servidor.

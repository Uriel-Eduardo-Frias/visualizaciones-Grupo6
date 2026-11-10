# Portal Ciudadano · Municipio de La Matanza

Proyecto académico de visualización web: un prototipo de portal municipal para consultar información y gestionar reclamos vecinales.

## Funcionalidades

- Página de inicio con accesos a servicios e información municipal.
- Pantallas para iniciar sesión y crear una cuenta.
- Acceso de demostración a las páginas autenticadas.
- Formulario para cargar un reclamo y pantalla de confirmación.
- Listado de reclamos con filtros y búsqueda.
- Diseño adaptable a distintos tamaños de pantalla.

## Estructura

- `html/`: páginas del portal.
  - `index.html`: inicio público.
  - `login.html` y `registrarse.html`: pantallas de acceso y registro.
  - `index2.html`, `mis-reclamos2.html`, `nuevo-reclamo2.html` y `reclamo-registrado2.html`: pantallas para usuarios con sesión de demostración.
  - `mis-reclamos.html`: redirige al acceso si no hay sesión; si existe una, continúa a la versión autenticada.
- `css/`: estilos generales (`styles.css`), componentes de navegación y pie (`header-footer.css`) y acceso (`acceso.css`).
- `js/auth.js`: flujo de sesión de demostración, redirecciones y confirmación de reclamos.


## Alcance del acceso

El proyecto es un prototipo estático: iniciar sesión y registrarse simula el acceso guardando la sesión temporalmente en el navegador. No hay servidor, base de datos ni validación real de credenciales. No ingreses contraseñas reales. La comprobación del navegador sirve para mostrar el flujo, pero no protege datos ni reemplaza la autorización del lado del servidor.


document.addEventListener('DOMContentLoaded', () => {

    const botones = document.querySelectorAll('.filtros-por-categora button');
    const noticias = document.querySelectorAll('.noticia');
    const filas = document.querySelectorAll('.noticias-fila');

    botones.forEach(boton => {

        boton.addEventListener('click', () => {

            const categoria = boton.dataset.filter;

            // Cambiar el botón seleccionado
            botones.forEach(btn => {

                const seleccionado = btn === boton;

                btn.classList.toggle('todas-seleccionado', seleccionado);
                btn.classList.toggle('categor-a-wrapper', !seleccionado);

                btn.setAttribute('aria-pressed', seleccionado);

                const texto = btn.querySelector('span');

                texto.classList.toggle('categor-a', seleccionado);
                texto.classList.toggle('categor-a-2', !seleccionado);

            });

            // Filtrar las noticias
            noticias.forEach(noticia => {

                const coincide =
                    categoria === 'todas' ||
                    noticia.classList.contains(categoria);

                noticia.style.display = coincide ? '' : 'none';

            });

            // Ocultar filas vacías
            filas.forEach(fila => {

                const noticiasVisibles = fila.querySelectorAll(
                    '.noticia:not([style*="display: none"])'
                );

                fila.style.display =
                    noticiasVisibles.length > 0 ? '' : 'none';

            });

        });

    });

});

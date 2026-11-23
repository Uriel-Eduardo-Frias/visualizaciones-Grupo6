(() => {
    'use strict';

    function initCarrusel() {
        const swiperElement = document.querySelector('.hero-swiper');
        if (!swiperElement) return;

        if (typeof Swiper === 'undefined') {
            console.warn('Swiper no está disponible en la página.');
            return;
        }

        new Swiper('.hero-swiper', {
            loop: true,
            speed: 700,
            grabCursor: true,
            observer: true,
            observeParents: true,
            resizeObserver: true,
            autoplay: {
                delay: 4500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            a11y: {
                prevSlideMessage: 'Imagen anterior',
                nextSlideMessage: 'Imagen siguiente',
                firstSlideMessage: 'Esta es la primera imagen',
                lastSlideMessage: 'Esta es la última imagen',
                paginationBulletMessage: 'Ir a la imagen {{index}}',
            },
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarrusel);
    } else {
        initCarrusel();
    }
})();

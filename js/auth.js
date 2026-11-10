(() => {
    const sessionKey = 'portal-ciudadano-demo-email';
    const pendingClaimKey = 'portal-ciudadano-demo-pending-claim';
    const protectedPages = new Set([
        'index2.html',
        'mis-reclamos2.html',
        'nuevo-reclamo2.html',
        'reclamo-registrado2.html'
    ]);

    const currentPage = location.pathname.split('/').pop();
    const body = document.body;
    const authMessage = document.querySelector('[data-auth-message]');

    function showMessage(message) {
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.hidden = false;
        }
    }

    function getNextPage() {
        const requestedPage = new URLSearchParams(location.search).get('next') || 'index2.html';
        const requestedFile = requestedPage.split(/[?#]/)[0];
        return protectedPages.has(requestedFile) ? requestedPage : 'index2.html';
    }

    function goToLogin(nextPage, reason) {
        const query = new URLSearchParams({ next: nextPage, required: reason });
        location.replace(`login.html?${query}`);
    }

    let sessionEmail;
    try {
        sessionEmail = sessionStorage.getItem(sessionKey);
    } catch (error) {
        if (currentPage === 'login.html' || currentPage === 'registrarse.html') {
            showMessage('El navegador no permite guardar la sesión de demostración. Habilitá el almacenamiento para continuar.');
        } else if (body.dataset.authRequired !== undefined) {
            goToLogin(body.dataset.authNext || 'index2.html', 'storage');
        }
        return;
    }

    if (body.dataset.authRequired !== undefined) {
        if (!sessionEmail) {
            goToLogin(body.dataset.authNext || 'index2.html', 'login');
            return;
        }

        if (currentPage === 'reclamo-registrado2.html') {
            try {
                if (sessionStorage.getItem(pendingClaimKey) !== 'true') {
                    location.replace('nuevo-reclamo2.html');
                    return;
                }
                sessionStorage.removeItem(pendingClaimKey);
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

    if ((currentPage === 'login.html' || currentPage === 'registrarse.html') && sessionEmail) {
        location.replace(getNextPage());
        return;
    }

    if (currentPage === 'login.html') {
        const params = new URLSearchParams(location.search);
        if (params.get('required') === 'login') {
            showMessage('Para hacer un reclamo o consultar tus gestiones, primero iniciá sesión.');
        } else if (params.get('required') === 'storage') {
            showMessage('No se pudo acceder al almacenamiento de sesión del navegador. Habilitalo para continuar.');
        }

        const registerLink = document.querySelector('[data-register-link]');
        if (registerLink) {
            registerLink.href = `registrarse.html?next=${encodeURIComponent(getNextPage())}`;
        }
    }

    if (currentPage === 'registrarse.html') {
        const loginLink = document.querySelector('[data-login-link]');
        if (loginLink) {
            loginLink.href = `login.html?next=${encodeURIComponent(getNextPage())}`;
        }
    }

    document.querySelectorAll('[data-logout]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            try {
                sessionStorage.removeItem(sessionKey);
                location.assign('index.html');
            } catch (error) {
                window.alert('No se pudo cerrar la sesión en este navegador. Intentá nuevamente.');
            }
        });
    });

    document.querySelectorAll('[data-auth-form]').forEach(form => {
        form.addEventListener('submit', event => {
            event.preventDefault();
            const password = form.elements.namedItem('password');
            const email = form.elements.namedItem('email').value.trim();

            if (form.dataset.authForm === 'register') {
                const confirmation = form.elements.namedItem('confirm-password').value;
                if (password.value !== confirmation) {
                    showMessage('Las contraseñas no coinciden.');
                    form.elements.namedItem('confirm-password').focus();
                    return;
                }
            }

            try {
                sessionStorage.setItem(sessionKey, email);
                location.assign(getNextPage());
            } catch (error) {
                showMessage('No se pudo iniciar la sesión en este navegador. Habilitá el almacenamiento e intentá nuevamente.');
            }
        });
    });
})();

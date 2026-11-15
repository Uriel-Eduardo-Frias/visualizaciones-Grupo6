(() => {
    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayerOptions = {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    };

    const claimMapElement = document.getElementById('mapa-reclamo');
    if (claimMapElement) {
        if (!window.L) {
            document.getElementById('mapa-mensaje').textContent =
                'No se pudo cargar el mapa. Revisá tu conexión e intentá nuevamente.';
            return;
        }

        const map = L.map(claimMapElement).setView([-34.6795, -58.5630], 13);
        L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(map);

        let marker = null;
        const message = document.getElementById('mapa-mensaje');

        const selectLocation = (latlng) => {
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng, { draggable: true }).addTo(map);
                marker.on('dragend', () => selectLocation(marker.getLatLng()));
            }

            const coordinates = {
                lat: Number(latlng.lat.toFixed(6)),
                lng: Number(latlng.lng.toFixed(6))
            };
            window.dispatchEvent(new CustomEvent('portal:ubicacion-reclamo', {
                detail: coordinates
            }));
        };

        map.on('click', event => selectLocation(event.latlng));

        const locationButton = document.getElementById('btn-ubicacion');
        locationButton.addEventListener('click', () => {
            if (!navigator.geolocation) {
                message.textContent = 'Este navegador no permite obtener tu ubicación.';
                return;
            }

            message.textContent = 'Obteniendo tu ubicación...';
            navigator.geolocation.getCurrentPosition(
                position => {
                    const location = [
                        position.coords.latitude,
                        position.coords.longitude
                    ];
                    map.setView(location, 17);
                    selectLocation(L.latLng(location[0], location[1]));
                },
                error => {
                    const errorMessages = {
                        1: 'Permití el acceso a tu ubicación en el navegador para usar esta opción.',
                        2: 'No se pudo determinar tu ubicación. Podés marcarla directamente en el mapa.',
                        3: 'La búsqueda de ubicación tardó demasiado. Intentá nuevamente.'
                    };
                    message.textContent = errorMessages[error.code] ||
                        'No se pudo obtener tu ubicación. Marcala directamente en el mapa.';
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    const officesMapElement = document.getElementById('mapa-oficinas');
    if (officesMapElement) {
        if (!window.L) {
            officesMapElement.textContent =
                'No se pudo cargar el mapa. Revisá tu conexión e intentá nuevamente.';
            return;
        }

        const offices = Array.from(document.querySelectorAll('[data-office]'));
        const map = L.map(officesMapElement);
        L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(map);

        const markers = offices.map(office => {
            const coordinates = [
                Number(office.dataset.lat),
                Number(office.dataset.lng)
            ];
            const name = office.querySelector('strong').textContent;
            const address = office.dataset.address;
            const marker = L.marker(coordinates).addTo(map)
                .bindPopup(`<strong>${name}</strong><br>${address}<br>Latitud: ${coordinates[0].toFixed(6)}<br>Longitud: ${coordinates[1].toFixed(6)}`);

            office.addEventListener('click', () => {
                offices.forEach(item => {
                    const active = item === office;
                    item.classList.toggle('active', active);
                    item.setAttribute('aria-pressed', String(active));
                });
                map.setView(coordinates, 15);
                marker.openPopup();
            });

            return coordinates;
        });

        if (markers.length) {
            map.fitBounds(markers, { padding: [24, 24] });
        } else {
            map.setView([-34.6795, -58.5630], 13);
        }
    }
})();

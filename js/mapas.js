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

        const map = L.map(claimMapElement).setView([-34.75, -58.55], 10);
        L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(map);

        let marker = null;
        let geometryMunicipio = null;
        let capaMunicipio = null;
        let municipioDestacado = false;
        let ubicacionPendiente = null;
        const message = document.getElementById('mapa-mensaje');
        const claveLimite = 'portal-limite-la-matanza-v1';
        const estiloMunicipio = {
            color: '#2563eb',
            weight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.12
        };
        const estiloMunicipioDestacado = {
            color: '#1d4ed8',
            weight: 3,
            fillColor: '#2563eb',
            fillOpacity: 0.4
        };

        const esAnilloValido = anillo => Array.isArray(anillo) && anillo.length >= 4 &&
            anillo.every(coordenada => Array.isArray(coordenada) &&
                coordenada.length >= 2 && coordenada.slice(0, 2).every(Number.isFinite));
        const esPoligonoValido = poligono => Array.isArray(poligono) &&
            poligono.length > 0 && poligono.every(esAnilloValido);
        const esGeometriaValida = geometria => geometria &&
            (geometria.type === 'Polygon'
                ? esPoligonoValido(geometria.coordinates)
                : geometria.type === 'MultiPolygon' &&
                    Array.isArray(geometria.coordinates) &&
                    geometria.coordinates.length > 0 &&
                    geometria.coordinates.every(esPoligonoValido));

        const normalizarNombre = valor => String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/^partido de\s+/, '')
            .trim();

        const esResultadoDeLaMatanza = resultado => {
            const direccion = resultado.address || {};
            return [
                resultado.name,
                direccion.county,
                direccion.municipality,
                direccion.city,
                direccion.state_district
            ].some(valor => normalizarNombre(valor) === 'la matanza');
        };

        const puntoEnAnillo = (latlng, anillo) => {
            const x = latlng.lng;
            const y = latlng.lat;
            let dentro = false;

            for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
                const [xi, yi] = anillo[i];
                const [xj, yj] = anillo[j];
                const cruzado = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
                const sobreBorde = Math.abs(cruzado) < 1e-10 &&
                    x >= Math.min(xi, xj) - 1e-8 && x <= Math.max(xi, xj) + 1e-8 &&
                    y >= Math.min(yi, yj) - 1e-8 && y <= Math.max(yi, yj) + 1e-8;
                if (sobreBorde) return true;

                if ((yi > y) !== (yj > y) &&
                    x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                    dentro = !dentro;
                }
            }
            return dentro;
        };

        const puntoEnPoligono = (latlng, anillos) =>
            puntoEnAnillo(latlng, anillos[0]) &&
            !anillos.slice(1).some(anillo => puntoEnAnillo(latlng, anillo));

        const dentroDelMunicipio = latlng => {
            if (!geometryMunicipio) return false;
            if (geometryMunicipio.type === 'Polygon') {
                return puntoEnPoligono(latlng, geometryMunicipio.coordinates);
            }
            return geometryMunicipio.coordinates.some(poligono =>
                puntoEnPoligono(latlng, poligono)
            );
        };

        const actualizarEstiloMunicipio = () => {
            if (capaMunicipio) {
                capaMunicipio.setStyle(
                    municipioDestacado ? estiloMunicipioDestacado : estiloMunicipio
                );
            }
        };

        const destacarMunicipio = () => {
            municipioDestacado = true;
            actualizarEstiloMunicipio();
            if (capaMunicipio) {
                map.fitBounds(capaMunicipio.getBounds(), { padding: [18, 18] });
            }
        };

        const restablecerDestacado = () => {
            municipioDestacado = false;
            actualizarEstiloMunicipio();
        };

        const dibujarLimite = geometria => {
            geometryMunicipio = geometria;
            capaMunicipio = L.geoJSON(geometria, {
                style: estiloMunicipio,
                interactive: false
            }).addTo(map);
            actualizarEstiloMunicipio();
            map.fitBounds(capaMunicipio.getBounds(), { padding: [18, 18] });
            message.textContent =
                'El mapa muestra La Matanza completa. Seleccioná un punto dentro del área azul.';
            if (ubicacionPendiente) {
                const pendiente = ubicacionPendiente;
                ubicacionPendiente = null;
                const location = L.latLng(pendiente.lat, pendiente.lng);
                if (dentroDelMunicipio(location)) {
                    restablecerDestacado();
                    map.setView(location, 17);
                    updateMarker(location);
                    message.textContent =
                        'Dirección localizada dentro de La Matanza. Podés ajustar el punto en el mapa.';
                } else {
                    destacarMunicipio();
                    window.dispatchEvent(new CustomEvent('portal:ubicacion-fuera-de-matanza'));
                }
            }
        };

        const cargarLimiteMunicipal = async () => {
            const cache = sessionStorage.getItem(claveLimite);
            if (cache) {
                try {
                    const guardado = JSON.parse(cache);
                    if (guardado.expira > Date.now() && esGeometriaValida(guardado.geometria)) {
                        dibujarLimite(guardado.geometria);
                        return;
                    }
                } catch (error) {
                    console.error('No se pudo leer el límite municipal guardado:', error);
                }
                sessionStorage.removeItem(claveLimite);
            }

            window.dispatchEvent(new CustomEvent('portal:limite-la-matanza-solicitado'));
            try {
                const url = new URL('https://nominatim.openstreetmap.org/search');
                url.search = new URLSearchParams({
                    format: 'jsonv2',
                    q: 'Partido de La Matanza, Buenos Aires, Argentina',
                    addressdetails: '1',
                    polygon_geojson: '1',
                    limit: '1',
                    countrycodes: 'ar'
                }).toString();

                const response = await fetch(url.href, {
                    headers: { 'Accept-Language': 'es' }
                });
                if (!response.ok) {
                    throw new Error('El servicio de mapas respondió con un error.');
                }

                const resultados = await response.json();
                const resultado = resultados.find(item =>
                    esResultadoDeLaMatanza(item) && esGeometriaValida(item.geojson)
                );
                if (!resultado) {
                    throw new Error('No se encontró el límite geográfico de La Matanza.');
                }

                dibujarLimite(resultado.geojson);
                try {
                    sessionStorage.setItem(claveLimite, JSON.stringify({
                        geometria: resultado.geojson,
                        expira: Date.now() + 7 * 24 * 60 * 60 * 1000
                    }));
                } catch (error) {
                    console.error('No se pudo guardar el límite municipal en caché:', error);
                }
            } catch (error) {
                console.error('Error al cargar el límite de La Matanza:', error);
                message.textContent =
                    'No se pudo cargar el límite de La Matanza. Revisá tu conexión e intentá nuevamente.';
            }
        };

        const updateMarker = latlng => {
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng, { draggable: true }).addTo(map);
                marker.on('dragend', () => selectLocation(marker.getLatLng()));
            }
        };

        const selectLocation = latlng => {
            if (!geometryMunicipio) {
                message.textContent = 'Esperá a que se cargue el límite de La Matanza para marcar una ubicación.';
                return;
            }
            if (!dentroDelMunicipio(latlng)) {
                if (marker) {
                    map.removeLayer(marker);
                    marker = null;
                }
                destacarMunicipio();
                window.dispatchEvent(new CustomEvent('portal:ubicacion-fuera-de-matanza'));
                return;
            }

            restablecerDestacado();
            updateMarker(latlng);
            const coordinates = {
                lat: Number(latlng.lat.toFixed(6)),
                lng: Number(latlng.lng.toFixed(6))
            };
            window.dispatchEvent(new CustomEvent('portal:ubicacion-reclamo', {
                detail: coordinates
            }));
        };

        window.addEventListener('portal:centrar-ubicacion-reclamo', event => {
            const { lat, lng } = event.detail;
            const location = L.latLng(lat, lng);
            if (!geometryMunicipio) {
                ubicacionPendiente = { lat, lng };
                return;
            }
            if (geometryMunicipio && !dentroDelMunicipio(location)) {
                destacarMunicipio();
                window.dispatchEvent(new CustomEvent('portal:ubicacion-fuera-de-matanza'));
                return;
            }
            restablecerDestacado();
            map.setView(location, 17);
            updateMarker(location);
        });

        window.addEventListener('portal:destacar-municipio-reclamo', destacarMunicipio);
        window.addEventListener('portal:limpiar-destacado-municipio-reclamo', restablecerDestacado);

        window.addEventListener('portal:limpiar-ubicacion-reclamo', () => {
            ubicacionPendiente = null;
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
        });

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

        cargarLimiteMunicipal();
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
                .bindPopup(`<strong>${name}</strong><br>${address}`);

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

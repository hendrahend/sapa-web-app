export type BrowserPosition = {
    latitude: number;
    longitude: number;
    accuracy: number;
};

function geolocationErrorMessage(error: GeolocationPositionError): string {
    const secureContextHint = window.isSecureContext
        ? ''
        : ' Geolocation biasanya hanya aktif di HTTPS atau localhost.';

    if (error.code === error.PERMISSION_DENIED) {
        return `Izin lokasi ditolak oleh browser.${secureContextHint}`;
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
        return `Lokasi belum tersedia dari perangkat. Coba aktifkan GPS/Wi-Fi, lalu ulangi.${secureContextHint}`;
    }

    if (error.code === error.TIMEOUT) {
        return `Pembacaan lokasi terlalu lama. Coba ulangi di area sinyal yang lebih baik.${secureContextHint}`;
    }

    return `Lokasi tidak bisa dibaca.${secureContextHint}`;
}

function readPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}

export async function getBrowserPosition(): Promise<BrowserPosition> {
    if (!navigator.geolocation) {
        throw new Error('Browser tidak mendukung geolocation.');
    }

    try {
        const position = await readPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
        });

        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
        };
    } catch {
        try {
            const position = await readPosition({
                enableHighAccuracy: false,
                timeout: 20000,
                maximumAge: 60000,
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
            };
        } catch (error) {
            if (error instanceof GeolocationPositionError) {
                throw new Error(geolocationErrorMessage(error));
            }

            throw new Error('Lokasi tidak bisa dibaca.');
        }
    }
}

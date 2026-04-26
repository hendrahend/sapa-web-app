import { Navigation } from 'lucide-react';
import { useEffect } from 'react';
import {
    Circle,
    CircleMarker,
    MapContainer,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';

function LocationPicker({
    latitude,
    longitude,
    radius,
    onChange,
}: {
    latitude: number;
    longitude: number;
    radius: number;
    onChange: (latitude: number, longitude: number) => void;
}) {
    useMapEvents({
        click(event) {
            onChange(event.latlng.lat, event.latlng.lng);
        },
    });

    return (
        <>
            <Circle
                center={[latitude, longitude]}
                pathOptions={{
                    color: '#2563eb',
                    fillColor: '#2563eb',
                    fillOpacity: 0.12,
                }}
                radius={radius}
            />
            <CircleMarker
                center={[latitude, longitude]}
                pathOptions={{
                    color: '#1d4ed8',
                    fillColor: '#1d4ed8',
                    fillOpacity: 1,
                }}
                radius={7}
            />
        </>
    );
}

function SyncMapCenter({
    latitude,
    longitude,
}: {
    latitude: number;
    longitude: number;
}) {
    const map = useMap();

    useEffect(() => {
        map.setView([latitude, longitude], map.getZoom(), {
            animate: false,
        });
    }, [latitude, longitude, map]);

    return null;
}

export default function SchoolLocationMap({
    latitude,
    longitude,
    radius,
    gpsLoading,
    onChange,
    onUseCurrentGps,
}: {
    latitude: number;
    longitude: number;
    radius: number;
    gpsLoading: boolean;
    onChange: (latitude: number, longitude: number) => void;
    onUseCurrentGps: () => void;
}) {
    const center: [number, number] = [latitude, longitude];

    return (
        <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onUseCurrentGps}
                disabled={gpsLoading}
                className="absolute top-3 right-3 z-[1000] shadow-md"
            >
                <Navigation />
                {gpsLoading ? 'GPS...' : 'GPS sekarang'}
            </Button>
            <MapContainer
                center={center}
                zoom={17}
                scrollWheelZoom
                className="h-full min-h-[560px] w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <SyncMapCenter latitude={latitude} longitude={longitude} />
                <LocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    radius={radius}
                    onChange={(nextLatitude, nextLongitude) => {
                        onChange(
                            Number(nextLatitude.toFixed(7)),
                            Number(nextLongitude.toFixed(7)),
                        );
                    }}
                />
            </MapContainer>
        </section>
    );
}

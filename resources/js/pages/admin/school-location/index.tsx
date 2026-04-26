import { Head, useForm } from '@inertiajs/react';
import { Navigation } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import SchoolLocationController from '@/actions/App/Http/Controllers/Admin/SchoolLocationController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrowserPosition } from '@/lib/geolocation';

const SchoolLocationMap = lazy(
    () => import('@/components/sapa/school-location-map'),
);

type SchoolLocation = {
    id: number;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    radius_meters: number;
    is_active: boolean;
};

type LocationForm = {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    is_active: boolean;
};

type Props = {
    location: SchoolLocation | null;
};

const defaultLocation: LocationForm = {
    name: 'Lokasi Utama',
    address: '',
    latitude: -6.2,
    longitude: 106.8166667,
    radius_meters: 100,
    is_active: true,
};

export default function SchoolLocationIndex({ location }: Props) {
    const { data, setData, put, processing, errors } = useForm<LocationForm>({
        name: location?.name ?? defaultLocation.name,
        address: location?.address ?? defaultLocation.address,
        latitude: location?.latitude ?? defaultLocation.latitude,
        longitude: location?.longitude ?? defaultLocation.longitude,
        radius_meters: location?.radius_meters ?? defaultLocation.radius_meters,
        is_active: location?.is_active ?? defaultLocation.is_active,
    });
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => setMapReady(true), 0);

        return () => window.clearTimeout(timeout);
    }, []);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        put(SchoolLocationController.store.url(), {
            preserveScroll: true,
        });
    }

    async function useCurrentGps() {
        setGpsLoading(true);
        setGpsError(null);

        try {
            const position = await getBrowserPosition();

            setData((values) => ({
                ...values,
                latitude: Number(position.latitude.toFixed(7)),
                longitude: Number(position.longitude.toFixed(7)),
            }));
        } catch (error) {
            setGpsError(
                error instanceof Error
                    ? error.message
                    : 'Lokasi tidak bisa dibaca.',
            );
        } finally {
            setGpsLoading(false);
        }
    }

    return (
        <>
            <Head title="Lokasi Sekolah" />

            <div className="grid h-full flex-1 gap-4 p-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
                <form
                    onSubmit={submit}
                    className="h-fit rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                >
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Absensi radius
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Lokasi Sekolah
                        </h1>
                    </div>

                    <div className="mt-6 grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama lokasi</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(event) =>
                                    setData('address', event.target.value)
                                }
                            />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="latitude">Latitude</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="0.0000001"
                                    value={data.latitude}
                                    onChange={(event) =>
                                        setData(
                                            'latitude',
                                            Number(event.target.value),
                                        )
                                    }
                                    required
                                />
                                <InputError message={errors.latitude} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="0.0000001"
                                    value={data.longitude}
                                    onChange={(event) =>
                                        setData(
                                            'longitude',
                                            Number(event.target.value),
                                        )
                                    }
                                    required
                                />
                                <InputError message={errors.longitude} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={useCurrentGps}
                                disabled={gpsLoading}
                            >
                                <Navigation />
                                {gpsLoading
                                    ? 'Membaca GPS...'
                                    : 'Pakai GPS sekarang'}
                            </Button>
                            {gpsError && (
                                <p className="text-sm text-destructive">
                                    {gpsError}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="radius_meters">Radius meter</Label>
                            <Input
                                id="radius_meters"
                                type="number"
                                min="10"
                                max="1000"
                                value={data.radius_meters}
                                onChange={(event) =>
                                    setData(
                                        'radius_meters',
                                        Number(event.target.value),
                                    )
                                }
                                required
                            />
                            <InputError message={errors.radius_meters} />
                        </div>

                        <label className="flex items-center gap-3 text-sm font-medium">
                            <Checkbox
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked === true)
                                }
                            />
                            Aktif
                        </label>
                        <InputError message={errors.is_active} />

                        <Button disabled={processing} className="w-full">
                            Simpan lokasi
                        </Button>
                    </div>
                </form>

                {mapReady ? (
                    <Suspense
                        fallback={
                            <section className="min-h-[560px] rounded-lg border border-sidebar-border/70 bg-muted/30 dark:border-sidebar-border" />
                        }
                    >
                        <SchoolLocationMap
                            latitude={data.latitude}
                            longitude={data.longitude}
                            radius={data.radius_meters}
                            gpsLoading={gpsLoading}
                            onUseCurrentGps={useCurrentGps}
                            onChange={(latitude, longitude) => {
                                setData((values) => ({
                                    ...values,
                                    latitude,
                                    longitude,
                                }));
                            }}
                        />
                    </Suspense>
                ) : (
                    <section className="min-h-[560px] rounded-lg border border-sidebar-border/70 bg-muted/30 dark:border-sidebar-border" />
                )}
            </div>
        </>
    );
}

SchoolLocationIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/school-location',
        },
        {
            title: 'Lokasi Sekolah',
            href: '/admin/school-location',
        },
    ],
};

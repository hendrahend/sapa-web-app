import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Camera,
    CheckCircle2,
    Clock,
    MapPin,
    Navigation,
    Plus,
    RotateCcw,
    Send,
    ShieldAlert,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getBrowserPosition } from '@/lib/geolocation';

type SchoolClass = {
    id: number;
    name: string;
    grade_level: string | null;
    academic_year: string | null;
};

type SchoolLocation = {
    id: number;
    name: string;
    address: string | null;
    radius_meters: number;
};

type AttendanceSession = {
    id: number;
    title: string;
    attendance_date: string;
    starts_at: string;
    late_after: string | null;
    ends_at: string;
    status: string;
    records_count?: number;
    school_class: Pick<SchoolClass, 'id' | 'name'>;
    school_location: Pick<
        SchoolLocation,
        'id' | 'name' | 'address' | 'radius_meters'
    > & {
        latitude?: number;
        longitude?: number;
    };
};

type Student = {
    id: number;
    name: string;
    school_class?: Pick<SchoolClass, 'id' | 'name'> | null;
} | null;

type AttendanceRecord = {
    id: number;
    status: string;
    checked_in_at: string | null;
    distance_from_school_meters: number | null;
    is_within_radius: boolean | null;
    verification_status: string;
    session?: {
        id: number;
        title: string;
        attendance_date: string;
    };
} | null;

type TodayRecord = {
    id: number;
    status: string;
    checked_in_at: string | null;
    distance_from_school_meters: number | null;
    is_within_radius: boolean | null;
    verification_status: string;
    student: {
        id: number;
        name: string;
        nis: string | null;
        school_class: Pick<SchoolClass, 'id' | 'name'> | null;
    } | null;
    session: {
        id: number;
        title: string;
        attendance_date: string;
        school_class: Pick<SchoolClass, 'id' | 'name'> | null;
    } | null;
};

type Props = {
    schoolClasses: SchoolClass[];
    schoolLocations: SchoolLocation[];
    sessions: AttendanceSession[];
    activeSession: AttendanceSession | null;
    latestRecord: AttendanceRecord;
    todayRecords: TodayRecord[];
    student: Student;
    stats: {
        presentToday: number;
        lateToday: number;
        needsReview: number;
    };
};

type SessionForm = {
    school_class_id: string;
    school_location_id: string;
    title: string;
    attendance_date: string;
    starts_at: string;
    late_after: string;
    ends_at: string;
    notes: string;
};

type CheckInForm = {
    attendance_session_id: string;
    latitude: string;
    longitude: string;
    location_accuracy_meters: string;
    selfie: File | null;
};

type SessionPreset = 'morning' | 'midday' | 'custom';

function today() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function formatTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return value.slice(0, 5);
}

function formatClock(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function statusLabel(status: string) {
    const labels: Record<string, string> = {
        hadir: 'Hadir',
        terlambat: 'Terlambat',
        izin: 'Izin',
        sakit: 'Sakit',
        alfa: 'Alfa',
        pending: 'Menunggu',
        approved: 'Disetujui',
        rejected: 'Ditolak',
        open: 'Aktif',
        closed: 'Ditutup',
        draft: 'Draft',
    };

    return labels[status] ?? status;
}

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Hadir hari ini',
            value: stats.presentToday,
            icon: CheckCircle2,
        },
        {
            label: 'Terlambat',
            value: stats.lateToday,
            icon: Clock,
        },
        {
            label: 'Perlu verifikasi',
            value: stats.needsReview,
            icon: ShieldAlert,
        },
    ];
}

const sessionPresets: Record<
    Exclude<SessionPreset, 'custom'>,
    Pick<SessionForm, 'title' | 'starts_at' | 'late_after' | 'ends_at'>
> = {
    morning: {
        title: 'Absensi pagi',
        starts_at: '06:30',
        late_after: '07:00',
        ends_at: '08:00',
    },
    midday: {
        title: 'Absensi siang',
        starts_at: '12:30',
        late_after: '13:00',
        ends_at: '13:30',
    },
};

export default function AttendanceIndex({
    schoolClasses,
    schoolLocations,
    sessions,
    activeSession,
    latestRecord,
    todayRecords,
    student,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canManageAttendance = auth.permissions.includes('attendance.manage');
    const canCheckIn =
        auth.permissions.includes('attendance.own.view') &&
        !canManageAttendance;
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [sessionPreset, setSessionPreset] =
        useState<SessionPreset>('morning');
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const sessionForm = useForm<SessionForm>({
        school_class_id: schoolClasses[0]?.id.toString() ?? '',
        school_location_id: schoolLocations[0]?.id.toString() ?? '',
        title: sessionPresets.morning.title,
        attendance_date: today(),
        starts_at: sessionPresets.morning.starts_at,
        late_after: sessionPresets.morning.late_after,
        ends_at: sessionPresets.morning.ends_at,
        notes: '',
    });

    const checkInForm = useForm<CheckInForm>({
        attendance_session_id: activeSession?.id.toString() ?? '',
        latitude: '',
        longitude: '',
        location_accuracy_meters: '',
        selfie: null,
    });

    const checkInErrors = checkInForm.errors as typeof checkInForm.errors & {
        student?: string;
    };

    const filteredTodayRecords = useMemo(
        () =>
            selectedClassFilter === 'all'
                ? todayRecords
                : todayRecords.filter((record) => {
                      const classId =
                          record.student?.school_class?.id ??
                          record.session?.school_class?.id;

                      return classId?.toString() === selectedClassFilter;
                  }),
        [selectedClassFilter, todayRecords],
    );

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());

            if (selfiePreview) {
                URL.revokeObjectURL(selfiePreview);
            }
        };
    }, [selfiePreview]);

    function createSession(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        sessionForm.post('/attendance/sessions', {
            preserveScroll: true,
            onSuccess: () => setIsSessionModalOpen(false),
        });
    }

    function openSessionModal() {
        sessionForm.clearErrors();
        setIsSessionModalOpen(true);
    }

    function applySessionPreset(preset: SessionPreset) {
        setSessionPreset(preset);

        if (preset === 'custom') {
            return;
        }

        sessionForm.setData((values) => ({
            ...values,
            ...sessionPresets[preset],
        }));
    }

    function submitCheckIn(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        checkInForm.post('/attendance/check-in', {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    async function startCamera() {
        setCameraError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraActive(true);
        } catch {
            setCameraError('Kamera tidak bisa dibuka. Periksa izin browser.');
        }
    }

    function captureSelfie() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    return;
                }

                if (selfiePreview) {
                    URL.revokeObjectURL(selfiePreview);
                }

                const file = new File([blob], `selfie-${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                });

                checkInForm.setData('selfie', file);
                setSelfiePreview(URL.createObjectURL(file));
            },
            'image/jpeg',
            0.9,
        );
    }

    async function getCurrentLocation() {
        setLocationLoading(true);
        checkInForm.clearErrors(
            'latitude',
            'longitude',
            'location_accuracy_meters',
        );

        try {
            const position = await getBrowserPosition();

            checkInForm.setData((values) => ({
                ...values,
                latitude: position.latitude.toFixed(7),
                longitude: position.longitude.toFixed(7),
                location_accuracy_meters: Math.round(
                    position.accuracy,
                ).toString(),
            }));
        } catch (error) {
            checkInForm.setError(
                'latitude',
                error instanceof Error
                    ? error.message
                    : 'Lokasi tidak bisa dibaca.',
            );
        } finally {
            setLocationLoading(false);
        }
    }

    return (
        <>
            <Head title="Absensi" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Kehadiran siswa
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Absensi
                    </h1>
                </section>

                {canManageAttendance && (
                    <section className="grid gap-4 md:grid-cols-3">
                        {statItems(stats).map((item) => (
                            <div key={item.label} className="sapa-soft-card p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <item.icon className="size-4 text-primary" />
                                </div>
                                <p className="mt-3 text-2xl font-semibold">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </section>
                )}

                <section
                    className={`grid gap-4 ${
                        canCheckIn && canManageAttendance
                            ? 'xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'
                            : ''
                    }`}
                >
                    {canCheckIn && (
                        <div className="grid gap-4">
                            <form
                                onSubmit={submitCheckIn}
                                className="sapa-card p-5"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-primary">
                                            Absen hari ini
                                        </p>
                                        <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                                            {student?.name ?? 'Akun siswa'}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {student?.school_class?.name ??
                                                'Data kelas belum terhubung'}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            activeSession
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        className="w-fit"
                                    >
                                        {activeSession
                                            ? 'Sesi aktif'
                                            : 'Belum ada sesi'}
                                    </Badge>
                                </div>

                                <div className="mt-5 grid gap-4">
                                    {!student && (
                                        <Alert>
                                            <ShieldAlert />
                                            <AlertTitle>
                                                Data siswa belum terhubung
                                            </AlertTitle>
                                            <AlertDescription>
                                                Admin perlu menghubungkan akun
                                                ini dengan data siswa.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {!activeSession && (
                                        <Alert>
                                            <Clock />
                                            <AlertTitle>
                                                Tidak ada sesi aktif
                                            </AlertTitle>
                                            <AlertDescription>
                                                Sesi absensi kelas hari ini
                                                belum dibuka.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {activeSession && (
                                        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-semibold">
                                                        {activeSession.title}
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {formatTime(
                                                            activeSession.starts_at,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatTime(
                                                            activeSession.ends_at,
                                                        )}
                                                        , terlambat setelah{' '}
                                                        {formatTime(
                                                            activeSession.late_after,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="size-4" />
                                                        {
                                                            activeSession
                                                                .school_location
                                                                .name
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="overflow-hidden rounded-lg border border-sidebar-border/70 bg-black dark:border-sidebar-border">
                                        {selfiePreview ? (
                                            <img
                                                src={selfiePreview}
                                                alt="Preview selfie"
                                                className="aspect-video w-full object-cover"
                                            />
                                        ) : (
                                            <video
                                                ref={videoRef}
                                                className="aspect-video w-full object-cover"
                                                playsInline
                                                muted
                                            />
                                        )}
                                        <canvas
                                            ref={canvasRef}
                                            className="hidden"
                                        />
                                    </div>

                                    {cameraError && (
                                        <p className="text-sm text-destructive">
                                            {cameraError}
                                        </p>
                                    )}
                                    <InputError
                                        message={checkInForm.errors.selfie}
                                    />

                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={startCamera}
                                        >
                                            <Video />
                                            Kamera
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={captureSelfie}
                                            disabled={!cameraActive}
                                        >
                                            <Camera />
                                            Selfie
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={getCurrentLocation}
                                            disabled={locationLoading}
                                        >
                                            <Navigation />
                                            {locationLoading
                                                ? 'Lokasi...'
                                                : 'Lokasi'}
                                        </Button>
                                    </div>

                                    {(checkInForm.data.latitude ||
                                        checkInForm.data.longitude) && (
                                        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                                            Lokasi terbaca:{' '}
                                            {checkInForm.data.latitude},{' '}
                                            {checkInForm.data.longitude}
                                            {checkInForm.data
                                                .location_accuracy_meters &&
                                                ` - akurasi ${checkInForm.data.location_accuracy_meters} m`}
                                        </div>
                                    )}

                                    <InputError
                                        message={checkInForm.errors.latitude}
                                    />
                                    <InputError
                                        message={checkInForm.errors.longitude}
                                    />
                                    <InputError
                                        message={
                                            checkInForm.errors
                                                .location_accuracy_meters
                                        }
                                    />
                                    <InputError
                                        message={
                                            checkInForm.errors
                                                .attendance_session_id
                                        }
                                    />
                                    <InputError
                                        message={checkInErrors.student}
                                    />

                                    <Button
                                        className="h-12"
                                        disabled={
                                            checkInForm.processing ||
                                            !activeSession ||
                                            !student
                                        }
                                    >
                                        <Send />
                                        Kirim Absensi
                                    </Button>
                                </div>
                            </form>

                            {latestRecord && (
                                <div className="sapa-soft-card p-4">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Absensi terakhir
                                    </p>
                                    <div className="mt-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {latestRecord.session?.title ??
                                                    'Sesi absensi'}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {latestRecord.checked_in_at
                                                    ? formatDate(
                                                          latestRecord.checked_in_at,
                                                      )
                                                    : '-'}
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {statusLabel(latestRecord.status)}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                                        <p>
                                            Jarak:{' '}
                                            {latestRecord.distance_from_school_meters ??
                                                '-'}{' '}
                                            m
                                        </p>
                                        <p>
                                            Verifikasi:{' '}
                                            {statusLabel(
                                                latestRecord.verification_status,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {canManageAttendance && (
                        <div className="grid gap-4">
                            <section className="sapa-card overflow-hidden">
                                <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 dark:border-sidebar-border md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Hari ini
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Murid yang sudah absen
                                        </h2>
                                    </div>

                                    <div className="w-full md:w-64">
                                        <Select
                                            value={selectedClassFilter}
                                            onValueChange={
                                                setSelectedClassFilter
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Filter kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua kelas
                                                </SelectItem>
                                                {schoolClasses.map(
                                                    (schoolClass) => (
                                                        <SelectItem
                                                            key={schoolClass.id}
                                                            value={schoolClass.id.toString()}
                                                        >
                                                            {schoolClass.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">
                                                    Siswa
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Sesi
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Jam
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Lokasi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                            {filteredTodayRecords.length ===
                                                0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="px-4 py-6 text-center text-muted-foreground"
                                                    >
                                                        Belum ada murid yang
                                                        absen untuk filter ini.
                                                    </td>
                                                </tr>
                                            )}

                                            {filteredTodayRecords.map(
                                                (record) => (
                                                    <tr key={record.id}>
                                                        <td className="px-4 py-3 align-top">
                                                            <p className="font-medium">
                                                                {record.student
                                                                    ?.name ??
                                                                    '-'}
                                                            </p>
                                                            <p className="mt-1 text-muted-foreground">
                                                                {record.student
                                                                    ?.school_class
                                                                    ?.name ??
                                                                    record
                                                                        .session
                                                                        ?.school_class
                                                                        ?.name ??
                                                                    '-'}
                                                            </p>
                                                            {record.student
                                                                ?.nis && (
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    NIS:{' '}
                                                                    {
                                                                        record
                                                                            .student
                                                                            .nis
                                                                    }
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {record.session
                                                                ?.title ?? '-'}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {formatClock(
                                                                record.checked_in_at,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="grid gap-2">
                                                                <Badge variant="secondary">
                                                                    {statusLabel(
                                                                        record.status,
                                                                    )}
                                                                </Badge>
                                                                <span className="text-muted-foreground">
                                                                    {statusLabel(
                                                                        record.verification_status,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="grid gap-1 text-muted-foreground">
                                                                <span>
                                                                    {record.distance_from_school_meters ??
                                                                        '-'}{' '}
                                                                    m
                                                                </span>
                                                                <span>
                                                                    {record.is_within_radius
                                                                        ? 'Dalam radius'
                                                                        : 'Di luar radius'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="sapa-card overflow-hidden">
                                <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 dark:border-sidebar-border sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Guru/Admin
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Sesi absensi
                                        </h2>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={openSessionModal}
                                    >
                                        <Plus />
                                        Buat Sesi
                                    </Button>
                                </div>
                                <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {sessions.length === 0 && (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            Belum ada sesi absensi.
                                        </div>
                                    )}

                                    {sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">
                                                        {session.title}
                                                    </p>
                                                    <Badge variant="outline">
                                                        {statusLabel(
                                                            session.status,
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                    <span>
                                                        {formatDate(
                                                            session.attendance_date,
                                                        )}
                                                    </span>
                                                    <span>
                                                        {formatTime(
                                                            session.starts_at,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatTime(
                                                            session.ends_at,
                                                        )}
                                                    </span>
                                                    <span>
                                                        {
                                                            session.school_class
                                                                .name
                                                        }
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="size-3.5" />
                                                        {
                                                            session
                                                                .school_location
                                                                .name
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <RotateCcw className="size-4" />
                                                {session.records_count ?? 0}{' '}
                                                record
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </section>

                {canManageAttendance && (
                    <Dialog
                        open={isSessionModalOpen}
                        onOpenChange={setIsSessionModalOpen}
                    >
                        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Buat sesi absensi</DialogTitle>
                                <DialogDescription>
                                    Pilih jadwal cepat, kelas, dan lokasi.
                                    Detail waktu tetap bisa diubah saat custom.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={createSession} className="grid gap-4">
                                <div className="grid gap-2 sm:grid-cols-3">
                                    <Button
                                        type="button"
                                        variant={
                                            sessionPreset === 'morning'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            applySessionPreset('morning')
                                        }
                                    >
                                        Pagi
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            sessionPreset === 'midday'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            applySessionPreset('midday')
                                        }
                                    >
                                        Siang
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            sessionPreset === 'custom'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            applySessionPreset('custom')
                                        }
                                    >
                                        Custom
                                    </Button>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Judul</Label>
                                    <Input
                                        value={sessionForm.data.title}
                                        onChange={(event) =>
                                            sessionForm.setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={sessionForm.errors.title}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Kelas</Label>
                                        <Select
                                            value={
                                                sessionForm.data.school_class_id
                                            }
                                            onValueChange={(value) =>
                                                sessionForm.setData(
                                                    'school_class_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schoolClasses.map(
                                                    (schoolClass) => (
                                                        <SelectItem
                                                            key={schoolClass.id}
                                                            value={schoolClass.id.toString()}
                                                        >
                                                            {schoolClass.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                sessionForm.errors
                                                    .school_class_id
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Lokasi</Label>
                                        <Select
                                            value={
                                                sessionForm.data
                                                    .school_location_id
                                            }
                                            onValueChange={(value) =>
                                                sessionForm.setData(
                                                    'school_location_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih lokasi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schoolLocations.map(
                                                    (location) => (
                                                        <SelectItem
                                                            key={location.id}
                                                            value={location.id.toString()}
                                                        >
                                                            {location.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                sessionForm.errors
                                                    .school_location_id
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-4">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label>Tanggal</Label>
                                        <Input
                                            type="date"
                                            value={
                                                sessionForm.data.attendance_date
                                            }
                                            onChange={(event) =>
                                                sessionForm.setData(
                                                    'attendance_date',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                sessionForm.errors
                                                    .attendance_date
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Mulai</Label>
                                        <Input
                                            type="time"
                                            value={sessionForm.data.starts_at}
                                            onChange={(event) => {
                                                setSessionPreset('custom');
                                                sessionForm.setData(
                                                    'starts_at',
                                                    event.target.value,
                                                );
                                            }}
                                        />
                                        <InputError
                                            message={
                                                sessionForm.errors.starts_at
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Selesai</Label>
                                        <Input
                                            type="time"
                                            value={sessionForm.data.ends_at}
                                            onChange={(event) => {
                                                setSessionPreset('custom');
                                                sessionForm.setData(
                                                    'ends_at',
                                                    event.target.value,
                                                );
                                            }}
                                        />
                                        <InputError
                                            message={sessionForm.errors.ends_at}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Batas terlambat</Label>
                                    <Input
                                        type="time"
                                        value={sessionForm.data.late_after}
                                        onChange={(event) => {
                                            setSessionPreset('custom');
                                            sessionForm.setData(
                                                'late_after',
                                                event.target.value,
                                            );
                                        }}
                                    />
                                    <InputError
                                        message={sessionForm.errors.late_after}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Catatan</Label>
                                    <textarea
                                        value={sessionForm.data.notes}
                                        onChange={(event) =>
                                            sessionForm.setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={sessionForm.errors.notes}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsSessionModalOpen(false)
                                        }
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={sessionForm.processing}
                                    >
                                        Buka sesi
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [
        {
            title: 'Absensi',
            href: '/attendance',
        },
    ],
};

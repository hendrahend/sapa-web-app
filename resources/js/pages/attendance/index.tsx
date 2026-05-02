import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Camera,
    CheckCircle2,
    Clock,
    FileHeart,
    FileSpreadsheet,
    FileText,
    HeartPulse,
    MapPin,
    Navigation,
    Plus,
    RotateCcw,
    Send,
    ShieldAlert,
    Video,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
    review_reason?: string;
    session?: {
        id: number;
        title: string;
        attendance_date: string;
    };
} | null;

type AttendanceRecordRow = {
    id: number;
    status: string;
    checked_in_at: string | null;
    distance_from_school_meters: number | null;
    is_within_radius: boolean | null;
    selfie_url: string | null;
    latitude: number | null;
    longitude: number | null;
    location_accuracy_meters: number | null;
    verification_status: string;
    review_reason?: string;
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

type Excuse = {
    id: number;
    type: 'izin' | 'sakit';
    status: 'pending' | 'approved' | 'rejected';
    start_date: string;
    end_date: string;
    reason: string;
    attachment_url: string | null;
    admin_notes: string | null;
    reviewer: { id: number; name: string } | null;
    student: {
        id: number;
        name: string;
        nis: string | null;
        school_class: Pick<SchoolClass, 'id' | 'name'> | null;
    } | null;
    created_at: string | null;
};

type Props = {
    schoolClasses: SchoolClass[];
    schoolLocations: SchoolLocation[];
    sessions: AttendanceSession[];
    activeSession: AttendanceSession | null;
    latestRecord: AttendanceRecord;
    attendanceRecords?: AttendanceRecordRow[];
    todayRecords: AttendanceRecordRow[];
    reviewRecords: AttendanceRecordRow[];
    excuses: Excuse[];
    student: Student;
    filters: {
        date: string;
        school_class_id: string;
    };
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

type ExcuseForm = {
    type: 'izin' | 'sakit';
    start_date: string;
    end_date: string;
    reason: string;
    attachment: File | null;
};

type ExportForm = {
    start_date: string;
    end_date: string;
    school_class_id: string;
    status: string;
    verification_status: string;
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

function dateRange(start: string, end: string) {
    if (start === end) {
        return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
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

function reviewStatusBadge(status: string) {
    const className =
        status === 'pending'
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
            : status === 'approved'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300';

    return (
        <Badge variant="outline" className={className}>
            {statusLabel(status)}
        </Badge>
    );
}

function formatCoordinate(value: number | null) {
    return value === null ? '-' : value.toFixed(6);
}

function excuseTypeBadge(type: Excuse['type']) {
    if (type === 'sakit') {
        return (
            <Badge
                variant="outline"
                className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
            >
                <HeartPulse className="mr-1 size-3" /> Sakit
            </Badge>
        );
    }

    return (
        <Badge
            variant="outline"
            className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
        >
            <FileText className="mr-1 size-3" /> Izin
        </Badge>
    );
}

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Hadir',
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
    attendanceRecords,
    todayRecords,
    reviewRecords,
    excuses,
    student,
    filters,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canManageAttendance = [
        'attendance.create',
        'attendance.update',
        'attendance.delete',
    ].some((permission) => auth.permissions.includes(permission));
    const canCheckIn =
        auth.permissions.includes('attendance.own.create') &&
        !canManageAttendance;
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] =
        useState<AttendanceRecordRow | null>(null);
    const [rejectExcuse, setRejectExcuse] = useState<Excuse | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [sessionPreset, setSessionPreset] =
        useState<SessionPreset>('morning');
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedClassFilter, setSelectedClassFilter] = useState(
        filters.school_class_id,
    );
    const [exportForm, setExportForm] = useState<ExportForm>({
        start_date: filters.date,
        end_date: filters.date,
        school_class_id: filters.school_class_id,
        status: 'all',
        verification_status: 'all',
    });
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

    const excuseForm = useForm<ExcuseForm>({
        type: 'izin',
        start_date: today(),
        end_date: today(),
        reason: '',
        attachment: null,
    });

    const checkInErrors = checkInForm.errors as typeof checkInForm.errors & {
        student?: string;
    };

    const recordsForSelectedDate = attendanceRecords ?? todayRecords;

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

    function applyAttendanceFilters(
        nextDate = selectedDate,
        nextClass = selectedClassFilter,
    ) {
        router.get(
            '/attendance',
            {
                date: nextDate,
                school_class_id: nextClass === 'all' ? undefined : nextClass,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }

    function submitExcuse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        excuseForm.post('/attendance/excuses', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                excuseForm.reset();
                setIsExcuseModalOpen(false);
            },
        });
    }

    function decideExcuse(
        excuse: Excuse,
        status: 'approved' | 'rejected',
        notes?: string,
    ) {
        router.patch(
            `/attendance/excuses/${excuse.id}`,
            { status, admin_notes: notes ?? null },
            { preserveScroll: true },
        );
    }

    function verifyRecord(
        record: AttendanceRecordRow,
        verificationStatus: 'approved' | 'rejected',
    ) {
        router.patch(
            `/attendance/records/${record.id}/verification`,
            { verification_status: verificationStatus },
            { preserveScroll: true },
        );
    }

    function runExport() {
        const params = new URLSearchParams();

        if (exportForm.start_date) {
            params.set('start_date', exportForm.start_date);
        }

        if (exportForm.end_date) {
            params.set('end_date', exportForm.end_date);
        }

        if (exportForm.school_class_id !== 'all') {
            params.set('school_class_id', exportForm.school_class_id);
        }

        if (exportForm.status !== 'all') {
            params.set('status', exportForm.status);
        }

        if (exportForm.verification_status !== 'all') {
            params.set('verification_status', exportForm.verification_status);
        }

        window.location.href = `/attendance/export?${params.toString()}`;
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
                <section className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        {/* <p className="text-sm font-medium text-muted-foreground">
                            Rekap nilai dan tugas LMS
                        </p> */}
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Absensi
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Rekap kehadiran siswa per sesi, sesi absensi, dan
                            izin/sakit.
                        </p>
                    </div>
                    {canManageAttendance && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsExportModalOpen(true)}
                        >
                            <FileSpreadsheet />
                            Export Excel
                        </Button>
                    )}
                </section>

                {canManageAttendance && (
                    <section className="grid gap-4 md:grid-cols-3">
                        {statItems(stats).map((item) => (
                            <div
                                key={item.label}
                                className="sapa-soft-card p-4"
                            >
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
                                    <div className="flex flex-wrap items-center gap-2">
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
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setIsExcuseModalOpen(true)
                                            }
                                        >
                                            <FileHeart className="size-4" />
                                            Izin / Sakit
                                        </Button>
                                    </div>
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
                            <section className="sapa-card p-4">
                                <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Filter rekap
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Lihat absensi per tanggal
                                        </h2>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="attendance-date-filter">
                                            Tanggal
                                        </Label>
                                        <Input
                                            id="attendance-date-filter"
                                            type="date"
                                            value={selectedDate}
                                            onChange={(event) => {
                                                setSelectedDate(
                                                    event.target.value,
                                                );
                                                applyAttendanceFilters(
                                                    event.target.value,
                                                    selectedClassFilter,
                                                );
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Kelas</Label>
                                        <Select
                                            value={selectedClassFilter}
                                            onValueChange={(value) => {
                                                setSelectedClassFilter(value);
                                                applyAttendanceFilters(
                                                    selectedDate,
                                                    value,
                                                );
                                            }}
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
                                    <Button
                                        type="button"
                                        onClick={openSessionModal}
                                    >
                                        <Plus />
                                        Buat Sesi
                                    </Button>
                                </div>
                            </section>

                            <section className="sapa-card overflow-hidden">
                                <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 md:flex-row md:items-center md:justify-between dark:border-sidebar-border">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {formatDate(selectedDate)}
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Murid yang sudah absen
                                        </h2>
                                    </div>
                                    <Badge variant="outline">
                                        {recordsForSelectedDate.length} record
                                    </Badge>
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
                                            {recordsForSelectedDate.length ===
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

                                            {recordsForSelectedDate.map(
                                                (record) => (
                                                    <tr
                                                        key={record.id}
                                                        tabIndex={0}
                                                        role="button"
                                                        onClick={() =>
                                                            setSelectedRecord(
                                                                record,
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                    'Enter' ||
                                                                event.key ===
                                                                    ' '
                                                            ) {
                                                                event.preventDefault();
                                                                setSelectedRecord(
                                                                    record,
                                                                );
                                                            }
                                                        }}
                                                        className="cursor-pointer transition hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                                                    >
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
                                                                {reviewStatusBadge(
                                                                    record.verification_status,
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="grid gap-1 text-muted-foreground">
                                                                {record.distance_from_school_meters ===
                                                                null ? (
                                                                    <span>
                                                                        -
                                                                    </span>
                                                                ) : (
                                                                    <span>
                                                                        {
                                                                            record.distance_from_school_meters
                                                                        }{' '}
                                                                        m
                                                                    </span>
                                                                )}
                                                                {record.is_within_radius !==
                                                                    null && (
                                                                    <span>
                                                                        {record.is_within_radius
                                                                            ? 'Dalam radius'
                                                                            : 'Di luar radius'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                                <div className="sapa-card overflow-hidden">
                                    <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Perlu verifikasi
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Check-in yang perlu dicek
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Biasanya muncul karena lokasi siswa
                                            di luar radius sekolah atau data
                                            lokasi belum lengkap.
                                        </p>
                                    </div>
                                    <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {reviewRecords.length === 0 && (
                                            <div className="p-4 text-sm text-muted-foreground">
                                                Tidak ada check-in yang perlu
                                                diverifikasi untuk filter ini.
                                            </div>
                                        )}

                                        {reviewRecords.map((record) => (
                                            <div
                                                key={record.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() =>
                                                    setSelectedRecord(record)
                                                }
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.key === 'Enter' ||
                                                        event.key === ' '
                                                    ) {
                                                        event.preventDefault();
                                                        setSelectedRecord(
                                                            record,
                                                        );
                                                    }
                                                }}
                                                className="grid cursor-pointer gap-3 p-4 transition hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none md:grid-cols-[1fr_auto]"
                                            >
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium">
                                                            {record.student
                                                                ?.name ?? '-'}
                                                        </p>
                                                        <Badge variant="outline">
                                                            {record.session
                                                                ?.school_class
                                                                ?.name ??
                                                                record.student
                                                                    ?.school_class
                                                                    ?.name ??
                                                                '-'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {record.session
                                                            ?.title ?? '-'}{' '}
                                                        ·{' '}
                                                        {formatClock(
                                                            record.checked_in_at,
                                                        )}
                                                    </p>
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {record.review_reason}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            verifyRecord(
                                                                record,
                                                                'approved',
                                                            );
                                                        }}
                                                    >
                                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            verifyRecord(
                                                                record,
                                                                'rejected',
                                                            );
                                                        }}
                                                    >
                                                        <XCircle className="size-4 text-rose-500" />
                                                        Tolak
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="sapa-card overflow-hidden">
                                    <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Izin / sakit
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Pengajuan di tanggal ini
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Disetujui di sini akan otomatis
                                            masuk sebagai record izin/sakit pada
                                            sesi kelas yang sesuai.
                                        </p>
                                    </div>
                                    <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {excuses.length === 0 && (
                                            <div className="p-4 text-sm text-muted-foreground">
                                                Belum ada pengajuan izin/sakit
                                                pada tanggal ini.
                                            </div>
                                        )}

                                        {excuses.map((excuse) => (
                                            <div
                                                key={excuse.id}
                                                className="grid gap-3 p-4"
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {excuseTypeBadge(
                                                        excuse.type,
                                                    )}
                                                    {reviewStatusBadge(
                                                        excuse.status,
                                                    )}
                                                    <span className="text-sm text-muted-foreground">
                                                        {dateRange(
                                                            excuse.start_date,
                                                            excuse.end_date,
                                                        )}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {excuse.student?.name ??
                                                            '-'}
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {excuse.student
                                                            ?.school_class
                                                            ?.name ?? '-'}
                                                    </p>
                                                </div>
                                                <p className="text-sm leading-6 text-muted-foreground">
                                                    {excuse.reason}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {excuse.attachment_url && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <a
                                                                href={
                                                                    excuse.attachment_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <FileText className="size-4" />
                                                                Lampiran
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {excuse.status ===
                                                        'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    decideExcuse(
                                                                        excuse,
                                                                        'approved',
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2 className="size-4 text-emerald-500" />
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setRejectExcuse(
                                                                        excuse,
                                                                    )
                                                                }
                                                            >
                                                                <XCircle className="size-4 text-rose-500" />
                                                                Tolak
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="sapa-card overflow-hidden">
                                <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sidebar-border">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {formatDate(selectedDate)}
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">
                                            Sesi absensi
                                        </h2>
                                    </div>
                                    <Badge variant="outline">
                                        {sessions.length} sesi
                                    </Badge>
                                </div>
                                <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {sessions.length === 0 && (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            Belum ada sesi absensi pada tanggal
                                            ini.
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
                                                {session.records_count ??
                                                    0}{' '}
                                                record
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </section>

                {canCheckIn && (
                    <Dialog
                        open={isExcuseModalOpen}
                        onOpenChange={(open) => {
                            setIsExcuseModalOpen(open);

                            if (!open) {
                                excuseForm.reset();
                                excuseForm.clearErrors();
                            }
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajukan izin / sakit</DialogTitle>
                                <DialogDescription>
                                    Kirim pengajuan dari menu Absensi. Setelah
                                    disetujui guru/admin, data akan masuk ke
                                    rekap kehadiran.
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={submitExcuse}
                                className="grid gap-4"
                                encType="multipart/form-data"
                            >
                                <div className="grid gap-2">
                                    <Label>Jenis</Label>
                                    <Select
                                        value={excuseForm.data.type}
                                        onValueChange={(value) =>
                                            excuseForm.setData(
                                                'type',
                                                value as ExcuseForm['type'],
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="izin">
                                                Izin
                                            </SelectItem>
                                            <SelectItem value="sakit">
                                                Sakit
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={excuseForm.errors.type}
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Tanggal mulai</Label>
                                        <Input
                                            type="date"
                                            value={excuseForm.data.start_date}
                                            onChange={(event) =>
                                                excuseForm.setData(
                                                    'start_date',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                excuseForm.errors.start_date
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tanggal selesai</Label>
                                        <Input
                                            type="date"
                                            value={excuseForm.data.end_date}
                                            onChange={(event) =>
                                                excuseForm.setData(
                                                    'end_date',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={excuseForm.errors.end_date}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Alasan</Label>
                                    <textarea
                                        rows={3}
                                        value={excuseForm.data.reason}
                                        onChange={(event) =>
                                            excuseForm.setData(
                                                'reason',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: demam tinggi, periksa ke dokter."
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={excuseForm.errors.reason}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Lampiran (opsional)</Label>
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(event) =>
                                            excuseForm.setData(
                                                'attachment',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Surat dokter / bukti lain. JPG, PNG,
                                        WEBP, atau PDF maksimal 4 MB.
                                    </p>
                                    <InputError
                                        message={excuseForm.errors.attachment}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsExcuseModalOpen(false)
                                        }
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={excuseForm.processing}
                                    >
                                        Kirim pengajuan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {canManageAttendance && (
                    <Dialog
                        open={isExportModalOpen}
                        onOpenChange={setIsExportModalOpen}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Export rekap absensi</DialogTitle>
                                <DialogDescription>
                                    Pilih rentang tanggal, kelas, status
                                    kehadiran, dan status verifikasi yang ingin
                                    dimasukkan ke Excel.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Tanggal mulai</Label>
                                        <Input
                                            type="date"
                                            value={exportForm.start_date}
                                            onChange={(event) =>
                                                setExportForm((value) => ({
                                                    ...value,
                                                    start_date:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tanggal selesai</Label>
                                        <Input
                                            type="date"
                                            value={exportForm.end_date}
                                            onChange={(event) =>
                                                setExportForm((value) => ({
                                                    ...value,
                                                    end_date:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Kelas</Label>
                                    <Select
                                        value={exportForm.school_class_id}
                                        onValueChange={(value) =>
                                            setExportForm((current) => ({
                                                ...current,
                                                school_class_id: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
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

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Status kehadiran</Label>
                                        <Select
                                            value={exportForm.status}
                                            onValueChange={(value) =>
                                                setExportForm((current) => ({
                                                    ...current,
                                                    status: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua status
                                                </SelectItem>
                                                <SelectItem value="hadir">
                                                    Hadir
                                                </SelectItem>
                                                <SelectItem value="terlambat">
                                                    Terlambat
                                                </SelectItem>
                                                <SelectItem value="izin">
                                                    Izin
                                                </SelectItem>
                                                <SelectItem value="sakit">
                                                    Sakit
                                                </SelectItem>
                                                <SelectItem value="alfa">
                                                    Alfa
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Verifikasi</Label>
                                        <Select
                                            value={
                                                exportForm.verification_status
                                            }
                                            onValueChange={(value) =>
                                                setExportForm((current) => ({
                                                    ...current,
                                                    verification_status: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">
                                                    Semua
                                                </SelectItem>
                                                <SelectItem value="pending">
                                                    Menunggu
                                                </SelectItem>
                                                <SelectItem value="approved">
                                                    Disetujui
                                                </SelectItem>
                                                <SelectItem value="rejected">
                                                    Ditolak
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsExportModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="button" onClick={runExport}>
                                    <FileSpreadsheet />
                                    Export
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {canManageAttendance && (
                    <Dialog
                        open={selectedRecord !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedRecord(null);
                            }
                        }}
                    >
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                            {selectedRecord && (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Detail check-in siswa
                                        </DialogTitle>
                                        <DialogDescription>
                                            Lihat foto, lokasi, dan status
                                            verifikasi untuk record absensi ini.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 bg-muted/30 dark:border-sidebar-border">
                                            {selectedRecord.selfie_url ? (
                                                <img
                                                    src={
                                                        selectedRecord.selfie_url
                                                    }
                                                    alt={`Selfie ${selectedRecord.student?.name ?? 'siswa'}`}
                                                    className="aspect-[3/4] w-full object-cover"
                                                />
                                            ) : (
                                                <div className="grid aspect-[3/4] place-items-center p-6 text-center text-sm text-muted-foreground">
                                                    <div>
                                                        <Camera className="mx-auto mb-3 size-8" />
                                                        Foto selfie belum
                                                        tersedia.
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-3">
                                            <div className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Siswa
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {selectedRecord.student
                                                        ?.name ?? '-'}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {selectedRecord.student
                                                        ?.school_class?.name ??
                                                        selectedRecord.session
                                                            ?.school_class
                                                            ?.name ??
                                                        '-'}
                                                    {selectedRecord.student?.nis
                                                        ? ` · NIS ${selectedRecord.student.nis}`
                                                        : ''}
                                                </p>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Sesi
                                                    </p>
                                                    <p className="mt-1 font-medium">
                                                        {selectedRecord.session
                                                            ?.title ?? '-'}
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {selectedRecord.session
                                                            ?.attendance_date
                                                            ? formatDate(
                                                                  selectedRecord
                                                                      .session
                                                                      .attendance_date,
                                                              )
                                                            : '-'}{' '}
                                                        ·{' '}
                                                        {formatClock(
                                                            selectedRecord.checked_in_at,
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Status
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Badge variant="secondary">
                                                            {statusLabel(
                                                                selectedRecord.status,
                                                            )}
                                                        </Badge>
                                                        {reviewStatusBadge(
                                                            selectedRecord.verification_status,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Lokasi check-in
                                                </p>
                                                <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                                    <p>
                                                        Jarak:{' '}
                                                        {selectedRecord.distance_from_school_meters ===
                                                        null
                                                            ? '-'
                                                            : `${selectedRecord.distance_from_school_meters} m`}
                                                    </p>
                                                    <p>
                                                        Radius:{' '}
                                                        {selectedRecord.is_within_radius ===
                                                        null
                                                            ? '-'
                                                            : selectedRecord.is_within_radius
                                                              ? 'Dalam radius'
                                                              : 'Di luar radius'}
                                                    </p>
                                                    <p>
                                                        Latitude:{' '}
                                                        {formatCoordinate(
                                                            selectedRecord.latitude,
                                                        )}
                                                    </p>
                                                    <p>
                                                        Longitude:{' '}
                                                        {formatCoordinate(
                                                            selectedRecord.longitude,
                                                        )}
                                                    </p>
                                                    <p>
                                                        Akurasi:{' '}
                                                        {selectedRecord.location_accuracy_meters ===
                                                        null
                                                            ? '-'
                                                            : `${selectedRecord.location_accuracy_meters} m`}
                                                    </p>
                                                </div>
                                                {selectedRecord.latitude !==
                                                    null &&
                                                    selectedRecord.longitude !==
                                                        null && (
                                                        <Button
                                                            asChild
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-3"
                                                        >
                                                            <a
                                                                href={`https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <MapPin />
                                                                Buka lokasi
                                                            </a>
                                                        </Button>
                                                    )}
                                            </div>

                                            {selectedRecord.review_reason && (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                                                    {
                                                        selectedRecord.review_reason
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setSelectedRecord(null)
                                            }
                                        >
                                            Tutup
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                verifyRecord(
                                                    selectedRecord,
                                                    'rejected',
                                                );
                                                setSelectedRecord(null);
                                            }}
                                        >
                                            <XCircle className="size-4 text-rose-500" />
                                            Tolak
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                verifyRecord(
                                                    selectedRecord,
                                                    'approved',
                                                );
                                                setSelectedRecord(null);
                                            }}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Setujui
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                )}

                {canManageAttendance && (
                    <Dialog
                        open={rejectExcuse !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setRejectExcuse(null);
                                setRejectNotes('');
                            }
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tolak pengajuan</DialogTitle>
                                <DialogDescription>
                                    Tambahkan catatan singkat agar siswa tahu
                                    alasan pengajuan belum bisa disetujui.
                                </DialogDescription>
                            </DialogHeader>
                            <textarea
                                rows={3}
                                value={rejectNotes}
                                onChange={(event) =>
                                    setRejectNotes(event.target.value)
                                }
                                placeholder="Contoh: bukti belum jelas."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setRejectExcuse(null)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (rejectExcuse) {
                                            decideExcuse(
                                                rejectExcuse,
                                                'rejected',
                                                rejectNotes,
                                            );
                                        }

                                        setRejectExcuse(null);
                                        setRejectNotes('');
                                    }}
                                >
                                    Tolak pengajuan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

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

                            <form
                                onSubmit={createSession}
                                className="grid gap-4"
                            >
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

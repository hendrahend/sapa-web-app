import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    BellRing,
    CalendarCheck2,
    ClipboardCheck,
    Clock3,
    FileText,
    GraduationCap,
    MapPin,
    MoreHorizontal,
    Sparkles,
    Trophy,
    UserRound,
} from 'lucide-react';
import { dashboard } from '@/routes';

type Overview = {
    weeklyGoal: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
};

type Attendance = {
    status: string | null;
    checkedInAt: string | null;
    isWithinRadius: boolean | null;
    distance: number | null;
    school: string | null;
    activeSession: {
        id: number;
        title: string;
        className: string | null;
        radius: number | null;
    } | null;
};

type Assessment = {
    recentScore: number | null;
    average: number | null;
    subject: string | null;
    skill: string;
    feedback: string | null;
};

type LeaderboardItem = {
    id: number;
    name: string;
    className: string | null;
    xp: number;
};

type ProgressPoint = {
    label: string;
    attendance: number;
    scores: number;
};

type LmsSummary = {
    courses: number;
    materials: number;
    pendingAssignments: number;
    needsFeedback: number;
    nextAssignment: {
        title: string;
        course: string | null;
        dueAt: string | null;
    } | null;
};

type Props = {
    overview: Overview;
    attendance: Attendance;
    assessment: Assessment;
    leaderboard: LeaderboardItem[];
    progress: ProgressPoint[];
    lms: LmsSummary;
    stats: {
        students: number;
        sessionsToday: number;
        gradeAssessments: number;
        activeCourses: number;
    };
    student: {
        id: number;
        name: string;
        school_class?: {
            id: number;
            name: string;
        } | null;
    } | null;
};

function formatTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function attendanceLabel(status: string | null) {
    const labels: Record<string, string> = {
        hadir: 'Tepat waktu',
        terlambat: 'Terlambat',
        izin: 'Izin',
        sakit: 'Sakit',
        alfa: 'Alfa',
    };

    return status ? (labels[status] ?? status) : 'Belum absen';
}

function initials(name: string) {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function progressPath(points: ProgressPoint[], key: 'attendance' | 'scores') {
    const max = Math.max(1, ...points.map((point) => point[key]));

    return points
        .map((point, index) => {
            const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
            const y = 92 - (point[key] / max) * 72;

            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

function StatPill({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    icon: typeof CalendarCheck2;
}) {
    return (
        <div className="sapa-soft-card p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-foreground">
                {value}
            </p>
        </div>
    );
}

export default function Dashboard({
    overview,
    attendance,
    assessment,
    leaderboard,
    progress,
    lms,
    stats,
    student,
}: Props) {
    const { auth } = usePage().props;
    const xpProgress =
        overview.xpToNextLevel > 0
            ? Math.min(100, Math.round((overview.xp / overview.xpToNextLevel) * 100))
            : 0;
    const attendancePath = progressPath(progress, 'attendance');
    const scorePath = progressPath(progress, 'scores');

    return (
        <>
            <Head title="Dashboard" />

            <div className="sapa-page">
                {/* <header className="border-b border-slate-200 bg-white px-4 py-4 lg:px-6">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="grid size-11 place-items-center rounded-lg bg-emerald-600 text-white">
                                <AppLogoIcon className="size-7 fill-current" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-sky-700">
                                    SAPA
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    Sistem Absensi & Penilaian
                                </p>
                            </div>
                        </div>

                        <div className="hidden items-center gap-2 md:flex">
                            <Link
                                href="/attendance"
                                className="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-4 py-3 text-sm font-semibold text-slate-900"
                            >
                                <CalendarCheck2 className="size-5" />
                                Attendance
                            </Link>
                            <Link
                                href="/grades"
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                            >
                                <Bot className="size-5" />
                                AI Grade
                            </Link>
                            <Link
                                href="/lms"
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                            >
                                <FileText className="size-5" />
                                LMS
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                            <div className="grid size-10 place-items-center rounded-full bg-sky-100 text-sky-700">
                                <UserRound className="size-5" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-slate-950">
                                    {auth.user.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Level {overview.level}
                                </p>
                            </div>
                            <ChevronDown className="size-4 text-slate-500" />
                        </div>
                    </div>
                </header> */}

                <main className="mx-auto grid gap-5 px-2 py-6 lg:px-4">
                    <section className="sapa-card p-5">
                        <div className="grid gap-5 lg:grid-cols-[1fr_260px_1fr] lg:items-center">
                            <div>
                                <p className="text-sm font-semibold text-primary">
                                    Daily Overview
                                </p>
                                <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground">
                                    Halo, {student?.name ?? auth.user.name}
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {student?.school_class?.name ??
                                        'Pantau aktivitas sekolah hari ini'}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-4 border-y border-border/70 py-4 lg:border-x lg:border-y-0">
                                <div
                                    className="grid size-24 place-items-center rounded-full"
                                    style={{
                                        background: `conic-gradient(var(--primary) ${overview.weeklyGoal}%, var(--muted) 0)`,
                                    }}
                                >
                                    <div className="grid size-16 place-items-center rounded-full bg-card text-xl font-bold text-foreground">
                                        {overview.weeklyGoal}%
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {overview.weeklyGoal}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Weekly Goal
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="sapa-gradient grid size-20 place-items-center text-primary-foreground shadow-lg shadow-sky-500/20 [clip-path:polygon(25%_6%,75%_6%,100%_50%,75%_94%,25%_94%,0_50%)]">
                                    <div className="text-center leading-tight">
                                        <p className="text-xs">Level</p>
                                        <p className="text-2xl font-bold">
                                            {overview.level}
                                        </p>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <p className="font-semibold text-foreground">
                                            XP Bar
                                        </p>
                                        <p className="text-muted-foreground">
                                            {overview.xp} XP
                                        </p>
                                    </div>
                                    <div className="mt-3 h-4 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="sapa-gradient h-full rounded-full"
                                            style={{
                                                width: `${xpProgress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatPill
                            label="Siswa aktif"
                            value={stats.students}
                            icon={UserRound}
                        />
                        <StatPill
                            label="Sesi hari ini"
                            value={stats.sessionsToday}
                            icon={CalendarCheck2}
                        />
                        <StatPill
                            label="Komponen nilai"
                            value={stats.gradeAssessments}
                            icon={GraduationCap}
                        />
                        <StatPill
                            label="Course aktif"
                            value={stats.activeCourses}
                            icon={FileText}
                        />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-2">
                        <article className="sapa-card p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold tracking-normal text-foreground">
                                    Kehadiran Real-time
                                </h2>
                                <MoreHorizontal className="size-5 text-muted-foreground" />
                            </div>

                            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_250px] md:items-center">
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        Disapa: {formatTime(attendance.checkedInAt)}
                                    </p>
                                    <p
                                        className={`mt-1 text-base font-semibold ${
                                            attendance.status === 'terlambat'
                                                ? 'text-amber-600'
                                            : attendance.status
                                                  ? 'text-emerald-600'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {attendanceLabel(attendance.status)}
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        {attendance.school ??
                                            'Lokasi sekolah belum terbaca'}{' '}
                                        {attendance.distance !== null &&
                                            `- ${attendance.distance} m dari titik sekolah`}
                                    </p>
                                    <Link
                                        href="/attendance"
                                        className="sapa-gradient mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-sky-500/20 md:w-56"
                                    >
                                        <ClipboardCheck className="size-4" />
                                        Buka Absensi
                                    </Link>
                                </div>

                                <div className="relative h-40 overflow-hidden rounded-lg border border-border bg-muted">
                                    <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_oklch,var(--border)_72%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--border)_72%,transparent)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70" />
                                    <div className="absolute top-5 left-6 h-28 w-10 rotate-12 rounded-full bg-amber-200" />
                                    <div className="absolute right-6 bottom-4 h-24 w-24 rounded-lg bg-emerald-100" />
                                    <div className="absolute top-14 left-28 grid size-11 place-items-center rounded-full bg-red-500 text-white shadow-lg">
                                        <MapPin className="size-6 fill-current" />
                                    </div>
                                    <div className="absolute right-3 bottom-2 text-[10px] font-medium text-muted-foreground">
                                        Radius SAPA
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article className="sapa-card p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold tracking-normal text-foreground">
                                    AI Assessment
                                </h2>
                                <MoreHorizontal className="size-5 text-muted-foreground" />
                            </div>

                            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_170px]">
                                <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-primary/30 bg-secondary/55 p-5 text-center">
                                    <div>
                                        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
                                            <Sparkles className="size-6" />
                                        </div>
                                        <p className="mt-4 text-lg font-bold text-foreground">
                                            Drop your Essay
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            AI feedback akan memakai data LMS dan
                                            nilai siswa.
                                        </p>
                                        <Link
                                            href="/lms"
                                            className="sapa-gradient mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
                                        >
                                            Drop Assessment
                                        </Link>
                                    </div>
                                </div>

                                <div className="border-l border-border/70 pl-5">
                                    <p className="text-sm text-muted-foreground">
                                        Skill
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className="text-lg font-semibold text-foreground">
                                            Logic
                                        </p>
                                        <span className="rounded-md bg-primary/15 px-2 py-1 text-sm font-semibold text-primary">
                                            {assessment.skill}
                                        </span>
                                    </div>
                                    <p className="mt-5 text-sm text-muted-foreground">
                                        Recent score
                                    </p>
                                    <p className="mt-1 text-5xl font-bold text-foreground">
                                        {assessment.recentScore ?? '-'}
                                    </p>
                                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                                        {assessment.feedback ??
                                            'Belum ada feedback nilai terbaru.'}
                                    </p>
                                </div>
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                        <article className="sapa-card p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="size-6 text-primary" />
                                    <h2 className="text-xl font-bold tracking-normal text-foreground">
                                        Leaderboard Kelas
                                    </h2>
                                </div>
                                <MoreHorizontal className="size-5 text-muted-foreground" />
                            </div>

                            <div className="mt-5 grid gap-3">
                                {leaderboard.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada data XP siswa.
                                    </p>
                                )}

                                {leaderboard.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 ${
                                            index === 0
                                                ? 'bg-primary/10'
                                                : 'bg-transparent'
                                        }`}
                                    >
                                        <div className="text-center text-sm font-semibold text-muted-foreground">
                                            {index + 1}
                                        </div>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                                                {initials(item.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-foreground">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.className ?? '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-foreground">
                                            {item.xp} XP
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="sapa-card p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold tracking-normal text-foreground">
                                    Ringkasan Kemajuan
                                </h2>
                                <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
                                    Graphs
                                </span>
                            </div>

                            <div className="mt-6">
                                <svg
                                    viewBox="0 0 100 100"
                                    className="h-56 w-full overflow-visible"
                                    preserveAspectRatio="none"
                                >
                                    {[20, 40, 60, 80].map((line) => (
                                        <line
                                            key={line}
                                            x1="0"
                                            x2="100"
                                            y1={line}
                                            y2={line}
                                            stroke="var(--border)"
                                            strokeWidth="0.6"
                                        />
                                    ))}
                                    <path
                                        d={`${attendancePath} L 100 100 L 0 100 Z`}
                                        fill="#38bdf8"
                                        opacity="0.16"
                                    />
                                    <path
                                        d={attendancePath}
                                        fill="none"
                                        stroke="#0ea5e9"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d={scorePath}
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
                                    {progress.map((point) => (
                                        <span key={point.label}>
                                            {point.label}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="size-3 rounded-full bg-sky-500" />
                                        Absensi
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="size-3 rounded-full bg-emerald-500" />
                                        Nilai
                                    </span>
                                </div>
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
                        <article className="sapa-card p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold tracking-normal text-foreground">
                                    LMS Hari Ini
                                </h2>
                                <Link
                                    href="/lms"
                                    className="sapa-gradient rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-sky-500/20"
                                >
                                    Buka LMS
                                </Link>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <StatPill
                                    label="Course"
                                    value={lms.courses}
                                    icon={FileText}
                                />
                                <StatPill
                                    label="Materi"
                                    value={lms.materials}
                                    icon={ClipboardCheck}
                                />
                                <StatPill
                                    label="Tugas"
                                    value={lms.pendingAssignments}
                                    icon={Clock3}
                                />
                            </div>

                            <div className="mt-5 rounded-lg border border-border bg-muted/70 p-4">
                                <p className="text-sm font-semibold text-foreground">
                                    Tugas berikutnya
                                </p>
                                <p className="mt-2 text-lg font-bold text-foreground">
                                    {lms.nextAssignment?.title ??
                                        'Belum ada tugas aktif'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {lms.nextAssignment?.course ?? '-'} -{' '}
                                    {formatDateTime(
                                        lms.nextAssignment?.dueAt ?? null,
                                    )}
                                </p>
                            </div>
                        </article>

                        <article className="rounded-lg border border-primary/25 bg-linear-to-br from-secondary/80 to-primary/10 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="grid size-11 place-items-center rounded-lg bg-card text-primary shadow-sm">
                                    <BellRing className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-primary">
                                        Notifikasi Orang Tua
                                    </p>
                                    <h2 className="text-lg font-bold text-foreground">
                                        Siap dikirim dari data absensi
                                    </h2>
                                </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                Saat modul notifikasi diaktifkan, orang tua bisa
                                menerima kabar kehadiran, keterlambatan, nilai,
                                dan tugas yang belum dikumpulkan.
                            </p>
                            <div className="mt-5 flex items-center gap-3 rounded-lg bg-card/85 p-3 shadow-sm">
                                <Award className="size-5 text-primary" />
                                <p className="text-sm font-medium text-foreground">
                                    XP akan bertambah dari hadir tepat waktu,
                                    nilai baik, dan tugas LMS.
                                </p>
                            </div>
                        </article>
                    </section>
                </main>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

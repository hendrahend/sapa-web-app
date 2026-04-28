import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    BellRing,
    BookOpenCheck,
    CalendarCheck2,
    ClipboardCheck,
    FileText,
    GraduationCap,
    MapPin,
    Sparkles,
    Trophy,
    UserRound,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

type Role = 'admin' | 'guru' | 'siswa' | 'orang_tua';

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

type StaffSummary = {
    role: 'admin' | 'guru';
    today: {
        sessionsOpen: number;
        attendanceCount: number;
        totalStudents: number;
        attendanceRate: number;
    };
    pendingGrading: number;
    pendingRedemptions: number;
    teacherCourseCount: number | null;
};

type ParentChild = {
    id: number;
    name: string;
    className: string | null;
    todayStatus: string | null;
    todayCheckedInAt: string | null;
    latestScore: {
        value: number;
        subject: string | null;
        gradedAt: string | null;
    } | null;
};

type ParentSummary = {
    children: ParentChild[];
    unreadNotifications: number;
};

type Props = {
    role: Role;
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
    staff: StaffSummary | null;
    parentSummary: ParentSummary | null;
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

type ChartTooltipPayload = {
    color?: string;
    name?: string;
    value?: number | string;
};

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: ChartTooltipPayload[];
    label?: string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="font-semibold text-foreground">{label}</p>
            {payload.map((entry, index) => (
                <p
                    key={`${entry.name ?? 'value'}-${index}`}
                    className="mt-1 flex items-center gap-2 text-muted-foreground"
                >
                    <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ background: entry.color }}
                    />
                    <span>{entry.name}</span>
                    <span className="font-semibold text-foreground">
                        {entry.value}
                    </span>
                </p>
            ))}
        </div>
    );
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
        <div className="sapa-card p-4">
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

function ProgressChart({ data }: { data: ProgressPoint[] }) {
    const chartData = useMemo(
        () =>
            data.map((point) => ({
                day: point.label,
                Absensi: point.attendance,
                Nilai: point.scores,
            })),
        [data],
    );

    return (
        <article className="sapa-card p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-normal text-foreground">
                    Aktivitas 7 hari terakhir
                </h2>
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    Absensi & nilai
                </span>
            </div>
            <div className="mt-5 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="absensiFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--chart-2)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--chart-2)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                            <linearGradient
                                id="nilaiFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--chart-1)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--chart-1)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="var(--border)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="day"
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            width={32}
                        />
                        <Tooltip
                            content={<ChartTooltip />}
                            cursor={{
                                stroke: 'var(--border)',
                                strokeWidth: 1,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Absensi"
                            stroke="var(--chart-2)"
                            strokeWidth={2.5}
                            fill="url(#absensiFill)"
                        />
                        <Area
                            type="monotone"
                            dataKey="Nilai"
                            stroke="var(--chart-1)"
                            strokeWidth={2.5}
                            fill="url(#nilaiFill)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[var(--chart-2)]" />
                    Absensi
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[var(--chart-1)]" />
                    Nilai
                </span>
            </div>
        </article>
    );
}

function LeaderboardCard({ items }: { items: LeaderboardItem[] }) {
    return (
        <article className="sapa-card p-5">
            <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                <h2 className="text-base font-semibold tracking-normal text-foreground">
                    Leaderboard XP
                </h2>
            </div>

            <div className="mt-4 grid gap-2">
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Belum ada data XP siswa.
                    </p>
                )}

                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg px-3 py-2.5 ${
                            index === 0 ? 'bg-primary/10' : 'bg-transparent'
                        }`}
                    >
                        <div className="text-center text-sm font-semibold text-muted-foreground">
                            {index + 1}
                        </div>
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                                {initials(item.name)}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.className ?? '-'}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {item.xp} XP
                        </p>
                    </div>
                ))}
            </div>
        </article>
    );
}

function StudentDashboard({
    overview,
    attendance,
    assessment,
    leaderboard,
    progress,
    lms,
    stats,
    student,
    userName,
}: {
    overview: Overview;
    attendance: Attendance;
    assessment: Assessment;
    leaderboard: LeaderboardItem[];
    progress: ProgressPoint[];
    lms: LmsSummary;
    stats: Props['stats'];
    student: Props['student'];
    userName: string;
}) {
    const xpProgress =
        overview.xpToNextLevel > 0
            ? Math.min(
                  100,
                  Math.round((overview.xp / overview.xpToNextLevel) * 100),
              )
            : 0;

    return (
        <div className="flex flex-col gap-5">
            <section className="sapa-card p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_240px_1fr] lg:items-center">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                            Ringkasan harian
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
                            Halo, {student?.name ?? userName}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {student?.school_class?.name ??
                                'Pantau aktivitas sekolah hari ini'}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 border-y border-border/70 py-4 lg:border-x lg:border-y-0">
                        <div
                            className="grid size-20 place-items-center rounded-full"
                            style={{
                                background: `conic-gradient(var(--primary) ${overview.weeklyGoal}%, var(--muted) 0)`,
                            }}
                        >
                            <div className="grid size-14 place-items-center rounded-full bg-card text-base font-semibold text-foreground">
                                {overview.weeklyGoal}%
                            </div>
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-foreground">
                                {overview.weeklyGoal}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Target absensi minggu ini
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="grid size-16 place-items-center rounded-lg bg-primary/10 text-primary">
                            <div className="text-center leading-tight">
                                <p className="text-[10px] font-medium uppercase">
                                    Level
                                </p>
                                <p className="text-xl font-semibold">
                                    {overview.level}
                                </p>
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-xs">
                                <p className="font-medium text-foreground">
                                    Progress XP
                                </p>
                                <p className="text-muted-foreground">
                                    {overview.xp} / {overview.xpToNextLevel} XP
                                </p>
                            </div>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="sapa-gradient h-full rounded-full transition-[width]"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatPill
                    label="Course aktif"
                    value={lms.courses}
                    icon={FileText}
                />
                <StatPill
                    label="Tugas tersedia"
                    value={lms.pendingAssignments}
                    icon={ClipboardCheck}
                />
                <StatPill
                    label="Materi"
                    value={lms.materials}
                    icon={BookOpenCheck}
                />
                <StatPill
                    label="Sesi absen hari ini"
                    value={stats.sessionsToday}
                    icon={CalendarCheck2}
                />
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
                <article className="sapa-card p-5">
                    <h2 className="text-base font-semibold tracking-normal text-foreground">
                        Kehadiran terkini
                    </h2>

                    <div className="mt-4 grid gap-5 md:grid-cols-[1fr_180px] md:items-center">
                        <div>
                            <p className="text-xl font-semibold text-foreground">
                                Disapa: {formatTime(attendance.checkedInAt)}
                            </p>
                            <p
                                className={`mt-1 text-sm font-medium ${
                                    attendance.status === 'terlambat'
                                        ? 'text-amber-600'
                                        : attendance.status
                                          ? 'text-emerald-600'
                                          : 'text-muted-foreground'
                                }`}
                            >
                                {attendanceLabel(attendance.status)}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {attendance.school ??
                                    'Lokasi sekolah belum terbaca'}
                                {attendance.distance !== null &&
                                    ` · ${attendance.distance} m`}
                            </p>
                            <Link
                                href="/attendance"
                                className="sapa-gradient mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm md:w-48"
                            >
                                <ClipboardCheck className="size-4" />
                                Buka Absensi
                            </Link>
                        </div>

                        <div className="relative h-32 overflow-hidden rounded-lg border border-border bg-muted">
                            <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_oklch,var(--border)_72%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--border)_72%,transparent)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />
                            <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-rose-500 text-white shadow-md">
                                <MapPin className="size-5 fill-current" />
                            </div>
                            <div className="absolute right-2 bottom-1 text-[10px] font-medium text-muted-foreground">
                                Radius SAPA
                            </div>
                        </div>
                    </div>
                </article>

                <article className="sapa-card p-5">
                    <h2 className="text-base font-semibold tracking-normal text-foreground">
                        Penilaian terbaru
                    </h2>

                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_140px]">
                        <div className="rounded-lg border border-dashed border-primary/30 bg-secondary/40 p-4">
                            <div className="flex items-center gap-3">
                                <div className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
                                    <GraduationCap className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {assessment.subject ?? 'Belum dinilai'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Mapel terakhir
                                    </p>
                                </div>
                            </div>
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                                {assessment.feedback ??
                                    'Belum ada feedback nilai terbaru.'}
                            </p>
                        </div>

                        <div className="border-l border-border/70 pl-4">
                            <p className="text-xs text-muted-foreground">
                                Skor terkini
                            </p>
                            <p className="mt-1 text-4xl font-semibold text-foreground">
                                {assessment.recentScore ?? '-'}
                            </p>
                            <Badge variant="secondary" className="mt-3">
                                {assessment.skill}
                            </Badge>
                        </div>
                    </div>
                </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <ProgressChart data={progress} />
                <LeaderboardCard items={leaderboard} />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <article className="sapa-card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold tracking-normal text-foreground">
                            LMS hari ini
                        </h2>
                        <Link
                            href="/lms"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Buka LMS →
                        </Link>
                    </div>

                    <div className="mt-4 rounded-lg border border-border bg-muted/60 p-4">
                        <p className="text-xs text-muted-foreground uppercase">
                            Tugas berikutnya
                        </p>
                        <p className="mt-1 text-base font-semibold text-foreground">
                            {lms.nextAssignment?.title ??
                                'Belum ada tugas aktif'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {lms.nextAssignment?.course ?? '-'} ·{' '}
                            {formatDateTime(lms.nextAssignment?.dueAt ?? null)}
                        </p>
                    </div>
                </article>

                <article className="sapa-card p-5">
                    <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Award className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase">
                                XP & badge
                            </p>
                            <h2 className="text-base font-semibold text-foreground">
                                Tukar XP di Toko
                            </h2>
                        </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Hadir tepat waktu, nilai bagus, dan tugas LMS dikerjakan
                        menambah XP. XP bisa kamu tukar menjadi reward.
                    </p>
                    <Link
                        href="/rewards"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                        <Sparkles className="size-4" />
                        Buka Toko Reward
                    </Link>
                </article>
            </section>
        </div>
    );
}

function StaffDashboard({
    staff,
    stats,
    progress,
    leaderboard,
    userName,
}: {
    staff: StaffSummary;
    stats: Props['stats'];
    progress: ProgressPoint[];
    leaderboard: LeaderboardItem[];
    userName: string;
}) {
    const isAdmin = staff.role === 'admin';

    return (
        <div className="flex flex-col gap-5">
            <section className="sapa-card p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                            {isAdmin ? 'Ringkasan sekolah' : 'Ringkasan kelas'}
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
                            Selamat datang, {userName}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {isAdmin
                                ? 'Pantau aktivitas sekolah, kehadiran, dan tugas yang menunggu tindakan.'
                                : 'Pantau kelas yang kamu ampu dan tugas yang menunggu dinilai.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/attendance"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                        >
                            <CalendarCheck2 className="size-4" />
                            Absensi
                        </Link>
                        <Link
                            href="/grades"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                        >
                            <GraduationCap className="size-4" />
                            Penilaian
                        </Link>
                        <Link
                            href="/class-insights"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                        >
                            <Sparkles className="size-4" />
                            Insight kelas
                        </Link>
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
                    label="Sesi absen hari ini"
                    value={stats.sessionsToday}
                    icon={CalendarCheck2}
                />
                <StatPill
                    label="Course aktif"
                    value={
                        isAdmin
                            ? stats.activeCourses
                            : (staff.teacherCourseCount ?? stats.activeCourses)
                    }
                    icon={FileText}
                />
                <StatPill
                    label="Komponen nilai"
                    value={stats.gradeAssessments}
                    icon={GraduationCap}
                />
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
                <article className="sapa-card p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Kehadiran hari ini
                        </p>
                        <CalendarCheck2 className="size-4 text-emerald-600" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-foreground">
                        {staff.today.attendanceCount}
                        <span className="ml-1 text-base font-normal text-muted-foreground">
                            / {staff.today.totalStudents} siswa
                        </span>
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                                width: `${Math.min(staff.today.attendanceRate, 100)}%`,
                            }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {staff.today.attendanceRate}% kehadiran ·{' '}
                        {staff.today.sessionsOpen} sesi terbuka
                    </p>
                </article>

                <article className="sapa-card p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Tugas menunggu dinilai
                        </p>
                        <ClipboardCheck className="size-4 text-amber-600" />
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-foreground">
                        {staff.pendingGrading}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Submission siswa belum diberi skor.
                    </p>
                    <Link
                        href="/lms/grading"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        Buka antrean penilaian →
                    </Link>
                </article>

                <article className="sapa-card p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            {isAdmin
                                ? 'Penukaran reward pending'
                                : 'Course aktif kamu'}
                        </p>
                        {isAdmin ? (
                            <Sparkles className="size-4 text-rose-500" />
                        ) : (
                            <BookOpenCheck className="size-4 text-sky-600" />
                        )}
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-foreground">
                        {isAdmin
                            ? staff.pendingRedemptions
                            : (staff.teacherCourseCount ?? 0)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {isAdmin
                            ? 'Pengajuan tukar XP yang menunggu approval.'
                            : 'Course LMS yang sedang kamu kelola.'}
                    </p>
                    <Link
                        href={isAdmin ? '/admin/rewards' : '/lms'}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        {isAdmin ? 'Tinjau pengajuan' : 'Buka LMS'} →
                    </Link>
                </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <ProgressChart data={progress} />
                <LeaderboardCard items={leaderboard} />
            </section>
        </div>
    );
}

function ParentDashboard({
    summary,
    progress,
    leaderboard,
    userName,
}: {
    summary: ParentSummary;
    progress: ProgressPoint[];
    leaderboard: LeaderboardItem[];
    userName: string;
}) {
    return (
        <div className="flex flex-col gap-5">
            <section className="sapa-card p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                            Pantauan anak
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
                            Halo, {userName}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Status absensi & nilai anak Anda hari ini.
                        </p>
                    </div>
                    <Link
                        href="/notifications"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                    >
                        <BellRing className="size-4" />
                        Notifikasi
                        {summary.unreadNotifications > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {summary.unreadNotifications}
                            </Badge>
                        )}
                    </Link>
                </div>
            </section>

            {summary.children.length === 0 ? (
                <section className="sapa-card grid place-items-center gap-2 p-10 text-center">
                    <Users className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                        Belum ada anak tertaut
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Hubungi admin sekolah untuk menautkan akun siswa anak
                        Anda.
                    </p>
                </section>
            ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {summary.children.map((child) => (
                        <article
                            key={child.id}
                            className="sapa-card flex flex-col gap-3 p-5"
                        >
                            <div className="flex items-start gap-3">
                                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                                    {initials(child.name)}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {child.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {child.className ?? 'Belum berkelas'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground uppercase">
                                    Absensi hari ini
                                </p>
                                <p
                                    className={`mt-1 text-sm font-semibold ${
                                        child.todayStatus === 'terlambat'
                                            ? 'text-amber-600'
                                            : child.todayStatus
                                              ? 'text-emerald-600'
                                              : 'text-muted-foreground'
                                    }`}
                                >
                                    {attendanceLabel(child.todayStatus)}
                                    {child.todayCheckedInAt &&
                                        ` · ${formatTime(child.todayCheckedInAt)}`}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground uppercase">
                                    Nilai terbaru
                                </p>
                                {child.latestScore ? (
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {child.latestScore.value}
                                        <span className="ml-1 font-normal text-muted-foreground">
                                            · {child.latestScore.subject ?? '-'}
                                        </span>
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Belum ada nilai dirilis.
                                    </p>
                                )}
                            </div>
                        </article>
                    ))}
                </section>
            )}

            <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <ProgressChart data={progress} />
                <LeaderboardCard items={leaderboard} />
            </section>
        </div>
    );
}

export default function Dashboard({
    role,
    overview,
    attendance,
    assessment,
    leaderboard,
    progress,
    lms,
    stats,
    student,
    staff,
    parentSummary,
}: Props) {
    const { auth } = usePage().props;
    const userName = auth.user.name;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6">
                {role === 'siswa' && (
                    <StudentDashboard
                        overview={overview}
                        attendance={attendance}
                        assessment={assessment}
                        leaderboard={leaderboard}
                        progress={progress}
                        lms={lms}
                        stats={stats}
                        student={student}
                        userName={userName}
                    />
                )}
                {(role === 'admin' || role === 'guru') && staff && (
                    <StaffDashboard
                        staff={staff}
                        stats={stats}
                        progress={progress}
                        leaderboard={leaderboard}
                        userName={userName}
                    />
                )}
                {role === 'orang_tua' && parentSummary && (
                    <ParentDashboard
                        summary={parentSummary}
                        progress={progress}
                        leaderboard={leaderboard}
                        userName={userName}
                    />
                )}
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

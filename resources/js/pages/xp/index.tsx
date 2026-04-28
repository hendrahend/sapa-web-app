import { Head } from '@inertiajs/react';
import {
    Award,
    BookOpenCheck,
    CalendarCheck2,
    GraduationCap,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

type XpEvent = {
    id: number;
    source: 'attendance' | 'grade' | 'lms';
    points: number;
    reason: string | null;
    awarded_at: string | null;
};

type LeaderboardItem = {
    id: number;
    name: string | null;
    class_name: string | null;
    xp: number;
    level: number;
};

type BadgeItem = {
    key: string;
    title: string;
    description: string;
    achieved: boolean;
    progress: number;
};

type Props = {
    student: {
        id: number;
        name: string;
        class_name: string | null;
    } | null;
    progress: {
        xp: number;
        level: number;
        into_level: number;
        level_size: number;
        percent: number;
    };
    events: XpEvent[];
    badges: BadgeItem[];
    leaderboard: {
        class: LeaderboardItem[];
        school: LeaderboardItem[];
    };
    stats: {
        totalAwarded: number;
        studentsWithXp: number;
        levelThreshold: number;
    };
};

const sourceMeta = {
    attendance: {
        label: 'Absensi',
        icon: CalendarCheck2,
        color: 'text-emerald-600',
    },
    grade: { label: 'Nilai', icon: GraduationCap, color: 'text-amber-600' },
    lms: { label: 'LMS', icon: BookOpenCheck, color: 'text-sky-600' },
} as const;

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function XpIndex({
    student,
    progress,
    events,
    badges,
    leaderboard,
    stats,
}: Props) {
    const [scope, setScope] = useState<'class' | 'school'>(
        leaderboard.class.length > 0 ? 'class' : 'school',
    );
    const board = scope === 'class' ? leaderboard.class : leaderboard.school;

    return (
        <>
            <Head title="XP & Gamifikasi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Progres dan apresiasi
                    </p>
                    <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-normal text-foreground">
                        <Award className="size-6 text-amber-500" /> XP &
                        Gamifikasi
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Setiap absensi tepat waktu, nilai bagus, dan tugas LMS
                        yang dikumpulkan menambah XP. Naik level, kumpulkan
                        badge, dan lihat posisi di papan peringkat.
                    </p>
                </section>

                {/* Top stats */}
                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        label="Total XP diberikan"
                        value={stats.totalAwarded.toLocaleString('id-ID')}
                        icon={<Sparkles className="size-5 text-amber-500" />}
                    />
                    <StatCard
                        label="Siswa dengan XP"
                        value={stats.studentsWithXp.toLocaleString('id-ID')}
                        icon={<Users className="size-5 text-sky-500" />}
                    />
                    <StatCard
                        label="Threshold per level"
                        value={`${stats.levelThreshold} XP`}
                        icon={<Trophy className="size-5 text-emerald-500" />}
                    />
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Progress + recent events */}
                    <section className="space-y-6 lg:col-span-2">
                        <div className="rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border">
                            {student ? (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {student.class_name ??
                                                    'Tanpa kelas'}
                                            </p>
                                            <h2 className="text-xl font-semibold">
                                                {student.name}
                                            </h2>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">
                                                Level
                                            </p>
                                            <p className="text-3xl font-bold text-amber-500">
                                                {progress.level}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {progress.into_level} /{' '}
                                                {progress.level_size} XP
                                            </span>
                                            <span>{progress.percent}%</span>
                                        </div>
                                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-sidebar-border/40">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                                                style={{
                                                    width: `${progress.percent}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Total{' '}
                                            {progress.xp.toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            XP terkumpul.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Akun ini belum terhubung dengan data siswa,
                                    jadi belum punya XP pribadi. Statistik
                                    agregat tetap dapat dilihat di kartu di
                                    atas.
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border">
                            <h3 className="text-base font-semibold">
                                Aktivitas XP terakhir
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                25 event terbaru.
                            </p>

                            {events.length === 0 ? (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Belum ada XP. Lakukan absensi atau kumpulkan
                                    tugas untuk memulai.
                                </p>
                            ) : (
                                <ul className="mt-4 divide-y divide-sidebar-border/60">
                                    {events.map((e) => {
                                        const meta = sourceMeta[e.source];
                                        const Icon = meta?.icon ?? Sparkles;

                                        return (
                                            <li
                                                key={e.id}
                                                className="flex items-center justify-between gap-3 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex size-9 items-center justify-center rounded-full bg-muted">
                                                        <Icon
                                                            className={`size-4 ${meta?.color ?? 'text-foreground'}`}
                                                        />
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {e.reason ??
                                                                meta?.label}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDateTime(
                                                                e.awarded_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-semibold"
                                                >
                                                    +{e.points} XP
                                                </Badge>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* Leaderboard + badges */}
                    <section className="space-y-6">
                        <div className="rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-base font-semibold">
                                    Papan peringkat
                                </h3>
                                <div className="inline-flex rounded-md bg-muted p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setScope('class')}
                                        disabled={
                                            leaderboard.class.length === 0
                                        }
                                        className={`rounded px-2 py-1 transition ${
                                            scope === 'class'
                                                ? 'bg-background shadow'
                                                : 'text-muted-foreground'
                                        } ${
                                            leaderboard.class.length === 0
                                                ? 'cursor-not-allowed opacity-50'
                                                : ''
                                        }`}
                                    >
                                        Kelas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScope('school')}
                                        className={`rounded px-2 py-1 transition ${
                                            scope === 'school'
                                                ? 'bg-background shadow'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        Sekolah
                                    </button>
                                </div>
                            </div>

                            {board.length === 0 ? (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Belum ada XP yang tercatat.
                                </p>
                            ) : (
                                <ol className="mt-4 space-y-2">
                                    {board.map((row, idx) => {
                                        const isMe = student?.id === row.id;

                                        return (
                                            <li
                                                key={row.id}
                                                className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                                                    isMe
                                                        ? 'border-amber-400/60 bg-amber-50 dark:bg-amber-950/20'
                                                        : 'border-transparent bg-muted/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                                                            idx === 0
                                                                ? 'bg-amber-400 text-amber-950'
                                                                : idx === 1
                                                                  ? 'bg-zinc-300 text-zinc-800'
                                                                  : idx === 2
                                                                    ? 'bg-orange-300 text-orange-950'
                                                                    : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {row.name ?? '-'}
                                                            {isMe && (
                                                                <span className="ml-2 text-xs text-amber-600">
                                                                    (kamu)
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {row.class_name ??
                                                                '-'}{' '}
                                                            · Lv {row.level}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-semibold"
                                                >
                                                    {row.xp.toLocaleString(
                                                        'id-ID',
                                                    )}{' '}
                                                    XP
                                                </Badge>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border">
                            <h3 className="text-base font-semibold">Badge</h3>
                            <p className="text-xs text-muted-foreground">
                                Capai milestone untuk membuka badge.
                            </p>
                            <ul className="mt-4 space-y-3">
                                {badges.length === 0 && (
                                    <li className="text-sm text-muted-foreground">
                                        Badge muncul setelah ada aktivitas
                                        siswa.
                                    </li>
                                )}
                                {badges.map((b) => (
                                    <li
                                        key={b.key}
                                        className={`rounded-md border p-3 transition ${
                                            b.achieved
                                                ? 'border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/20'
                                                : 'border-sidebar-border/50 bg-muted/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold">
                                                {b.title}
                                            </p>
                                            {b.achieved ? (
                                                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                                                    Diraih
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    {b.progress}%
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {b.description}
                                        </p>
                                        {!b.achieved && (
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sidebar-border/40">
                                                <div
                                                    className="h-full bg-foreground/60"
                                                    style={{
                                                        width: `${b.progress}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                {icon}
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
    );
}

XpIndex.layout = {
    breadcrumbs: [
        {
            title: 'XP',
            href: '/xp',
        },
    ],
};

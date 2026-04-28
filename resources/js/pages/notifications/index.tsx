import { Head, router } from '@inertiajs/react';
import { Bell, BellOff, CalendarCheck2, GraduationCap } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type AttendanceData = {
    kind: 'attendance.recorded';
    student_id: number;
    student_name: string | null;
    attendance_record_id: number;
    status: string | null;
    status_label: string | null;
    school_name: string | null;
    is_within_radius: boolean;
    distance_meters: number | null;
    checked_in_at: string | null;
};

type GradeData = {
    kind: 'grade.released';
    grade_score_id: number;
    student_id: number;
    student_name: string | null;
    assessment_title: string | null;
    subject_name: string | null;
    score: number;
    max_score: number | null;
    feedback: string | null;
    graded_at: string | null;
};

type NotificationItem = {
    id: string;
    type: string;
    kind: 'attendance.recorded' | 'grade.released' | string | null;
    data: AttendanceData | GradeData | Record<string, unknown>;
    read_at: string | null;
    created_at: string | null;
};

type Props = {
    notifications: NotificationItem[];
    stats: {
        unread: number;
        total: number;
    };
};

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function isAttendance(d: NotificationItem['data']): d is AttendanceData {
    return (d as AttendanceData)?.kind === 'attendance.recorded';
}

function isGrade(d: NotificationItem['data']): d is GradeData {
    return (d as GradeData)?.kind === 'grade.released';
}

export default function NotificationsIndex({ notifications, stats }: Props) {
    const grouped = useMemo(() => {
        const today: NotificationItem[] = [];
        const earlier: NotificationItem[] = [];
        const todayStr = new Date().toDateString();

        for (const n of notifications) {
            if (
                n.created_at &&
                new Date(n.created_at).toDateString() === todayStr
            ) {
                today.push(n);
            } else {
                earlier.push(n);
            }
        }

        return { today, earlier };
    }, [notifications]);

    const markRead = (id: string) =>
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });

    const markAllRead = () =>
        router.post('/notifications/read-all', {}, { preserveScroll: true });

    return (
        <>
            <Head title="Notifikasi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="flex flex-wrap items-end justify-between gap-3 border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Inbox notifikasi
                        </p>
                        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                            <Bell className="size-6 text-amber-500" />{' '}
                            Notifikasi
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            Kabar absensi anak (hadir, terlambat, di luar
                            radius) dan nilai baru dikirim ke sini secara
                            realtime.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            {stats.unread} belum dibaca
                        </Badge>
                        <Badge variant="outline">{stats.total} total</Badge>
                        {stats.unread > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={markAllRead}
                            >
                                Tandai semua dibaca
                            </Button>
                        )}
                    </div>
                </section>

                {notifications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-sidebar-border/70 p-10 text-center text-sm text-muted-foreground">
                        <BellOff className="mx-auto size-8 text-muted-foreground/60" />
                        <p className="mt-3">Belum ada notifikasi.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {grouped.today.length > 0 && (
                            <NotificationGroup
                                label="Hari ini"
                                items={grouped.today}
                                onMarkRead={markRead}
                            />
                        )}
                        {grouped.earlier.length > 0 && (
                            <NotificationGroup
                                label="Sebelumnya"
                                items={grouped.earlier}
                                onMarkRead={markRead}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function NotificationGroup({
    label,
    items,
    onMarkRead,
}: {
    label: string;
    items: NotificationItem[];
    onMarkRead: (id: string) => void;
}) {
    return (
        <section>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </h2>
            <ul className="divide-y divide-sidebar-border/60 rounded-xl border border-sidebar-border/70 bg-background dark:border-sidebar-border">
                {items.map((n) => (
                    <NotificationRow
                        key={n.id}
                        item={n}
                        onMarkRead={onMarkRead}
                    />
                ))}
            </ul>
        </section>
    );
}

function NotificationRow({
    item,
    onMarkRead,
}: {
    item: NotificationItem;
    onMarkRead: (id: string) => void;
}) {
    const unread = !item.read_at;
    let icon = <Bell className="size-4" />;
    let title = 'Notifikasi';
    let message = '';
    let accent = 'bg-muted text-foreground';

    if (isAttendance(item.data)) {
        const d = item.data;
        icon = <CalendarCheck2 className="size-4" />;
        accent = d.is_within_radius
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
        title = `${d.student_name ?? 'Siswa'} ${d.status_label ?? 'tercatat'}`;
        const time = d.checked_in_at ? formatDateTime(d.checked_in_at) : '-';
        message = d.is_within_radius
            ? `Check-in ${time} di ${d.school_name ?? 'sekolah'}.`
            : `Check-in ${time}, ${d.distance_meters ?? '-'}m di luar radius — menunggu verifikasi guru.`;
    } else if (isGrade(item.data)) {
        const d = item.data;
        icon = <GraduationCap className="size-4" />;
        const score = d.score;
        accent =
            score >= 90
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : score >= 75
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
        title = `Nilai baru: ${d.assessment_title ?? 'Penilaian'}`;
        const subject = d.subject_name ? `${d.subject_name} · ` : '';
        message = `${subject}${d.student_name ?? 'Anak Anda'} mendapat ${score}${d.max_score ? '/' + d.max_score : ''}.${
            d.feedback ? ' Feedback: ' + d.feedback : ''
        }`;
    } else {
        title = item.type;
        message = JSON.stringify(item.data);
    }

    return (
        <li
            className={`flex items-start gap-3 p-4 ${unread ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}
        >
            <span
                className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${accent}`}
            >
                {icon}
            </span>
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{title}</p>
                    {unread && (
                        <span
                            className="size-2 rounded-full bg-amber-500"
                            aria-label="Belum dibaca"
                        />
                    )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                </p>
            </div>
            {unread && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkRead(item.id)}
                    className="text-xs"
                >
                    Tandai dibaca
                </Button>
            )}
        </li>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Notifikasi',
            href: '/notifications',
        },
    ],
};

import { Head, router, useForm } from '@inertiajs/react';
import {
    Award,
    BookOpenCheck,
    CalendarCheck2,
    CheckCircle2,
    CircleAlert,
    Clock3,
    Gift,
    GraduationCap,
    PackageCheck,
    Sparkles,
    Trophy,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/sapa/empty-state';
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
import { Label } from '@/components/ui/label';

type XpSource = keyof typeof sourceMeta;

type XpEvent = {
    id: number;
    source: string;
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

type Reward = {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    xp_cost: number;
    stock: number;
    unlimited: boolean;
    in_stock: boolean;
};

type Redemption = {
    id: number;
    reward: { id: number; name: string; image_url: string | null } | null;
    xp_spent: number;
    status: 'pending' | 'approved' | 'rejected' | 'delivered';
    notes: string | null;
    admin_notes: string | null;
    requested_at: string | null;
    decided_at: string | null;
};

type Props = {
    tab: 'overview' | 'rewards';
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
    balance: number;
    rewards: Reward[];
    redemptions: Redemption[];
    canRedeem: boolean;
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
    lms_graded: {
        label: 'LMS dinilai',
        icon: BookOpenCheck,
        color: 'text-sky-600',
    },
    reward_redemption: {
        label: 'Tukar reward',
        icon: Sparkles,
        color: 'text-rose-600',
    },
    reward_refund: {
        label: 'Refund reward',
        icon: Sparkles,
        color: 'text-emerald-600',
    },
} as const;

const statusInfo: Record<
    Redemption['status'],
    { label: string; color: string; icon: typeof Clock3 }
> = {
    pending: {
        label: 'Menunggu',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        icon: Clock3,
    },
    approved: {
        label: 'Disetujui',
        color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
        icon: CheckCircle2,
    },
    delivered: {
        label: 'Diserahkan',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        icon: PackageCheck,
    },
    rejected: {
        label: 'Ditolak',
        color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        icon: XCircle,
    },
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

export default function XpIndex({
    tab,
    student,
    progress,
    events,
    badges,
    leaderboard,
    balance,
    rewards,
    redemptions,
    canRedeem,
    stats,
}: Props) {
    const [scope, setScope] = useState<'class' | 'school'>(
        leaderboard.class.length > 0 ? 'class' : 'school',
    );
    const [openReward, setOpenReward] = useState<Reward | null>(null);
    const board = scope === 'class' ? leaderboard.class : leaderboard.school;
    const form = useForm({ notes: '' });

    function goTab(nextTab: Props['tab']) {
        router.get(
            '/xp',
            { tab: nextTab === 'overview' ? undefined : nextTab },
            { preserveScroll: true, preserveState: true },
        );
    }

    function submitRedeem(reward: Reward) {
        form.post(`/rewards/${reward.id}/redeem`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpenReward(null);
                router.reload({
                    only: ['balance', 'rewards', 'redemptions', 'progress'],
                });
            },
        });
    }

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
                        badge, lalu tukarkan XP di toko reward.
                    </p>
                </section>

                <div className="flex flex-wrap gap-2">
                    <TabButton
                        active={tab === 'overview'}
                        onClick={() => goTab('overview')}
                    >
                        Progres XP
                    </TabButton>
                    <TabButton
                        active={tab === 'rewards'}
                        onClick={() => goTab('rewards')}
                    >
                        Toko XP
                    </TabButton>
                </div>

                {tab === 'overview' ? (
                    <>
                        <section className="grid gap-4 md:grid-cols-3">
                            <StatCard
                                label="Total XP diberikan"
                                value={stats.totalAwarded.toLocaleString(
                                    'id-ID',
                                )}
                                icon={
                                    <Sparkles className="size-5 text-amber-500" />
                                }
                            />
                            <StatCard
                                label="Siswa dengan XP"
                                value={stats.studentsWithXp.toLocaleString(
                                    'id-ID',
                                )}
                                icon={<Users className="size-5 text-sky-500" />}
                            />
                            <StatCard
                                label="Threshold per level"
                                value={`${stats.levelThreshold} XP`}
                                icon={
                                    <Trophy className="size-5 text-emerald-500" />
                                }
                            />
                        </section>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Progress + recent events */}
                            <section className="space-y-6 lg:col-span-2">
                                <div className="sapa-card p-5">
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
                                                    <span>
                                                        {progress.percent}%
                                                    </span>
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
                                            Akun ini belum terhubung dengan data
                                            siswa, jadi belum punya XP pribadi.
                                            Statistik agregat tetap dapat
                                            dilihat di kartu di atas.
                                        </p>
                                    )}
                                </div>

                                <div className="sapa-card p-5">
                                    <h3 className="text-base font-semibold">
                                        Aktivitas XP terakhir
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        25 event terbaru.
                                    </p>

                                    {events.length === 0 ? (
                                        <p className="mt-4 text-sm text-muted-foreground">
                                            Belum ada XP. Lakukan absensi atau
                                            kumpulkan tugas untuk memulai.
                                        </p>
                                    ) : (
                                        <ul className="mt-4 divide-y divide-sidebar-border/60">
                                            {events.map((e) => {
                                                const meta =
                                                    sourceMeta[
                                                        e.source as XpSource
                                                    ];
                                                const Icon =
                                                    meta?.icon ?? Sparkles;

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
                                <div className="sapa-card p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold">
                                            Papan peringkat
                                        </h3>
                                        <div className="inline-flex rounded-md bg-muted p-0.5 text-xs">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setScope('class')
                                                }
                                                disabled={
                                                    leaderboard.class.length ===
                                                    0
                                                }
                                                className={`rounded px-2 py-1 transition ${
                                                    scope === 'class'
                                                        ? 'bg-background shadow'
                                                        : 'text-muted-foreground'
                                                } ${
                                                    leaderboard.class.length ===
                                                    0
                                                        ? 'cursor-not-allowed opacity-50'
                                                        : ''
                                                }`}
                                            >
                                                Kelas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setScope('school')
                                                }
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
                                                const isMe =
                                                    student?.id === row.id;

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
                                                                        : idx ===
                                                                            1
                                                                          ? 'bg-zinc-300 text-zinc-800'
                                                                          : idx ===
                                                                              2
                                                                            ? 'bg-orange-300 text-orange-950'
                                                                            : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {row.name ??
                                                                        '-'}
                                                                    {isMe && (
                                                                        <span className="ml-2 text-xs text-amber-600">
                                                                            (kamu)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {row.class_name ??
                                                                        '-'}{' '}
                                                                    · Lv{' '}
                                                                    {row.level}
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

                                <div className="sapa-card p-5">
                                    <h3 className="text-base font-semibold">
                                        Badge
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Capai milestone untuk membuka badge.
                                    </p>
                                    <ul className="mt-4 space-y-3">
                                        {badges.length === 0 && (
                                            <li className="text-sm text-muted-foreground">
                                                Badge muncul setelah ada
                                                aktivitas siswa.
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
                    </>
                ) : (
                    <RewardsPanel
                        student={student}
                        balance={balance}
                        rewards={rewards}
                        redemptions={redemptions}
                        canRedeem={canRedeem}
                        onSelectReward={setOpenReward}
                    />
                )}
            </div>

            <Dialog
                open={!!openReward}
                onOpenChange={(open) => !open && setOpenReward(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tukar reward</DialogTitle>
                        <DialogDescription>
                            {openReward
                                ? `${openReward.name} membutuhkan ${openReward.xp_cost} XP. Sisa saldo setelah tukar: ${balance - openReward.xp_cost} XP.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Catatan (opsional)</Label>
                        <textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(event) =>
                                form.setData('notes', event.target.value)
                            }
                            placeholder="Misal: ukuran kaos M, warna biru."
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        {form.errors.notes && (
                            <p className="text-sm text-rose-600">
                                {form.errors.notes}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenReward(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            disabled={form.processing}
                            onClick={() =>
                                openReward && submitRedeem(openReward)
                            }
                        >
                            Kirim pengajuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-sidebar-border/70 text-muted-foreground hover:bg-muted dark:border-sidebar-border'
            }`}
        >
            {children}
        </button>
    );
}

function RewardsPanel({
    student,
    balance,
    rewards,
    redemptions,
    canRedeem,
    onSelectReward,
}: {
    student: Props['student'];
    balance: number;
    rewards: Reward[];
    redemptions: Redemption[];
    canRedeem: boolean;
    onSelectReward: (reward: Reward) => void;
}) {
    return (
        <div className="grid gap-4">
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="sapa-card flex items-center gap-3 px-4 py-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                        <Wallet className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Saldo XP
                        </p>
                        <p className="text-xl font-semibold">
                            {balance.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
                <div className="sapa-card flex items-center gap-3 px-4 py-3">
                    <div className="grid size-10 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <Gift className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Reward aktif
                        </p>
                        <p className="text-xl font-semibold">
                            {rewards.length}
                        </p>
                    </div>
                </div>
            </section>

            {!student && (
                <div className="sapa-card flex items-start gap-3 p-4">
                    <CircleAlert className="size-5 text-amber-600" />
                    <div>
                        <p className="font-medium">
                            Akun ini bukan akun siswa.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Hanya siswa yang dapat menukar reward. Tampilan ini
                            tetap menampilkan katalog.
                        </p>
                    </div>
                </div>
            )}

            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Reward tersedia</h2>
                    <span className="text-xs text-muted-foreground">
                        {rewards.length} reward aktif
                    </span>
                </div>

                {rewards.length === 0 ? (
                    <EmptyState
                        icon={Gift}
                        title="Belum ada reward"
                        description="Admin/guru belum menambahkan reward apapun. Cek lagi nanti ya."
                    />
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {rewards.map((reward) => {
                            const affordable = balance >= reward.xp_cost;
                            const disabled =
                                !canRedeem || !affordable || !reward.in_stock;

                            return (
                                <article
                                    key={reward.id}
                                    className="sapa-card flex flex-col gap-3 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
                                                <Gift className="size-6" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">
                                                    {reward.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {reward.unlimited
                                                        ? 'Stok tidak terbatas'
                                                        : `Stok: ${reward.stock}`}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="text-primary"
                                        >
                                            {reward.xp_cost} XP
                                        </Badge>
                                    </div>

                                    {reward.description && (
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            {reward.description}
                                        </p>
                                    )}

                                    <div className="mt-auto flex items-center justify-between gap-2">
                                        {!affordable && (
                                            <span className="text-xs text-amber-600">
                                                Butuh {reward.xp_cost - balance}{' '}
                                                XP lagi
                                            </span>
                                        )}
                                        {!reward.in_stock && (
                                            <span className="text-xs text-rose-600">
                                                Stok habis
                                            </span>
                                        )}
                                        <Button
                                            size="sm"
                                            disabled={disabled}
                                            onClick={() =>
                                                onSelectReward(reward)
                                            }
                                            className="ml-auto"
                                        >
                                            Tukar XP
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="sapa-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="text-lg font-semibold">Pengajuan saya</h2>
                    <span className="text-xs text-muted-foreground">
                        20 terbaru
                    </span>
                </div>
                {redemptions.length === 0 ? (
                    <div className="p-6">
                        <EmptyState
                            icon={Gift}
                            title="Belum ada pengajuan"
                            description="Tukarkan XP-mu untuk reward favoritmu."
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                        {redemptions.map((redemption) => {
                            const info = statusInfo[redemption.status];
                            const Icon = info.icon;

                            return (
                                <li
                                    key={redemption.id}
                                    className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium">
                                                {redemption.reward?.name ??
                                                    'Reward'}
                                            </p>
                                            <Badge variant="outline">
                                                -{redemption.xp_spent} XP
                                            </Badge>
                                        </div>
                                        {redemption.notes && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Catatan: {redemption.notes}
                                            </p>
                                        )}
                                        {redemption.admin_notes && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Admin:{' '}
                                                <span className="text-foreground">
                                                    {redemption.admin_notes}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${info.color}`}
                                    >
                                        <Icon className="size-3.5" />
                                        {info.label}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
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
        <div className="sapa-card p-4">
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

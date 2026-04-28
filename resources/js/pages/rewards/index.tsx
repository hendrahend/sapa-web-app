import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleAlert,
    Clock3,
    Gift,
    PackageCheck,
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
    student: { id: number; name: string; class_name: string | null } | null;
    balance: number;
    rewards: Reward[];
    redemptions: Redemption[];
    canRedeem: boolean;
};

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

export default function RewardsIndex({
    student,
    balance,
    rewards,
    redemptions,
    canRedeem,
}: Props) {
    const [openReward, setOpenReward] = useState<Reward | null>(null);

    const form = useForm({ notes: '' });

    function submitRedeem(reward: Reward) {
        form.post(`/rewards/${reward.id}/redeem`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpenReward(null);
                router.reload({ only: ['balance', 'rewards', 'redemptions'] });
            },
        });
    }

    return (
        <>
            <Head title="Toko XP" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Tukar XP-mu jadi reward
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Toko XP
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Kumpulkan XP dari absensi, nilai, dan tugas LMS.
                            Tukar XP-mu di sini lalu tunggu persetujuan
                            admin/guru.
                        </p>
                    </div>
                    <div className="sapa-card flex items-center gap-3 px-4 py-3">
                        <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                            <Wallet className="size-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Saldo XP
                            </p>
                            <p className="text-xl font-semibold">{balance}</p>
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
                                Hanya siswa yang dapat menukar reward. Tampilan
                                ini hanya menampilkan katalog.
                            </p>
                        </div>
                    </div>
                )}

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Reward tersedia
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {rewards.length} reward aktif
                        </span>
                    </div>

                    {rewards.length === 0 ? (
                        <EmptyState
                            icon={Gift}
                            title="Belum ada reward"
                            description="Admin/guru belum menambahkan reward apapun. Cek lagi nanti ya!"
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {rewards.map((reward) => {
                                const affordable = balance >= reward.xp_cost;
                                const disabled =
                                    !canRedeem ||
                                    !affordable ||
                                    !reward.in_stock;

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
                                                    Butuh{' '}
                                                    {reward.xp_cost - balance}{' '}
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
                                                    setOpenReward(reward)
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
                        <h2 className="text-lg font-semibold">
                            Pengajuan saya
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            20 terbaru
                        </span>
                    </div>
                    {redemptions.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Gift}
                                title="Belum ada pengajuan"
                                description="Tukarkan XP-mu untuk reward favoritmu!"
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {redemptions.map((r) => {
                                const info = statusInfo[r.status];
                                const Icon = info.icon;

                                return (
                                    <li
                                        key={r.id}
                                        className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">
                                                    {r.reward?.name ?? 'Reward'}
                                                </p>
                                                <Badge variant="outline">
                                                    -{r.xp_spent} XP
                                                </Badge>
                                            </div>
                                            {r.notes && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Catatan: {r.notes}
                                                </p>
                                            )}
                                            {r.admin_notes && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Admin:{' '}
                                                    <span className="text-foreground">
                                                        {r.admin_notes}
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
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                            placeholder="Misal: ukuran kaos M, warna biru."
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
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

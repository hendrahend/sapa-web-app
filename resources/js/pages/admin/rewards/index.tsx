import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Gift,
    PackageCheck,
    Pencil,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDelete } from '@/components/sapa/confirm-delete';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Reward = {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    xp_cost: number;
    stock: number;
    unlimited: boolean;
    is_active: boolean;
    redemptions_count: number;
};

type Redemption = {
    id: number;
    reward: { id: number; name: string; xp_cost: number } | null;
    student: { id: number; name: string; class_name: string | null } | null;
    xp_spent: number;
    status: 'pending' | 'approved' | 'rejected' | 'delivered';
    notes: string | null;
    admin_notes: string | null;
    requested_at: string | null;
    decided_at: string | null;
    decided_by: { id: number; name: string } | null;
};

type Props = {
    rewards: Reward[];
    redemptions: Redemption[];
    stats: {
        pending: number;
        approved: number;
        delivered: number;
        rejected: number;
    };
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

type FormState = {
    name: string;
    description: string;
    image_url: string;
    xp_cost: number;
    stock: number;
    is_active: boolean;
};

const emptyForm: FormState = {
    name: '',
    description: '',
    image_url: '',
    xp_cost: 50,
    stock: -1,
    is_active: true,
};

export default function AdminRewardsIndex({
    rewards,
    redemptions,
    stats,
}: Props) {
    const [editing, setEditing] = useState<Reward | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [decideOn, setDecideOn] = useState<Redemption | null>(null);
    const [decideAction, setDecideAction] = useState<
        'approve' | 'reject' | 'deliver'
    >('approve');
    const [adminNotes, setAdminNotes] = useState('');

    const form = useForm<FormState>(emptyForm);

    function openCreate() {
        form.setData(emptyForm);
        setShowCreate(true);
    }

    function openEdit(reward: Reward) {
        form.setData({
            name: reward.name,
            description: reward.description ?? '',
            image_url: reward.image_url ?? '',
            xp_cost: reward.xp_cost,
            stock: reward.stock,
            is_active: reward.is_active,
        });
        setEditing(reward);
    }

    function submitCreate() {
        form.post('/admin/rewards', {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
            },
        });
    }

    function submitUpdate() {
        if (!editing) {
            return;
        }

        form.patch(`/admin/rewards/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(null);
                form.reset();
            },
        });
    }

    function submitDecision() {
        if (!decideOn) {
            return;
        }

        router.patch(
            `/admin/rewards/redemptions/${decideOn.id}`,
            { action: decideAction, admin_notes: adminNotes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDecideOn(null);
                    setAdminNotes('');
                },
            },
        );
    }

    return (
        <>
            <Head title="Kelola Reward" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Toko XP — Admin
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Kelola Reward
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Kelola katalog reward yang dapat ditukar siswa
                            dengan XP, dan setujui pengajuan yang masuk.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="size-4" /> Reward baru
                    </Button>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        label="Pengajuan menunggu"
                        value={stats.pending}
                        tone="amber"
                    />
                    <StatCard
                        label="Disetujui"
                        value={stats.approved}
                        tone="sky"
                    />
                    <StatCard
                        label="Diserahkan"
                        value={stats.delivered}
                        tone="emerald"
                    />
                    <StatCard
                        label="Ditolak"
                        value={stats.rejected}
                        tone="rose"
                    />
                </section>

                <section className="sapa-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">
                            Pengajuan terbaru
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            50 terbaru
                        </span>
                    </div>
                    {redemptions.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Gift}
                                title="Belum ada pengajuan"
                                description="Pengajuan tukar XP dari siswa akan muncul di sini."
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {redemptions.map((r) => {
                                const info = statusInfo[r.status];
                                const Icon = info.icon;
                                const canApprove = r.status === 'pending';
                                const canDeliver = r.status === 'approved';
                                const canReject =
                                    r.status === 'pending' ||
                                    r.status === 'approved';

                                return (
                                    <li
                                        key={r.id}
                                        className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">
                                                    {r.student?.name ?? 'Siswa'}
                                                </p>
                                                {r.student?.class_name && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({r.student.class_name})
                                                    </span>
                                                )}
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.color}`}
                                                >
                                                    <Icon className="size-3" />
                                                    {info.label}
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                {r.reward?.name ?? 'Reward'}{' '}
                                                <Badge
                                                    variant="outline"
                                                    className="ml-1"
                                                >
                                                    -{r.xp_spent} XP
                                                </Badge>
                                            </p>
                                            {r.notes && (
                                                <p className="text-sm text-muted-foreground">
                                                    Catatan siswa: {r.notes}
                                                </p>
                                            )}
                                            {r.admin_notes && (
                                                <p className="text-sm text-muted-foreground">
                                                    Catatan admin:{' '}
                                                    <span className="text-foreground">
                                                        {r.admin_notes}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {canApprove && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setDecideOn(r);
                                                        setDecideAction(
                                                            'approve',
                                                        );
                                                    }}
                                                >
                                                    Setujui
                                                </Button>
                                            )}
                                            {canDeliver && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setDecideOn(r);
                                                        setDecideAction(
                                                            'deliver',
                                                        );
                                                    }}
                                                >
                                                    Tandai diserahkan
                                                </Button>
                                            )}
                                            {canReject && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setDecideOn(r);
                                                        setDecideAction(
                                                            'reject',
                                                        );
                                                    }}
                                                >
                                                    Tolak
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="sapa-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">
                            Katalog reward
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            {rewards.length} reward
                        </span>
                    </div>
                    {rewards.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Gift}
                                title="Belum ada reward"
                                description="Tambahkan reward pertama untuk siswa."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Nama
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            XP
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Stok
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Pengajuan
                                        </th>
                                        <th className="px-4 py-2 text-center font-medium">
                                            Aktif
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {rewards.map((reward) => (
                                        <tr key={reward.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium">
                                                    {reward.name}
                                                </p>
                                                {reward.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {reward.description
                                                            .length > 80
                                                            ? `${reward.description.slice(0, 80)}…`
                                                            : reward.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {reward.xp_cost}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {reward.unlimited
                                                    ? '∞'
                                                    : reward.stock}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {reward.redemptions_count}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {reward.is_active ? (
                                                    <Badge>Aktif</Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEdit(reward)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <ConfirmDelete
                                                        url={`/admin/rewards/${reward.id}`}
                                                        title={`Hapus ${reward.name}?`}
                                                        description="Reward yang sudah pernah ditukar tidak bisa dihapus — gunakan opsi nonaktif."
                                                        trigger={
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-rose-600 hover:text-rose-700"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* Create dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Reward baru</DialogTitle>
                        <DialogDescription>
                            Tambahkan reward yang dapat ditukar siswa dengan XP.
                        </DialogDescription>
                    </DialogHeader>
                    <RewardForm form={form} />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreate(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={submitCreate}
                            disabled={form.processing}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit reward</DialogTitle>
                        <DialogDescription>
                            Perbarui detail reward.
                        </DialogDescription>
                    </DialogHeader>
                    <RewardForm form={form} />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditing(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={submitUpdate}
                            disabled={form.processing}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Decision dialog */}
            <Dialog
                open={!!decideOn}
                onOpenChange={(open) => {
                    if (!open) {
                        setDecideOn(null);
                        setAdminNotes('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {decideAction === 'approve' && 'Setujui pengajuan'}
                            {decideAction === 'reject' && 'Tolak pengajuan'}
                            {decideAction === 'deliver' &&
                                'Tandai sudah diserahkan'}
                        </DialogTitle>
                        <DialogDescription>
                            {decideOn?.student?.name} — {decideOn?.reward?.name}{' '}
                            ({decideOn?.xp_spent} XP)
                            {decideAction === 'reject' &&
                                '. XP siswa akan dikembalikan secara otomatis.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="admin_notes">Catatan (opsional)</Label>
                        <textarea
                            id="admin_notes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDecideOn(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitDecision}>Lanjutkan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function StatCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'amber' | 'sky' | 'emerald' | 'rose';
}) {
    const toneClass = {
        amber: 'text-amber-700 dark:text-amber-300',
        sky: 'text-sky-700 dark:text-sky-300',
        emerald: 'text-emerald-700 dark:text-emerald-300',
        rose: 'text-rose-700 dark:text-rose-300',
    }[tone];

    return (
        <div className="sapa-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>
                {value}
            </p>
        </div>
    );
}

type FormHelpers = {
    data: FormState;
    setData: (key: keyof FormState, value: string | number | boolean) => void;
    errors: Partial<Record<keyof FormState, string>>;
};

function RewardForm({ form }: { form: FormHelpers }) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nama reward</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="Misal: Voucher snack kantin"
                />
                {form.errors.name && (
                    <p className="text-sm text-rose-600">{form.errors.name}</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi (opsional)</Label>
                <textarea
                    id="description"
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="xp_cost">Biaya XP</Label>
                    <Input
                        id="xp_cost"
                        type="number"
                        min={1}
                        value={form.data.xp_cost}
                        onChange={(e) =>
                            form.setData('xp_cost', Number(e.target.value) || 0)
                        }
                    />
                    {form.errors.xp_cost && (
                        <p className="text-sm text-rose-600">
                            {form.errors.xp_cost}
                        </p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="stock">Stok (-1 = tak terbatas)</Label>
                    <Input
                        id="stock"
                        type="number"
                        min={-1}
                        value={form.data.stock}
                        onChange={(e) =>
                            form.setData('stock', Number(e.target.value) || 0)
                        }
                    />
                    {form.errors.stock && (
                        <p className="text-sm text-rose-600">
                            {form.errors.stock}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="image_url">URL gambar (opsional)</Label>
                <Input
                    id="image_url"
                    value={form.data.image_url}
                    onChange={(e) => form.setData('image_url', e.target.value)}
                    placeholder="https://..."
                />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.data.is_active}
                    onChange={(e) =>
                        form.setData('is_active', e.target.checked)
                    }
                />
                Aktifkan reward
            </label>
        </div>
    );
}

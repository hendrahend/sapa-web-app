import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    FileHeart,
    FileText,
    HeartPulse,
    Plus,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { DataTablePagination } from '@/components/sapa/data-table-pagination';
import type { PaginationMeta } from '@/components/sapa/data-table-pagination';
import { DataTableToolbar } from '@/components/sapa/data-table-toolbar';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
const textareaClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

type Excuse = {
    id: number;
    type: 'izin' | 'sakit';
    status: 'pending' | 'approved' | 'rejected';
    start_date: string;
    end_date: string;
    reason: string;
    attachment_url: string | null;
    admin_notes: string | null;
    reviewed_at: string | null;
    reviewer: { id: number; name: string } | null;
    student: {
        id: number;
        name: string;
        nis: string | null;
        school_class: { id: number; name: string } | null;
    } | null;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
} & PaginationMeta & {
        links: { url: string | null; label: string; active: boolean }[];
    };

type Props = {
    excuses: Paginated<Excuse>;
    filters: {
        status: string;
        per_page: number;
    };
    canManage: boolean;
    stats: {
        pending: number;
        approved: number;
        rejected: number;
    };
};

type ExcuseForm = {
    type: 'izin' | 'sakit';
    start_date: string;
    end_date: string;
    reason: string;
    attachment: File | null;
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function dateRange(start: string, end: string) {
    if (start === end) {
        return formatDate(start);
    }

    return `${formatDate(start)} – ${formatDate(end)}`;
}

function statusBadge(status: Excuse['status']) {
    const map: Record<Excuse['status'], { label: string; className: string }> =
        {
            pending: {
                label: 'Menunggu',
                className:
                    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
            },
            approved: {
                label: 'Disetujui',
                className:
                    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
            },
            rejected: {
                label: 'Ditolak',
                className:
                    'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300',
            },
        };

    const conf = map[status];

    return (
        <Badge variant="outline" className={conf.className}>
            {conf.label}
        </Badge>
    );
}

function typeBadge(type: Excuse['type']) {
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

export default function AttendanceExcusesIndex({
    excuses,
    filters,
    canManage,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canSubmit =
        auth.permissions.includes('attendance.own.create') && !canManage;

    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<ExcuseForm>({
        type: 'izin',
        start_date: todayISO(),
        end_date: todayISO(),
        reason: '',
        attachment: null,
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/attendance/excuses', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setIsOpen(false);
            },
        });
    };

    const decide = (
        excuse: Excuse,
        status: 'approved' | 'rejected',
        notes?: string,
    ) => {
        router.patch(
            `/attendance/excuses/${excuse.id}`,
            { status, admin_notes: notes ?? null },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Izin & Sakit" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="flex flex-wrap items-end justify-between gap-3 border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Pengajuan kehadiran
                        </p>
                        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                            <FileHeart className="size-6 text-sky-500" /> Izin &
                            Sakit
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            {canManage
                                ? 'Tinjau pengajuan izin/sakit dari siswa. Pengajuan yang disetujui otomatis tercatat sebagai kehadiran.'
                                : 'Ajukan izin atau sakit jika tidak bisa hadir. Setelah disetujui guru, kehadiran kamu langsung tercatat.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                            {stats.pending} menunggu
                        </Badge>
                        <Badge variant="outline">
                            {stats.approved} disetujui
                        </Badge>
                        <Badge variant="outline">
                            {stats.rejected} ditolak
                        </Badge>
                        {canSubmit && (
                            <Button
                                size="sm"
                                onClick={() => setIsOpen(true)}
                                className="gap-1"
                            >
                                <Plus className="size-4" /> Ajukan baru
                            </Button>
                        )}
                    </div>
                </section>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <DataTableToolbar
                        path="/attendance/excuses"
                        showSearch={false}
                        only={['excuses', 'filters', 'stats']}
                        filters={[
                            {
                                name: 'status',
                                placeholder: 'Semua status',
                                value: filters.status,
                                options: [
                                    { value: 'pending', label: 'Menunggu' },
                                    {
                                        value: 'approved',
                                        label: 'Disetujui',
                                    },
                                    { value: 'rejected', label: 'Ditolak' },
                                ],
                            },
                        ]}
                    />

                    {excuses.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={FileHeart}
                                title="Belum ada pengajuan"
                                description={
                                    canSubmit
                                        ? 'Klik “Ajukan baru” untuk mengirim izin atau sakit.'
                                        : 'Pengajuan izin/sakit dari siswa akan muncul di sini.'
                                }
                            />
                        </div>
                    ) : (
                        <ul className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {excuses.data.map((excuse) => (
                                <ExcuseRow
                                    key={excuse.id}
                                    excuse={excuse}
                                    canManage={canManage}
                                    onDecide={decide}
                                />
                            ))}
                        </ul>
                    )}

                    {excuses.data.length > 0 && (
                        <DataTablePagination
                            meta={excuses}
                            only={['excuses', 'filters', 'stats']}
                        />
                    )}
                </div>
            </div>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);

                    if (!open) {
                        form.reset();
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan izin / sakit</DialogTitle>
                        <DialogDescription>
                            Pengajuan akan dikirim ke guru/admin untuk
                            disetujui. Lampirkan surat dokter atau bukti lain
                            jika perlu.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                        encType="multipart/form-data"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="excuse-type">Jenis</Label>
                            <Select
                                value={form.data.type}
                                onValueChange={(value) =>
                                    form.setData(
                                        'type',
                                        value as ExcuseForm['type'],
                                    )
                                }
                            >
                                <SelectTrigger id="excuse-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="izin">Izin</SelectItem>
                                    <SelectItem value="sakit">Sakit</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.type} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="excuse-start">
                                    Tanggal mulai
                                </Label>
                                <Input
                                    id="excuse-start"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'start_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.start_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="excuse-end">
                                    Tanggal selesai
                                </Label>
                                <Input
                                    id="excuse-end"
                                    type="date"
                                    value={form.data.end_date}
                                    onChange={(event) =>
                                        form.setData(
                                            'end_date',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.end_date} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="excuse-reason">Alasan</Label>
                            <textarea
                                id="excuse-reason"
                                rows={3}
                                value={form.data.reason}
                                onChange={(event) =>
                                    form.setData('reason', event.target.value)
                                }
                                placeholder="Contoh: demam tinggi, periksa ke dokter."
                                className={textareaClass}
                            />
                            <InputError message={form.errors.reason} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="excuse-attachment">
                                Lampiran (opsional)
                            </Label>
                            <Input
                                id="excuse-attachment"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(event) =>
                                    form.setData(
                                        'attachment',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Surat dokter / bukti lain. Format: JPG, PNG,
                                WEBP, atau PDF (maks 4 MB).
                            </p>
                            <InputError message={form.errors.attachment} />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Kirim pengajuan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

type RowProps = {
    excuse: Excuse;
    canManage: boolean;
    onDecide: (
        excuse: Excuse,
        status: 'approved' | 'rejected',
        notes?: string,
    ) => void;
};

function ExcuseRow({ excuse, canManage, onDecide }: RowProps) {
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectNotes, setRejectNotes] = useState('');

    return (
        <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    {typeBadge(excuse.type)}
                    {statusBadge(excuse.status)}
                    <span className="text-sm text-muted-foreground">
                        {dateRange(excuse.start_date, excuse.end_date)}
                    </span>
                </div>

                {canManage && excuse.student && (
                    <p className="text-sm font-medium">
                        {excuse.student.name}
                        {excuse.student.school_class && (
                            <span className="text-muted-foreground">
                                {' '}
                                · {excuse.student.school_class.name}
                            </span>
                        )}
                    </p>
                )}

                <p className="text-sm leading-6 text-muted-foreground">
                    {excuse.reason}
                </p>

                {excuse.attachment_url && (
                    <a
                        href={excuse.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        <FileText className="size-3.5" /> Lihat lampiran
                    </a>
                )}

                {excuse.status !== 'pending' && (
                    <p className="text-xs text-muted-foreground">
                        Diputus oleh{' '}
                        <span className="font-medium">
                            {excuse.reviewer?.name ?? '-'}
                        </span>
                        {excuse.admin_notes
                            ? ` · catatan: ${excuse.admin_notes}`
                            : ''}
                    </p>
                )}
            </div>

            {canManage && excuse.status === 'pending' && (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => onDecide(excuse, 'approved')}
                    >
                        <CheckCircle2 className="size-4 text-emerald-500" />{' '}
                        Setujui
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setRejectOpen(true)}
                    >
                        <XCircle className="size-4 text-rose-500" /> Tolak
                    </Button>
                </div>
            )}

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak pengajuan</DialogTitle>
                        <DialogDescription>
                            Kasih catatan singkat alasan penolakan untuk siswa.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        rows={3}
                        value={rejectNotes}
                        onChange={(event) => setRejectNotes(event.target.value)}
                        placeholder="Contoh: surat dokter belum dilampirkan."
                        className={textareaClass}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                onDecide(excuse, 'rejected', rejectNotes);
                                setRejectOpen(false);
                                setRejectNotes('');
                            }}
                        >
                            Tolak pengajuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </li>
    );
}

AttendanceExcusesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Absensi',
            href: '/attendance',
        },
        {
            title: 'Izin & Sakit',
            href: '/attendance/excuses',
        },
    ],
};

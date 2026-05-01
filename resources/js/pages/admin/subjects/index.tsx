import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BookMarked,
    BookOpen,
    CheckCircle2,
    GraduationCap,
    Pencil,
    Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { ConfirmDelete } from '@/components/sapa/confirm-delete';
import { DataTablePagination } from '@/components/sapa/data-table-pagination';
import type { PaginationMeta } from '@/components/sapa/data-table-pagination';
import { DataTableToolbar } from '@/components/sapa/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

type SubjectRow = {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
    grade_assessments_count: number;
    lms_courses_count: number;
};

type Paginated<T> = {
    data: T[];
} & PaginationMeta;

type Props = {
    subjects: Paginated<SubjectRow>;
    filters: {
        search: string;
        status: string;
        per_page: number;
    };
    stats: {
        totalSubjects: number;
        activeSubjects: number;
        usedInGrades: number;
        usedInLms: number;
    };
};

type SubjectForm = {
    name: string;
    code: string;
    description: string;
    is_active: boolean;
};

const emptyForm: SubjectForm = {
    name: '',
    code: '',
    description: '',
    is_active: true,
};

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Total mapel',
            value: stats.totalSubjects,
            icon: BookMarked,
        },
        {
            label: 'Mapel aktif',
            value: stats.activeSubjects,
            icon: CheckCircle2,
        },
        {
            label: 'Dipakai nilai',
            value: stats.usedInGrades,
            icon: GraduationCap,
        },
        {
            label: 'Dipakai LMS',
            value: stats.usedInLms,
            icon: BookOpen,
        },
    ];
}

export default function AdminSubjectsIndex({
    subjects,
    filters,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canCreateSubjects = auth.permissions.includes('subjects.create');
    const canUpdateSubjects = auth.permissions.includes('subjects.update');
    const canDeleteSubjects = auth.permissions.includes('subjects.delete');
    const [editingSubjectId, setEditingSubjectId] = useState<number | null>(
        null,
    );
    const [isFormOpen, setIsFormOpen] = useState(false);
    const form = useForm<SubjectForm>(emptyForm);

    const editingSubject = useMemo(
        () =>
            subjects.data.find((subject) => subject.id === editingSubjectId) ??
            null,
        [subjects, editingSubjectId],
    );

    function resetForm() {
        setEditingSubjectId(null);
        setIsFormOpen(false);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function addSubject() {
        setEditingSubjectId(null);
        form.clearErrors();
        form.setData(emptyForm);
        setIsFormOpen(true);
    }

    function editSubject(subject: SubjectRow) {
        setEditingSubjectId(subject.id);
        form.clearErrors();
        form.setData({
            name: subject.name,
            code: subject.code ?? '',
            description: subject.description ?? '',
            is_active: subject.is_active,
        });
        setIsFormOpen(true);
    }

    function changeFormOpen(open: boolean) {
        setIsFormOpen(open);

        if (!open) {
            setEditingSubjectId(null);
            form.clearErrors();
            form.setData(emptyForm);
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editingSubjectId) {
            form.put(`/admin/subjects/${editingSubjectId}`, options);

            return;
        }

        form.post('/admin/subjects', options);
    }

    return (
        <>
            <Head title="Mapel" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Master akademik
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Mapel
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Kelola mata pelajaran yang dipakai oleh Penilaian dan
                        LMS.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

                <section className="sapa-card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sidebar-border">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Daftar mapel
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {subjects.total} mapel terdaftar.
                            </p>
                        </div>
                        {canCreateSubjects && (
                            <Button type="button" onClick={addSubject}>
                                <Plus />
                                Tambah mapel
                            </Button>
                        )}
                    </div>

                    <DataTableToolbar
                        path="/admin/subjects"
                        searchValue={filters.search}
                        searchPlaceholder="Cari nama, kode, atau deskripsi..."
                        only={['subjects', 'filters']}
                        filters={[
                            {
                                name: 'status',
                                placeholder: 'Semua status',
                                value: filters.status,
                                options: [
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'inactive', label: 'Nonaktif' },
                                ],
                            },
                        ]}
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Mapel
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Deskripsi
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Terhubung
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {subjects.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-muted-foreground"
                                        >
                                            Tidak ada mapel sesuai filter.
                                        </td>
                                    </tr>
                                )}

                                {subjects.data.map((subject) => (
                                    <tr key={subject.id}>
                                        <td className="px-4 py-3 align-top">
                                            <p className="font-medium">
                                                {subject.name}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                Kode {subject.code ?? '-'}
                                            </p>
                                        </td>
                                        <td className="max-w-md px-4 py-3 align-top text-muted-foreground">
                                            {subject.description ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="grid gap-2">
                                                <span className="inline-flex items-center gap-2">
                                                    <GraduationCap className="size-4 text-primary" />
                                                    {
                                                        subject.grade_assessments_count
                                                    }{' '}
                                                    komponen nilai
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <BookOpen className="size-4" />
                                                    {subject.lms_courses_count}{' '}
                                                    course
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <Badge
                                                variant={
                                                    subject.is_active
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {subject.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap items-center justify-end gap-1">
                                                {canUpdateSubjects && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            editSubject(subject)
                                                        }
                                                    >
                                                        <Pencil />
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDeleteSubjects && (
                                                    <ConfirmDelete
                                                        url={`/admin/subjects/${subject.id}`}
                                                        title="Hapus mapel?"
                                                        description={`Mapel ${subject.name} akan dihapus. Pastikan belum dipakai di Penilaian atau LMS.`}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination
                        meta={subjects}
                        only={['subjects', 'filters']}
                    />
                </section>

                <Dialog open={isFormOpen} onOpenChange={changeFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingSubject ? 'Edit mapel' : 'Tambah mapel'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSubject
                                    ? `Ubah data ${editingSubject.name}.`
                                    : 'Lengkapi data mata pelajaran baru.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama mapel</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    placeholder="Pemrograman Web"
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="code">Kode</Label>
                                <Input
                                    id="code"
                                    value={form.data.code}
                                    placeholder="PWEB"
                                    onChange={(event) =>
                                        form.setData('code', event.target.value)
                                    }
                                />
                                <InputError message={form.errors.code} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <textarea
                                    id="description"
                                    value={form.data.description}
                                    placeholder="Ringkasan materi atau cakupan mapel"
                                    className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.description}
                                />
                            </div>

                            <label className="flex items-center gap-3 text-sm font-medium">
                                <Checkbox
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_active',
                                            checked === true,
                                        )
                                    }
                                />
                                Mapel aktif
                            </label>
                            <InputError message={form.errors.is_active} />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {editingSubject
                                        ? 'Simpan perubahan'
                                        : 'Simpan mapel'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminSubjectsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/subjects',
        },
        {
            title: 'Mapel',
            href: '/admin/subjects',
        },
    ],
};

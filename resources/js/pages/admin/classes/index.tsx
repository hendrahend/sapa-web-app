import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck2,
    CheckCircle2,
    GraduationCap,
    Pencil,
    Plus,
    School,
    UserRoundCheck,
    Users,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type TeacherOption = {
    id: number;
    name: string;
    email: string;
};

type SchoolClassRow = {
    id: number;
    homeroom_teacher_id: number | null;
    name: string;
    grade_level: string | null;
    academic_year: string | null;
    is_active: boolean;
    homeroom_teacher: TeacherOption | null;
    students_count: number;
    attendance_sessions_count: number;
    grade_assessments_count: number;
    lms_courses_count: number;
};

type Paginated<T> = {
    data: T[];
} & PaginationMeta;

type Props = {
    classes: Paginated<SchoolClassRow>;
    filters: {
        search: string;
        status: string;
        per_page: number;
    };
    teachers: TeacherOption[];
    stats: {
        totalClasses: number;
        activeClasses: number;
        withHomeroomTeacher: number;
        emptyClasses: number;
    };
};

type SchoolClassForm = {
    homeroom_teacher_id: string;
    name: string;
    grade_level: string;
    academic_year: string;
    is_active: boolean;
};

const emptyForm: SchoolClassForm = {
    homeroom_teacher_id: '',
    name: '',
    grade_level: '',
    academic_year: '2025/2026',
    is_active: true,
};

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Total kelas',
            value: stats.totalClasses,
            icon: School,
        },
        {
            label: 'Kelas aktif',
            value: stats.activeClasses,
            icon: CheckCircle2,
        },
        {
            label: 'Ada wali kelas',
            value: stats.withHomeroomTeacher,
            icon: UserRoundCheck,
        },
        {
            label: 'Belum ada siswa',
            value: stats.emptyClasses,
            icon: Users,
        },
    ];
}

export default function AdminClassesIndex({
    classes,
    filters,
    teachers,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canCreateClasses = auth.permissions.includes('classes.create');
    const canUpdateClasses = auth.permissions.includes('classes.update');
    const canDeleteClasses = auth.permissions.includes('classes.delete');
    const [editingClassId, setEditingClassId] = useState<number | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const form = useForm<SchoolClassForm>(emptyForm);

    const editingClass = useMemo(
        () =>
            classes.data.find(
                (schoolClass) => schoolClass.id === editingClassId,
            ) ?? null,
        [classes, editingClassId],
    );

    function resetForm() {
        setEditingClassId(null);
        setIsFormOpen(false);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function addClass() {
        setEditingClassId(null);
        form.clearErrors();
        form.setData(emptyForm);
        setIsFormOpen(true);
    }

    function editClass(schoolClass: SchoolClassRow) {
        setEditingClassId(schoolClass.id);
        form.clearErrors();
        form.setData({
            homeroom_teacher_id:
                schoolClass.homeroom_teacher_id?.toString() ?? '',
            name: schoolClass.name,
            grade_level: schoolClass.grade_level ?? '',
            academic_year: schoolClass.academic_year ?? '',
            is_active: schoolClass.is_active,
        });
        setIsFormOpen(true);
    }

    function changeFormOpen(open: boolean) {
        setIsFormOpen(open);

        if (!open) {
            setEditingClassId(null);
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

        if (editingClassId) {
            form.put(`/admin/classes/${editingClassId}`, options);

            return;
        }

        form.post('/admin/classes', options);
    }

    return (
        <>
            <Head title="Data Kelas" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Master akademik
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Data Kelas
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Kelola kelas, tahun ajaran, dan wali kelas yang dipakai
                        oleh data siswa, absensi, penilaian, dan LMS.
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
                                Daftar kelas
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {classes.total} kelas terdaftar.
                            </p>
                        </div>
                        {canCreateClasses && (
                            <Button type="button" onClick={addClass}>
                                <Plus />
                                Tambah kelas
                            </Button>
                        )}
                    </div>

                    <DataTableToolbar
                        path="/admin/classes"
                        searchValue={filters.search}
                        searchPlaceholder="Cari nama, tingkat, atau tahun ajaran…"
                        only={['classes', 'filters']}
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
                                        Kelas
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Wali kelas
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
                                {classes.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-muted-foreground"
                                        >
                                            Tidak ada kelas sesuai filter.
                                        </td>
                                    </tr>
                                )}

                                {classes.data.map((schoolClass) => (
                                    <tr key={schoolClass.id}>
                                        <td className="px-4 py-3 align-top">
                                            <p className="font-medium">
                                                {schoolClass.name}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                Tingkat{' '}
                                                {schoolClass.grade_level ?? '-'}{' '}
                                                -{' '}
                                                {schoolClass.academic_year ??
                                                    '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {schoolClass.homeroom_teacher ? (
                                                <>
                                                    <p className="font-medium">
                                                        {
                                                            schoolClass
                                                                .homeroom_teacher
                                                                .name
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        {
                                                            schoolClass
                                                                .homeroom_teacher
                                                                .email
                                                        }
                                                    </p>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Belum ditentukan
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="grid gap-2">
                                                <span className="inline-flex items-center gap-2">
                                                    <Users className="size-4 text-primary" />
                                                    {schoolClass.students_count}{' '}
                                                    siswa
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <CalendarCheck2 className="size-4" />
                                                    {
                                                        schoolClass.attendance_sessions_count
                                                    }{' '}
                                                    sesi absensi
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <GraduationCap className="size-4" />
                                                    {
                                                        schoolClass.grade_assessments_count
                                                    }{' '}
                                                    komponen nilai
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <BookOpen className="size-4" />
                                                    {
                                                        schoolClass.lms_courses_count
                                                    }{' '}
                                                    course
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <Badge
                                                variant={
                                                    schoolClass.is_active
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {schoolClass.is_active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap items-center justify-end gap-1">
                                                {canUpdateClasses && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            editClass(
                                                                schoolClass,
                                                            )
                                                        }
                                                    >
                                                        <Pencil />
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDeleteClasses && (
                                                    <ConfirmDelete
                                                        url={`/admin/classes/${schoolClass.id}`}
                                                        title="Hapus kelas?"
                                                        description={`Kelas ${schoolClass.name} akan dihapus. Pastikan tidak ada siswa, sesi, atau LMS yang terhubung.`}
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
                        meta={classes}
                        only={['classes', 'filters']}
                    />
                </section>

                <Dialog open={isFormOpen} onOpenChange={changeFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingClass ? 'Edit kelas' : 'Tambah kelas'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingClass
                                    ? `Ubah data ${editingClass.name}.`
                                    : 'Lengkapi data kelas baru untuk dipakai di modul SAPA.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama kelas</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    placeholder="X RPL 1"
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="grade_level">Tingkat</Label>
                                    <Input
                                        id="grade_level"
                                        value={form.data.grade_level}
                                        placeholder="X"
                                        onChange={(event) =>
                                            form.setData(
                                                'grade_level',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.grade_level}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="academic_year">
                                        Tahun ajaran
                                    </Label>
                                    <Input
                                        id="academic_year"
                                        value={form.data.academic_year}
                                        placeholder="2025/2026"
                                        onChange={(event) =>
                                            form.setData(
                                                'academic_year',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.academic_year}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Wali kelas</Label>
                                <Select
                                    value={
                                        form.data.homeroom_teacher_id || 'none'
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'homeroom_teacher_id',
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih wali kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Belum ditentukan
                                        </SelectItem>
                                        {teachers.map((teacher) => (
                                            <SelectItem
                                                key={teacher.id}
                                                value={teacher.id.toString()}
                                            >
                                                {teacher.name} - {teacher.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={form.errors.homeroom_teacher_id}
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
                                Kelas aktif
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
                                    {editingClass
                                        ? 'Simpan perubahan'
                                        : 'Simpan kelas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminClassesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/classes',
        },
        {
            title: 'Data Kelas',
            href: '/admin/classes',
        },
    ],
};

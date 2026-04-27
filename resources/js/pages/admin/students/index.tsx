import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Link2,
    Pencil,
    Plus,
    ShieldAlert,
    UserRound,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
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

type SchoolClass = {
    id: number;
    name: string;
    grade_level: string | null;
    academic_year: string | null;
};

type UserOption = {
    id: number;
    name: string;
    email: string;
};

type StudentUserOption = UserOption & {
    student_id: number | null;
};

type ParentUserOption = UserOption & {
    children_count: number;
};

type StudentRow = {
    id: number;
    user_id: number | null;
    school_class_id: number | null;
    nis: string | null;
    nisn: string | null;
    name: string;
    gender: string | null;
    birth_date: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    user: UserOption | null;
    school_class: Pick<SchoolClass, 'id' | 'name'> | null;
    parents: UserOption[];
    attendance_records_count: number;
};

type Props = {
    students: StudentRow[];
    schoolClasses: SchoolClass[];
    studentUsers: StudentUserOption[];
    parentUsers: ParentUserOption[];
    stats: {
        totalStudents: number;
        activeStudents: number;
        linkedStudentAccounts: number;
        linkedParents: number;
    };
};

type StudentForm = {
    user_id: string;
    school_class_id: string;
    nis: string;
    nisn: string;
    name: string;
    gender: string;
    birth_date: string;
    phone: string;
    is_active: boolean;
    parent_user_ids: string[];
    new_parent_name: string;
    new_parent_email: string;
};

const emptyForm: StudentForm = {
    user_id: '',
    school_class_id: '',
    nis: '',
    nisn: '',
    name: '',
    gender: '',
    birth_date: '',
    phone: '',
    is_active: true,
    parent_user_ids: [],
    new_parent_name: '',
    new_parent_email: '',
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function genderLabel(value: string | null) {
    if (value === 'L') {
        return 'Laki-laki';
    }

    if (value === 'P') {
        return 'Perempuan';
    }

    return '-';
}

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Total siswa',
            value: stats.totalStudents,
            icon: Users,
        },
        {
            label: 'Siswa aktif',
            value: stats.activeStudents,
            icon: CheckCircle2,
        },
        {
            label: 'Akun siswa tertaut',
            value: stats.linkedStudentAccounts,
            icon: Link2,
        },
        {
            label: 'Orang tua tertaut',
            value: stats.linkedParents,
            icon: UserRound,
        },
    ];
}

export default function AdminStudentsIndex({
    students,
    schoolClasses,
    studentUsers,
    parentUsers,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canCreateStudents = auth.permissions.includes('students.create');
    const canUpdateStudents = auth.permissions.includes('students.update');
    const [editingStudentId, setEditingStudentId] = useState<number | null>(
        null,
    );
    const [isFormOpen, setIsFormOpen] = useState(false);
    const form = useForm<StudentForm>(emptyForm);

    const editingStudent = useMemo(
        () =>
            students.find((student) => student.id === editingStudentId) ?? null,
        [editingStudentId, students],
    );

    const availableStudentUsers = studentUsers.filter(
        (user) =>
            user.student_id === null || user.student_id === editingStudentId,
    );

    function resetForm() {
        setEditingStudentId(null);
        setIsFormOpen(false);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function addStudent() {
        setEditingStudentId(null);
        form.clearErrors();
        form.setData(emptyForm);
        setIsFormOpen(true);
    }

    function editStudent(student: StudentRow) {
        setEditingStudentId(student.id);
        form.clearErrors();
        form.setData({
            user_id: student.user_id?.toString() ?? '',
            school_class_id: student.school_class_id?.toString() ?? '',
            nis: student.nis ?? '',
            nisn: student.nisn ?? '',
            name: student.name,
            gender: student.gender ?? '',
            birth_date: student.birth_date ?? '',
            phone: student.phone ?? '',
            is_active: student.is_active,
            parent_user_ids: student.parents.map((parent) =>
                parent.id.toString(),
            ),
            new_parent_name: '',
            new_parent_email: '',
        });
        setIsFormOpen(true);
    }

    function changeFormOpen(open: boolean) {
        setIsFormOpen(open);

        if (!open) {
            setEditingStudentId(null);
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

        if (editingStudentId) {
            form.put(`/admin/students/${editingStudentId}`, options);

            return;
        }

        form.post('/admin/students', options);
    }

    function toggleParent(parentId: number, checked: boolean) {
        const value = parentId.toString();

        form.setData(
            'parent_user_ids',
            checked
                ? [...form.data.parent_user_ids, value]
                : form.data.parent_user_ids.filter((id) => id !== value),
        );
    }

    return (
        <>
            <Head title="Siswa & Orang Tua" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Master data
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Siswa & Orang Tua
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Kelola identitas siswa, tautkan akun siswa, dan
                        hubungkan orang tua untuk notifikasi absensi.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statItems(stats).map((item) => (
                        <div
                            key={item.label}
                            className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">
                                    {item.label}
                                </p>
                                <item.icon className="size-4 text-muted-foreground" />
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
                                Daftar siswa
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tambah dan ubah data siswa melalui modal.
                            </p>
                        </div>
                        {canCreateStudents && (
                            <Button type="button" onClick={addStudent}>
                                <Plus />
                                Tambah siswa
                            </Button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Siswa
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Kelas
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Orang tua
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
                                {students.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-muted-foreground"
                                        >
                                            Belum ada data siswa.
                                        </td>
                                    </tr>
                                )}

                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-4 py-3 align-top">
                                            <p className="font-medium">
                                                {student.name}
                                            </p>
                                            <div className="mt-1 grid gap-1 text-muted-foreground">
                                                <p>NIS: {student.nis ?? '-'}</p>
                                                <p>
                                                    NISN: {student.nisn ?? '-'}
                                                </p>
                                                <p>
                                                    {genderLabel(
                                                        student.gender,
                                                    )}
                                                </p>
                                            </div>
                                            {student.user && (
                                                <Badge
                                                    variant="secondary"
                                                    className="mt-2"
                                                >
                                                    {student.user.email}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <p>
                                                {student.school_class?.name ??
                                                    '-'}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {student.birth_date
                                                    ? formatDate(
                                                          student.birth_date,
                                                      )
                                                    : '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="grid gap-2">
                                                {student.parents.length ===
                                                    0 && (
                                                    <span className="text-muted-foreground">
                                                        Belum tertaut
                                                    </span>
                                                )}
                                                {student.parents.map(
                                                    (parent) => (
                                                        <div key={parent.id}>
                                                            <p className="font-medium">
                                                                {parent.name}
                                                            </p>
                                                            <p className="text-muted-foreground">
                                                                {parent.email}
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="grid gap-2">
                                                <Badge
                                                    variant={
                                                        student.is_active
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                >
                                                    {student.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </Badge>
                                                {!student.user && (
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                        <ShieldAlert className="size-3.5" />
                                                        Akun belum tertaut
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground">
                                                    {
                                                        student.attendance_records_count
                                                    }{' '}
                                                    record absensi
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {canUpdateStudents && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        editStudent(student)
                                                    }
                                                >
                                                    <Pencil />
                                                    Edit
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Dialog open={isFormOpen} onOpenChange={changeFormOpen}>
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingStudent ? 'Edit siswa' : 'Tambah siswa'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingStudent
                                    ? `Ubah data ${editingStudent.name}.`
                                    : 'Lengkapi identitas siswa dan tautkan akun orang tua bila sudah tersedia.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama siswa</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="nis">NIS</Label>
                                    <Input
                                        id="nis"
                                        value={form.data.nis}
                                        onChange={(event) =>
                                            form.setData(
                                                'nis',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.nis} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nisn">NISN</Label>
                                    <Input
                                        id="nisn"
                                        value={form.data.nisn}
                                        onChange={(event) =>
                                            form.setData(
                                                'nisn',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.nisn} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Kelas</Label>
                                    <Select
                                        value={
                                            form.data.school_class_id || 'none'
                                        }
                                        onValueChange={(value) =>
                                            form.setData(
                                                'school_class_id',
                                                value === 'none' ? '' : value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih kelas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum ada kelas
                                            </SelectItem>
                                            {schoolClasses.map(
                                                (schoolClass) => (
                                                    <SelectItem
                                                        key={schoolClass.id}
                                                        value={schoolClass.id.toString()}
                                                    >
                                                        {schoolClass.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={form.errors.school_class_id}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Jenis kelamin</Label>
                                    <Select
                                        value={form.data.gender || 'none'}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'gender',
                                                value === 'none' ? '' : value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Belum diisi
                                            </SelectItem>
                                            <SelectItem value="L">
                                                Laki-laki
                                            </SelectItem>
                                            <SelectItem value="P">
                                                Perempuan
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.gender} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="birth_date">
                                        Tanggal lahir
                                    </Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={form.data.birth_date}
                                        onChange={(event) =>
                                            form.setData(
                                                'birth_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.birth_date}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Nomor HP</Label>
                                    <Input
                                        id="phone"
                                        value={form.data.phone}
                                        onChange={(event) =>
                                            form.setData(
                                                'phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.phone} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Akun siswa</Label>
                                <Select
                                    value={form.data.user_id || 'none'}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'user_id',
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih akun siswa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Belum ditautkan
                                        </SelectItem>
                                        {availableStudentUsers.map((user) => (
                                            <SelectItem
                                                key={user.id}
                                                value={user.id.toString()}
                                            >
                                                {user.name} - {user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.user_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Orang tua tertaut</Label>
                                <div className="max-h-48 overflow-y-auto rounded-md border border-input">
                                    {parentUsers.length === 0 && (
                                        <div className="p-3 text-sm text-muted-foreground">
                                            Belum ada akun orang tua.
                                        </div>
                                    )}

                                    {parentUsers.map((parent) => (
                                        <label
                                            key={parent.id}
                                            className="flex items-start gap-3 border-b border-sidebar-border/70 p-3 last:border-b-0 dark:border-sidebar-border"
                                        >
                                            <Checkbox
                                                checked={form.data.parent_user_ids.includes(
                                                    parent.id.toString(),
                                                )}
                                                onCheckedChange={(checked) =>
                                                    toggleParent(
                                                        parent.id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <span className="grid gap-1 text-sm">
                                                <span className="font-medium">
                                                    {parent.name}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {parent.email}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <InputError
                                    message={form.errors.parent_user_ids}
                                />
                            </div>

                            <div className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Plus className="size-4" />
                                    Buat akun orang tua baru
                                </div>
                                <div className="mt-3 grid gap-3">
                                    <Input
                                        value={form.data.new_parent_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'new_parent_name',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Nama orang tua"
                                    />
                                    <InputError
                                        message={form.errors.new_parent_name}
                                    />
                                    <Input
                                        type="email"
                                        value={form.data.new_parent_email}
                                        onChange={(event) =>
                                            form.setData(
                                                'new_parent_email',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="email@contoh.sch.id"
                                    />
                                    <InputError
                                        message={form.errors.new_parent_email}
                                    />
                                </div>
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
                                Siswa aktif
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
                                    {editingStudent
                                        ? 'Simpan perubahan'
                                        : 'Simpan siswa'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminStudentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/students',
        },
        {
            title: 'Siswa & Orang Tua',
            href: '/admin/students',
        },
    ],
};

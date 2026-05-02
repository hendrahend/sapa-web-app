import { Head, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, UserRoundPlus } from 'lucide-react';
import { useState } from 'react';
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

type RoleSummary = {
    id: number;
    name: string;
    label: string;
    users_count: number;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: string[];
    student: {
        id: number;
        name: string;
        nis: string | null;
        nisn: string | null;
        gender: string | null;
        school_class: {
            id: number;
            name: string;
        } | null;
    } | null;
    created_attendance_sessions_count: number;
    verified_attendance_records_count: number;
};

type SchoolClass = {
    id: number;
    name: string;
    grade_level: string | null;
    academic_year: string | null;
};

type Paginated<T> = {
    data: T[];
} & PaginationMeta;

type Props = {
    users: Paginated<UserRow>;
    filters: {
        search: string;
        role: string;
        per_page: number;
    };
    roles: RoleSummary[];
    schoolClasses: SchoolClass[];
    stats: {
        totalUsers: number;
        verifiedUsers: number;
        linkedStudents: number;
        withoutRole: number;
    };
};

type UserForm = {
    name: string;
    email: string;
    password: string;
    role: string;
    email_verified: boolean;
    create_student_profile: boolean;
    school_class_id: string;
    nis: string;
    nisn: string;
    gender: string;
};

const emptyForm: UserForm = {
    name: '',
    email: '',
    password: '',
    role: 'guru',
    email_verified: true,
    create_student_profile: false,
    school_class_id: '',
    nis: '',
    nisn: '',
    gender: '',
};

const roleLabels: Record<string, string> = {
    admin: 'Admin',
    guru: 'Guru',
    siswa: 'Siswa',
    orang_tua: 'Orang tua',
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

export default function AdminUsersIndex({
    users,
    filters,
    roles,
    schoolClasses,
}: Props) {
    const { auth } = usePage().props;
    const canCreateUsers = auth.permissions.includes('users.create');
    const canUpdateUsers = auth.permissions.includes('users.update');
    const canDeleteUsers = auth.permissions.includes('users.delete');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const form = useForm<UserForm>(emptyForm);
    const isEditing = editingUser !== null;
    const isDialogOpen = isCreateOpen || isEditing;
    const shouldCreateStudentProfile =
        form.data.role === 'siswa' && form.data.create_student_profile;

    function resetForm() {
        form.clearErrors();
        form.setData(emptyForm);
        setIsCreateOpen(false);
        setEditingUser(null);
    }

    function changeDialogOpen(open: boolean) {
        if (!open) {
            resetForm();
        }
    }

    function openCreate() {
        form.clearErrors();
        form.setData(emptyForm);
        setEditingUser(null);
        setIsCreateOpen(true);
    }

    function openEdit(user: UserRow) {
        const currentRole = user.roles[0] ?? '';

        form.clearErrors();
        form.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: currentRole,
            email_verified: user.email_verified_at !== null,
            create_student_profile:
                currentRole === 'siswa' && user.student !== null,
            school_class_id: user.student?.school_class?.id.toString() ?? '',
            nis: user.student?.nis ?? '',
            nisn: user.student?.nisn ?? '',
            gender: user.student?.gender ?? '',
        });
        setIsCreateOpen(false);
        setEditingUser(user);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editingUser) {
            form.put(`/admin/users/${editingUser.id}`, options);

            return;
        }

        form.post('/admin/users', options);
    }

    function changeRole(role: string) {
        form.setData((values) => ({
            ...values,
            role,
            create_student_profile:
                role === 'siswa'
                    ? values.create_student_profile ||
                      (editingUser !== null && editingUser.student === null)
                    : false,
            school_class_id: role === 'siswa' ? values.school_class_id : '',
            nis: role === 'siswa' ? values.nis : '',
            nisn: role === 'siswa' ? values.nisn : '',
            gender: role === 'siswa' ? values.gender : '',
        }));
    }

    return (
        <>
            <Head title="Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Administrasi
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Pengguna
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Pantau dan buat akun admin, guru, siswa, dan orang
                            tua yang masuk ke SAPA.
                        </p>
                    </div>
                    {canCreateUsers && (
                        <Button type="button" onClick={openCreate}>
                            <Plus />
                            Tambah pengguna
                        </Button>
                    )}
                </section>

                <Dialog open={isDialogOpen} onOpenChange={changeDialogOpen}>
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {isEditing
                                    ? 'Edit pengguna'
                                    : 'Tambah pengguna'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? 'Perbarui data akun, status email, dan role pengguna.'
                                    : 'Buat akun baru dan tetapkan role awal. Password kosong akan memakai default password.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) =>
                                            form.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={form.errors.email} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={form.data.role || undefined}
                                        onValueChange={changeRole}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.name}
                                                >
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.role} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        {isEditing
                                            ? 'Password baru'
                                            : 'Password'}
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={(event) =>
                                            form.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        placeholder={
                                            isEditing
                                                ? 'kosongkan jika tidak diubah'
                                                : 'default: password'
                                        }
                                    />
                                    <InputError
                                        message={form.errors.password}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 text-sm font-medium">
                                <Checkbox
                                    checked={form.data.email_verified}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'email_verified',
                                            checked === true,
                                        )
                                    }
                                />
                                Tandai email sudah terverifikasi
                            </label>
                            <InputError message={form.errors.email_verified} />

                            {form.data.role === 'siswa' && (
                                <div className="rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                    <label className="flex items-center gap-3 text-sm font-medium">
                                        <Checkbox
                                            checked={
                                                form.data.create_student_profile
                                            }
                                            onCheckedChange={(checked) =>
                                                form.setData(
                                                    'create_student_profile',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        {isEditing
                                            ? 'Buat/perbarui profil siswa'
                                            : 'Buat profil siswa sekaligus'}
                                    </label>
                                    <InputError
                                        message={
                                            form.errors.create_student_profile
                                        }
                                    />

                                    {shouldCreateStudentProfile && (
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label>Kelas</Label>
                                                <Select
                                                    value={
                                                        form.data
                                                            .school_class_id ||
                                                        'none'
                                                    }
                                                    onValueChange={(value) =>
                                                        form.setData(
                                                            'school_class_id',
                                                            value === 'none'
                                                                ? ''
                                                                : value,
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
                                                                    key={
                                                                        schoolClass.id
                                                                    }
                                                                    value={schoolClass.id.toString()}
                                                                >
                                                                    {
                                                                        schoolClass.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        form.errors
                                                            .school_class_id
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label>Jenis kelamin</Label>
                                                <Select
                                                    value={
                                                        form.data.gender ||
                                                        'none'
                                                    }
                                                    onValueChange={(value) =>
                                                        form.setData(
                                                            'gender',
                                                            value === 'none'
                                                                ? ''
                                                                : value,
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
                                                <InputError
                                                    message={form.errors.gender}
                                                />
                                            </div>

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
                                                <InputError
                                                    message={form.errors.nis}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="nisn">
                                                    NISN
                                                </Label>
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
                                                <InputError
                                                    message={form.errors.nisn}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

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
                                    {isEditing ? <Pencil /> : <UserRoundPlus />}
                                    {isEditing
                                        ? 'Simpan perubahan'
                                        : 'Simpan pengguna'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <section className="grid gap-4">
                    <div className="sapa-card overflow-hidden">
                        <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="text-lg font-semibold">Pengguna</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {users.total} pengguna terdaftar di SAPA.
                            </p>
                        </div>
                        <DataTableToolbar
                            path="/admin/users"
                            searchValue={filters.search}
                            searchPlaceholder="Cari nama atau email…"
                            only={['users', 'filters']}
                            filters={[
                                {
                                    name: 'role',
                                    placeholder: 'Semua role',
                                    value: filters.role,
                                    options: [
                                        {
                                            value: '__none',
                                            label: 'Tanpa role',
                                        },
                                        ...roles.map((role) => ({
                                            value: role.name,
                                            label: role.label,
                                        })),
                                    ],
                                },
                            ]}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Nama
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Siswa
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Aktivitas
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Dibuat
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {users.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-muted-foreground"
                                            >
                                                Tidak ada pengguna sesuai
                                                filter.
                                            </td>
                                        </tr>
                                    )}

                                    {users.data.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-3 align-top">
                                                <p className="font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="mt-1 text-muted-foreground">
                                                    {user.email}
                                                </p>
                                                <Badge
                                                    variant={
                                                        user.email_verified_at
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    className="mt-2"
                                                >
                                                    {user.email_verified_at
                                                        ? 'Terverifikasi'
                                                        : 'Belum verifikasi'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-wrap gap-2">
                                                    {user.roles.length ===
                                                        0 && (
                                                        <Badge variant="outline">
                                                            Tanpa role
                                                        </Badge>
                                                    )}
                                                    {user.roles.map((role) => (
                                                        <Badge
                                                            key={role}
                                                            variant="outline"
                                                        >
                                                            {roleLabels[role] ??
                                                                role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {user.student ? (
                                                    <>
                                                        <p className="font-medium">
                                                            {user.student.name}
                                                        </p>
                                                        <p className="mt-1 text-muted-foreground">
                                                            {user.student
                                                                .school_class
                                                                ?.name ?? '-'}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                <p>
                                                    {
                                                        user.created_attendance_sessions_count
                                                    }{' '}
                                                    sesi dibuat
                                                </p>
                                                <p className="mt-1">
                                                    {
                                                        user.verified_attendance_records_count
                                                    }{' '}
                                                    verifikasi
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex justify-end gap-2">
                                                    {canUpdateUsers && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEdit(user)
                                                            }
                                                        >
                                                            <Pencil />
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {canDeleteUsers && (
                                                        <ConfirmDelete
                                                            url={`/admin/users/${user.id}`}
                                                            title="Hapus pengguna?"
                                                            description={`Akun ${user.name} (${user.email}) dan profil siswa terkait akan dihapus permanen.`}
                                                            triggerLabel="Hapus"
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
                            meta={users}
                            only={['users', 'filters']}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

AdminUsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/users',
        },
        {
            title: 'Pengguna',
            href: '/admin/users',
        },
    ],
};

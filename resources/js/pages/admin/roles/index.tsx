import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    KeyRound,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
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

type RoleRow = {
    id: number;
    name: string;
    label: string;
    users_count: number;
    permissions: string[];
};

type PermissionRow = {
    id: number;
    name: string;
    label: string;
    group: string;
};

type Props = {
    roles: RoleRow[];
    permissions: PermissionRow[];
    protectedRoles: string[];
    stats: {
        totalRoles: number;
        totalPermissions: number;
        coveredPermissions: number;
    };
};

type RoleForm = {
    name: string;
    permissions: string[];
};

const emptyForm: RoleForm = {
    name: '',
    permissions: [],
};

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Role',
            value: stats.totalRoles,
            icon: ShieldCheck,
        },
        {
            label: 'Permission',
            value: stats.totalPermissions,
            icon: KeyRound,
        },
        {
            label: 'Terpakai di role',
            value: stats.coveredPermissions,
            icon: BadgeCheck,
        },
    ];
}

function groupedPermissions(permissions: PermissionRow[]) {
    return permissions.reduce<Record<string, PermissionRow[]>>(
        (groups, permission) => {
            groups[permission.group] ??= [];
            groups[permission.group].push(permission);

            return groups;
        },
        {},
    );
}

function groupLabel(group: string) {
    const labels: Record<string, string> = {
        users: 'Pengguna',
        students: 'Siswa & Orang Tua',
        classes: 'Kelas',
        roles: 'Role & Permission',
        school_locations: 'Lokasi sekolah',
        attendance: 'Absensi',
        grades: 'Penilaian',
        lms: 'LMS',
        xp: 'XP',
        children: 'Orang tua',
        notifications: 'Notifikasi',
    };

    return labels[group] ?? group.replaceAll('_', ' ');
}

export default function AdminRolesIndex({
    roles,
    permissions,
    protectedRoles,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canCreateRoles = auth.permissions.includes('roles.create');
    const canUpdateRoles = auth.permissions.includes('roles.update');
    const canDeleteRoles = auth.permissions.includes('roles.delete');
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const form = useForm<RoleForm>(emptyForm);
    const permissionGroups = useMemo(
        () => groupedPermissions(permissions),
        [permissions],
    );
    const editingRole = roles.find((role) => role.id === editingRoleId) ?? null;
    const isProtectedRole = editingRole
        ? protectedRoles.includes(editingRole.name)
        : false;

    function resetForm() {
        setEditingRoleId(null);
        setIsFormOpen(false);
        form.clearErrors();
        form.setData(emptyForm);
    }

    function addRole() {
        setEditingRoleId(null);
        form.clearErrors();
        form.setData(emptyForm);
        setIsFormOpen(true);
    }

    function editRole(role: RoleRow) {
        setEditingRoleId(role.id);
        form.clearErrors();
        form.setData({
            name: role.name,
            permissions: role.permissions,
        });
        setIsFormOpen(true);
    }

    function changeFormOpen(open: boolean) {
        setIsFormOpen(open);

        if (!open) {
            resetForm();
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editingRoleId) {
            form.put(`/admin/roles/${editingRoleId}`, options);

            return;
        }

        form.post('/admin/roles', options);
    }

    function deleteRole(role: RoleRow) {
        if (
            protectedRoles.includes(role.name) ||
            role.users_count > 0 ||
            !window.confirm(`Hapus role ${role.label}?`)
        ) {
            return;
        }

        form.delete(`/admin/roles/${role.id}`, {
            preserveScroll: true,
        });
    }

    function togglePermission(permissionName: string, checked: boolean) {
        form.setData(
            'permissions',
            checked
                ? [...form.data.permissions, permissionName]
                : form.data.permissions.filter(
                      (permission) => permission !== permissionName,
                  ),
        );
    }

    function toggleGroup(groupPermissions: PermissionRow[], checked: boolean) {
        const names = groupPermissions.map((permission) => permission.name);

        form.setData(
            'permissions',
            checked
                ? Array.from(new Set([...form.data.permissions, ...names]))
                : form.data.permissions.filter(
                      (permission) => !names.includes(permission),
                  ),
        );
    }

    return (
        <>
            <Head title="Role & Permission" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Akses sistem
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Role & Permission
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Kelola role dan pilih permission yang boleh dipakai
                            oleh setiap role.
                        </p>
                    </div>
                    {canCreateRoles && (
                        <Button type="button" onClick={addRole}>
                            <Plus />
                            Tambah role
                        </Button>
                    )}
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {statItems(stats).map((item) => (
                        <div key={item.label} className="sapa-card p-4">
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
                    <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">Daftar role</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Pengguna
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Permission
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {roles.map((role) => {
                                    const protectedRole =
                                        protectedRoles.includes(role.name);

                                    return (
                                        <tr key={role.id}>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">
                                                        {role.label}
                                                    </p>
                                                    {protectedRole && (
                                                        <Badge variant="secondary">
                                                            Bawaan
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-muted-foreground">
                                                    {role.name}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted-foreground">
                                                {role.users_count} pengguna
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex max-w-2xl flex-wrap gap-2">
                                                    {role.permissions.length ===
                                                        0 && (
                                                        <Badge variant="outline">
                                                            Belum ada
                                                        </Badge>
                                                    )}
                                                    {role.permissions.map(
                                                        (permission) => (
                                                            <Badge
                                                                key={permission}
                                                                variant="outline"
                                                            >
                                                                {permission}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-wrap gap-2">
                                                    {canUpdateRoles && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                editRole(role)
                                                            }
                                                        >
                                                            <Pencil />
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {canDeleteRoles && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                protectedRole ||
                                                                role.users_count >
                                                                    0
                                                            }
                                                            onClick={() =>
                                                                deleteRole(role)
                                                            }
                                                        >
                                                            <Trash2 />
                                                            Hapus
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Dialog open={isFormOpen} onOpenChange={changeFormOpen}>
                    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? 'Edit role' : 'Tambah role'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingRole
                                    ? `Atur permission untuk ${editingRole.label}.`
                                    : 'Buat role baru dan pilih permission yang diperlukan.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama role</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    disabled={isProtectedRole}
                                    onChange={(event) =>
                                        form.setData(
                                            'name',
                                            event.target.value
                                                .toLowerCase()
                                                .replaceAll(' ', '_'),
                                        )
                                    }
                                    placeholder="contoh: wali_kelas"
                                    required={!editingRole}
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-3">
                                <Label>Permission</Label>
                                <InputError message={form.errors.permissions} />
                                {Object.entries(permissionGroups).map(
                                    ([group, groupPermissions]) => {
                                        const allChecked =
                                            groupPermissions.length > 0 &&
                                            groupPermissions.every(
                                                (permission) =>
                                                    form.data.permissions.includes(
                                                        permission.name,
                                                    ),
                                            );

                                        return (
                                            <div
                                                key={group}
                                                className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border"
                                            >
                                                <div className="flex items-center justify-between gap-3 border-b border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                                    <div>
                                                        <p className="font-medium capitalize">
                                                            {groupLabel(group)}
                                                        </p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {
                                                                groupPermissions.length
                                                            }{' '}
                                                            permission
                                                        </p>
                                                    </div>
                                                    <label className="flex items-center gap-2 text-sm font-medium">
                                                        <Checkbox
                                                            checked={allChecked}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                toggleGroup(
                                                                    groupPermissions,
                                                                    checked ===
                                                                        true,
                                                                )
                                                            }
                                                        />
                                                        Semua
                                                    </label>
                                                </div>
                                                <div className="grid gap-2 p-3 md:grid-cols-2">
                                                    {groupPermissions.map(
                                                        (permission) => (
                                                            <label
                                                                key={
                                                                    permission.id
                                                                }
                                                                className="flex items-start gap-3 rounded-md border border-transparent p-2 hover:bg-muted/50"
                                                            >
                                                                <Checkbox
                                                                    checked={form.data.permissions.includes(
                                                                        permission.name,
                                                                    )}
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        togglePermission(
                                                                            permission.name,
                                                                            checked ===
                                                                                true,
                                                                        )
                                                                    }
                                                                />
                                                                <span className="grid gap-1 text-sm">
                                                                    <span className="font-medium">
                                                                        {
                                                                            permission.label
                                                                        }
                                                                    </span>
                                                                    <span className="text-muted-foreground">
                                                                        {
                                                                            permission.name
                                                                        }
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>

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
                                    Simpan role
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminRolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin/roles',
        },
        {
            title: 'Role & Permission',
            href: '/admin/roles',
        },
    ],
};

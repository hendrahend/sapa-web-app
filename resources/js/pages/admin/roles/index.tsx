import { Head } from '@inertiajs/react';
import { BadgeCheck, KeyRound, ShieldCheck } from 'lucide-react';
import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';

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
    stats: {
        totalRoles: number;
        totalPermissions: number;
        coveredPermissions: number;
    };
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

export default function AdminRolesIndex({
    roles,
    permissions,
    stats,
}: Props) {
    const permissionGroups = groupedPermissions(permissions);

    return (
        <>
            <Head title="Role & Permission" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Akses sistem
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Role & Permission
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Lihat matriks akses untuk admin, guru, siswa, dan orang
                        tua.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
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

                <section className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">
                            Matriks akses
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="min-w-56 px-4 py-3 font-medium">
                                        Permission
                                    </th>
                                    {roles.map((role) => (
                                        <th
                                            key={role.id}
                                            className="min-w-36 px-4 py-3 font-medium"
                                        >
                                            <div>
                                                <p>{role.label}</p>
                                                <p className="mt-1 text-xs">
                                                    {role.users_count} pengguna
                                                </p>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {Object.entries(permissionGroups).map(
                                    ([group, groupPermissions]) => (
                                        <Fragment key={group}>
                                            <tr>
                                                <td
                                                    colSpan={roles.length + 1}
                                                    className="bg-muted/30 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground"
                                                >
                                                    {group}
                                                </td>
                                            </tr>
                                            {groupPermissions.map(
                                                (permission) => (
                                                    <tr key={permission.id}>
                                                        <td className="px-4 py-3 align-middle">
                                                            <p className="font-medium">
                                                                {
                                                                    permission.label
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-muted-foreground">
                                                                {
                                                                    permission.name
                                                                }
                                                            </p>
                                                        </td>
                                                        {roles.map((role) => {
                                                            const hasPermission =
                                                                role.permissions.includes(
                                                                    permission.name,
                                                                );

                                                            return (
                                                                <td
                                                                    key={`${role.id}-${permission.id}`}
                                                                    className="px-4 py-3 align-middle"
                                                                >
                                                                    <Badge
                                                                        variant={
                                                                            hasPermission
                                                                                ? 'secondary'
                                                                                : 'outline'
                                                                        }
                                                                    >
                                                                        {hasPermission
                                                                            ? 'Diizinkan'
                                                                            : 'Tidak'}
                                                                    </Badge>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ),
                                            )}
                                        </Fragment>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
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

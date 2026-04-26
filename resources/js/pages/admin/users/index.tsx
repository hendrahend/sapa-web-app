import { Head } from '@inertiajs/react';
import { CheckCircle2, Link2, ShieldAlert, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        school_class: {
            id: number;
            name: string;
        } | null;
    } | null;
    created_attendance_sessions_count: number;
    verified_attendance_records_count: number;
};

type Props = {
    users: UserRow[];
    roles: RoleSummary[];
    stats: {
        totalUsers: number;
        verifiedUsers: number;
        linkedStudents: number;
        withoutRole: number;
    };
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

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Total pengguna',
            value: stats.totalUsers,
            icon: Users,
        },
        {
            label: 'Email terverifikasi',
            value: stats.verifiedUsers,
            icon: CheckCircle2,
        },
        {
            label: 'Akun siswa tertaut',
            value: stats.linkedStudents,
            icon: Link2,
        },
        {
            label: 'Tanpa role',
            value: stats.withoutRole,
            icon: ShieldAlert,
        },
    ];
}

export default function AdminUsersIndex({ users, roles, stats }: Props) {
    return (
        <>
            <Head title="Pengguna" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Administrasi
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Pengguna
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Pantau akun admin, guru, siswa, dan orang tua yang
                        sudah masuk ke SAPA.
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

                <section className="grid gap-4 xl:grid-cols-[minmax(240px,320px)_1fr]">
                    <div className="h-fit rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="text-lg font-semibold">
                                Komposisi role
                            </h2>
                        </div>
                        <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="flex items-center justify-between gap-3 p-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {role.label}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {role.name}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {role.users_count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="text-lg font-semibold">
                                Pengguna terbaru
                            </h2>
                        </div>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {users.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-muted-foreground"
                                            >
                                                Belum ada pengguna.
                                            </td>
                                        </tr>
                                    )}

                                    {users.map((user) => (
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
                                                    {user.roles.length === 0 && (
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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

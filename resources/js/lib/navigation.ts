import {
    Award,
    Bell,
    BookOpen,
    ClipboardCheck,
    GraduationCap,
    IdCard,
    LayoutGrid,
    MapPinned,
    School,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { Auth, NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Absensi',
        href: '/attendance',
        icon: ClipboardCheck,
        permissions: [
            'attendance.manage',
            'attendance.view',
            'attendance.own.view',
        ],
    },
    {
        title: 'Penilaian',
        href: '/grades',
        icon: GraduationCap,
        permissions: ['grades.manage', 'grades.view'],
    },
    {
        title: 'LMS',
        href: '/lms',
        icon: BookOpen,
        permissions: ['lms.manage', 'lms.view'],
    },
    {
        title: 'XP',
        href: '/xp',
        icon: Award,
        permissions: ['xp.manage', 'xp.view'],
    },
    {
        title: 'Notifikasi',
        href: '/notifications',
        icon: Bell,
        permissions: ['notifications.manage', 'notifications.view'],
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Pengguna',
        href: '/admin/users',
        icon: Users,
        permissions: ['users.manage'],
    },
    {
        title: 'Siswa & Orang Tua',
        href: '/admin/students',
        icon: IdCard,
        permissions: ['users.manage'],
    },
    {
        title: 'Data Kelas',
        href: '/admin/classes',
        icon: School,
        permissions: ['users.manage'],
    },
    {
        title: 'Role & Permission',
        href: '/admin/roles',
        icon: ShieldCheck,
        permissions: ['users.manage'],
    },
    {
        title: 'Lokasi Sekolah',
        href: '/admin/school-location',
        icon: MapPinned,
        permissions: ['school_locations.manage'],
    },
];

function canAccessItem(item: NavItem, auth: Auth): boolean {
    const roles = item.roles ?? [];
    const permissions = item.permissions ?? [];

    if (roles.length === 0 && permissions.length === 0) {
        return true;
    }

    return (
        roles.some((role) => auth.roles.includes(role)) ||
        permissions.some((permission) => auth.permissions.includes(permission))
    );
}

export function getMainNavItems(auth: Auth): NavItem[] {
    return mainNavItems.filter((item) => canAccessItem(item, auth));
}

export function getAdminNavItems(auth: Auth): NavItem[] {
    return adminNavItems.filter((item) => canAccessItem(item, auth));
}

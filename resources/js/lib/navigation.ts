import {
    Award,
    Bell,
    BarChart3,
    BookOpen,
    ClipboardCheck,
    Gift,
    GraduationCap,
    IdCard,
    LayoutGrid,
    MapPinned,
    School,
    ShieldCheck,
    Store,
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
        permissions: ['attendance.view', 'attendance.own.view'],
    },
    {
        title: 'Penilaian',
        href: '/grades',
        icon: GraduationCap,
        permissions: ['grades.view'],
    },
    {
        title: 'LMS',
        href: '/lms',
        icon: BookOpen,
        permissions: ['lms.view'],
    },
    {
        title: 'Insight Kelas',
        href: '/class-insights',
        icon: BarChart3,
        permissions: ['grades.view'],
    },
    {
        title: 'XP',
        href: '/xp',
        icon: Award,
        permissions: ['xp.view'],
    },
    {
        title: 'Toko XP',
        href: '/rewards',
        icon: Gift,
        permissions: ['rewards.view'],
    },
    {
        title: 'Notifikasi',
        href: '/notifications',
        icon: Bell,
        permissions: ['notifications.view'],
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Pengguna',
        href: '/admin/users',
        icon: Users,
        permissions: ['users.view'],
    },
    {
        title: 'Siswa & Orang Tua',
        href: '/admin/students',
        icon: IdCard,
        permissions: ['students.view'],
    },
    {
        title: 'Data Kelas',
        href: '/admin/classes',
        icon: School,
        permissions: ['classes.view'],
    },
    {
        title: 'Role & Permission',
        href: '/admin/roles',
        icon: ShieldCheck,
        permissions: ['roles.view'],
    },
    {
        title: 'Lokasi Sekolah',
        href: '/admin/school-location',
        icon: MapPinned,
        permissions: ['school_locations.view'],
    },
    {
        title: 'Kelola Reward',
        href: '/admin/rewards',
        icon: Store,
        permissions: ['rewards.manage'],
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
    return mainNavItems
        .filter((item) => canAccessItem(item, auth))
        .map((item) => {
            if (item.title === 'Notifikasi') {
                const unread = auth.unreadNotifications ?? 0;

                return { ...item, badge: unread > 0 ? unread : null };
            }

            return item;
        });
}

export function getAdminNavItems(auth: Auth): NavItem[] {
    return adminNavItems.filter((item) => canAccessItem(item, auth));
}

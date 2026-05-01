import {
    Award,
    Bell,
    BarChart3,
    BookMarked,
    BookOpen,
    ClipboardCheck,
    GraduationCap,
    IdCard,
    LayoutGrid,
    MapPinned,
    Menu as MenuIcon,
    School,
    Settings,
    ShieldCheck,
    Store,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Auth, NavGroup, NavItem, SharedMenuItem } from '@/types';

const iconMap: Record<string, LucideIcon> = {
    Award,
    Bell,
    BarChart3,
    BookMarked,
    BookOpen,
    ClipboardCheck,
    GraduationCap,
    IdCard,
    LayoutGrid,
    MapPinned,
    Menu: MenuIcon,
    School,
    Settings,
    ShieldCheck,
    Store,
    Users,
};

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
        title: 'XP & Reward',
        href: '/xp',
        icon: Award,
        permissions: ['xp.view', 'rewards.view'],
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
        title: 'Mapel',
        href: '/admin/subjects',
        icon: BookMarked,
        permissions: ['subjects.view'],
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

function hasSharedMenus(menus: unknown): menus is SharedMenuItem[] {
    return Array.isArray(menus) && menus.length > 0;
}

function unreadNotificationBadge(item: NavItem, auth: Auth): NavItem {
    if (item.title !== 'Notifikasi') {
        return item;
    }

    const unread = auth.unreadNotifications ?? 0;

    return { ...item, badge: unread > 0 ? unread : null };
}

export function resolveNavIcon(icon: NavItem['icon']): LucideIcon | null {
    if (!icon) {
        return null;
    }

    if (typeof icon !== 'string') {
        return icon;
    }

    return iconMap[icon] ?? null;
}

function toNavItems(items: SharedMenuItem[] = []): NavItem[] {
    return items
        .filter((item): item is SharedMenuItem & { href: NavItem['href'] } =>
            Boolean(item.href),
        )
        .map((item) => ({
            id: item.id,
            title: item.title,
            href: item.href,
            icon: item.icon,
            badge: item.badge,
        }));
}

export function getNavGroups(auth: Auth, menus?: SharedMenuItem[]): NavGroup[] {
    if (hasSharedMenus(menus)) {
        return menus
            .map((menu) => ({
                id: menu.id,
                title: menu.title,
                children: toNavItems(menu.children ?? []),
            }))
            .filter((group) => group.children.length > 0);
    }

    return [
        {
            title: 'Platform',
            children: getMainNavItems(auth),
        },
        {
            title: 'Admin',
            children: getAdminNavItems(auth),
        },
    ];
}

export function getMainNavItems(
    auth: Auth,
    menus?: SharedMenuItem[],
): NavItem[] {
    if (hasSharedMenus(menus)) {
        const platform = menus.find((item) => item.title === 'Platform');

        return toNavItems(platform?.children ?? menus).map((item) =>
            unreadNotificationBadge(item, auth),
        );
    }

    return mainNavItems
        .filter((item) => canAccessItem(item, auth))
        .map((item) => unreadNotificationBadge(item, auth));
}

export function getAdminNavItems(auth: Auth): NavItem[] {
    return adminNavItems.filter((item) => canAccessItem(item, auth));
}

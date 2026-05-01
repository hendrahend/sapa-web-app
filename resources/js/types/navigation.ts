import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    id?: number;
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | string | null;
    isActive?: boolean;
    permissions?: string[];
    roles?: string[];
    badge?: number | string | null;
};

export type SharedMenuItem = {
    id?: number;
    title: string;
    href?: NonNullable<InertiaLinkProps['href']> | null;
    icon?: LucideIcon | string | null;
    badge?: number | string | null;
    children?: SharedMenuItem[];
};

export type NavGroup = {
    id?: number;
    title: string;
    children: NavItem[];
};

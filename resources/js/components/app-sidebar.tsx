import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getNavGroups } from '@/lib/navigation';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const { auth, menus } = usePage().props;
    const navGroups = getNavGroups(auth, menus);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="pt-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
                    <NavMain
                        key={group.id ?? group.title}
                        items={group.children}
                        label={group.title}
                    />
                ))}
            </SidebarContent>

            <SidebarFooter className="pb-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

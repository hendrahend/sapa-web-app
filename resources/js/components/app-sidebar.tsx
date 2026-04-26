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
import { getAdminNavItems, getMainNavItems } from '@/lib/navigation';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const { auth } = usePage().props;
    const mainNavItems = getMainNavItems(auth);
    const adminNavItems = getAdminNavItems(auth);

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
                <NavMain items={mainNavItems} />
                <NavMain items={adminNavItems} label="Admin" />
            </SidebarContent>

            <SidebarFooter className="pb-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

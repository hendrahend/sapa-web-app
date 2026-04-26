import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-emerald-700/15">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    SAPA
                </span>
                <span className="truncate text-xs text-sidebar-foreground/65">
                    Sistem Absensi & Penilaian
                </span>
            </div>
        </>
    );
}

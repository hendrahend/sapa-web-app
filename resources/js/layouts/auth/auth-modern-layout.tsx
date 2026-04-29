import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const highlights = [
    'Absensi real-time',
    'Rekap nilai rapi',
    'Notifikasi orang tua',
];

export default function AuthModernLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <main className="min-h-svh bg-[#f7fffb] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
            <div className="grid min-h-svh lg:grid-cols-[0.95fr_1.05fr]">
                <section className="hidden border-r border-emerald-100 bg-[#e7fbf2] px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-14 dark:border-slate-800 dark:bg-slate-900">
                    <Link
                        href={home()}
                        className="flex w-fit items-center gap-3"
                    >
                        <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-white">
                            <AppLogoIcon className="size-6 fill-current" />
                        </span>
                        <span className="grid">
                            <span className="text-base font-semibold">
                                SAPA
                            </span>
                            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                Sistem Absensi & Penilaian
                            </span>
                        </span>
                    </Link>

                    <div className="max-w-lg">
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                            Untuk sekolah yang ingin lebih tertata
                        </p>
                        <h1 className="mt-4 text-4xl leading-tight font-semibold text-slate-950 dark:text-slate-50">
                            Masuk/Daftar.
                        </h1>
                        <p className="mt-5 max-w-md text-base leading-7 text-slate-700 dark:text-slate-300">
                            SAPA membantu guru, siswa, admin, dan orang tua
                            memantau absensi serta penilaian dalam satu tempat
                            yang ringan dipakai setiap hari.
                        </p>

                        <div className="mt-8 grid gap-3">
                            {highlights.map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 rounded-lg border border-emerald-200/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950/55 dark:text-slate-100"
                                >
                                    <span className="size-2 rounded-full bg-emerald-600" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Data sekolah tetap dekat dengan pengguna yang
                        membutuhkannya, tanpa proses yang dibuat rumit.
                    </p>
                </section>

                <section className="flex min-h-svh items-center justify-center px-5 py-8 sm:px-6 lg:px-10">
                    <div className="w-full max-w-md">
                        <Link
                            href={home()}
                            className="mx-auto mb-8 flex w-fit items-center gap-3 lg:hidden"
                        >
                            <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-white">
                                <AppLogoIcon className="size-6 fill-current" />
                            </span>
                            <span className="grid">
                                <span className="text-base font-semibold">
                                    SAPA
                                </span>
                                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                    Sistem Absensi & Penilaian
                                </span>
                            </span>
                        </Link>

                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-7 space-y-2">
                                <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {children}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

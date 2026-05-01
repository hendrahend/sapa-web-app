import { Head, Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    BellRing,
    BookOpenCheck,
    BrainCircuit,
    CheckCircle2,
    ClipboardCheck,
    GraduationCap,
    LayoutDashboard,
    MapPin,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserRoundCheck,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';

type Feature = {
    title: string;
    description: string;
    icon: typeof ClipboardCheck;
    accent: 'emerald' | 'lime' | 'violet' | 'amber' | 'rose';
};

type Metric = {
    label: string;
    value: string;
    helper: string;
    icon: typeof ClipboardCheck;
    tone: 'emerald' | 'amber' | 'violet';
};

const features: Feature[] = [
    {
        title: 'Absensi',
        description:
            'Siswa check-in dari perangkatnya sendiri dengan validasi lokasi dan foto. Guru memantau hadir, terlambat, dan yang perlu diverifikasi secara real-time.',
        icon: ClipboardCheck,
        accent: 'emerald',
    },
    {
        title: 'Rekap nilai yang rapi',
        description:
            'Nilai dari tugas, kuis, praktik, UTS, dan UAS dikumpulkan dalam satu rekap. Guru tetap bisa melihat sumber nilainya tanpa mengejar banyak file.',
        icon: GraduationCap,
        accent: 'lime',
    },
    {
        title: 'Tugas LMS + Asisten AI',
        description:
            'Materi dan tugas berjalan di LMS. Setelah siswa mengumpulkan jawaban, guru bisa memberi skor dan feedback, dibantu AI untuk draft penilaian.',
        icon: BrainCircuit,
        accent: 'violet',
    },
    {
        title: 'XP & gamifikasi',
        description:
            'Setiap kehadiran tepat waktu, tugas selesai, dan nilai bagus memberi XP. Level bar, lencana, dan papan peringkat menjaga motivasi siswa.',
        icon: Trophy,
        accent: 'amber',
    },
    {
        title: 'Notifikasi orang tua',
        description:
            'Orang tua langsung mendapat kabar saat anaknya hadir, terlambat, atau menerima nilai baru — lewat inbox di aplikasi.',
        icon: BellRing,
        accent: 'rose',
    },
    {
        title: 'Manajemen sekolah',
        description:
            'Admin mengelola siswa, orang tua, kelas, role, dan lokasi absensi dari satu panel. RBAC bawaan menjaga setiap data tetap di tangan yang tepat.',
        icon: ShieldCheck,
        accent: 'emerald',
    },
];

const accentMap: Record<Feature['accent'], { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    lime: { bg: 'bg-lime-50', text: 'text-lime-700' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
};

const flows = [
    {
        role: 'Admin sekolah',
        text: 'Mengelola siswa, orang tua, kelas, role, dan lokasi absensi.',
        icon: ShieldCheck,
    },
    {
        role: 'Guru',
        text: 'Membuka sesi absensi, memverifikasi data, dan menginput nilai.',
        icon: UserRoundCheck,
    },
    {
        role: 'Siswa',
        text: 'Absen dari perangkat sendiri, mengikuti LMS, dan mengumpulkan tugas.',
        icon: BookOpenCheck,
    },
    {
        role: 'Orang tua',
        text: 'Melihat kabar kehadiran, nilai, dan perkembangan anak.',
        icon: MessageCircle,
    },
];

const metrics: Metric[] = [
    {
        label: 'Modul inti',
        value: '3+',
        helper: 'Absensi, nilai, LMS',
        icon: ClipboardCheck,
        tone: 'emerald',
    },
    {
        label: 'XP reward',
        value: 'Gamifikasi',
        helper: 'Level, lencana, leaderboard',
        icon: Trophy,
        tone: 'amber',
    },
    {
        label: 'AI grading',
        value: 'Asisten AI',
        helper: 'Draft skor dan feedback',
        icon: BrainCircuit,
        tone: 'violet',
    },
];

const metricToneMap: Record<
    Metric['tone'],
    {
        border: string;
        icon: string;
        iconBg: string;
        bar: string;
        chip: string;
    }
> = {
    emerald: {
        border: 'border-emerald-200/80',
        icon: 'text-emerald-700',
        iconBg: 'bg-emerald-100',
        bar: 'bg-emerald-500',
        chip: 'bg-emerald-50 text-emerald-700',
    },
    amber: {
        border: 'border-amber-200/80',
        icon: 'text-amber-700',
        iconBg: 'bg-amber-100',
        bar: 'bg-amber-400',
        chip: 'bg-amber-50 text-amber-700',
    },
    violet: {
        border: 'border-violet-200/80',
        icon: 'text-violet-700',
        iconBg: 'bg-violet-100',
        bar: 'bg-violet-500',
        chip: 'bg-violet-50 text-violet-700',
    },
};

const heroTiles = [
    {
        className:
            'right-[5%] top-[18%] size-12 border-emerald-300/55 bg-white/18',
        animate: { x: [0, 22, 0], y: [0, -18, 0], rotate: [0, 8, 0] },
        duration: 9,
        delay: 0.2,
    },
    {
        className:
            'right-[20%] top-[30%] size-8 border-lime-300/60 bg-lime-100/20',
        animate: { x: [0, -18, 0], y: [0, 20, 0], rotate: [0, -10, 0] },
        duration: 7,
        delay: 1.1,
    },
    {
        className:
            'right-[42%] top-[20%] size-10 border-emerald-400/35 bg-emerald-100/20',
        animate: { x: [0, 16, 0], y: [0, 24, 0], rotate: [0, 12, 0] },
        duration: 10,
        delay: 0.7,
    },
    {
        className:
            'right-[14%] bottom-[20%] size-14 border-white/60 bg-white/24',
        animate: { x: [0, -24, 0], y: [0, -14, 0], rotate: [0, -7, 0] },
        duration: 8,
        delay: 0.4,
    },
    {
        className:
            'right-[36%] bottom-[14%] size-7 border-emerald-300/50 bg-lime-50/30',
        animate: { x: [0, 18, 0], y: [0, -26, 0], rotate: [0, 14, 0] },
        duration: 7.5,
        delay: 1.6,
    },
    {
        className:
            'right-[2%] bottom-[44%] size-9 border-emerald-200/60 bg-white/20',
        animate: { x: [0, -16, 0], y: [0, 18, 0], rotate: [0, 9, 0] },
        duration: 8.5,
        delay: 1,
    },
];

const painPoints = [
    'Absensi manual sulit dipantau real-time dan rawan titip absen.',
    'Penugasan tersebar di banyak sistem.',
    'Orang tua sering terlambat tahu saat anaknya tidak masuk sekolah.',
    'Motivasi belajar siswa sulit diukur dan dihargai secara sistematis.',
];

const demoAccounts = [
    {
        role: 'Admin',
        email: 'admin@sapa.test',
        description: 'Akses penuh ke pengelolaan sekolah.',
    },
    {
        role: 'Guru',
        email: 'guru@sapa.test',
        description: 'Membuka absensi, menilai, dan menggunakan LMS + AI.',
    },
    {
        role: 'Siswa',
        email: 'siswa@sapa.test',
        description: 'Check-in absensi, mengikuti LMS, melihat XP.',
    },
    {
        role: 'Orang tua',
        email: 'orangtua@sapa.test',
        description: 'Inbox notifikasi kehadiran dan nilai anak.',
    },
];

function DashboardPreview() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 80, y: 30 }}
            animate={
                shouldReduceMotion
                    ? undefined
                    : { opacity: 1, x: 0, y: [0, -10, 0] }
            }
            transition={
                shouldReduceMotion
                    ? undefined
                    : {
                          opacity: { duration: 0.7, delay: 0.35 },
                          x: { duration: 0.7, delay: 0.35 },
                          y: {
                              duration: 6,
                              repeat: Infinity,
                              ease: 'easeInOut',
                          },
                      }
            }
            className="pointer-events-none absolute right-[-120px] bottom-[-72px] hidden w-[760px] rotate-[-2deg] lg:block"
        >
            <motion.div
                whileHover={shouldReduceMotion ? undefined : { rotate: 0 }}
                className="rounded-lg border border-white/60 bg-white/92 p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur"
            >
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span className="size-2 rounded-full bg-emerald-300" />
                        <span className="size-2 rounded-full bg-lime-400" />
                    </div>
                    <div className="h-2 w-28 rounded-full bg-slate-100" />
                </div>

                <div className="grid gap-4 pt-4 md:grid-cols-[180px_1fr]">
                    <div className="grid gap-3">
                        {[
                            'Dashboard',
                            'Absensi',
                            'Nilai',
                            'LMS',
                            'XP',
                            'Notifikasi',
                        ].map((item, index) => (
                            <div
                                key={item}
                                className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium ${
                                    index === 1
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-50 text-slate-500'
                                }`}
                            >
                                <span
                                    className={`size-2 rounded-full ${
                                        index === 1
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-300'
                                    }`}
                                />
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            {[
                                ['Hadir hari ini', '218', 'emerald'],
                                ['Terlambat', '12', 'lime'],
                                ['Perlu cek', '7', 'amber'],
                            ].map(([label, value, tone]) => (
                                <div
                                    key={label}
                                    className="rounded-lg border border-slate-100 bg-white p-3"
                                >
                                    <p className="text-xs text-slate-500">
                                        {label}
                                    </p>
                                    <p
                                        className={`mt-2 text-2xl font-semibold ${
                                            tone === 'emerald'
                                                ? 'text-emerald-600'
                                                : tone === 'lime'
                                                  ? 'text-lime-700'
                                                  : 'text-amber-600'
                                        }`}
                                    >
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                            <div className="rounded-lg border border-slate-100 bg-white p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-800">
                                        Aktivitas kelas
                                    </p>
                                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                                        XI RPL
                                    </span>
                                </div>
                                <div className="flex h-32 items-end gap-3">
                                    {[38, 72, 58, 90, 66, 82, 74].map(
                                        (height, index) => (
                                            <motion.span
                                                key={index}
                                                initial={
                                                    shouldReduceMotion
                                                        ? false
                                                        : { height: 0 }
                                                }
                                                animate={
                                                    shouldReduceMotion
                                                        ? undefined
                                                        : {
                                                              height: `${height}%`,
                                                          }
                                                }
                                                transition={{
                                                    duration: 0.7,
                                                    delay: 0.7 + index * 0.08,
                                                }}
                                                className="flex-1 rounded-t-md bg-emerald-400"
                                                style={{
                                                    opacity:
                                                        index % 2 === 0
                                                            ? 0.72
                                                            : 1,
                                                }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg bg-emerald-600 p-4 text-white">
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    <p className="text-sm font-semibold">
                                        Radius
                                    </p>
                                </div>
                                <div className="mt-6 grid place-items-center">
                                    <div className="grid size-24 place-items-center rounded-full border border-white/35">
                                        <div className="grid size-16 place-items-center rounded-full border border-white/45">
                                            <div className="size-7 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-5 text-xs text-emerald-50">
                                    Validasi lokasi aktif saat siswa melakukan
                                    absensi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const shouldReduceMotion = useReducedMotion();

    return (
        <>
            <Head title="SAPA — Sistem Absensi & Penilaian Sekolah">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <main className="min-h-screen bg-[#f7fffb] text-slate-950">
                <section className="relative isolate min-h-[760px] overflow-hidden bg-[#dff9ee]">
                    <div className="absolute inset-0 bg-[linear-gradient(#a7f3d033_1px,transparent_1px),linear-gradient(90deg,#86efac2e_1px,transparent_1px)] bg-[size:56px_56px]" />
                    <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0 }}
                        animate={
                            shouldReduceMotion ? undefined : { opacity: 1 }
                        }
                        transition={{ duration: 0.8 }}
                        className="absolute right-0 bottom-0 h-[78%] w-[72%] bg-[#c9f8dd]"
                    />
                    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
                        {heroTiles.map((tile, index) => (
                            <motion.span
                                key={index}
                                animate={
                                    shouldReduceMotion
                                        ? undefined
                                        : tile.animate
                                }
                                transition={
                                    shouldReduceMotion
                                        ? undefined
                                        : {
                                              duration: tile.duration,
                                              delay: tile.delay,
                                              repeat: Infinity,
                                              ease: 'easeInOut',
                                          }
                                }
                                className={`absolute rounded-lg border shadow-sm shadow-emerald-900/5 backdrop-blur-[1px] ${tile.className}`}
                            />
                        ))}
                    </div>
                    <motion.div
                        animate={
                            shouldReduceMotion
                                ? undefined
                                : { y: [0, -16, 0], rotate: [0, 4, 0] }
                        }
                        transition={{
                            duration: 7,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute right-[8%] bottom-[18%] h-44 w-44 rounded-lg bg-white/40"
                    />
                    <motion.div
                        animate={
                            shouldReduceMotion
                                ? undefined
                                : {
                                      scale: [1, 1.08, 1],
                                      opacity: [0.35, 0.5, 0.35],
                                  }
                        }
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute top-32 right-[34%] hidden size-20 rounded-lg bg-emerald-300/40 md:block"
                    />
                    <DashboardPreview />

                    <div className="relative mx-auto flex min-h-[760px] w-full max-w-7xl flex-col px-6 py-5 lg:px-8">
                        <motion.header
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: -16 }
                            }
                            animate={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, y: 0 }
                            }
                            transition={{ duration: 0.45 }}
                            className="flex items-center justify-between"
                        >
                            <Link href="/" className="flex items-center gap-3">
                                <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-white">
                                    <AppLogoIcon className="size-6 fill-current" />
                                </span>
                                <span className="grid">
                                    <span className="text-base font-semibold">
                                        SAPA
                                    </span>
                                    <span className="text-xs font-medium text-emerald-800">
                                        Sistem Absensi & Penilaian
                                    </span>
                                </span>
                            </Link>

                            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
                                <a href="#fitur">Fitur</a>
                                <a href="#alur">Alur</a>
                                <a href="#demo">Demo</a>
                            </nav>

                            <div className="flex items-center gap-2">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        aria-label="Buka dashboard"
                                        className="inline-flex size-10 items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-700 sm:size-auto sm:px-4 sm:py-2"
                                    >
                                        <LayoutDashboard className="size-4 sm:hidden" />
                                        <span className="hidden sm:inline">
                                            Dashboard
                                        </span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white/60"
                                        >
                                            Masuk
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="hidden rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 sm:inline-flex"
                                            >
                                                Daftar
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.header>

                        <div className="flex flex-1 items-center py-16">
                            <motion.div
                                initial={
                                    shouldReduceMotion
                                        ? false
                                        : { opacity: 0, y: 28 }
                                }
                                animate={
                                    shouldReduceMotion
                                        ? undefined
                                        : { opacity: 1, y: 0 }
                                }
                                transition={{ duration: 0.6, delay: 0.12 }}
                                className="max-w-3xl"
                            >
                                <motion.div
                                    whileHover={
                                        shouldReduceMotion
                                            ? undefined
                                            : { y: -2, scale: 1.02 }
                                    }
                                    className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white/75 px-3 py-2 text-sm font-semibold text-emerald-800"
                                >
                                    <Sparkles className="size-4" />
                                    Transformasi digital untuk sekolah Indonesia
                                </motion.div>

                                <h1 className="mt-7 max-w-2xl text-5xl leading-[1.05] font-bold tracking-tight text-slate-950 md:text-7xl">
                                    Absensi, tugas, nilai, dan kabar {''}
                                    {/* <br /> */}
                                    <span className="text-emerald-700">
                                        dalam satu sapaan.
                                    </span>
                                </h1>
                                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
                                    SAPA mengikuti alur sekolah dari siswa
                                    hadir, belajar di LMS, mengumpulkan tugas,
                                    menerima nilai, sampai orang tua mendapat
                                    kabar. Semua tersambung dalam satu aplikasi.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <motion.div
                                        whileHover={
                                            shouldReduceMotion
                                                ? undefined
                                                : { y: -3 }
                                        }
                                        whileTap={
                                            shouldReduceMotion
                                                ? undefined
                                                : { scale: 0.98 }
                                        }
                                    >
                                        <Link
                                            href={
                                                auth.user
                                                    ? dashboard()
                                                    : login()
                                            }
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-700/20 hover:bg-emerald-700"
                                        >
                                            <ClipboardCheck className="size-4" />
                                            {auth.user
                                                ? 'Buka dashboard'
                                                : 'Masuk ke aplikasi'}
                                        </Link>
                                    </motion.div>
                                    <motion.a
                                        href="#demo"
                                        whileHover={
                                            shouldReduceMotion
                                                ? undefined
                                                : { y: -3 }
                                        }
                                        whileTap={
                                            shouldReduceMotion
                                                ? undefined
                                                : { scale: 0.98 }
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
                                    >
                                        Coba akun demo
                                        <ArrowRight className="size-4" />
                                    </motion.a>
                                </div>

                                
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section id="masalah" className="bg-white py-20">
                    <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <motion.div
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 24 }
                            }
                            whileInView={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, y: 0 }
                            }
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.55 }}
                        >
                            <p className="text-sm font-semibold text-emerald-700 uppercase">
                                Masalah yang diselesaikan
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                                Kehadiran, tugas, nilai, dan komunikasi sekolah
                                seharusnya saling menyambung.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                SAPA dirancang supaya aktivitas harian sekolah
                                tidak berhenti sebagai catatan terpisah. Absensi
                                bisa memicu XP, tugas LMS bisa dinilai, dan
                                hasil penting langsung sampai ke orang tua.
                            </p>
                        </motion.div>

                        <div className="grid gap-3">
                            {painPoints.map((item, index) => (
                                <motion.div
                                    key={item}
                                    initial={
                                        shouldReduceMotion
                                            ? false
                                            : { opacity: 0, x: 24 }
                                    }
                                    whileInView={
                                        shouldReduceMotion
                                            ? undefined
                                            : { opacity: 1, x: 0 }
                                    }
                                    viewport={{ once: true, amount: 0.4 }}
                                    transition={{
                                        duration: 0.45,
                                        delay: index * 0.08,
                                    }}
                                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-[#f7fffb] p-4"
                                >
                                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                                        {index + 1}
                                    </span>
                                    <p className="leading-6 font-medium text-slate-800">
                                        {item}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="fitur" className="bg-[#f7fffb] py-20">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <motion.div
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 24 }
                            }
                            whileInView={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, y: 0 }
                            }
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.55 }}
                            className="max-w-3xl"
                        >
                            <p className="text-sm font-semibold text-emerald-700 uppercase">
                                Fitur utama
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                                Bukan kumpulan modul terpisah, tapi alur kerja
                                sekolah yang saling terhubung.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                Siswa mulai dari hadir dan belajar, guru
                                mengelola tugas serta nilai, lalu sistem
                                mengirim pembaruan penting ke orang tua. Sekali
                                setup, satu sumber kebenaran untuk sekolah.
                            </p>
                        </motion.div>

                        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {features.map((feature, index) => {
                                const accent = accentMap[feature.accent];

                                return (
                                    <motion.article
                                        key={feature.title}
                                        initial={
                                            shouldReduceMotion
                                                ? false
                                                : { opacity: 0, y: 28 }
                                        }
                                        whileInView={
                                            shouldReduceMotion
                                                ? undefined
                                                : { opacity: 1, y: 0 }
                                        }
                                        viewport={{ once: true, amount: 0.25 }}
                                        transition={{
                                            duration: 0.45,
                                            delay: index * 0.06,
                                        }}
                                        whileHover={
                                            shouldReduceMotion
                                                ? undefined
                                                : { y: -6, scale: 1.01 }
                                        }
                                        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div
                                            className={`grid size-11 place-items-center rounded-lg ${accent.bg} ${accent.text}`}
                                        >
                                            <feature.icon className="size-5" />
                                        </div>
                                        <h3 className="mt-5 text-lg font-semibold text-slate-950">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-6 text-slate-600">
                                            {feature.description}
                                        </p>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="alur" className="bg-[#effcf4] py-20">
                    <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                        <motion.div
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 24 }
                            }
                            whileInView={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, y: 0 }
                            }
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.55 }}
                        >
                            <p className="text-sm font-semibold text-emerald-700 uppercase">
                                Alur pengguna
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                                Setiap role punya ruang kerja yang jelas.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                Admin, guru, siswa, dan orang tua memakai
                                aplikasi yang sama — tetapi melihat menu, data,
                                dan aksi yang sesuai perannya. Hak akses dijaga
                                oleh sistem RBAC bawaan.
                            </p>
                        </motion.div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {flows.map((flow, index) => (
                                <motion.article
                                    key={flow.role}
                                    initial={
                                        shouldReduceMotion
                                            ? false
                                            : { opacity: 0, y: 24 }
                                    }
                                    whileInView={
                                        shouldReduceMotion
                                            ? undefined
                                            : { opacity: 1, y: 0 }
                                    }
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{
                                        duration: 0.45,
                                        delay: index * 0.06,
                                    }}
                                    whileHover={
                                        shouldReduceMotion
                                            ? undefined
                                            : { y: -5 }
                                    }
                                    className="rounded-lg border border-emerald-100 bg-white p-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                                            <flow.icon className="size-5" />
                                        </span>
                                        <h3 className="font-semibold text-slate-950">
                                            {flow.role}
                                        </h3>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-slate-600">
                                        {flow.text}
                                    </p>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="demo" className="bg-slate-950 py-20 text-white">
                    <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_440px] lg:px-8">
                        <motion.div
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, y: 24 }
                            }
                            whileInView={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, y: 0 }
                            }
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.55 }}
                        >
                            <p className="text-sm font-semibold text-emerald-300 uppercase">
                                Coba sekarang
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                                Empat akun demo, empat sudut pandang.
                            </h2>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                                Login dengan salah satu akun di samping untuk
                                merasakan SAPA dari sisi admin, guru, siswa,
                                atau orang tua. Semua akun memakai password{' '}
                                <code className="rounded bg-white/10 px-2 py-0.5 text-emerald-200">
                                    password
                                </code>
                                .
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                {[
                                    'Data 30 siswa demo siap pakai',
                                    'Riwayat absensi 7 hari',
                                    'Tugas LMS dengan submisi nyata',
                                    'XP & notifikasi terisi otomatis',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-medium"
                                    >
                                        <CheckCircle2 className="size-4 shrink-0 text-emerald-300" />
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={auth.user ? dashboard() : login()}
                                className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/30 hover:bg-emerald-400"
                            >
                                {auth.user
                                    ? 'Buka dashboard'
                                    : 'Masuk dengan akun demo'}
                                <ArrowRight className="size-4" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={
                                shouldReduceMotion
                                    ? false
                                    : { opacity: 0, scale: 0.96 }
                            }
                            whileInView={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, scale: 1 }
                            }
                            viewport={{ once: true, amount: 0.35 }}
                            transition={{ duration: 0.55, delay: 0.12 }}
                            className="rounded-xl border border-white/10 bg-white/5 p-5"
                        >
                            <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-200 uppercase">
                                <Award className="size-4" />
                                Akun demo
                            </div>
                            <div className="grid gap-3">
                                {demoAccounts.map((account) => (
                                    <div
                                        key={account.email}
                                        className="rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-emerald-300/40 hover:bg-white/10"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-white">
                                                {account.role}
                                            </p>
                                            <code className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-emerald-200">
                                                {account.email}
                                            </code>
                                        </div>
                                        <p className="mt-2 text-xs leading-5 text-slate-300">
                                            {account.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-xs text-slate-400">
                                Password untuk semua akun:{' '}
                                <code className="rounded bg-white/10 px-2 py-0.5 text-emerald-200">
                                    password
                                </code>
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="bg-white px-6 py-20">
                    <motion.div
                        initial={
                            shouldReduceMotion ? false : { opacity: 0, y: 24 }
                        }
                        whileInView={
                            shouldReduceMotion
                                ? undefined
                                : { opacity: 1, y: 0 }
                        }
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.55 }}
                        className="relative mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-[#e9fff7] to-lime-50 p-8 md:flex-row md:items-center lg:p-10"
                    >
                        <div className="absolute -top-10 -right-10 size-48 rounded-full bg-emerald-200/40 blur-3xl" />
                        <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-lime-200/40 blur-3xl" />
                        <div className="relative max-w-2xl">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                                Siap menjadi sapaan digital sekolahmu.
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                                Mulai dari satu kelas hari ini — SAPA tumbuh
                                bersama sekolah, dari absensi, ke penilaian,
                                LMS, sampai komunikasi orang tua.
                            </p>
                        </div>
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
                        >
                            {auth.user ? 'Buka dashboard' : 'Mulai sekarang'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </motion.div>
                </section>

                <footer className="border-t border-slate-200 bg-white py-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row lg:px-8">
                        <div className="flex items-center gap-2">
                            <span className="grid size-7 place-items-center rounded-md bg-emerald-600 text-white">
                                <AppLogoIcon className="size-4 fill-current" />
                            </span>
                            <span className="font-semibold text-slate-700">
                                SAPA
                            </span>
                            <span>— Sistem Absensi & Penilaian</span>
                        </div>
                        <p>
                            Copyright © {new Date().getFullYear()} SAPA. All
                            rights reserved.
                        </p>
                    </div>
                </footer>
            </main>
        </>
    );
}

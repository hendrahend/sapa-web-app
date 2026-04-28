import { Head, Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Award,
    BellRing,
    BookOpenCheck,
    BrainCircuit,
    CheckCircle2,
    ClipboardCheck,
    GraduationCap,
    MapPin,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    UserRoundCheck,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';

type Feature = {
    title: string;
    description: string;
    icon: typeof ClipboardCheck;
};

const features: Feature[] = [
    {
        title: 'Absensi',
        description:
            'Siswa check-in dengan kamera dan lokasi, guru bisa memantau status hadir, terlambat, dan perlu verifikasi.',
        icon: ClipboardCheck,
    },
    {
        title: 'Penilaian terpadu',
        description:
            'Nilai tugas, kuis, praktik, UTS, dan UAS disiapkan agar guru mudah membuat rekap akademik.',
        icon: GraduationCap,
    },
    {
        title: 'LMS dengan bantuan AI',
        description:
            'Materi, tugas, rangkuman, dan feedback pembelajaran disiapkan untuk berkembang dengan asisten AI.',
        icon: BrainCircuit,
    },
    {
        title: 'Notifikasi orang tua',
        description:
            'Orang tua mendapat kabar saat anak hadir, terlambat, atau membutuhkan perhatian sekolah.',
        icon: BellRing,
    },
];

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

const metrics = [
    { label: 'Modul inti', value: '5' },
    { label: 'Role akses', value: '4' },
    { label: 'Mode absensi', value: 'GPS' },
];

const painPoints = [
    'Absensi manual sulit dipantau real-time',
    'Rekap nilai tersebar di banyak file',
    'Orang tua sering terlambat mendapat kabar',
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
                        <span className="size-2 rounded-full bg-sky-500" />
                        <span className="size-2 rounded-full bg-lime-400" />
                    </div>
                    <div className="h-2 w-28 rounded-full bg-slate-100" />
                </div>

                <div className="grid gap-4 pt-4 md:grid-cols-[180px_1fr]">
                    <div className="grid gap-3">
                        {['Dashboard', 'Absensi', 'Nilai', 'LMS'].map(
                            (item, index) => (
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
                            ),
                        )}
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            {[
                                ['Hadir hari ini', '218', 'emerald'],
                                ['Terlambat', '12', 'sky'],
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
                                                : tone === 'sky'
                                                  ? 'text-sky-600'
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
                                    <span className="rounded-md bg-sky-50 px-2 py-1 text-xs text-sky-700">
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

                            <div className="rounded-lg bg-sky-600 p-4 text-white">
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    <p className="text-sm font-semibold">
                                        Radius aman
                                    </p>
                                </div>
                                <div className="mt-6 grid place-items-center">
                                    <div className="grid size-24 place-items-center rounded-full border border-white/35">
                                        <div className="grid size-16 place-items-center rounded-full border border-white/45">
                                            <div className="size-7 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-5 text-xs text-sky-50">
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
            <Head title="SAPA - Sistem Absensi & Penilaian">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <main className="min-h-screen bg-[#f7fffb] text-slate-950">
                <section className="relative isolate min-h-[720px] overflow-hidden bg-[#dff9ee]">
                    <div className="absolute inset-0 bg-[linear-gradient(#a7f3d033_1px,transparent_1px),linear-gradient(90deg,#93c5fd33_1px,transparent_1px)] bg-[size:56px_56px]" />
                    <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0 }}
                        animate={
                            shouldReduceMotion ? undefined : { opacity: 1 }
                        }
                        transition={{ duration: 0.8 }}
                        className="absolute right-0 bottom-0 h-[78%] w-[72%] bg-[#bfe8ff]"
                    />
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

                    <div className="relative mx-auto flex min-h-[720px] w-full max-w-7xl flex-col px-6 py-5 lg:px-8">
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
                                        Absensi & Penilaian
                                    </span>
                                </span>
                            </Link>

                            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
                                <a href="#tentang">Tentang</a>
                                <a href="#fitur">Fitur</a>
                                <a href="#alur">Alur</a>
                            </nav>

                            <div className="flex items-center gap-2">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10"
                                    >
                                        Dashboard
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
                                    Platform sekolah digital untuk kompetisi
                                    inovasi
                                </motion.div>

                                <h1 className="mt-7 max-w-2xl text-5xl leading-[1.05] font-bold tracking-normal text-slate-950 md:text-7xl">
                                    SAPA
                                </h1>
                                <p className="mt-5 max-w-2xl text-xl leading-8 font-semibold text-slate-800 md:text-2xl">
                                    Sistem Absensi & Penilaian
                                </p>
                                <p className="mt-5 max-w-xl text-base leading-7 text-slate-700">
                                    Dirancang untuk membantu sekolah membaca
                                    kehadiran siswa secara real-time, membuat
                                    rekap nilai lebih rapi, dan menjaga orang
                                    tua tetap mendapat kabar penting.
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
                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-700/20 hover:bg-emerald-700"
                                        >
                                            <ClipboardCheck className="size-4" />
                                            Coba dashboard
                                        </Link>
                                    </motion.div>
                                    <motion.a
                                        href="#fitur"
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
                                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
                                    >
                                        Lihat fitur
                                    </motion.a>
                                </div>

                                <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                                    {metrics.map((metric, index) => (
                                        <motion.div
                                            key={metric.label}
                                            initial={
                                                shouldReduceMotion
                                                    ? false
                                                    : { opacity: 0, y: 18 }
                                            }
                                            animate={
                                                shouldReduceMotion
                                                    ? undefined
                                                    : { opacity: 1, y: 0 }
                                            }
                                            transition={{
                                                duration: 0.45,
                                                delay: 0.35 + index * 0.08,
                                            }}
                                            className="rounded-lg border border-white/70 bg-white/70 p-4"
                                        >
                                            <p className="text-2xl font-semibold text-slate-950">
                                                {metric.value}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-slate-600">
                                                {metric.label}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section id="tentang" className="bg-white py-16">
                    <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
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
                            <p className="text-sm font-semibold text-sky-700 uppercase">
                                Masalah yang diselesaikan
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                                SAPA menyatukan data disiplin, akademik, dan
                                komunikasi sekolah.
                            </h2>
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
                                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-[#f7fffb] p-4"
                                >
                                    <span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                                        {index + 1}
                                    </span>
                                    <p className="font-medium text-slate-800">
                                        {item}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="fitur" className="bg-white py-20">
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
                            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                                Bukan sekadar absensi, tapi ekosistem sekolah
                                yang saling terhubung.
                            </h2>
                        </motion.div>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {features.map((feature, index) => (
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
                                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                                        <feature.icon className="size-5" />
                                    </div>
                                    <h3 className="mt-5 text-lg font-semibold text-slate-950">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {feature.description}
                                    </p>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="alur" className="bg-[#eef9ff] py-20">
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
                            <p className="text-sm font-semibold text-sky-700 uppercase">
                                Alur pengguna
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                                Setiap role punya ruang kerja yang jelas.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                SAPA dibuat agar admin, guru, siswa, dan orang
                                tua tidak bercampur dalam satu tampilan yang
                                membingungkan. Hak akses mengikuti kebutuhan
                                masing-masing.
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
                                    className="rounded-lg border border-sky-100 bg-white p-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
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

                <section id="lomba" className="bg-slate-950 py-20 text-white">
                    <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_420px] lg:px-8">
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
                                Nilai lomba
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-normal md:text-4xl">
                                Cerita produknya kuat: disiplin, akademik, dan
                                komunikasi keluarga dalam satu data.
                            </h2>
                            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                                SAPA bisa dipresentasikan sebagai solusi yang
                                dekat dengan masalah sekolah: absensi manual,
                                rekap nilai tercecer, orang tua terlambat tahu,
                                dan motivasi belajar yang belum terukur.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {[
                                    'Siap demo absensi',
                                    'Data siswa-orang tua',
                                    'Pondasi LMS + AI',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-medium"
                                    >
                                        <CheckCircle2 className="size-4 text-emerald-300" />
                                        {item}
                                    </div>
                                ))}
                            </div>
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
                            whileHover={
                                shouldReduceMotion
                                    ? undefined
                                    : { y: -6, rotate: -1 }
                            }
                            className="rounded-lg border border-white/10 bg-white/5 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-300">
                                        XP siswa
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        1.280 poin
                                    </p>
                                </div>
                                <Award className="size-10 text-emerald-300" />
                            </div>

                            <div className="mt-6 grid gap-3">
                                {[
                                    ['Hadir tepat waktu', '+20 XP'],
                                    ['Tugas LMS selesai', '+35 XP'],
                                    ['Nilai di atas KKM', '+50 XP'],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between rounded-md bg-white/8 px-3 py-3 text-sm"
                                    >
                                        <span className="text-slate-200">
                                            {label}
                                        </span>
                                        <span className="font-semibold text-emerald-300">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="bg-white px-6 py-16">
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
                        className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-lg border border-emerald-100 bg-[#e9fff7] p-6 md:flex-row md:items-center lg:p-8"
                    >
                        <div>
                            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
                                Mulai dari data siswa, lanjut ke penilaian dan
                                LMS.
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Pondasi SAPA sudah mengarah ke sistem lengkap
                                untuk absensi, akademik, dan komunikasi orang
                                tua.
                            </p>
                        </div>
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="inline-flex shrink-0 items-center justify-center rounded-md bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-700/20 hover:bg-sky-700"
                        >
                            Buka aplikasi
                        </Link>
                    </motion.div>
                </section>
            </main>
        </>
    );
}

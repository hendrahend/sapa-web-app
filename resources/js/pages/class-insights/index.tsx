import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    CalendarRange,
    Loader2,
    Sparkles,
    Users,
    Wand2,
} from 'lucide-react';
import { EmptyState } from '@/components/sapa/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SchoolClass = {
    id: number;
    name: string;
    grade_level: string | null;
};

type AtRiskAi = { name: string; reason?: string };
type AtRiskMetric = {
    student_id: number;
    name: string;
    avg_score: number;
    total_assessments: number;
};
type PendingAssignment = {
    assignment_id: number;
    title: string;
    course: string | null;
    missing_count: number;
};

type Insight = {
    id: number;
    class: { id: number; name: string; grade_level: string | null } | null;
    period_start: string;
    period_end: string;
    metrics: {
        student_count: number;
        attendance: {
            rate: number | null;
            counts: Record<string, number>;
            total_records: number;
        };
        at_risk_students: AtRiskMetric[];
        pending_assignments: PendingAssignment[];
    };
    summary: string | null;
    highlights: string[];
    at_risk_students: AtRiskAi[];
    recommendations: string[];
    generated_at: string | null;
    generator: { id: number; name: string } | null;
};

type Props = {
    classes: SchoolClass[];
    selectedClassId: number | null;
    insights: Insight[];
    aiEnabled: boolean;
};

export default function ClassInsightsIndex({
    classes,
    selectedClassId,
    insights,
    aiEnabled,
}: Props) {
    const form = useForm({ school_class_id: selectedClassId ?? 0 });

    function selectClass(id: number) {
        router.get(
            '/class-insights',
            { class: id },
            { preserveState: true, preserveScroll: true },
        );
    }

    function generate() {
        if (!selectedClassId) {
            return;
        }

        form.setData('school_class_id', selectedClassId);
        form.post('/class-insights', { preserveScroll: true });
    }

    const latest = insights[0];

    return (
        <>
            <Head title="Insight Kelas Mingguan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-3 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="size-5 text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Insight Kelas
                            </p>
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Ringkasan AI mingguan per kelas
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Setiap Senin pagi, AI ngumpulin metrik 7 hari
                            terakhir (kehadiran, siswa risiko remedial, tugas
                            pending) dan kasih ringkasan + rekomendasi aksi.
                            Bisa di-trigger manual juga.
                        </p>
                    </div>
                    <Button
                        onClick={generate}
                        disabled={
                            !aiEnabled || !selectedClassId || form.processing
                        }
                        className="gap-2"
                    >
                        {form.processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Wand2 className="size-4" />
                        )}
                        Generate sekarang
                    </Button>
                </section>

                {classes.length === 0 ? (
                    <div className="sapa-card p-6">
                        <EmptyState
                            icon={BarChart3}
                            title="Belum ada kelas aktif"
                            description="Tambah kelas dulu di Admin → Kelas."
                        />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {classes.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => selectClass(c.id)}
                                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                                        selectedClassId === c.id
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-sidebar-border/70 text-muted-foreground hover:bg-muted dark:border-sidebar-border'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>

                        {latest ? (
                            <InsightCard insight={latest} primary />
                        ) : (
                            <div className="sapa-card p-6">
                                <EmptyState
                                    icon={Sparkles}
                                    title="Belum ada insight untuk kelas ini"
                                    description={
                                        aiEnabled
                                            ? 'Klik "Generate sekarang" untuk membuat ringkasan minggu ini.'
                                            : 'GROQ_API_KEY belum diatur. Atur di .env, atau insight akan diisi dengan ringkasan otomatis.'
                                    }
                                />
                            </div>
                        )}

                        {insights.length > 1 && (
                            <section className="sapa-card overflow-hidden">
                                <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                    <h2 className="text-base font-semibold">
                                        Riwayat insight
                                    </h2>
                                </div>
                                <ul className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {insights.slice(1).map((i) => (
                                        <li key={i.id} className="p-4">
                                            <InsightCard insight={i} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

function InsightCard({
    insight,
    primary,
}: {
    insight: Insight;
    primary?: boolean;
}) {
    const m = insight.metrics;
    const rate = m.attendance.rate;

    return (
        <article className={primary ? 'sapa-card space-y-4 p-5' : 'space-y-3'}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">
                            {insight.class?.name}
                        </h2>
                        {insight.class?.grade_level && (
                            <Badge variant="outline">
                                {insight.class.grade_level}
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarRange className="size-3.5" />
                        {insight.period_start} → {insight.period_end}
                    </p>
                </div>
                {insight.generator && (
                    <p className="text-xs text-muted-foreground">
                        Di-trigger oleh {insight.generator.name}
                    </p>
                )}
            </div>

            {insight.summary && (
                <p className="text-sm leading-6">{insight.summary}</p>
            )}

            <div className="grid gap-3 md:grid-cols-3">
                <Stat
                    icon={Users}
                    label="Jumlah siswa"
                    value={String(m.student_count)}
                />
                <Stat
                    icon={CalendarRange}
                    label="Kehadiran (%)"
                    value={rate !== null ? `${rate}%` : '—'}
                />
                <Stat
                    icon={AlertTriangle}
                    label="Siswa risiko remedial"
                    value={String(m.at_risk_students.length)}
                    tone="amber"
                />
            </div>

            {!!insight.highlights.length && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Highlights minggu ini
                    </p>
                    <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                        {insight.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                        ))}
                    </ul>
                </div>
            )}

            {!!insight.at_risk_students.length && (
                <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase dark:text-amber-300">
                        Siswa perlu perhatian khusus
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                        {insight.at_risk_students.map((s, i) => (
                            <li key={i}>
                                <span className="font-medium">{s.name}</span>
                                {s.reason && (
                                    <>
                                        {' — '}
                                        <span className="text-muted-foreground">
                                            {s.reason}
                                        </span>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!!m.pending_assignments.length && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Tugas dengan submission belum lengkap
                    </p>
                    <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                        {m.pending_assignments.map((p) => (
                            <li key={p.assignment_id}>
                                <span className="font-medium">{p.title}</span>
                                {p.course && (
                                    <span className="text-muted-foreground">
                                        {' '}
                                        ({p.course})
                                    </span>
                                )}
                                {' — '}
                                <span className="text-muted-foreground">
                                    {p.missing_count} siswa belum mengumpul
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!!insight.recommendations.length && (
                <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase dark:text-emerald-300">
                        Rekomendasi aksi
                    </p>
                    <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                        {insight.recommendations.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: typeof Users;
    label: string;
    value: string;
    tone?: 'amber';
}) {
    const toneClass =
        tone === 'amber'
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-foreground';

    return (
        <div className="sapa-panel flex items-center gap-3 p-3">
            <Icon className={`size-6 ${toneClass}`} />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
            </div>
        </div>
    );
}

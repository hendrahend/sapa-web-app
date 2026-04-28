import { Head, router } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    Loader2,
    Sparkles,
    Wand2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/sapa/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Submission = {
    id: number;
    content: string;
    submitted_at: string | null;
    score: number | null;
    feedback: string | null;
    graded_at: string | null;
    graded_by: { id: number; name: string } | null;
    ai_grade_data: AiGrade | null;
    ai_graded_at: string | null;
    student: { id: number; name: string; class_name: string | null } | null;
    assignment: {
        id: number;
        title: string;
        instructions: string | null;
        max_score: number;
        course_name: string | null;
    } | null;
};

type AiGrade = {
    suggested_score?: number;
    max_score?: number;
    summary?: string;
    strengths?: string[];
    improvements?: string[];
    paragraph_feedback?: { index: number; comment: string }[];
    overall_feedback?: string;
    generated_at?: string;
};

type Props = {
    tab: 'pending' | 'graded';
    submissions: Submission[];
    aiEnabled: boolean;
    stats: { pending: number; graded: number };
};

export default function LmsGradingIndex({
    tab,
    submissions,
    aiEnabled,
    stats,
}: Props) {
    const [active, setActive] = useState<Submission | null>(null);

    return (
        <>
            <Head title="Penilaian LMS" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-3 border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <BookOpenCheck className="size-5 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">
                            Penilaian Tugas LMS
                        </p>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Penilaian dengan bantuan AI
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        Tugas siswa di-screen otomatis: AI memberi draft skor +
                        feedback, kamu tinggal review, edit kalau perlu, lalu
                        simpan.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <StatCard
                        icon={Clock3}
                        label="Menunggu dinilai"
                        value={stats.pending}
                        tone="amber"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Sudah dinilai"
                        value={stats.graded}
                        tone="emerald"
                    />
                </section>

                <div className="flex gap-2">
                    <TabBtn
                        active={tab === 'pending'}
                        onClick={() => router.get('/lms/grading?tab=pending')}
                    >
                        Belum dinilai
                    </TabBtn>
                    <TabBtn
                        active={tab === 'graded'}
                        onClick={() => router.get('/lms/grading?tab=graded')}
                    >
                        Sudah dinilai
                    </TabBtn>
                </div>

                {submissions.length === 0 ? (
                    <div className="sapa-card p-6">
                        <EmptyState
                            icon={BookOpenCheck}
                            title={
                                tab === 'pending'
                                    ? 'Tidak ada tugas yang menunggu'
                                    : 'Belum ada tugas yang dinilai'
                            }
                            description={
                                tab === 'pending'
                                    ? 'Tugas siswa yang baru masuk akan tampil di sini.'
                                    : 'Setelah kamu menilai tugas, tugas tersebut pindah ke tab ini.'
                            }
                        />
                    </div>
                ) : (
                    <ul className="grid gap-3">
                        {submissions.map((s) => (
                            <li key={s.id}>
                                <SubmissionCard
                                    submission={s}
                                    onOpen={() => setActive(s)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {active && (
                <ReviewDialog
                    submission={active}
                    aiEnabled={aiEnabled}
                    onClose={() => setActive(null)}
                />
            )}
        </>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: typeof Clock3;
    label: string;
    value: number;
    tone: 'amber' | 'emerald';
}) {
    const toneClass = {
        amber: 'text-amber-700 dark:text-amber-300',
        emerald: 'text-emerald-700 dark:text-emerald-300',
    }[tone];

    return (
        <div className="sapa-card flex items-center gap-4 p-4">
            <Icon className={`size-8 ${toneClass}`} />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
            </div>
        </div>
    );
}

function TabBtn({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-sidebar-border/70 text-muted-foreground hover:bg-muted dark:border-sidebar-border'
            }`}
        >
            {children}
        </button>
    );
}

function SubmissionCard({
    submission,
    onOpen,
}: {
    submission: Submission;
    onOpen: () => void;
}) {
    const isGraded = !!submission.graded_at;
    const hasAi = !!submission.ai_grade_data;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="sapa-card w-full p-4 text-left transition hover:border-primary/40 hover:bg-muted/30"
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                            {submission.student?.name ?? 'Siswa'}
                        </p>
                        {submission.student?.class_name && (
                            <Badge variant="outline">
                                {submission.student.class_name}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {submission.assignment?.course_name} —{' '}
                        {submission.assignment?.title}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isGraded ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {submission.score} /{' '}
                            {submission.assignment?.max_score ?? 100}
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Menunggu
                        </Badge>
                    )}
                    {hasAi && (
                        <Badge
                            variant="outline"
                            className="gap-1 border-violet-200 text-violet-700 dark:border-violet-900/40 dark:text-violet-300"
                        >
                            <Sparkles className="size-3" /> AI siap
                        </Badge>
                    )}
                </div>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {submission.content}
            </p>
        </button>
    );
}

function ReviewDialog({
    submission,
    aiEnabled,
    onClose,
}: {
    submission: Submission;
    aiEnabled: boolean;
    onClose: () => void;
}) {
    const max = submission.assignment?.max_score ?? 100;
    const [score, setScore] = useState<string>(
        submission.score !== null ? String(submission.score) : '',
    );
    const [feedback, setFeedback] = useState<string>(submission.feedback ?? '');
    const [ai, setAi] = useState<AiGrade | null>(submission.ai_grade_data);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function generateAi() {
        setAiLoading(true);
        setAiError(null);

        try {
            const res = await fetch(`/lms/grading/${submission.id}/ai`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
            });
            const data = await res.json();

            if (!res.ok) {
                setAiError(data.message ?? 'Gagal menjalankan AI grading.');

                return;
            }

            setAi(data.ai_grade_data);
            toast.success('Draft AI sudah siap. Review dan edit jika perlu.');
        } finally {
            setAiLoading(false);
        }
    }

    function applyAi() {
        if (!ai) {
            return;
        }

        if (typeof ai.suggested_score === 'number') {
            setScore(String(ai.suggested_score));
        }

        if (ai.overall_feedback) {
            setFeedback(ai.overall_feedback);
        }

        toast.success('Skor & feedback AI disalin ke form.');
    }

    function save() {
        setSaving(true);
        router.patch(
            `/lms/grading/${submission.id}`,
            { score: Number(score), feedback },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="sapa-card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
                <div className="flex items-start justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {submission.assignment?.title}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {submission.student?.name}{' '}
                            {submission.student?.class_name &&
                                `(${submission.student.class_name})`}{' '}
                            • Skor maks {max}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                    >
                        Tutup
                    </button>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
                    <div className="space-y-3">
                        {submission.assignment?.instructions && (
                            <div className="sapa-panel p-3 text-sm">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Instruksi
                                </p>
                                <p className="mt-1 whitespace-pre-line">
                                    {submission.assignment.instructions}
                                </p>
                            </div>
                        )}
                        <div className="sapa-panel p-3 text-sm">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                Jawaban siswa
                            </p>
                            <p className="mt-1 whitespace-pre-line">
                                {submission.content}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="sapa-panel space-y-3 p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Draft AI
                                </p>
                                <Button
                                    size="sm"
                                    onClick={generateAi}
                                    disabled={!aiEnabled || aiLoading}
                                    className="gap-2"
                                >
                                    {aiLoading ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Wand2 className="size-3.5" />
                                    )}
                                    {ai ? 'Generate ulang' : 'Generate'}
                                </Button>
                            </div>
                            {aiError && (
                                <p className="text-sm text-rose-600">
                                    {aiError}
                                </p>
                            )}
                            {!ai && !aiLoading && !aiError && (
                                <p className="text-sm text-muted-foreground">
                                    Klik "Generate" untuk meminta AI memberi
                                    draft skor + feedback. Hasilnya bisa kamu
                                    edit sebelum disimpan.
                                </p>
                            )}
                            {ai && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <p>
                                            <span className="font-semibold">
                                                Skor saran:
                                            </span>{' '}
                                            {ai.suggested_score} /{' '}
                                            {ai.max_score ?? max}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={applyAi}
                                        >
                                            Pakai saran AI
                                        </Button>
                                    </div>
                                    {ai.summary && (
                                        <p>
                                            <span className="font-semibold">
                                                Ringkasan:
                                            </span>{' '}
                                            {ai.summary}
                                        </p>
                                    )}
                                    {!!ai.strengths?.length && (
                                        <div>
                                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                                                Kekuatan
                                            </p>
                                            <ul className="ml-4 list-disc">
                                                {ai.strengths.map((s, i) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {!!ai.improvements?.length && (
                                        <div>
                                            <p className="font-semibold text-amber-700 dark:text-amber-300">
                                                Saran perbaikan
                                            </p>
                                            <ul className="ml-4 list-disc">
                                                {ai.improvements.map((s, i) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {!!ai.paragraph_feedback?.length && (
                                        <div>
                                            <p className="font-semibold">
                                                Feedback per paragraf
                                            </p>
                                            <ul className="ml-4 list-disc">
                                                {ai.paragraph_feedback.map(
                                                    (p, i) => (
                                                        <li key={i}>
                                                            <span className="font-medium">
                                                                Paragraf{' '}
                                                                {p.index}:
                                                            </span>{' '}
                                                            {p.comment}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="score">Skor (0–{max})</Label>
                            <Input
                                id="score"
                                type="number"
                                min={0}
                                max={max}
                                step="0.01"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="feedback">Feedback ke siswa</Label>
                            <textarea
                                id="feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={6}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button onClick={save} disabled={saving || score === ''}>
                        Simpan nilai
                    </Button>
                </div>
            </div>
        </div>
    );
}

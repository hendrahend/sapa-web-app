import { Head } from '@inertiajs/react';
import {
    BookOpenCheck,
    CircleAlert,
    Copy,
    FileQuestion,
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

type Props = {
    aiEnabled: boolean;
};

type RubrikLevel = {
    sangat_baik?: string;
    baik?: string;
    cukup?: string;
    perlu_perbaikan?: string;
};

type RubrikCriterion = {
    name: string;
    weight: number;
    levels: RubrikLevel;
};

type Rubrik = {
    title?: string;
    summary?: string;
    criteria?: RubrikCriterion[];
    max_score?: number;
};

type SoalQuestion = {
    question: string;
    options: { A?: string; B?: string; C?: string; D?: string };
    answer: string;
    explanation?: string;
};

type Soal = {
    title?: string;
    subject?: string;
    difficulty?: string;
    questions?: SoalQuestion[];
};

type Tab = 'rubrik' | 'soal';

export default function LmsAiTools({ aiEnabled }: Props) {
    const [tab, setTab] = useState<Tab>('rubrik');

    return (
        <>
            <Head title="AI Tools — LMS" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-3 border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">
                            AI Tools untuk Guru
                        </p>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-normal">
                        Otomasi rubrik & soal pakai AI
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        Hemat waktu menyusun rubrik penilaian dan soal pilihan
                        ganda. Bahasa Indonesia, sesuai kurikulum sekolah, siap
                        di-copy ke LMS atau penilaian.
                    </p>
                </section>

                {!aiEnabled && (
                    <div className="sapa-card flex items-start gap-3 p-4">
                        <CircleAlert className="size-5 text-amber-600" />
                        <div>
                            <p className="font-medium">AI belum aktif</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Atur <code>GROQ_API_KEY</code> di file{' '}
                                <code>.env</code> untuk mengaktifkan fitur ini.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <TabButton
                        active={tab === 'rubrik'}
                        onClick={() => setTab('rubrik')}
                        icon={BookOpenCheck}
                        label="Generate Rubrik"
                    />
                    <TabButton
                        active={tab === 'soal'}
                        onClick={() => setTab('soal')}
                        icon={FileQuestion}
                        label="Generate Soal"
                    />
                </div>

                {tab === 'rubrik' && <RubrikPanel disabled={!aiEnabled} />}
                {tab === 'soal' && <SoalPanel disabled={!aiEnabled} />}
            </div>
        </>
    );
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: typeof Sparkles;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-sidebar-border/70 text-muted-foreground hover:bg-muted dark:border-sidebar-border'
            }`}
        >
            <Icon className="size-4" />
            {label}
        </button>
    );
}

export function RubrikPanel({ disabled }: { disabled: boolean }) {
    const [form, setForm] = useState({
        description: '',
        subject: '',
        class_level: '',
        criteria_count: 4,
    });
    const [loading, setLoading] = useState(false);
    const [rubrik, setRubrik] = useState<Rubrik | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function generate() {
        setLoading(true);
        setError(null);
        setRubrik(null);

        try {
            const res = await fetch('/lms/ai/tools/rubrik', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message ?? 'Gagal menghasilkan rubrik.');

                return;
            }

            setRubrik(data.rubrik);
        } finally {
            setLoading(false);
        }
    }

    function copyMarkdown() {
        if (!rubrik?.criteria) {
            return;
        }

        const lines: string[] = [];
        lines.push(`# ${rubrik.title ?? 'Rubrik penilaian'}`);

        if (rubrik.summary) {
            lines.push(`\n${rubrik.summary}\n`);
        }

        for (const c of rubrik.criteria) {
            lines.push(`## ${c.name} (bobot: ${c.weight}%)`);
            const levels = c.levels ?? {};

            if (levels.sangat_baik) {
                lines.push(`- **Sangat Baik (90-100):** ${levels.sangat_baik}`);
            }

            if (levels.baik) {
                lines.push(`- **Baik (75-89):** ${levels.baik}`);
            }

            if (levels.cukup) {
                lines.push(`- **Cukup (60-74):** ${levels.cukup}`);
            }

            if (levels.perlu_perbaikan) {
                lines.push(
                    `- **Perlu Perbaikan (<60):** ${levels.perlu_perbaikan}`,
                );
            }

            lines.push('');
        }

        navigator.clipboard.writeText(lines.join('\n'));
        toast.success('Rubrik disalin sebagai Markdown.');
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            <section className="sapa-card flex flex-col gap-4 p-4">
                <h2 className="text-base font-semibold">Detail tugas</h2>

                <div className="grid gap-2">
                    <Label htmlFor="r-subject">Mata pelajaran</Label>
                    <Input
                        id="r-subject"
                        value={form.subject}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, subject: e.target.value }))
                        }
                        placeholder="Bahasa Indonesia"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="r-class">Tingkat / kelas</Label>
                    <Input
                        id="r-class"
                        value={form.class_level}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                class_level: e.target.value,
                            }))
                        }
                        placeholder="Kelas 7 SMP"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="r-desc">Deskripsi tugas</Label>
                    <textarea
                        id="r-desc"
                        value={form.description}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                description: e.target.value,
                            }))
                        }
                        rows={5}
                        placeholder="Buat puisi tentang Indonesia minimal 4 bait..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="r-count">Jumlah kriteria</Label>
                    <Input
                        id="r-count"
                        type="number"
                        min={2}
                        max={8}
                        value={form.criteria_count}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                criteria_count: Number(e.target.value) || 4,
                            }))
                        }
                    />
                </div>

                <Button
                    onClick={generate}
                    disabled={
                        disabled || loading || form.description.trim() === ''
                    }
                    className="gap-2"
                >
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Wand2 className="size-4" />
                    )}
                    {loading ? 'Sedang menyusun...' : 'Generate Rubrik'}
                </Button>
            </section>

            <section className="sapa-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="text-base font-semibold">Hasil</h2>
                    {rubrik && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={copyMarkdown}
                            className="gap-2"
                        >
                            <Copy className="size-3.5" /> Copy Markdown
                        </Button>
                    )}
                </div>
                <div className="p-4">
                    {error && (
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                            {error}
                        </div>
                    )}
                    {!rubrik && !error && !loading && (
                        <EmptyState
                            icon={BookOpenCheck}
                            title="Belum ada rubrik"
                            description="Isi detail tugas di kiri lalu klik Generate Rubrik."
                        />
                    )}
                    {rubrik && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {rubrik.title ?? 'Rubrik penilaian'}
                                </h3>
                                {rubrik.summary && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {rubrik.summary}
                                    </p>
                                )}
                            </div>
                            {(rubrik.criteria ?? []).map((c, idx) => (
                                <div
                                    key={idx}
                                    className="sapa-panel space-y-2 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{c.name}</p>
                                        <Badge variant="outline">
                                            Bobot {c.weight}%
                                        </Badge>
                                    </div>
                                    <ul className="space-y-1 text-sm">
                                        {c.levels?.sangat_baik && (
                                            <li>
                                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                                    Sangat Baik (90-100):
                                                </span>{' '}
                                                {c.levels.sangat_baik}
                                            </li>
                                        )}
                                        {c.levels?.baik && (
                                            <li>
                                                <span className="font-semibold text-sky-700 dark:text-sky-300">
                                                    Baik (75-89):
                                                </span>{' '}
                                                {c.levels.baik}
                                            </li>
                                        )}
                                        {c.levels?.cukup && (
                                            <li>
                                                <span className="font-semibold text-amber-700 dark:text-amber-300">
                                                    Cukup (60-74):
                                                </span>{' '}
                                                {c.levels.cukup}
                                            </li>
                                        )}
                                        {c.levels?.perlu_perbaikan && (
                                            <li>
                                                <span className="font-semibold text-rose-700 dark:text-rose-300">
                                                    Perlu Perbaikan (&lt;60):
                                                </span>{' '}
                                                {c.levels.perlu_perbaikan}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export function SoalPanel({ disabled }: { disabled: boolean }) {
    const [form, setForm] = useState({
        topic: '',
        subject: '',
        class_level: '',
        count: 5,
        difficulty: 'sedang',
    });
    const [loading, setLoading] = useState(false);
    const [soal, setSoal] = useState<Soal | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [revealAnswers, setRevealAnswers] = useState(false);

    async function generate() {
        setLoading(true);
        setError(null);
        setSoal(null);

        try {
            const res = await fetch('/lms/ai/tools/soal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message ?? 'Gagal menghasilkan soal.');

                return;
            }

            setSoal(data.soal);
        } finally {
            setLoading(false);
        }
    }

    function copyMarkdown() {
        if (!soal?.questions) {
            return;
        }

        const lines: string[] = [];
        lines.push(`# ${soal.title ?? 'Soal pilihan ganda'}`);

        if (soal.subject) {
            lines.push(`Mapel: ${soal.subject}`);
        }

        if (soal.difficulty) {
            lines.push(`Tingkat kesulitan: ${soal.difficulty}\n`);
        }

        soal.questions.forEach((q, i) => {
            lines.push(`## Soal ${i + 1}`);
            lines.push(q.question);
            (['A', 'B', 'C', 'D'] as const).forEach((k) => {
                const opt = q.options?.[k];

                if (opt) {
                    lines.push(`- ${k}. ${opt}`);
                }
            });
            lines.push(`\n**Jawaban:** ${q.answer}`);

            if (q.explanation) {
                lines.push(`**Pembahasan:** ${q.explanation}`);
            }

            lines.push('');
        });
        navigator.clipboard.writeText(lines.join('\n'));
        toast.success('Soal disalin sebagai Markdown.');
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            <section className="sapa-card flex flex-col gap-4 p-4">
                <h2 className="text-base font-semibold">Detail soal</h2>

                <div className="grid gap-2">
                    <Label htmlFor="s-subject">Mata pelajaran</Label>
                    <Input
                        id="s-subject"
                        value={form.subject}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, subject: e.target.value }))
                        }
                        placeholder="Matematika"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="s-class">Tingkat / kelas</Label>
                    <Input
                        id="s-class"
                        value={form.class_level}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                class_level: e.target.value,
                            }))
                        }
                        placeholder="Kelas 8 SMP"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="s-topic">Topik</Label>
                    <textarea
                        id="s-topic"
                        value={form.topic}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, topic: e.target.value }))
                        }
                        rows={4}
                        placeholder="Persamaan linear satu variabel"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="s-count">Jumlah soal</Label>
                        <Input
                            id="s-count"
                            type="number"
                            min={1}
                            max={20}
                            value={form.count}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    count: Number(e.target.value) || 5,
                                }))
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="s-diff">Tingkat kesulitan</Label>
                        <select
                            id="s-diff"
                            value={form.difficulty}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    difficulty: e.target.value,
                                }))
                            }
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                        >
                            <option value="mudah">Mudah</option>
                            <option value="sedang">Sedang</option>
                            <option value="sulit">Sulit</option>
                        </select>
                    </div>
                </div>

                <Button
                    onClick={generate}
                    disabled={disabled || loading || form.topic.trim() === ''}
                    className="gap-2"
                >
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Wand2 className="size-4" />
                    )}
                    {loading ? 'Sedang menyusun...' : 'Generate Soal'}
                </Button>
            </section>

            <section className="sapa-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 className="text-base font-semibold">Hasil</h2>
                    <div className="flex items-center gap-2">
                        {soal && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRevealAnswers((v) => !v)}
                                >
                                    {revealAnswers
                                        ? 'Sembunyikan jawaban'
                                        : 'Tampilkan jawaban'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={copyMarkdown}
                                    className="gap-2"
                                >
                                    <Copy className="size-3.5" /> Copy Markdown
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className="p-4">
                    {error && (
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                            {error}
                        </div>
                    )}
                    {!soal && !error && !loading && (
                        <EmptyState
                            icon={FileQuestion}
                            title="Belum ada soal"
                            description="Isi detail topik di kiri lalu klik Generate Soal."
                        />
                    )}
                    {soal && (
                        <div className="space-y-4">
                            {(soal.title || soal.subject) && (
                                <div>
                                    {soal.title && (
                                        <h3 className="text-lg font-semibold">
                                            {soal.title}
                                        </h3>
                                    )}
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {soal.subject && (
                                            <Badge variant="outline">
                                                {soal.subject}
                                            </Badge>
                                        )}
                                        {soal.difficulty && (
                                            <Badge variant="outline">
                                                Tingkat: {soal.difficulty}
                                            </Badge>
                                        )}
                                        <Badge variant="outline">
                                            {soal.questions?.length ?? 0} soal
                                        </Badge>
                                    </div>
                                </div>
                            )}
                            {(soal.questions ?? []).map((q, i) => (
                                <div
                                    key={i}
                                    className="sapa-panel space-y-2 p-3"
                                >
                                    <p className="font-medium">
                                        {i + 1}. {q.question}
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        {(['A', 'B', 'C', 'D'] as const).map(
                                            (k) =>
                                                q.options?.[k] ? (
                                                    <li
                                                        key={k}
                                                        className={
                                                            revealAnswers &&
                                                            q.answer === k
                                                                ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                                                                : ''
                                                        }
                                                    >
                                                        {k}. {q.options[k]}
                                                    </li>
                                                ) : null,
                                        )}
                                    </ul>
                                    {revealAnswers && (
                                        <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
                                            <p>
                                                <span className="font-semibold">
                                                    Jawaban:
                                                </span>{' '}
                                                {q.answer}
                                            </p>
                                            {q.explanation && (
                                                <p className="mt-1 text-muted-foreground">
                                                    <span className="font-semibold">
                                                        Pembahasan:
                                                    </span>{' '}
                                                    {q.explanation}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

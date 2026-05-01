import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpenCheck,
    CheckCircle2,
    ClipboardPlus,
    Clock3,
    FileSpreadsheet,
    Loader2,
    Save,
    ShieldAlert,
    Sparkles,
    Wand2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { EmptyState } from '@/components/sapa/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Subject = {
    id: number;
    name: string;
    code: string | null;
};

type SchoolClass = {
    id: number;
    name: string;
    grade_level: string | null;
    academic_year: string | null;
    students_count?: number;
};

type Student = {
    id: number;
    name: string;
    nis: string | null;
    school_class_id: number | null;
};

type Assessment = {
    id: number;
    title: string;
    type: string;
    assessment_date: string | null;
    max_score: number;
    weight: number;
    scores_count: number;
    scores_avg_score: string | null;
    subject: Subject;
    school_class: Pick<SchoolClass, 'id' | 'name'>;
    teacher?: {
        id: number;
        name: string;
    } | null;
};

type Score = {
    id: number;
    score: string;
    feedback: string | null;
    graded_at: string | null;
    student: Student & {
        school_class?: Pick<SchoolClass, 'id' | 'name'> | null;
    };
    assessment: Pick<Assessment, 'id' | 'title' | 'type' | 'max_score'> & {
        subject: Subject;
    };
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

type LmsSubmission = {
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

type Props = {
    gradeTab: 'academic' | 'lms';
    lmsTab: 'pending' | 'graded';
    lmsFilters: {
        school_class_id: string;
    };
    subjects: Subject[];
    schoolClasses: SchoolClass[];
    students: Student[];
    assessments: Assessment[];
    scores: Score[];
    lmsSubmissions: LmsSubmission[];
    aiEnabled: boolean;
    student:
        | (Student & { school_class?: Pick<SchoolClass, 'id' | 'name'> })
        | null;
    stats: {
        assessments: number;
        scores: number;
        needsRemedial: number;
    };
    lmsStats: {
        pending: number;
        graded: number;
    };
};

type AssessmentForm = {
    subject_id: string;
    school_class_id: string;
    title: string;
    type: string;
    assessment_date: string;
    max_score: string;
    weight: string;
    description: string;
};

type ScoreForm = {
    grade_assessment_id: string;
    student_id: string;
    score: string;
    feedback: string;
};

const assessmentTypes = [
    ['tugas', 'Tugas'],
    ['kuis', 'Kuis'],
    ['praktik', 'Praktik'],
    ['uts', 'UTS'],
    ['uas', 'UAS'],
];

function today() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(new Date(value));
}

function typeLabel(type: string) {
    return assessmentTypes.find(([value]) => value === type)?.[1] ?? type;
}

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Komponen nilai',
            value: stats.assessments,
            icon: ClipboardPlus,
        },
        {
            label: 'Nilai masuk',
            value: stats.scores,
            icon: CheckCircle2,
        },
        {
            label: 'Perlu remedial',
            value: stats.needsRemedial,
            icon: ShieldAlert,
        },
    ];
}

export default function GradesIndex({
    gradeTab,
    lmsTab,
    lmsFilters,
    subjects,
    schoolClasses,
    students,
    assessments,
    scores,
    lmsSubmissions,
    aiEnabled,
    stats,
    lmsStats,
}: Props) {
    const { auth } = usePage().props;
    const canManageGrades = [
        'grades.create',
        'grades.update',
        'grades.delete',
    ].some((permission) => auth.permissions.includes(permission));
    const canGradeLms = auth.permissions.includes('lms.create');
    const [activeLmsSubmission, setActiveLmsSubmission] =
        useState<LmsSubmission | null>(null);
    const [selectedLmsClass, setSelectedLmsClass] = useState(
        lmsFilters.school_class_id,
    );
    const [isAssessmentFormOpen, setIsAssessmentFormOpen] = useState(false);
    const [isScoreFormOpen, setIsScoreFormOpen] = useState(false);
    const assessmentForm = useForm<AssessmentForm>({
        subject_id: subjects[0]?.id.toString() ?? '',
        school_class_id: schoolClasses[0]?.id.toString() ?? '',
        title: 'Tugas harian',
        type: 'tugas',
        assessment_date: today(),
        max_score: '100',
        weight: '10',
        description: '',
    });
    const scoreForm = useForm<ScoreForm>({
        grade_assessment_id: assessments[0]?.id.toString() ?? '',
        student_id: '',
        score: '',
        feedback: '',
    });

    const selectedAssessment = assessments.find(
        (assessment) =>
            assessment.id.toString() === scoreForm.data.grade_assessment_id,
    );
    const selectableStudents = selectedAssessment
        ? students.filter(
              (student) =>
                  student.school_class_id ===
                  selectedAssessment.school_class.id,
          )
        : students;

    function submitAssessment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        assessmentForm.post('/grades/assessments', {
            preserveScroll: true,
            onSuccess: () => setIsAssessmentFormOpen(false),
        });
    }

    function submitScore(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        scoreForm.post('/grades/scores', {
            preserveScroll: true,
            onSuccess: () => {
                setIsScoreFormOpen(false);
                scoreForm.setData((values) => ({
                    ...values,
                    score: '',
                    feedback: '',
                }));
            },
        });
    }

    function goGradeTab(tab: 'academic' | 'lms') {
        router.get(
            '/grades',
            {
                grade_tab: tab,
                lms_tab: lmsTab,
                lms_school_class_id:
                    selectedLmsClass === 'all' ? undefined : selectedLmsClass,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    function goLmsTab(tab: 'pending' | 'graded') {
        router.get(
            '/grades',
            {
                grade_tab: 'lms',
                lms_tab: tab,
                lms_school_class_id:
                    selectedLmsClass === 'all' ? undefined : selectedLmsClass,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    function goLmsClassFilter(schoolClassId: string) {
        setSelectedLmsClass(schoolClassId);
        router.get(
            '/grades',
            {
                grade_tab: 'lms',
                lms_tab: lmsTab,
                lms_school_class_id:
                    schoolClassId === 'all' ? undefined : schoolClassId,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <>
            <Head title="Penilaian" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 md:flex-row md:items-end md:justify-between dark:border-sidebar-border">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Rekap nilai dan tugas LMS
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                            Penilaian
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Rekap nilai kelas tetap di sini. Tugas yang masuk
                            dari LMS juga dinilai di sini supaya hasil belajar
                            siswa tidak tercecer.
                        </p>
                    </div>
                    {canManageGrades && gradeTab === 'academic' && (
                        <Button asChild variant="outline">
                            <a href="/grades/export" rel="noopener">
                                <FileSpreadsheet />
                                Export Nilai
                            </a>
                        </Button>
                    )}
                </section>

                <div className="flex flex-wrap gap-2">
                    <TabButton
                        active={gradeTab === 'academic'}
                        onClick={() => goGradeTab('academic')}
                    >
                        Rekap Nilai
                    </TabButton>
                    {canGradeLms && (
                        <TabButton
                            active={gradeTab === 'lms'}
                            onClick={() => goGradeTab('lms')}
                        >
                            Tugas dari LMS
                        </TabButton>
                    )}
                </div>

                {gradeTab === 'academic' ? (
                    <>
                        <section className="grid gap-4 md:grid-cols-3">
                            {statItems(stats).map((item) => (
                                <div key={item.label} className="sapa-card p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <item.icon className="size-4 text-muted-foreground" />
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </section>

                        <section className="sapa-card p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Rekap nilai
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Kelola komponen nilai, input skor siswa,
                                        lalu export rekap saat dibutuhkan.
                                    </p>
                                </div>
                                {canManageGrades && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                setIsAssessmentFormOpen(true)
                                            }
                                        >
                                            <ClipboardPlus />
                                            Buat komponen
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsScoreFormOpen(true)
                                            }
                                        >
                                            <Save />
                                            Input nilai
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-2">
                            <section className="sapa-card overflow-hidden">
                                <div className="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                    <h2 className="text-lg font-semibold">
                                        Komponen terbaru
                                    </h2>
                                    <span className="text-xs text-muted-foreground">
                                        5 terbaru · lihat semua via Export Excel
                                    </span>
                                </div>
                                <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {assessments.length === 0 && (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            Belum ada komponen nilai.
                                        </div>
                                    )}

                                    {assessments.map((assessment) => (
                                        <div
                                            key={assessment.id}
                                            className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">
                                                        {assessment.title}
                                                    </p>
                                                    <Badge variant="outline">
                                                        {typeLabel(
                                                            assessment.type,
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                    <span>
                                                        {
                                                            assessment.subject
                                                                .name
                                                        }
                                                    </span>
                                                    <span>
                                                        {
                                                            assessment
                                                                .school_class
                                                                .name
                                                        }
                                                    </span>
                                                    <span>
                                                        {formatDate(
                                                            assessment.assessment_date,
                                                        )}
                                                    </span>
                                                    <span>
                                                        Bobot{' '}
                                                        {assessment.weight}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                <BarChart3 className="size-4" />
                                                {assessment.scores_count} nilai
                                                <span>
                                                    Rata-rata{' '}
                                                    {assessment.scores_avg_score
                                                        ? Number(
                                                              assessment.scores_avg_score,
                                                          ).toFixed(1)
                                                        : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="sapa-card overflow-hidden">
                                <div className="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                    <h2 className="text-lg font-semibold">
                                        Nilai terbaru
                                    </h2>
                                    <span className="text-xs text-muted-foreground">
                                        10 terbaru · lihat semua via Export
                                        Excel
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-sidebar-border/70 bg-muted/40 text-muted-foreground dark:border-sidebar-border">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">
                                                    Siswa
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Komponen
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Skor
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Feedback
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                            {scores.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-4 py-6 text-center text-muted-foreground"
                                                    >
                                                        Belum ada nilai masuk.
                                                    </td>
                                                </tr>
                                            )}

                                            {scores.map((score) => (
                                                <tr key={score.id}>
                                                    <td className="px-4 py-3 align-top">
                                                        <p className="font-medium">
                                                            {score.student.name}
                                                        </p>
                                                        <p className="mt-1 text-muted-foreground">
                                                            {score.student
                                                                .school_class
                                                                ?.name ?? '-'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        <p className="font-medium">
                                                            {
                                                                score.assessment
                                                                    .title
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-muted-foreground">
                                                            {
                                                                score.assessment
                                                                    .subject
                                                                    .name
                                                            }{' '}
                                                            -{' '}
                                                            {typeLabel(
                                                                score.assessment
                                                                    .type,
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        <Badge
                                                            variant={
                                                                Number(
                                                                    score.score,
                                                                ) >= 75
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {Number(
                                                                score.score,
                                                            ).toFixed(1)}
                                                            /
                                                            {
                                                                score.assessment
                                                                    .max_score
                                                            }
                                                        </Badge>
                                                    </td>
                                                    <td className="max-w-sm px-4 py-3 align-top text-muted-foreground">
                                                        {score.feedback ?? '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </section>
                    </>
                ) : (
                    <LmsGradingPanel
                        tab={lmsTab}
                        submissions={lmsSubmissions}
                        stats={lmsStats}
                        schoolClasses={schoolClasses}
                        selectedClass={selectedLmsClass}
                        onTabChange={goLmsTab}
                        onClassChange={goLmsClassFilter}
                        onOpenSubmission={setActiveLmsSubmission}
                    />
                )}
            </div>

            {canManageGrades && (
                <>
                    <Dialog
                        open={isAssessmentFormOpen}
                        onOpenChange={(open) => {
                            setIsAssessmentFormOpen(open);

                            if (!open) {
                                assessmentForm.clearErrors();
                            }
                        }}
                    >
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Buat komponen nilai</DialogTitle>
                                <DialogDescription>
                                    Tambahkan tugas, kuis, praktik, UTS, atau
                                    UAS sebagai komponen penilaian akademik.
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={submitAssessment}
                                className="grid gap-4"
                            >
                                <div className="grid gap-2">
                                    <Label>Judul</Label>
                                    <Input
                                        value={assessmentForm.data.title}
                                        onChange={(event) =>
                                            assessmentForm.setData(
                                                'title',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={assessmentForm.errors.title}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Mapel</Label>
                                        <Select
                                            value={
                                                assessmentForm.data.subject_id
                                            }
                                            onValueChange={(value) =>
                                                assessmentForm.setData(
                                                    'subject_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih mapel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map((subject) => (
                                                    <SelectItem
                                                        key={subject.id}
                                                        value={subject.id.toString()}
                                                    >
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                assessmentForm.errors.subject_id
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Kelas</Label>
                                        <Select
                                            value={
                                                assessmentForm.data
                                                    .school_class_id
                                            }
                                            onValueChange={(value) =>
                                                assessmentForm.setData(
                                                    'school_class_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schoolClasses.map(
                                                    (schoolClass) => (
                                                        <SelectItem
                                                            key={schoolClass.id}
                                                            value={schoolClass.id.toString()}
                                                        >
                                                            {schoolClass.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                assessmentForm.errors
                                                    .school_class_id
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label>Tipe</Label>
                                        <Select
                                            value={assessmentForm.data.type}
                                            onValueChange={(value) =>
                                                assessmentForm.setData(
                                                    'type',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assessmentTypes.map(
                                                    ([value, label]) => (
                                                        <SelectItem
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={assessmentForm.errors.type}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Skor maks</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={
                                                assessmentForm.data.max_score
                                            }
                                            onChange={(event) =>
                                                assessmentForm.setData(
                                                    'max_score',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                assessmentForm.errors.max_score
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Bobot %</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={assessmentForm.data.weight}
                                            onChange={(event) =>
                                                assessmentForm.setData(
                                                    'weight',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                assessmentForm.errors.weight
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={
                                            assessmentForm.data.assessment_date
                                        }
                                        onChange={(event) =>
                                            assessmentForm.setData(
                                                'assessment_date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            assessmentForm.errors
                                                .assessment_date
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Deskripsi</Label>
                                    <textarea
                                        value={assessmentForm.data.description}
                                        onChange={(event) =>
                                            assessmentForm.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={
                                            assessmentForm.errors.description
                                        }
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsAssessmentFormOpen(false)
                                        }
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={assessmentForm.processing}
                                    >
                                        <ClipboardPlus />
                                        Simpan komponen
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={isScoreFormOpen}
                        onOpenChange={(open) => {
                            setIsScoreFormOpen(open);

                            if (!open) {
                                scoreForm.clearErrors();
                            }
                        }}
                    >
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Input nilai siswa</DialogTitle>
                                <DialogDescription>
                                    Pilih komponen akademik dan siswa, lalu
                                    simpan skor terbaru.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={submitScore} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Komponen</Label>
                                    <Select
                                        value={
                                            scoreForm.data.grade_assessment_id
                                        }
                                        onValueChange={(value) =>
                                            scoreForm.setData((values) => ({
                                                ...values,
                                                grade_assessment_id: value,
                                                student_id: '',
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih komponen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assessments.map((assessment) => (
                                                <SelectItem
                                                    key={assessment.id}
                                                    value={assessment.id.toString()}
                                                >
                                                    {assessment.title} -{' '}
                                                    {
                                                        assessment.school_class
                                                            .name
                                                    }
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={
                                            scoreForm.errors.grade_assessment_id
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Siswa</Label>
                                    <Select
                                        value={scoreForm.data.student_id}
                                        onValueChange={(value) =>
                                            scoreForm.setData(
                                                'student_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih siswa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectableStudents.map(
                                                (student) => (
                                                    <SelectItem
                                                        key={student.id}
                                                        value={student.id.toString()}
                                                    >
                                                        {student.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={scoreForm.errors.student_id}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Skor</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={scoreForm.data.score}
                                        onChange={(event) =>
                                            scoreForm.setData(
                                                'score',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={scoreForm.errors.score}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Feedback</Label>
                                    <textarea
                                        value={scoreForm.data.feedback}
                                        onChange={(event) =>
                                            scoreForm.setData(
                                                'feedback',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={scoreForm.errors.feedback}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setIsScoreFormOpen(false)
                                        }
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={scoreForm.processing}
                                    >
                                        <Save />
                                        Simpan nilai
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </>
            )}

            {activeLmsSubmission && (
                <LmsReviewDialog
                    submission={activeLmsSubmission}
                    aiEnabled={aiEnabled}
                    onClose={() => setActiveLmsSubmission(null)}
                />
            )}
        </>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
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

function LmsGradingPanel({
    tab,
    submissions,
    stats,
    schoolClasses,
    selectedClass,
    onTabChange,
    onClassChange,
    onOpenSubmission,
}: {
    tab: 'pending' | 'graded';
    submissions: LmsSubmission[];
    stats: Props['lmsStats'];
    schoolClasses: SchoolClass[];
    selectedClass: string;
    onTabChange: (tab: 'pending' | 'graded') => void;
    onClassChange: (schoolClassId: string) => void;
    onOpenSubmission: (submission: LmsSubmission) => void;
}) {
    return (
        <div className="grid gap-4">
            <section className="sapa-card border-violet-200/70 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                <div className="flex items-start gap-3">
                    <BookOpenCheck className="mt-0.5 size-5 text-violet-700 dark:text-violet-300" />
                    <div>
                        <h2 className="font-semibold">Tugas dari LMS</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Tugas yang dikumpulkan siswa di LMS bisa diberi skor
                            dan feedback di sini. AI dapat membantu draft
                            penilaian, lalu guru tetap review sebelum disimpan.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <LmsStatCard
                    icon={Clock3}
                    label="Menunggu dinilai"
                    value={stats.pending}
                    tone="amber"
                />
                <LmsStatCard
                    icon={CheckCircle2}
                    label="Sudah dinilai"
                    value={stats.graded}
                    tone="emerald"
                />
            </section>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex gap-2">
                    <TabButton
                        active={tab === 'pending'}
                        onClick={() => onTabChange('pending')}
                    >
                        Belum dinilai
                    </TabButton>
                    <TabButton
                        active={tab === 'graded'}
                        onClick={() => onTabChange('graded')}
                    >
                        Sudah dinilai
                    </TabButton>
                </div>

                <div className="grid w-full gap-2 md:w-72">
                    <Label>Filter kelas</Label>
                    <Select value={selectedClass} onValueChange={onClassChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua kelas</SelectItem>
                            {schoolClasses.map((schoolClass) => (
                                <SelectItem
                                    key={schoolClass.id}
                                    value={schoolClass.id.toString()}
                                >
                                    {schoolClass.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                                : 'Setelah guru menilai tugas, tugas tersebut pindah ke tab ini.'
                        }
                    />
                </div>
            ) : (
                <ul className="grid gap-3">
                    {submissions.map((submission) => (
                        <li key={submission.id}>
                            <LmsSubmissionCard
                                submission={submission}
                                onOpen={() => onOpenSubmission(submission)}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function LmsStatCard({
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

function LmsSubmissionCard({
    submission,
    onOpen,
}: {
    submission: LmsSubmission;
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
                        {submission.assignment?.course_name} -{' '}
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

function LmsReviewDialog({
    submission,
    aiEnabled,
    onClose,
}: {
    submission: LmsSubmission;
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
            const data = await res
                .json()
                .catch(
                    () => ({}) as { message?: string; ai_grade_data?: AiGrade },
                );

            if (!res.ok) {
                setAiError(data.message ?? 'Gagal menjalankan AI grading.');

                return;
            }

            setAi(data.ai_grade_data ?? null);
            toast.success('Draft AI sudah siap. Review dan edit jika perlu.');
        } catch {
            setAiError('Gagal menjalankan AI grading. Coba lagi sebentar.');
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

        toast.success('Skor dan feedback AI disalin ke form.');
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
                            - Skor maks {max}
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
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Draft AI
                                </p>
                                <Button
                                    size="sm"
                                    onClick={generateAi}
                                    disabled={!aiEnabled || aiLoading}
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
                                    Klik Generate untuk meminta AI memberi draft
                                    skor dan feedback. Hasilnya bisa diedit
                                    sebelum disimpan.
                                </p>
                            )}
                            {ai && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between gap-3">
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
                                                {ai.strengths.map(
                                                    (strength, index) => (
                                                        <li key={index}>
                                                            {strength}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                    {!!ai.improvements?.length && (
                                        <div>
                                            <p className="font-semibold text-amber-700 dark:text-amber-300">
                                                Saran perbaikan
                                            </p>
                                            <ul className="ml-4 list-disc">
                                                {ai.improvements.map(
                                                    (item, index) => (
                                                        <li key={index}>
                                                            {item}
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
                            <Label htmlFor="lms-score">Skor (0-{max})</Label>
                            <Input
                                id="lms-score"
                                type="number"
                                min={0}
                                max={max}
                                step="0.01"
                                value={score}
                                onChange={(event) =>
                                    setScore(event.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="lms-feedback">
                                Feedback ke siswa
                            </Label>
                            <textarea
                                id="lms-feedback"
                                value={feedback}
                                onChange={(event) =>
                                    setFeedback(event.target.value)
                                }
                                rows={6}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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

GradesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Penilaian',
            href: '/grades',
        },
    ],
};

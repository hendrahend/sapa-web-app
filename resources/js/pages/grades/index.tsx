import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    CheckCircle2,
    ClipboardPlus,
    Save,
    ShieldAlert,
} from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

type Props = {
    subjects: Subject[];
    schoolClasses: SchoolClass[];
    students: Student[];
    assessments: Assessment[];
    scores: Score[];
    student:
        | (Student & { school_class?: Pick<SchoolClass, 'id' | 'name'> })
        | null;
    stats: {
        assessments: number;
        scores: number;
        needsRemedial: number;
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
    subjects,
    schoolClasses,
    students,
    assessments,
    scores,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canManageGrades = [
        'grades.create',
        'grades.update',
        'grades.delete',
    ].some((permission) => auth.permissions.includes(permission));
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
        });
    }

    function submitScore(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        scoreForm.post('/grades/scores', {
            preserveScroll: true,
            onSuccess: () =>
                scoreForm.setData((values) => ({
                    ...values,
                    score: '',
                    feedback: '',
                })),
        });
    }

    return (
        <>
            <Head title="Penilaian" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <p className="text-sm font-medium text-muted-foreground">
                        Nilai dan capaian belajar
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                        Penilaian
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Kelola komponen nilai, input skor siswa, dan pantau
                        siswa yang membutuhkan tindak lanjut.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {statItems(stats).map((item) => (
                        <div
                            key={item.label}
                            className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
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

                <section className="grid gap-4 xl:grid-cols-[minmax(340px,430px)_1fr]">
                    {canManageGrades && (
                        <div className="grid gap-4">
                            <form
                                onSubmit={submitAssessment}
                                className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <BookOpen className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Guru
                                        </p>
                                        <h2 className="text-lg font-semibold">
                                            Buat komponen nilai
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4">
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
                                            message={
                                                assessmentForm.errors.title
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Mapel</Label>
                                            <Select
                                                value={
                                                    assessmentForm.data
                                                        .subject_id
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
                                                    assessmentForm.errors
                                                        .subject_id
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
                                                                key={
                                                                    schoolClass.id
                                                                }
                                                                value={schoolClass.id.toString()}
                                                            >
                                                                {
                                                                    schoolClass.name
                                                                }
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
                                                message={
                                                    assessmentForm.errors.type
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Skor maks</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={
                                                    assessmentForm.data
                                                        .max_score
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
                                                    assessmentForm.errors
                                                        .max_score
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Bobot %</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={
                                                    assessmentForm.data.weight
                                                }
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
                                                assessmentForm.data
                                                    .assessment_date
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
                                            value={
                                                assessmentForm.data.description
                                            }
                                            onChange={(event) =>
                                                assessmentForm.setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                        <InputError
                                            message={
                                                assessmentForm.errors
                                                    .description
                                            }
                                        />
                                    </div>

                                    <Button
                                        disabled={assessmentForm.processing}
                                    >
                                        <ClipboardPlus />
                                        Simpan komponen
                                    </Button>
                                </div>
                            </form>

                            <form
                                onSubmit={submitScore}
                                className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                                        <Save className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Input nilai
                                        </p>
                                        <h2 className="text-lg font-semibold">
                                            Skor siswa
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4">
                                    <div className="grid gap-2">
                                        <Label>Komponen</Label>
                                        <Select
                                            value={
                                                scoreForm.data
                                                    .grade_assessment_id
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
                                                {assessments.map(
                                                    (assessment) => (
                                                        <SelectItem
                                                            key={assessment.id}
                                                            value={assessment.id.toString()}
                                                        >
                                                            {assessment.title} -{' '}
                                                            {
                                                                assessment
                                                                    .school_class
                                                                    .name
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                scoreForm.errors
                                                    .grade_assessment_id
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
                                            message={
                                                scoreForm.errors.student_id
                                            }
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

                                    <Button disabled={scoreForm.processing}>
                                        <Save />
                                        Simpan nilai
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid gap-4">
                        <section className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                <h2 className="text-lg font-semibold">
                                    Komponen terbaru
                                </h2>
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
                                                    {typeLabel(assessment.type)}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                <span>
                                                    {assessment.subject.name}
                                                </span>
                                                <span>
                                                    {
                                                        assessment.school_class
                                                            .name
                                                    }
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        assessment.assessment_date,
                                                    )}
                                                </span>
                                                <span>
                                                    Bobot {assessment.weight}%
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

                        <section className="rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                <h2 className="text-lg font-semibold">
                                    Nilai terbaru
                                </h2>
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
                                                        {score.assessment.title}
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        {
                                                            score.assessment
                                                                .subject.name
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
                    </div>
                </section>
            </div>
        </>
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

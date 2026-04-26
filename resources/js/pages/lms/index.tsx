import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    BrainCircuit,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    FileText,
    LibraryBig,
    Plus,
    Send,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
};

type Course = {
    id: number;
    title: string;
    description: string | null;
    is_active: boolean;
    materials_count: number;
    assignments_count: number;
    subject: Subject;
    school_class: Pick<SchoolClass, 'id' | 'name'>;
    teacher?: {
        id: number;
        name: string;
    } | null;
};

type Material = {
    id: number;
    title: string;
    content: string;
    published_at: string | null;
    course: Pick<Course, 'id' | 'title'> & {
        subject: Subject;
        school_class: Pick<SchoolClass, 'id' | 'name'>;
    };
};

type Assignment = {
    id: number;
    title: string;
    instructions: string;
    due_at: string | null;
    max_score: number;
    is_published: boolean;
    submissions_count: number;
    course: Pick<Course, 'id' | 'title'> & {
        subject: Subject;
        school_class: Pick<SchoolClass, 'id' | 'name'>;
    };
    submissions?: Submission[];
};

type Submission = {
    id: number;
    content: string | null;
    submitted_at: string | null;
    score: string | number | null;
    feedback: string | null;
    graded_at: string | null;
};

type Student = {
    id: number;
    name: string;
    school_class?: Pick<SchoolClass, 'id' | 'name'> | null;
};

type Props = {
    subjects: Subject[];
    schoolClasses: SchoolClass[];
    courses: Course[];
    materials: Material[];
    assignments: Assignment[];
    student: Student | null;
    stats: {
        courses: number;
        materials: number;
        needsFeedback: number;
    };
};

type CourseForm = {
    subject_id: string;
    school_class_id: string;
    title: string;
    description: string;
    is_active: boolean;
};

type MaterialForm = {
    lms_course_id: string;
    title: string;
    content: string;
    publish_now: boolean;
};

type AssignmentForm = {
    lms_course_id: string;
    title: string;
    instructions: string;
    due_at: string;
    max_score: string;
    is_published: boolean;
};

type SubmissionForm = {
    content: string;
};

type LmsModal = 'course' | 'material' | 'assignment' | null;

function formatDateTime(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function statItems(stats: Props['stats']) {
    return [
        {
            label: 'Course aktif',
            value: stats.courses,
            icon: LibraryBig,
        },
        {
            label: 'Materi',
            value: stats.materials,
            icon: FileText,
        },
        {
            label: 'Butuh feedback',
            value: stats.needsFeedback,
            icon: ClipboardList,
        },
    ];
}

function currentSubmission(assignment: Assignment) {
    return assignment.submissions?.[0] ?? null;
}

function isOverdue(assignment: Assignment) {
    return assignment.due_at
        ? new Date(assignment.due_at).getTime() < Date.now()
        : false;
}

export default function LmsIndex({
    subjects,
    schoolClasses,
    courses,
    materials,
    assignments,
    student,
    stats,
}: Props) {
    const { auth } = usePage().props;
    const canManageLms = auth.permissions.includes('lms.manage');
    const canSubmitAssignments =
        auth.permissions.includes('lms.assignments.submit') && !canManageLms;
    const [activeModal, setActiveModal] = useState<LmsModal>(null);
    const [selectedAssignment, setSelectedAssignment] =
        useState<Assignment | null>(null);
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');

    const courseForm = useForm<CourseForm>({
        subject_id: subjects[0]?.id.toString() ?? '',
        school_class_id: schoolClasses[0]?.id.toString() ?? '',
        title: 'Ruang Belajar',
        description: '',
        is_active: true,
    });
    const materialForm = useForm<MaterialForm>({
        lms_course_id: courses[0]?.id.toString() ?? '',
        title: 'Materi pembelajaran',
        content: '',
        publish_now: true,
    });
    const assignmentForm = useForm<AssignmentForm>({
        lms_course_id: courses[0]?.id.toString() ?? '',
        title: 'Tugas LMS',
        instructions: '',
        due_at: '',
        max_score: '100',
        is_published: true,
    });
    const submissionForm = useForm<SubmissionForm>({
        content: '',
    });

    const filteredCourses = useMemo(
        () =>
            selectedClassFilter === 'all'
                ? courses
                : courses.filter(
                      (course) =>
                          course.school_class.id.toString() ===
                          selectedClassFilter,
                  ),
        [courses, selectedClassFilter],
    );

    const filteredMaterials = useMemo(
        () =>
            selectedClassFilter === 'all'
                ? materials
                : materials.filter(
                      (material) =>
                          material.course.school_class.id.toString() ===
                          selectedClassFilter,
                  ),
        [materials, selectedClassFilter],
    );

    const filteredAssignments = useMemo(
        () =>
            selectedClassFilter === 'all'
                ? assignments
                : assignments.filter(
                      (assignment) =>
                          assignment.course.school_class.id.toString() ===
                          selectedClassFilter,
                  ),
        [assignments, selectedClassFilter],
    );

    function closeModal() {
        setActiveModal(null);
        courseForm.clearErrors();
        materialForm.clearErrors();
        assignmentForm.clearErrors();
    }

    function openSubmissionModal(assignment: Assignment) {
        const submission = currentSubmission(assignment);

        setSelectedAssignment(assignment);
        submissionForm.setData('content', submission?.content ?? '');
        submissionForm.clearErrors();
    }

    function closeSubmissionModal() {
        setSelectedAssignment(null);
        submissionForm.reset();
        submissionForm.clearErrors();
    }

    function submitCourse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        courseForm.post('/lms/courses', {
            preserveScroll: true,
            onSuccess: () => {
                courseForm.setData((values) => ({
                    ...values,
                    title: 'Ruang Belajar',
                    description: '',
                    is_active: true,
                }));
                closeModal();
            },
        });
    }

    function submitMaterial(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        materialForm.post('/lms/materials', {
            preserveScroll: true,
            onSuccess: () => {
                materialForm.setData((values) => ({
                    ...values,
                    title: 'Materi pembelajaran',
                    content: '',
                    publish_now: true,
                }));
                closeModal();
            },
        });
    }

    function submitAssignment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        assignmentForm.post('/lms/assignments', {
            preserveScroll: true,
            onSuccess: () => {
                assignmentForm.setData((values) => ({
                    ...values,
                    title: 'Tugas LMS',
                    instructions: '',
                    due_at: '',
                    max_score: '100',
                    is_published: true,
                }));
                closeModal();
            },
        });
    }

    function submitAssignmentResponse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedAssignment) {
            return;
        }

        submissionForm.post(
            `/lms/assignments/${selectedAssignment.id}/submissions`,
            {
                preserveScroll: true,
                onSuccess: closeSubmissionModal,
            },
        );
    }

    return (
        <>
            <Head title="LMS" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <section className="border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Materi dan tugas
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                                LMS
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                Susun ruang belajar, materi, tugas, dan pondasi
                                fitur AI pembelajaran.
                            </p>
                        </div>

                        {canManageLms && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() => setActiveModal('course')}
                                >
                                    <Plus />
                                    Course
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveModal('material')}
                                >
                                    <FileText />
                                    Materi
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveModal('assignment')}
                                >
                                    <ClipboardList />
                                    Tugas
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {canManageLms && (
                    <section className="grid gap-4 md:grid-cols-3">
                        {statItems(stats).map((item) => (
                            <div key={item.label} className="sapa-soft-card p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <item.icon className="size-4 text-primary" />
                                </div>
                                <p className="mt-3 text-2xl font-semibold">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </section>
                )}

                <section className="rounded-lg border border-primary/25 bg-linear-to-br from-secondary/80 to-primary/10 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
                            <BrainCircuit className="size-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold">
                                    AI LMS
                                </h2>
                                <Badge variant="secondary">Pondasi siap</Badge>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Materi dan tugas akan menjadi sumber fitur AI:
                                rangkum materi, buat soal latihan, dan bantu
                                feedback tugas siswa.
                            </p>
                        </div>
                    </div>
                </section>

                {canSubmitAssignments && !student && (
                    <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                        Akun ini belum terhubung dengan data siswa, jadi submit
                        tugas belum bisa dipakai.
                    </section>
                )}

                <section className="sapa-card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 dark:border-sidebar-border md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Course aktif
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ruang belajar per mapel dan kelas.
                            </p>
                        </div>
                        {canManageLms && (
                            <div className="w-full md:w-64">
                                <Select
                                    value={selectedClassFilter}
                                    onValueChange={setSelectedClassFilter}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Filter kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua kelas
                                        </SelectItem>
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
                        )}
                    </div>

                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredCourses.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                                Belum ada course LMS.
                            </div>
                        )}

                        {filteredCourses.map((course) => (
                            <article
                                key={course.id}
                                className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium">
                                            {course.title}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {course.subject.name} -{' '}
                                            {course.school_class.name}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            course.is_active
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                    >
                                        {course.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>
                                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                                    {course.description ??
                                        'Belum ada deskripsi.'}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <FileText className="size-4" />
                                        {course.materials_count} materi
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <ClipboardList className="size-4" />
                                        {course.assignments_count} tugas
                                    </span>
                                    {course.teacher && (
                                        <span>{course.teacher.name}</span>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <section className="sapa-card overflow-hidden">
                        <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="text-lg font-semibold">
                                Materi terbaru
                            </h2>
                        </div>
                        <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {filteredMaterials.length === 0 && (
                                <div className="p-4 text-sm text-muted-foreground">
                                    Belum ada materi.
                                </div>
                            )}

                            {filteredMaterials.map((material) => (
                                <article key={material.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpenCheck className="mt-1 size-4 shrink-0 text-primary" />
                                        <div>
                                            <p className="font-medium">
                                                {material.title}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {material.course.title} -{' '}
                                                {
                                                    material.course.school_class
                                                        .name
                                                }
                                            </p>
                                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                {material.content}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Publikasi:{' '}
                                                {formatDateTime(
                                                    material.published_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="sapa-card overflow-hidden">
                        <div className="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                            <h2 className="text-lg font-semibold">
                                Tugas terbaru
                            </h2>
                        </div>
                        <div className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {filteredAssignments.length === 0 && (
                                <div className="p-4 text-sm text-muted-foreground">
                                    Belum ada tugas.
                                </div>
                            )}

                            {filteredAssignments.map((assignment) => {
                                const submission = currentSubmission(assignment);
                                const overdue = isOverdue(assignment);

                                return (
                                    <article
                                        key={assignment.id}
                                        className="p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {assignment.title}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {assignment.course.title} -{' '}
                                                    {
                                                        assignment.course
                                                            .school_class.name
                                                    }
                                                </p>
                                            </div>
                                            {canManageLms ? (
                                                <Badge variant="outline">
                                                    {
                                                        assignment.submissions_count
                                                    }{' '}
                                                    submit
                                                </Badge>
                                            ) : submission ? (
                                                <Badge variant="secondary">
                                                    {submission.graded_at
                                                        ? 'Dinilai'
                                                        : 'Terkumpul'}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant={
                                                        overdue
                                                            ? 'destructive'
                                                            : 'outline'
                                                    }
                                                >
                                                    {overdue
                                                        ? 'Lewat deadline'
                                                        : 'Belum submit'}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                            {assignment.instructions}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarClock className="size-4" />
                                                {formatDateTime(
                                                    assignment.due_at,
                                                )}
                                            </span>
                                            <span>
                                                Skor maks {assignment.max_score}
                                            </span>
                                            {canManageLms && (
                                                <span>
                                                    {assignment.is_published
                                                        ? 'Published'
                                                        : 'Draft'}
                                                </span>
                                            )}
                                        </div>

                                        {!canManageLms && submission && (
                                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
                                                <div className="flex flex-wrap items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                                    <CheckCircle2 className="size-4" />
                                                    <span>
                                                        Submit:{' '}
                                                        {formatDateTime(
                                                            submission.submitted_at,
                                                        )}
                                                    </span>
                                                    {submission.score && (
                                                        <span>
                                                            Nilai{' '}
                                                            {submission.score}/
                                                            {
                                                                assignment.max_score
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                {submission.feedback && (
                                                    <p className="mt-2 text-muted-foreground">
                                                        Feedback:{' '}
                                                        {submission.feedback}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {canSubmitAssignments && student && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="mt-4"
                                                disabled={
                                                    overdue ||
                                                    submissionForm.processing
                                                }
                                                onClick={() =>
                                                    openSubmissionModal(
                                                        assignment,
                                                    )
                                                }
                                            >
                                                <Send />
                                                {submission
                                                    ? 'Edit jawaban'
                                                    : 'Submit tugas'}
                                            </Button>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </section>

                <section className="rounded-lg border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/20">
                    <div className="flex items-start gap-3">
                        <Sparkles className="mt-1 size-5 text-sky-700 dark:text-sky-300" />
                        <p className="text-sm leading-6 text-muted-foreground">
                            Tahap berikutnya: hubungkan AI dengan materi LMS
                            untuk membuat rangkuman, soal otomatis, dan saran
                            feedback untuk tugas siswa.
                        </p>
                    </div>
                </section>

                {canManageLms && (
                    <>
                        <Dialog
                            open={activeModal === 'course'}
                            onOpenChange={(open) =>
                                open ? setActiveModal('course') : closeModal()
                            }
                        >
                            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Buat course</DialogTitle>
                                    <DialogDescription>
                                        Buat ruang belajar berdasarkan mapel dan
                                        kelas.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={submitCourse}
                                    className="grid gap-4"
                                >
                                    <div className="grid gap-2">
                                        <Label>Judul course</Label>
                                        <Input
                                            value={courseForm.data.title}
                                            onChange={(event) =>
                                                courseForm.setData(
                                                    'title',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={courseForm.errors.title}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Mapel</Label>
                                            <Select
                                                value={
                                                    courseForm.data.subject_id
                                                }
                                                onValueChange={(value) =>
                                                    courseForm.setData(
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
                                                    courseForm.errors
                                                        .subject_id
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Kelas</Label>
                                            <Select
                                                value={
                                                    courseForm.data
                                                        .school_class_id
                                                }
                                                onValueChange={(value) =>
                                                    courseForm.setData(
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
                                                    courseForm.errors
                                                        .school_class_id
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Deskripsi</Label>
                                        <textarea
                                            value={courseForm.data.description}
                                            onChange={(event) =>
                                                courseForm.setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                        <InputError
                                            message={
                                                courseForm.errors.description
                                            }
                                        />
                                    </div>

                                    <label className="flex items-center gap-3 text-sm font-medium">
                                        <Checkbox
                                            checked={courseForm.data.is_active}
                                            onCheckedChange={(checked) =>
                                                courseForm.setData(
                                                    'is_active',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        Course aktif
                                    </label>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeModal}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={courseForm.processing}
                                        >
                                            Simpan course
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog
                            open={activeModal === 'material'}
                            onOpenChange={(open) =>
                                open ? setActiveModal('material') : closeModal()
                            }
                        >
                            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah materi</DialogTitle>
                                    <DialogDescription>
                                        Materi yang dipublikasikan akan muncul di
                                        LMS siswa.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={submitMaterial}
                                    className="grid gap-4"
                                >
                                    <div className="grid gap-2">
                                        <Label>Course</Label>
                                        <Select
                                            value={
                                                materialForm.data.lms_course_id
                                            }
                                            onValueChange={(value) =>
                                                materialForm.setData(
                                                    'lms_course_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map((course) => (
                                                    <SelectItem
                                                        key={course.id}
                                                        value={course.id.toString()}
                                                    >
                                                        {course.title} -{' '}
                                                        {course.school_class.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                materialForm.errors
                                                    .lms_course_id
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Judul materi</Label>
                                        <Input
                                            value={materialForm.data.title}
                                            onChange={(event) =>
                                                materialForm.setData(
                                                    'title',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={materialForm.errors.title}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Isi materi</Label>
                                        <textarea
                                            value={materialForm.data.content}
                                            onChange={(event) =>
                                                materialForm.setData(
                                                    'content',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                        <InputError
                                            message={
                                                materialForm.errors.content
                                            }
                                        />
                                    </div>

                                    <label className="flex items-center gap-3 text-sm font-medium">
                                        <Checkbox
                                            checked={
                                                materialForm.data.publish_now
                                            }
                                            onCheckedChange={(checked) =>
                                                materialForm.setData(
                                                    'publish_now',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        Publikasikan sekarang
                                    </label>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeModal}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={materialForm.processing}
                                        >
                                            Simpan materi
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog
                            open={activeModal === 'assignment'}
                            onOpenChange={(open) =>
                                open
                                    ? setActiveModal('assignment')
                                    : closeModal()
                            }
                        >
                            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Tambah tugas</DialogTitle>
                                    <DialogDescription>
                                        Buat tugas untuk course tertentu dan
                                        tentukan batas pengumpulan.
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    onSubmit={submitAssignment}
                                    className="grid gap-4"
                                >
                                    <div className="grid gap-2">
                                        <Label>Course</Label>
                                        <Select
                                            value={
                                                assignmentForm.data
                                                    .lms_course_id
                                            }
                                            onValueChange={(value) =>
                                                assignmentForm.setData(
                                                    'lms_course_id',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map((course) => (
                                                    <SelectItem
                                                        key={course.id}
                                                        value={course.id.toString()}
                                                    >
                                                        {course.title} -{' '}
                                                        {course.school_class.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                assignmentForm.errors
                                                    .lms_course_id
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Judul tugas</Label>
                                        <Input
                                            value={assignmentForm.data.title}
                                            onChange={(event) =>
                                                assignmentForm.setData(
                                                    'title',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                assignmentForm.errors.title
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Instruksi</Label>
                                        <textarea
                                            value={
                                                assignmentForm.data.instructions
                                            }
                                            onChange={(event) =>
                                                assignmentForm.setData(
                                                    'instructions',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        />
                                        <InputError
                                            message={
                                                assignmentForm.errors
                                                    .instructions
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Deadline</Label>
                                            <Input
                                                type="datetime-local"
                                                value={
                                                    assignmentForm.data.due_at
                                                }
                                                onChange={(event) =>
                                                    assignmentForm.setData(
                                                        'due_at',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    assignmentForm.errors.due_at
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Skor maks</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={
                                                    assignmentForm.data
                                                        .max_score
                                                }
                                                onChange={(event) =>
                                                    assignmentForm.setData(
                                                        'max_score',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    assignmentForm.errors
                                                        .max_score
                                                }
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 text-sm font-medium">
                                        <Checkbox
                                            checked={
                                                assignmentForm.data.is_published
                                            }
                                            onCheckedChange={(checked) =>
                                                assignmentForm.setData(
                                                    'is_published',
                                                    checked === true,
                                                )
                                            }
                                        />
                                        Tugas dipublikasikan
                                    </label>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeModal}
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                assignmentForm.processing
                                            }
                                        >
                                            Simpan tugas
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </>
                )}

                {canSubmitAssignments && (
                    <Dialog
                        open={selectedAssignment !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                closeSubmissionModal();
                            }
                        }}
                    >
                        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Submit tugas</DialogTitle>
                                <DialogDescription>
                                    {selectedAssignment
                                        ? `${selectedAssignment.title} - ${selectedAssignment.course.title}`
                                        : 'Tulis jawaban tugas dengan lengkap.'}
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={submitAssignmentResponse}
                                className="grid gap-4"
                            >
                                {selectedAssignment && (
                                    <div className="rounded-lg border border-sidebar-border/70 bg-muted/30 p-3 text-sm text-muted-foreground dark:border-sidebar-border">
                                        <p className="font-medium text-foreground">
                                            Instruksi
                                        </p>
                                        <p className="mt-2 leading-6">
                                            {selectedAssignment.instructions}
                                        </p>
                                        <p className="mt-3">
                                            Deadline:{' '}
                                            {formatDateTime(
                                                selectedAssignment.due_at,
                                            )}
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Jawaban</Label>
                                    <textarea
                                        value={submissionForm.data.content}
                                        onChange={(event) =>
                                            submissionForm.setData(
                                                'content',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Tulis jawaban, link dokumen, atau catatan pengerjaan tugas di sini."
                                        className="min-h-44 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError
                                        message={submissionForm.errors.content}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeSubmissionModal}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submissionForm.processing}
                                    >
                                        <Send />
                                        Kirim tugas
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </>
    );
}

LmsIndex.layout = {
    breadcrumbs: [
        {
            title: 'LMS',
            href: '/lms',
        },
    ],
};

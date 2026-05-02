<?php

namespace App\Http\Controllers\Grades;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
use App\Models\LmsSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass:id,name')->first();
        $canManage = ($user?->can(SystemPermission::CreateGrades->value) ?? false)
            || ($user?->can(SystemPermission::UpdateGrades->value) ?? false)
            || ($user?->can(SystemPermission::DeleteGrades->value) ?? false);
        $canGradeLms = $user?->can(SystemPermission::CreateLms->value) ?? false;
        $gradeTab = $request->string('grade_tab')->toString() === 'lms' && $canGradeLms
            ? 'lms'
            : 'academic';
        $lmsTab = $request->string('lms_tab')->toString() === 'graded'
            ? 'graded'
            : 'pending';
        $lmsSchoolClassId = $request->integer('lms_school_class_id') ?: null;

        $assessments = GradeAssessment::query()
            ->with(['subject:id,name,code', 'schoolClass:id,name', 'teacher:id,name'])
            ->withCount('scores')
            ->withAvg('scores', 'score')
            ->when(! $canManage && $student?->school_class_id, fn ($query) => $query->where('school_class_id', $student->school_class_id))
            ->latest('assessment_date')
            ->latest('id')
            ->limit(5)
            ->get();

        $scores = GradeScore::query()
            ->with([
                'student:id,name,nis,school_class_id',
                'student.schoolClass:id,name',
                'assessment:id,title,type,subject_id,school_class_id,max_score',
                'assessment.subject:id,name,code',
            ])
            ->when(! $canManage && $student, fn ($query) => $query->where('student_id', $student->id))
            ->latest('graded_at')
            ->latest('id')
            ->limit(10)
            ->get();

        $lmsSubmissionQuery = LmsSubmission::query()
            ->with([
                'student:id,name,school_class_id',
                'student.schoolClass:id,name',
                'assignment:id,lms_course_id,title,instructions,max_score',
                'assignment.course:id,title,school_class_id',
                'grader:id,name',
            ])
            ->whereHas('assignment')
            ->when($lmsSchoolClassId, fn ($query, int $schoolClassId) => $query->whereHas(
                'assignment.course',
                fn ($q) => $q->where('school_class_id', $schoolClassId)
            ))
            ->where(fn ($q) => $q->whereNotNull('content')->orWhereNotNull('attachment_path'))
            ->whereNotNull('submitted_at');

        if ($lmsTab === 'pending') {
            $lmsSubmissionQuery->whereNull('graded_at');
        } else {
            $lmsSubmissionQuery->whereNotNull('graded_at');
        }

        $lmsSubmissions = $canGradeLms
            ? $lmsSubmissionQuery
                ->orderByDesc('submitted_at')
                ->limit(60)
                ->get()
                ->map(function (LmsSubmission $submission) {
                    $assignment = $submission->assignment;
                    $student = $submission->student;

                    return [
                        'id' => $submission->id,
                        'content' => $submission->content,
                        'attachment_url' => $submission->attachment_url,
                        'attachment_name' => $submission->attachment_name,
                        'attachment_mime' => $submission->attachment_mime,
                        'attachment_size' => $submission->attachment_size,
                        'submitted_at' => optional($submission->submitted_at)->toIso8601String(),
                        'score' => $submission->score !== null ? (float) $submission->score : null,
                        'feedback' => $submission->feedback,
                        'graded_at' => optional($submission->graded_at)->toIso8601String(),
                        'graded_by' => $submission->grader?->only(['id', 'name']),
                        'ai_grade_data' => $submission->ai_grade_data,
                        'ai_graded_at' => optional($submission->ai_graded_at)->toIso8601String(),
                        'student' => $student ? [
                            'id' => $student->id,
                            'name' => $student->name,
                            'class_name' => $student->schoolClass?->name,
                        ] : null,
                        'assignment' => $assignment ? [
                            'id' => $assignment->id,
                            'title' => $assignment->title,
                            'instructions' => $assignment->instructions,
                            'max_score' => $assignment->max_score,
                            'course_name' => $assignment->course?->title,
                        ] : null,
                    ];
                })
            : collect();

        return Inertia::render('grades/index', [
            'gradeTab' => $gradeTab,
            'lmsTab' => $lmsTab,
            'lmsFilters' => [
                'school_class_id' => $lmsSchoolClassId ? (string) $lmsSchoolClassId : 'all',
            ],
            'subjects' => Subject::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'schoolClasses' => SchoolClass::query()
                ->where('is_active', true)
                ->withCount('students')
                ->orderBy('name')
                ->get(['id', 'name', 'grade_level', 'academic_year']),
            'students' => Student::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'nis', 'school_class_id']),
            'exportAssessments' => GradeAssessment::query()
                ->with(['subject:id,name,code', 'schoolClass:id,name', 'teacher:id,name'])
                ->withCount('scores')
                ->withAvg('scores', 'score')
                ->latest('assessment_date')
                ->latest('id')
                ->limit(200)
                ->get(),
            'assessments' => $assessments,
            'scores' => $scores,
            'lmsSubmissions' => $lmsSubmissions,
            'aiEnabled' => filled(config('services.groq.key')),
            'student' => $student,
            'stats' => [
                'assessments' => $canManage
                    ? GradeAssessment::query()->count()
                    : GradeAssessment::query()
                        ->when($student?->school_class_id, fn ($query, int $schoolClassId) => $query->where('school_class_id', $schoolClassId))
                        ->count(),
                'scores' => $canManage
                    ? GradeScore::query()->count()
                    : GradeScore::query()
                        ->when($student, fn ($query, Student $student) => $query->where('student_id', $student->id))
                        ->count(),
                'needsRemedial' => $canManage
                    ? GradeScore::query()->where('score', '<', 75)->count()
                    : GradeScore::query()
                        ->when($student, fn ($query, Student $student) => $query->where('student_id', $student->id))
                        ->where('score', '<', 75)
                        ->count(),
            ],
            'lmsStats' => [
                'pending' => $canGradeLms
                    ? LmsSubmission::query()
                        ->whereHas('assignment')
                        ->when($lmsSchoolClassId, fn ($query, int $schoolClassId) => $query->whereHas(
                            'assignment.course',
                            fn ($q) => $q->where('school_class_id', $schoolClassId)
                        ))
                        ->where(fn ($q) => $q->whereNotNull('content')->orWhereNotNull('attachment_path'))
                        ->whereNotNull('submitted_at')
                        ->whereNull('graded_at')
                        ->count()
                    : 0,
                'graded' => $canGradeLms
                    ? LmsSubmission::query()
                        ->whereHas('assignment')
                        ->when($lmsSchoolClassId, fn ($query, int $schoolClassId) => $query->whereHas(
                            'assignment.course',
                            fn ($q) => $q->where('school_class_id', $schoolClassId)
                        ))
                        ->where(fn ($q) => $q->whereNotNull('content')->orWhereNotNull('attachment_path'))
                        ->whereNotNull('submitted_at')
                        ->whereNotNull('graded_at')
                        ->count()
                    : 0,
            ],
        ]);
    }
}

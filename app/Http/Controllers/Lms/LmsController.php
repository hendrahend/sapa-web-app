<?php

namespace App\Http\Controllers\Lms;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\LmsSubmission;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LmsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass:id,name')->first();
        $canManage = ($user?->can(SystemPermission::CreateLms->value) ?? false)
            || ($user?->can(SystemPermission::UpdateLms->value) ?? false)
            || ($user?->can(SystemPermission::DeleteLms->value) ?? false);

        $courses = LmsCourse::query()
            ->with(['subject:id,name,code', 'schoolClass:id,name', 'teacher:id,name'])
            ->withCount(['materials', 'assignments'])
            ->when(
                ! $canManage,
                fn ($query) => $student
                    ? $query->where('school_class_id', $student->school_class_id)
                    : $query->whereRaw('1 = 0'),
            )
            ->latest('id')
            ->limit(20)
            ->get();

        $materials = LmsMaterial::query()
            ->with(['course:id,title,subject_id,school_class_id', 'course.subject:id,name,code', 'course.schoolClass:id,name'])
            ->whereHas('course', fn ($query) => $query
                ->when(
                    ! $canManage,
                    fn ($courseQuery) => $student
                        ? $courseQuery->where('school_class_id', $student->school_class_id)
                        : $courseQuery->whereRaw('1 = 0'),
                ))
            ->latest('published_at')
            ->latest('id')
            ->limit(12)
            ->get();

        $assignments = LmsAssignment::query()
            ->with(['course:id,title,subject_id,school_class_id', 'course.subject:id,name,code', 'course.schoolClass:id,name'])
            ->when($student, fn ($query) => $query->with([
                'submissions' => fn ($submissionQuery) => $submissionQuery
                    ->where('student_id', $student->id)
                    ->select([
                        'id',
                        'lms_assignment_id',
                        'student_id',
                        'content',
                        'attachment_path',
                        'attachment_name',
                        'attachment_mime',
                        'attachment_size',
                        'submitted_at',
                        'score',
                        'feedback',
                        'graded_at',
                    ]),
            ]))
            ->withCount('submissions')
            ->whereHas('course', fn ($query) => $query
                ->when(
                    ! $canManage,
                    fn ($courseQuery) => $student
                        ? $courseQuery->where('school_class_id', $student->school_class_id)
                        : $courseQuery->whereRaw('1 = 0'),
                ))
            ->when(! $canManage, fn ($query) => $query->where('is_published', true))
            ->latest('due_at')
            ->latest('id')
            ->limit(12)
            ->get();

        return Inertia::render('lms/index', [
            'subjects' => Subject::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'schoolClasses' => SchoolClass::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'grade_level', 'academic_year']),
            'courses' => $courses,
            'materials' => $materials,
            'assignments' => $assignments,
            'student' => $student,
            'aiEnabled' => filled(config('services.groq.key')),
            'stats' => [
                'courses' => LmsCourse::query()->where('is_active', true)->count(),
                'materials' => LmsMaterial::query()->count(),
                'needsFeedback' => LmsSubmission::query()
                    ->whereNotNull('submitted_at')
                    ->whereNull('graded_at')
                    ->count(),
            ],
        ]);
    }
}

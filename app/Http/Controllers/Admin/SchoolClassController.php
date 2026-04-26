<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolClassRequest;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    public function index(): Response
    {
        $classes = SchoolClass::query()
            ->with('homeroomTeacher:id,name,email')
            ->withCount(['students', 'attendanceSessions', 'gradeAssessments', 'lmsCourses'])
            ->orderByDesc('is_active')
            ->orderByDesc('academic_year')
            ->orderBy('name')
            ->get()
            ->map(fn (SchoolClass $schoolClass) => [
                'id' => $schoolClass->id,
                'homeroom_teacher_id' => $schoolClass->homeroom_teacher_id,
                'name' => $schoolClass->name,
                'grade_level' => $schoolClass->grade_level,
                'academic_year' => $schoolClass->academic_year,
                'is_active' => $schoolClass->is_active,
                'homeroom_teacher' => $schoolClass->homeroomTeacher ? [
                    'id' => $schoolClass->homeroomTeacher->id,
                    'name' => $schoolClass->homeroomTeacher->name,
                    'email' => $schoolClass->homeroomTeacher->email,
                ] : null,
                'students_count' => $schoolClass->students_count,
                'attendance_sessions_count' => $schoolClass->attendance_sessions_count,
                'grade_assessments_count' => $schoolClass->grade_assessments_count,
                'lms_courses_count' => $schoolClass->lms_courses_count,
            ]);

        return Inertia::render('admin/classes/index', [
            'classes' => $classes,
            'teachers' => User::role(UserRole::Teacher->value)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'stats' => [
                'totalClasses' => SchoolClass::query()->count(),
                'activeClasses' => SchoolClass::query()->where('is_active', true)->count(),
                'withHomeroomTeacher' => SchoolClass::query()->whereNotNull('homeroom_teacher_id')->count(),
                'emptyClasses' => SchoolClass::query()->doesntHave('students')->count(),
            ],
        ]);
    }

    public function store(SchoolClassRequest $request): RedirectResponse
    {
        SchoolClass::create($this->classData($request));

        $this->successToast('Data kelas berhasil ditambahkan.');

        return to_route('admin.classes.index');
    }

    public function update(SchoolClassRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        $schoolClass->update($this->classData($request));

        $this->successToast('Data kelas berhasil diperbarui.');

        return to_route('admin.classes.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function classData(SchoolClassRequest $request): array
    {
        return $request->safe()->only([
            'homeroom_teacher_id',
            'name',
            'grade_level',
            'academic_year',
            'is_active',
        ]);
    }
}

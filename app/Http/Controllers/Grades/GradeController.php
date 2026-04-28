<?php

namespace App\Http\Controllers\Grades;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
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

        $assessments = GradeAssessment::query()
            ->with(['subject:id,name,code', 'schoolClass:id,name', 'teacher:id,name'])
            ->withCount('scores')
            ->withAvg('scores', 'score')
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

        return Inertia::render('grades/index', [
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
            'assessments' => $assessments,
            'scores' => $scores,
            'student' => $student,
            'stats' => [
                'assessments' => GradeAssessment::query()->count(),
                'scores' => GradeScore::query()->count(),
                'needsRemedial' => GradeScore::query()->where('score', '<', 75)->count(),
            ],
        ]);
    }
}

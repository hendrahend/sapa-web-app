<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsAssignmentRequest;
use App\Models\GradeAssessment;
use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class LmsAssignmentController extends Controller
{
    public function store(LmsAssignmentRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated) {
            $course = LmsCourse::query()
                ->select(['id', 'subject_id', 'school_class_id'])
                ->findOrFail($validated['lms_course_id']);

            $assessment = null;
            if ($validated['sync_to_gradebook']) {
                $assessment = GradeAssessment::create([
                    'subject_id' => $course->subject_id,
                    'school_class_id' => $course->school_class_id,
                    'teacher_id' => $request->user()?->id,
                    'title' => $validated['title'],
                    'type' => 'tugas',
                    'assessment_date' => now()->toDateString(),
                    'max_score' => $validated['max_score'],
                    'weight' => $validated['gradebook_weight'] ?? 10,
                    'description' => 'Diambil otomatis dari tugas LMS.',
                ]);
            }

            LmsAssignment::create([
                'lms_course_id' => $validated['lms_course_id'],
                'grade_assessment_id' => $assessment?->id,
                'title' => $validated['title'],
                'instructions' => $validated['instructions'],
                'due_at' => $validated['due_at'] ?? null,
                'max_score' => $validated['max_score'],
                'is_published' => $validated['is_published'],
            ]);
        });

        $this->successToast('Tugas LMS berhasil dibuat.');

        return to_route('lms.index');
    }
}

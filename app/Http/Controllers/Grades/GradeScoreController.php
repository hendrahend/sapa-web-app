<?php

namespace App\Http\Controllers\Grades;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Grades\GradeScoreRequest;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GradeScoreController extends Controller
{
    public function store(GradeScoreRequest $request): RedirectResponse
    {
        GradeScore::updateOrCreate([
            'grade_assessment_id' => $request->integer('grade_assessment_id'),
            'student_id' => $request->integer('student_id'),
        ], [
            'score' => $request->validated('score'),
            'feedback' => $request->validated('feedback'),
            'graded_by_id' => $request->user()?->id,
            'graded_at' => now(),
        ]);

        $this->successToast('Nilai siswa berhasil disimpan.');

        return to_route('grades.index');
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        abort_unless(
            ($request->user()?->can(SystemPermission::CreateGrades->value) ?? false)
            || ($request->user()?->can(SystemPermission::UpdateGrades->value) ?? false),
            403
        );

        $validated = $request->validate([
            'grade_assessment_id' => ['required', 'integer', 'exists:grade_assessments,id'],
            'scores' => ['required', 'array'],
            'scores.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'scores.*.score' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'scores.*.feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $assessment = GradeAssessment::query()->findOrFail($validated['grade_assessment_id']);
        $studentIds = collect($validated['scores'])->pluck('student_id')->map(fn ($id) => (int) $id)->all();
        $validStudentIds = Student::query()
            ->where('school_class_id', $assessment->school_class_id)
            ->whereIn('id', $studentIds)
            ->pluck('id')
            ->all();

        if (count($validStudentIds) !== count(array_unique($studentIds))) {
            throw ValidationException::withMessages([
                'scores' => 'Daftar siswa harus sesuai dengan kelas komponen nilai.',
            ]);
        }

        $rows = collect($validated['scores'])
            ->filter(fn (array $row) => $row['score'] !== null && $row['score'] !== '')
            ->values();

        $tooHigh = $rows->first(fn (array $row) => (float) $row['score'] > $assessment->max_score);
        if ($tooHigh) {
            throw ValidationException::withMessages([
                'scores' => "Skor tidak boleh melebihi {$assessment->max_score}.",
            ]);
        }

        DB::transaction(function () use ($assessment, $request, $rows) {
            foreach ($rows as $row) {
                GradeScore::updateOrCreate([
                    'grade_assessment_id' => $assessment->id,
                    'student_id' => (int) $row['student_id'],
                ], [
                    'score' => $row['score'],
                    'feedback' => $row['feedback'] ?? null,
                    'graded_by_id' => $request->user()?->id,
                    'graded_at' => now(),
                ]);
            }
        });

        $this->successToast($rows->count().' nilai siswa berhasil disimpan.');

        return to_route('grades.index');
    }
}

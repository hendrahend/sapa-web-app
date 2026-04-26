<?php

namespace App\Http\Controllers\Grades;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grades\GradeScoreRequest;
use App\Models\GradeScore;
use Illuminate\Http\RedirectResponse;

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
}

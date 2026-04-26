<?php

namespace App\Http\Controllers\Grades;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grades\GradeAssessmentRequest;
use App\Models\GradeAssessment;
use Illuminate\Http\RedirectResponse;

class GradeAssessmentController extends Controller
{
    public function store(GradeAssessmentRequest $request): RedirectResponse
    {
        GradeAssessment::create([
            ...$request->validated(),
            'teacher_id' => $request->user()?->id,
        ]);

        $this->successToast('Komponen nilai berhasil dibuat.');

        return to_route('grades.index');
    }
}

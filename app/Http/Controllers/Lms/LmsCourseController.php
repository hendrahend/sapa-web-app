<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsCourseRequest;
use App\Models\LmsCourse;
use Illuminate\Http\RedirectResponse;

class LmsCourseController extends Controller
{
    public function store(LmsCourseRequest $request): RedirectResponse
    {
        LmsCourse::create([
            ...$request->validated(),
            'teacher_id' => $request->user()?->id,
        ]);

        $this->successToast('Course LMS berhasil dibuat.');

        return to_route('lms.index');
    }
}

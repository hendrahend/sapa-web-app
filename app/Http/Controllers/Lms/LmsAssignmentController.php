<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsAssignmentRequest;
use App\Models\LmsAssignment;
use Illuminate\Http\RedirectResponse;

class LmsAssignmentController extends Controller
{
    public function store(LmsAssignmentRequest $request): RedirectResponse
    {
        LmsAssignment::create($request->validated());

        $this->successToast('Tugas LMS berhasil dibuat.');

        return to_route('lms.index');
    }
}

<?php

namespace App\Http\Controllers\Lms;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lms\LmsSubmissionRequest;
use App\Models\LmsAssignment;
use App\Models\LmsSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;

class LmsSubmissionController extends Controller
{
    public function store(LmsSubmissionRequest $request, LmsAssignment $assignment): RedirectResponse
    {
        $student = $request->user()?->student()->first();

        if (! $student) {
            $this->errorToast('Akun ini belum terhubung dengan data siswa.');

            return back();
        }

        $assignment->load('course:id,school_class_id');

        if (! $assignment->is_published || $assignment->course?->school_class_id !== $student->school_class_id) {
            abort(403);
        }

        if ($assignment->due_at && Carbon::parse($assignment->due_at)->isPast()) {
            $this->errorToast('Deadline tugas sudah lewat.');

            return back();
        }

        LmsSubmission::updateOrCreate(
            [
                'lms_assignment_id' => $assignment->id,
                'student_id' => $student->id,
            ],
            [
                'content' => $request->validated('content'),
                'submitted_at' => now(),
                'score' => null,
                'feedback' => null,
                'graded_by_id' => null,
                'graded_at' => null,
            ],
        );

        $this->successToast('Tugas berhasil dikumpulkan.');

        return to_route('lms.index');
    }
}

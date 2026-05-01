<?php

namespace App\Http\Controllers\Lms;

use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\LmsComment;
use App\Models\LmsCourse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LmsCommentController extends Controller
{
    public function store(Request $request, LmsCourse $course): RedirectResponse
    {
        abort_unless($this->canAccessCourse($request, $course), 403);

        $data = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ]);

        LmsComment::query()->create([
            'lms_course_id' => $course->id,
            'user_id' => $request->user()?->id,
            'body' => $data['body'],
        ]);

        return back()->with('success', 'Komentar terkirim.');
    }

    private function canAccessCourse(Request $request, LmsCourse $course): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if ($user->can(SystemPermission::CreateLms->value) || $user->can(SystemPermission::UpdateLms->value)) {
            return true;
        }

        return $user->student?->school_class_id === $course->school_class_id;
    }
}

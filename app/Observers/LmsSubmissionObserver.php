<?php

namespace App\Observers;

use App\Models\GradeScore;
use App\Models\LmsSubmission;
use App\Notifications\LmsSubmissionGradedForChild;
use App\Services\Xp\XpService;
use Illuminate\Support\Facades\Notification;

class LmsSubmissionObserver
{
    public function __construct(private readonly XpService $xp) {}

    public function created(LmsSubmission $submission): void
    {
        if ($submission->submitted_at) {
            $this->xp->awardForLmsSubmission($submission);
        }

        if ($submission->graded_at) {
            $this->xp->awardForLmsGraded($submission);
            $this->syncGradebookScore($submission);
            $this->notifyParents($submission);
        }
    }

    public function updated(LmsSubmission $submission): void
    {
        if ($submission->wasChanged('submitted_at') && $submission->submitted_at) {
            $this->xp->awardForLmsSubmission($submission);
        }

        if ($submission->wasChanged('graded_at') && $submission->graded_at) {
            $this->xp->awardForLmsGraded($submission);
        }

        if (($submission->wasChanged('graded_at') && $submission->graded_at) || ($submission->graded_at && $submission->wasChanged('score'))) {
            $this->syncGradebookScore($submission);
            $this->notifyParents($submission);
        }
    }

    private function syncGradebookScore(LmsSubmission $submission): void
    {
        $submission->loadMissing('assignment:id,grade_assessment_id');

        if (! $submission->assignment?->grade_assessment_id || $submission->score === null) {
            return;
        }

        GradeScore::withoutEvents(function () use ($submission) {
            GradeScore::updateOrCreate([
                'grade_assessment_id' => $submission->assignment->grade_assessment_id,
                'student_id' => $submission->student_id,
            ], [
                'score' => $submission->score,
                'feedback' => $submission->feedback,
                'graded_by_id' => $submission->graded_by_id,
                'graded_at' => $submission->graded_at ?? now(),
            ]);
        });
    }

    private function notifyParents(LmsSubmission $submission): void
    {
        $student = $submission->student()->with('parentUsers:id,email,name')->first();
        if (! $student) {
            return;
        }

        $parents = $student->parentUsers;

        if ($parents->isEmpty()) {
            return;
        }

        Notification::send($parents, new LmsSubmissionGradedForChild($submission));
    }
}

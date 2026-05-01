<?php

namespace App\Observers;

use App\Models\LmsSubmission;
use App\Services\Xp\XpService;

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
    }
}

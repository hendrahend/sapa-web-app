<?php

namespace App\Observers;

use App\Models\GradeScore;
use App\Notifications\GradeReleasedForChild;
use App\Services\Xp\XpService;
use Illuminate\Support\Facades\Notification;

class GradeScoreObserver
{
    public function __construct(private readonly XpService $xp) {}

    public function created(GradeScore $score): void
    {
        $this->afterChange($score);
    }

    public function updated(GradeScore $score): void
    {
        if ($score->wasChanged('score')) {
            $this->afterChange($score);
        }
    }

    private function afterChange(GradeScore $score): void
    {
        $this->xp->awardForGrade($score);

        $student = $score->student()->with('parentUsers:id,email,name')->first();
        if (! $student) {
            return;
        }

        $parents = $student->parentUsers;

        if ($parents->isEmpty()) {
            return;
        }

        Notification::send($parents, new GradeReleasedForChild($score));
    }
}

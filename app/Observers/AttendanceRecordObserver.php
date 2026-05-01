<?php

namespace App\Observers;

use App\Models\AttendanceRecord;
use App\Notifications\AttendanceRecordedForChild;
use App\Services\Xp\XpService;
use Illuminate\Support\Facades\Notification;

class AttendanceRecordObserver
{
    public function __construct(private readonly XpService $xp) {}

    public function created(AttendanceRecord $record): void
    {
        $this->afterChange($record);
    }

    public function updated(AttendanceRecord $record): void
    {
        // Re-award XP if the status changed (e.g., late → present after correction).
        if ($record->wasChanged('status')) {
            $this->afterChange($record);
        }
    }

    private function afterChange(AttendanceRecord $record): void
    {
        $this->xp->awardForAttendance($record);

        $student = $record->student()->with('parentUsers:id,email,name')->first();
        if (! $student) {
            return;
        }

        $parents = $student->parentUsers;

        if ($parents->isEmpty()) {
            return;
        }

        Notification::send($parents, new AttendanceRecordedForChild($record));
    }
}

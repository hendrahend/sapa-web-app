<?php

namespace App\Observers;

use App\Models\AttendanceRecord;
use App\Notifications\AttendanceRecordedForChild;
use App\Services\Xp\XpService;
use Illuminate\Notifications\DatabaseNotification;
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

        if ($record->wasChanged('verification_status')) {
            $this->syncParentAttendanceNotifications($record);
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

    private function syncParentAttendanceNotifications(AttendanceRecord $record): void
    {
        $student = $record->student()->with('parentUsers:id,email,name')->first();
        if (! $student) {
            return;
        }

        $notification = new AttendanceRecordedForChild($record->fresh(['student', 'session.schoolLocation']) ?? $record);

        foreach ($student->parentUsers as $parent) {
            DatabaseNotification::query()
                ->where('notifiable_type', $parent->getMorphClass())
                ->where('notifiable_id', $parent->getKey())
                ->where('type', AttendanceRecordedForChild::class)
                ->where('data->attendance_record_id', $record->id)
                ->get()
                ->each(fn (DatabaseNotification $databaseNotification) => $databaseNotification
                    ->forceFill(['data' => $notification->toArray($parent)])
                    ->save());
        }
    }
}

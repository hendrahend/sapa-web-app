<?php

namespace App\Models;

use App\Enums\AttendanceExcuseStatus;
use App\Enums\AttendanceStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'student_id',
    'type',
    'start_date',
    'end_date',
    'reason',
    'attachment_path',
    'status',
    'reviewed_by_id',
    'reviewed_at',
    'admin_notes',
])]
class AttendanceExcuse extends Model
{
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'reviewed_at' => 'datetime',
            'type' => AttendanceStatus::class,
            'status' => AttendanceExcuseStatus::class,
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }
}

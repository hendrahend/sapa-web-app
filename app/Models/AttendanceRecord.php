<?php

namespace App\Models;

use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['attendance_session_id', 'student_id', 'status', 'checked_in_at', 'latitude', 'longitude', 'location_accuracy_meters', 'distance_from_school_meters', 'is_within_radius', 'selfie_path', 'verification_status', 'verified_by_id', 'verified_at', 'notes'])]
class AttendanceRecord extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => AttendanceStatus::class,
            'checked_in_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'location_accuracy_meters' => 'integer',
            'distance_from_school_meters' => 'integer',
            'is_within_radius' => 'boolean',
            'verification_status' => AttendanceVerificationStatus::class,
            'verified_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }
}

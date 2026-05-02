<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LmsSubmission extends Model
{
    protected $fillable = [
        'lms_assignment_id',
        'student_id',
        'graded_by_id',
        'content',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'attachment_size',
        'submitted_at',
        'score',
        'feedback',
        'graded_at',
        'ai_grade_data',
        'ai_graded_at',
    ];

    protected $appends = ['attachment_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'score' => 'decimal:2',
            'graded_at' => 'datetime',
            'ai_grade_data' => 'array',
            'ai_graded_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(LmsAssignment::class, 'lms_assignment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by_id');
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path ? asset('storage/'.$this->attachment_path) : null;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LmsAssignment extends Model
{
    protected $fillable = [
        'lms_course_id',
        'grade_assessment_id',
        'title',
        'instructions',
        'due_at',
        'max_score',
        'is_published',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'max_score' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(LmsCourse::class, 'lms_course_id');
    }

    public function gradeAssessment(): BelongsTo
    {
        return $this->belongsTo(GradeAssessment::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(LmsSubmission::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'code', 'description', 'is_active'])]
class Subject extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function gradeAssessments(): HasMany
    {
        return $this->hasMany(GradeAssessment::class);
    }

    public function lmsCourses(): HasMany
    {
        return $this->hasMany(LmsCourse::class);
    }
}

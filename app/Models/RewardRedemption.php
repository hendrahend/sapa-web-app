<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'student_id',
    'reward_id',
    'xp_spent',
    'status',
    'notes',
    'admin_notes',
    'requested_at',
    'decided_at',
    'decided_by',
])]
class RewardRedemption extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_DELIVERED = 'delivered';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'xp_spent' => 'integer',
            'requested_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reward(): BelongsTo
    {
        return $this->belongsTo(Reward::class);
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}

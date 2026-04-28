<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'description',
    'image_url',
    'xp_cost',
    'stock',
    'is_active',
    'created_by',
])]
class Reward extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'xp_cost' => 'integer',
            'stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class);
    }

    public function isUnlimited(): bool
    {
        return $this->stock < 0;
    }

    public function inStock(): bool
    {
        return $this->isUnlimited() || $this->stock > 0;
    }
}

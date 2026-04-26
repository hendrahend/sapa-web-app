<?php

namespace App\Models;

use App\Support\Geofence;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'address', 'latitude', 'longitude', 'radius_meters', 'is_active'])]
class SchoolLocation extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'radius_meters' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    public function distanceTo(float $latitude, float $longitude): int
    {
        return Geofence::distanceInMeters(
            $this->latitude,
            $this->longitude,
            $latitude,
            $longitude,
        );
    }

    public function containsCoordinate(float $latitude, float $longitude): bool
    {
        return $this->distanceTo($latitude, $longitude) <= $this->radius_meters;
    }
}

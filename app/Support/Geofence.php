<?php

namespace App\Support;

class Geofence
{
    private const EARTH_RADIUS_METERS = 6371000;

    public static function distanceInMeters(
        float $fromLatitude,
        float $fromLongitude,
        float $toLatitude,
        float $toLongitude,
    ): int {
        $fromLatitude = deg2rad($fromLatitude);
        $toLatitude = deg2rad($toLatitude);
        $latitudeDelta = $toLatitude - $fromLatitude;
        $longitudeDelta = deg2rad($toLongitude - $fromLongitude);

        $haversine = sin($latitudeDelta / 2) ** 2
            + cos($fromLatitude) * cos($toLatitude) * sin($longitudeDelta / 2) ** 2;

        return (int) round(2 * self::EARTH_RADIUS_METERS * asin(min(1, sqrt($haversine))));
    }

    public static function isInsideRadius(
        float $fromLatitude,
        float $fromLongitude,
        float $toLatitude,
        float $toLongitude,
        int $radiusMeters,
    ): bool {
        return self::distanceInMeters($fromLatitude, $fromLongitude, $toLatitude, $toLongitude) <= $radiusMeters;
    }
}

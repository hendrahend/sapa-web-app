<?php

use App\Support\Geofence;

test('it calculates short coordinate distances in meters', function () {
    $distance = Geofence::distanceInMeters(-6.2, 106.8166667, -6.2005, 106.8166667);

    expect($distance)->toBeGreaterThan(50)
        ->and($distance)->toBeLessThan(60);
});

test('it checks whether a coordinate is inside a radius', function () {
    expect(Geofence::isInsideRadius(-6.2, 106.8166667, -6.2005, 106.8166667, 100))->toBeTrue()
        ->and(Geofence::isInsideRadius(-6.2, 106.8166667, -6.205, 106.8166667, 100))->toBeFalse();
});

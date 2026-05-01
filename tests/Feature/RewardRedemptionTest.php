<?php

use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\Student;
use App\Models\User;
use App\Models\XpEvent;
use App\Services\Rewards\RewardService;
use Database\Seeders\RoleAndPermissionSeeder;

beforeEach(function () {
    $this->seed(RoleAndPermissionSeeder::class);
});

function makeStudentUser(int $startingXp = 500): array
{
    $user = User::factory()->create();
    $user->assignRole('siswa');

    $student = Student::query()->create([
        'user_id' => $user->id,
        'name' => 'Test Siswa',
        'nis' => 'TEST-'.$user->id,
        'is_active' => true,
    ]);

    if ($startingXp > 0) {
        XpEvent::query()->create([
            'student_id' => $student->id,
            'source' => 'seed',
            'source_id' => null,
            'points' => $startingXp,
            'reason' => 'Seed XP',
            'awarded_at' => now(),
        ]);
    }

    return [$user, $student];
}

test('student can request a redemption and XP is locked immediately', function () {
    [$user, $student] = makeStudentUser(500);

    $reward = Reward::query()->create([
        'name' => 'Test Reward',
        'xp_cost' => 200,
        'stock' => 5,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post("/rewards/{$reward->id}/redeem", ['notes' => 'tolong ya'])
        ->assertRedirect();

    $redemption = RewardRedemption::query()->latest('id')->first();
    expect($redemption->status)->toBe('pending');
    expect($redemption->xp_spent)->toBe(200);

    $balance = (int) XpEvent::query()->where('student_id', $student->id)->sum('points');
    expect($balance)->toBe(300); // 500 - 200

    $reward->refresh();
    expect($reward->stock)->toBe(4);
});

test('student cannot redeem if XP is insufficient', function () {
    [$user] = makeStudentUser(50);

    $reward = Reward::query()->create([
        'name' => 'Mahal',
        'xp_cost' => 200,
        'stock' => -1,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post("/rewards/{$reward->id}/redeem")
        ->assertSessionHasErrors('notes');

    expect(RewardRedemption::query()->count())->toBe(0);
});

test('admin can reject a redemption and XP is refunded', function () {
    [$user, $student] = makeStudentUser(500);

    $reward = Reward::query()->create([
        'name' => 'Refund Reward',
        'xp_cost' => 200,
        'stock' => 5,
        'is_active' => true,
    ]);

    $service = app(RewardService::class);
    $redemption = $service->requestRedemption($student, $reward);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $service->reject($redemption->fresh(), $admin, 'tidak memenuhi syarat');

    $balance = (int) XpEvent::query()->where('student_id', $student->id)->sum('points');
    expect($balance)->toBe(500); // refunded

    $reward->refresh();
    expect($reward->stock)->toBe(5); // restored
    expect(RewardRedemption::query()->find($redemption->id)->status)->toBe('rejected');
});

test('admin can approve and then mark a redemption as delivered', function () {
    [$user, $student] = makeStudentUser(500);

    $reward = Reward::query()->create([
        'name' => 'Deliverable',
        'xp_cost' => 100,
        'stock' => -1,
        'is_active' => true,
    ]);

    $service = app(RewardService::class);
    $redemption = $service->requestRedemption($student, $reward);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $service->approve($redemption->fresh(), $admin);
    expect(RewardRedemption::query()->find($redemption->id)->status)->toBe('approved');

    $service->deliver($redemption->fresh(), $admin);
    expect(RewardRedemption::query()->find($redemption->id)->status)->toBe('delivered');

    // XP not refunded
    $balance = (int) XpEvent::query()->where('student_id', $student->id)->sum('points');
    expect($balance)->toBe(400);
});

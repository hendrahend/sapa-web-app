<?php

use App\Enums\UserRole;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;

test('admin can assign a role to a pending registered user', function () {
    $this->seed(RoleAndPermissionSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(UserRole::Admin->value);

    $pendingUser = User::factory()->create([
        'email_verified_at' => null,
    ]);

    $schoolClass = SchoolClass::create([
        'name' => 'X RPL 1',
        'grade_level' => '10',
        'academic_year' => '2026/2027',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.users.update', $pendingUser), [
            'name' => $pendingUser->name,
            'email' => $pendingUser->email,
            'password' => '',
            'role' => UserRole::Student->value,
            'email_verified' => true,
            'create_student_profile' => true,
            'school_class_id' => $schoolClass->id,
            'nis' => 'SAPA-001',
            'nisn' => '',
            'gender' => 'L',
        ])
        ->assertRedirect(route('admin.users.index'));

    $pendingUser->refresh();

    expect($pendingUser->hasRole(UserRole::Student->value))->toBeTrue()
        ->and($pendingUser->email_verified_at)->not->toBeNull()
        ->and(Student::where('user_id', $pendingUser->id)->exists())->toBeTrue();
});

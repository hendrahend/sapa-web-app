<?php

use App\Enums\SystemPermission;
use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('sapa base roles and permissions can be seeded', function () {
    $this->seed(RoleAndPermissionSeeder::class);

    $roleNames = array_map(fn (UserRole $role) => $role->value, UserRole::cases());

    expect(Role::whereIn('name', $roleNames)->count())->toBe(4);

    $teacher = User::factory()->create();
    $teacher->assignRole(UserRole::Teacher->value);

    expect($teacher->can(SystemPermission::CreateAttendance->value))->toBeTrue()
        ->and($teacher->can(SystemPermission::UpdateGrades->value))->toBeTrue()
        ->and($teacher->can(SystemPermission::CreateUsers->value))->toBeFalse();
});

test('admin user seed has every permission through the admin role', function () {
    $this->seed(RoleAndPermissionSeeder::class);
    $this->seed(AdminUserSeeder::class);

    $admin = User::where('email', 'admin@sapa.test')->firstOrFail();

    expect($admin->hasRole(UserRole::Admin->value))->toBeTrue();

    foreach (SystemPermission::cases() as $permission) {
        expect($admin->can($permission->value))->toBeTrue();
    }
});

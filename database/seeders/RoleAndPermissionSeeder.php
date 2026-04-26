<?php

namespace Database\Seeders;

use App\Enums\SystemPermission;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Seed SAPA's base role and permission matrix.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (SystemPermission::cases() as $permission) {
            Permission::findOrCreate($permission->value);
        }

        $admin = Role::findOrCreate(UserRole::Admin->value);
        $teacher = Role::findOrCreate(UserRole::Teacher->value);
        $student = Role::findOrCreate(UserRole::Student->value);
        $parent = Role::findOrCreate(UserRole::Parent->value);

        $admin->syncPermissions(array_map(
            fn (SystemPermission $permission) => $permission->value,
            SystemPermission::cases(),
        ));

        $teacher->syncPermissions([
            SystemPermission::ManageAttendance->value,
            SystemPermission::ViewAttendance->value,
            SystemPermission::ManageGrades->value,
            SystemPermission::ViewGrades->value,
            SystemPermission::ManageLms->value,
            SystemPermission::ViewLms->value,
            SystemPermission::ManageXp->value,
            SystemPermission::ViewXp->value,
            SystemPermission::ManageNotifications->value,
            SystemPermission::ViewNotifications->value,
        ]);

        $student->syncPermissions([
            SystemPermission::ViewOwnAttendance->value,
            SystemPermission::ViewGrades->value,
            SystemPermission::ViewLms->value,
            SystemPermission::SubmitLmsAssignments->value,
            SystemPermission::ViewXp->value,
            SystemPermission::ViewNotifications->value,
        ]);

        $parent->syncPermissions([
            SystemPermission::ViewChildren->value,
            SystemPermission::ViewAttendance->value,
            SystemPermission::ViewGrades->value,
            SystemPermission::ViewNotifications->value,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}

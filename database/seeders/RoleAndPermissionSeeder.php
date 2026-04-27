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

        $permissionNames = array_map(
            fn (SystemPermission $permission) => $permission->value,
            SystemPermission::cases(),
        );

        foreach (SystemPermission::cases() as $permission) {
            Permission::findOrCreate($permission->value);
        }

        Permission::query()
            ->whereIn('name', $this->deprecatedPermissions())
            ->delete();

        $admin = Role::findOrCreate(UserRole::Admin->value);
        $teacher = Role::findOrCreate(UserRole::Teacher->value);
        $student = Role::findOrCreate(UserRole::Student->value);
        $parent = Role::findOrCreate(UserRole::Parent->value);

        $admin->syncPermissions($permissionNames);

        $teacher->syncPermissions([
            SystemPermission::ViewAttendance->value,
            SystemPermission::CreateAttendance->value,
            SystemPermission::UpdateAttendance->value,
            SystemPermission::ViewGrades->value,
            SystemPermission::CreateGrades->value,
            SystemPermission::UpdateGrades->value,
            SystemPermission::ViewLms->value,
            SystemPermission::CreateLms->value,
            SystemPermission::UpdateLms->value,
            SystemPermission::ViewXp->value,
            SystemPermission::CreateXp->value,
            SystemPermission::UpdateXp->value,
            SystemPermission::ViewNotifications->value,
            SystemPermission::CreateNotifications->value,
            SystemPermission::UpdateNotifications->value,
        ]);

        $student->syncPermissions([
            SystemPermission::ViewOwnAttendance->value,
            SystemPermission::CreateOwnAttendance->value,
            SystemPermission::ViewGrades->value,
            SystemPermission::ViewLms->value,
            SystemPermission::SubmitLmsAssignments->value,
            SystemPermission::ViewXp->value,
            SystemPermission::ViewNotifications->value,
        ]);

        $parent->syncPermissions([
            SystemPermission::ViewChildren->value,
            SystemPermission::ViewNotifications->value,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @return array<int, string>
     */
    private function deprecatedPermissions(): array
    {
        return [
            'users.manage',
            'school_locations.manage',
            'attendance.manage',
            'grades.manage',
            'lms.manage',
            'xp.manage',
            'notifications.manage',
        ];
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SystemPermission;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    public function index(): Response
    {
        $roles = Role::query()
            ->with(['permissions:id,name'])
            ->withCount('users')
            ->orderBy('name')
            ->get(['id', 'name']);

        $permissions = Permission::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/roles/index', [
            'roles' => $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $this->roleLabel($role->name),
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values(),
            ]),
            'permissions' => $permissions->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'label' => $this->permissionLabel($permission->name),
                'group' => str($permission->name)->before('.')->toString(),
            ]),
            'stats' => [
                'totalRoles' => $roles->count(),
                'totalPermissions' => $permissions->count(),
                'coveredPermissions' => $roles
                    ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
                    ->unique()
                    ->count(),
            ],
        ]);
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            UserRole::Admin->value => 'Admin',
            UserRole::Teacher->value => 'Guru',
            UserRole::Student->value => 'Siswa',
            UserRole::Parent->value => 'Orang tua',
            default => str($role)->headline()->toString(),
        };
    }

    private function permissionLabel(string $permission): string
    {
        return match ($permission) {
            SystemPermission::ManageUsers->value => 'Kelola pengguna',
            SystemPermission::ManageSchoolLocations->value => 'Kelola lokasi sekolah',
            SystemPermission::ManageAttendance->value => 'Kelola absensi',
            SystemPermission::ViewAttendance->value => 'Lihat absensi',
            SystemPermission::ViewOwnAttendance->value => 'Lihat absensi sendiri',
            SystemPermission::ManageGrades->value => 'Kelola nilai',
            SystemPermission::ViewGrades->value => 'Lihat nilai',
            SystemPermission::ManageLms->value => 'Kelola LMS',
            SystemPermission::ViewLms->value => 'Lihat LMS',
            SystemPermission::SubmitLmsAssignments->value => 'Kirim tugas LMS',
            SystemPermission::ManageXp->value => 'Kelola XP',
            SystemPermission::ViewXp->value => 'Lihat XP',
            SystemPermission::ViewChildren->value => 'Lihat data anak',
            SystemPermission::ManageNotifications->value => 'Kelola notifikasi',
            SystemPermission::ViewNotifications->value => 'Lihat notifikasi',
            default => str($permission)->replace('.', ' ')->headline()->toString(),
        };
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SystemPermission;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

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
            ->get(['id', 'name'])
            ->sortBy(fn (Permission $permission) => sprintf(
                '%02d-%s-%02d-%s',
                $this->permissionGroupOrder($permission->name),
                $this->permissionGroup($permission->name),
                $this->permissionActionOrder($permission->name),
                $permission->name,
            ))
            ->values();

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
                'group' => $this->permissionGroup($permission->name),
            ]),
            'protectedRoles' => $this->protectedRoles(),
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

    public function store(RoleRequest $request): RedirectResponse
    {
        $role = Role::create([
            'name' => $request->string('name')->lower()->replace(' ', '_')->toString(),
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($request->validated('permissions', []));
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->successToast('Role berhasil ditambahkan.');

        return to_route('admin.roles.index');
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        if (! in_array($role->name, $this->protectedRoles(), true) && $request->filled('name')) {
            $role->update([
                'name' => $request->string('name')->lower()->replace(' ', '_')->toString(),
            ]);
        }

        $role->syncPermissions($request->validated('permissions', []));
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->successToast('Permission role berhasil diperbarui.');

        return to_route('admin.roles.index');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, $this->protectedRoles(), true)) {
            $this->errorToast('Role bawaan SAPA tidak bisa dihapus.');

            return to_route('admin.roles.index');
        }

        if ($role->users()->exists()) {
            $this->errorToast('Role masih dipakai pengguna dan tidak bisa dihapus.');

            return to_route('admin.roles.index');
        }

        $role->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->successToast('Role berhasil dihapus.');

        return to_route('admin.roles.index');
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

    /**
     * @return array<int, string>
     */
    private function protectedRoles(): array
    {
        return array_map(fn (UserRole $role) => $role->value, UserRole::cases());
    }

    private function permissionLabel(string $permission): string
    {
        return match ($permission) {
            SystemPermission::ViewUsers->value => 'Lihat pengguna',
            SystemPermission::CreateUsers->value => 'Tambah pengguna',
            SystemPermission::UpdateUsers->value => 'Ubah pengguna',
            SystemPermission::DeleteUsers->value => 'Hapus pengguna',
            SystemPermission::ViewStudents->value => 'Lihat siswa & orang tua',
            SystemPermission::CreateStudents->value => 'Tambah siswa & orang tua',
            SystemPermission::UpdateStudents->value => 'Ubah siswa & orang tua',
            SystemPermission::DeleteStudents->value => 'Hapus siswa & orang tua',
            SystemPermission::ViewClasses->value => 'Lihat kelas',
            SystemPermission::CreateClasses->value => 'Tambah kelas',
            SystemPermission::UpdateClasses->value => 'Ubah kelas',
            SystemPermission::DeleteClasses->value => 'Hapus kelas',
            SystemPermission::ViewRoles->value => 'Lihat role & permission',
            SystemPermission::CreateRoles->value => 'Tambah role',
            SystemPermission::UpdateRoles->value => 'Ubah role',
            SystemPermission::DeleteRoles->value => 'Hapus role',
            SystemPermission::ViewSchoolLocations->value => 'Lihat lokasi sekolah',
            SystemPermission::CreateSchoolLocations->value => 'Tambah lokasi sekolah',
            SystemPermission::UpdateSchoolLocations->value => 'Ubah lokasi sekolah',
            SystemPermission::DeleteSchoolLocations->value => 'Hapus lokasi sekolah',
            SystemPermission::ViewAttendance->value => 'Lihat absensi',
            SystemPermission::CreateAttendance->value => 'Tambah absensi',
            SystemPermission::UpdateAttendance->value => 'Ubah absensi',
            SystemPermission::DeleteAttendance->value => 'Hapus absensi',
            SystemPermission::ViewOwnAttendance->value => 'Lihat absensi sendiri',
            SystemPermission::CreateOwnAttendance->value => 'Absen sendiri',
            SystemPermission::ViewGrades->value => 'Lihat nilai',
            SystemPermission::CreateGrades->value => 'Tambah nilai',
            SystemPermission::UpdateGrades->value => 'Ubah nilai',
            SystemPermission::DeleteGrades->value => 'Hapus nilai',
            SystemPermission::ViewLms->value => 'Lihat LMS',
            SystemPermission::CreateLms->value => 'Tambah LMS',
            SystemPermission::UpdateLms->value => 'Ubah LMS',
            SystemPermission::DeleteLms->value => 'Hapus LMS',
            SystemPermission::SubmitLmsAssignments->value => 'Kirim tugas LMS',
            SystemPermission::ViewXp->value => 'Lihat XP',
            SystemPermission::CreateXp->value => 'Tambah XP',
            SystemPermission::UpdateXp->value => 'Ubah XP',
            SystemPermission::DeleteXp->value => 'Hapus XP',
            SystemPermission::ViewChildren->value => 'Lihat data anak',
            SystemPermission::ViewNotifications->value => 'Lihat notifikasi',
            SystemPermission::CreateNotifications->value => 'Tambah notifikasi',
            SystemPermission::UpdateNotifications->value => 'Ubah notifikasi',
            SystemPermission::DeleteNotifications->value => 'Hapus notifikasi',
            default => str($permission)->replace('.', ' ')->headline()->toString(),
        };
    }

    private function permissionGroup(string $permission): string
    {
        return str($permission)->before('.')->toString();
    }

    private function permissionGroupOrder(string $permission): int
    {
        return match ($this->permissionGroup($permission)) {
            'users' => 10,
            'students' => 20,
            'classes' => 30,
            'roles' => 40,
            'school_locations' => 50,
            'attendance' => 60,
            'grades' => 70,
            'lms' => 80,
            'xp' => 90,
            'children' => 100,
            'notifications' => 110,
            default => 999,
        };
    }

    private function permissionActionOrder(string $permission): int
    {
        $action = str($permission)->afterLast('.')->toString();

        return match ($action) {
            'view' => 10,
            'create' => 20,
            'update' => 30,
            'delete' => 40,
            default => 90,
        };
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(): Response
    {
        $roles = Role::query()
            ->withCount('users')
            ->orderBy('name')
            ->get(['id', 'name']);

        $users = User::query()
            ->with(['roles:id,name', 'student.schoolClass:id,name'])
            ->withCount(['createdAttendanceSessions', 'verifiedAttendanceRecords'])
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'roles' => $user->roles->pluck('name')->values(),
                'student' => $user->student ? [
                    'id' => $user->student->id,
                    'name' => $user->student->name,
                    'school_class' => $user->student->schoolClass ? [
                        'id' => $user->student->schoolClass->id,
                        'name' => $user->student->schoolClass->name,
                    ] : null,
                ] : null,
                'created_attendance_sessions_count' => $user->created_attendance_sessions_count,
                'verified_attendance_records_count' => $user->verified_attendance_records_count,
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $this->roleLabel($role->name),
                'users_count' => $role->users_count,
            ]),
            'stats' => [
                'totalUsers' => User::query()->count(),
                'verifiedUsers' => User::query()->whereNotNull('email_verified_at')->count(),
                'linkedStudents' => Student::query()->whereNotNull('user_id')->count(),
                'withoutRole' => User::query()->doesntHave('roles')->count(),
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
}

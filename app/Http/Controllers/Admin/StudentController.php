<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SystemPermission;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StudentRequest;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $classFilter = trim((string) $request->string('school_class_id'));
        $statusFilter = trim((string) $request->string('status'));
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(5, min(100, $perPage));

        $students = Student::query()
            ->with(['user:id,name,email', 'schoolClass:id,name', 'parentUsers:id,name,email'])
            ->withCount('attendanceRecords')
            ->when($search !== '', fn ($query) => $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%");
            }))
            ->when($classFilter !== '', fn ($query) => $query->where('school_class_id', $classFilter))
            ->when($statusFilter === 'active', fn ($query) => $query->where('is_active', true))
            ->when($statusFilter === 'inactive', fn ($query) => $query->where('is_active', false))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Student $student) => [
                'id' => $student->id,
                'user_id' => $student->user_id,
                'school_class_id' => $student->school_class_id,
                'nis' => $student->nis,
                'nisn' => $student->nisn,
                'name' => $student->name,
                'gender' => $student->gender,
                'birth_date' => $student->birth_date?->toDateString(),
                'phone' => $student->phone,
                'is_active' => $student->is_active,
                'created_at' => $student->created_at,
                'user' => $student->user ? [
                    'id' => $student->user->id,
                    'name' => $student->user->name,
                    'email' => $student->user->email,
                ] : null,
                'school_class' => $student->schoolClass ? [
                    'id' => $student->schoolClass->id,
                    'name' => $student->schoolClass->name,
                ] : null,
                'parents' => $student->parentUsers->map(fn (User $parent) => [
                    'id' => $parent->id,
                    'name' => $parent->name,
                    'email' => $parent->email,
                ])->values(),
                'attendance_records_count' => $student->attendance_records_count,
            ]);

        return Inertia::render('admin/students/index', [
            'students' => $students,
            'filters' => [
                'search' => $search,
                'school_class_id' => $classFilter,
                'status' => $statusFilter,
                'per_page' => $perPage,
            ],
            'schoolClasses' => SchoolClass::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'grade_level', 'academic_year']),
            'studentUsers' => User::role(UserRole::Student->value)
                ->with('student:id,user_id')
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'student_id' => $user->student?->id,
                ]),
            'parentUsers' => User::role(UserRole::Parent->value)
                ->withCount('children')
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'children_count' => $user->children_count,
                ]),
            'stats' => [
                'totalStudents' => Student::query()->count(),
                'activeStudents' => Student::query()->where('is_active', true)->count(),
                'linkedStudentAccounts' => Student::query()->whereNotNull('user_id')->count(),
                'linkedParents' => User::role(UserRole::Parent->value)->has('children')->count(),
            ],
        ]);
    }

    public function store(StudentRequest $request): RedirectResponse
    {
        $student = Student::create($this->studentData($request));

        $this->syncParents($student, $request);
        $this->successToast('Data siswa berhasil ditambahkan.');

        return to_route('admin.students.index');
    }

    public function update(StudentRequest $request, Student $student): RedirectResponse
    {
        $student->update($this->studentData($request));

        $this->syncParents($student, $request);
        $this->successToast('Data siswa berhasil diperbarui.');

        return to_route('admin.students.index');
    }

    public function destroy(Request $request, Student $student): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::DeleteStudents->value), 403);

        $student->parentUsers()->detach();
        $student->delete();

        $this->successToast('Data siswa berhasil dihapus.');

        return to_route('admin.students.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function studentData(StudentRequest $request): array
    {
        return $request->safe()->only([
            'user_id',
            'school_class_id',
            'nis',
            'nisn',
            'name',
            'gender',
            'birth_date',
            'phone',
            'is_active',
        ]);
    }

    private function syncParents(Student $student, StudentRequest $request): void
    {
        $parentIds = collect($request->validated('parent_user_ids', []))
            ->map(fn (mixed $id) => (int) $id)
            ->filter()
            ->values();

        if ($request->filled('new_parent_email')) {
            $parent = User::create([
                'name' => $request->validated('new_parent_name'),
                'email' => $request->validated('new_parent_email'),
                'password' => Hash::make($request->validated('new_parent_password') ?: 'password'),
                'email_verified_at' => now(),
            ]);

            $parent->syncRoles([UserRole::Parent->value]);
            $parentIds = $parentIds->push($parent->id);
        }

        $student->parentUsers()->sync($parentIds->unique()->values()->all());
    }
}

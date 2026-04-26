<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StudentRequest;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(): Response
    {
        $students = Student::query()
            ->with(['user:id,name,email', 'schoolClass:id,name', 'parentUsers:id,name,email'])
            ->withCount('attendanceRecords')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Student $student) => [
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
                'name' => $request->string('new_parent_name')->toString(),
                'email' => $request->string('new_parent_email')->lower()->toString(),
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]);

            $parent->assignRole(UserRole::Parent->value);
            $parentIds->push($parent->id);
        }

        User::query()
            ->whereIn('id', $parentIds)
            ->get()
            ->each(fn (User $parent) => $parent->assignRole(UserRole::Parent->value));

        $student->parentUsers()->sync($parentIds->unique()->values()->all());
    }
}

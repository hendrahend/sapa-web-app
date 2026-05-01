<?php

namespace App\Http\Controllers\Attendance;

use App\Enums\AttendanceExcuseStatus;
use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\AttendanceExcuse;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\SchoolLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass')->first();
        $canViewAll = $user?->can(SystemPermission::ViewAttendance->value) ?? false;
        $selectedDate = $this->date($request->string('date')->toString()) ?? now()->toDateString();
        $classFilter = $request->integer('school_class_id') ?: null;

        $sessions = AttendanceSession::query()
            ->with(['schoolClass:id,name', 'schoolLocation:id,name,radius_meters'])
            ->withCount('records')
            ->whereDate('attendance_date', $selectedDate)
            ->when(! $canViewAll, fn ($query) => $student?->school_class_id
                ? $query->where('school_class_id', $student->school_class_id)
                : $query->whereRaw('1 = 0'))
            ->when($canViewAll && $classFilter, fn ($query, int $schoolClassId) => $query->where('school_class_id', $schoolClassId))
            ->latest('id')
            ->get();

        $activeSession = AttendanceSession::query()
            ->with(['schoolClass:id,name', 'schoolLocation:id,name,address,latitude,longitude,radius_meters'])
            ->where('status', 'open')
            ->whereDate('attendance_date', now()->toDateString())
            ->when($student?->school_class_id, fn ($query, int $schoolClassId) => $query->where('school_class_id', $schoolClassId))
            ->latest('id')
            ->first();

        $latestRecord = $student
            ? AttendanceRecord::query()
                ->with('session:id,title,attendance_date')
                ->where('student_id', $student->id)
                ->latest('checked_in_at')
                ->latest('id')
                ->first()
            : null;

        $attendanceRecords = AttendanceRecord::query()
            ->with([
                'student:id,name,nis,school_class_id',
                'student.schoolClass:id,name',
                'session:id,title,attendance_date,school_class_id',
                'session.schoolClass:id,name',
            ])
            ->whereHas('session', fn ($query) => $query->whereDate('attendance_date', $selectedDate))
            ->when(! $canViewAll, fn ($query) => $student
                ? $query->where('student_id', $student->id)
                : $query->whereRaw('1 = 0'))
            ->when($canViewAll && $classFilter, fn ($query, int $schoolClassId) => $query->whereHas(
                'session',
                fn ($q) => $q->where('school_class_id', $schoolClassId)
            ))
            ->orderByDesc('checked_in_at')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (AttendanceRecord $record) => $this->recordPayload($record));

        $reviewRecords = AttendanceRecord::query()
            ->with([
                'student:id,name,nis,school_class_id',
                'student.schoolClass:id,name',
                'session:id,title,attendance_date,school_class_id',
                'session.schoolClass:id,name',
            ])
            ->where('verification_status', AttendanceVerificationStatus::Pending->value)
            ->when(! $canViewAll, fn ($query) => $student
                ? $query->where('student_id', $student->id)
                : $query->whereRaw('1 = 0'))
            ->when($selectedDate, fn ($query, string $date) => $query->whereHas(
                'session',
                fn ($q) => $q->whereDate('attendance_date', $date)
            ))
            ->when($classFilter, fn ($query, int $schoolClassId) => $query->whereHas(
                'session',
                fn ($q) => $q->where('school_class_id', $schoolClassId)
            ))
            ->latest('checked_in_at')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (AttendanceRecord $record) => [
                ...$this->recordPayload($record),
                'review_reason' => $this->reviewReason($record),
            ]);

        $excusesQuery = AttendanceExcuse::query()
            ->with(['student:id,name,nis,school_class_id', 'student.schoolClass:id,name', 'reviewer:id,name'])
            ->where(function ($query) use ($selectedDate) {
                $query
                    ->whereDate('start_date', '<=', $selectedDate)
                    ->whereDate('end_date', '>=', $selectedDate);
            })
            ->when(! $canViewAll, fn ($query) => $student
                ? $query->where('student_id', $student->id)
                : $query->whereRaw('1 = 0'))
            ->when($canViewAll && $classFilter, fn ($query, int $schoolClassId) => $query->whereHas(
                'student',
                fn ($q) => $q->where('school_class_id', $schoolClassId)
            ));

        $excuses = (clone $excusesQuery)
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn (AttendanceExcuse $excuse) => $this->excusePayload($excuse));

        return Inertia::render('attendance/index', [
            'schoolClasses' => SchoolClass::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'grade_level', 'academic_year']),
            'schoolLocations' => SchoolLocation::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'address', 'radius_meters']),
            'sessions' => $sessions,
            'activeSession' => $activeSession,
            'latestRecord' => $latestRecord,
            'attendanceRecords' => $attendanceRecords,
            'todayRecords' => $attendanceRecords,
            'reviewRecords' => $reviewRecords,
            'excuses' => $excuses,
            'student' => $student,
            'filters' => [
                'date' => $selectedDate,
                'school_class_id' => $classFilter ? (string) $classFilter : 'all',
            ],
            'stats' => [
                'presentToday' => AttendanceRecord::query()
                    ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
                    ->whereHas('session', fn ($query) => $query->whereDate('attendance_date', $selectedDate))
                    ->when(! $canViewAll, fn ($query) => $student
                        ? $query->where('student_id', $student->id)
                        : $query->whereRaw('1 = 0'))
                    ->when($canViewAll && $classFilter, fn ($query, int $schoolClassId) => $query->whereHas(
                        'session',
                        fn ($q) => $q->where('school_class_id', $schoolClassId)
                    ))
                    ->count(),
                'lateToday' => AttendanceRecord::query()
                    ->where('status', AttendanceStatus::Late->value)
                    ->whereHas('session', fn ($query) => $query->whereDate('attendance_date', $selectedDate))
                    ->when(! $canViewAll, fn ($query) => $student
                        ? $query->where('student_id', $student->id)
                        : $query->whereRaw('1 = 0'))
                    ->when($canViewAll && $classFilter, fn ($query, int $schoolClassId) => $query->whereHas(
                        'session',
                        fn ($q) => $q->where('school_class_id', $schoolClassId)
                    ))
                    ->count(),
                'needsReview' => AttendanceRecord::query()
                    ->where('verification_status', AttendanceVerificationStatus::Pending->value)
                    ->whereHas('session', fn ($query) => $query->whereDate('attendance_date', $selectedDate))
                    ->when(! $canViewAll, fn ($query) => $student
                        ? $query->where('student_id', $student->id)
                        : $query->whereRaw('1 = 0'))
                    ->when($canViewAll && $classFilter, fn ($query, int $schoolClassId) => $query->whereHas(
                        'session',
                        fn ($q) => $q->where('school_class_id', $schoolClassId)
                    ))
                    ->count()
                    + (clone $excusesQuery)->where('status', AttendanceExcuseStatus::Pending->value)->count(),
            ],
        ]);
    }

    public function verifyRecord(Request $request, AttendanceRecord $record): RedirectResponse
    {
        abort_unless($request->user()?->can(SystemPermission::UpdateAttendance->value), 403);

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in([
                AttendanceVerificationStatus::Approved->value,
                AttendanceVerificationStatus::Rejected->value,
            ])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $record->update([
            'verification_status' => $validated['verification_status'],
            'verified_by_id' => $request->user()?->id,
            'verified_at' => now(),
            'notes' => $validated['notes'] ?? $record->notes,
        ]);

        $this->successToast(
            $validated['verification_status'] === AttendanceVerificationStatus::Approved->value
                ? 'Absensi sudah diverifikasi.'
                : 'Absensi ditolak.',
        );

        return back();
    }

    private function date(string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function recordPayload(AttendanceRecord $record): array
    {
        return [
            'id' => $record->id,
            'status' => $record->status->value,
            'checked_in_at' => $record->checked_in_at?->toISOString(),
            'distance_from_school_meters' => $record->distance_from_school_meters,
            'is_within_radius' => $record->is_within_radius,
            'verification_status' => $record->verification_status->value,
            'student' => $record->student ? [
                'id' => $record->student->id,
                'name' => $record->student->name,
                'nis' => $record->student->nis,
                'school_class' => $record->student->schoolClass ? [
                    'id' => $record->student->schoolClass->id,
                    'name' => $record->student->schoolClass->name,
                ] : null,
            ] : null,
            'session' => $record->session ? [
                'id' => $record->session->id,
                'title' => $record->session->title,
                'attendance_date' => $record->session->attendance_date?->toDateString(),
                'school_class' => $record->session->schoolClass ? [
                    'id' => $record->session->schoolClass->id,
                    'name' => $record->session->schoolClass->name,
                ] : null,
            ] : null,
        ];
    }

    private function excusePayload(AttendanceExcuse $excuse): array
    {
        return [
            'id' => $excuse->id,
            'type' => $excuse->type->value,
            'status' => $excuse->status->value,
            'start_date' => $excuse->start_date->toDateString(),
            'end_date' => $excuse->end_date->toDateString(),
            'reason' => $excuse->reason,
            'attachment_url' => $excuse->attachment_path ? asset('storage/'.$excuse->attachment_path) : null,
            'admin_notes' => $excuse->admin_notes,
            'reviewer' => $excuse->reviewer ? [
                'id' => $excuse->reviewer->id,
                'name' => $excuse->reviewer->name,
            ] : null,
            'student' => $excuse->student ? [
                'id' => $excuse->student->id,
                'name' => $excuse->student->name,
                'nis' => $excuse->student->nis,
                'school_class' => $excuse->student->schoolClass ? [
                    'id' => $excuse->student->schoolClass->id,
                    'name' => $excuse->student->schoolClass->name,
                ] : null,
            ] : null,
            'created_at' => optional($excuse->created_at)->toIso8601String(),
        ];
    }

    private function reviewReason(AttendanceRecord $record): string
    {
        if ($record->is_within_radius === false) {
            return 'Lokasi check-in berada di luar radius sekolah.';
        }

        if ($record->distance_from_school_meters === null) {
            return 'Jarak lokasi belum terbaca lengkap.';
        }

        return 'Absensi menunggu pengecekan guru/admin.';
    }
}

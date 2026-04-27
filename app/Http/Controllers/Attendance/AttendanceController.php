<?php

namespace App\Http\Controllers\Attendance;

use App\Enums\AttendanceStatus;
use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\SchoolLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass')->first();
        $canViewAll = $user?->can(SystemPermission::ViewAttendance->value) ?? false;

        $sessions = AttendanceSession::query()
            ->with(['schoolClass:id,name', 'schoolLocation:id,name,radius_meters'])
            ->withCount('records')
            ->when(! $canViewAll, fn ($query) => $student?->school_class_id
                ? $query->where('school_class_id', $student->school_class_id)
                : $query->whereRaw('1 = 0'))
            ->latest('attendance_date')
            ->latest('id')
            ->limit(10)
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

        $todayRecords = AttendanceRecord::query()
            ->with([
                'student:id,name,nis,school_class_id',
                'student.schoolClass:id,name',
                'session:id,title,attendance_date,school_class_id',
                'session.schoolClass:id,name',
            ])
            ->whereDate('checked_in_at', now()->toDateString())
            ->when(! $canViewAll, fn ($query) => $student
                ? $query->where('student_id', $student->id)
                : $query->whereRaw('1 = 0'))
            ->latest('checked_in_at')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (AttendanceRecord $record) => [
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
            ]);

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
            'todayRecords' => $todayRecords,
            'student' => $student,
            'stats' => [
                'presentToday' => AttendanceRecord::query()
                    ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
                    ->whereDate('checked_in_at', now()->toDateString())
                    ->when(! $canViewAll, fn ($query) => $student
                        ? $query->where('student_id', $student->id)
                        : $query->whereRaw('1 = 0'))
                    ->count(),
                'lateToday' => AttendanceRecord::query()
                    ->where('status', AttendanceStatus::Late->value)
                    ->whereDate('checked_in_at', now()->toDateString())
                    ->when(! $canViewAll, fn ($query) => $student
                        ? $query->where('student_id', $student->id)
                        : $query->whereRaw('1 = 0'))
                    ->count(),
                'needsReview' => AttendanceRecord::query()
                    ->where('verification_status', 'pending')
                    ->when(! $canViewAll, fn ($query) => $student
                        ? $query->where('student_id', $student->id)
                        : $query->whereRaw('1 = 0'))
                    ->count(),
            ],
        ]);
    }
}

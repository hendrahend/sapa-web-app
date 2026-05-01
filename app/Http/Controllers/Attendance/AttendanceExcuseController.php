<?php

namespace App\Http\Controllers\Attendance;

use App\Enums\AttendanceExcuseStatus;
use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use App\Enums\SystemPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\AttendanceExcuseDecisionRequest;
use App\Http\Requests\Attendance\AttendanceExcuseRequest;
use App\Models\AttendanceExcuse;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceExcuseController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManage = $user?->can(SystemPermission::CreateAttendance->value) ?? false;

        $statusFilter = trim((string) $request->string('status'));
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(5, min(50, $perPage));

        $query = AttendanceExcuse::query()
            ->with(['student:id,name,nis,school_class_id', 'student.schoolClass:id,name', 'reviewer:id,name'])
            ->when($statusFilter !== '', fn ($q) => $q->where('status', $statusFilter))
            ->latest('start_date')
            ->latest('id');

        if (! $canManage) {
            $student = $user?->student;
            $query->when($student, fn ($q) => $q->where('student_id', $student->id), fn ($q) => $q->whereRaw('1 = 0'));
        }

        $excuses = $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (AttendanceExcuse $e) => [
                'id' => $e->id,
                'type' => $e->type->value,
                'status' => $e->status->value,
                'start_date' => $e->start_date->toDateString(),
                'end_date' => $e->end_date->toDateString(),
                'reason' => $e->reason,
                'attachment_url' => $e->attachment_path ? asset('storage/'.$e->attachment_path) : null,
                'admin_notes' => $e->admin_notes,
                'reviewed_at' => optional($e->reviewed_at)->toIso8601String(),
                'reviewer' => $e->reviewer ? [
                    'id' => $e->reviewer->id,
                    'name' => $e->reviewer->name,
                ] : null,
                'student' => $e->student ? [
                    'id' => $e->student->id,
                    'name' => $e->student->name,
                    'nis' => $e->student->nis,
                    'school_class' => $e->student->schoolClass ? [
                        'id' => $e->student->schoolClass->id,
                        'name' => $e->student->schoolClass->name,
                    ] : null,
                ] : null,
                'created_at' => optional($e->created_at)->toIso8601String(),
            ]);

        return Inertia::render('attendance/excuses', [
            'excuses' => $excuses,
            'filters' => [
                'status' => $statusFilter,
                'per_page' => $perPage,
            ],
            'canManage' => $canManage,
            'stats' => [
                'pending' => AttendanceExcuse::query()->where('status', 'pending')->count(),
                'approved' => AttendanceExcuse::query()->where('status', 'approved')->count(),
                'rejected' => AttendanceExcuse::query()->where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function store(AttendanceExcuseRequest $request): RedirectResponse
    {
        $student = $request->user()?->student;

        if (! $student) {
            $this->errorToast('Akun ini belum terhubung dengan data siswa.');

            return back()->withErrors([
                'student' => 'Akun ini belum terhubung dengan data siswa.',
            ]);
        }

        $validated = $request->validated();
        $attachmentPath = $request->file('attachment')?->store('attendance-excuses', 'public');

        AttendanceExcuse::create([
            'student_id' => $student->id,
            'type' => $validated['type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
            'attachment_path' => $attachmentPath,
            'status' => AttendanceExcuseStatus::Pending->value,
        ]);

        $this->successToast('Pengajuan izin/sakit terkirim. Menunggu persetujuan guru.');

        return to_route('attendance.index');
    }

    public function decide(AttendanceExcuseDecisionRequest $request, AttendanceExcuse $excuse): RedirectResponse
    {
        if ($excuse->status !== AttendanceExcuseStatus::Pending) {
            $this->errorToast('Pengajuan ini sudah diputuskan sebelumnya.');

            return back();
        }

        $validated = $request->validated();
        $reviewer = $request->user();

        DB::transaction(function () use ($excuse, $validated, $reviewer) {
            $excuse->update([
                'status' => $validated['status'],
                'admin_notes' => $validated['admin_notes'] ?? null,
                'reviewed_by_id' => $reviewer?->id,
                'reviewed_at' => now(),
            ]);

            if ($validated['status'] !== AttendanceExcuseStatus::Approved->value) {
                return;
            }

            $sessions = AttendanceSession::query()
                ->where('school_class_id', $excuse->student->school_class_id)
                ->whereBetween('attendance_date', [$excuse->start_date, $excuse->end_date])
                ->get();

            foreach ($sessions as $session) {
                AttendanceRecord::updateOrCreate([
                    'attendance_session_id' => $session->id,
                    'student_id' => $excuse->student_id,
                ], [
                    'status' => $excuse->type->value,
                    'verification_status' => AttendanceVerificationStatus::Approved->value,
                    'verified_by_id' => $reviewer?->id,
                    'verified_at' => now(),
                    'notes' => sprintf(
                        '%s: %s',
                        $excuse->type === AttendanceStatus::Sick ? 'Sakit' : 'Izin',
                        $excuse->reason,
                    ),
                ]);
            }
        });

        $this->successToast(
            $validated['status'] === AttendanceExcuseStatus::Approved->value
                ? 'Pengajuan disetujui dan kehadiran tercatat otomatis.'
                : 'Pengajuan ditolak. Siswa akan dapat notifikasi.',
        );

        return back();
    }
}

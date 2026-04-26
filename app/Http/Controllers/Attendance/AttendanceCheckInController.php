<?php

namespace App\Http\Controllers\Attendance;

use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\AttendanceCheckInRequest;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;

class AttendanceCheckInController extends Controller
{
    public function store(AttendanceCheckInRequest $request): RedirectResponse
    {
        $student = $request->user()?->student;

        if (! $student) {
            $this->errorToast('Akun ini belum terhubung dengan data siswa.');

            return back()->withErrors([
                'student' => 'Akun ini belum terhubung dengan data siswa.',
            ]);
        }

        $session = AttendanceSession::query()
            ->with('schoolLocation')
            ->where('status', 'open')
            ->findOrFail($request->integer('attendance_session_id'));

        if ($session->school_class_id !== $student->school_class_id) {
            $this->errorToast('Sesi absensi tidak sesuai dengan kelas siswa.');

            return back()->withErrors([
                'attendance_session_id' => 'Sesi absensi tidak sesuai dengan kelas siswa.',
            ]);
        }

        $validated = $request->validated();
        $schoolLocation = $session->schoolLocation;
        $distance = $schoolLocation->distanceTo($validated['latitude'], $validated['longitude']);
        $isWithinRadius = $distance <= $schoolLocation->radius_meters;
        $checkedInAt = now();
        $lateAfter = $session->late_after
            ? Carbon::parse($session->attendance_date->toDateString().' '.$session->late_after)
            : null;

        $selfiePath = $request->file('selfie')->store('attendance-selfies', 'public');

        AttendanceRecord::updateOrCreate([
            'attendance_session_id' => $session->id,
            'student_id' => $student->id,
        ], [
            'status' => $lateAfter && $checkedInAt->greaterThan($lateAfter)
                ? AttendanceStatus::Late->value
                : AttendanceStatus::Present->value,
            'checked_in_at' => $checkedInAt,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'location_accuracy_meters' => $validated['location_accuracy_meters'],
            'distance_from_school_meters' => $distance,
            'is_within_radius' => $isWithinRadius,
            'selfie_path' => $selfiePath,
            'verification_status' => $isWithinRadius
                ? AttendanceVerificationStatus::Approved->value
                : AttendanceVerificationStatus::Pending->value,
        ]);

        $this->successToast(
            $isWithinRadius
                ? 'Absensi berhasil dikirim dan disetujui otomatis.'
                : 'Absensi berhasil dikirim dan menunggu verifikasi lokasi.'
        );

        return to_route('attendance.index');
    }
}

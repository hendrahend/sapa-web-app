<?php

namespace App\Http\Controllers\Attendance;

use App\Enums\AttendanceSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\AttendanceSessionRequest;
use App\Models\AttendanceSession;
use Illuminate\Http\RedirectResponse;

class AttendanceSessionController extends Controller
{
    public function store(AttendanceSessionRequest $request): RedirectResponse
    {
        AttendanceSession::create([
            ...$request->validated(),
            'created_by_id' => $request->user()?->id,
            'status' => AttendanceSessionStatus::Open->value,
        ]);

        $this->successToast('Sesi absensi berhasil dibuka.');

        return to_route('attendance.index');
    }
}

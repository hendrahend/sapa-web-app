<?php

namespace App\Http\Controllers\Exports;

use App\Enums\AttendanceStatus;
use App\Enums\AttendanceVerificationStatus;
use App\Exports\AttendanceExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttendanceExportController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'school_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', Rule::in(array_column(AttendanceStatus::cases(), 'value'))],
            'verification_status' => ['nullable', Rule::in(array_column(AttendanceVerificationStatus::cases(), 'value'))],
        ]);

        $schoolClassId = (int) ($validated['school_class_id'] ?? 0) ?: null;
        $startDate = $this->date((string) ($validated['start_date'] ?? ''));
        $endDate = $this->date((string) ($validated['end_date'] ?? ''));
        $status = $validated['status'] ?? null;
        $verificationStatus = $validated['verification_status'] ?? null;

        $filename = 'rekap-kehadiran-'.now()->format('Ymd-His').'.xlsx';

        return Excel::download(
            new AttendanceExport($schoolClassId, $startDate, $endDate, $status, $verificationStatus),
            $filename,
        );
    }

    private function date(string $value): ?Carbon
    {
        if ($value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }
}

<?php

namespace App\Http\Controllers\Exports;

use App\Exports\AttendanceExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttendanceExportController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $schoolClassId = $request->integer('school_class_id') ?: null;
        $startDate = $this->date($request->string('start_date')->toString());
        $endDate = $this->date($request->string('end_date')->toString());

        $filename = 'rekap-kehadiran-'.now()->format('Ymd-His').'.xlsx';

        return Excel::download(
            new AttendanceExport($schoolClassId, $startDate, $endDate),
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

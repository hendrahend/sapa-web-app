<?php

namespace App\Http\Controllers\Exports;

use App\Exports\GradesExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GradeExportController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'school_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'assessment_id' => ['nullable', 'integer', 'exists:grade_assessments,id'],
            'type' => ['nullable', Rule::in(['tugas', 'kuis', 'praktik', 'uts', 'uas'])],
            'status' => ['nullable', Rule::in(['tuntas', 'remedial'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $schoolClassId = (int) ($validated['school_class_id'] ?? 0) ?: null;
        $subjectId = (int) ($validated['subject_id'] ?? 0) ?: null;
        $assessmentId = (int) ($validated['assessment_id'] ?? 0) ?: null;
        $type = $validated['type'] ?? null;
        $status = $validated['status'] ?? null;
        $startDate = $this->date((string) ($validated['start_date'] ?? ''));
        $endDate = $this->date((string) ($validated['end_date'] ?? ''));

        $filename = 'rekap-nilai-'.now()->format('Ymd-His').'.xlsx';

        return Excel::download(
            new GradesExport($schoolClassId, $subjectId, $assessmentId, $type, $status, $startDate, $endDate),
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

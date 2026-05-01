<?php

namespace App\Http\Controllers\Exports;

use App\Exports\GradesExport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GradeExportController extends Controller
{
    public function __invoke(Request $request): BinaryFileResponse
    {
        $schoolClassId = $request->integer('school_class_id') ?: null;
        $subjectId = $request->integer('subject_id') ?: null;
        $assessmentId = $request->integer('assessment_id') ?: null;

        $filename = 'rekap-nilai-'.now()->format('Ymd-His').'.xlsx';

        return Excel::download(
            new GradesExport($schoolClassId, $subjectId, $assessmentId),
            $filename,
        );
    }
}

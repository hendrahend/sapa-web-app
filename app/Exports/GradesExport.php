<?php

namespace App\Exports;

use App\Models\GradeScore;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GradesExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?int $schoolClassId = null,
        private readonly ?int $subjectId = null,
        private readonly ?int $assessmentId = null,
    ) {}

    public function collection()
    {
        return GradeScore::query()
            ->with([
                'student:id,name,nis,school_class_id',
                'student.schoolClass:id,name',
                'assessment:id,title,type,subject_id,school_class_id,max_score,assessment_date',
                'assessment.subject:id,name,code',
            ])
            ->when($this->assessmentId, fn ($query, $id) => $query->where('grade_assessment_id', $id))
            ->when($this->schoolClassId, fn ($query, $id) => $query->whereHas(
                'assessment',
                fn ($q) => $q->where('school_class_id', $id)
            ))
            ->when($this->subjectId, fn ($query, $id) => $query->whereHas(
                'assessment',
                fn ($q) => $q->where('subject_id', $id)
            ))
            ->orderByDesc('graded_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Tanggal Dinilai',
            'NIS',
            'Nama Siswa',
            'Kelas',
            'Mata Pelajaran',
            'Penilaian',
            'Tipe',
            'Skor',
            'Skor Maksimal',
            'Persentase',
            'Status',
            'Feedback',
        ];
    }

    public function map($row): array
    {
        $score = (float) $row->score;
        $maxScore = (float) ($row->assessment?->max_score ?? 100);
        $percentage = $maxScore > 0 ? round(($score / $maxScore) * 100, 1) : 0;

        return [
            optional($row->graded_at)->format('Y-m-d'),
            $row->student?->nis ?? '-',
            $row->student?->name ?? '-',
            $row->student?->schoolClass?->name ?? '-',
            $row->assessment?->subject?->name ?? '-',
            $row->assessment?->title ?? '-',
            $row->assessment?->type?->value ?? '-',
            $score,
            $maxScore,
            $percentage.'%',
            $score >= 75 ? 'Tuntas' : 'Remedial',
            $row->feedback ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => 'solid',
                    'startColor' => ['rgb' => '0F766E'],
                ],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }

    public function title(): string
    {
        return 'Rekap Nilai';
    }
}

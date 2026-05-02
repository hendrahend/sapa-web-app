<?php

namespace App\Exports;

use App\Models\GradeScore;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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
        private readonly ?string $type = null,
        private readonly ?string $status = null,
        private readonly ?Carbon $startDate = null,
        private readonly ?Carbon $endDate = null,
    ) {}

    public function collection(): Collection
    {
        return GradeScore::query()
            ->with([
                'student:id,name,nis,nisn,school_class_id',
                'student.schoolClass:id,name',
                'assessment:id,title,type,subject_id,school_class_id,teacher_id,max_score,weight,assessment_date',
                'assessment.subject:id,name,code',
                'assessment.teacher:id,name',
                'grader:id,name',
            ])
            ->when($this->assessmentId, fn ($query, $id) => $query->where('grade_assessment_id', $id))
            ->when($this->startDate, fn ($query, $start) => $query->whereDate('graded_at', '>=', $start))
            ->when($this->endDate, fn ($query, $end) => $query->whereDate('graded_at', '<=', $end))
            ->when($this->schoolClassId, fn ($query, $id) => $query->whereHas(
                'assessment',
                fn ($q) => $q->where('school_class_id', $id)
            ))
            ->when($this->subjectId, fn ($query, $id) => $query->whereHas(
                'assessment',
                fn ($q) => $q->where('subject_id', $id)
            ))
            ->when($this->type, fn ($query, $type) => $query->whereHas(
                'assessment',
                fn ($q) => $q->where('type', $type)
            ))
            ->orderByDesc('graded_at')
            ->get()
            ->when($this->status, fn (Collection $rows) => $rows
                ->filter(fn (GradeScore $score) => $this->statusFor($score) === $this->status)
                ->values());
    }

    public function headings(): array
    {
        return [
            'Tanggal Dinilai',
            'Tanggal Penilaian',
            'NIS',
            'NISN',
            'Nama Siswa',
            'Kelas',
            'Mata Pelajaran',
            'Penilaian',
            'Tipe',
            'Skor',
            'Skor Maksimal',
            'Persentase',
            'Status',
            'Bobot',
            'Guru Penilai',
            'Diinput Oleh',
            'Feedback',
        ];
    }

    public function map($row): array
    {
        $percentage = $this->percentage($row);

        return [
            optional($row->graded_at)->format('Y-m-d'),
            optional($row->assessment?->assessment_date)->format('Y-m-d'),
            $row->student?->nis ?? '-',
            $row->student?->nisn ?? '-',
            $row->student?->name ?? '-',
            $row->student?->schoolClass?->name ?? '-',
            $row->assessment?->subject?->name ?? '-',
            $row->assessment?->title ?? '-',
            $this->typeLabel((string) $row->assessment?->type),
            (float) $row->score,
            (float) ($row->assessment?->max_score ?? 100),
            $percentage.'%',
            $this->statusLabel($this->statusFor($row)),
            ($row->assessment?->weight ?? 0).'%',
            $row->assessment?->teacher?->name ?? '-',
            $row->grader?->name ?? '-',
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

    private function percentage(GradeScore $score): float
    {
        $value = (float) $score->score;
        $maxScore = (float) ($score->assessment?->max_score ?? 100);

        return $maxScore > 0 ? round(($value / $maxScore) * 100, 1) : 0;
    }

    private function statusFor(GradeScore $score): string
    {
        return $this->percentage($score) >= 75 ? 'tuntas' : 'remedial';
    }

    private function statusLabel(string $status): string
    {
        return $status === 'tuntas' ? 'Tuntas' : 'Remedial';
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'tugas' => 'Tugas',
            'kuis' => 'Kuis',
            'praktik' => 'Praktik',
            'uts' => 'UTS',
            'uas' => 'UAS',
            default => $type !== '' ? str($type)->headline()->toString() : '-',
        };
    }
}

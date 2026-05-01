<?php

namespace App\Exports;

use App\Models\AttendanceRecord;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?int $schoolClassId = null,
        private readonly ?Carbon $startDate = null,
        private readonly ?Carbon $endDate = null,
        private readonly ?string $status = null,
        private readonly ?string $verificationStatus = null,
    ) {}

    public function collection()
    {
        return AttendanceRecord::query()
            ->with([
                'student:id,name,nis,school_class_id',
                'student.schoolClass:id,name',
                'session:id,title,attendance_date,school_class_id,school_location_id',
                'session.schoolLocation:id,name',
            ])
            ->when($this->schoolClassId, fn ($query, $id) => $query->whereHas(
                'session',
                fn ($q) => $q->where('school_class_id', $id)
            ))
            ->when($this->startDate, fn ($query, $start) => $query->whereHas(
                'session',
                fn ($q) => $q->whereDate('attendance_date', '>=', $start)
            ))
            ->when($this->endDate, fn ($query, $end) => $query->whereHas(
                'session',
                fn ($q) => $q->whereDate('attendance_date', '<=', $end)
            ))
            ->when($this->status, fn ($query, $status) => $query->where('status', $status))
            ->when($this->verificationStatus, fn ($query, $status) => $query->where('verification_status', $status))
            ->orderByDesc('id')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Tanggal',
            'Waktu Check-in',
            'NIS',
            'Nama Siswa',
            'Kelas',
            'Sesi',
            'Lokasi',
            'Status',
            'Verifikasi',
            'Dalam Radius',
            'Jarak (m)',
        ];
    }

    public function map($row): array
    {
        return [
            optional($row->session?->attendance_date)->format('Y-m-d')
                ?? optional($row->checked_in_at)->format('Y-m-d'),
            optional($row->checked_in_at)->format('H:i'),
            $row->student?->nis ?? '-',
            $row->student?->name ?? '-',
            $row->student?->schoolClass?->name ?? '-',
            $row->session?->title ?? '-',
            $row->session?->schoolLocation?->name ?? '-',
            $row->status?->value ?? '-',
            $row->verification_status?->value ?? '-',
            $row->is_within_radius === null
                ? '-'
                : ($row->is_within_radius ? 'Ya' : 'Tidak'),
            $row->distance_from_school_meters !== null
                ? round((float) $row->distance_from_school_meters, 1)
                : '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => 'solid',
                    'startColor' => ['rgb' => '0E7490'],
                ],
                'alignment' => ['horizontal' => 'center'],
            ],
        ];
    }

    public function title(): string
    {
        return 'Rekap Kehadiran';
    }
}

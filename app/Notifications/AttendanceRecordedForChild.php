<?php

namespace App\Notifications;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AttendanceRecordedForChild extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public AttendanceRecord $record) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (config('sapa.notifications.mail_enabled') && filled($notifiable->email ?? null)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $record = $this->record->loadMissing(['student', 'session.schoolLocation']);
        $studentName = $record->student?->name ?? 'Siswa';
        $statusLabel = $this->statusLabel($record->status);
        $location = $record->session?->schoolLocation?->name ?? 'sekolah';
        $time = optional($record->checked_in_at)->format('H:i') ?? '-';

        return (new MailMessage)
            ->subject("[SAPA] Kabar absensi {$studentName}")
            ->greeting('Halo Bapak/Ibu,')
            ->line("Anak Anda **{$studentName}** baru saja tercatat **{$statusLabel}** pada pukul {$time} di {$location}.")
            ->line($this->extra($record))
            ->line('Anda bisa membuka inbox SAPA untuk melihat detail.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $record = $this->record->loadMissing(['student', 'session.schoolLocation']);

        return [
            'kind' => 'attendance.recorded',
            'student_id' => $record->student_id,
            'student_name' => $record->student?->name,
            'attendance_record_id' => $record->id,
            'status' => $record->status?->value,
            'status_label' => $this->statusLabel($record->status),
            'school_name' => $record->session?->schoolLocation?->name,
            'is_within_radius' => (bool) $record->is_within_radius,
            'distance_meters' => $record->distance_from_school_meters,
            'checked_in_at' => optional($record->checked_in_at)->toIso8601String(),
        ];
    }

    private function statusLabel(?AttendanceStatus $status): string
    {
        return match ($status) {
            AttendanceStatus::Present => 'hadir tepat waktu',
            AttendanceStatus::Late => 'terlambat',
            AttendanceStatus::Excused => 'izin',
            AttendanceStatus::Sick => 'sakit',
            AttendanceStatus::Absent => 'tidak hadir',
            default => 'absensi tercatat',
        };
    }

    private function extra(AttendanceRecord $record): string
    {
        if ($record->is_within_radius === false) {
            return 'Catatan: anak Anda check-in di luar radius sekolah, sehingga statusnya menunggu verifikasi guru.';
        }

        return 'Anda akan mendapat kabar lagi jika ada update.';
    }
}

<?php

namespace App\Notifications;

use App\Models\GradeScore;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GradeReleasedForChild extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public GradeScore $score) {}

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
        $score = $this->score->loadMissing(['student', 'assessment.subject']);
        $studentName = $score->student?->name ?? 'Siswa';
        $subject = $score->assessment?->subject?->name ?? 'mata pelajaran';
        $title = $score->assessment?->title ?? 'penilaian';
        $value = (string) $score->score;

        return (new MailMessage)
            ->subject("[SAPA] Nilai baru untuk {$studentName}")
            ->greeting('Halo Bapak/Ibu,')
            ->line("Anak Anda **{$studentName}** baru saja menerima nilai untuk **{$title}** ({$subject}).")
            ->line("Nilai: **{$value}**.")
            ->line($score->feedback ? "Feedback guru: \"{$score->feedback}\"" : 'Buka SAPA untuk melihat rekap lengkap.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $score = $this->score->loadMissing(['student', 'assessment.subject']);

        return [
            'kind' => 'grade.released',
            'grade_score_id' => $score->id,
            'student_id' => $score->student_id,
            'student_name' => $score->student?->name,
            'assessment_title' => $score->assessment?->title,
            'subject_name' => $score->assessment?->subject?->name,
            'score' => (float) $score->score,
            'max_score' => $score->assessment?->max_score,
            'feedback' => $score->feedback,
            'graded_at' => optional($score->graded_at)->toIso8601String(),
        ];
    }
}

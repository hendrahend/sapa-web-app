<?php

namespace App\Notifications;

use App\Models\LmsSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LmsSubmissionGradedForChild extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public LmsSubmission $submission) {}

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
        $submission = $this->submission->loadMissing(['student', 'assignment.course.subject']);
        $studentName = $submission->student?->name ?? 'Siswa';
        $assignmentTitle = $submission->assignment?->title ?? 'tugas LMS';
        $courseTitle = $submission->assignment?->course?->title ?? 'LMS';
        $score = $this->score($submission);

        return (new MailMessage)
            ->subject("[SAPA] Nilai tugas LMS untuk {$studentName}")
            ->greeting('Halo Bapak/Ibu,')
            ->line("Tugas **{$assignmentTitle}** di **{$courseTitle}** milik **{$studentName}** sudah dinilai.")
            ->line("Nilai: **{$score}**.")
            ->line($submission->feedback ? "Feedback guru: \"{$submission->feedback}\"" : 'Buka SAPA untuk melihat detail tugas.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $submission = $this->submission->loadMissing(['student', 'assignment.course.subject']);

        return [
            'kind' => 'lms.submission.graded',
            'lms_submission_id' => $submission->id,
            'student_id' => $submission->student_id,
            'student_name' => $submission->student?->name,
            'assignment_title' => $submission->assignment?->title,
            'course_title' => $submission->assignment?->course?->title,
            'subject_name' => $submission->assignment?->course?->subject?->name,
            'score' => $submission->score !== null ? (float) $submission->score : null,
            'max_score' => $submission->assignment?->max_score,
            'feedback' => $submission->feedback,
            'graded_at' => optional($submission->graded_at)->toIso8601String(),
        ];
    }

    private function score(LmsSubmission $submission): string
    {
        $score = $submission->score !== null ? (string) (float) $submission->score : '-';
        $maxScore = $submission->assignment?->max_score;

        return $maxScore ? "{$score}/{$maxScore}" : $score;
    }
}

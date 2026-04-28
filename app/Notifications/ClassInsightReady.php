<?php

namespace App\Notifications;

use App\Models\ClassInsight;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ClassInsightReady extends Notification
{
    use Queueable;

    public function __construct(public ClassInsight $insight) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $insight = $this->insight->loadMissing('schoolClass:id,name');
        $className = $insight->schoolClass?->name ?? 'Kelas';
        $rate = $insight->metrics['attendance']['rate'] ?? null;
        $atRisk = count($insight->metrics['at_risk_students'] ?? []);

        return [
            'type' => 'class_insight',
            'class_insight_id' => $insight->id,
            'school_class_id' => $insight->school_class_id,
            'title' => "Insight mingguan: {$className}",
            'body' => $insight->summary
                ?? sprintf(
                    'Kehadiran %s%% • %d siswa berpotensi remedial • periode %s s.d. %s',
                    $rate !== null ? (string) $rate : '-',
                    $atRisk,
                    $insight->period_start?->format('d/m'),
                    $insight->period_end?->format('d/m'),
                ),
            'url' => '/class-insights',
            'icon' => 'sparkles',
        ];
    }
}

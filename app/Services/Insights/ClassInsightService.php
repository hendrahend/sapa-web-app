<?php

namespace App\Services\Insights;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use App\Models\ClassInsight;
use App\Models\GradeScore;
use App\Models\LmsAssignment;
use App\Models\LmsSubmission;
use App\Models\SchoolClass;
use App\Models\User;
use App\Notifications\ClassInsightReady;
use App\Services\Groq\GroqChatService;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use RuntimeException;

class ClassInsightService
{
    public function __construct(private readonly GroqChatService $groq) {}

    public function generate(
        SchoolClass $class,
        ?CarbonInterface $periodStart = null,
        ?CarbonInterface $periodEnd = null,
        ?User $triggeredBy = null,
        bool $notifyTeachers = true,
    ): ClassInsight {
        $periodEnd ??= Carbon::now()->endOfDay();
        $periodStart ??= (clone $periodEnd)->subDays(7)->startOfDay();

        $metrics = $this->collectMetrics($class, $periodStart, $periodEnd);
        $aiOutput = $this->summarizeWithAi($class, $metrics, $periodStart, $periodEnd);

        $insight = ClassInsight::query()->create([
            'school_class_id' => $class->id,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'metrics' => $metrics,
            'summary' => $aiOutput['summary'] ?? null,
            'highlights' => $aiOutput['highlights'] ?? [],
            'at_risk_students' => $aiOutput['at_risk_students'] ?? [],
            'recommendations' => $aiOutput['recommendations'] ?? [],
            'generated_at' => now(),
            'generated_by' => $triggeredBy?->id,
        ]);

        if ($notifyTeachers) {
            $this->notifyTeachers($class, $insight);
        }

        return $insight;
    }

    /**
     * @return array<string, mixed>
     */
    public function collectMetrics(
        SchoolClass $class,
        CarbonInterface $periodStart,
        CarbonInterface $periodEnd,
    ): array {
        $studentIds = $class->students()->pluck('id')->all();
        $studentCount = count($studentIds);

        // Attendance breakdown
        $attendanceRows = AttendanceRecord::query()
            ->whereIn('student_id', $studentIds)
            ->whereBetween('checked_in_at', [$periodStart, $periodEnd])
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $attendanceCounts = [
            'hadir' => (int) ($attendanceRows[AttendanceStatus::Present->value] ?? 0),
            'terlambat' => (int) ($attendanceRows[AttendanceStatus::Late->value] ?? 0),
            'izin' => (int) ($attendanceRows[AttendanceStatus::Excused->value] ?? 0),
            'sakit' => (int) ($attendanceRows[AttendanceStatus::Sick->value] ?? 0),
            'alfa' => (int) ($attendanceRows[AttendanceStatus::Absent->value] ?? 0),
        ];
        $attendanceTotal = array_sum($attendanceCounts);
        $attendancePresent = $attendanceCounts['hadir'] + $attendanceCounts['terlambat'];
        $attendanceRate = $attendanceTotal > 0
            ? round(($attendancePresent / $attendanceTotal) * 100, 1)
            : null;

        // At-risk students (avg score < 65 in period)
        $scoreAvgPerStudent = GradeScore::query()
            ->whereIn('student_id', $studentIds)
            ->whereBetween('graded_at', [$periodStart, $periodEnd])
            ->select('student_id', DB::raw('AVG(score) as avg_score'), DB::raw('COUNT(*) as total'))
            ->groupBy('student_id')
            ->get()
            ->map(fn ($row) => [
                'student_id' => (int) $row->student_id,
                'avg_score' => round((float) $row->avg_score, 1),
                'total' => (int) $row->total,
            ])
            ->keyBy('student_id');

        $atRisk = $scoreAvgPerStudent
            ->filter(fn ($row) => $row['avg_score'] < 65)
            ->values();

        $studentLookup = $class->students()->get(['id', 'name'])->keyBy('id');
        $atRiskList = $atRisk->map(fn ($row) => [
            'student_id' => $row['student_id'],
            'name' => $studentLookup->get($row['student_id'])?->name ?? 'Siswa',
            'avg_score' => $row['avg_score'],
            'total_assessments' => $row['total'],
        ])->all();

        // Pending LMS assignments (assignments due in period without all submissions)
        $assignmentIds = LmsAssignment::query()
            ->whereHas('course', fn ($q) => $q->where('school_class_id', $class->id))
            ->where('is_published', true)
            ->whereBetween('due_at', [$periodStart, $periodEnd])
            ->pluck('id')
            ->all();

        $submissionsCount = LmsSubmission::query()
            ->whereIn('lms_assignment_id', $assignmentIds)
            ->whereIn('student_id', $studentIds)
            ->select('lms_assignment_id', DB::raw('COUNT(*) as total'))
            ->groupBy('lms_assignment_id')
            ->pluck('total', 'lms_assignment_id')
            ->toArray();

        $pendingAssignments = [];
        $assignments = LmsAssignment::query()
            ->whereIn('id', $assignmentIds)
            ->with('course:id,title')
            ->get();
        foreach ($assignments as $a) {
            $submitted = (int) ($submissionsCount[$a->id] ?? 0);
            $missing = max(0, $studentCount - $submitted);
            if ($missing > 0) {
                $pendingAssignments[] = [
                    'assignment_id' => $a->id,
                    'title' => $a->title,
                    'course' => $a->course?->title,
                    'missing_count' => $missing,
                ];
            }
        }

        return [
            'period' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
            ],
            'student_count' => $studentCount,
            'attendance' => [
                'rate' => $attendanceRate,
                'counts' => $attendanceCounts,
                'total_records' => $attendanceTotal,
            ],
            'at_risk_students' => $atRiskList,
            'pending_assignments' => $pendingAssignments,
        ];
    }

    /**
     * @param  array<string, mixed>  $metrics
     * @return array<string, mixed>
     */
    private function summarizeWithAi(
        SchoolClass $class,
        array $metrics,
        CarbonInterface $periodStart,
        CarbonInterface $periodEnd,
    ): array {
        $system = <<<'SYS'
Kamu adalah asisten data untuk kepala sekolah dan wali kelas di Indonesia.
Tugasmu: ringkas data mingguan kelas menjadi insight yang actionable, ramah, dan jelas.
Gunakan bahasa Indonesia. Jangan mengarang data; gunakan hanya angka pada metrics.
Selalu balas dalam JSON valid.
SYS;

        $userPrompt = sprintf(
            "Kelas: %s (tingkat %s)\nPeriode: %s s.d. %s\n\nMetrics (JSON):\n%s\n\nBalas JSON dengan struktur:\n%s",
            $class->name,
            $class->grade_level ?? '-',
            $periodStart->translatedFormat('d M Y'),
            $periodEnd->translatedFormat('d M Y'),
            json_encode($metrics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            <<<'JSON'
{
  "summary": "ringkasan 2-3 kalimat tentang minggu ini",
  "highlights": ["poin penting 1", "poin penting 2", "poin penting 3"],
  "at_risk_students": [
    {"name": "Nama Siswa", "reason": "alasan singkat (mis. rata-rata nilai 58, alfa 3 kali)"}
  ],
  "recommendations": ["aksi konkret 1", "aksi konkret 2", "aksi konkret 3"]
}
JSON
        );

        try {
            return $this->groq->askJson($system, $userPrompt, 1800);
        } catch (RequestException) {
            return $this->fallbackSummary($metrics);
        } catch (RuntimeException) {
            return $this->fallbackSummary($metrics);
        }
    }

    /**
     * @param  array<string, mixed>  $metrics
     * @return array<string, mixed>
     */
    private function fallbackSummary(array $metrics): array
    {
        $atRiskNames = array_map(fn ($r) => $r['name'], $metrics['at_risk_students'] ?? []);
        $rate = $metrics['attendance']['rate'] ?? null;

        return [
            'summary' => 'Ringkasan otomatis: kehadiran '.($rate !== null ? $rate.'%' : 'tidak ada data')
                .', '.count($atRiskNames).' siswa berpotensi remedial, '
                .count($metrics['pending_assignments'] ?? []).' tugas masih ada yang belum mengumpul.',
            'highlights' => [],
            'at_risk_students' => array_map(fn ($r) => [
                'name' => $r['name'],
                'reason' => 'Rata-rata nilai '.$r['avg_score'].' dari '.$r['total_assessments'].' penilaian.',
            ], $metrics['at_risk_students'] ?? []),
            'recommendations' => [
                'AI summarizer sedang tidak tersedia. Coba generate ulang setelah GROQ_API_KEY aktif.',
            ],
        ];
    }

    private function notifyTeachers(SchoolClass $class, ClassInsight $insight): void
    {
        $teachers = User::query()
            ->where(function ($q) use ($class) {
                $q->where('id', $class->homeroom_teacher_id)
                    ->orWhereHas(
                        'lmsCourses',
                        fn ($sub) => $sub->where('school_class_id', $class->id),
                    )
                    ->orWhereHas(
                        'gradeAssessments',
                        fn ($sub) => $sub->where('school_class_id', $class->id),
                    );
            })
            ->get()
            ->unique('id');

        if ($teachers->isEmpty()) {
            return;
        }

        Notification::send($teachers, new ClassInsightReady($insight));
    }
}

<?php

namespace App\Services\Xp;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use App\Models\GradeScore;
use App\Models\LmsSubmission;
use App\Models\Student;
use App\Models\XpEvent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class XpService
{
    /**
     * Total XP a student has earned (from xp_events).
     */
    public function totalFor(Student $student): int
    {
        return (int) XpEvent::query()
            ->where('student_id', $student->id)
            ->sum('points');
    }

    public function levelFor(Student $student): int
    {
        return $this->levelFromXp($this->totalFor($student));
    }

    public function levelFromXp(int $xp): int
    {
        return max(1, (int) floor($xp / $this->levelThreshold()) + 1);
    }

    public function levelThreshold(): int
    {
        return (int) config('sapa.xp.level_threshold', 160);
    }

    /**
     * XP toward the next level.
     */
    public function progressFor(Student $student): array
    {
        $xp = $this->totalFor($student);
        $threshold = $this->levelThreshold();
        $level = $this->levelFromXp($xp);
        $intoLevel = $xp - ($level - 1) * $threshold;

        return [
            'xp' => $xp,
            'level' => $level,
            'into_level' => $intoLevel,
            'level_size' => $threshold,
            'percent' => $threshold > 0 ? min(100, (int) round($intoLevel / $threshold * 100)) : 0,
        ];
    }

    public function awardForAttendance(AttendanceRecord $record): ?XpEvent
    {
        $points = match ($record->status) {
            AttendanceStatus::Present => (int) config('sapa.xp.attendance_present', 20),
            AttendanceStatus::Late => (int) config('sapa.xp.attendance_late', 10),
            default => 0,
        };

        if ($points <= 0 || ! $record->student_id) {
            return null;
        }

        $reason = match ($record->status) {
            AttendanceStatus::Present => 'Hadir tepat waktu',
            AttendanceStatus::Late => 'Hadir (terlambat)',
            default => 'Absensi',
        };

        return $this->record(
            studentId: $record->student_id,
            source: 'attendance',
            sourceId: $record->id,
            points: $points,
            reason: $reason,
            awardedAt: $record->checked_in_at ?? now(),
        );
    }

    public function awardForGrade(GradeScore $score): ?XpEvent
    {
        $value = (float) $score->score;
        $excellent = (float) config('sapa.xp.grade_excellent_threshold', 90);
        $pass = (float) config('sapa.xp.grade_pass_threshold', 75);

        if ($value >= $excellent) {
            $points = (int) config('sapa.xp.grade_excellent', 50);
            $reason = 'Nilai sangat baik (≥ '.(int) $excellent.')';
        } elseif ($value >= $pass) {
            $points = (int) config('sapa.xp.grade_passed', 30);
            $reason = 'Nilai lulus KKM (≥ '.(int) $pass.')';
        } else {
            return null;
        }

        return $this->record(
            studentId: $score->student_id,
            source: 'grade',
            sourceId: $score->id,
            points: $points,
            reason: $reason,
            awardedAt: $score->graded_at ?? now(),
        );
    }

    public function awardForLmsSubmission(LmsSubmission $submission): ?XpEvent
    {
        if (! $submission->submitted_at) {
            return null;
        }

        $points = (int) config('sapa.xp.lms_submission', 25);

        return $this->record(
            studentId: $submission->student_id,
            source: 'lms',
            sourceId: $submission->id,
            points: $points,
            reason: 'Tugas LMS dikumpulkan',
            awardedAt: $submission->submitted_at,
        );
    }

    public function awardForLmsGraded(LmsSubmission $submission): ?XpEvent
    {
        if (! $submission->graded_at) {
            return null;
        }

        $points = (int) config('sapa.xp.lms_graded', 15);

        return $this->record(
            studentId: $submission->student_id,
            source: 'lms_graded',
            sourceId: (int) $submission->id,
            points: $points,
            reason: 'Tugas LMS dinilai',
            awardedAt: $submission->graded_at,
        );
    }

    /**
     * Top students by XP, optionally scoped to a class.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function leaderboard(int $limit = 10, ?int $schoolClassId = null): Collection
    {
        return XpEvent::query()
            ->select(['xp_events.student_id', DB::raw('SUM(xp_events.points) as total_xp')])
            ->join('students', 'students.id', '=', 'xp_events.student_id')
            ->when($schoolClassId, fn ($q) => $q->where('students.school_class_id', $schoolClassId))
            ->where('students.is_active', true)
            ->groupBy('xp_events.student_id')
            ->orderByDesc('total_xp')
            ->limit($limit)
            ->with(['student.schoolClass:id,name'])
            ->get()
            ->map(fn (XpEvent $row) => [
                'id' => $row->student_id,
                'name' => $row->student?->name,
                'class_name' => $row->student?->schoolClass?->name,
                'xp' => (int) $row->total_xp,
                'level' => $this->levelFromXp((int) $row->total_xp),
            ])
            ->values();
    }

    /**
     * @return Collection<int, XpEvent>
     */
    public function recentEvents(Student $student, int $limit = 20): Collection
    {
        return XpEvent::query()
            ->where('student_id', $student->id)
            ->latest('awarded_at')
            ->latest('id')
            ->limit($limit)
            ->get();
    }

    /**
     * Derived badges (not stored). A small starter set.
     *
     * @return array<int, array<string, mixed>>
     */
    public function badgesFor(Student $student): array
    {
        $events = XpEvent::query()
            ->where('student_id', $student->id)
            ->orderBy('awarded_at')
            ->get();

        $presentCount = $events->where('source', 'attendance')->count();
        $highGradeCount = $events->where('source', 'grade')
            ->where('points', '>=', (int) config('sapa.xp.grade_excellent', 50))
            ->count();
        $lmsCount = $events->where('source', 'lms')->where('points', '>=', (int) config('sapa.xp.lms_submission', 25))->count();
        $level = $this->levelFromXp((int) $events->sum('points'));

        return [
            [
                'key' => 'tepat-waktu-5',
                'title' => 'Tepat Waktu 5×',
                'description' => 'Hadir di 5 sesi absensi.',
                'achieved' => $presentCount >= 5,
                'progress' => min(100, (int) round(min($presentCount, 5) / 5 * 100)),
            ],
            [
                'key' => 'nilai-sangat-baik',
                'title' => 'Nilai Cemerlang',
                'description' => 'Mendapat nilai 90+ pada penilaian apa pun.',
                'achieved' => $highGradeCount >= 1,
                'progress' => $highGradeCount >= 1 ? 100 : 0,
            ],
            [
                'key' => 'lms-3-tugas',
                'title' => 'Pejuang LMS',
                'description' => 'Mengumpulkan 3 tugas LMS.',
                'achieved' => $lmsCount >= 3,
                'progress' => min(100, (int) round(min($lmsCount, 3) / 3 * 100)),
            ],
            [
                'key' => 'level-3',
                'title' => 'Level 3',
                'description' => 'Mencapai level 3.',
                'achieved' => $level >= 3,
                'progress' => $level >= 3 ? 100 : (int) round(($level - 1) / 2 * 100),
            ],
        ];
    }

    private function record(
        int $studentId,
        string $source,
        ?int $sourceId,
        int $points,
        string $reason,
        Carbon|string|null $awardedAt = null,
    ): XpEvent {
        return XpEvent::query()->updateOrCreate([
            'student_id' => $studentId,
            'source' => $source,
            'source_id' => $sourceId,
        ], [
            'points' => $points,
            'reason' => $reason,
            'awarded_at' => $awardedAt instanceof Carbon ? $awardedAt : Carbon::parse($awardedAt ?? now()),
        ]);
    }
}

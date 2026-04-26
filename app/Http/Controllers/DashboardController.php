<?php

namespace App\Http\Controllers;

use App\Enums\AttendanceStatus;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\LmsSubmission;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass:id,name')->first();

        return Inertia::render('dashboard', [
            'overview' => [
                'weeklyGoal' => $this->weeklyGoal($student),
                'level' => $this->level($student),
                'xp' => $this->xp($student),
                'xpToNextLevel' => 160,
            ],
            'attendance' => $this->attendance($student),
            'assessment' => $this->assessment($student),
            'leaderboard' => $this->leaderboard(),
            'progress' => $this->progress(),
            'lms' => $this->lms($student),
            'stats' => [
                'students' => Student::query()->where('is_active', true)->count(),
                'sessionsToday' => AttendanceSession::query()->whereDate('attendance_date', now()->toDateString())->count(),
                'gradeAssessments' => GradeAssessment::query()->count(),
                'activeCourses' => LmsCourse::query()->where('is_active', true)->count(),
            ],
            'student' => $student,
        ]);
    }

    private function weeklyGoal(?Student $student): int
    {
        if (! $student) {
            $total = AttendanceRecord::query()
                ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
                ->whereBetween('checked_in_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->count();

            $target = max(1, Student::query()->where('is_active', true)->count() * 5);

            return (int) min(100, round(($total / $target) * 100));
        }

        $total = AttendanceRecord::query()
            ->where('student_id', $student->id)
            ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
            ->whereBetween('checked_in_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        return (int) min(100, round(($total / 5) * 100));
    }

    private function xp(?Student $student): int
    {
        $attendanceQuery = AttendanceRecord::query();
        $scoreQuery = GradeScore::query();

        if ($student) {
            $attendanceQuery->where('student_id', $student->id);
            $scoreQuery->where('student_id', $student->id);
        }

        $presentXp = (clone $attendanceQuery)
            ->where('status', AttendanceStatus::Present->value)
            ->count() * 20;
        $lateXp = (clone $attendanceQuery)
            ->where('status', AttendanceStatus::Late->value)
            ->count() * 10;
        $scoreXp = (clone $scoreQuery)
            ->where('score', '>=', 75)
            ->count() * 30;

        return $presentXp + $lateXp + $scoreXp;
    }

    private function level(?Student $student): int
    {
        return max(1, (int) floor($this->xp($student) / 160) + 1);
    }

    /**
     * @return array<string, mixed>
     */
    private function attendance(?Student $student): array
    {
        $record = AttendanceRecord::query()
            ->with(['session.schoolLocation:id,name,address,latitude,longitude'])
            ->when($student, fn ($query) => $query->where('student_id', $student->id))
            ->latest('checked_in_at')
            ->latest('id')
            ->first();

        $activeSession = AttendanceSession::query()
            ->with(['schoolClass:id,name', 'schoolLocation:id,name,address,latitude,longitude,radius_meters'])
            ->where('status', 'open')
            ->whereDate('attendance_date', now()->toDateString())
            ->when($student?->school_class_id, fn ($query, int $classId) => $query->where('school_class_id', $classId))
            ->latest('id')
            ->first();

        return [
            'status' => $record?->status->value,
            'checkedInAt' => $record?->checked_in_at,
            'isWithinRadius' => $record?->is_within_radius,
            'distance' => $record?->distance_from_school_meters,
            'school' => $record?->session?->schoolLocation?->name ?? $activeSession?->schoolLocation?->name,
            'activeSession' => $activeSession ? [
                'id' => $activeSession->id,
                'title' => $activeSession->title,
                'className' => $activeSession->schoolClass?->name,
                'radius' => $activeSession->schoolLocation?->radius_meters,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function assessment(?Student $student): array
    {
        $score = GradeScore::query()
            ->with(['assessment.subject:id,name,code'])
            ->when($student, fn ($query) => $query->where('student_id', $student->id))
            ->latest('graded_at')
            ->latest('id')
            ->first();

        $average = GradeScore::query()
            ->when($student, fn ($query) => $query->where('student_id', $student->id))
            ->avg('score');

        return [
            'recentScore' => $score ? (float) $score->score : null,
            'average' => $average ? round((float) $average, 1) : null,
            'subject' => $score?->assessment?->subject?->name,
            'skill' => $score && $score->score >= 85 ? 'Tinggi' : ($score ? 'Berkembang' : 'Belum ada'),
            'feedback' => $score?->feedback,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function leaderboard(): array
    {
        return Student::query()
            ->where('is_active', true)
            ->with('schoolClass:id,name')
            ->withCount([
                'attendanceRecords as present_count' => fn ($query) => $query->where('status', AttendanceStatus::Present->value),
                'attendanceRecords as late_count' => fn ($query) => $query->where('status', AttendanceStatus::Late->value),
                'gradeScores as strong_scores_count' => fn ($query) => $query->where('score', '>=', 75),
            ])
            ->limit(8)
            ->get()
            ->map(fn (Student $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'className' => $student->schoolClass?->name,
                'xp' => ($student->present_count * 20) + ($student->late_count * 10) + ($student->strong_scores_count * 30),
            ])
            ->sortByDesc('xp')
            ->values()
            ->take(5)
            ->all();
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function progress(): array
    {
        return collect(range(6, 0))
            ->map(function (int $daysAgo) {
                $date = now()->subDays($daysAgo);

                return [
                    'label' => $date->translatedFormat('D'),
                    'attendance' => AttendanceRecord::query()
                        ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
                        ->whereDate('checked_in_at', $date->toDateString())
                        ->count(),
                    'scores' => GradeScore::query()
                        ->whereDate('graded_at', $date->toDateString())
                        ->count(),
                ];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function lms(?Student $student): array
    {
        $assignment = LmsAssignment::query()
            ->with(['course.subject:id,name,code', 'course.schoolClass:id,name'])
            ->whereHas('course', fn ($query) => $query
                ->when($student?->school_class_id, fn ($courseQuery, int $classId) => $courseQuery->where('school_class_id', $classId)))
            ->where('is_published', true)
            ->where(function ($query) {
                $query->whereNull('due_at')
                    ->orWhere('due_at', '>=', Carbon::now()->subDay());
            })
            ->orderByRaw('due_at is null')
            ->orderBy('due_at')
            ->first();

        return [
            'courses' => LmsCourse::query()
                ->when($student?->school_class_id, fn ($query, int $classId) => $query->where('school_class_id', $classId))
                ->where('is_active', true)
                ->count(),
            'materials' => LmsMaterial::query()
                ->whereHas('course', fn ($query) => $query
                    ->when($student?->school_class_id, fn ($courseQuery, int $classId) => $courseQuery->where('school_class_id', $classId)))
                ->count(),
            'pendingAssignments' => LmsAssignment::query()
                ->where('is_published', true)
                ->whereHas('course', fn ($query) => $query
                    ->when($student?->school_class_id, fn ($courseQuery, int $classId) => $courseQuery->where('school_class_id', $classId)))
                ->count(),
            'needsFeedback' => LmsSubmission::query()
                ->whereNotNull('submitted_at')
                ->whereNull('graded_at')
                ->count(),
            'nextAssignment' => $assignment ? [
                'title' => $assignment->title,
                'course' => $assignment->course?->title,
                'dueAt' => $assignment->due_at,
            ] : null,
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\AttendanceStatus;
use App\Enums\UserRole;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\GradeAssessment;
use App\Models\GradeScore;
use App\Models\LmsAssignment;
use App\Models\LmsCourse;
use App\Models\LmsMaterial;
use App\Models\LmsSubmission;
use App\Models\RewardRedemption;
use App\Models\Student;
use App\Models\User;
use App\Services\Xp\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly XpService $xp) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass:id,name')->first();
        $role = $this->resolveRole($user);

        $progress = $student
            ? $this->xp->progressFor($student)
            : ['xp' => 0, 'level' => 1, 'level_size' => $this->xp->levelThreshold(), 'percent' => 0];

        return Inertia::render('dashboard', [
            'role' => $role,
            'overview' => [
                'weeklyGoal' => $this->weeklyGoal($student),
                'level' => $progress['level'],
                'xp' => $progress['xp'],
                'xpToNextLevel' => (int) $progress['level_size'],
            ],
            'attendance' => $this->attendance($student),
            'assessment' => $this->assessment($student),
            'leaderboard' => $this->xp->leaderboard(5)
                ->map(fn (array $row) => [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'className' => $row['class_name'],
                    'xp' => $row['xp'],
                ])
                ->all(),
            'progress' => $this->progress(),
            'lms' => $this->lms($student),
            'stats' => [
                'students' => Student::query()->where('is_active', true)->count(),
                'sessionsToday' => AttendanceSession::query()->whereDate('attendance_date', now()->toDateString())->count(),
                'gradeAssessments' => GradeAssessment::query()->count(),
                'activeCourses' => LmsCourse::query()->where('is_active', true)->count(),
            ],
            'student' => $student,
            'staff' => in_array($role, ['admin', 'guru'], true) ? $this->staff($user, $role) : null,
            'parentSummary' => $role === 'orang_tua' ? $this->parentSummary($user) : null,
        ]);
    }

    private function resolveRole(?User $user): string
    {
        if (! $user) {
            return 'siswa';
        }

        foreach ([UserRole::Admin, UserRole::Teacher, UserRole::Parent, UserRole::Student] as $role) {
            if ($user->hasRole($role->value)) {
                return $role->value;
            }
        }

        return 'pending';
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
     * @return array<int, array<string, int|string>>
     */
    private function progress(): array
    {
        $start = now()->subDays(6)->startOfDay();
        $end = now()->endOfDay();

        $attendanceCounts = AttendanceRecord::query()
            ->selectRaw('date(checked_in_at) as bucket, count(*) as total')
            ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
            ->whereBetween('checked_in_at', [$start, $end])
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $scoreCounts = GradeScore::query()
            ->selectRaw('date(graded_at) as bucket, count(*) as total')
            ->whereBetween('graded_at', [$start, $end])
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return collect(range(6, 0))
            ->map(function (int $daysAgo) use ($attendanceCounts, $scoreCounts) {
                $date = now()->subDays($daysAgo);
                $key = $date->toDateString();

                return [
                    'label' => $date->translatedFormat('D'),
                    'attendance' => (int) ($attendanceCounts[$key] ?? 0),
                    'scores' => (int) ($scoreCounts[$key] ?? 0),
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

    /**
     * @return array<string, mixed>
     */
    private function staff(User $user, string $role): array
    {
        $today = now()->toDateString();
        $totalStudents = Student::query()->where('is_active', true)->count();

        $todayCheckedIn = AttendanceRecord::query()
            ->whereIn('status', [AttendanceStatus::Present->value, AttendanceStatus::Late->value])
            ->whereDate('checked_in_at', $today)
            ->count();

        $sessionsOpen = AttendanceSession::query()
            ->where('status', 'open')
            ->whereDate('attendance_date', $today)
            ->count();

        $pendingGrading = LmsSubmission::query()
            ->whereNotNull('submitted_at')
            ->whereNull('graded_at')
            ->count();

        $pendingRedemptions = RewardRedemption::query()
            ->where('status', 'pending')
            ->count();

        $teacherClasses = $role === 'guru'
            ? LmsCourse::query()
                ->where('teacher_id', $user->id)
                ->where('is_active', true)
                ->count()
            : null;

        return [
            'role' => $role,
            'today' => [
                'sessionsOpen' => $sessionsOpen,
                'attendanceCount' => $todayCheckedIn,
                'totalStudents' => $totalStudents,
                'attendanceRate' => $totalStudents > 0
                    ? (int) round(($todayCheckedIn / $totalStudents) * 100)
                    : 0,
            ],
            'pendingGrading' => $pendingGrading,
            'pendingRedemptions' => $pendingRedemptions,
            'teacherCourseCount' => $teacherClasses,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function parentSummary(User $user): array
    {
        $children = $user->children()
            ->with(['schoolClass:id,name'])
            ->orderBy('name')
            ->get()
            ->map(function (Student $child) {
                $todayRecord = AttendanceRecord::query()
                    ->where('student_id', $child->id)
                    ->whereDate('checked_in_at', now()->toDateString())
                    ->latest('checked_in_at')
                    ->first();

                $latestScore = GradeScore::query()
                    ->with(['assessment.subject:id,name,code'])
                    ->where('student_id', $child->id)
                    ->latest('graded_at')
                    ->first();

                return [
                    'id' => $child->id,
                    'name' => $child->name,
                    'className' => $child->schoolClass?->name,
                    'todayStatus' => $todayRecord?->status?->value,
                    'todayCheckedInAt' => optional($todayRecord?->checked_in_at)->toIso8601String(),
                    'latestScore' => $latestScore ? [
                        'value' => (float) $latestScore->score,
                        'subject' => $latestScore->assessment?->subject?->name,
                        'gradedAt' => optional($latestScore->graded_at)->toIso8601String(),
                    ] : null,
                ];
            })
            ->all();

        $unread = (int) $user->unreadNotifications()->count();

        return [
            'children' => $children,
            'unreadNotifications' => $unread,
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\XpEvent;
use App\Services\Xp\XpService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class XpController extends Controller
{
    public function index(Request $request, XpService $xp): Response
    {
        $user = $request->user();
        $student = $user?->student()->with('schoolClass:id,name')->first();

        $progress = $student
            ? $xp->progressFor($student)
            : ['xp' => 0, 'level' => 1, 'into_level' => 0, 'level_size' => $xp->levelThreshold(), 'percent' => 0];

        $events = $student
            ? $xp->recentEvents($student, 25)->map(fn (XpEvent $e) => [
                'id' => $e->id,
                'source' => $e->source,
                'points' => $e->points,
                'reason' => $e->reason,
                'awarded_at' => optional($e->awarded_at)->toIso8601String(),
            ])->values()
            : collect();

        $badges = $student ? $xp->badgesFor($student) : [];

        // Class leaderboard if the user is a student or homeroom teacher of a class.
        $classId = $student?->school_class_id ?? $user?->homeroomClasses()->value('id');

        $studentsWithXp = (int) XpEvent::query()->distinct('student_id')->count('student_id');

        return Inertia::render('xp/index', [
            'student' => $student ? [
                'id' => $student->id,
                'name' => $student->name,
                'class_name' => $student->schoolClass?->name,
            ] : null,
            'progress' => $progress,
            'events' => $events,
            'badges' => $badges,
            'leaderboard' => [
                'class' => $classId ? $xp->leaderboard(10, $classId) : collect(),
                'school' => $xp->leaderboard(10),
            ],
            'stats' => [
                'totalAwarded' => (int) XpEvent::query()->sum('points'),
                'studentsWithXp' => $studentsWithXp,
                'levelThreshold' => $xp->levelThreshold(),
            ],
        ]);
    }
}

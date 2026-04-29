<?php

namespace App\Http\Controllers;

use App\Enums\SystemPermission;
use App\Models\Reward;
use App\Models\RewardRedemption;
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
        $tab = $request->string('tab')->toString() === 'rewards' ? 'rewards' : 'overview';

        $progress = $student
            ? $xp->progressFor($student)
            : ['xp' => 0, 'level' => 1, 'into_level' => 0, 'level_size' => $xp->levelThreshold(), 'percent' => 0];
        $balance = $student ? $xp->totalFor($student) : 0;

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

        $rewards = Reward::query()
            ->where('is_active', true)
            ->orderBy('xp_cost')
            ->orderBy('id')
            ->get(['id', 'name', 'description', 'image_url', 'xp_cost', 'stock'])
            ->map(fn (Reward $reward) => [
                'id' => $reward->id,
                'name' => $reward->name,
                'description' => $reward->description,
                'image_url' => $reward->image_url,
                'xp_cost' => $reward->xp_cost,
                'stock' => $reward->stock,
                'unlimited' => $reward->isUnlimited(),
                'in_stock' => $reward->inStock(),
            ])
            ->values();

        $redemptions = $student
            ? RewardRedemption::query()
                ->with('reward:id,name,xp_cost,image_url')
                ->where('student_id', $student->id)
                ->latest('requested_at')
                ->latest('id')
                ->limit(20)
                ->get()
                ->map(fn (RewardRedemption $redemption) => [
                    'id' => $redemption->id,
                    'reward' => $redemption->reward ? [
                        'id' => $redemption->reward->id,
                        'name' => $redemption->reward->name,
                        'image_url' => $redemption->reward->image_url,
                    ] : null,
                    'xp_spent' => $redemption->xp_spent,
                    'status' => $redemption->status,
                    'notes' => $redemption->notes,
                    'admin_notes' => $redemption->admin_notes,
                    'requested_at' => optional($redemption->requested_at)->toIso8601String(),
                    'decided_at' => optional($redemption->decided_at)->toIso8601String(),
                ])
                ->values()
            : collect();

        return Inertia::render('xp/index', [
            'tab' => $tab,
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
            'balance' => $balance,
            'rewards' => $rewards,
            'redemptions' => $redemptions,
            'canRedeem' => $user?->can(SystemPermission::RedeemRewards->value) ?? false,
            'stats' => [
                'totalAwarded' => (int) XpEvent::query()->sum('points'),
                'studentsWithXp' => $studentsWithXp,
                'levelThreshold' => $xp->levelThreshold(),
            ],
        ]);
    }
}
